# FE-SPEC-08 — Materi (Penyusun Blok & Tampilan Interaktif)

| | |
|---|---|
| **Bergantung pada** | FE-00, FE-01, FE-02, FE-03 |
| **Endpoint backend** | `/materials` (POST, PUT, DELETE), `/materials/class/:id`, `/materials/:id`, `/materials/:id/view` |
| **Estimasi** | 6 file |

---

## 1. Tujuan

Guru menyusun materi dari **blok** (HTML, video, checkpoint). Siswa membacanya sebagai halaman interaktif dengan soal cepat di tengah materi.

## 2. Halaman & Route

| Route | Akses | Isi |
|---|---|---|
| `/guru/materi` | guru | Daftar materi + tombol buat |
| `/guru/materi/buat` | guru | Penyusun blok |
| `/siswa/materi` | siswa | Daftar materi per kelas |
| `/siswa/materi/:id` | siswa | Tampilan baca interaktif |

## 3. Tampilan

**Penyusun blok (guru)** — dua kolom di desktop:
- Kiri: daftar blok, bisa diurut ulang (naik/turun), tiap blok bertanda tipe
- Kanan: pratinjau langsung
- Tombol tambah blok: **HTML** / **Video** / **Checkpoint**
- Blok HTML: textarea `font-mono` + pratinjau
- Blok Checkpoint: pertanyaan, opsi, dan penanda kunci

**Tampilan baca (siswa)** — satu kolom, lebar baca nyaman:
- Blok HTML dirender dengan gaya prosa terbaca
- Blok video: `iframe`/`video` berbingkai `border-[3px]` + `shadow-brutal`
- Blok checkpoint: kartu `primary` menyela alur bacaan, opsi berupa tombol
- Indikator kemajuan baca di atas

## 4. Cara Menampilkan Materi

Backend menyediakan dua jalur:
- `GET /materials/:id` → **JSON blok** (untuk penyusun & tampilan Svelte)
- `GET /materials/:id/view` → **halaman HTML utuh** siap pakai

**UI-08-1** — Untuk tampilan siswa, pakai jalur **JSON** dan render dengan komponen Svelte, bukan menyematkan halaman HTML lewat `iframe`. Alasannya: gaya Neo-Brutalism, indikator kemajuan, dan navigasi tetap konsisten dengan aplikasi. Jalur `/view` dipakai untuk cetak atau bagikan tautan langsung.

## 5. Aturan UI

- **UI-08-2** — HTML dari backend **sudah disanitasi**. Frontend menampilkannya lewat `{@html ...}` **hanya** untuk blok bertipe `html` dari endpoint materi — tidak pernah untuk data lain seperti nama pengguna atau judul.
- **UI-08-3** — Judul materi dan teks pertanyaan checkpoint dirender sebagai **teks biasa**, bukan HTML. Keduanya memang teks, dan memperlakukannya sebagai HTML membuka celah.
- **UI-08-4** — Checkpoint dijawab di sisi klien: opsi benar → `surface` + tanda centang; salah → `accent` + ajakan mencoba lagi. Hasilnya **tidak dikirim ke backend** dan **tidak dinilai** — murni latihan mandiri.
- **UI-08-5** — Checkpoint boleh dicoba berulang kali, tanpa hukuman apa pun.
- **UI-08-6** — Blok HTML dari guru bisa memuat tabel atau gambar lebar; bungkus dengan pembungkus yang bisa digulir mendatar agar tata letak tidak jebol di ponsel.
- **UI-08-7** — Gambar di dalam materi otomatis dibatasi `max-width: 100%` dan diberi bingkai `border-2` agar selaras dengan gaya.
- **UI-08-8** — Pratinjau penyusun memakai komponen render **yang sama** dengan tampilan siswa, supaya guru melihat hasil yang benar-benar sama.
- **UI-08-9** — Menyimpan materi memvalidasi minimal 1 blok, blok HTML tidak kosong, dan checkpoint punya kunci.
- **UI-08-10** — Menghapus blok yang sudah terisi memerlukan konfirmasi.
- **UI-08-11** — Perubahan yang belum disimpan memicu peringatan saat meninggalkan halaman.
- **UI-08-12** — Indikator kemajuan baca berdasarkan posisi gulir; tidak disimpan ke backend.

## 6. File yang Dibuat

| File | Target |
|---|---|
| `src/routes/guru/MateriBuat.svelte` | < 170 |
| `src/routes/siswa/MateriBaca.svelte` | < 120 |
| `src/lib/components/materi/PenyusunBlok.svelte` | < 150 |
| `src/lib/components/materi/RenderBlok.svelte` | < 110 |
| `src/lib/components/materi/Checkpoint.svelte` | < 80 |
| `src/lib/api/materials.ts` | < 50 |

## 7. Kriteria Penerimaan

- [ ] Guru susun materi 3 blok (html, video, checkpoint) → tersimpan
- [ ] Pratinjau tampil sama persis dengan tampilan siswa
- [ ] Urutkan ulang blok → urutan ikut berubah di tampilan siswa
- [ ] Siswa membuka materi → HTML tampil rapi dan terbaca
- [ ] Judul mengandung `<b>` tampil sebagai teks apa adanya, bukan tebal
- [ ] Checkpoint: jawaban benar → hijau/`surface` + centang
- [ ] Checkpoint: jawaban salah → `accent` + bisa dicoba lagi
- [ ] Hasil checkpoint **tidak** memicu panggilan jaringan apa pun
- [ ] Materi memuat tabel lebar → bisa digulir mendatar di ponsel tanpa merusak tata letak
- [ ] Gambar besar dalam materi tidak melebar melewati kolom
- [ ] Simpan materi tanpa blok → ditolak
- [ ] Tinggalkan penyusun dengan perubahan → peringatan muncul
- [ ] Indikator kemajuan bergerak saat digulir
