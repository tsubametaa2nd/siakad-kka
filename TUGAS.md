# LAPORAN PERANCANGAN DAN IMPLEMENTASI SISTEM INFORMATION & LEARNING MANAGEMENT SYSTEM (NGAJAR / SIAKAD KKA)

---

## BAB I PENDAHULUAN

### 1.1 Latar Belakang
Perkembangan teknologi informasi dalam dunia pendidikan menuntut adanya platform manajemen pembelajaran (*Learning Management System* / LMS) dan sistem informasi akademik yang tidak hanya fleksibel, tetapi juga memiliki kinerja tinggi, responsif, serta dapat diandalkan secara konsisten. Pada lembaga pendidikan modern, proses pembelajaran tidak lagi terbatas pada interaksi tatap muka di dalam kelas, melainkan mencakup pembagian materi digital, pengumpulan tugas mandiri maupun kelompok, pelaksanaan kuis daring, hingga rekapitulasi penilaian secara otomatis.

Dalam membangun sistem manajemen pembelajaran berukuran menengah hingga besar, tantangan utama terletak pada struktur data yang beragam. Di satu sisi, terdapat data transaksional berstruktur ketat yang membutuhkan integritas tinggi (*ACID compliance*), seperti data pengguna, peran (*roles*), keanggotaan kelas, dan pembagian kelompok siswa. Di sisi lain, terdapat data konten edukasi yang dinamis dan berukuran bervariasi, seperti deskripsi tugas, opsi kuis, tautan pengumpulan, serta berkas lampiran.

Untuk menjawab tantangan tersebut, dirancanglah platform **"Ngajar" (SIAKAD KKA)**. Platform ini memanfaatkan pendekatan *Hybrid Database Architecture* dengan menggabungkan basis data relasional (**Supabase PostgreSQL**) dan basis data dokumen NoSQL (**DataStax AstraDB**). Selain itu, sistem diarsitekturkan menggunakan model *Monorepo* dengan runtime modern berbasis **Bun** dan kerangka kerja web **ElysiaJS** pada *backend*, serta **Svelte 5** dan **Vite** pada *frontend*. Seluruh lingkungan eksekusi dikemas menggunakan teknologi *containerization* **Docker** untuk menjamin konsistensi antara lingkungan pengembangan (*development*) dan lingkungan produksi (*production*).

---

### 1.2 Rumusan Masalah
Berdasarkan latar belakang di atas, rumusan masalah dalam pembangunan sistem ini adalah:
1. Bagaimana merancang arsitektur sistem LMS yang *scalable* dan *decoupled* dengan memisahkan data relasional transaksional dan data dokumen konten secara optimal?
2. Bagaimana mengimplementasikan teknologi kontainerisasi **Docker** dan **Docker Compose** agar seluruh layanan aplikasi dapat dijalankan, terisolasi, dan saling terhubung dengan mudah?
3. Bagaimana mengonfigurasi pemetaan port (*port mapping*) dan manajemen kredensial lingkungan (*environment variables*) agar koneksi antar layanan berjalan aman dan tepat?
4. Bagaimana mengimplementasikan fitur CRUD (*Create, Read, Update, Delete*) lengkap mencakup autentikasi, manajemen kelas, kelompok belajar, materi pembelajaran, tugas, pengumpulan (*submission*), kuis, dan penilaian?
5. Bagaimana menangani kendala teknis jaringan seperti koneksi terputus (*stream reset*) pada basis data NoSQL cloud secara otomatis?

---

### 1.3 Tujuan
Tujuan dari pembuatan dan penyusunan laporan sistem ini adalah:
1. Membangun platform pembelajaran digital "Ngajar" berbasis web yang modern, cepat, dan intuitif untuk Guru, Siswa, dan Administrator.
2. Mengimplementasikan arsitektur *Hybrid Database* menggunakan Drizzle ORM (Supabase PostgreSQL) untuk data relasional dan DataStax AstraDB API untuk data dokumen.
3. Melakukan kontainerisasi *backend* aplikasi menggunakan Docker serta mempermudah pengujian dan penggelaran (*deployment*) melalui Docker Compose.
4. Menyediakan analisis mendalam terkait mekanisme penemuan basis data (*service discovery*), pemetaan port host-to-container, dan pengamanan kredensial lingkungan.
5. Menyajikan laporan teknis komprehensif yang dilengkapi diagram arsitektur dan ERD berbasis Mermaid JS.

---

### 1.4 Batasan Masalah
Pengembangan sistem ini dibatasi pada batasan-batasan berikut:
1. **Peran Pengguna**: Pengguna terbagi menjadi tiga peran utama, yaitu **Admin** (pengelola sistem & kelas), **Guru** (pengampu mata pelajaran, pembuat materi/tugas/kuis, penilai), dan **Siswa** (peserta kelas, anggota kelompok, pengumpul tugas/kuis).
2. **Lingkungan Docker**: Fokus kontainerisasi berpusat pada layanan *backend* (Bun + ElysiaJS API) dan integrasi layanannya ke basis data cloud (Supabase & AstraDB).
3. **Autentikasi**: Menggunakan algoritma enkripsi password **Argon2** dan JSON Web Token (**JWT**) terenkripsi dengan durasi *session* yang aman.
4. **Penyimpanan Berkas**: Menggunakan integrasi Google Drive API / Supabase Storage untuk penanganan berkas lampiran materi dan pengumpulan tugas.

---

## BAB II LANDASAN TEORI

### 2.1 Metodologi Pengembangan & Manajemen Kebutuhan Sistem

Metodologi pengembangan yang diterapkan pada proyek **Ngajar (SIAKAD KKA)** memadukan pendekatan **Agile Software Development** berbasis **Product Backlog** dan **Software Requirements Specification (SRS)** dengan prinsip **Component-Driven Development (CDD)** dalam arsitektur **Monorepo**.

```mermaid
graph TD
    subgraph Agile Requirements Engineering
        A[Software Requirements Specification - SRS] --> B[Product Backlog & User Stories]
        B --> C[Requirement Traceability Matrix - RTM]
    end

    subgraph Development Architecture - Monorepo & CDD
        C --> D[apps/frontend - Svelte 5 CDD]
        C --> E[apps/backend - ElysiaJS APIs]
        C --> F[Hybrid DB - Postgres & AstraDB]
    end
```

#### 2.1.1 Metodologi Agile & Pengelolaan Kebutuhan (SRS & Backlog)
**Agile Software Development** adalah pendekatan pengembangan perangkat lunak secara iteratif dan inkremental, yang berfokus pada kolaborasi, adaptabilitas terhadap perubahan, dan penyampaian fitur bermanfaat secara bertahap. Pengelolaan kebutuhan sistem dilakukan dengan menyusun spesifikasi formal **Software Requirements Specification (SRS)** berdasarkan standar IEEE 830 / ISO/IEC/IEEE 29148 dan diturunkan ke dalam **Product Backlog** berformat *User Story*.

#### 2.1.2 Tabel Software Requirements Specification (SRS) Fitur Terimplementasi

Berikut adalah daftar spesifikasi kebutuhan perangkat lunak (SRS) untuk seluruh fitur yang telah selesai diimplementasikan pada web platform **Ngajar (SIAKAD KKA)**:

| SRS ID | Modul Fitur Web | Spesifikasi Kebutuhan Sistem (SRS Statement) | Target Peran | Kategori |
| :--- | :--- | :--- | :--- | :---: |
| **FR-AUTH-01** | Autentikasi | Sistem menyediakan formulir login berbasis identitas (*username/NIP/NIS*) dan kata sandi. | Admin, Guru, Siswa | Fungsional |
| **FR-AUTH-02** | Autentikasi | Sistem memverifikasi kata sandi via **Argon2id** dan menerbitkan token **JWT** terenkripsi. | System | Fungsional |
| **FR-AUTH-03** | Autentikasi | Sistem membatasi rute web berdasarkan peran pengguna (**ADMIN**, **GURU**, **SISWA**). | Admin, Guru, Siswa | Fungsional |
| **FR-AUTH-04** | Autentikasi | Sistem dapat merestorasi profil pengguna yang aktif via endpoint `/api/auth/me`. | Admin, Guru, Siswa | Fungsional |
| **FR-CLS-01** | Kelas | Admin/Guru dapat membuat kelas akademik baru, menentukan tahun ajaran & wali kelas. | Admin, Guru | Fungsional |
| **FR-CLS-02** | Kelas | Pengguna dapat melihat daftar kelas yang diampu (Guru) atau diikuti (Siswa). | Guru, Siswa | Fungsional |
| **FR-CLS-03** | Kelas | Sistem mendukung pendaftaran siswa (*enrollment*) kelas tanpa duplikasi data. | Guru, Siswa | Fungsional |
| **FR-CLS-04** | Kelas | Guru dapat menautkan ID Google Spreadsheet pada kelas untuk sinkronisasi rekap nilai. | Guru | Fungsional |
| **FR-GRP-01** | Kelompok | Pengguna dapat membuat kelompok belajar baru di kelas dengan kuota `max_members`. | Guru, Siswa | Fungsional |
| **FR-GRP-02** | Kelompok | Siswa dapat bergabung (*join*) atau keluar (*leave*) dari kelompok belajar. | Siswa | Fungsional |
| **FR-GRP-03** | Kelompok | Ketua kelompok (*leader*) dapat mengelola keanggotaan kelompoknya. | Siswa (Leader) | Fungsional |
| **FR-MAT-01** | Materi | Guru dapat mempublikasikan modul materi pembelajaran beserta lampiran berkas/tautan. | Guru | Fungsional |
| **FR-MAT-02** | Materi | Siswa dapat mengakses, membaca, dan mengunduh berkas materi pembelajaran kelas. | Siswa | Fungsional |
| **FR-TSK-01** | Tugas | Guru dapat membuat penugasan (Individu/Kelompok) dengan instruksi & *due date*. | Guru | Fungsional |
| **FR-TSK-02** | Tugas | Siswa dapat mengunggah hasil pekerjaan tugas berupa berkas/tautan sebelum deadline. | Siswa | Fungsional |
| **FR-TSK-03** | Tugas | Guru dapat memantau status pengumpulan tugas siswa per kelas secara real-time. | Guru | Fungsional |
| **FR-QZ-01** | Kuis | Guru dapat merancang kuis interaktif pilihan ganda dengan durasi timer menit. | Guru | Fungsional |
| **FR-QZ-02** | Kuis | Siswa dapat mengerjakan kuis interaktif dengan penunjuk waktu mundur & auto-submit. | Siswa | Fungsional |
| **FR-QZ-03** | Kuis | Siswa dapat melihat peringkat skor tertinggi kelas melalui halaman **Quiz Leaderboard**. | Siswa | Fungsional |
| **FR-GRD-01** | Penilaian | Guru dapat memberikan nilai angka (0–100) dan catatan evaluasi (*feedback*) pada tugas. | Guru | Fungsional |
| **FR-GRD-02** | Penilaian | Siswa dapat melihat rekapitulasi nilai tugas dan kuis beserta umpan balik guru. | Siswa | Fungsional |
| **FR-SET-01** | Pengaturan | Pengguna dapat memperbarui kata sandi akun dengan verifikasi kata sandi lama. | Admin, Guru, Siswa | Fungsional |

