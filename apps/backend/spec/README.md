# SIAKAD — Spec Pack

Dokumen desain dipecah menjadi **spec per fitur** agar bisa dikerjakan bertahap, satu spec satu sesi, tanpa kehilangan konteks.

## Isi

| File | Isi |
|---|---|
| `PROMPTS.md` | **Prompt wajib** (selalu disertakan) + **prompt per spec** (tinggal copy-paste) |
| `specs/SPEC-00-foundation.md` | Config, shared layer, entry point |
| `specs/SPEC-01-auth.md` | Login NIS/NIP + NextAuth + buat akun |
| `specs/SPEC-02-classes.md` | Kelas & enrollment siswa |
| `specs/SPEC-03-groups.md` | Kelompok (max 1 per siswa per kelas) |
| `specs/SPEC-04-assignments.md` | Tugas dari guru (+ deadline) |
| `specs/SPEC-05-submissions.md` | Kumpul tugas siswa (file + link), ubah, hapus |
| `specs/SPEC-06-quiz.md` | Quiz + auto-grading |
| `specs/SPEC-07-materials.md` | Materi HTML → halaman interaktif |
| `specs/SPEC-08-grading.md` | Penilaian + sinkron Google Sheets |

`SIAKAD-BACKEND.md` (dokumen penuh) tetap jadi **rujukan arsitektur & contoh kode**. Spec di sini adalah **kontrak apa yang harus jadi**; dokumen itu adalah **contoh bagaimana**.

## Urutan Pengerjaan

```
SPEC-00  foundation          ← wajib pertama, semua bergantung ke sini
   ├── SPEC-01  auth         ← wajib kedua, semua endpoint butuh guard
   │      ├── SPEC-02  classes
   │      │     ├── SPEC-03  groups
   │      │     ├── SPEC-04  assignments
   │      │     │     ├── SPEC-05  submissions
   │      │     │     └── SPEC-08  grading      (butuh 04 + 05)
   │      │     ├── SPEC-06  quiz
   │      │     └── SPEC-07  materials
```

Kerjakan berurutan **00 → 01 → 02 → 03/04/06/07 → 05 → 08**.
SPEC-03, 04, 06, 07 tidak saling bergantung, boleh ditukar urutannya.

## Cara Pakai

1. Buka `PROMPTS.md`, salin **Prompt Wajib**.
2. Salin **prompt spec** yang mau dikerjakan, tempel di bawahnya.
3. Lampirkan file spec-nya (`specs/SPEC-0X-*.md`).
4. Setelah selesai, cek **Kriteria Penerimaan** di spec tersebut sebelum lanjut.

## Status Pengerjaan

Tandai saat selesai:

- [ ] SPEC-00 foundation
- [ ] SPEC-01 auth
- [ ] SPEC-02 classes
- [ ] SPEC-03 groups
- [ ] SPEC-04 assignments
- [ ] SPEC-05 submissions
- [ ] SPEC-06 quiz
- [ ] SPEC-07 materials
- [ ] SPEC-08 grading
