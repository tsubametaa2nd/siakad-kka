# SPEC-05 — Submissions (Kumpul Tugas: File + Link, Ubah, Hapus)

| | |
|---|---|
| **Bergantung pada** | SPEC-00, SPEC-01, SPEC-02, SPEC-04 |
| **Database** | **AstraDB** (koleksi `submissions`) + **Supabase Storage** (byte file) |
| **Estimasi** | 4 file, `service` paling besar (~150 baris) |

---

## 1. Tujuan

Siswa mengumpulkan tugas berupa **file dan/atau link**, bisa **mengubah** dan **menghapus** yang sudah dikirim. Guru bisa melihat semua pengumpulan untuk satu tugas.

## 2. Ruang Lingkup

**Termasuk**
- Kumpul tugas (multipart: banyak file + banyak link)
- Ubah file/link yang sudah dikirim
- Hapus pengumpulan
- Guru melihat daftar submission + unduh file

**Tidak termasuk**
- Penilaian (SPEC-08)
- Deteksi plagiarisme (ide lanjutan)

## 3. Pemisahan Penyimpanan

| Bagian | Lokasi |
|---|---|
| **Record** submission (nama file, ukuran, link, status) | **AstraDB** `submissions` |
| **Byte** file (PDF, gambar, docx) | **Supabase Storage**, bucket privat `submissions` |

Path file: `{classId}/{assignmentId}/{studentId}/{namafile}`

> AstraDB tidak dipakai untuk menyimpan byte file (bukan blob store). Yang tersimpan di sana hanya metadata.

## 4. Data Model (AstraDB — koleksi `submissions`)

```ts
interface Submission {
  _id: string;
  assignmentId: string;
  classId: string;
  studentId: string;                    // pengumpul (ketua, jika tugas kelompok)
  groupId?: string;                     // diisi bila tugas bertipe 'group'
  files: FileMeta[];
  links: string[];
  status: 'submitted' | 'late' | 'graded';
  version: number;                      // optimistic concurrency
  isDeleted: boolean;                   // soft delete
  submittedAt: string;
  updatedAt: string;
}
interface FileMeta { path: string; name: string; size: number; mime: string; }
```

## 5. Endpoint

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/api/submissions` | siswa | Kumpul tugas (multipart) |
| PUT | `/api/submissions/:id` | siswa | Ubah file/link |
| DELETE | `/api/submissions/:id` | siswa | Hapus pengumpulan |
| GET | `/api/submissions/my/:assignmentId` | siswa | Lihat punya sendiri |
| GET | `/api/submissions/assignment/:assignmentId` | guru | Semua submission tugas |

```jsonc
// PUT /submissions/:id  — version wajib untuk cegah tabrakan edit
{ "links": ["https://..."], "version": 1 }
```

## 6. Aturan Bisnis

- **BR-05-1** — Satu siswa hanya boleh punya **satu** submission aktif per tugas. Kumpul kedua kali → `409` (arahkan pakai endpoint ubah).
- **BR-05-2** — Status dihitung **saat pengumpulan**: `submittedAt > deadline` → `late`, selain itu `submitted`.
- **BR-05-3** — Pengumpulan **setelah deadline tetap diterima** tapi ditandai `late`. Guru yang memutuskan konsekuensinya.
- **BR-05-4** — Siswa hanya boleh mengubah/menghapus submission **miliknya sendiri**. `studentId` diambil dari JWT, **tidak pernah** dari body request → kalau bukan miliknya, `403`.
- **BR-05-5** — Ubah submission memakai **optimistic concurrency**: `version` dari client harus cocok dengan di database, kalau tidak → `409` ("Data sudah berubah, muat ulang"). Setiap update menaikkan `version`.
- **BR-05-6** — Saat file diganti, **file lama dihapus** dari Storage agar tidak jadi sampah.
- **BR-05-7** — Hapus submission = **soft delete** (`isDeleted = true`) **plus** hapus byte file dari Storage. Record disimpan untuk audit.
- **BR-05-8** — Submission yang sudah `graded` **tidak boleh** diubah/dihapus siswa → `409`.
- **BR-05-9** — Validasi file: maksimal **10 MB per file**, maksimal **5 file** per submission. Mime diizinkan: pdf, doc/docx, ppt/pptx, xls/xlsx, jpg, png, zip. Selain itu → `400`.
- **BR-05-10** — Link divalidasi berformat URL `http`/`https`. Maksimal 5 link.
- **BR-05-11** — Wajib minimal ada **satu** file **atau** satu link → kalau kosong dua-duanya, `400`.
- **BR-05-12** — Tugas bertipe `group`: yang mengumpulkan adalah **ketua kelompok**, dan `groupId` ikut disimpan. Anggota lain melihat submission itu sebagai milik kelompoknya.
- **BR-05-13** — Guru mengambil daftar submission menerima **signed URL** (berlaku 1 jam), bukan path mentah.
- **BR-05-14** — Query daftar submission **tidak** menampilkan yang `isDeleted = true`.

## 7. File yang Dibuat

| File | Isi | Target |
|---|---|---|
| `src/features/submissions/submissions.schema.ts` | `submitBody`, `updateBody` + aturan file | < 40 |
| `src/features/submissions/submissions.repository.ts` | Query AstraDB + optimistic update | < 60 |
| `src/features/submissions/submissions.service.ts` | Logika utama | < 160 |
| `src/features/submissions/submissions.routes.ts` | 5 endpoint | < 50 |

Kalau `service` melewati 160 baris, pecah validasi file ke `submissions.files.ts`.

## 8. Kriteria Penerimaan

- [ ] Siswa kumpul dengan 2 file + 1 link → tersimpan, `status: submitted`
- [ ] Kumpul setelah deadline → tersimpan, `status: late`
- [ ] Kumpul kedua kali untuk tugas sama → `409`
- [ ] Kumpul tanpa file **dan** tanpa link → `400`
- [ ] Upload file 15 MB → `400`
- [ ] Upload file `.exe` → `400`
- [ ] Siswa A ubah submission siswa B (kirim `id` milik B) → `403`
- [ ] Ubah dengan `version` lama → `409`
- [ ] Ganti file → file lama **hilang** dari Storage (cek bucket)
- [ ] Hapus submission → byte file hilang, record `isDeleted: true`, tidak muncul di list
- [ ] Ubah submission yang sudah `graded` → `409`
- [ ] Guru buka daftar submission → dapat signed URL yang bisa diunduh
- [ ] URL file **tidak** bisa diakses publik tanpa tanda tangan
