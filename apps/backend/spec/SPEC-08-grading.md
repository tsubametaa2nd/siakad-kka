# SPEC-08 — Grading (Penilaian + Sinkron Google Spreadsheet)

| | |
|---|---|
| **Bergantung pada** | SPEC-00, SPEC-01, SPEC-02, SPEC-04, SPEC-05 |
| **Database** | **AstraDB** (koleksi `grades`) + **Google Sheets** |
| **Estimasi** | 5 file; `sheets` paling rumit (~120 baris) |

---

## 1. Tujuan

Guru memberi nilai atas submission siswa. Nilai tersimpan di AstraDB lalu **otomatis masuk ke Google Spreadsheet kelas** — baris = siswa, kolom = tugas.

## 2. Ruang Lingkup

**Termasuk**
- Beri/ubah nilai + feedback
- Penilaian massal (banyak siswa sekaligus)
- Sinkron otomatis ke Google Sheets
- Retry manual untuk nilai yang gagal tersinkron

**Tidak termasuk**
- Bobot nilai akhir (rapor) — ide lanjutan
- Membaca balik dari spreadsheet (arah sinkron satu jalur: sistem → sheet)

## 3. Data Model (AstraDB — koleksi `grades`)

```ts
interface Grade {
  _id: string;                  // `${assignmentId}:${studentId}` — kunci deterministik
  assignmentId: string;
  classId: string;
  studentId: string;
  score: number;
  feedback: string;
  gradedBy: string;
  gradedAt: string;
  syncedToSheet: boolean;
  syncError?: string;           // pesan error terakhir bila gagal sinkron
}
```

> `_id` sengaja deterministik agar menilai ulang **menimpa**, bukan menciptakan nilai ganda.

## 4. Layout Google Sheets

Satu spreadsheet per kelas (`classes.spreadsheet_id`).

| A | B | C | D | E |
|---|---|---|---|---|
| No | **NIS** | Nama | Tugas 1 | Quiz 1 |
| 1 | 12345 | Budi | 90 | 100 |
| 2 | 12346 | Ani | 85 | 95 |

- **Kunci baris**: NIS di kolom **B**
- **Kunci kolom**: judul tugas di **baris 1**
- Menilai = menulis **satu sel** di perpotongan keduanya

## 5. Endpoint

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/api/grading` | guru | Beri nilai satu siswa |
| POST | `/api/grading/bulk` | guru | Beri nilai banyak siswa |
| GET | `/api/grading/assignment/:id` | guru | Nilai satu tugas |
| GET | `/api/grading/my` | siswa | Nilai saya |
| POST | `/api/grading/sync/:classId` | guru | Retry sinkron yang gagal |

```jsonc
// POST /grading
{ "assignmentId": "uuid", "studentId": "uuid", "score": 90, "feedback": "Bagus" }
```

## 6. Aturan Bisnis

- **BR-08-1** — `score` wajib dalam rentang `0..maxScore` **milik tugas itu** (bukan hardcode 100) → di luar itu, `400`.
- **BR-08-2** — Menilai ulang siswa yang sama **menimpa** nilai lama (idempotent lewat `_id` deterministik), tidak menciptakan record baru.
- **BR-08-3** — Setelah dinilai, status submission terkait berubah jadi `graded`.
- **BR-08-4** — **Kegagalan sinkron ke Sheets tidak boleh menggagalkan penilaian.** Nilai tetap tersimpan di AstraDB dengan `syncedToSheet: false` dan `syncError` terisi; response ke guru tetap sukses namun memuat penanda status sinkron.
- **BR-08-5** — Kelas tanpa `spreadsheet_id` → sinkron dilewati diam-diam, bukan error.
- **BR-08-6** — Sinkron bersifat **idempotent**: menulis nilai yang sama dua kali menghasilkan sel yang sama, tidak menggeser kolom atau menambah baris.
- **BR-08-7** — Kolom tugas dibuat otomatis di baris header bila belum ada; baris siswa ditambahkan otomatis bila NIS belum ada.
- **BR-08-8** — Pencocokan baris siswa memakai **NIS** (`profiles.identifier`), **bukan nama** (nama bisa sama/berubah).
- **BR-08-9** — Hanya guru pengampu kelas yang boleh menilai (`assertTeacherOwnsClass`) → selain itu `403`.
- **BR-08-10** — Siswa hanya bisa melihat nilainya sendiri; `studentId` diambil dari JWT → tidak bisa mengintip nilai teman.
- **BR-08-11** — Penilaian massal memproses tiap siswa **secara independen**; satu siswa gagal tidak membatalkan sisanya. Response memuat ringkasan sukses/gagal.
- **BR-08-12** — Google Sheets API punya batas laju. Penilaian massal dijalankan **berurutan dengan jeda**, bukan `Promise.all` serentak, agar tidak kena `429`.
- **BR-08-13** — Tugas bertipe `group`: nilai diterapkan ke **semua anggota kelompok**, masing-masing mendapat record `Grade` sendiri.

## 7. File yang Dibuat

| File | Isi | Target |
|---|---|---|
| `src/features/grading/grading.schema.ts` | `gradeBody`, `bulkGradeBody` | < 30 |
| `src/features/grading/grading.repository.ts` | Query AstraDB + data pendukung | < 60 |
| `src/features/grading/grading.sheets.ts` | Cari/buat kolom, cari/buat baris, tulis sel | < 130 |
| `src/features/grading/grading.service.ts` | Logika nilai + orkestrasi sinkron | < 140 |
| `src/features/grading/grading.routes.ts` | 5 endpoint | < 50 |

## 8. Kriteria Penerimaan

- [ ] Guru beri nilai → muncul di sel yang benar pada spreadsheet kelas
- [ ] Kolom tugas belum ada → otomatis dibuat di baris header
- [ ] Siswa belum ada barisnya → baris otomatis ditambahkan dengan NIS & nama
- [ ] Menilai ulang siswa sama → sel **tertimpa**, tidak muncul kolom/baris baru
- [ ] Nilai melebihi `maxScore` tugas → `400`
- [ ] Status submission berubah jadi `graded`
- [ ] Siswa mencoba ubah submission yang sudah dinilai → `409` (lihat SPEC-05)
- [ ] `spreadsheet_id` sengaja disalahkan → nilai **tetap tersimpan**, `syncedToSheet: false`, response sukses dengan penanda
- [ ] `POST /grading/sync/:classId` → nilai yang tertunda masuk ke sheet, flag jadi `true`
- [ ] Kelas tanpa `spreadsheet_id` → tidak error
- [ ] Nilai massal 30 siswa → semua masuk, tidak kena `429`
- [ ] Nilai tugas kelompok → semua anggota mendapat nilai
- [ ] Siswa akses `/grading/my` → hanya nilainya sendiri
- [ ] Dua siswa bernama sama → nilai masuk ke baris yang benar berdasarkan NIS

## 9. Catatan Operasional

- Service Account harus di-*share* sebagai **Editor** ke tiap spreadsheet kelas, kalau tidak semua sinkron gagal dengan `403` dari Google.
- Bila jumlah siswa besar dan penilaian sering, ganti pemanggilan langsung dengan **antrian** (BullMQ / Bun worker) — endpoint retry sudah menyiapkan jalannya.