---

#### 2.1.3 Tabel Product Backlog Fitur Terimplementasi (Agile User Stories)

Daftar **Product Backlog** berikut merangkum *User Story* dan *Acceptance Criteria* untuk seluruh fitur yang telah dibangun dan diuji pada aplikasi web:

| Backlog ID | Modul Web | User Story (Agile Format) | Kriteria Penerimaan (Acceptance Criteria) | Status Terimplementasi |
| :--- | :--- | :--- | :--- | :---: |
| **PB-AUTH-01** | Auth | *As a user, I want to login with my username/NIP/NIS so that I can access my dashboard.* | - Input kredensial divalidasi Argon2id.<br>- Menghasilkan token JWT saat login sukses.<br>- Pesan error ditampilkan jika login gagal. | **100% Selesai** |
| **PB-AUTH-02** | Auth | *As a system, I want to restrict unauthorized access so that users only see appropriate pages.* | - Middleware `RouteGuard.svelte` memverifikasi token & role.<br>- Redirect otomatis ke login/home jika tidak berhak. | **100% Selesai** |
| **PB-CLS-01** | Kelas | *As a teacher, I want to view my class list and homeroom assignment so that I can manage my students.* | - Menampilkan kartu daftar kelas diampu.<br>- Menampilkan daftar siswa enrolled & wali kelas. | **100% Selesai** |
| **PB-CLS-02** | Kelas | *As an admin/teacher, I want to create a new class so that academic groups can be initialized.* | - Form input nama kelas, grade level, & tahun ajaran.<br>- Penetapan wali kelas dari daftar profil guru. | **100% Selesai** |
| **PB-GRP-01** | Kelompok | *As a student/teacher, I want to create a study group so that we can collaborate on group assignments.* | - Form membuat kelompok dengan batas `max_members`.<br>- Pembuat kelompok otomatis menjadi `leader`. | **100% Selesai** |
| **PB-GRP-02** | Kelompok | *As a student, I want to join or leave a study group so that I can pick my team.* | - Tombol Join/Leave kelompok berfungsi interaktif.<br>- Validasi kuota mencegah kelebihan anggota. | **100% Selesai** |
| **PB-MAT-01** | Materi | *As a teacher, I want to upload and share learning materials so that students can study.* | - Form judul, instruksi, & URL berkas lampiran.<br>- Tersimpan di AstraDB NoSQL collection `materials`. | **100% Selesai** |
| **PB-MAT-02** | Materi | *As a student, I want to read class materials online so that I can learn the subject.* | - Halaman `MateriBaca.svelte` menampilkan modul & lampiran.<br>- Tautan berkas lampiran dapat dibuka/diunduh. | **100% Selesai** |
| **PB-TSK-01** | Tugas | *As a teacher, I want to create assignments with due dates so that students know their task timeline.* | - Setting judul tugas, instruksi, & tanggal tenggat.<br>- Opsi penugasan tipe Individu atau Kelompok. | **100% Selesai** |
| **PB-TSK-02** | Tugas | *As a student, I want to submit my assignment solution so that my teacher can evaluate it.* | - Form submit URL / berkas pengumpulan.<br>- Status pengumpulan tersimpan di AstraDB `submissions`. | **100% Selesai** |
| **PB-QZ-01** | Kuis | *As a teacher, I want to create multiple-choice quizzes so that I can test student comprehension.* | - Builder kuis untuk membuat bank soal & pilihan jawaban.<br>- Pengaturan durasi pengerjaan kuis (menit). | **100% Selesai** |
| **PB-QZ-02** | Kuis | *As a student, I want to take quizzes with a countdown timer so that I can get instant score feedback.* | - Antarmuka kuis interaktif dengan timer mundur.<br>- Auto-submit otomatis jika timer habis. | **100% Selesai** |
| **PB-QZ-03** | Kuis | *As a student, I want to view the quiz leaderboard so that I can see my class ranking.* | - Halaman `QuizLeaderboard.svelte` menampilkan skor tertinggi.<br>- Pemeringkatan otomatis berdasarkan skor & waktu. | **100% Selesai** |
| **PB-GRD-01** | Penilaian | *As a teacher, I want to grade submissions and write feedback so that students know their performance.* | - Input nilai angka (0-100) & kolom saran/feedback.<br>- Data rekap tersimpan di AstraDB `grades`. | **100% Selesai** |
| **PB-GRD-02** | Penilaian | *As a student, I want to see my grades and feedback summary so that I can track my academic progress.* | - Halaman rekapitulasi nilai tugas & kuis per mata pelajaran.<br>- Menampilkan umpan balik tertulis dari guru. | **100% Selesai** |
| **PB-SET-01** | Pengaturan | *As a user, I want to update my password so that my account stays secure.* | - Form update password pada `Pengaturan.svelte`.<br>- Re-hashing password baru menggunakan Argon2id. | **100% Selesai** |

---

#### 2.1.4 Component-Driven Development (CDD) & Monorepo
* **Component-Driven Development (CDD)**: Metode pembangunan antarmuka berbasis komponen independen, modular, dan dapat digunakan kembali (*reusable*).
* **Monorepo (Turborepo)**: Struktur repositori tunggal yang memuat kode *frontend* (`apps/frontend`), *backend* (`apps/backend`), dan paket berbagi data (`packages/shared`), mempermudah konsistensi tipe data TypeScript (*shared types*) dan mempercepat alur integrasi (*CI/CD*).

#### 2.1.5 Matriks Ringkasan Metodologi & Arsitektur Pengembangan

| Konsep / Artefak | Standar / Metode | Deskripsi & Peran dalam Proyek Ngajar |
| :--- | :--- | :--- |
| **Agile Software Development** | Iterative & Incremental Framework | Pendekatan pengembangan dinamis untuk memfasilitasi iterasi fitur secara cepat dan adaptif. |
| **Software Requirements Specification (SRS)** | IEEE 830 / ISO/IEC/IEEE 29148 | Spesifikasi Kebutuhan Fungsional (`FR-AUTH` s/d `FR-SET`) & Non-Fungsional (`NFR`) sebagai acuan sistem. |
| **Product Backlog & User Stories** | Agile Requirements Artifact | Daftar terurut fitur sistem berbasis sudut pandang peran (*User Story*) & *Acceptance Criteria*. |
| **Requirement Traceability Matrix (RTM)** | Traceability & Scope Management | Matriks pelacakan 1-ke-1 dari SRS ID ke Rute Frontend, API Backend, dan Entitas Basis Data. |
| **Component-Driven Development (CDD)** | Modular UI Architecture | Metode perancangan komponen antarmuka Svelte 5 yang modular dan dapat digunakan kembali (*reusable*). |
| **Monorepo Architecture** | Turborepo Workspaces | Pengelolaan proyek terpusat (`apps/frontend`, `apps/backend`, `packages/shared`) dalam satu repositori. |

---

### 2.2 Containerization & Docker
*Containerization* adalah teknologi virtualisasi tingkat sistem operasi yang memungkinkan suatu aplikasi dikemas bersama seluruh pustaka (*dependencies*), konfigurasi, dan *runtime environment*-nya ke dalam satu unit terisolasi yang disebut **Container**.

```mermaid
graph TB
    subgraph Host Machine OS
        subgraph Docker Engine
            subgraph Container Backend
                App[ElysiaJS App]
                Runtime[Bun 1.2 Alpine Runtime]
            end
        end
    end
    Container Backend -->|Virtual Bridge Network| ExternalDB[(Cloud Databases)]
```

Beberapa konsep kunci Docker yang digunakan meliputi:
* **Dockerfile**: Berkas teks berisi serangkaian instruksi otomatis untuk membangun *Docker Image*. Pada proyek ini digunakan basis *image* `oven/bun:1.2-alpine` yang sangat ringan dan efisien.
* **Docker Image**: Template *read-only* yang memuat kode sumber, runtime, pustaka, dan variabel lingkungan.
* **Docker Container**: Unit eksekusi (*run-time instance*) dari Docker Image.
* **Docker Compose (`compose.yaml`)**: Alat untuk mendefinisikan dan menjalankan aplikasi multi-kontainer Docker. Melalui Docker Compose, konfigurasi pemetaan port, pembuatan jaringan internal (*bridge network*), pembacaan variabel lingkungan (`.env`), dan pengujian kesehatan (*healthcheck*) dapat dikelola secara deklaratif.

---

### 2.3 Basis Data Relasional & NoSQL
Proyek ini mengadopsi model **Hybrid Database** untuk mengoptimalkan kinerja dan fleksibilitas penyimpanan:

