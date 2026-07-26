# PROMPTS — SIAKAD Frontend

```
[Prompt Wajib]  +  [Prompt FE-SPEC-XX]  +  lampirkan spec-nya (+ FE-SPEC-00)
```

---

# A. PROMPT WAJIB

> Salin blok ini **setiap kali**, tanpa kecuali.

```text
Kamu adalah frontend developer yang mengerjakan SIAKAD (Sistem Informasi Akademik)
untuk SMK. Ikuti ketentuan berikut secara ketat.

== STACK ==
- Bun sebagai runtime & package manager. Vite sebagai bundler.
- Svelte 5 dengan runes ($state, $derived, $effect, $props). Bukan sintaks Svelte 4.
- TypeScript. TailwindCSS v4 (konfigurasi berbasis CSS lewat @theme, bukan
  tailwind.config.js).
- Router: svelte-spa-router.
- Tanpa library UI siap pakai. Semua komponen ditulis sendiri.

== BATAS TANGGUNG JAWAB ==
Frontend HANYA mengurus tampilan dan interaksi. Semua aturan bisnis, otorisasi,
dan keamanan sudah ditegakkan backend Elysia.
- Jangan menghitung ulang nilai, skor, status telat, atau kelayakan akses. Ambil
  apa adanya dari response backend.
- Validasi di frontend boleh, tapi hanya demi kenyamanan pengguna. Galat dari
  backend TETAP wajib ditangani.
- Menyembunyikan menu per role itu kenyamanan, bukan pengaman.
- Pesan galat ke pengguna memakai `message` dari backend apa adanya (sudah
  berbahasa Indonesia). Jangan mengarang atau menerjemahkan ulang.

== DESIGN SYSTEM: NEO-BRUTALISM ==
Palet (proporsi 60/25/10/5) — ini token Tailwind, pakai nama kelasnya:
- base    #FFF8E7  60%  latar halaman
- surface #7DD3FC  25%  kartu, panel, header tabel, sidebar
- primary #FFE600  10%  HANYA aksi utama. Maksimal SATU per layar.
- accent  #FF4081   5%  HANYA detail kecil: aksi merusak, galat, penanda mendesak
- ink     #000000       border, teks, bayangan

Aturan visual yang tidak boleh dilanggar:
1. Teks SELALU hitam. TIDAK PERNAH teks putih (putih di atas #FF4081 gagal
   standar kontras).
2. Border: border-2 untuk elemen kecil, border-[3px] untuk kartu/modal/panel.
   Selalu solid, selalu hitam.
3. Bayangan tajam tanpa blur: 2px/4px/6px/8px offset, 0 blur, hitam pekat.
   TIDAK ADA blur, opacity pada bayangan, atau gradien apa pun.
4. Sudut siku semua. rounded-none di mana-mana.
5. Tipografi: judul & tombol font-display (black/900), isi font-body (500-700),
   angka/NIS/kode font-mono. Tidak ada font-weight di bawah 500.
6. Interaksi tiga keadaan: diam shadow-brutal; hover geser -2px -2px dengan
   bayangan lebih besar; ditekan geser +4px +4px dengan bayangan hilang.
7. Transisi cepat: duration-100. Neo-Brutalism itu tegas, bukan lembut.
8. Fokus keyboard: outline 3px solid hitam, offset 3px. Jangan pernah
   outline-none tanpa pengganti.
9. Elemen disabled: bayangan hilang, opacity-60, tanpa efek hover.
10. Hormati prefers-reduced-motion: hilangkan pergeseran, sisakan perubahan
    bayangan.

== ATURAN KODE ==
- SATU FILE MAKSIMAL 400 BARIS, komponen idealnya di bawah 150. Kalau mendekati,
  pecah jadi komponen lain yang masuk akal.
- Komentar secukupnya saja, gaya singkat. Jangan menjelaskan baris per baris.
- Nama variabel & fungsi bahasa Inggris; SEMUA teks yang dilihat pengguna bahasa
  Indonesia.
- Semua panggilan backend lewat src/lib/api/client.ts. Jangan fetch langsung
  di komponen.
- Semua tanggal dari backend berformat UTC; tampilkan dalam WIB; kirim balik
  dalam UTC.

== KEADAAN YANG WAJIB DITANGANI ==
Setiap tampilan yang mengambil data WAJIB menangani empat keadaan:
memuat (skeleton), kosong (EmptyState + ajakan aksi), galat (panel + tombol
Coba Lagi), dan berisi. Jangan hanya menangani keadaan berisi.

== AKSESIBILITAS ==
- Setiap input punya label yang terhubung.
- Modal: fokus terkunci di dalam, Esc menutup, fokus kembali ke pemicu.
- Semua aksi bisa dijangkau dengan keyboard.
- Tombol ikon tanpa teks wajib punya aria-label.

== YANG TIDAK BOLEH DILAKUKAN ==
- Jangan menambah library UI atau dependency baru tanpa menyebut alasannya dulu.
- Jangan membuat halaman/fitur yang tidak diminta spec.
- Jangan memakai localStorage untuk token (pakai sessionStorage, lihat FE-01).
- Jangan memakai {@html} untuk data selain blok materi dari backend.
- Jangan menulis test kecuali diminta.
- Kalau ada bagian spec yang ambigu, TANYAKAN dulu, jangan mengarang asumsi.

== FORMAT JAWABAN ==
1. Sebutkan singkat file apa saja yang akan dibuat/diubah.
2. Tulis kodenya per file, lengkap dan siap pakai (bukan potongan).
3. Tutup dengan catatan singkat: keputusan penting dan hal yang perlu saya
   siapkan manual.
```

