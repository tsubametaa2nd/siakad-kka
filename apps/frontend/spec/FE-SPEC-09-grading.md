# FE-SPEC-09 — Penilaian & Rapor Nilai

| | |
|---|---|
| **Bergantung pada** | FE-00, FE-01, FE-02, FE-05, FE-06 |
| **Endpoint backend** | `/grading` (POST), `/grading/bulk`, `/grading/assignment/:id`, `/grading/my`, `/grading/sync/:classId` |
| **Estimasi** | 6 file |

---

## 1. Tujuan

Guru menilai pengumpulan sambil melihat berkasnya, dan memantau status sinkron ke Google Spreadsheet. Siswa melihat nilainya sendiri.

## 2. Halaman & Route

| Route | Akses | Isi |
|---|---|---|
| `/guru/nilai` | guru | Ringkasan penilaian per kelas + status sinkron |
| `/guru/tugas/:id/nilai` | guru | Layar penilaian satu tugas |
| `/siswa/nilai` | siswa | Daftar nilai saya |

## 3. Tampilan

**Layar penilaian** — dua panel:
- Kiri (60%): pratinjau berkas siswa (PDF/gambar disematkan, tipe lain jadi tombol unduh)
- Kanan (40%): input nilai `font-mono` besar, catatan, tombol Simpan & Berikutnya
- Atas: navigasi antar siswa "Siswa 3 dari 30" + tombol maju/mundur

**Kartu nilai (siswa)**: judul tugas, skor besar dalam kartu `primary`, "85 / 100", catatan guru, tanggal dinilai.

**Panel status sinkron (guru)**: jumlah nilai tertunda + tombol "Sinkron Ulang".

## 4. Aturan UI

- **UI-09-1** — Input nilai dibatasi `0` sampai `maxScore` **tugas itu**, bukan selalu 100. Nilai di luar rentang ditolak sebelum kirim, dengan keterangan batas yang berlaku.
- **UI-09-2** — Alur "Simpan & Berikutnya" langsung memindahkan ke siswa berikutnya dan menaruh fokus di input nilai, agar guru bisa menilai satu kelas tanpa banyak klik.
- **UI-09-3** — Pintasan papan tik: `Enter` menyimpan & lanjut, `←`/`→` berpindah siswa. Tampilkan petunjuknya di layar.
- **UI-09-4** — Menilai ulang siswa yang sudah bernilai menampilkan nilai lama di input, bukan kosong. Backend memang menimpa (idempotent).
- **UI-09-5** — **Kegagalan sinkron spreadsheet tidak boleh terlihat seperti kegagalan menilai.** Bila backend membalas sukses tapi `syncedToSheet: false`, tampilkan nilai sebagai **tersimpan** disertai penanda kecil "menunggu sinkron". Jangan tampilkan galat merah — nilainya aman.
- **UI-09-6** — Panel status sinkron menampilkan berapa nilai belum tersinkron dan menyediakan tombol Sinkron Ulang. Setelah berhasil, penanda hilang.
- **UI-09-7** — Bila kelas belum punya ID Spreadsheet, tampilkan petunjuk mengaturnya (tautan ke pengaturan kelas di FE-03), bukan pesan galat.
- **UI-09-8** — Pratinjau PDF/gambar disematkan langsung agar guru tidak perlu mengunduh satu per satu. Tipe lain cukup tombol unduh.
- **UI-09-9** — Tautan berkas adalah signed URL berumur pendek. Bila pratinjau gagal karena kedaluwarsa, sediakan tombol muat ulang yang mengambil tautan baru.
- **UI-09-10** — Tugas kelompok: tampilkan peringatan bahwa nilai akan diterapkan ke **seluruh anggota**, sebutkan berapa orang.
- **UI-09-11** — Penilaian massal menampilkan kemajuan per siswa dan **ringkasan berapa sukses/gagal** di akhir. Satu gagal tidak membatalkan sisanya (backend memprosesnya independen).
- **UI-09-12** — Siswa hanya melihat nilainya sendiri; tidak ada peringkat, perbandingan, atau nilai teman di mana pun.
- **UI-09-13** — Pengumpulan yang belum dinilai ditandai jelas agar tidak terlewat; sediakan penyaring "belum dinilai".

## 5. File yang Dibuat

| File | Target |
|---|---|
| `src/routes/guru/Nilai.svelte` | < 130 |
| `src/routes/guru/NilaiTugas.svelte` | < 180 |
| `src/routes/siswa/Nilai.svelte` | < 100 |
| `src/lib/components/nilai/PratinjauBerkas.svelte` | < 100 |
| `src/lib/components/nilai/PanelSinkron.svelte` | < 80 |
| `src/lib/api/grading.ts` | < 60 |

## 6. Kriteria Penerimaan

- [ ] Guru menilai → nilai tersimpan, tampil di daftar siswa tersebut
- [ ] Masukkan nilai 150 pada tugas maxScore 100 → ditolak dengan keterangan batas
- [ ] Tugas maxScore 50 → batas input ikut 50, bukan 100
- [ ] "Simpan & Berikutnya" → pindah siswa, fokus langsung di input nilai
- [ ] Tekan `Enter` → tersimpan dan lanjut
- [ ] Nilai ulang siswa yang sudah dinilai → input berisi nilai lama
- [ ] Nilai tersimpan tapi sinkron gagal → tampil **tersimpan** + penanda menunggu sinkron, **bukan** galat merah
- [ ] Klik Sinkron Ulang → penanda hilang setelah berhasil
- [ ] Kelas tanpa ID Spreadsheet → tampil petunjuk pengaturan, bukan galat
- [ ] PDF siswa tampil tersemat tanpa perlu diunduh
- [ ] Signed URL kedaluwarsa → tombol muat ulang mengambil tautan baru
- [ ] Nilai tugas kelompok → peringatan menyebut jumlah anggota terdampak
- [ ] Penilaian massal 30 siswa → kemajuan tampil, ringkasan sukses/gagal di akhir
- [ ] Siswa buka halaman nilai → hanya nilainya sendiri, tanpa peringkat
- [ ] Saring "belum dinilai" → hanya yang belum tampil