1. **Basis Data Relasional (Supabase PostgreSQL)**:
   Menggunakan model data relasional yang memenuhi prinsip ACID (*Atomicity, Consistency, Isolation, Durability*). Diimplementasikan menggunakan **Drizzle ORM** untuk mengelola entitas yang memiliki hubungan struktural kuat, seperti profil pengguna, kredensial login, data kelas, pendaftaran siswa (*enrollments*), dan keanggotaan kelompok.

2. **Basis Data Dokumenter NoSQL (DataStax AstraDB)**:
   AstraDB adalah basis data NoSQL berbasis Apache Cassandra dengan antarmuka Data API (JSON Document Store). Digunakan untuk menyimpan dokumen dinamis yang fleksibel seperti detail materi pembelajaran, deskripsi & instruksi tugas, pengumpulan tugas (*submissions*), bank soal kuis, serta rekap nilai.

---

### 2.4 Tumpukan Teknologi yang Dipakai

| Layer / Kategori | Teknologi | Deskripsi & Peran |
| :--- | :--- | :--- |
| **Frontend Framework** | Svelte 5 + Vite | Framework UI modern dengan konsep kompilasi reaktif & perilisan state terbaru (Runes `$state`). |
| **Frontend Styling** | Tailwind CSS v4 | Utility-first CSS framework untuk perancangan antarmuka yang responsif dan estetis. |
| **Backend Runtime** | Bun 1.2 | JavaScript & TypeScript runtime super cepat pengganti Node.js. |
| **Backend Framework** | ElysiaJS | Framework web TypeScript berkinerja tinggi yang dirancang khusus untuk Bun dengan dukungan OpenAPI/Swagger bawaan. |
| **Relational Database** | Supabase PostgreSQL | Layanan PostgreSQL cloud untuk manajemen data relasional terstruktur. |
| **ORM** | Drizzle ORM | ORM TypeScript type-safe untuk interaksi cepat dengan PostgreSQL. |
| **NoSQL Database** | DataStax AstraDB | Basis data dokumen NoSQL cloud berkinerja tinggi berbasis Cassandra API. |
| **Security & Auth** | Argon2 + JWT (`jose`) | Hashing kata sandi tingkat lanjut dengan Argon2id dan verifikasi token JWT. |
| **Containerization** | Docker & Docker Compose | Pengemasan lingkungan eksekusi backend dan automasi konsistensi runtime. |

---

## BAB III ANALISIS PERANCANGAN

### 3.1 Analisis Kebutuhan & Spesifikasi Sistem (SRS & Backlog)

Proses analisis kebutuhan dilakukan untuk memetakan seluruh kebutuhan sistem dari sudut pandang pemangku kepentingan (*stakeholders*), mencakup **Admin**, **Guru**, dan **Siswa**. Seluruh kebutuhan fungsional dan non-fungsional didefinisikan ke dalam **Software Requirements Specification (SRS)**, yang kemudian diturunkan menjadi **Product Backlog** berbasis *User Stories* dan terhubung secara eksplisit ke komponen antarmuka web serta rute API backend melalui **Requirement Traceability Matrix (RTM)**.

---

#### 3.1.1 Software Requirements Specification (SRS)

##### A. Kebutuhan Fungsional (Functional Requirements)

1. **Modul Autentikasi & Manajemen Sesi (AUTH)**
   * **FR-AUTH-01**: Sistem harus menyediakan antarmuka login berbasis *username/NIP/NIS* dan *password*.
   * **FR-AUTH-02**: Sistem harus melakukan verifikasi kata sandi menggunakan enkripsi **Argon2id** dan menerbitkan JSON Web Token (**JWT**) terenkripsi.
   * **FR-AUTH-03**: Sistem harus mengamankan rute web berdasarkan peran pengguna (**ADMIN**, **GURU**, **SISWA**) melalui *Route Guard* di sisi *frontend* dan *Auth Middleware* di sisi *backend*.
   * **FR-AUTH-04**: Sistem harus dapat menyediakan endpoint `/api/auth/me` untuk mengembalikan data identitas profil pengguna yang sedang aktif (*session restoration*).

2. **Modul Manajemen Kelas & Akademik (CLS)**
   * **FR-CLS-01**: Admin/Guru dapat membuat kelas akademik baru, menentukan tingkat kelas, tahun ajaran, dan menetapkan Wali Kelas (*homeroom teacher*).
   * **FR-CLS-02**: Pengguna dapat melihat daftar kelas yang diampu (bagi Guru) atau kelas yang diikuti (bagi Siswa).
   * **FR-CLS-03**: Sistem harus mendukung pendaftaran siswa (*enrollment*) ke dalam kelas dengan indeks unik untuk mencegah pendaftaran ganda.
   * **FR-CLS-04**: Guru dapat menautkan ID Google Spreadsheet (*spreadsheet_id*) pada detail kelas untuk keperluan sinkronisasi nilai rekapitulasi.

3. **Modul Manajemen Kelompok Belajar (GRP)**
   * **FR-GRP-01**: Guru atau Siswa dapat membuat kelompok belajar baru di dalam suatu kelas dengan menentukan batas kapasitas maksimal anggota (*max_members*).
   * **FR-GRP-02**: Siswa dapat memilih dan bergabung ke dalam kelompok yang masih memiliki kuota anggota.
   * **FR-GRP-03**: Ketua kelompok (*leader*) dapat mengelola keanggotaan kelompok, memindahkan kepemimpinan, atau menghapus anggota.
   * **FR-GRP-04**: Siswa dapat keluar (*leave*) dari kelompok belajar selama pengumpulan tugas kelompok belum diselesaikan.

4. **Modul Materi Pembelajaran (MAT)**
   * **FR-MAT-01**: Guru dapat membuat, menyunting, dan menghapus modul materi pembelajaran lengkap dengan judul, deskripsi rich-text, dan lampiran berkas/tautan luar.
   * **FR-MAT-02**: Siswa dapat mengakses, membaca, dan mengunduh berkas materi pembelajaran yang telah dipublikasikan oleh Guru di kelasnya.
   * **FR-MAT-03**: Sistem harus menyimpan konten dokumen materi secara dinamis pada basis data NoSQL AstraDB collection `materials`.

5. **Modul Tugas & Pengumpulan / Submission (TSK)**
   * **FR-TSK-01**: Guru dapat membuat penugasan (*assignment*) baru dengan menentukan judul, deskripsi/instruksi, tenggat waktu (*due date*), serta tipe penugasan (Individu / Kelompok).
   * **FR-TSK-02**: Siswa dapat mengunggah hasil pekerjaan tugas berupa berkas lampiran / tautan URL (*content_url*) sebelum batas waktu berakhir.
   * **FR-TSK-03**: Sistem harus mencatat status pengumpulan (`SUBMITTED` / `GRADED`) serta waktu submit (*submitted_at*) pada AstraDB collection `submissions`.
   * **FR-TSK-04**: Guru dapat melihat daftar rekap pengumpulan tugas siswa per kelas secara *real-time*.

6. **Modul Kuis Interaktif & Leaderboard (QZ)**
   * **FR-QZ-01**: Guru dapat merancang kuis interaktif pilihan ganda (*multiple choice*), menentukan durasi pengerjaan (dalam menit), serta menambahkan bank soal.
   * **FR-QZ-02**: Siswa dapat mengerjakan kuis interaktif dengan penunjuk waktu mundur (*countdown timer*) dan opsi pengiriman jawaban otomatis jika durasi habis.
   * **FR-QZ-03**: Sistem harus menghitung skor kuis secara otomatis setelah disubmit dan menyimpannya pada AstraDB collection `quiz_attempts`.
   * **FR-QZ-04**: Siswa dapat melihat peringkat skor tertinggi kelas melalui fitur **Quiz Leaderboard**.

7. **Modul Penilaian & Feedback (GRD)**
   * **FR-GRD-01**: Guru dapat memberikan nilai angka (skala 0–100) dan catatan evaluasi (*feedback*) pada setiap pengumpulan tugas siswa.
   * **FR-GRD-02**: Sistem harus menyimpan data rekap nilai pada AstraDB collection `grades`.
   * **FR-GRD-03**: Siswa dapat melihat rekapitulasi nilai tugas dan kuis beserta umpan balik dari Guru pada halaman Nilai.
   * **FR-GRD-04**: Sistem menyediakan fitur ekspor/sync rekap nilai kelas ke Google Spreadsheet.

8. **Modul Pengaturan & Profil Pengguna (SET)**
   * **FR-SET-01**: Pengguna dapat melihat rincian informasi profil (Nama Lengkap, NIP/NIS, Peran, Username).
   * **FR-SET-02**: Pengguna dapat memperbarui kata sandi akun dengan memasukkan kata sandi lama dan kata sandi baru.

---

##### B. Kebutuhan Non-Fungsional (Non-Functional Requirements)

* **NFR-SEC-01 (Keamanan Enkripsi)**: Kata sandi pengguna wajib di-hash menggunakan algoritma **Argon2id** dan token otentikasi ditandatangani secara kriptografis menggunakan **JWT**.
* **NFR-SEC-02 (CORS & Middlewares)**: Komunikasi API dilindungi oleh mekanisme CORS terpusat yang membatasi *origin* hanya ke domain terdaftar (`.vercel.app`, `.utaaa.my.id`).
* **NFR-PERF-01 (Performa & Latensi)**: Runtime Bun 1.2 dan framework ElysiaJS harus merespon API request dengan rata-rata waktu tanggap (*response time*) < 50ms.
* **NFR-REL-01 (Keandalan Jaringan DB)**: Implementasi mekanisme *Exponential Backoff Retry* untuk menangani potensi terputusnya koneksi socket (*stream timeout*) pada AstraDB cloud.
* **NFR-PORT-01 (Portabilitas)**: Backend dikemas dalam Docker Image berbasis `oven/bun:1.2-alpine` sehingga dapat di-deploy secara konsisten di seluruh lingkungan platform.
* **NFR-USAB-01 (Antarmuka & Reaktivitas)**: Antarmuka dibangun menggunakan Svelte 5 dengan *Runes reactive state* (`$state`, `$derived`) untuk memberikan transisi halus dan responsif.