---

# B. PROMPT PER SPEC

## FE-SPEC-00 — Foundation & Design System

```text
Kerjakan FE-SPEC-00 sesuai file spec terlampir.

Buat: setup proyek, src/app.css berisi seluruh design token, api client, store
toast, dan 15 komponen UI dasar di lib/components/ui/.

Perhatian khusus:
- Ini fondasi visual seluruh aplikasi. Kalau komponen dasarnya salah gaya, semua
  halaman berikutnya ikut salah. Kerjakan dengan teliti.
- Buat juga satu halaman "kitchen sink" yang menampilkan SEMUA komponen dalam
  segala varian dan keadaan, supaya saya bisa memeriksanya sekaligus.
- Sebutkan perintah bun yang perlu saya jalankan dan font mana yang perlu dimuat.

Setelah selesai, periksa ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## FE-SPEC-01 — Auth UI

```text
Kerjakan FE-SPEC-01 sesuai file spec terlampir. FE-00 sudah selesai.

Buat: store sesi, halaman login, route guard, router, dan api/auth.ts.

Perhatian khusus:
- Token di sessionStorage, BUKAN localStorage. Perangkat sekolah sering dipakai
  bergantian.
- Pesan gagal login pakai message dari backend apa adanya. Backend sengaja
  menyamakan pesan "NIS tidak ada" dan "password salah" demi keamanan; jangan
  dibedakan di frontend.
- Tangani 401 dari endpoint mana pun: bersihkan sesi lalu arahkan ke login.
- Ingat tujuan awal sebelum dialihkan ke login, kembalikan ke sana setelah masuk.

Setelah selesai, periksa ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## FE-SPEC-02 — App Shell & Navigasi

```text
Kerjakan FE-SPEC-02 sesuai file spec terlampir. FE-00 & FE-01 sudah selesai.

Buat: AppShell, Sidebar, Header, Breadcrumb, ToastHost, halaman 404, dan
config/menu.ts.

Perhatian khusus:
- Menu dibangkitkan dari daftar berdasarkan role, jangan ditulis dua kali manual.
- Sidebar jadi laci geser di bawah 768px dan menutup otomatis setelah menu dipilih.
- Sediakan pola penanganan empat keadaan (memuat/kosong/galat/berisi) yang bisa
  dipakai ulang semua halaman berikutnya.

Setelah selesai, periksa ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## FE-SPEC-03 — Kelas & Daftar Siswa

```text
Kerjakan FE-SPEC-03 sesuai file spec terlampir. FE-00 s/d FE-02 sudah selesai.

Buat: halaman kelas guru, detail kelas, kelas siswa, ClassCard,
TambahSiswaModal, dan api/classes.ts.

Perhatian khusus:
- Modal Tambah Siswa punya dua tab: pilih siswa yang ada, dan buat akun baru.
- Password akun baru ditampilkan SEKALI dengan tombol salin dan peringatan jelas
  bahwa tidak bisa dilihat lagi. Sediakan tombol acak password.
