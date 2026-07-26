# FE-SPEC-02 — App Shell & Navigasi

| | |
|---|---|
| **Bergantung pada** | FE-00, FE-01 |
| **Endpoint backend** | — (memakai data sesi) |
| **Estimasi** | 6 file, semua < 120 baris |

---

## 1. Tujuan

Kerangka aplikasi yang membungkus semua halaman: navigasi per role, header, notifikasi, penanganan galat, dan tampilan responsif.

## 2. Ruang Lingkup

**Termasuk**
- Layout utama (sidebar desktop, laci geser di ponsel)
- Menu berbeda untuk guru dan siswa
- Header: nama pengguna, role, tombol keluar
- Toast global, halaman 404, penanganan galat
- Breadcrumb

**Tidak termasuk**
- Notifikasi realtime (ide lanjutan)
- Mode gelap (tidak cocok dengan palet ini)

## 3. Struktur Layout

```
┌──────────────────────────────────────────┐
│ HEADER  base, border-b-[3px]             │  ← nama, role, keluar
├────────────┬─────────────────────────────┤
│ SIDEBAR    │  KONTEN                     │
│ surface    │  base                       │
│ border-r-  │                             │
│ [3px]      │  <slot />                   │
└────────────┴─────────────────────────────┘
```

## 4. Menu per Role

**Guru** (`/guru/...`)
| Menu | Route |
|---|---|
| Beranda | `/guru` |
| Kelas | `/guru/kelas` |
| Tugas | `/guru/tugas` |
| Quiz | `/guru/quiz` |
| Materi | `/guru/materi` |
| Penilaian | `/guru/nilai` |

**Siswa** (`/siswa/...`)
| Menu | Route |
|---|---|
| Beranda | `/siswa` |
| Kelas Saya | `/siswa/kelas` |
| Tugas | `/siswa/tugas` |
| Quiz | `/siswa/quiz` |
| Materi | `/siswa/materi` |
| Kelompok | `/siswa/kelompok` |
| Nilai | `/siswa/nilai` |

## 5. Aturan UI

- **UI-02-1** — Menu aktif ditandai latar `primary` + `border-2` + `shadow-brutal-sm`. Hanya **satu** menu aktif pada satu waktu.
- **UI-02-2** — Menu disusun dari daftar berdasarkan `role` di store sesi, bukan ditulis dua kali secara manual.
- **UI-02-3** — Di layar < 768px sidebar berubah jadi laci geser dengan tombol hamburger; laci menutup otomatis setelah menu dipilih.
- **UI-02-4** — Header menampilkan nama & role. Role ditulis "Guru"/"Siswa" dalam bahasa Indonesia, bukan `teacher`/`student`.
- **UI-02-5** — Tombol keluar memakai `variant accent` dan **wajib** konfirmasi lebih dulu.
- **UI-02-6** — Toast: sukses `surface`, gagal `accent`, keduanya teks hitam + `border-2` + `shadow-brutal`. Hilang otomatis 4 detik, bisa ditutup manual.
- **UI-02-7** — Toast bertumpuk maksimal 3; yang tertua terdorong keluar.
- **UI-02-8** — Setiap halaman punya judul `font-display` + breadcrumb kecil di atasnya.
- **UI-02-9** — Galat jaringan (backend mati / tanpa koneksi) menampilkan panel galat dengan tombol "Coba Lagi", **bukan** layar putih kosong.
- **UI-02-10** — Route tak dikenal menampilkan halaman 404 bergaya yang tetap menyediakan navigasi kembali.
- **UI-02-11** — Setiap daftar punya tiga keadaan yang harus ditangani: **memuat** (skeleton), **kosong** (EmptyState + ajakan aksi), **galat** (panel + Coba Lagi). Jangan hanya menangani keadaan berisi.

## 6. File yang Dibuat

| File | Isi | Target |
|---|---|---|
| `src/lib/components/layout/AppShell.svelte` | Kerangka utama | < 110 |
| `src/lib/components/layout/Sidebar.svelte` | Menu + laci | < 110 |
| `src/lib/components/layout/Header.svelte` | Nama, role, keluar | < 80 |
| `src/lib/components/layout/Breadcrumb.svelte` | Jejak halaman | < 40 |
| `src/lib/components/ToastHost.svelte` | Wadah toast | < 60 |
| `src/routes/NotFound.svelte` | Halaman 404 | < 40 |
| `src/lib/config/menu.ts` | Daftar menu per role | < 50 |

## 7. Kriteria Penerimaan

- [ ] Guru masuk → hanya melihat 6 menu guru
- [ ] Siswa masuk → hanya melihat 7 menu siswa, tidak ada menu guru
- [ ] Menu halaman yang sedang dibuka bertanda `primary`
- [ ] Lebar 375px → sidebar jadi laci, tombol hamburger muncul
- [ ] Pilih menu di ponsel → laci menutup sendiri
- [ ] Klik keluar → muncul konfirmasi dulu
- [ ] Toast sukses & gagal tampil dengan warna berbeda dan hilang setelah 4 detik
- [ ] Munculkan 5 toast beruntun → hanya 3 terlihat
- [ ] Matikan backend lalu buka daftar → panel galat + tombol Coba Lagi
- [ ] Buka route ngawur → halaman 404 dengan tombol kembali
- [ ] Semua elemen navigasi bisa dijangkau dan terlihat jelas dengan Tab