---

#### 3.1.2 Product Backlog & User Stories

Berikut adalah daftar **Product Backlog** yang disusun berdasarkan kebutuhan fungsional di atas:

| Backlog ID | Epic / Modul | User Story | Acceptance Criteria | Prioritas | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **PB-AUTH-01** | Auth | *As a user, I want to login with my credentials so that I can access my personalized dashboard.* | - Form login menerima username & password.<br>- Token JWT diterbitkan jika valid.<br>- Error 401 jika kredensial salah. | High | **Done** |
| **PB-AUTH-02** | Auth | *As a system, I want to restrict route access based on role so that unauthorized users cannot open admin/teacher pages.* | - Middleware memeriksa JWT & Role.<br>- Redirect otomatis jika role tidak sesuai. | High | **Done** |
| **PB-CLS-01** | Kelas | *As a teacher, I want to view and manage my assigned classes so that I can deliver course content effectively.* | - Menampilkan kartu daftar kelas.<br>- Menampilkan detail wali kelas & daftar siswa. | High | **Done** |
| **PB-CLS-02** | Kelas | *As an admin/teacher, I want to create new classes and assign homeroom teachers so that academic structures are maintained.* | - Form pembuatan kelas dengan nama & tahun ajaran.<br>- Dropdown mendaftarkan wali kelas. | Medium | **Done** |
| **PB-GRP-01** | Kelompok | *As a student/teacher, I want to create study groups with max member limit so that collaborative work is organized.* | - Form membuat kelompok baru.<br>- Menentukan batas maksimum anggota (`max_members`). | Medium | **Done** |
| **PB-GRP-02** | Kelompok | *As a student, I want to join or leave a study group so that I can work with my peers.* | - Tombol Join/Leave kelompok.<br>- Validasi kuota jika kelompok sudah penuh. | Medium | **Done** |
| **PB-MAT-01** | Materi | *As a teacher, I want to publish learning materials with file links so that students can study the topics.* | - Form input judul, instruksi, & URL berkas.<br>- Tersimpan otomatis di AstraDB `materials`. | High | **Done** |
| **PB-MAT-02** | Materi | *As a student, I want to read and download class materials so that I can review course lessons.* | - Halaman daftar & detail baca materi.<br>- Tautan berkas/lampiran dapat dibuka/diunduh. | High | **Done** |
| **PB-TSK-01** | Tugas | *As a teacher, I want to create assignments with due dates so that students know their homework obligations.* | - Input judul, deskripsi, & due date.<br>- Pilihan tipe tugas (Individu / Kelompok). | High | **Done** |
| **PB-TSK-02** | Tugas | *As a student, I want to submit assignment links before the deadline so that I get evaluated.* | - Form submit URL / berkas pengumpulan.<br>- Status berubah menjadi `SUBMITTED`. | High | **Done** |
| **PB-QZ-01** | Kuis | *As a teacher, I want to create interactive quizzes with multiple-choice questions so that I can test student comprehension.* | - Builder kuis dengan opsi jawaban & kunci.<br>- Setting durasi waktu pengerjaan (menit). | High | **Done** |
| **PB-QZ-02** | Kuis | *As a student, I want to answer quiz questions with a live timer so that I can submit my work in time.* | - Antarmuka kuis interaktif dengan timer.<br>- Auto-submit jika waktu habis. | High | **Done** |
| **PB-QZ-03** | Kuis | *As a student, I want to see the class quiz leaderboard so that I can benchmark my performance.* | - Halaman leaderboard menampilkan skor tertinggi.<br>- Urutan berdasarkan skor & waktu selesainya. | Medium | **Done** |
| **PB-GRD-01** | Penilaian | *As a teacher, I want to grade submissions and provide text feedback so that students know their performance.* | - Input nilai 0–100 & kolom catatan feedback.<br>- Rekap tersimpan di AstraDB `grades`. | High | **Done** |
| **PB-GRD-02** | Penilaian | *As a student, I want to view my grades and feedback summary so that I can evaluate my learning progress.* | - Rekapitulasi nilai tugas & kuis per mata pelajaran.<br>- Menampilkan feedback dari guru. | High | **Done** |
| **PB-SET-01** | Pengaturan | *As a user, I want to change my account password so that my account remains secure.* | - Form pengubahan kata sandi.<br>- Validasi kata sandi lama via Argon2id. | Medium | **Done** |

---

#### 3.1.3 Requirement Traceability Matrix (RTM)

Tabel berikut menghubungkan **Kode SRS (FR)**, **Product Backlog (PB)**, komponen antarmuka web pada **Frontend Svelte 5**, endpoint API pada **Backend ElysiaJS**, dan entitas penyimpanannya pada **Basis Data Hybrid**:

| SRS ID | Backlog ID | Fitur Utama Web | Route / Komponen Frontend (Svelte 5) | Endpoint Backend (ElysiaJS API) | Entitas Basis Data Target | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **FR-AUTH-01** | PB-AUTH-01 | Login Pengguna | `src/routes/Login.svelte` | `POST /api/auth/login` | PostgreSQL (`credentials`, `profiles`) | **Done** |
| **FR-AUTH-02** | PB-AUTH-01 | Verifikasi JWT & Session | `src/lib/components/RouteGuard.svelte` | `POST /api/auth/login` | Encrypted JWT Payload | **Done** |
| **FR-AUTH-04** | PB-AUTH-01 | Restore User Profile | `src/lib/logic/auth/useAuth.svelte.ts` | `GET /api/auth/me` | PostgreSQL (`profiles`) | **Done** |
| **FR-CLS-01** | PB-CLS-01 | Manajemen & Detail Kelas | `src/routes/guru/KelasDetail.svelte` | `GET /api/classes/:id` | PostgreSQL (`classes`, `profiles`) | **Done** |
| **FR-CLS-02** | PB-CLS-02 | Pembuatan Kelas Baru | `src/routes/guru/Kelas.svelte` | `POST /api/classes` | PostgreSQL (`classes`, `teaching_assignments`) | **Done** |
| **FR-CLS-03** | PB-CLS-01 | Daftar Kelas Siswa | `src/routes/siswa/KelasSaya.svelte` | `GET /api/classes` | PostgreSQL (`enrollments`, `classes`) | **Done** |
| **FR-GRP-01** | PB-GRP-01 | Pembentukan Kelompok | `src/lib/components/kelompok/CreateGroupModal.svelte` | `POST /api/groups` | PostgreSQL (`groups`, `group_members`) | **Done** |
| **FR-GRP-02** | PB-GRP-02 | Join / Leave Kelompok | `src/routes/siswa/Kelompok.svelte` | `POST /api/groups/:id/join`<br>`POST /api/groups/:id/leave` | PostgreSQL (`group_members`) | **Done** |
| **FR-MAT-01** | PB-MAT-01 | Pembuatan Modul Materi | `src/routes/guru/MateriBuat.svelte` | `POST /api/materials` | AstraDB Collection `materials` | **Done** |
| **FR-MAT-02** | PB-MAT-02 | Pembacaan Materi Siswa | `src/routes/siswa/MateriBaca.svelte` | `GET /api/materials/:id` | AstraDB Collection `materials` | **Done** |
| **FR-TSK-01** | PB-TSK-01 | Pembuatan Tugas | `src/routes/guru/TugasDetail.svelte` | `POST /api/assignments` | AstraDB Collection `assignments` | **Done** |
| **FR-TSK-02** | PB-TSK-02 | Pengumpulan Tugas Siswa | `src/routes/siswa/TugasDetail.svelte` | `POST /api/submissions` | AstraDB Collection `submissions` | **Done** |
| **FR-QZ-01** | PB-QZ-01 | Pembuat Kuis Interaktif | `src/routes/guru/QuizBuat.svelte` | `POST /api/quizzes` | AstraDB Collection `quizzes` | **Done** |
| **FR-QZ-02** | PB-QZ-02 | Pengerjaan Kuis Siswa | `src/routes/siswa/QuizKerjakan.svelte` | `POST /api/quizzes/:id/submit` | AstraDB Collection `quiz_attempts` | **Done** |
| **FR-QZ-04** | PB-QZ-03 | Leaderboard Kuis | `src/routes/siswa/QuizLeaderboard.svelte` | `GET /api/quizzes/:id/leaderboard` | AstraDB Collection `quiz_attempts` | **Done** |
| **FR-GRD-01** | PB-GRD-01 | Penilaian Submission | `src/routes/guru/NilaiTugas.svelte` | `POST /api/grading` | AstraDB Collection `grades` | **Done** |
| **FR-GRD-03** | PB-GRD-02 | Rekap Nilai Siswa | `src/routes/siswa/Nilai.svelte` | `GET /api/grading/student` | AstraDB Collection `grades` | **Done** |
| **FR-SET-01** | PB-SET-01 | Pengaturan Password | `src/routes/guru/Pengaturan.svelte`<br>`src/routes/siswa/Pengaturan.svelte` | `POST /api/auth/change-password` | PostgreSQL (`credentials`) | **Done** |

---


### 3.2 Perancangan Basis Data

#### a) ERD Lengkap (Hybrid Relational & Document Schema)

Berikut adalah diagram Entity Relationship (ERD) gabungan antara struktur relasional (PostgreSQL) dan struktur koleksi dokumen (AstraDB):

