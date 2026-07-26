# SPEC-02 — Classes (Kelas & Enrollment Siswa)

| | |
|---|---|
| **Bergantung pada** | SPEC-00, SPEC-01 |
| **Database** | **Supabase** (`classes`, `enrollments`, `teaching_assignments`) |
| **Estimasi** | 4 file, semua < 120 baris |

---

## 1. Tujuan

Guru membuat kelas, mendaftarkan siswa ke kelas, dan melihat daftar siswa. Kelas adalah **wadah** untuk semua fitur lain (tugas, materi, quiz, kelompok, nilai).

## 2. Ruang Lingkup

**Termasuk**
- CRUD kelas (fokus: create, list, detail)
- Enrollment siswa ke kelas (batch)
- Penugasan guru mengajar kelas + mapel
- Menyimpan `spreadsheet_id` per kelas (dipakai SPEC-08)

**Tidak termasuk**
- Impor siswa dari CSV/Excel (ide lanjutan)
- Pindah kelas / naik kelas otomatis

## 3. Data Model (Supabase)

```sql
create table classes (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,      -- "XII RPL 1"
  grade_level         text not null,      -- "XII"
  academic_year       text not null,      -- "2025/2026"
  homeroom_teacher_id uuid references profiles(id),
  spreadsheet_id      text,               -- Google Sheet rekap nilai kelas
  created_at          timestamptz default now()
);

create table teaching_assignments (
  teacher_id uuid references profiles(id) on delete cascade,
  class_id   uuid references classes(id)  on delete cascade,
  subject    text not null,
  primary key (teacher_id, class_id, subject)
);

create table enrollments (
  student_id uuid references profiles(id) on delete cascade,
  class_id   uuid references classes(id)  on delete cascade,
  primary key (student_id, class_id)
);
```

## 4. Endpoint

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/api/classes` | guru | Buat kelas |
| GET | `/api/classes` | guru | Kelas yang diampu |
| GET | `/api/classes/:id/students` | guru | Daftar siswa di kelas |
| POST | `/api/classes/:id/enroll` | guru | Daftarkan siswa (batch) |
| GET | `/api/classes/my` | siswa | Kelas yang diikuti siswa |

**`POST /classes`**
```jsonc
{ "name": "XII RPL 1", "gradeLevel": "XII", "academicYear": "2025/2026",
  "spreadsheetId": "1AbC..." }   // opsional
```

**`POST /classes/:id/enroll`**
```jsonc
{ "studentIds": ["uuid1", "uuid2"] }
// response
{ "success": true, "data": { "enrolled": 2 } }
```

## 5. Aturan Bisnis

- **BR-02-1** — Pembuat kelas otomatis jadi `homeroom_teacher_id`.
- **BR-02-2** — Enrollment bersifat **idempotent** (`upsert`). Mendaftarkan siswa yang sudah terdaftar tidak error dan tidak menduplikasi.
- **BR-02-3** — Enroll ke kelas yang tidak ada → `404 NOT_FOUND`.
- **BR-02-4** — Hanya profil ber-`role = 'student'` yang boleh di-enroll. ID milik guru → `400 BAD_REQUEST`.
- **BR-02-5** — Guru hanya boleh melihat/mengubah kelas yang dia ampu (`homeroom_teacher_id` = dirinya **atau** ada di `teaching_assignments`). Selain itu → `403`.
- **BR-02-6** — Siswa hanya bisa melihat kelas yang dia ikuti lewat `/classes/my`. Tidak boleh mengakses daftar siswa kelas lain.
- **BR-02-7** — `spreadsheet_id` boleh kosong. Kalau kosong, sinkron nilai di SPEC-08 dilewati tanpa error.

> **BR-02-5 penting**: fungsi cek "guru ini berhak atas kelas ini?" akan dipakai ulang di SPEC-04, 06, 07, 08. Buat sebagai fungsi terpisah yang bisa di-import, mis. `assertTeacherOwnsClass(teacherId, classId)`.

## 6. File yang Dibuat

| File | Isi | Target |
|---|---|---|
| `src/features/classes/classes.schema.ts` | `createClassBody`, `enrollBody` | < 25 |
| `src/features/classes/classes.repository.ts` | Query Supabase | < 60 |
| `src/features/classes/classes.service.ts` | Logika + `assertTeacherOwnsClass` | < 90 |
| `src/features/classes/classes.routes.ts` | 5 endpoint | < 45 |

## 7. Kriteria Penerimaan

- [ ] Guru buat kelas → muncul di `GET /classes` miliknya
- [ ] Guru A tidak melihat kelas milik guru B
- [ ] Enroll 2 siswa → `GET /classes/:id/students` menampilkan keduanya lengkap dengan NIS & nama
- [ ] Enroll siswa yang sama dua kali → tetap `200`, tidak duplikat di daftar
- [ ] Enroll ID guru sebagai siswa → `400`
- [ ] Enroll ke `classId` acak → `404`
- [ ] Guru B akses `/classes/:idMilikA/students` → `403`
- [ ] Siswa panggil `/classes/my` → hanya kelas yang dia ikuti
- [ ] `assertTeacherOwnsClass` diekspor dan siap dipakai spec lain