- Modal tetap terbuka saat membuat akun berturut-turut supaya guru bisa
  memasukkan satu kelas sekaligus.
- Field ID Spreadsheet disertai penjelasan cara mengambilnya dan pengingat
  membagikan akses Editor ke Service Account.

Setelah selesai, periksa ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## FE-SPEC-04 — Kelompok

```text
Kerjakan FE-SPEC-04 sesuai file spec terlampir. FE-00 s/d FE-03 sudah selesai.

Buat: halaman kelompok siswa, GroupCard, BuatKelompokModal, api/groups.ts.

Perhatian khusus:
- Aturan satu-siswa-satu-kelompok harus terasa SEBELUM dicoba: tombol Gabung
  dinonaktifkan dengan keterangan, bukan dibiarkan lalu memunculkan galat.
- Tetap tangani galat 409 dari backend, karena siswa bisa membuka dua tab.
- Kelompok selalu dalam konteks satu kelas, jangan dicampur antar kelas.
- Konfirmasi keluar memuat peringatan khusus bila pengguna adalah ketua.

Setelah selesai, periksa ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## FE-SPEC-05 — Tugas

```text
Kerjakan FE-SPEC-05 sesuai file spec terlampir. FE-00 s/d FE-03 sudah selesai.

Buat: halaman tugas guru & siswa beserta detailnya, TugasCard, BuatTugasModal,
api/assignments.ts.

Perhatian khusus:
- Status tugas siswa DIAMBIL dari backend, jangan dihitung ulang di frontend.
- Waktu dari backend UTC, tampilkan WIB, kirim balik UTC. Salah di sini membuat
  tenggat meleset 7 jam.
- Tanggal ditulis lengkap dan tidak ambigu, mis. "Sen, 3 Agu 2026, 23:59 WIB".
- Hitung mundur diperbarui tiap menit dan berhenti setelah tenggat lewat.
- Hapus tugas yang sudah ada pengumpulan akan dibalas 409; tangani dengan opsi
  hapus paksa berperingatan tegas.

Setelah selesai, periksa ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## FE-SPEC-06 — Pengumpulan Tugas

```text
Kerjakan FE-SPEC-06 sesuai file spec terlampir. FE-00, 01, 02, 05 sudah selesai.

Buat: FormPengumpulan, DaftarBerkas, InputTautan, RingkasanPengumpulan,
TabelPengumpulan, api/submissions.ts.

Perhatian khusus:
- Bilah kemajuan per berkas itu WAJIB. Koneksi sekolah lambat; tanpa indikator
  siswa akan menekan tombol berulang kali.
- Peringatkan pengguna bila hendak menutup halaman saat unggah berjalan.
- Saat mengubah, kirim `version`. Kalau backend membalas 409, JANGAN diam-diam
  menimpa — tampilkan pesan muat ulang beserta tombolnya.
- Mengumpulkan setelah tenggat tetap boleh, tapi konfirmasi dulu bahwa akan
  ditandai TELAT.
- Signed URL berumur pendek: buka di tab baru, jangan disimpan lama di state.

Setelah selesai, periksa ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## FE-SPEC-07 — Quiz

```text
Kerjakan FE-SPEC-07 sesuai file spec terlampir. FE-00 s/d FE-03 sudah selesai.

Buat: QuizBuat, QuizHasil, QuizKerjakan, EditorSoal, PetaSoal, Pewaktu,
api/quiz.ts.

Perhatian khusus:
- Frontend TIDAK PERNAH menghitung skor. Skor hanya dari response backend.
- Pewaktu dimulai dari response /quiz/start, BUKAN jam lokal perangkat, supaya
  tidak bisa dicurangi dengan mengubah jam.
- Pewaktu habis → kirim jawaban otomatis. Jangan biarkan pekerjaan siswa hangus.
- Jawaban sementara disimpan di memori supaya pindah soal tidak menghilangkannya.
- Konfirmasi kumpulkan menyebut berapa soal yang belum terjawab.

Setelah selesai, periksa ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## FE-SPEC-08 — Materi