```mermaid
erDiagram
    %% ENTITAS RELASIONAL (SUPABASE POSTGRESQL)
    PROFILES ||--o{ CREDENTIALS : "has login"
    PROFILES ||--o{ CLASSES : "homeroom teacher of"
    PROFILES ||--o{ TEACHING_ASSIGNMENTS : "teaches"
    CLASSES ||--o{ TEACHING_ASSIGNMENTS : "assigned to"
    PROFILES ||--o{ ENROLLMENTS : "enrolled as student"
    CLASSES ||--o{ ENROLLMENTS : "contains"
    CLASSES ||--o{ GROUPS : "has groups"
    PROFILES ||--o{ GROUPS : "led by"
    GROUPS ||--o{ GROUP_MEMBERS : "has members"
    PROFILES ||--o{ GROUP_MEMBERS : "is member"
    CLASSES ||--o{ GROUP_MEMBERS : "belongs to class"

    PROFILES {
        uuid id PK
        string full_name
        string role "ADMIN | GURU | SISWA"
        string identifier "NIP / NIS"
        timestamp created_at
    }

    CREDENTIALS {
        uuid id PK
        uuid profile_id FK
        string username UK
        string password_hash
    }

    CLASSES {
        uuid id PK
        string name
        string grade_level
        string academic_year
        uuid homeroom_teacher_id FK
        string spreadsheet_id
        timestamp created_at
    }

    TEACHING_ASSIGNMENTS {
        uuid id PK
        uuid class_id FK
        uuid teacher_id FK
    }

    ENROLLMENTS {
        uuid id PK
        uuid student_id FK
        uuid class_id FK
        timestamp enrolled_at
    }

    GROUPS {
        uuid id PK
        string name
        uuid class_id FK
        uuid leader_id FK
        int max_members
        timestamp created_at
    }

    GROUP_MEMBERS {
        uuid id PK
        uuid group_id FK
        uuid student_id FK
        uuid class_id FK
        timestamp joined_at
    }

    %% KOLEKSI DOKUMEN (ASTRADB NOSQL)
    MATERIALS ||--o{ CLASSES : "linked to class_id"
    ASSIGNMENTS ||--o{ CLASSES : "linked to class_id"
    SUBMISSIONS ||--o{ ASSIGNMENTS : "belongs to assignment_id"
    SUBMISSIONS ||--o{ PROFILES : "submitted by student_id"
    QUIZZES ||--o{ CLASSES : "linked to class_id"
    QUIZ_ATTEMPTS ||--o{ QUIZZES : "attempt of quiz_id"
    GRADES ||--o{ SUBMISSIONS : "grades submission_id"

    MATERIALS {
        string _id PK
        string class_id
        string title
        string description
        array attachments
        timestamp created_at
    }

    ASSIGNMENTS {
        string _id PK
        string class_id
        string title
        string instruction
        timestamp due_date
        timestamp created_at
    }

    SUBMISSIONS {
        string _id PK
        string assignment_id
        string student_id
        string group_id
        string content_url
        string status "SUBMITTED | GRADED"
        timestamp submitted_at
    }

    QUIZZES {
        string _id PK
        string class_id
        string title
        array questions
        timestamp created_at
    }

    QUIZ_ATTEMPTS {
        string _id PK
        string quiz_id
        string student_id
        int score
        timestamp completed_at
    }

    GRADES {
        string _id PK
        string submission_id
        string student_id
        float grade_value
        string feedback
        timestamp graded_at
    }
```

---

#### b) Deskripsi Tiap Tabel & Koleksi

##### 1. Tabel Relasional (Supabase PostgreSQL via Drizzle ORM)

1. `profiles`: Menyimpan data identitas pengguna dasar.
   * `id` (UUID, Primary Key): ID unik pengguna.
   * `full_name` (Text): Nama lengkap pengguna.
   * `role` (Text): Peran pengguna (`ADMIN`, `GURU`, `SISWA`).
   * `identifier` (Text): NIP untuk guru/admin, NIS untuk siswa.
   * `created_at` (Timestamp): Waktu akun dibuat.

2. `credentials`: Menyimpan data autentikasi sensitif.
   * `id` (UUID, Primary Key): ID unik kredensial.
   * `profile_id` (UUID, Foreign Key -> `profiles.id`): Referensi pengguna.
   * `username` (Text, Unique): Username unik untuk login.
   * `password_hash` (Text): Hash kata sandi menggunakan Argon2id.

3. `classes`: Menyimpan informasi kelas akademik.
   * `id` (UUID, Primary Key): ID unik kelas.
   * `name` (Text): Nama kelas (misal: "X RPL 1").
   * `grade_level` (Text): Tingkat kelas (misal: "10", "11", "12").
   * `academic_year` (Text): Tahun ajaran (misal: "2025/2026").
   * `homeroom_teacher_id` (UUID, Foreign Key -> `profiles.id`): Wali kelas.
   * `spreadsheet_id` (Text, Optional): ID integrasi Google Spreadsheet.

4. `teaching_assignments`: Pemetaan guru dengan kelas yang diampu.
   * `id` (UUID, Primary Key).
   * `class_id` (UUID, Foreign Key -> `classes.id`).
   * `teacher_id` (UUID, Foreign Key -> `profiles.id`).

5. `enrollments`: Pemetaan pendaftaran siswa ke kelas.
   * `id` (UUID, Primary Key).
   * `student_id` (UUID, Foreign Key -> `profiles.id`).
   * `class_id` (UUID, Foreign Key -> `classes.id`).
   * Indeks Unik: (`student_id`, `class_id`) mencegah pendaftaran ganda.

6. `groups`: Data kelompok belajar siswa dalam suatu kelas.
   * `id` (UUID, Primary Key).
   * `name` (Text): Nama kelompok.
   * `class_id` (UUID, Foreign Key -> `classes.id`).
   * `leader_id` (UUID, Foreign Key -> `profiles.id`): Ketua kelompok.
   * `max_members` (Integer): Kapasitas maksimal anggota.

7. `group_members`: Data anggota kelompok belajar.
   * `id` (UUID, Primary Key).
   * `group_id` (UUID, Foreign Key -> `groups.id`).
   * `student_id` (UUID, Foreign Key -> `profiles.id`).
   * `class_id` (UUID, Foreign Key -> `classes.id`).

##### 2. Koleksi Dokumen NoSQL (DataStax AstraDB API)

1. `materials`: Menyimpan berkas dan instruksi materi pembelajaran.
   * Document Schema: `{ _id, class_id, title, content, links, files, created_at }`
2. `assignments`: Menyimpan data penugasan dari guru.
   * Document Schema: `{ _id, class_id, title, description, due_date, created_at }`
3. `submissions`: Menyimpan hasil pengumpulan tugas siswa.
   * Document Schema: `{ _id, assignment_id, student_id, group_id, file_url, text_submission, submitted_at }`
4. `quizzes`: Menyimpan bank soal dan opsi kuis interaktif.
   * Document Schema: `{ _id, class_id, title, duration_minutes, questions: [{ question_text, options, correct_option }] }`
5. `quiz_attempts`: Menyimpan data percobaan pengerjaan kuis siswa.
   * Document Schema: `{ _id, quiz_id, student_id, answers, score, submitted_at }`
6. `grades`: Menyimpan rekap nilai tugas dan umpan balik guru.
   * Document Schema: `{ _id, submission_id, teacher_id, score, feedback, graded_at }`

---

### 3.3 Perancangan Arsitektur Sistem

Sistem dirancang dengan arsitektur *Client-Server Decoupled* yang saling terhubung melalui RESTful API berformat JSON.

```mermaid
graph TD
    subgraph Client Layer
        A[Browser / Client] -->|HTTP / HTTPS| B[Svelte 5 Frontend - Port 5173]
    end

    subgraph Container Layer Docker
        B -->|REST API Calls| C[ElysiaJS Backend Container - Port 4000]
        C --> D[Auth Middleware - Argon2 & JWT]
        C --> E[Error Handler & Logger]
    end

    subgraph Data & Cloud Services Layer
        C -->|Drizzle ORM / Postgres JS| F[(Supabase PostgreSQL)]
        C -->|DataAPI Client HTTP| G[(DataStax AstraDB NoSQL)]
        C -->|Google REST API| H[Google Drive / Sheet API]
    end
```

Alur Eksekusi Data:
1. Client mengirim permintaan HTTP ke Frontend Svelte 5.
2. Frontend meneruskan request ke Backend ElysiaJS (Port 4000).
3. Middleware backend memverifikasi Token JWT pada header `Authorization`.
4. Jika request memerlukan data relasional (user, kelas, kelompok), backend berkomunikasi dengan **Supabase PostgreSQL** via Drizzle ORM.
5. Jika request memerlukan dokumen konten (materi, tugas, kuis), backend berkomunikasi dengan **DataStax AstraDB** via Data API HTTP client.
6. Hasil diolah dan dikembalikan dalam format JSON terstandar kepada client.

---

## BAB IV IMPLEMENTASI

### 4.1 Implementasi Lingkungan Docker

#### 4.3.1 Struktur Folder Project
Proyek diorganisir menggunakan struktur *Turborepo Monorepo* sebagai berikut:

```text
ngajar/
├── apps/
│   ├── backend/
│   │   ├── api/                # Entrypoint API Vercel / Serverless
│   │   ├── src/
│   │   │   ├── config/         # Konfigurasi env & AstraDB client
│   │   │   ├── db/             # Schema Drizzle & Postgres client
│   │   │   ├── features/       # Feature modules (auth, classes, materials, dll)
│   │   │   ├── shared/         # Middlewares, utils, response helpers
│   │   │   └── index.ts        # Server entrypoint Bun/ElysiaJS
│   │   ├── .dockerignore
│   │   ├── .env
│   │   ├── Dockerfile          # Instruksi Build Docker Alpine Bun
│   │   ├── docker-compose.yml  # Definisi Service Docker Compose
│   │   ├── drizzle.config.ts   # Konfigurasi Migration Drizzle
│   │   └── package.json
│   └── frontend/
│       ├── src/                # Komponen & Route Svelte 5
│       ├── package.json
│       └── vite.config.ts
├── package.json                # Root Turborepo config
├── turbo.json                  # Turborepo task pipeline
└── TUGAS.md                    # Laporan Sistem
```

---

#### 4.3.2 Dockerfile
Berikut adalah implementasi berkas `Dockerfile` pada `apps/backend/Dockerfile`:

