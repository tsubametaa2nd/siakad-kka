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

### 2.1 Metodologi Pengembangan
Metodologi pengembangan yang diterapkan adalah **Component-Driven Development (CDD)** yang dikombinasikan dengan arsitektur **Monorepo** berbasis **Turborepo**.

```mermaid
graph LR
    subgraph Monorepo System
        A[Root Workspace] --> B[apps/frontend - Svelte 5]
        A --> C[apps/backend - ElysiaJS]
        A --> D[packages/shared - Types & Utils]
    end
```

CDD menekankan pembuatan komponen-komponen antarmuka yang independen, modular, dan dapat digunakan kembali (*reusable*). Di sisi arsitektur kode, pendekatan *Monorepo* memungkinkan pengelolaan kode *frontend* dan *backend* dalam satu repositori terpusat, mempermudah pemakaian ulang tipe data TypeScript (*shared types*), serta mempercepat alur kerja integrasi (*CI/CD*).

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

### 3.1 Analisis Kebutuhan

#### A. Kebutuhan Fungsional (Functional Requirements)
1. **Sistem Autentikasi & Otorisasi**:
   * Pengguna dapat melakukan login menggunakan identitas (*username/NIP/NIS*) dan kata sandi.
   * Sistem memverifikasi kredensial via Argon2id dan menerbitkan token JWT.
   * Sistem membatasi hak akses berdasarkan peran (**ADMIN**, **GURU**, **SISWA**).
2. **Manajemen Kelas & Pengajaran**:
   * Admin/Guru dapat membuat kelas baru, menentukan wali kelas, dan mendaftarkan siswa (*enrollment*).
3. **Manajemen Kelompok Belajar**:
   * Siswa/Guru dapat membentuk kelompok di dalam kelas dengan batas maksimum anggota (*max members*).
   * Ketua kelompok (*leader*) dapat mengelola keanggotaan kelompoknya.
4. **Materi Pembelajaran & Tugas**:
   * Guru dapat membuat, memperbarui, dan menghapus materi serta tugas pembelajaran.
   * Siswa dapat mengunduh materi dan mengunggah tautan/berkas pengumpulan tugas.
5. **Kuis & Penilaian**:
   * Guru dapat merancang kuis interaktif dan memberikan nilai beserta umpan balik (*feedback*) pada tugas siswa.
   * Siswa dapat mengerjakan kuis dan melihat hasil penilaian.

#### B. Kebutuhan Non-Fungsional (Non-Functional Requirements)
1. **Keamanan (Security)**: Kata sandi tersimpan dalam bentuk *hash* Argon2id; komunikasi API dilindungi oleh CORS header; otorisasi dibatasi oleh JWT.
2. **Kinerja (Performance)**: Runtime Bun dan ElysiaJS memberikan latensi respon API di bawah 50ms untuk operasi biasa.
3. **Keandalan (Reliability)**: Penanganan otomatis *connection stream reset* pada AstraDB menggunakan mekanisme *Exponential Backoff Retry*.
4. **Portabilitas (Portability)**: Backend dapat dijalankan di lingkungan mana pun yang mendukung Docker tanpa modifikasi kode.

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

Seluruh rute API didaftarkan pada server utama ElysiaJS ([`apps/backend/src/index.ts`](file:///c:/project-uta/ngajar/apps/backend/src/index.ts)) di bawah prefix `/api`:

```typescript
app.group("/api", (app) =>
  app
    .use(authRoutes)
    .use(classRoutes)
    .use(groupRoutes)
    .use(assignmentRoutes)
    .use(submissionRoutes)
    .use(quizRoutes)
    .use(materialRoutes)
    .use(gradingRoutes)
);
```

#### Ringkasan Rute dan Alur CRUD Utama:

| Modul | Endpoint | Method | Fungsi CRUD & Deskripsi Alur |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth/login` | `POST` | Memeriksa username di `credentials`, memverifikasi hash Argon2id, menerbitkan JWT Token. |
| **Auth** | `/api/auth/me` | `GET` | Menerjemahkan JWT token dari header authorization dan mengembalikan data profil pengguna. |
| **Kelas** | `/api/classes` | `GET / POST` | Menampilkan seluruh kelas & membuat kelas baru beserta penunjukan wali kelas (`profiles`). |
| **Kelompok**| `/api/groups` | `POST` | Membuat kelompok belajar baru pada suatu kelas dengan menetapkan `leader_id` dan `max_members`. |
| **Materi** | `/api/materials` | `GET / POST` | Mengambil materi dari koleksi AstraDB `materials` berdasarkan `class_id` atau menambahkan materi baru. |
| **Tugas** | `/api/assignments` | `GET / POST` | Mengelola data instruksi tugas dan batas waktu pengumpulan (*due date*) di koleksi AstraDB `assignments`. |
| **Submission**|`/api/submissions`| `POST` | Siswa mengunggah tautan/berkas pengumpulan tugas ke koleksi AstraDB `submissions`. |
| **Penilaian**| `/api/grading` | `POST` | Guru memberikan nilai angka dan catatan umpan balik ke koleksi AstraDB `grades`. |

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
