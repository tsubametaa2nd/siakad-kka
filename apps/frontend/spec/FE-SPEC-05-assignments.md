# FE-SPEC-05 — Tugas (Guru & Siswa)

| | |
|---|---|
| **Bergantung pada** | FE-00, FE-01, FE-02, FE-03 |
| **Endpoint backend** | `/assignments` (POST, PUT, DELETE), `/assignments/class/:id`, `/assignments/:id` |
| **Estimasi** | 6 file |

---

## 1. Tujuan

Guru membuat dan mengelola tugas bertenggat. Siswa melihat daftar tugas beserta **status pribadinya** dan sisa waktu.

## 2. Halaman & Route

| Route | Akses | Isi |
|---|---|---|
| `/guru/tugas` | guru | Daftar tugas semua kelas + tombol buat |
| `/guru/tugas/:id` | guru | Detail tugas + pengumpulan (FE-06) |
| `/siswa/tugas` | siswa | Daftar tugas + status pribadi |
| `/siswa/tugas/:id` | siswa | Detail + form pengumpulan (FE-06) |

## 3. Tampilan

**Kartu tugas (siswa)** — informasi terpenting: **sisa waktu**.
- Kartu `surface`, dengan pita status di kiri:
  - `Belum` → `accent` bila tenggat < 24 jam, selain itu `base`
  - `Sudah` → `surface`
  - `Telat` → `accent`
  - `Dinilai` → `primary` + tampilkan skornya
- Judul `font-display`, nama kelas, tipe (Individu/Kelompok) sebagai `Badge`
- Hitung mundur: "2 hari lagi" / "3 jam lagi" / "Lewat 2 hari"

**Form buat tugas (guru)** — modal: judul, deskripsi, kelas, tipe, tenggat (tanggal+jam), nilai maksimal.

## 4. Aturan UI

- **UI-05-1** — Status tugas siswa **diambil dari backend**, tidak dihitung ulang di frontend. Backend sudah menyertakannya di daftar (BR-04-8 backend).
- **UI-05-2** — Semua waktu dari backend berformat **UTC**; frontend menampilkannya dalam **WIB**. Semua yang dikirim ke backend dikonversi kembali ke UTC. Salah di sini membuat tenggat meleset 7 jam.
- **UI-05-3** — Tanggal ditulis lengkap dan tidak ambigu: "Sen, 3 Agu 2026, 23:59 WIB" — bukan "3/8/26".
- **UI-05-4** — Hitung mundur diperbarui tiap menit selama halaman terbuka, dan berhenti bila tenggat sudah lewat.
- **UI-05-5** — Tugas dengan tenggat < 24 jam dan belum dikumpulkan ditandai `accent` agar menonjol.
- **UI-05-6** — Pemilih tenggat **menolak waktu yang sudah lewat** sebelum dikirim (backend juga menolak, ini sekadar mencegah frustrasi).
- **UI-05-7** — Daftar tugas siswa diurutkan: belum dikumpulkan & terdekat tenggatnya di atas; yang sudah dinilai di bawah.
- **UI-05-8** — Menghapus tugas memakai `ConfirmDialog` yang menyebutkan **judul tugasnya**. Bila backend menolak `409` (sudah ada pengumpulan), tampilkan pilihan hapus paksa dengan peringatan tegas bahwa pekerjaan siswa ikut terhapus.
- **UI-05-9** — Guru bisa menyaring daftar tugas per kelas.
- **UI-05-10** — Kartu tugas kelompok menampilkan nama kelompok siswa tersebut, agar jelas siapa yang mengumpulkan.
- **UI-05-11** — Nilai maksimal ditampilkan di detail supaya siswa paham skala penilaiannya.

## 5. File yang Dibuat

| File | Target |
|---|---|
| `src/routes/guru/Tugas.svelte` | < 130 |
| `src/routes/guru/TugasDetail.svelte` | < 120 |
| `src/routes/siswa/Tugas.svelte` | < 120 |
| `src/routes/siswa/TugasDetail.svelte` | < 120 |
| `src/lib/components/tugas/TugasCard.svelte` | < 100 |
| `src/lib/components/tugas/BuatTugasModal.svelte` | < 130 |
| `src/lib/api/assignments.ts` | < 50 |

## 6. Kriteria Penerimaan

- [ ] Guru buat tugas → muncul di daftar dan di daftar siswa kelas itu
- [ ] Pilih tenggat kemarin → ditolak sebelum terkirim
- [ ] Tenggat "2026-08-03T16:59:00Z" tampil sebagai "3 Agu 2026, 23:59 WIB"
- [ ] Tugas < 24 jam & belum dikumpulkan → kartu bertanda `accent`
- [ ] Hitung mundur berubah sendiri setelah satu menit tanpa muat ulang
- [ ] Tenggat lewat → tampil "Lewat n hari", hitung mundur berhenti
- [ ] Status kartu sama persis dengan yang dikirim backend
- [ ] Daftar siswa terurut: mendesak di atas, sudah dinilai di bawah
- [ ] Hapus tugas → konfirmasi menyebut judulnya
- [ ] Hapus tugas yang ada pengumpulan → `409` ditangani, muncul opsi hapus paksa berperingatan
- [ ] Guru saring per kelas → daftar menyesuaikan
- [ ] Tugas kelompok menampilkan nama kelompok siswa
