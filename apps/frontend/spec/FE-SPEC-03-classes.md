# FE-SPEC-03 — Kelas & Daftar Siswa

| | |
|---|---|
| **Bergantung pada** | FE-00, FE-01, FE-02 |
| **Endpoint backend** | `/classes` (GET, POST), `/classes/:id/students`, `/classes/:id/enroll`, `/classes/my`, `/auth/accounts` |
| **Estimasi** | 6 file |

---

## 1. Tujuan

Guru mengelola kelas, mendaftarkan siswa, dan **membuatkan akun siswa**. Siswa melihat kelas yang diikutinya.

## 2. Halaman & Route

| Route | Akses | Isi |
|---|---|---|
| `/guru/kelas` | guru | Daftar kelas (kartu) + tombol buat kelas |
| `/guru/kelas/:id` | guru | Detail kelas + daftar siswa + kelola |
| `/siswa/kelas` | siswa | Kelas yang diikuti |

## 3. Tampilan

**Daftar kelas (guru)** — grid kartu:
- Kartu latar `surface`, `border-[3px]`, `shadow-brutal`
- Nama kelas `font-display` besar; tingkat & tahun ajaran di bawahnya
- Jumlah siswa sebagai `Badge`
- Kartu berpenanda `accent` kecil bila `spreadsheetId` belum diatur
- Tombol "+ Buat Kelas" `variant primary` di kanan atas

**Detail kelas** — tab: **Siswa** | **Pengaturan**
- Tab Siswa: tabel (No, NIS `font-mono`, Nama, Aksi) + tombol "Tambah Siswa"
- Tab Pengaturan: nama kelas, tahun ajaran, dan **ID Spreadsheet**

**Modal Tambah Siswa** — dua tab:
1. **Pilih siswa yang sudah ada** — pencarian + centang banyak
2. **Buat akun baru** — Nama, NIS, Password → memanggil `/auth/accounts` lalu `/enroll`

## 4. Aturan UI

- **UI-03-1** — Daftar kelas menampilkan skeleton saat memuat, EmptyState bila kosong ("Belum ada kelas" + tombol buat), dan panel galat bila gagal.
- **UI-03-2** — Membuat kelas memakai modal, bukan halaman terpisah. Setelah sukses, daftar diperbarui **tanpa memuat ulang halaman**.
- **UI-03-3** — Field ID Spreadsheet disertai penjelasan singkat: cara mengambilnya dari URL Google Sheets, dan pengingat untuk membagikan akses Editor ke email Service Account. Tanpa ini nilai tidak akan tersinkron.
- **UI-03-4** — Saat membuat akun siswa, password ditampilkan **satu kali** setelah berhasil dengan tombol salin dan peringatan bahwa password tidak bisa dilihat lagi. Backend hanya menyimpan hash-nya.
- **UI-03-5** — Sediakan tombol **acak password** agar guru tidak memakai pola yang mudah ditebak.
- **UI-03-6** — Membuat banyak akun siswa berturut-turut tidak menutup modal, agar guru bisa memasukkan satu kelas sekaligus. Yang sudah dibuat tampil sebagai daftar berjalan.
- **UI-03-7** — NIS ditampilkan dengan `font-mono` di seluruh aplikasi agar mudah dibandingkan.
- **UI-03-8** — Pendaftaran siswa yang sudah terdaftar tidak menampilkan galat (backend memang idempotent) — cukup pesan "sudah terdaftar".
- **UI-03-9** — Tabel siswa bisa dicari berdasarkan nama atau NIS (penyaringan di sisi klien untuk kelas < 100 siswa).
- **UI-03-10** — Siswa hanya melihat kelas yang diikuti; tidak ada tombol buat/ubah kelas sama sekali di tampilan siswa.

## 5. File yang Dibuat

| File | Target |
|---|---|
| `src/routes/guru/Kelas.svelte` | < 130 |
| `src/routes/guru/KelasDetail.svelte` | < 150 |
| `src/routes/siswa/KelasSaya.svelte` | < 90 |
| `src/lib/components/kelas/ClassCard.svelte` | < 70 |
| `src/lib/components/kelas/TambahSiswaModal.svelte` | < 160 |
| `src/lib/api/classes.ts` | < 50 |

## 6. Kriteria Penerimaan

- [ ] Guru buat kelas → kartu langsung muncul tanpa muat ulang
- [ ] Daftar kosong → EmptyState dengan ajakan membuat kelas
- [ ] Detail kelas menampilkan siswa dengan NIS `font-mono`
- [ ] Buat akun siswa → password tampil sekali, bisa disalin
- [ ] Tutup modal password → password tidak bisa dilihat lagi di mana pun
- [ ] Buat 3 akun berturut-turut → modal tetap terbuka, ketiganya tercatat
- [ ] Tombol acak password menghasilkan password berbeda tiap klik
- [ ] Daftarkan siswa yang sudah terdaftar → pesan ramah, bukan galat merah
- [ ] Cari "budi" di tabel siswa → tersaring seketika
- [ ] Field ID Spreadsheet memuat penjelasan cara mendapatkannya
- [ ] Kelas tanpa spreadsheet ditandai jelas di kartunya
- [ ] Siswa buka `/siswa/kelas` → tidak ada tombol buat/ubah
