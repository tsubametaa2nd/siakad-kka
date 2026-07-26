# FE-SPEC-04 — Kelompok

| | |
|---|---|
| **Bergantung pada** | FE-00, FE-01, FE-02, FE-03 |
| **Endpoint backend** | `/groups` (POST), `/groups/join`, `/groups/leave`, `/groups/class/:id`, `/groups/my` |
| **Estimasi** | 4 file |

---

## 1. Tujuan

Siswa membentuk atau bergabung ke kelompok dalam sebuah kelas. Aturan **satu siswa satu kelompok per kelas** harus terasa jelas di antarmuka, bukan baru ketahuan saat gagal.

## 2. Halaman & Route

| Route | Akses | Isi |
|---|---|---|
| `/siswa/kelompok` | siswa | Kelompok saya per kelas + daftar kelompok tersedia |
| `/guru/kelas/:id` (tab) | guru | Tab Kelompok pada detail kelas (baca saja) |

## 3. Tampilan

**Bila siswa belum punya kelompok di kelas itu:**
- Panel `primary`: "Kamu belum punya kelompok" + tombol "Buat Kelompok"
- Di bawahnya: daftar kelompok yang ada, masing-masing dengan tombol "Gabung"
- Kelompok penuh tetap ditampilkan tapi tombolnya nonaktif + `Badge` "Penuh"

**Bila sudah punya kelompok:**
- Kartu kelompok `surface` menonjol di atas: nama, ketua (`Badge primary`), daftar anggota
- Kelompok lain **tetap ditampilkan** tapi tombol Gabung nonaktif, disertai penjelasan
- Tombol "Keluar dari Kelompok" `variant accent` di bawah

## 4. Aturan UI

- **UI-04-1** — Aturan satu-kelompok dikomunikasikan **sebelum** siswa mencoba: tombol Gabung dinonaktifkan disertai keterangan "Kamu sudah tergabung di Kelompok X", bukan dibiarkan lalu memunculkan galat.
- **UI-04-2** — Meski begitu, galat `409` dari backend **tetap harus ditangani** dan ditampilkan ramah, karena bisa saja siswa membuka dua tab sekaligus.
- **UI-04-3** — Siswa memilih kelas lebih dulu bila terdaftar di beberapa kelas; kelompok selalu ditampilkan **dalam konteks satu kelas**, tidak pernah dicampur.
- **UI-04-4** — Keluar dari kelompok **wajib** konfirmasi, dengan peringatan tambahan bila dia ketua ("kepemimpinan akan berpindah ke anggota terlama").
- **UI-04-5** — Ketua ditandai `Badge primary`; anggota biasa tanpa badge.
- **UI-04-6** — Kuota anggota ditampilkan jelas, mis. "3/5 anggota", pada setiap kartu kelompok.
- **UI-04-7** — Setelah buat/gabung/keluar, tampilan diperbarui seketika tanpa memuat ulang halaman.
- **UI-04-8** — Nama kelompok dibatasi 30 karakter dengan penghitung karakter agar tidak merusak tata letak kartu.
- **UI-04-9** — Tampilan guru **hanya membaca**: tidak ada tombol buat, gabung, atau keluar.

## 5. File yang Dibuat

| File | Target |
|---|---|
| `src/routes/siswa/Kelompok.svelte` | < 150 |
| `src/lib/components/kelompok/GroupCard.svelte` | < 80 |
| `src/lib/components/kelompok/BuatKelompokModal.svelte` | < 80 |
| `src/lib/api/groups.ts` | < 40 |

## 6. Kriteria Penerimaan

- [ ] Siswa tanpa kelompok → panel ajakan + daftar kelompok bisa digabung
- [ ] Siswa buat kelompok → dia tampil sebagai ketua dengan badge
- [ ] Setelah punya kelompok → semua tombol Gabung nonaktif dengan keterangan jelas
- [ ] Kelompok penuh → tombol nonaktif + badge "Penuh"
- [ ] Paksa gabung dari tab kedua → galat `409` tampil ramah, bukan layar putih
- [ ] Terdaftar di 2 kelas → bisa berpindah konteks kelas, kelompok tidak tercampur
- [ ] Keluar sebagai ketua → konfirmasi memuat peringatan pemindahan kepemimpinan
- [ ] Setiap kartu menampilkan kuota "n/m anggota"
- [ ] Nama kelompok > 30 karakter tertahan, penghitung karakter tampil
- [ ] Guru membuka tab Kelompok → tidak ada tombol aksi apa pun
