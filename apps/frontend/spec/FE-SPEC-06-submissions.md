# FE-SPEC-06 — Pengumpulan Tugas (Unggah, Ubah, Hapus, Periksa)

| | |
|---|---|
| **Bergantung pada** | FE-00, FE-01, FE-02, FE-05 |
| **Endpoint backend** | `/submissions` (POST, PUT, DELETE), `/submissions/my/:id`, `/submissions/assignment/:id` |
| **Estimasi** | 6 file; halaman unggah paling rumit |

---

## 1. Tujuan

Siswa mengumpulkan tugas berupa **berkas dan/atau tautan**, bisa mengubah dan menghapusnya. Guru memeriksa seluruh pengumpulan satu tugas.

## 2. Tampilan

**Form pengumpulan (siswa)** di halaman detail tugas:
- Area seret-dan-lepas berkas: `border-[3px] border-dashed`, saat berkas ditarik ke atasnya latar berubah `primary`
- Daftar berkas terpilih: nama, ukuran, tombol hapus (`accent`)
- Bagian tautan: daftar input yang bisa ditambah/dikurangi
- Tombol Kumpulkan `variant primary`

**Setelah terkumpul:** kartu ringkasan berisi status, waktu pengumpulan, daftar berkas & tautan, tombol **Ubah** dan **Hapus**.

**Tampilan guru:** tabel pengumpulan — Nama, NIS, Status, Waktu, Berkas, tombol Nilai (FE-09). Disertai ringkasan "24 dari 30 siswa sudah mengumpulkan".

## 3. Aturan UI

- **UI-06-1** — Batas berkas ditegakkan **sebelum** unggah: maksimal 10 MB per berkas, 5 berkas, dan hanya tipe yang diizinkan (pdf, doc/docx, ppt/pptx, xls/xlsx, jpg, png, zip). Berkas yang melanggar ditolak dengan alasan spesifik, mis. "Laporan.exe — tipe tidak didukung".
- **UI-06-2** — Validasi ini **kenyamanan, bukan pengaman**. Galat dari backend tetap wajib ditangani.
- **UI-06-3** — Unggah menampilkan **bilah kemajuan per berkas**. Tugas 10 MB di koneksi sekolah bisa lama; tanpa indikator siswa akan menekan tombol berulang kali.
- **UI-06-4** — Selama unggah berjalan, tombol Kumpulkan nonaktif dan **peringatan muncul bila pengguna hendak menutup halaman**.
- **UI-06-5** — Ukuran berkas ditulis mudah dibaca ("2,4 MB"), bukan jumlah byte.
- **UI-06-6** — Tautan divalidasi berawalan `http://` atau `https://`; bila pengguna menempel "drive.google.com/..." tanpa skema, lengkapi otomatis jadi `https://`.
- **UI-06-7** — Tombol Kumpulkan nonaktif selama **tidak ada** berkas maupun tautan.
- **UI-06-8** — Mengumpulkan **setelah tenggat** tetap diizinkan, tapi didahului konfirmasi: "Tenggat sudah lewat. Tugas akan ditandai TELAT. Lanjutkan?"
- **UI-06-9** — Saat mengubah, `version` dari pengumpulan **wajib** ikut dikirim. Bila backend membalas `409`, tampilkan "Data sudah berubah di perangkat lain. Muat ulang untuk melihat versi terbaru" beserta tombol muat ulang — jangan diam-diam menimpa.
- **UI-06-10** — Mengubah berkas memberi peringatan bahwa berkas lama akan **terhapus permanen**.
- **UI-06-11** — Menghapus pengumpulan memakai `ConfirmDialog` bernada tegas dan tombol `accent`.
- **UI-06-12** — Pengumpulan berstatus `Dinilai` tidak lagi menampilkan tombol Ubah/Hapus; ganti dengan keterangan "Sudah dinilai, tidak bisa diubah".
- **UI-06-13** — Tautan berkas dari backend berupa **signed URL** berumur pendek. Buka di tab baru dengan `rel="noopener"`, dan **jangan** disimpan di state jangka panjang karena akan kedaluwarsa.
- **UI-06-14** — Tugas kelompok: bila pengguna bukan ketua, form diganti keterangan "Dikumpulkan oleh ketua kelompok" beserta status terkini kelompoknya.
- **UI-06-15** — Tabel guru bisa disaring: semua / sudah / telat / belum mengumpulkan.

## 4. File yang Dibuat

| File | Target |
|---|---|
| `src/lib/components/submission/FormPengumpulan.svelte` | < 180 |
| `src/lib/components/submission/DaftarBerkas.svelte` | < 90 |
| `src/lib/components/submission/InputTautan.svelte` | < 70 |
| `src/lib/components/submission/RingkasanPengumpulan.svelte` | < 100 |
| `src/lib/components/submission/TabelPengumpulan.svelte` | < 140 |
| `src/lib/api/submissions.ts` | < 70 |

Bila `FormPengumpulan` melewati 180 baris, pecah logika unggah ke `useUpload.svelte.ts`.

## 5. Kriteria Penerimaan

- [ ] Seret 2 berkas ke area unggah → keduanya masuk daftar dengan ukuran terbaca
- [ ] Area unggah berubah warna saat berkas ditarik ke atasnya
- [ ] Pilih berkas 15 MB → ditolak dengan alasan jelas sebelum terkirim
- [ ] Pilih berkas `.exe` → ditolak menyebut nama berkasnya
- [ ] Kumpulkan tanpa berkas & tanpa tautan → tombol nonaktif
- [ ] Unggah berkas besar → bilah kemajuan bergerak
- [ ] Coba tutup tab saat unggah → muncul peringatan
- [ ] Tempel "drive.google.com/x" → otomatis jadi `https://drive.google.com/x`
- [ ] Kumpulkan setelah tenggat → konfirmasi TELAT dulu, lalu status jadi Telat
- [ ] Ubah dari dua tab → tab kedua dapat `409` dan pesan muat ulang, data tidak tertimpa
- [ ] Ubah berkas → ada peringatan berkas lama terhapus
- [ ] Pengumpulan sudah dinilai → tombol Ubah/Hapus hilang
- [ ] Guru buka tabel → semua pengumpulan tampil, berkas bisa diunduh
- [ ] Saring "belum mengumpulkan" → hanya siswa itu yang tampil
- [ ] Ringkasan "n dari m siswa" cocok dengan isi tabel
- [ ] Anggota kelompok bukan ketua → melihat keterangan, bukan form