```dockerfile
# Use official Bun lightweight Alpine image
FROM oven/bun:1.2-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency manifest
COPY package.json ./

# Install dependencies
RUN bun install --production

# Copy application files
COPY src ./src
COPY public ./public
COPY api ./api
COPY tsconfig.json drizzle.config.ts banner-nino-color.txt ./

# Expose port
EXPOSE 3000

# Environment defaults
ENV PORT=4000
ENV NODE_ENV=production

# Command to run backend
CMD ["bun", "run", "api/index.ts"]
```

**Penjelasan Baris Dockerfile:**
* `FROM oven/bun:1.2-alpine`: Menggunakan *base image* resmi Bun versi 1.2 berbasis Linux Alpine yang berukuran sangat kecil (< 90MB) dan cepat.
* `WORKDIR /app`: Menetapkannya sebagai direktori kerja utama di dalam kontainer.
* `COPY package.json ./` & `RUN bun install --production`: Mengisolasi instalasi *dependencies* hanya untuk *production packages* agar ukuran image efisien.
* `COPY src ./src ...`: Menyalin kode sumber dan konfigurasi backend ke dalam image.
* `EXPOSE 3000`: Mendeklarasikan bahwa aplikasi di dalam kontainer mendengarkan lalu lintas pada port 3000 (sebagai dokumentasi metadata image).
* `ENV PORT=4000` & `ENV NODE_ENV=production`: Menyetel variabel lingkungan standar runtime.
* `CMD ["bun", "run", "api/index.ts"]`: Menentukan perintah utama yang akan dieksekusi saat kontainer dijalankan.

---

