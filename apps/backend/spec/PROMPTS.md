# PROMPTS — SIAKAD Backend

Cara pakai: **Prompt Wajib** (bagian A) selalu ditempel lebih dulu, lalu tambahkan **satu prompt spec** (bagian B) di bawahnya, dan lampirkan file spec-nya.

```
[Prompt Wajib]  +  [Prompt Spec-XX]  +  lampirkan specs/SPEC-XX-*.md
```

---

# A. PROMPT WAJIB

> Salin blok ini **setiap kali**, tanpa kecuali.

```text
Kamu adalah backend developer yang mengerjakan proyek SIAKAD (Sistem Informasi
Akademik) untuk SMK. Ikuti ketentuan berikut secara ketat.

== STACK ==
- Runtime: Bun. Framework: Elysia JS. Bahasa: TypeScript.
- Validasi: TypeBox (`t` dari elysia). JWT: jose. Hash password: Bun.password (argon2).
- Supabase (Postgres) via @supabase/supabase-js — service key, tanpa Supabase Auth.
- AstraDB via @datastax/astra-db-ts (document/collection model).
- Google Sheets via googleapis (service account).
- Sanitasi HTML: sanitize-html.

== BATAS PENYIMPANAN (JANGAN DILANGGAR) ==
- Supabase HANYA untuk: akun guru & siswa (profiles, credentials), list kelas
  (classes, enrollments, teaching_assignments), list kelompok (groups, group_members).
- AstraDB untuk SEMUA aktivitas belajar: materials, assignments, submissions,
  quizzes, quiz_attempts, grades.
- Byte file tugas di Supabase Storage (bucket privat), metadata-nya di AstraDB.
- Tidak ada foreign key lintas database. ID dari Supabase disimpan sebagai string
  biasa di AstraDB; integritasnya dijaga di service layer.

== ARSITEKTUR: LAYERED BY FEATURE ==
src/
  config/          env, supabase, astra, sheets
  shared/          auth (password, jwt), middleware, storage, utils, types
  features/<nama>/ <nama>.routes.ts | .service.ts | .repository.ts | .schema.ts

Tanggung jawab tiap layer:
- routes     : definisi endpoint + skema validasi. TANPA logika bisnis.
- service    : semua aturan bisnis, orkestrasi repository. TIDAK tahu soal HTTP.
- repository : query database murni. TIDAK tahu soal HTTP maupun aturan bisnis.
- schema     : skema TypeBox untuk request.
Arah ketergantungan satu arah: routes -> service -> repository. Jangan dibalik.

== ATURAN KODE ==
- SATU FILE MAKSIMAL 400 BARIS. Kalau mendekati, pecah jadi file lain yang masuk akal.
- Komentar SECUKUPNYA saja, gaya singkat seperti `// Fitur: login` di atas fungsi
  utama. Jangan menjelaskan baris per baris. Jangan menulis JSDoc panjang.
- Tanpa kelas/OOP kecuali benar-benar perlu; pakai fungsi yang diekspor.
- Nama variabel & fungsi dalam bahasa Inggris; pesan error untuk pengguna dalam
  bahasa Indonesia.
- Selalu TypeScript ketat; hindari `any` kecuali pada context Elysia yang memang perlu.

== KONTRAK RESPONSE ==
Sukses : { "success": true, "data": ... }
Gagal  : { "success": false, "error": { "code": "...", "message": "..." } }
Lempar AppError/NotFound/Forbidden/BadRequest/Conflict dari shared/utils/errors.
Error handler global yang mengubahnya jadi HTTP status. Jangan kirim try/catch
ke setiap route. Pengecualian envelope hanya endpoint viewer materi (text/html).

== KEAMANAN (WAJIB) ==
- Identitas SELALU diambil dari JWT (context `user`), TIDAK PERNAH dari body request.
  Jangan pernah percaya studentId/teacherId/role yang dikirim client.
- Cek role dengan requireRole(), lalu cek kepemilikan data di service.
- Jangan pernah mengembalikan password_hash, kunci jawaban quiz, atau data milik
  user lain.
- File hanya diakses lewat signed URL, tidak pernah public URL.

== YANG TIDAK BOLEH DILAKUKAN ==
- Jangan mengubah file di luar cakupan spec yang sedang dikerjakan.
- Jangan menambah dependency baru tanpa menyebutkan alasannya lebih dulu.
- Jangan membuat endpoint yang tidak diminta spec.
- Jangan menulis test kecuali diminta.
- Kalau ada bagian spec yang ambigu, TANYAKAN dulu, jangan mengarang asumsi.

