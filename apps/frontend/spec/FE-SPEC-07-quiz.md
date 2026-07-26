# FE-SPEC-07 — Quiz (Penyusun Soal & Pengerjaan)

| | |
|---|---|
| **Bergantung pada** | FE-00, FE-01, FE-02, FE-03 |
| **Endpoint backend** | `/quiz` (POST), `/quiz/class/:id`, `/quiz/:id`, `/quiz/start`, `/quiz/attempt`, `/quiz/:id/results` |
| **Estimasi** | 6 file |

---

## 1. Tujuan

Guru menyusun quiz pilihan ganda; siswa mengerjakan dengan batas waktu; hasil tampil seketika (dinilai backend).

## 2. Halaman & Route

| Route | Akses | Isi |
|---|---|---|
| `/guru/quiz` | guru | Daftar quiz + tombol buat |
| `/guru/quiz/buat` | guru | Penyusun soal (halaman penuh) |
| `/guru/quiz/:id/hasil` | guru | Rekap nilai siswa |
| `/siswa/quiz` | siswa | Daftar quiz + status |
| `/siswa/quiz/:id` | siswa | Layar pengerjaan |

## 3. Tampilan

**Penyusun soal (guru)** — halaman penuh, bukan modal (bisa panjang):
- Kartu per soal: teks soal, opsi jawaban (bisa tambah/kurang), penanda kunci, bobot
- Kunci ditandai dengan mengklik opsi → opsi terpilih jadi `primary` + ikon centang
- Tombol "+ Tambah Soal" di bawah; nomor soal dalam kotak `accent`
- Bilah ringkasan menempel di bawah: jumlah soal & total bobot

**Layar pengerjaan (siswa)**:
- **Pewaktu menempel di atas**, `font-mono` besar; berubah `accent` saat sisa < 2 menit
- Satu soal per layar + peta soal (kotak bernomor: terjawab `surface`, kosong `base`, aktif `primary`)
- Tombol Sebelumnya / Berikutnya; tombol Kumpulkan hanya di soal terakhir

**Hasil**: skor besar `font-display` dalam kartu `primary`, plus "80 dari 100".

## 4. Aturan UI

- **UI-07-1** — **Frontend tidak pernah menghitung skor.** Skor hanya dari response backend. Jangan ada logika pencocokan jawaban di sisi klien.
- **UI-07-2** — Kunci jawaban memang tidak dikirim backend ke siswa. Frontend **tidak boleh** mengakalinya dengan cara apa pun.
- **UI-07-3** — Pewaktu dimulai dari response `/quiz/start`, **bukan** dari jam lokal perangkat, agar tidak bisa dicurangi dengan mengubah jam.
- **UI-07-4** — Pewaktu habis → jawaban terkirim otomatis, disertai pemberitahuan. Jangan biarkan pekerjaan siswa hangus.
- **UI-07-5** — Jawaban sementara disimpan di memori halaman agar berpindah soal tidak menghilangkannya.
- **UI-07-6** — Tombol Kumpulkan memicu konfirmasi yang menyebut **berapa soal belum terjawab**, bila ada.
- **UI-07-7** — Meninggalkan halaman saat mengerjakan memunculkan peringatan.
- **UI-07-8** — Quiz yang sudah dikerjakan menampilkan skor di daftar; tidak ada tombol kerjakan lagi (backend hanya mengizinkan sekali).
- **UI-07-9** — Quiz lewat tenggat ditandai `Badge` "Ditutup" dan tidak bisa dibuka. Berbeda dari tugas, quiz **tidak** menerima keterlambatan.
- **UI-07-10** — Penyusun soal memvalidasi sebelum kirim: minimal 1 soal, tiap soal minimal 2 opsi, kunci wajib dipilih, bobot minimal 1. Soal bermasalah ditandai `accent` dengan pesan spesifik.
- **UI-07-11** — Menghapus soal yang sudah terisi memerlukan konfirmasi.
- **UI-07-12** — Peta soal bisa diklik untuk melompat.

## 5. File yang Dibuat

| File | Target |
|---|---|
| `src/routes/guru/QuizBuat.svelte` | < 170 |
| `src/routes/guru/QuizHasil.svelte` | < 100 |
| `src/routes/siswa/QuizKerjakan.svelte` | < 180 |
| `src/lib/components/quiz/EditorSoal.svelte` | < 130 |
| `src/lib/components/quiz/PetaSoal.svelte` | < 60 |
| `src/lib/components/quiz/Pewaktu.svelte` | < 70 |
| `src/lib/api/quiz.ts` | < 50 |

## 6. Kriteria Penerimaan

- [ ] Guru susun quiz 4 soal → tersimpan, tampil di daftar siswa
- [ ] Simpan quiz tanpa memilih kunci → ditolak, soal bermasalah ditandai
- [ ] Simpan quiz tanpa soal → ditolak
- [ ] Siswa buka quiz → **tidak ada** kunci jawaban di response (periksa panel jaringan)
- [ ] Pewaktu berjalan mundur dan berubah `accent` saat < 2 menit
- [ ] Ubah jam perangkat → pewaktu **tidak** ikut berubah
- [ ] Pewaktu habis → jawaban terkirim otomatis, skor tampil
- [ ] Pindah soal bolak-balik → jawaban tidak hilang
- [ ] Peta soal menandai terjawab & kosong dengan benar
- [ ] Kumpulkan dengan 2 soal kosong → konfirmasi menyebut angka 2
- [ ] Coba tutup tab saat mengerjakan → peringatan muncul
- [ ] Quiz yang sudah dikerjakan → hanya menampilkan skor, tidak bisa diulang
- [ ] Quiz lewat tenggat → bertanda "Ditutup", tidak bisa dibuka
- [ ] Skor yang tampil sama persis dengan yang dikirim backend
