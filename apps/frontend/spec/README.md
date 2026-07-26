# SIAKAD Frontend — Spec Pack

Frontend **Svelte 5 + Vite + Bun + TailwindCSS**, gaya **Neo-Brutalism**.
Dipecah per spec agar bisa dikerjakan bertahap, satu spec satu sesi.

## Isi

| File | Isi |
|---|---|
| `PROMPTS.md` | **Prompt wajib** + **prompt per spec** |
| `specs/FE-SPEC-00-foundation.md` | Setup, design token, komponen UI dasar |
| `specs/FE-SPEC-01-auth.md` | Halaman login, token store, route guard |
| `specs/FE-SPEC-02-shell.md` | Layout, navigasi per role, toast |
| `specs/FE-SPEC-03-classes.md` | Kelas & daftar siswa |
| `specs/FE-SPEC-04-groups.md` | Kelompok |
| `specs/FE-SPEC-05-assignments.md` | Tugas (guru & siswa) |
| `specs/FE-SPEC-06-submissions.md` | Kumpul tugas, ubah, hapus, cek |
| `specs/FE-SPEC-07-quiz.md` | Quiz + pengerjaan |
| `specs/FE-SPEC-08-materials.md` | Editor blok & viewer interaktif |
| `specs/FE-SPEC-09-grading.md` | Penilaian & rapor nilai |

## Batas Tanggung Jawab

**Frontend hanya mengurus tampilan dan interaksi.** Semua aturan bisnis, validasi
keamanan, dan otorisasi sudah ditegakkan backend (lihat spec pack backend).

- Frontend **boleh** memvalidasi input lebih awal demi kenyamanan (mis. tandai
  file kelebihan ukuran sebelum dikirim), tapi **tidak boleh** menganggap itu
  pengaman. Backend tetap penentu.
- Frontend **tidak** menghitung nilai, status telat, atau kelayakan akses sendiri
  — semua diambil apa adanya dari response backend.
- Frontend **menyembunyikan** menu yang tidak relevan untuk sebuah role, tapi itu
  murni kenyamanan; backend yang benar-benar menolak.

## Urutan Pengerjaan

```
FE-00  foundation + design system     ← wajib pertama
   └── FE-01  auth
          └── FE-02  shell & navigasi
                 ├── FE-03  classes
                 │      ├── FE-04  groups
                 │      ├── FE-05  assignments
                 │      │      ├── FE-06  submissions
                 │      │      └── FE-09  grading   (butuh 05 + 06)
                 │      ├── FE-07  quiz
                 │      └── FE-08  materials
```

Kerjakan **00 → 01 → 02 → 03 → 04/05/07/08 → 06 → 09**.

## Cara Pakai

1. Salin **Prompt Wajib** dari `PROMPTS.md`.
2. Tambahkan **prompt spec** yang dikerjakan.
3. Lampirkan file spec-nya + `FE-SPEC-00` (rujukan design system).
4. Cek **Kriteria Penerimaan** sebelum lanjut.

## Status

- [ ] FE-00 foundation
- [ ] FE-01 auth
- [ ] FE-02 shell
- [ ] FE-03 classes
- [ ] FE-04 groups
- [ ] FE-05 assignments
- [ ] FE-06 submissions
- [ ] FE-07 quiz
- [ ] FE-08 materials
- [ ] FE-09 grading