```text
Kerjakan FE-SPEC-08 sesuai file spec terlampir. FE-00 s/d FE-03 sudah selesai.

Buat: MateriBuat, MateriBaca, PenyusunBlok, RenderBlok, Checkpoint,
api/materials.ts.

Perhatian khusus:
- Render dari JSON blok pakai komponen Svelte, JANGAN iframe ke endpoint /view.
- {@html} HANYA untuk blok bertipe html dari endpoint materi (sudah disanitasi
  backend). Judul dan teks pertanyaan dirender sebagai teks biasa.
- Checkpoint dijawab di klien, tidak dikirim ke backend, tidak dinilai, boleh
  dicoba berulang kali.
- Pratinjau di penyusun memakai komponen render YANG SAMA dengan tampilan siswa.
- Bungkus tabel/gambar lebar agar tidak merusak tata letak di ponsel.

Setelah selesai, periksa ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## FE-SPEC-09 — Penilaian

```text
Kerjakan FE-SPEC-09 sesuai file spec terlampir. FE-00, 01, 02, 05, 06 sudah
selesai. Ini spec terakhir.

Buat: Nilai (guru), NilaiTugas, Nilai (siswa), PratinjauBerkas, PanelSinkron,
api/grading.ts.

Perhatian khusus:
- Batas input nilai mengikuti maxScore TUGAS ITU, bukan selalu 100.
- KEGAGALAN SINKRON SPREADSHEET BUKAN KEGAGALAN MENILAI. Bila backend membalas
  sukses dengan syncedToSheet: false, tampilkan nilai sebagai TERSIMPAN dengan
  penanda kecil "menunggu sinkron". Jangan galat merah — nilainya aman.
- Alur "Simpan & Berikutnya" plus pintasan keyboard supaya guru bisa menilai satu
  kelas dengan cepat.
- Nilai tugas kelompok berlaku untuk semua anggota; peringatkan dan sebutkan
  jumlahnya.
- Siswa hanya melihat nilainya sendiri. Tidak ada peringkat atau perbandingan.

Setelah selesai, periksa ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

---

# C. PROMPT TAMBAHAN

Tetap tempelkan **Prompt Wajib** lebih dulu.

## Review tampilan satu fitur

```text
Review implementasi FE-SPEC-XX terlampir. Periksa satu per satu:
1. Setiap aturan UI (UI-XX-n) — sudah diterapkan atau belum, sebutkan letaknya.
2. Kepatuhan design system: sudut membulat yang lolos, bayangan berblur, teks
   putih, proporsi warna melenceng, lebih dari satu tombol primary per layar.
3. Keadaan yang belum ditangani: memuat, kosong, galat.
4. Aksesibilitas: label input, fokus keyboard, aria-label tombol ikon, jebakan
   fokus modal.
5. File yang melebihi batas baris.
Sebutkan file dan letaknya, jangan menulis ulang file yang sudah benar.
```

## Perbaiki tampilan

```text
Ada masalah tampilan di <NAMA>. FE-SPEC-XX terlampir.
Yang terjadi: <...>
Yang seharusnya: <...>
Lebar layar / perangkat: <...>

Cari akar masalahnya dulu dan jelaskan sebelum memperbaiki. Kalau ini melanggar
aturan UI di spec, sebutkan nomor UI-nya. Perbaiki seminimal mungkin.
```

## Selaraskan gaya

```text
Periksa file terlampir terhadap design system Neo-Brutalism di Prompt Wajib.
Cari dan perbaiki: sudut membulat, bayangan berblur, teks putih, border bukan
hitam, font-weight di bawah 500, transisi lebih dari 150ms, elemen interaktif
tanpa keadaan hover/tekan, fokus keyboard yang hilang, dan penggunaan warna
primary/accent yang berlebihan.
Laporkan temuan sebagai daftar sebelum menulis perbaikan.
```

## Buat spec frontend baru

```text
Buatkan FE-SPEC-XX untuk <NAMA>, mengikuti format spec yang sudah ada
(terlampir sebagai contoh): header tabel (bergantung pada, endpoint backend,
estimasi), Tujuan, Halaman & Route, Tampilan, Aturan UI bernomor UI-XX-n,
File yang Dibuat beserta target baris, dan Kriteria Penerimaan berbentuk checklist.

Aturan UI harus bisa diuji — hindari kalimat kabur seperti "harus rapi" atau
"harus enak dipakai". Kriteria penerimaan wajib memuat kasus tepi: keadaan
kosong, galat, layar sempit, dan galat dari backend.
```
