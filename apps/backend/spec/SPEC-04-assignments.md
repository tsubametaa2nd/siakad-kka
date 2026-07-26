# SPEC-04 — Assignments (Tugas dari Guru + Deadline)

| | |
|---|---|
| **Bergantung pada** | SPEC-00, SPEC-01, SPEC-02 |
| **Database** | **AstraDB** (koleksi `assignments`) |
| **Estimasi** | 4 file, semua < 100 baris |

---

## 1. Tujuan

Guru membuat tugas untuk satu kelas dengan **tenggat waktu**. Tugas bisa bersifat individu atau kelompok.

## 2. Ruang Lingkup

**Termasuk**
- Buat, ubah, hapus tugas
- List tugas per kelas + detail tugas
- Penanda tipe tugas: individu / kelompok

**Tidak termasuk**
- Pengumpulan tugas oleh siswa (SPEC-05)
- Penilaian (SPEC-08)

## 3. Data Model (AstraDB — koleksi `assignments`)

```ts
interface Assignment {
  _id: string;                          // uuid
  classId: string;                      // UUID milik Supabase, tanpa FK
  teacherId: string;
  title: string;
  description: string;
  type: 'individual' | 'group';
  deadline: string;                     // ISO 8601, selalu UTC
  maxScore: number;                     // 1..100
  createdAt: string;
  updatedAt: string;
}
```

**Pola query**: selalu by `classId` (list) atau by `_id` (detail).

## 4. Endpoint

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/api/assignments` | guru | Buat tugas |
| PUT | `/api/assignments/:id` | guru | Ubah tugas |
| DELETE | `/api/assignments/:id` | guru | Hapus tugas |
| GET | `/api/assignments/class/:classId` | login | List tugas kelas |
| GET | `/api/assignments/:id` | login | Detail tugas |

```jsonc
// POST /assignments
{ "classId": "uuid", "title": "Laporan Praktikum", "description": "...",
  "type": "group", "deadline": "2026-08-01T16:59:00.000Z", "maxScore": 100 }
```

## 5. Aturan Bisnis

- **BR-04-1** — Hanya guru yang mengampu kelas itu yang boleh membuat tugas di kelas tersebut. Gunakan `assertTeacherOwnsClass` dari SPEC-02.
- **BR-04-2** — `deadline` wajib **di masa depan** saat tugas dibuat → kalau lampau, `400 BAD_REQUEST`.
- **BR-04-3** — `deadline` disimpan dan dibandingkan dalam **UTC**. Konversi ke WIB dilakukan di frontend, bukan backend.
- **BR-04-4** — Hanya pembuat tugas (`teacherId`) yang boleh mengubah/menghapus tugas itu → selain itu `403`.
- **BR-04-5** — Menghapus tugas yang **sudah ada submission**-nya ditolak dengan `409`, agar pekerjaan siswa tidak hilang tanpa sengaja. Sediakan opsi `?force=true` untuk hapus paksa beserta submission-nya.
- **BR-04-6** — Siswa hanya boleh melihat tugas dari kelas yang dia ikuti → selain itu `403`.
- **BR-04-7** — Mengubah `deadline` tidak mengubah status submission yang sudah terlanjur `late`; status dihitung saat pengumpulan (lihat SPEC-05).
- **BR-04-8** — Response list tugas untuk **siswa** menyertakan status pribadi: `belum` / `sudah` / `telat` / `dinilai`, agar frontend tidak perlu query terpisah.

## 6. File yang Dibuat

| File | Isi | Target |
|---|---|---|
| `src/features/assignments/assignments.schema.ts` | `createAssignmentBody`, `updateAssignmentBody` | < 30 |
| `src/features/assignments/assignments.repository.ts` | Query AstraDB | < 50 |
| `src/features/assignments/assignments.service.ts` | Logika + cek kepemilikan | < 90 |
| `src/features/assignments/assignments.routes.ts` | 5 endpoint | < 45 |

## 7. Kriteria Penerimaan

- [ ] Guru buat tugas → muncul di list kelas tersebut
- [ ] Buat tugas dengan deadline kemarin → `400`
- [ ] Guru yang tidak mengampu kelas itu buat tugas di sana → `403`
- [ ] Guru B ubah tugas milik guru A → `403`
- [ ] Hapus tugas yang sudah ada submission → `409`; dengan `?force=true` → sukses
- [ ] Siswa lihat tugas kelas yang tidak dia ikuti → `403`
- [ ] List tugas untuk siswa menyertakan status pribadi tiap tugas
- [ ] `deadline` yang dikembalikan berformat ISO 8601 UTC