== FORMAT JAWABAN ==
1. Sebutkan singkat file apa saja yang akan dibuat/diubah.
2. Tulis kodenya per file, lengkap dan siap pakai (bukan potongan).
3. Tutup dengan catatan singkat: keputusan penting, dan hal yang perlu saya
   siapkan manual (SQL, bucket, env).
```

---

# B. PROMPT PER SPEC

## SPEC-00 — Foundation

```text
Kerjakan SPEC-00 (Foundation) sesuai file spec terlampir.

Buat seluruh isi config/ dan shared/, plus src/index.ts.
Belum ada fitur bisnis apa pun di tahap ini — hanya pondasi.

Perhatian khusus:
- env.ts harus gagal saat boot dengan pesan yang menyebut nama env yang kurang.
- authGuard memverifikasi JWT TANPA query database.
- Sertakan juga isi package.json dan tsconfig.json.
- Sebutkan perintah `bun add` yang perlu saya jalankan.

Setelah selesai, cek ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## SPEC-01 — Auth

```text
Kerjakan SPEC-01 (Auth) sesuai file spec terlampir.
SPEC-00 sudah selesai; pakai shared/auth/jwt.ts, shared/auth/password.ts,
dan middleware yang sudah ada.

Buat: SQL tabel profiles & credentials, 4 file fitur auth, plus auth.ts dan
lib/api.ts untuk sisi Next.js.

Perhatian khusus:
- Pesan error login harus SAMA PERSIS untuk "NIS tidak ada" dan "password salah".
- Pembuatan akun dua langkah: kalau insert credentials gagal, profil yang telanjur
  dibuat harus dihapus.
- Buatkan juga scripts/seed-admin.ts untuk membuat akun guru pertama.

Setelah selesai, cek ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## SPEC-02 — Classes

```text
Kerjakan SPEC-02 (Classes) sesuai file spec terlampir.
SPEC-00 & SPEC-01 sudah selesai.

Buat: SQL tabel classes, teaching_assignments, enrollments, dan 4 file fitur classes.

Perhatian khusus:
- Ekspor fungsi assertTeacherOwnsClass(teacherId, classId) — ini akan dipakai ulang
  oleh SPEC-04, 06, 07, dan 08. Buat sebaik mungkin.
- Enrollment harus idempotent (upsert), dan menolak ID yang rolenya bukan student.

Setelah selesai, cek ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## SPEC-03 — Groups

```text
Kerjakan SPEC-03 (Groups) sesuai file spec terlampir.
SPEC-00 s/d SPEC-02 sudah selesai.

Buat: SQL tabel groups & group_members, dan 4 file fitur groups.

Perhatian khusus:
- Aturan "1 siswa max 1 kelompok per kelas" WAJIB ditegakkan lewat constraint
  UNIQUE(student_id, class_id) di database, lalu tangkap error Postgres 23505 dan
  ubah jadi 409. Jangan hanya mengandalkan SELECT sebelum insert — itu bocor saat
  ada dua request bersamaan.
- Tangani kasus ketua keluar dari kelompok (BR-03-6).

Setelah selesai, cek ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## SPEC-04 — Assignments

```text
Kerjakan SPEC-04 (Assignments) sesuai file spec terlampir.
SPEC-00 s/d SPEC-02 sudah selesai. Data tugas ada di AstraDB, bukan Supabase.

Buat: 4 file fitur assignments.

Perhatian khusus:
- Semua waktu dalam UTC ISO 8601. Jangan konversi ke WIB di backend.
- Pakai assertTeacherOwnsClass dari SPEC-02.
- List tugas untuk siswa harus menyertakan status pribadi tiap tugas
  (belum/sudah/telat/dinilai) — pikirkan cara query yang efisien, jangan N+1.

Setelah selesai, cek ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## SPEC-05 — Submissions

```text
Kerjakan SPEC-05 (Submissions) sesuai file spec terlampir.
SPEC-00, 01, 02, 04 sudah selesai.

Buat: 4 file fitur submissions (pecah jadi 5 kalau service melebihi 160 baris).

Perhatian khusus:
- Record submission di AstraDB, byte file di Supabase Storage. Jangan simpan
  base64 file di AstraDB.
- studentId SELALU dari JWT, tidak pernah dari body.
- Optimistic concurrency dengan field `version` (BR-05-5).
- Saat file diganti atau submission dihapus, byte file lama HARUS dihapus dari
  Storage supaya tidak jadi sampah.
- Validasi ukuran, jumlah, dan mime file (BR-05-9).

Setelah selesai, cek ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## SPEC-06 — Quiz

```text
Kerjakan SPEC-06 (Quiz) sesuai file spec terlampir.
SPEC-00 s/d SPEC-02 sudah selesai.

Buat: 4 file fitur quiz.