#### 4.3.3 compose.yaml (`docker-compose.yml`)
Berikut adalah isi dari berkas `apps/backend/docker-compose.yml`:

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: kka-backend
    restart: unless-stopped
    ports:
      - "4000:4000"
    env_file:
      - .env
    environment:
      - PORT=4000
      - NODE_ENV=production
    healthcheck:
      test: ["CMD-SHELL", "bun --eval 'fetch(\"http://localhost:4000/health\").then(r => process.exit(r.ok ? 0 : 1))'"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 5s
```

**Penjelasan Konfigurasi:**
* `context: .` & `dockerfile: Dockerfile`: Mendorong build image secara lokal dari direktori backend.
* `container_name: kka-backend`: Memberikan nama spesifik pada kontainer Docker yang berjalan.
* `restart: unless-stopped`: Kebijakan restart otomatis apabila kontainer mengalami crash kecuali dihentikan secara manual.
* `ports: - "4000:4000"`: Memetakan port Host `4000` ke port Kontainer `4000`.
* `env_file: - .env`: Menginjeksi seluruh variabel lingkungan dari berkas `.env` lokal ke dalam kontainer.
* `healthcheck`: Pengujian berkala tiap 15 detik menggunakan perintah evaluasi `fetch` bawaan Bun ke endpoint `/health` untuk memastikan aplikasi merespon dengan status HTTP 200 OK.

---

#### 4.3.4 Konfigurasi Koneksi Aplikasi ke Database

##### a) Bagaimana aplikasi bisa "menemukan" basis data?
Aplikasi *backend* menemukan basis data melalui **Connection String** dan **Endpoint URL** yang disuntikkan (*injected*) dari variabel lingkungan saat kontainer dihidupkan:

1. **Penemuan Supabase PostgreSQL**:
   Backend membaca variabel `SUPABASE_URL` dan `SUPABASE_SERVICE_KEY` atau `DATABASE_URL`. Berkas [`apps/backend/src/db/index.ts`](file:///c:/project-uta/ngajar/apps/backend/src/db/index.ts) mengekstrak *project reference* dari URL Supabase dan membentuk URI koneksi PostgreSQL Direct/Connection Pooler:
   `postgresql://postgres.[project_ref]:[service_key]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
   Driver `postgres` (Postgres.js) membuka *TCP Socket Connection* langsung menuju server PostgreSQL Supabase via jaringan internet atau VPC.

2. **Penemuan DataStax AstraDB**:
   Backend membaca `ASTRA_DB_ENDPOINT` (misal: `https://[db-id]-[region].apps.astra.datastax.com`) dan `ASTRA_DB_TOKEN`. Berkas [`apps/backend/src/config/astra.ts`](file:///c:/project-uta/ngajar/apps/backend/src/config/astra.ts) menginisialisasi `DataAPIClient` yang melakukan jabat tangan (*handshake*) HTTP/2 ke API Cloud AstraDB.

3. **Penemuan Layanan dalam Jaringan Docker (Internal DNS)**:
   Jika basis data dijalankan sebagai kontainer terpisah dalam `compose.yaml` (misal service bernama `db`), Docker secara otomatis menyediakan **Embedded DNS Server**. Aplikasi di dalam kontainer `backend` dapat menemukan basis data cukup dengan memanggil nama servicenya (contoh: `postgres://user:pass@db:5432/dbname`), di mana nama host `db` akan diterjemahkan oleh Docker menjadi IP internal kontainer basis data tersebut.

---

##### b) Fungsi tiap port yang di-mapping & perbedaan Port Sebelah Kiri vs Port Sebelah Kanan
Pemetaan port dinyatakan dalam format **`HOST_PORT : CONTAINER_PORT`** (contoh: `8080:80`, `3306:3306`, `8081:80`, `4000:4000`).

```mermaid
graph LR
    subgraph External Host World
        Browser[Client Browser / Host User]
    end

    subgraph Host Operating System
        HostPort[Host Port: 8080 / 4000]
    end

    subgraph Docker Engine NAT Firewall
        HostPort -->|Port Forwarding / NAT| ContPort[Container Port: 80 / 4000]
    end

    subgraph Isolation Container
        ContPort --> AppProcess[Internal App Process / Web Server]
    end

    Browser -->|http://localhost:8080| HostPort
```

* **Port Sebelah Kiri (`HOST_PORT`)**:
  Adalah port yang dibuka dan mendengarkan lalu lintas di tingkat **Sistem Operasi Host (Komputer Fisik / Server)**. Port inilah yang diakses oleh pengguna luar atau aplikasi lain dari luar kontainer (contoh: `http://localhost:8080` atau `http://localhost:4000`).
* **Port Sebelah Kanan (`CONTAINER_PORT`)**:
  Adalah port internal yang didengarkan oleh proses aplikasi di dalam **Lingkungan Terisolasi Kontainer**. Aplikasi di dalam kontainer tidak menyadari port host tempat ia dipetakan, ia hanya mendengarkan port internalnya sendiri.

**Analisis Contoh Pemetaan Port:**
1. **`8080:80`**:
   * **Port Kiri (8080)**: Pengguna mengakses web melalui `http://localhost:8080` di browser komputer host.
   * **Port Kanan (80)**: Mesin Nginx/Web Server di dalam kontainer menerima permintaan tersebut pada port standar HTTP 80.
   * **Fungsi**: Memungkinkan server web internal (port 80) dapat diakses di komputer host tanpa bentrok dengan port 80 milik layanan lain di host.
2. **`3306:3306`**:
   * **Port Kiri (3306)**: Port MySQL/MariaDB pada komputer host.
   * **Port Kanan (3306)**: Port default service MySQL di dalam kontainer.
   * **Fungsi**: Memungkinkan aplikasi GUI basis data dari luar (seperti DBeaver/HeidiSQL) terhubung langsung ke MySQL kontainer.
3. **`8081:80`**:
   * **Port Kiri (8081)**: Port alternatif pada host (misal untuk layanan web kedua seperti phpMyAdmin / Adminer).
   * **Port Kanan (80)**: Port internal web server pada kontainer kedua.
   * **Fungsi**: Menjalankan dua kontainer web server ber-port internal 80 secara bersamaan di host yang sama dengan membedakan port kirinya (`8080` dan `8081`).
4. **`4000:4000` (Port pada proyek Ngajar)**:
   * **Port Kiri (4000)**: Aplikasi frontend atau Postman mengirim request API ke `http://localhost:4000`.
   * **Port Kanan (4000)**: Server ElysiaJS di dalam kontainer mendengar request pada `ENV PORT=4000`.

---

##### c) Mengapa kredensial di `compose.yaml` harus sama dengan yang di `.env`?
Kredensial pada `compose.yaml` (melalui variabel `environment` atau `env_file`) dan berkas `.env` **wajib sama** karena alasan-alasan teknis berikut:

1. **Konsistensi Lingkungan Eksekusi (Runtime Mismatch Prevention)**:
   Aplikasi membaca konfigurasi kredensial basis data (*username, password, database name, token secret*) saat proses *inialisasi koneksi*. Jika kredensial di `compose.yaml` yang disuntikkan ke kontainer berbeda dengan yang dipahami oleh aplikasi atau server database target, maka proses jabat tangan (*authentication handshake*) akan ditolak dengan error `401 Unauthorized` atau `ECONNREFUSED`.
2. **Harmonisasi Antara Service DB & Service App**:
   Dalam arsitektur multi-kontainer di mana basis data juga dikontainerkan via Docker Compose, service DB menggunakan variabel seperti `POSTGRES_PASSWORD` untuk *mengkonfigurasi kata sandi akun database saat pertama kali dibuat*. Sementara service backend menggunakan `DATABASE_URL` atau `POSTGRES_PASSWORD` untuk *melakukan koneksi*. Jika kedua nilai ini tidak sama, backend dipastikan gagal melakukan otentikasi ke database.
3. **Penerapan Prinsip *Single Source of Truth* (SSoT)**:
   Penggunaan `env_file: - .env` pada `compose.yaml` memastikan bahwa variabel lingkungan cukup didefinisikan satu kali di berkas `.env`. Hal ini mencegah insiden bug *hardcoded credentials* yang sering terjadi akibat ketidaksamaan variabel antar lingkungan eksekusi.

---

### 4.2 Implementasi Basis Data

#### 1. Inisialisasi Schema PostgreSQL (Drizzle ORM)
Skema PostgreSQL didefinisikan pada berkas [`apps/backend/src/db/schema.ts`](file:///c:/project-uta/ngajar/apps/backend/src/db/schema.ts). Contoh pendaftaran entitas profil dan kredensial:

```typescript
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // ADMIN | GURU | SISWA
  identifier: text("identifier").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const credentials = pgTable("credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});
```

#### 2. Inisialisasi Koleksi AstraDB NoSQL
Koleksi AstraDB diinisialisasi secara otomatis saat aplikasi dinyalakan pada [`apps/backend/src/config/astra.ts`](file:///c:/project-uta/ngajar/apps/backend/src/config/astra.ts):

```typescript
export const ASTRA_COLLECTIONS = {
  MATERIALS: "materials",
  ASSIGNMENTS: "assignments",
  SUBMISSIONS: "submissions",
  QUIZZES: "quizzes",
  QUIZ_ATTEMPTS: "quiz_attempts",
  GRADES: "grades",
} as const;

export const initAstraCollections = async () => {
  if (!astraDb) return;
  for (const colName of Object.values(ASTRA_COLLECTIONS)) {
    try {
      await astraDb.createCollection(colName, {
        indexing: { deny: ["content", "description", "questions", "answers"] }
      });
    } catch {
      // Koleksi sudah ada
    }
  }
};
```

---

### 4.3 Implementasi Fitur CRUD

Implementasi operasi CRUD (*Create, Read, Update, Delete*) pada sistem **Ngajar (SIAKAD KKA)** mencakup pengelolaan entitas data relasional (PostgreSQL via Drizzle ORM/Supabase) dan data dokumen NoSQL (DataStax AstraDB API). Di bawah ini disajikan rincian kode sumber backend (ElysiaJS) beserta alur pengujian (*screenshot*) untuk **3 entitas/tabel utama** sistem:

---

#### 4.3.1 Operasi CRUD Entitas Kelas (`classes` - PostgreSQL Relational DB)

Modul kelas mengelola data ruang kelas akademik, jadwal, tingkat kelas, dan penugasan wali kelas.

##### Tabel Ringkasan Operasi CRUD Kelas:
| Operasi | Endpoint | Method | Role Access | Handler / Function |
| :--- | :--- | :--- | :--- | :--- |
| **Create (C)** | `/api/classes` | `POST` | `teacher` | `classesService.createClass(teacherId, body)` |
| **Read (R)** | `/api/classes` & `/api/classes/:id` | `GET` | `teacher`, `student` | `classesService.getTeacherClasses() / getClassById()` |
| **Update (U)** | `/api/classes/:id` | `PUT` | `teacher` (Owner) | `classesService.updateClass(teacherId, classId, body)` |
| **Delete (D)** | `/api/classes/:id` | `DELETE` / Un-enroll | `teacher` / `admin` | `classesRepo.deleteClass(classId)` |

##### Implementasi Kode Backend (`classes.routes.ts` & `classes.service.ts`):

```typescript
// 1. CREATE: Membuat Kelas Baru
app.post("", async ({ user, body }) => ok(await classesService.createClass(user.id, body)), { body: createClassSchema });

export const createClass = async (teacherId: string, body: CreateClassBody) => {
  const newClass = await classesRepo.createClass({ ...body, homeroomTeacherId: teacherId });
  await classesRepo.addTeachingAssignment(newClass.id, teacherId);
  return newClass;
};

// 2. READ: Mengambil Daftar & Detail Kelas
app.get("/my", async ({ user }) => ok(await classesService.getStudentClasses(user.id)));
app.get("/:id", async ({ user, params }) => ok(await classesService.getClassById(user.id, params.id)));

// 3. UPDATE: Memperbarui Informasi & Jadwal Kelas
app.put("/:id", async ({ user, params, body }) => ok(await classesService.updateClass(user.id, params.id, body)), { body: updateClassSchema });

export const updateClass = async (teacherId: string, classId: string, body: Partial<CreateClassBody>) => {
  await assertTeacherOwnsClass(teacherId, classId);
  return await classesRepo.updateClass(classId, body);
};
```

##### Tangkapan Layar Pengujian Operasi CRUD Kelas:
* **Screenshot Create (POST `/api/classes`)**: *(Bukti pembuatan kelas "X RPL 1" via Postman / UI)*
* **Screenshot Read (GET `/api/classes`)**: *(Bukti daftar kelas yang diampu guru)*
* **Screenshot Update (PUT `/api/classes/:id`)**: *(Bukti perbaruan nama/jadwal kelas)*
* **Screenshot Delete (DELETE `/api/classes/:id`)**: *(Bukti konfirmasi penghapusan kelas)*

---

#### 4.3.2 Operasi CRUD Entitas Materi Pembelajaran (`materials` - AstraDB NoSQL)

Modul materi mengelola dokumen modul pembelajaran, konten rich-text, dan berkas lampiran yang tersimpan dalam AstraDB NoSQL collection `materials`.

##### Tabel Ringkasan Operasi CRUD Materi:
| Operasi | Endpoint | Method | Role Access | Handler / Function |
| :--- | :--- | :--- | :--- | :--- |
| **Create (C)** | `/api/materials` | `POST` | `teacher` | `materialsService.createMaterial(teacherId, body)` |
| **Read (R)** | `/api/materials/class/:classId` | `GET` | `teacher`, `student` | `materialsService.getClassMaterials()` |
| **Update (U)** | `/api/materials/:id` | `PUT` | `teacher` | `materialsService.updateMaterial(teacherId, id, body)` |
| **Delete (D)** | `/api/materials/:id` | `DELETE` | `teacher` | `materialsService.deleteMaterial(teacherId, id)` |

##### Implementasi Kode Backend (`materials.routes.ts` & `materials.service.ts`):

```typescript
// 1. CREATE: Membuat & Publikasi Modul Materi Baru (AstraDB NoSQL)
app.post("", async ({ user, body }) => ok(await materialsService.createMaterial(user.id, body)), { body: createMaterialSchema });

export const createMaterial = async (teacherId: string, body: CreateMaterialBody) => {
  const doc = { ...body, teacher_id: teacherId, created_at: new Date().toISOString() };
  return await execAstra(() => astraDb.collection("materials").insertOne(doc));
};

// 2. READ: Mengambil Detail & Daftar Materi per Kelas
app.get("/class/:classId", async ({ user, params }) => ok(await materialsService.getClassMaterials(user.id, user.role, params.classId)));
app.get("/:id", async ({ user, params }) => ok(await materialsService.getMaterialDetail(user.id, user.role, params.id)));

// 3. UPDATE: Memperbarui Konten Modul Materi
app.put("/:id", async ({ user, params, body }) => ok(await materialsService.updateMaterial(user.id, params.id, body)), { body: updateMaterialSchema });

// 4. DELETE: Menghapus Dokumen Materi dari NoSQL Collection
app.delete("/:id", async ({ user, params }) => ok(await materialsService.deleteMaterial(user.id, params.id)));

export const deleteMaterial = async (teacherId: string, materialId: string) => {
  return await execAstra(() => astraDb.collection("materials").deleteOne({ _id: materialId }));
};
```

##### Tangkapan Layar Pengujian Operasi CRUD Materi:
* **Screenshot Create (POST `/api/materials`)**: *(Bukti unggah materi modul di Postman/UI)*
* **Screenshot Read (GET `/api/materials/:id`)**: *(Bukti pembacaan detail materi oleh siswa)*
* **Screenshot Update (PUT `/api/materials/:id`)**: *(Bukti penyuntingan deskripsi/lampiran)*
* **Screenshot Delete (DELETE `/api/materials/:id`)**: *(Bukti respons penghapusan materi AstraDB)*

---

#### 4.3.3 Operasi CRUD Entitas Kelompok Belajar (`groups` - PostgreSQL Relational DB)

Modul kelompok mengelola pembentukan kelompok siswa dalam kelas, penentuan ketua (*leader*), dan batas maksimal anggota (`max_members`).

##### Tabel Ringkasan Operasi CRUD Kelompok:
| Operasi | Endpoint | Method | Role Access | Handler / Function |
| :--- | :--- | :--- | :--- | :--- |
| **Create (C)** | `/api/groups` | `POST` | `student`, `teacher` | `groupsService.createGroup(userId, body)` |
| **Read (R)** | `/api/groups/class/:classId` | `GET` | `student`, `teacher` | `groupsService.getClassGroups(classId)` |
| **Update (U)** | `/api/groups/:groupId` & `/groups/join` | `PATCH` / `POST` | `student` | `groupsService.updateGroup() / joinGroup()` |
| **Delete (D)** | `/api/groups/leave` | `DELETE` / `POST` | `student` | `groupsService.leaveGroup(userId, body)` |

##### Implementasi Kode Backend (`groups.routes.ts` & `groups.service.ts`):

```typescript
// 1. CREATE: Membuat Kelompok Belajar Baru
app.post("", async ({ user, body }) => ok(await groupsService.createGroup(user.id, body)), { body: createGroupSchema });

export const createGroup = async (studentId: string, body: CreateGroupBody) => {
  const group = await groupsRepo.createGroup({ ...body, leaderId: studentId });
  await groupsRepo.addMember(group.id, studentId, body.classId);
  return group;
};

// 2. READ: Mengambil Daftar Kelompok per Kelas
app.get("/class/:classId", async ({ params }) => ok(await groupsService.getClassGroups(params.classId)));

// 3. UPDATE: Mengubah Nama Kelompok / Menambah Anggota (Join)
app.patch("/:groupId", async ({ user, params, body }) => ok(await groupsService.updateGroup(user.id, params.groupId, body.name)));
app.post("/join", async ({ user, body }) => ok(await groupsService.joinGroup(user.id, body)));

// 4. DELETE: Keluar dari Kelompok / Menghapus Keanggotaan
app.delete("/leave", async ({ user, body }) => ok(await groupsService.leaveGroup(user.id, body)));
```

##### Tangkapan Layar Pengujian Operasi CRUD Kelompok:
* **Screenshot Create (POST `/api/groups`)**: *(Bukti pembuatan kelompok baru)*
* **Screenshot Read (GET `/api/groups/class/:classId`)**: *(Bukti daftar kelompok kelas)*
* **Screenshot Update (POST `/api/groups/join`)**: *(Bukti siswa berhasil bergabung ke kelompok)*
* **Screenshot Delete (DELETE `/api/groups/leave`)**: *(Bukti anggota keluar dari kelompok)*

---

### 4.4 Version Control & Repository Management
Sistem dikembangkan dengan standar *Version Control System* menggunakan **Git** dan strategi **Monorepo Workflow**:

```mermaid
gitGraph
    commit id: "Initial Commit"
    branch feature/docker-setup
    checkout feature/docker-setup
    commit id: "Add Dockerfile & docker-compose"
    checkout main
    merge feature/docker-setup
    branch feature/hybrid-db
    checkout feature/hybrid-db
    commit id: "Setup Drizzle & AstraDB Client"
    checkout main
    merge feature/hybrid-db
    commit id: "Release v1.0.0" tag: "v1.0.0"
```

1. **Turborepo Pipeline**:
   Mengkoordinasikan tugas *build*, *lint*, dan *dev* secara paralel di seluruh paket aplikasi (`apps/frontend` dan `apps/backend`).
2. **Manajemen Dependensi**:
   Menggunakan **Bun Workspaces** untuk memastikan bahwa versi pustaka pihak ketiga tetap konsisten dan menghemat ruang penyimpanan disk.

---

## BAB V PENGUJIAN

### 5.1 Pengujian Fungsional CRUD (Black-Box Testing)

| ID Uji | Modul Fitur | Skenario Pengujian | Ekspektasi Hasil | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Autentikasi | Login dengan username & password valid. | Menerima HTTP 200 OK & Token JWT. | **PASS** |
| **TC-02** | Autentikasi | Login dengan password salah. | Menerima HTTP 401 Unauthorized. | **PASS** |
| **TC-03** | Manajemen Kelas | Admin menambahkan kelas "X RPL 1". | Data tersimpan di Supabase PostgreSQL. | **PASS** |
| **TC-04** | Kelompok Belajar| Siswa membuat kelompok melebihi `max_members`. | Sistem menolak penambahan anggota tambahan. | **PASS** |
| **TC-05** | Materi | Guru mengunggah materi modul PDF. | Dokumen tersimpan di AstraDB `materials`. | **PASS** |
| **TC-06** | Submission | Siswa mengumpulkan tugas tepat waktu. | Status pengumpulan berubah menjadi `SUBMITTED`. | **PASS** |
| **TC-07** | Penilaian | Guru memberikan nilai 90 & feedback. | Rekap nilai tersimpan di AstraDB `grades`. | **PASS** |

---

### 5.2 Pengujian Koneksi Antar Service

Pengujian status keaktifan kontainer dilakukan dengan mengeksekusi perintah `docker compose ps` pada lingkungan backend:

```bash
$ docker compose ps

NAME          IMAGE                  COMMAND                  SERVICE   CREATED         STATUS                   PORTS
kka-backend   backend-backend        "bun run api/index.ts"   backend   5 minutes ago   Up 5 minutes (healthy)   0.0.0.0:4000->4000/tcp
```

**Hasil Evaluasi Healthcheck**:
Eksekusi pengujian otomatis `CMD-SHELL` pada kontainer menunjukkan status **`(healthy)`**. Endpoint `/health` merespon cepat:

```json
// GET http://localhost:4000/health
{
  "status": "success",
  "data": {
    "status": "ok"
  }
}
```

---

### 5.3 Pengujian Ketahanan (Resilience & Error Recovery Testing)

Untuk menguji ketahanan koneksi terhadap basis data cloud NoSQL (AstraDB) yang rentan terhadap masalah *socket drop* atau *stream timeout*, backend dilengkapi dengan mekanisme **Exponential Backoff Retry** pada berkas [`apps/backend/src/config/astra.ts`](file:///c:/project-uta/ngajar/apps/backend/src/config/astra.ts):

```typescript
export const execAstra = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (isConnectionOrStreamError && attempt < maxRetries) {
        refreshAstraDb(); // Re-initialize client instance
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  return await fn();
};
```

**Hasil Pengujian Ketahanan**:
Saat koneksi jaringan terputus secara sengaja (*simulated network glitch*), aplikasi backend tidak mengalami crash (`unhandled exception`), melainkan secara otomatis melakukan inisialisasi ulang klien AstraDB dan mencoba kembali hingga 3 kali secara sukses.

---

## BAB VI KENDALA & PENYELESAIAN

Dalam proses perancangan dan implementasi sistem "Ngajar", ditemukan beberapa kendala teknis beserta solusi penyelesaiannya:

```mermaid
graph TD
    A[Kendala Teknis] --> B[1. AstraDB HTTP Stream Destroyed Error]
    A --> C[2. Perbedaan Port Mapping & Mismatch Env]
    A --> D[3. Cross-Origin Resource Sharing / CORS]
    A --> E[4. State Management Svelte 5 Runes Transition]

    B --> Sol1[Solusi: Implementasi Retry Mechanism & Auto Re-initialization Client]
    C --> Sol2[Solusi: Standardisasi .env & Penggunaan Docker Bridge Network]
    Sol3[Solusi: Dynamic CORS Middleware Config pada ElysiaJS]
    D --> Sol3
    Sol4[Solusi: Refactoring State Menggunakan $state & $derived Runes]
    E --> Sol4
```

### Rincian Kendala & Cara Mengatasinya:

1. **Kendala**: *Stream/Connection Destroyed Error* pada AstraDB.
   * *Masalah*: Koneksi HTTP/2 ke Cloud AstraDB terkadang mengalami *idle timeout* atau terputus jika tidak ada trafik dalam jangka waktu tertentu.
   * *Penyelesaian*: Membuat fungsi *wrapper* `execAstra()` dengan penanganan *retry* otomatis serta pengisian acak *backoff delay* (*jitter*) untuk menyegarkan instans klien AstraDB.

2. **Kendala**: Ketidaksesuaian Pemetaan Port dan Variabel Lingkungan Docker.
   * *Masalah*: Backend di dalam kontainer tidak dapat diakses oleh frontend karena perbedaan port listener antara kode aplikasi (`PORT=4000`) dan deklarasi Dockerfile (`EXPOSE 3000`).
   * *Penyelesaian*: Diselaraskan variabel `PORT=4000` di dalam Dockerfile, `docker-compose.yml`, serta file `.env`. Pemetaan port dipastikan pada `4000:4000`.

3. **Kendala**: Masalah CORS (*Cross-Origin Resource Sharing*) pada Penggelaran Cloud.
   * *Masalah*: Permintaan API dari domain frontend Vercel/Custom Domain ditolak oleh backend karena aturan keamanan browser.
   * *Penyelesaian*: Mengonfigurasi `@elysiajs/cors` secara dinamis pada `index.ts` untuk mengizinkan origin terdaftar di `ALLOWED_ORIGINS` serta wildcard subdomain `.vercel.app` dan `.utaaa.my.id`.

4. **Kendala**: Reaktivitas State pada Svelte 5 (*Runes Migration*).
   * *Masalah*: Terjadi inkonsistensi pembaruan antarmuka pada komponen Svelte saat data pengumpulan tugas berhasil diunggah.
   * *Penyelesaian*: Melakukan migrasi kode frontend dari sintaks reaktif Svelte 4 legacy (`$:`) ke fitur Svelte 5 Runes terbaru (`$state`, `$effect`, `$derived`).

---

## BAB VII PENUTUP

### 7.1 Kesimpulan
Berdasarkan hasil perancangan, implementasi, dan pengujian yang telah dilakukan, dapat disimpulkan bahwa:
1. Platform LMS **"Ngajar" (SIAKAD KKA)** berhasil dibangun menggunakan pendekatan modern *Hybrid Database Architecture*, memadukan keunggulan **Supabase PostgreSQL** untuk integritas data relasional dan **DataStax AstraDB** untuk fleksibilitas dokumen NoSQL.
2. Penggunaan **Bun 1.2** dan **ElysiaJS** pada backend memberikan latensi eksekusi yang sangat cepat serta dukungan OpenAPI/Swagger otomatis.
3. Kontainerisasi menggunakan **Docker** dan **Docker Compose** terbukti mempermudah portabilitas dan konsistensi lingkungan eksekusi backend.
4. Pemahaman mendalam mengenai **Port Mapping (`HOST:CONTAINER`)** dan sinkronisasi kredensial variabel lingkungan (`.env`) menjadi kunci utama keberhasilan interkoneksi antar layanan dan keamanan sistem.
5. Fitur-fitur utama CRUD mulai dari autentikasi, manajemen kelas, kelompok belajar, materi, tugas, hingga kuis dan penilaian telah diuji dan berfungsi dengan baik.

---

### 7.2 Saran Pengembangan Selanjutnya
Untuk meningkatkan kualitas dan skala platform di masa mendatang, disarankan beberapa langkah pengembangan berikut:
1. **Implementasi Redis Caching**: Menambahkan lapisan *in-memory cache* menggunakan Redis untuk menyimpan sesi JWT dan query materi yang sering diakses guna mengurangi beban ke database utama.
2. **Notifikasi Real-Time (WebSocket)**: Mengintegrasikan protokol WebSocket (melalui fitur native WebSocket ElysiaJS) untuk pengiriman notifikasi tugas baru dan obrolan kelompok secara instant.
3. **Automasi CI/CD Pipeline**: Membangun alur pengujian dan pemutakhiran otomatis berbasis GitHub Actions yang secara otomatis membangun *Docker Image* dan melakukan *push* ke Docker Hub / Container Registry saat terdapat perubahan kode.