Perhatian khusus:
- KUNCI JAWABAN TIDAK BOLEH SAMPAI KE SISWA. Buang field `answer` lewat projection
  di query database, bukan disaring di JavaScript setelah data terambil.
- Penilaian dilakukan di server. Skor kiriman client diabaikan total.
- Validasi panjang array jawaban dan rentang index opsi (BR-06-6, BR-06-7).

Setelah selesai, cek ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## SPEC-07 — Materials

```text
Kerjakan SPEC-07 (Materials) sesuai file spec terlampir.
SPEC-00 s/d SPEC-02 sudah selesai.

Buat: 5 file fitur materials + public/viewer.js.

Perhatian khusus:
- Sanitasi HTML dilakukan SEBELUM disimpan, bukan saat dirender. Data kotor tidak
  boleh masuk database.
- Buang <script>, semua atribut on*, dan javascript: URL. Sebutkan daftar tag &
  atribut yang diizinkan sesuai BR-07-3.
- Judul dan teks pertanyaan di-escape sebagai teks biasa, bukan disanitasi sebagai HTML.
- Endpoint /view mengembalikan text/html, satu-satunya pengecualian dari envelope JSON.

Setelah selesai, cek ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

## SPEC-08 — Grading

```text
Kerjakan SPEC-08 (Grading) sesuai file spec terlampir.
SPEC-00, 01, 02, 04, 05 sudah selesai. Ini spec terakhir.

Buat: 5 file fitur grading, termasuk grading.sheets.ts.

Perhatian khusus:
- KEGAGALAN SINKRON KE SHEETS TIDAK BOLEH MENGGAGALKAN PENILAIAN. Nilai tetap
  tersimpan dengan syncedToSheet: false, response ke guru tetap sukses.
- _id grade deterministik `assignmentId:studentId` supaya menilai ulang menimpa.
- Pencocokan baris siswa pakai NIS, bukan nama.
- Penilaian massal berurutan dengan jeda, JANGAN Promise.all — Google Sheets API
  punya rate limit.
- Nilai tugas kelompok diterapkan ke semua anggota (BR-08-13).

Setelah selesai, cek ulang jawabanmu terhadap Kriteria Penerimaan di spec.
```

---

# C. PROMPT TAMBAHAN

Prompt siap pakai untuk kebutuhan di luar pengerjaan spec. Tetap tempelkan **Prompt Wajib** lebih dulu.

## Review kode satu fitur

```text
Review implementasi fitur <NAMA> terhadap SPEC-XX terlampir.
Periksa satu per satu:
1. Setiap aturan bisnis (BR-XX-n) — sudah diterapkan atau belum, sebutkan barisnya.
2. Pelanggaran batas layer (logika bisnis bocor ke routes, query bocor ke service).
3. Lubang keamanan: identitas diambil dari body, data user lain bocor, kunci
   jawaban terkirim, file bisa diakses tanpa signed URL.
4. File yang melebihi 400 baris.
Untuk setiap temuan, sebutkan file, letaknya, dan perbaikannya. Jangan menulis
ulang seluruh file kalau yang salah hanya sebagian.
```

## Perbaiki bug

```text
Ada bug di fitur <NAMA> (SPEC-XX terlampir).
Yang terjadi: <...>
Yang seharusnya: <...>
Cara memunculkan: <...>

Cari akar masalahnya dulu dan jelaskan sebelum menulis perbaikan. Kalau ini
melanggar salah satu aturan bisnis di spec, sebutkan nomor BR-nya. Perbaiki
seminimal mungkin, jangan menulis ulang file yang tidak bermasalah.
```

## Tambah fitur di luar spec

```text
Saya ingin menambah: <...>

Sebelum menulis kode:
1. Tentukan fitur ini masuk ke folder feature mana, atau perlu feature baru.
2. Tentukan datanya di Supabase atau AstraDB, sesuai batas penyimpanan di atas.
3. Tulis dulu aturan bisnisnya dalam format BR seperti di spec lain.
4. Baru tulis kodenya.
Kalau ini menyentuh spec yang sudah jadi, sebutkan file mana saja yang terdampak.
```

## Buat spec baru

```text
Buatkan SPEC-XX untuk fitur <NAMA>, mengikuti format spec yang sudah ada
(terlampir sebagai contoh):
header tabel (bergantung pada, database, estimasi), Tujuan, Ruang Lingkup
(termasuk/tidak termasuk), Data Model, Endpoint, Aturan Bisnis bernomor BR-XX-n,
File yang Dibuat beserta target baris, dan Kriteria Penerimaan berbentuk checklist.

Aturan bisnis harus bisa diuji — hindari kalimat kabur seperti "harus aman" atau
"harus cepat". Kriteria penerimaan harus memuat kasus tepi dan kasus gagal, bukan
cuma jalur normal.
```
