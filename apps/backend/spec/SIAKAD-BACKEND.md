# Sistem Informasi Akademik (SIAKAD) — Backend Design

> Backend **Elysia JS (Bun)** dengan arsitektur **layered-by-feature**.
> **Supabase (PostgreSQL)** → akun, kelas, kelompok. **AstraDB (Data API)** → materi, tugas, submission, quiz, nilai. **Google Sheets** → rekap nilai per kelas. **Supabase Storage** → file fisik.

---

## 1. Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Runtime | **Bun** | Performa tinggi, native TS, cocok dengan Elysia |
| Framework | **Elysia JS** | Type-safe end-to-end, validasi TypeBox bawaan, plugin-based |
| DB Relasional | **Supabase (Postgres)** | Data terstruktur + relasi (akun, kelas, kelompok) + Auth + RLS |
| DB Dokumen | **AstraDB** (`@datastax/astra-db-ts`) | Konten fleksibel & write-heavy (materi, submission, quiz) |
| Object Storage | **Supabase Storage** | File tugas siswa (pdf, docx, gambar) |
| Spreadsheet | **Google Sheets API** (`googleapis`) | Rekap nilai per kelas, mudah dibaca guru |
| Validasi | **TypeBox** (`t` dari Elysia) | Skema request = tipe TS = dokumentasi |
| Auth | **NextAuth / Auth.js** (Credentials) + **JWT** | Login NIS/NIP+password; NextAuth di Next.js, verifikasi & penerbitan JWT di Elysia |
| Hash Password | **`Bun.password`** (argon2) | Bawaan Bun, tanpa dependency tambahan |

---

## 2. Keputusan Arsitektur

**Kenapa layered-by-feature?**
Alih-alih memisah folder per teknis (`controllers/`, `services/`, `models/`) yang membuat 1 fitur tersebar di banyak tempat, kita kelompokkan **per fitur**. Menambah/mengubah fitur = sentuh 1 folder. Setiap file dijaga **< 400 baris** dengan memecah `routes` / `service` / `repository` / `schema`.

**Kenapa 2 database?**

- **Supabase** untuk data yang butuh **relasi & konsistensi kuat** (siswa ⟷ kelas ⟷ kelompok, constraint "1 siswa max 1 kelompok" cukup lewat `UNIQUE`).
- **AstraDB** untuk data **volume tinggi & skema fleksibel** (submission bisa punya banyak file/link, materi HTML besar, quiz dengan struktur soal berbeda-beda).

**Batas penyimpanan (tegas):**

| Data | Lokasi | Keterangan |
|---|---|---|
| Akun guru & siswa, login | **Supabase** | `profiles`, `credentials` |
| List kelas + siapa di kelas mana | **Supabase** | `classes`, `enrollments`, `teaching_assignments` |
| List kelompok + siapa di kelompok mana | **Supabase** | `groups`, `group_members` (constraint max 1/siswa) |
| Materi | **AstraDB** | `materials` |
| Tugas dari guru | **AstraDB** | `assignments` |
| **Tugas dikumpulkan siswa (file+link)** | **AstraDB** | `submissions` |
| Quiz & pengerjaannya | **AstraDB** | `quizzes`, `quiz_attempts` |
| Nilai | **AstraDB** | `grades` (lalu disinkron ke Google Sheets) |

> Supabase **hanya** memegang akun + list kelas + list kelompok. Semua aktivitas belajar (materi, tugas, submission, quiz, nilai) ada di AstraDB. Tabel relasi seperti `enrollments`/`group_members` masuk Supabase karena bagian dari *list* kelas/kelompok, bukan data tugas.

> ⚠️ Tidak ada Foreign Key lintas-DB. Referensi seperti `student_id` di AstraDB adalah UUID milik Supabase, integritasnya dijaga di **service layer**, bukan di database.

**Alur data setiap layer:**

```
Request → routes (validasi skema) → service (logika bisnis) → repository (akses DB) → response
                                          ↓
                              shared (auth, error, storage, sheets)
```

- **routes** — definisi endpoint + skema TypeBox. Tidak ada logika bisnis.
- **service** — aturan bisnis (cek deadline, cek kepemilikan, hitung status late).
- **repository** — query murni ke Supabase / AstraDB. Tidak tahu HTTP.
- **shared** — dipakai lintas fitur (middleware auth, error handler, klien storage & sheets).

---

## 3. Struktur Folder

```
siakad-backend/
├── src/
│   ├── index.ts                     # entry point, gabung semua feature
│   │
│   ├── config/
│   │   ├── env.ts                   # validasi environment variable
│   │   ├── supabase.ts              # klien Supabase (admin & anon)
│   │   ├── astra.ts                 # klien AstraDB + koleksi
│   │   └── sheets.ts                # klien Google Sheets (service account)
│   │
│   ├── shared/
│   │   ├── auth/
│   │   │   ├── password.ts          # hash/verify (Bun.password argon2)
│   │   │   └── jwt.ts               # sign/verify JWT API (jose)
│   │   ├── middleware/
│   │   │   ├── auth.ts              # verifikasi JWT + guard role
│   │   │   └── error.ts             # error handler global
│   │   ├── storage/
│   │   │   └── files.ts             # upload/hapus file ke Supabase Storage
│   │   ├── utils/
│   │   │   ├── response.ts          # envelope { success, data, error }
│   │   │   └── errors.ts            # AppError, NotFound, Forbidden, ...
│   │   └── types.ts                 # tipe global (Role, AuthUser, dll)
│   │
│   └── features/
│       ├── auth/
│       │   ├── auth.routes.ts
│       │   ├── auth.service.ts
│       │   ├── auth.repository.ts
│       │   └── auth.schema.ts
│       ├── classes/                 # kelas + enrollment siswa
│       │   ├── classes.routes.ts
│       │   ├── classes.service.ts
│       │   ├── classes.repository.ts
│       │   └── classes.schema.ts
│       ├── groups/                  # kelompok (max 1/siswa/kelas)
│       │   ├── groups.routes.ts
│       │   ├── groups.service.ts
│       │   ├── groups.repository.ts
│       │   └── groups.schema.ts
│       ├── assignments/             # tugas (guru buat, ada deadline)
│       │   ├── assignments.routes.ts
│       │   ├── assignments.service.ts
│       │   ├── assignments.repository.ts
│       │   └── assignments.schema.ts
│       ├── submissions/             # pengumpulan tugas siswa (file+link)
│       │   ├── submissions.routes.ts
│       │   ├── submissions.service.ts
│       │   ├── submissions.repository.ts
│       │   └── submissions.schema.ts
│       ├── quiz/                     # quiz + auto-grading
│       │   ├── quiz.routes.ts
│       │   ├── quiz.service.ts
│       │   ├── quiz.repository.ts
│       │   └── quiz.schema.ts
│       ├── materials/               # materi HTML → halaman interaktif
│       │   ├── materials.routes.ts
│       │   ├── materials.service.ts
│       │   ├── materials.repository.ts
│       │   └── materials.schema.ts
│       └── grading/                 # penilaian + sinkron Google Sheets
│           ├── grading.routes.ts
│           ├── grading.service.ts
│           ├── grading.repository.ts
│           ├── grading.sheets.ts    # logika upsert ke spreadsheet
│           └── grading.schema.ts
├── .env
├── package.json
└── tsconfig.json
```

**Konvensi penamaan file per fitur:**

| File | Isi | Batasan |
|---|---|---|
| `*.routes.ts` | Endpoint + skema TypeBox, panggil service | tipis, < 150 baris |
| `*.service.ts` | Logika bisnis, orkestrasi repository | < 400 baris |
| `*.repository.ts` | Query DB murni | < 300 baris |
| `*.schema.ts` | Skema TypeBox request/response | < 150 baris |

---

## 4. Model Data

### 4.1 Supabase (PostgreSQL) — akun, kelas, kelompok

```sql
-- === ROLE & PROFILE (standalone, tanpa Supabase Auth) ===
create type user_role as enum ('teacher', 'student');

create table profiles (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  role        user_role not null,
  identifier  text unique,               -- NIS (siswa) / NIP (guru)
  created_at  timestamptz default now()
);

-- === KREDENSIAL LOGIN (NextAuth Credentials → verifikasi di Elysia) ===
-- Password di-hash dengan Bun.password (argon2). Akun dibuat oleh guru/admin.
create table credentials (
  profile_id    uuid primary key references profiles(id) on delete cascade,
  username      text unique not null,    -- = NIS / NIP, dipakai untuk login
  password_hash text not null,
  must_reset    boolean default false,   -- paksa ganti password saat pertama login
  created_at    timestamptz default now()
);

-- === KELAS ===
create table classes (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,      -- "XII RPL 1"
  grade_level         text not null,      -- "XII"
  academic_year       text not null,      -- "2025/2026"
  homeroom_teacher_id uuid references profiles(id),
  spreadsheet_id      text,               -- ID Google Sheet rekap nilai kelas
  created_at          timestamptz default now()
);

-- Guru mengajar kelas (many-to-many + mapel)
create table teaching_assignments (
  teacher_id uuid references profiles(id) on delete cascade,
  class_id   uuid references classes(id)  on delete cascade,
  subject    text not null,
  primary key (teacher_id, class_id, subject)
);

-- Siswa terdaftar di kelas
create table enrollments (
  student_id uuid references profiles(id) on delete cascade,
  class_id   uuid references classes(id)  on delete cascade,
  primary key (student_id, class_id)
);

-- === KELOMPOK ===
create table groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  class_id    uuid references classes(id) on delete cascade,
  leader_id   uuid references profiles(id),
  max_members int  default 5,
  created_at  timestamptz default now()
);

create table group_members (
  group_id   uuid references groups(id)   on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  class_id   uuid references classes(id)  on delete cascade,  -- denormalisasi utk constraint
  joined_at  timestamptz default now(),
  primary key (group_id, student_id),
  -- INTI: 1 siswa hanya boleh 1 kelompok per kelas
  unique (student_id, class_id)
);
```

> ℹ️ **Tanpa Supabase Auth, `auth.uid()` tidak tersedia.** Backend mengakses Supabase memakai **service key**, jadi otorisasi (siswa hanya lihat data sendiri, guru hanya kelola kelas yang diampu) **wajib ditegakkan di service layer** — bukan lagi lewat RLS `auth.uid()`. RLS tetap boleh diaktifkan sebagai lapis pertahanan tambahan, tapi policy-nya tidak bergantung pada sesi Supabase.

### 4.2 AstraDB (Data API / Collections) — konten & aktivitas

Menggunakan **document model** (`@datastax/astra-db-ts`). Bentuk dokumen per koleksi:

```ts
// koleksi: materials
interface Material {
  _id: string;
  classId: string;
  teacherId: string;
  title: string;
  blocks: MaterialBlock[];   // materi disusun per-blok agar interaktif
  createdAt: string;
}
type MaterialBlock =
  | { type: 'html';  content: string }              // HTML tersanitasi
  | { type: 'video'; url: string }
  | { type: 'checkpoint'; question: string; options: string[]; answer: number };

// koleksi: assignments
interface Assignment {
  _id: string;
  classId: string;
  teacherId: string;
  title: string;
  description: string;
  type: 'individual' | 'group';
  deadline: string;          // ISO 8601
  maxScore: number;
  createdAt: string;
}

// koleksi: submissions
interface Submission {
  _id: string;
  assignmentId: string;
  classId: string;
  studentId: string;         // pengumpul (leader jika group)
  groupId?: string;
  files: FileMeta[];         // { path, name, size, mime }
  links: string[];
  status: 'submitted' | 'late' | 'graded';
  version: number;           // untuk optimistic concurrency saat edit
  isDeleted: boolean;        // soft delete
  submittedAt: string;
  updatedAt: string;
}
interface FileMeta { path: string; name: string; size: number; mime: string; }

// koleksi: quizzes
interface Quiz {
  _id: string;
  classId: string;
  teacherId: string;
  title: string;
  questions: QuizQuestion[];
  deadline: string;
  timeLimitMinutes: number;
  createdAt: string;
}
interface QuizQuestion { text: string; options: string[]; answer: number; points: number; }

// koleksi: quiz_attempts
interface QuizAttempt {
  _id: string;
  quizId: string;
  studentId: string;
  answers: number[];
  score: number;             // hasil auto-grading
  submittedAt: string;
}

// koleksi: grades
interface Grade {
  _id: string;               // `${assignmentId}:${studentId}`
  assignmentId: string;
  classId: string;
  studentId: string;
  score: number;
  feedback: string;
  gradedBy: string;
  gradedAt: string;
  syncedToSheet: boolean;    // status sinkron ke Google Sheets
}
```

**Index yang perlu dibuat** (Data API otomatis meng-index field, tapi rancang query pattern):
`submissions` di-query by `assignmentId` (guru cek) & by `studentId` (siswa lihat miliknya).
`grades` di-query by `assignmentId` & by `classId` (untuk sinkron sheet).

### 4.3 Google Sheets — layout per kelas

Satu spreadsheet per kelas (`classes.spreadsheet_id`). Satu sheet/tab per mapel jika perlu.

| No | NIS | Nama | Tugas 1 | Tugas 2 | Quiz 1 | ... |
|----|-----|------|---------|---------|--------|-----|
| 1  | 123 | Budi | 90      | 85      | 100    |     |
| 2  | 124 | Ani  | 80      |         | 95     |     |

- **Baris** = siswa (kunci: NIS di kolom B).
- **Kolom** = tugas/quiz (kunci: judul di baris header).
- Saat guru menilai → cari baris siswa + kolom tugas → tulis 1 sel. Idempotent (nilai ulang menimpa).

### 4.4 Supabase Storage

Bucket privat `submissions`. Path: `submissions/{classId}/{assignmentId}/{studentId}/{filename}`.
Akses file lewat **signed URL** (kadaluarsa, tidak public). Metadata (path, size, mime) disimpan di dokumen `Submission` AstraDB.

---

## 5. Konfigurasi — `config/`

```ts
// config/env.ts
import { t } from 'elysia';

const schema = t.Object({
  PORT: t.String(),
  AUTH_JWT_SECRET: t.String(),            // penanda tangan JWT API
  SUPABASE_URL: t.String(),
  SUPABASE_SERVICE_KEY: t.String(),       // backend cukup service key
  ASTRA_DB_ENDPOINT: t.String(),
  ASTRA_DB_TOKEN: t.String(),
  GOOGLE_SA_EMAIL: t.String(),
  GOOGLE_SA_PRIVATE_KEY: t.String(),
});

// Fitur: validasi env saat boot, gagal cepat kalau ada yang kurang
function loadEnv() {
  const env = process.env;
  for (const key of Object.keys(schema.properties)) {
    if (!env[key]) throw new Error(`ENV ${key} belum diset`);
  }
  return env as Record<keyof typeof schema.properties, string>;
}

export const env = loadEnv();
```

```ts
// config/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// admin: bypass RLS untuk operasi server-side
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});
// Tanpa Supabase Auth: semua akses server pakai admin (service key),
// otorisasi ditegakkan di service layer.
```

```ts
// config/astra.ts
import { DataAPIClient } from '@datastax/astra-db-ts';
import { env } from './env';

const client = new DataAPIClient(env.ASTRA_DB_TOKEN);
export const astra = client.db(env.ASTRA_DB_ENDPOINT);

// Koleksi terpusat agar tidak salah ketik nama
export const collections = {
  materials:     () => astra.collection('materials'),
  assignments:   () => astra.collection('assignments'),
  submissions:   () => astra.collection('submissions'),
  quizzes:       () => astra.collection('quizzes'),
  quizAttempts:  () => astra.collection('quiz_attempts'),
  grades:        () => astra.collection('grades'),
};
```

```ts
// config/sheets.ts
import { google } from 'googleapis';
import { env } from './env';

const auth = new google.auth.JWT({
  email: env.GOOGLE_SA_EMAIL,
  key: env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const sheetsClient = google.sheets({ version: 'v4', auth });
```

---

## 6. Shared Layer — `shared/`

```ts
// shared/utils/errors.ts
export class AppError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}
export const NotFound   = (m = 'Data tidak ditemukan') => new AppError(404, 'NOT_FOUND', m);
export const Forbidden  = (m = 'Akses ditolak')        => new AppError(403, 'FORBIDDEN', m);
export const BadRequest = (m = 'Permintaan tidak valid')=> new AppError(400, 'BAD_REQUEST', m);
export const Conflict   = (m = 'Konflik data')         => new AppError(409, 'CONFLICT', m);
```

```ts
// shared/utils/response.ts
// Envelope seragam untuk semua response
export const ok   = (data: unknown) => ({ success: true, data });
export const fail = (code: string, message: string) => ({ success: false, error: { code, message } });
```

```ts
// shared/middleware/error.ts
import { Elysia } from 'elysia';
import { AppError } from '../utils/errors';
import { fail } from '../utils/response';

// Fitur: ubah semua error jadi response envelope yang konsisten
export const errorHandler = new Elysia()
  .onError(({ error, set }) => {
    if (error instanceof AppError) {
      set.status = error.status;
      return fail(error.code, error.message);
    }
    set.status = 500;
    console.error(error);
    return fail('INTERNAL', 'Terjadi kesalahan pada server');
  });
```

```ts
// shared/types.ts
export type Role = 'teacher' | 'student';
export interface AuthUser { id: string; role: Role; token: string; }
```

```ts
// shared/auth/password.ts — hashing pakai Bun.password (argon2)
export const hashPassword   = (plain: string) => Bun.password.hash(plain);
export const verifyPassword = (plain: string, hash: string) => Bun.password.verify(plain, hash);
```

```ts
// shared/auth/jwt.ts — Elysia menandatangani & memverifikasi token API
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../../config/env';
import type { Role } from '../types';

const secret = new TextEncoder().encode(env.AUTH_JWT_SECRET);

export interface TokenPayload { sub: string; role: Role; name: string; }

// Fitur: terbitkan token (dipanggil saat login, hasilnya dipegang NextAuth)
export function signToken(p: TokenPayload) {
  return new SignJWT({ role: p.role, name: p.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(p.sub)
    .setExpirationTime('8h')
    .sign(secret);
}

// Fitur: verifikasi token dari header Bearer
export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  return { sub: payload.sub!, role: payload.role as Role, name: payload.name as string };
}
```

```ts
// shared/middleware/auth.ts
import { Elysia } from 'elysia';
import { verifyToken } from '../auth/jwt';
import { Forbidden, AppError } from '../utils/errors';
import type { AuthUser, Role } from '../types';

// Fitur: verifikasi JWT terbitan Elysia + inject user ke context (tanpa hit DB)
export const authGuard = new Elysia({ name: 'authGuard' })
  .derive({ as: 'scoped' }, async ({ headers }): Promise<{ user: AuthUser }> => {
    const token = headers.authorization?.replace('Bearer ', '');
    if (!token) throw new AppError(401, 'UNAUTHORIZED', 'Token tidak ada');
    try {
      const p = await verifyToken(token);
      return { user: { id: p.sub, role: p.role, token } };
    } catch {
      throw new AppError(401, 'UNAUTHORIZED', 'Token tidak valid / kedaluwarsa');
    }
  });

// Fitur: guard role. Pakai .use(requireRole('teacher')) di routes
export const requireRole = (role: Role) =>
  new Elysia().use(authGuard).onBeforeHandle(({ user }: any) => {
    if (user.role !== role) throw Forbidden(`Hanya ${role} yang boleh mengakses`);
  });
```

```ts
// shared/storage/files.ts
import { supabaseAdmin } from '../../config/supabase';

const BUCKET = 'submissions';

// Fitur: upload file, kembalikan metadata
export async function uploadFile(path: string, file: File) {
  const { error } = await supabaseAdmin.storage.from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  return { path, name: file.name, size: file.size, mime: file.type };
}

// Fitur: signed URL sementara untuk unduh
export async function signedUrl(path: string, expiresIn = 3600) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

// Fitur: hapus file
export async function removeFile(path: string) {
  await supabaseAdmin.storage.from(BUCKET).remove([path]);
}
```

---

## 7. Feature Modules

### 7.1 `auth` — login NIS/NIP + pembuatan akun oleh guru

Alur: **NextAuth (frontend)** memanggil `POST /api/auth/login` Elysia → Elysia verifikasi `username`(NIS/NIP)+`password` ke tabel `credentials` → menerbitkan **JWT** → NextAuth menyimpan token itu di sesinya → frontend mengirim token sebagai `Bearer` ke endpoint Elysia lain. Akun **tidak bisa daftar sendiri**; dibuat guru/admin lewat `POST /api/auth/accounts`.

```ts
// features/auth/auth.schema.ts
import { t } from 'elysia';

export const loginBody = t.Object({
  username: t.String(),                    // NIS (siswa) / NIP (guru)
  password: t.String({ minLength: 6 }),
});

export const createAccountBody = t.Object({
  fullName: t.String(),
  username: t.String(),                    // NIS / NIP
  role: t.Union([t.Literal('teacher'), t.Literal('student')]),
  password: t.String({ minLength: 6 }),
});
```

```ts
// features/auth/auth.repository.ts
import { supabaseAdmin } from '../../config/supabase';

export const authRepo = {
  findCredential: (username: string) =>
    supabaseAdmin.from('credentials')
      .select('profile_id, password_hash, profiles(full_name, role)')
      .eq('username', username).maybeSingle(),

  createProfile: (payload: any) =>
    supabaseAdmin.from('profiles').insert(payload).select('id').single(),

  createCredential: (row: any) =>
    supabaseAdmin.from('credentials').insert(row),
};
```

```ts
// features/auth/auth.service.ts
import { authRepo } from './auth.repository';
import { verifyPassword, hashPassword } from '../../shared/auth/password';
import { signToken } from '../../shared/auth/jwt';
import { AppError, Conflict } from '../../shared/utils/errors';

// Fitur: login → verifikasi NIS/NIP+password → terbitkan JWT
export async function login(username: string, password: string) {
  const { data } = await authRepo.findCredential(username);
  if (!data) throw new AppError(401, 'LOGIN_FAILED', 'NIS/NIP atau password salah');

  const valid = await verifyPassword(password, data.password_hash);
  if (!valid) throw new AppError(401, 'LOGIN_FAILED', 'NIS/NIP atau password salah');

  const profile = data.profiles as any;
  const token = await signToken({ sub: data.profile_id, role: profile.role, name: profile.full_name });
  return { token, user: { id: data.profile_id, name: profile.full_name, role: profile.role } };
}

// Fitur: guru/admin buat akun siswa (atau guru) dengan password
export async function createAccount(dto: any) {
  const exists = await authRepo.findCredential(dto.username);
  if (exists.data) throw Conflict('NIS/NIP sudah terdaftar');

  const { data: profile, error } = await authRepo.createProfile({
    full_name: dto.fullName, role: dto.role, identifier: dto.username,
  });
  if (error) throw error;

  await authRepo.createCredential({
    profile_id: profile.id, username: dto.username,
    password_hash: await hashPassword(dto.password),
  });
  return { id: profile.id, username: dto.username, role: dto.role };
}
```

```ts
// features/auth/auth.routes.ts
import { Elysia } from 'elysia';
import { loginBody, createAccountBody } from './auth.schema';
import * as svc from './auth.service';
import { authGuard, requireRole } from '../../shared/middleware/auth';
import { ok } from '../../shared/utils/response';

export const authRoutes = new Elysia({ prefix: '/auth' })
  // Dipanggil oleh NextAuth (Credentials provider)
  .post('/login', async ({ body }) => ok(await svc.login(body.username, body.password)),
    { body: loginBody })
  // Guru/admin buat akun siswa
  .group('', (app) => app.use(requireRole('teacher'))
    .post('/accounts', async ({ body }) => ok(await svc.createAccount(body)),
      { body: createAccountBody }))
  // Cek user aktif
  .group('', (app) => app.use(authGuard)
    .get('/me', ({ user }: any) => ok(user)));
```

#### Sisi Next.js — konfigurasi NextAuth (`auth.ts`)

```ts
// auth.ts (Next.js) — Credentials provider memanggil backend Elysia
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(creds) {
        const res = await fetch(`${process.env.API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(creds),
        });
        if (!res.ok) return null;
        const { data } = await res.json();
        // simpan token Elysia + info user ke dalam sesi NextAuth
        return { id: data.user.id, name: data.user.name, role: data.user.role, apiToken: data.token };
      },
    }),
  ],
  callbacks: {
    // teruskan apiToken & role dari authorize ke JWT NextAuth
    jwt({ token, user }) {
      if (user) { token.apiToken = (user as any).apiToken; token.role = (user as any).role; }
      return token;
    },
    // ekspos ke session agar frontend bisa ambil untuk header Bearer
    session({ session, token }) {
      (session as any).apiToken = token.apiToken;
      (session.user as any).role = token.role;
      return session;
    },
  },
});
```

```ts
// lib/api.ts (Next.js) — helper fetch ke Elysia dengan Bearer
import { auth } from '@/auth';

export async function api(path: string, init: RequestInit = {}) {
  const session = await auth();
  return fetch(`${process.env.API_URL}/api${path}`, {
    ...init,
    headers: { ...init.headers, authorization: `Bearer ${(session as any)?.apiToken}` },
  });
}
```

> Token Elysia berlaku 8 jam (lihat `jwt.ts`). Samakan `session.maxAge` NextAuth agar sesi web tidak "hidup" lebih lama dari token API-nya.

### 7.2 `classes` — kelas & daftar siswa

```ts
// features/classes/classes.schema.ts
import { t } from 'elysia';

export const createClassBody = t.Object({
  name: t.String(),
  gradeLevel: t.String(),
  academicYear: t.String(),
  spreadsheetId: t.Optional(t.String()),
});
export const enrollBody = t.Object({ studentIds: t.Array(t.String()) });
```

```ts
// features/classes/classes.repository.ts
import { supabaseAdmin } from '../../config/supabase';

export const classesRepo = {
  create: (payload: any) =>
    supabaseAdmin.from('classes').insert(payload).select().single(),

  listByTeacher: (teacherId: string) =>
    supabaseAdmin.from('teaching_assignments')
      .select('subject, classes(*)').eq('teacher_id', teacherId),

  enroll: (rows: { student_id: string; class_id: string }[]) =>
    supabaseAdmin.from('enrollments').upsert(rows),

  students: (classId: string) =>
    supabaseAdmin.from('enrollments')
      .select('profiles(id, full_name, identifier)').eq('class_id', classId),

  findById: (id: string) =>
    supabaseAdmin.from('classes').select('*').eq('id', id).single(),
};
```

```ts
// features/classes/classes.service.ts
import { classesRepo } from './classes.repository';
import { NotFound } from '../../shared/utils/errors';

export async function createClass(teacherId: string, dto: any) {
  const { data, error } = await classesRepo.create({
    name: dto.name, grade_level: dto.gradeLevel,
    academic_year: dto.academicYear, homeroom_teacher_id: teacherId,
    spreadsheet_id: dto.spreadsheetId,
  });
  if (error) throw error;
  return data;
}

export async function enrollStudents(classId: string, studentIds: string[]) {
  const cls = await classesRepo.findById(classId);
  if (cls.error) throw NotFound('Kelas tidak ditemukan');
  const rows = studentIds.map((id) => ({ student_id: id, class_id: classId }));
  await classesRepo.enroll(rows);
  return { enrolled: studentIds.length };
}

export const listMyClasses = (teacherId: string) => classesRepo.listByTeacher(teacherId);
export const listStudents  = (classId: string)   => classesRepo.students(classId);
```

```ts
// features/classes/classes.routes.ts
import { Elysia } from 'elysia';
import { requireRole } from '../../shared/middleware/auth';
import { createClassBody, enrollBody } from './classes.schema';
import * as svc from './classes.service';
import { ok } from '../../shared/utils/response';

export const classesRoutes = new Elysia({ prefix: '/classes' })
  .use(requireRole('teacher'))
  .post('/', async ({ user, body }: any) => ok(await svc.createClass(user.id, body)),
    { body: createClassBody })
  .get('/', async ({ user }: any) => ok(await svc.listMyClasses(user.id)))
  .post('/:id/enroll', async ({ params, body }) => ok(await svc.enrollStudents(params.id, body.studentIds)),
    { body: enrollBody })
  .get('/:id/students', async ({ params }) => ok(await svc.listStudents(params.id)));
```

### 7.3 `groups` — kelompok (max 1 per siswa per kelas)

```ts
// features/groups/groups.schema.ts
import { t } from 'elysia';

export const createGroupBody = t.Object({
  name: t.String(),
  classId: t.String(),
});
export const joinGroupBody = t.Object({ groupId: t.String() });
```

```ts
// features/groups/groups.repository.ts
import { supabaseAdmin } from '../../config/supabase';

export const groupsRepo = {
  create: (payload: any) =>
    supabaseAdmin.from('groups').insert(payload).select().single(),

  addMember: (row: any) =>
    supabaseAdmin.from('group_members').insert(row),

  memberOf: (studentId: string, classId: string) =>
    supabaseAdmin.from('group_members')
      .select('group_id').eq('student_id', studentId).eq('class_id', classId).maybeSingle(),

  listByClass: (classId: string) =>
    supabaseAdmin.from('groups')
      .select('*, group_members(student_id, profiles(full_name))').eq('class_id', classId),
};
```

```ts
// features/groups/groups.service.ts
import { groupsRepo } from './groups.repository';
import { Conflict, BadRequest } from '../../shared/utils/errors';

// Fitur: siswa buat kelompok → langsung jadi leader & member
export async function createGroup(studentId: string, dto: any) {
  const existing = await groupsRepo.memberOf(studentId, dto.classId);
  if (existing.data) throw Conflict('Kamu sudah punya kelompok di kelas ini');

  const { data: group, error } = await groupsRepo.create({
    name: dto.name, class_id: dto.classId, leader_id: studentId,
  });
  if (error) throw error;

  await groupsRepo.addMember({ group_id: group.id, student_id: studentId, class_id: dto.classId });
  return group;
}

// Fitur: gabung kelompok, constraint UNIQUE(student_id, class_id) jaga max 1
export async function joinGroup(studentId: string, groupId: string, classId: string) {
  const { error } = await groupsRepo.addMember({
    group_id: groupId, student_id: studentId, class_id: classId,
  });
  if (error?.code === '23505') throw Conflict('Kamu sudah tergabung di kelompok lain');
  if (error) throw BadRequest(error.message);
  return { joined: true };
}

export const listGroups = (classId: string) => groupsRepo.listByClass(classId);
```

```ts
// features/groups/groups.routes.ts
import { Elysia } from 'elysia';
import { requireRole } from '../../shared/middleware/auth';
import { createGroupBody, joinGroupBody } from './groups.schema';
import * as svc from './groups.service';
import { ok } from '../../shared/utils/response';

export const groupsRoutes = new Elysia({ prefix: '/groups' })
  .use(requireRole('student'))
  .post('/', async ({ user, body }: any) => ok(await svc.createGroup(user.id, body)),
    { body: createGroupBody })
  .post('/join', async ({ user, body }: any) => ok(await svc.joinGroup(user.id, body.groupId, body.classId)),
    { body: t => joinGroupBody })
  .get('/class/:classId', async ({ params }) => ok(await svc.listGroups(params.classId)));
```

### 7.4 `assignments` — tugas dengan deadline (guru)

```ts
// features/assignments/assignments.schema.ts
import { t } from 'elysia';

export const createAssignmentBody = t.Object({
  classId: t.String(),
  title: t.String(),
  description: t.String(),
  type: t.Union([t.Literal('individual'), t.Literal('group')]),
  deadline: t.String({ format: 'date-time' }),
  maxScore: t.Number({ minimum: 1, maximum: 100 }),
});
```

```ts
// features/assignments/assignments.repository.ts
import { collections } from '../../config/astra';
import { randomUUID } from 'crypto';

export const assignmentsRepo = {
  create: (doc: any) =>
    collections.assignments().insertOne({ _id: randomUUID(), ...doc }),

  listByClass: (classId: string) =>
    collections.assignments().find({ classId }, { sort: { createdAt: -1 } }).toArray(),

  findById: (id: string) =>
    collections.assignments().findOne({ _id: id }),
};
```

```ts
// features/assignments/assignments.service.ts
import { assignmentsRepo } from './assignments.repository';
import { NotFound } from '../../shared/utils/errors';

export async function createAssignment(teacherId: string, dto: any) {
  const doc = { ...dto, teacherId, createdAt: new Date().toISOString() };
  const res = await assignmentsRepo.create(doc);
  return { id: res.insertedId, ...doc };
}

export async function getAssignment(id: string) {
  const a = await assignmentsRepo.findById(id);
  if (!a) throw NotFound('Tugas tidak ditemukan');
  return a;
}

export const listAssignments = (classId: string) => assignmentsRepo.listByClass(classId);
```

```ts
// features/assignments/assignments.routes.ts
import { Elysia } from 'elysia';
import { authGuard, requireRole } from '../../shared/middleware/auth';
import { createAssignmentBody } from './assignments.schema';
import * as svc from './assignments.service';
import { ok } from '../../shared/utils/response';

export const assignmentsRoutes = new Elysia({ prefix: '/assignments' })
  // Guru: buat tugas
  .group('', (app) => app.use(requireRole('teacher'))
    .post('/', async ({ user, body }: any) => ok(await svc.createAssignment(user.id, body)),
      { body: createAssignmentBody }))
  // Semua yang login: lihat tugas
  .group('', (app) => app.use(authGuard)
    .get('/class/:classId', async ({ params }) => ok(await svc.listAssignments(params.classId)))
    .get('/:id', async ({ params }) => ok(await svc.getAssignment(params.id))));
```

### 7.5 `submissions` — upload tugas (file + link), edit, hapus

```ts
// features/submissions/submissions.schema.ts
import { t } from 'elysia';

// multipart: files[] + links (JSON string) + assignmentId
export const submitBody = t.Object({
  assignmentId: t.String(),
  links: t.Optional(t.Array(t.String({ format: 'uri' }))),
  files: t.Optional(t.Files()),
});
export const updateBody = t.Object({
  links: t.Optional(t.Array(t.String())),
  files: t.Optional(t.Files()),
  version: t.Number(),                 // optimistic concurrency
});
```

```ts
// features/submissions/submissions.repository.ts
import { collections } from '../../config/astra';
import { randomUUID } from 'crypto';

export const submissionsRepo = {
  create: (doc: any) => collections.submissions().insertOne({ _id: randomUUID(), ...doc }),

  findOwn: (assignmentId: string, studentId: string) =>
    collections.submissions().findOne({ assignmentId, studentId, isDeleted: false }),

  findById: (id: string) => collections.submissions().findOne({ _id: id }),

  listByAssignment: (assignmentId: string) =>
    collections.submissions().find({ assignmentId, isDeleted: false }).toArray(),

  // update dengan cek version (optimistic lock)
  update: (id: string, version: number, patch: any) =>
    collections.submissions().findOneAndUpdate(
      { _id: id, version },
      { $set: { ...patch, version: version + 1, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' },
    ),

  softDelete: (id: string) =>
    collections.submissions().updateOne({ _id: id }, { $set: { isDeleted: true } }),
};
```

```ts
// features/submissions/submissions.service.ts
import { submissionsRepo } from './submissions.repository';
import { getAssignment } from '../assignments/assignments.service';
import { uploadFile, removeFile, signedUrl } from '../../shared/storage/files';
import { NotFound, Forbidden, Conflict } from '../../shared/utils/errors';

// Fitur: siswa upload tugas (1 submission per siswa per tugas)
export async function submit(studentId: string, dto: any) {
  const assignment = await getAssignment(dto.assignmentId);
  const existing = await submissionsRepo.findOwn(dto.assignmentId, studentId);
  if (existing) throw Conflict('Sudah mengumpulkan, gunakan edit untuk mengubah');

  const files = await uploadAll(assignment.classId, dto.assignmentId, studentId, dto.files);
  const late = new Date() > new Date(assignment.deadline);

  const doc = {
    assignmentId: dto.assignmentId, classId: assignment.classId, studentId,
    files, links: dto.links ?? [], status: late ? 'late' : 'submitted',
    version: 1, isDeleted: false,
    submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  const res = await submissionsRepo.create(doc);
  return { id: res.insertedId, ...doc };
}

// Fitur: siswa ubah file/link yang dikirim (cek kepemilikan + version)
export async function updateSubmission(studentId: string, id: string, dto: any) {
  const sub = await submissionsRepo.findById(id);
  if (!sub || sub.isDeleted) throw NotFound('Submission tidak ditemukan');
  if (sub.studentId !== studentId) throw Forbidden('Bukan milikmu');

  const patch: any = {};
  if (dto.links) patch.links = dto.links;
  if (dto.files?.length) {
    for (const f of sub.files) await removeFile(f.path);       // ganti file lama
    patch.files = await uploadAll(sub.classId, sub.assignmentId, studentId, dto.files);
  }
  const updated = await submissionsRepo.update(id, dto.version, patch);
  if (!updated) throw Conflict('Data sudah berubah, muat ulang lalu coba lagi');
  return updated;
}

// Fitur: siswa hapus submission (soft delete + hapus file fisik)
export async function deleteSubmission(studentId: string, id: string) {
  const sub = await submissionsRepo.findById(id);
  if (!sub) throw NotFound('Submission tidak ditemukan');
  if (sub.studentId !== studentId) throw Forbidden('Bukan milikmu');
  for (const f of sub.files) await removeFile(f.path);
  await submissionsRepo.softDelete(id);
  return { deleted: true };
}

// Fitur: guru cek semua submission tugas (dengan signed URL file)
export async function listForTeacher(assignmentId: string) {
  const subs = await submissionsRepo.listByAssignment(assignmentId);
  return Promise.all(subs.map(async (s) => ({
    ...s,
    files: await Promise.all(s.files.map(async (f: any) => ({ ...f, url: await signedUrl(f.path) }))),
  })));
}

async function uploadAll(classId: string, assignmentId: string, studentId: string, files?: File[]) {
  if (!files?.length) return [];
  return Promise.all(files.map((f) =>
    uploadFile(`${classId}/${assignmentId}/${studentId}/${f.name}`, f)));
}
```

```ts
// features/submissions/submissions.routes.ts
import { Elysia } from 'elysia';
import { requireRole } from '../../shared/middleware/auth';
import { submitBody, updateBody } from './submissions.schema';
import * as svc from './submissions.service';
import { ok } from '../../shared/utils/response';

export const submissionsRoutes = new Elysia({ prefix: '/submissions' })
  // Siswa
  .group('', (app) => app.use(requireRole('student'))
    .post('/', async ({ user, body }: any) => ok(await svc.submit(user.id, body)),
      { body: submitBody })
    .put('/:id', async ({ user, params, body }: any) => ok(await svc.updateSubmission(user.id, params.id, body)),
      { body: updateBody })
    .delete('/:id', async ({ user, params }: any) => ok(await svc.deleteSubmission(user.id, params.id))))
  // Guru cek tugas
  .group('', (app) => app.use(requireRole('teacher'))
    .get('/assignment/:assignmentId', async ({ params }) => ok(await svc.listForTeacher(params.assignmentId))));
```

### 7.6 `quiz` — quiz dengan auto-grading

```ts
// features/quiz/quiz.schema.ts
import { t } from 'elysia';

const question = t.Object({
  text: t.String(),
  options: t.Array(t.String(), { minItems: 2 }),
  answer: t.Number(),                    // index jawaban benar
  points: t.Number({ minimum: 1 }),
});
export const createQuizBody = t.Object({
  classId: t.String(),
  title: t.String(),
  deadline: t.String({ format: 'date-time' }),
  timeLimitMinutes: t.Number(),
  questions: t.Array(question, { minItems: 1 }),
});
export const attemptBody = t.Object({
  quizId: t.String(),
  answers: t.Array(t.Number()),
});
```

```ts
// features/quiz/quiz.repository.ts
import { collections } from '../../config/astra';
import { randomUUID } from 'crypto';

export const quizRepo = {
  create: (doc: any) => collections.quizzes().insertOne({ _id: randomUUID(), ...doc }),
  findById: (id: string) => collections.quizzes().findOne({ _id: id }),
  listByClass: (classId: string) =>
    collections.quizzes().find({ classId }, { projection: { 'questions.answer': 0 } }).toArray(),
  hasAttempt: (quizId: string, studentId: string) =>
    collections.quizAttempts().findOne({ quizId, studentId }),
  saveAttempt: (doc: any) => collections.quizAttempts().insertOne({ _id: randomUUID(), ...doc }),
};
```

```ts
// features/quiz/quiz.service.ts
import { quizRepo } from './quiz.repository';
import { NotFound, Conflict, BadRequest } from '../../shared/utils/errors';

export async function createQuiz(teacherId: string, dto: any) {
  const doc = { ...dto, teacherId, createdAt: new Date().toISOString() };
  const res = await quizRepo.create(doc);
  return { id: res.insertedId };
}

// Fitur: siswa kerjakan quiz → auto-grading (1x attempt)
export async function attempt(studentId: string, quizId: string, answers: number[]) {
  const quiz = await quizRepo.findById(quizId);
  if (!quiz) throw NotFound('Quiz tidak ditemukan');
  if (new Date() > new Date(quiz.deadline)) throw BadRequest('Quiz sudah lewat deadline');
  if (await quizRepo.hasAttempt(quizId, studentId)) throw Conflict('Sudah pernah mengerjakan');

  let score = 0;
  quiz.questions.forEach((q: any, i: number) => { if (answers[i] === q.answer) score += q.points; });

  await quizRepo.saveAttempt({ quizId, studentId, answers, score, submittedAt: new Date().toISOString() });
  return { score, maxScore: quiz.questions.reduce((a: number, q: any) => a + q.points, 0) };
}

// listByClass sudah menyembunyikan field `answer` lewat projection
export const listQuiz = (classId: string) => quizRepo.listByClass(classId);
```

```ts
// features/quiz/quiz.routes.ts
import { Elysia } from 'elysia';
import { authGuard, requireRole } from '../../shared/middleware/auth';
import { createQuizBody, attemptBody } from './quiz.schema';
import * as svc from './quiz.service';
import { ok } from '../../shared/utils/response';

export const quizRoutes = new Elysia({ prefix: '/quiz' })
  .group('', (app) => app.use(requireRole('teacher'))
    .post('/', async ({ user, body }: any) => ok(await svc.createQuiz(user.id, body)),
      { body: createQuizBody }))
  .group('', (app) => app.use(authGuard)
    .get('/class/:classId', async ({ params }) => ok(await svc.listQuiz(params.classId))))
  .group('', (app) => app.use(requireRole('student'))
    .post('/attempt', async ({ user, body }: any) => ok(await svc.attempt(user.id, body.quizId, body.answers)),
      { body: attemptBody }));
```

### 7.7 `materials` — HTML → halaman interaktif

Materi dikirim guru sebagai kumpulan **blok** (HTML, video, checkpoint). HTML **disanitasi** sebelum disimpan agar aman, lalu endpoint viewer merender jadi halaman interaktif (blok `checkpoint` jadi soal cepat di tengah materi).

```ts
// features/materials/materials.schema.ts
import { t } from 'elysia';

const block = t.Union([
  t.Object({ type: t.Literal('html'), content: t.String() }),
  t.Object({ type: t.Literal('video'), url: t.String() }),
  t.Object({ type: t.Literal('checkpoint'), question: t.String(),
             options: t.Array(t.String()), answer: t.Number() }),
]);
export const createMaterialBody = t.Object({
  classId: t.String(),
  title: t.String(),
  blocks: t.Array(block, { minItems: 1 }),
});
```

```ts
// features/materials/materials.repository.ts
import { collections } from '../../config/astra';
import { randomUUID } from 'crypto';

export const materialsRepo = {
  create: (doc: any) => collections.materials().insertOne({ _id: randomUUID(), ...doc }),
  findById: (id: string) => collections.materials().findOne({ _id: id }),
  listByClass: (classId: string) =>
    collections.materials().find({ classId }, { sort: { createdAt: -1 } }).toArray(),
};
```

```ts
// features/materials/materials.service.ts
import sanitizeHtml from 'sanitize-html';
import { materialsRepo } from './materials.repository';
import { NotFound } from '../../shared/utils/errors';

// Fitur: sanitasi tiap blok HTML sebelum simpan
export async function createMaterial(teacherId: string, dto: any) {
  const blocks = dto.blocks.map((b: any) =>
    b.type === 'html' ? { ...b, content: sanitizeHtml(b.content) } : b);
  const doc = { classId: dto.classId, title: dto.title, blocks, teacherId, createdAt: new Date().toISOString() };
  const res = await materialsRepo.create(doc);
  return { id: res.insertedId };
}

// Fitur: render materi jadi halaman interaktif (HTML utuh)
export async function renderMaterial(id: string) {
  const m = await materialsRepo.findById(id);
  if (!m) throw NotFound('Materi tidak ditemukan');
  const body = m.blocks.map(renderBlock).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${m.title}</title>
    <script src="/viewer.js" defer></script></head>
    <body><h1>${m.title}</h1>${body}</body></html>`;
}

function renderBlock(b: any) {
  if (b.type === 'html')  return `<section class="mat">${b.content}</section>`;
  if (b.type === 'video') return `<video src="${b.url}" controls></video>`;
  // checkpoint jadi soal interaktif (dinilai di sisi client oleh viewer.js)
  const opts = b.options.map((o: string, i: number) =>
    `<button data-i="${i}">${o}</button>`).join('');
  return `<div class="checkpoint" data-answer="${b.answer}"><p>${b.question}</p>${opts}</div>`;
}

export const listMaterials = (classId: string) => materialsRepo.listByClass(classId);
```

```ts
// features/materials/materials.routes.ts
import { Elysia } from 'elysia';
import { authGuard, requireRole } from '../../shared/middleware/auth';
import { createMaterialBody } from './materials.schema';
import * as svc from './materials.service';
import { ok } from '../../shared/utils/response';

export const materialsRoutes = new Elysia({ prefix: '/materials' })
  .group('', (app) => app.use(requireRole('teacher'))
    .post('/', async ({ user, body }: any) => ok(await svc.createMaterial(user.id, body)),
      { body: createMaterialBody }))
  .group('', (app) => app.use(authGuard)
    .get('/class/:classId', async ({ params }) => ok(await svc.listMaterials(params.classId)))
    // viewer: kirim HTML mentah, bukan envelope JSON
    .get('/:id/view', async ({ params, set }) => {
      set.headers['content-type'] = 'text/html';
      return await svc.renderMaterial(params.id);
    }));
```

### 7.8 `grading` — penilaian + sinkron Google Sheets

Guru menilai submission → skor disimpan di AstraDB → **otomatis di-upsert** ke Google Sheet kelas (baris = siswa, kolom = tugas). Jika sinkron gagal, `syncedToSheet=false` dan bisa di-retry.

```ts
// features/grading/grading.schema.ts
import { t } from 'elysia';

export const gradeBody = t.Object({
  assignmentId: t.String(),
  studentId: t.String(),
  score: t.Number({ minimum: 0, maximum: 100 }),
  feedback: t.Optional(t.String()),
});
```

```ts
// features/grading/grading.sheets.ts
import { sheetsClient } from '../../config/sheets';

// Fitur: pastikan kolom tugas ada di header, kembalikan huruf kolomnya
async function ensureColumn(spreadsheetId: string, title: string): Promise<string> {
  const header = await sheetsClient.spreadsheets.values.get({
    spreadsheetId, range: 'A1:1',
  });
  const cols: string[] = header.data.values?.[0] ?? [];
  let idx = cols.indexOf(title);
  if (idx === -1) {
    idx = cols.length;
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId, range: `${colLetter(idx)}1`,
      valueInputOption: 'RAW', requestBody: { values: [[title]] },
    });
  }
  return colLetter(idx);
}

// Fitur: cari baris siswa berdasarkan NIS di kolom B
async function findRow(spreadsheetId: string, nis: string): Promise<number> {
  const col = await sheetsClient.spreadsheets.values.get({ spreadsheetId, range: 'B:B' });
  const rows = col.data.values ?? [];
  const found = rows.findIndex((r) => r[0] === nis);
  return found === -1 ? -1 : found + 1;              // 1-indexed
}

// Fitur: upsert 1 nilai ke sel (baris siswa × kolom tugas). Idempotent.
export async function upsertGrade(
  spreadsheetId: string, nis: string, name: string, title: string, score: number,
) {
  const column = await ensureColumn(spreadsheetId, title);
  let row = await findRow(spreadsheetId, nis);
  if (row === -1) row = await appendStudentRow(spreadsheetId, nis, name);
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId, range: `${column}${row}`,
    valueInputOption: 'RAW', requestBody: { values: [[score]] },
  });
}

async function appendStudentRow(spreadsheetId: string, nis: string, name: string) {
  const res = await sheetsClient.spreadsheets.values.append({
    spreadsheetId, range: 'A:C', valueInputOption: 'RAW',
    requestBody: { values: [['', nis, name]] },
  });
  const updated = res.data.updates?.updatedRange ?? '';
  return Number(updated.match(/\d+$/)?.[0] ?? 2);
}

function colLetter(i: number): string {
  let s = ''; i++;
  while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
  return s;
}
```

```ts
// features/grading/grading.repository.ts
import { collections } from '../../config/astra';
import { supabaseAdmin } from '../../config/supabase';

export const gradingRepo = {
  upsertGrade: (doc: any) =>
    collections.grades().updateOne(
      { _id: doc._id }, { $set: doc }, { upsert: true }),

  markSynced: (id: string) =>
    collections.grades().updateOne({ _id: id }, { $set: { syncedToSheet: true } }),

  // data pendukung untuk baris spreadsheet
  studentInfo: (studentId: string) =>
    supabaseAdmin.from('profiles').select('full_name, identifier').eq('id', studentId).single(),

  classSheet: (classId: string) =>
    supabaseAdmin.from('classes').select('spreadsheet_id').eq('id', classId).single(),

  assignmentTitle: (assignmentId: string) =>
    collections.assignments().findOne({ _id: assignmentId }, { projection: { title: 1, classId: 1 } }),
};
```

```ts
// features/grading/grading.service.ts
import { gradingRepo } from './grading.repository';
import { upsertGrade } from './grading.sheets';
import { collections } from '../../config/astra';
import { NotFound } from '../../shared/utils/errors';

// Fitur: guru beri nilai → simpan + sinkron ke sheet + tandai submission graded
export async function gradeSubmission(teacherId: string, dto: any) {
  const assignment = await gradingRepo.assignmentTitle(dto.assignmentId);
  if (!assignment) throw NotFound('Tugas tidak ditemukan');

  const _id = `${dto.assignmentId}:${dto.studentId}`;
  const grade = {
    _id, assignmentId: dto.assignmentId, classId: assignment.classId,
    studentId: dto.studentId, score: dto.score, feedback: dto.feedback ?? '',
    gradedBy: teacherId, gradedAt: new Date().toISOString(), syncedToSheet: false,
  };
  await gradingRepo.upsertGrade(grade);
  await collections.submissions().updateOne(
    { assignmentId: dto.assignmentId, studentId: dto.studentId }, { $set: { status: 'graded' } });

  await syncToSheet(grade, assignment.title).catch((e) => console.error('Sheet sync gagal:', e));
  return grade;
}

// Fitur: sinkron 1 nilai ke Google Sheet kelas
async function syncToSheet(grade: any, title: string) {
  const sheet = await gradingRepo.classSheet(grade.classId);
  if (!sheet.data?.spreadsheet_id) return;               // kelas belum punya sheet
  const student = await gradingRepo.studentInfo(grade.studentId);
  await upsertGrade(
    sheet.data.spreadsheet_id, student.data!.identifier,
    student.data!.full_name, title, grade.score);
  await gradingRepo.markSynced(grade._id);
}

// Fitur: retry semua nilai yang belum tersinkron (dipanggil manual / cron)
export async function retrySync(classId: string) {
  const pending = await collections.grades()
    .find({ classId, syncedToSheet: false }).toArray();
  for (const g of pending) {
    const a = await gradingRepo.assignmentTitle(g.assignmentId);
    if (a) await syncToSheet(g, a.title).catch(() => {});
  }
  return { retried: pending.length };
}
```

```ts
// features/grading/grading.routes.ts
import { Elysia } from 'elysia';
import { requireRole } from '../../shared/middleware/auth';
import { gradeBody } from './grading.schema';
import * as svc from './grading.service';
import { ok } from '../../shared/utils/response';

export const gradingRoutes = new Elysia({ prefix: '/grading' })
  .use(requireRole('teacher'))
  .post('/', async ({ user, body }: any) => ok(await svc.gradeSubmission(user.id, body)),
    { body: gradeBody })
  .post('/sync/:classId', async ({ params }) => ok(await svc.retrySync(params.classId)));
```

---

## 8. Entry Point — `src/index.ts`

```ts
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { env } from './config/env';
import { errorHandler } from './shared/middleware/error';

import { authRoutes } from './features/auth/auth.routes';
import { classesRoutes } from './features/classes/classes.routes';
import { groupsRoutes } from './features/groups/groups.routes';
import { assignmentsRoutes } from './features/assignments/assignments.routes';
import { submissionsRoutes } from './features/submissions/submissions.routes';
import { quizRoutes } from './features/quiz/quiz.routes';
import { materialsRoutes } from './features/materials/materials.routes';
import { gradingRoutes } from './features/grading/grading.routes';

const app = new Elysia()
  .use(cors())
  .use(swagger({ path: '/docs' }))
  .use(errorHandler)
  .get('/health', () => ({ status: 'ok' }))
  .group('/api', (api) => api
    .use(authRoutes)
    .use(classesRoutes)
    .use(groupsRoutes)
    .use(assignmentsRoutes)
    .use(submissionsRoutes)
    .use(quizRoutes)
    .use(materialsRoutes)
    .use(gradingRoutes))
  .listen(env.PORT);

console.log(`🚀 SIAKAD backend jalan di :${env.PORT} — docs di /docs`);
```

---

## 9. Ringkasan API Endpoint

| Method | Path | Role | Fungsi |
|---|---|---|---|
| POST | `/api/auth/login` | publik | Verifikasi NIS/NIP+password → JWT (dipanggil NextAuth) |
| POST | `/api/auth/accounts` | guru | Buat akun siswa/guru (NIS/NIP + password) |
| GET  | `/api/auth/me` | login | Info user aktif |
| POST | `/api/classes` | guru | Buat kelas |
| GET  | `/api/classes` | guru | Kelas yang diampu |
| POST | `/api/classes/:id/enroll` | guru | Daftarkan siswa |
| GET  | `/api/classes/:id/students` | guru | Daftar siswa kelas |
| POST | `/api/groups` | siswa | Buat kelompok |
| POST | `/api/groups/join` | siswa | Gabung kelompok |
| GET  | `/api/groups/class/:classId` | siswa | List kelompok kelas |
| POST | `/api/assignments` | guru | Buat tugas (+deadline) |
| GET  | `/api/assignments/class/:classId` | login | List tugas |
| GET  | `/api/assignments/:id` | login | Detail tugas |
| POST | `/api/submissions` | siswa | Kumpul tugas (file+link) |
| PUT  | `/api/submissions/:id` | siswa | Ubah file/link |
| DELETE | `/api/submissions/:id` | siswa | Hapus tugas terkirim |
| GET  | `/api/submissions/assignment/:id` | guru | Cek tugas siswa |
| POST | `/api/quiz` | guru | Buat quiz |
| GET  | `/api/quiz/class/:classId` | login | List quiz (tanpa kunci) |
| POST | `/api/quiz/attempt` | siswa | Kerjakan quiz (auto-grade) |
| POST | `/api/materials` | guru | Kirim materi |
| GET  | `/api/materials/class/:classId` | login | List materi |
| GET  | `/api/materials/:id/view` | login | Halaman materi interaktif |
| POST | `/api/grading` | guru | Beri nilai (+sync sheet) |
| POST | `/api/grading/sync/:classId` | guru | Retry sinkron nilai |

---

## 10. Setup & Menjalankan

**`.env`**

```env
# --- Backend Elysia ---
PORT=3000
AUTH_JWT_SECRET=<random-string-panjang>   # penanda tangan JWT API
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...                   # backend hanya pakai service key
ASTRA_DB_ENDPOINT=https://xxx-region.apps.astra.datastax.com
ASTRA_DB_TOKEN=AstraCS:...
GOOGLE_SA_EMAIL=siakad@project.iam.gserviceaccount.com
GOOGLE_SA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# --- Frontend Next.js ---
# AUTH_SECRET=...           # secret cookie NextAuth (beda dari AUTH_JWT_SECRET)
# API_URL=http://localhost:3000
```

**Instalasi & run**

```bash
# Backend (Elysia)
bun add elysia @elysiajs/cors @elysiajs/swagger jose \
        @supabase/supabase-js @datastax/astra-db-ts googleapis sanitize-html
# hashing pakai Bun.password (bawaan, tanpa install)

bun run src/index.ts        # dev
bun build src/index.ts --outdir dist --target bun   # produksi

# Frontend (Next.js) — auth
# npm i next-auth@beta
```

**Persiapan eksternal**

1. **Supabase** — jalankan SQL bagian 4.1 (termasuk tabel `credentials`), buat bucket privat `submissions`. **Supabase Auth tidak dipakai**; identitas ditangani Elysia+NextAuth. Buat 1 akun guru/admin awal manual (insert `profiles` + `credentials` dengan hash argon2) untuk bisa membuat akun siswa.
2. **AstraDB** — buat database, buat 6 koleksi (`materials`, `assignments`, `submissions`, `quizzes`, `quiz_attempts`, `grades`).
3. **Google Sheets** — buat Service Account, **share tiap spreadsheet kelas** ke email SA sebagai Editor, simpan `spreadsheet_id` di tabel `classes`.
4. **Next.js** — pasang `next-auth@beta`, salin `auth.ts` bagian 7.1, set `API_URL` & `AUTH_SECRET`.

---

## 11. Catatan Keamanan & Skalabilitas

- **Otorisasi di service layer**: karena backend pakai service key (RLS `auth.uid()` tak berlaku), otorisasi wajib eksplisit — cek role di `requireRole` + cek kepemilikan data di service (mis. `sub.studentId === user.id`). Jangan pernah percaya `studentId`/`role` dari body request; ambil dari `user` hasil verifikasi JWT.
- **Password**: hanya simpan hash `Bun.password` (argon2), tidak pernah plaintext. Set `must_reset=true` untuk password awal buatan guru agar siswa ganti saat pertama login.
- **File aman**: bucket privat + signed URL kadaluarsa, bukan URL publik. Validasi `mime` & ukuran sebelum upload (tambahkan di `submit`).
- **HTML materi disanitasi** (`sanitize-html`) untuk cegah XSS saat dirender di viewer.
- **Optimistic concurrency** pada edit submission (`version`) mencegah dua tab saling menimpa.
- **Idempotent grading**: `_id = assignmentId:studentId`, nilai ulang cukup menimpa, tidak duplikat. Sinkron sheet juga idempotent per sel.
- **Rate limit** login & submit (mis. `@elysiajs/rate-limit`) untuk cegah brute-force/spam.
- **Skala**: query AstraDB selalu lewat partition key (`classId`, `assignmentId`, `studentId`). Untuk sheet sync volume besar, ganti pemanggilan langsung dengan **antrian** (BullMQ/Bun worker) agar tidak kena rate limit Google API.

---

## 12. Ide Lanjutan (opsional)

- **Notifikasi** siswa saat tugas dinilai / mendekati deadline (Supabase Realtime / email).
- **Plagiarisme sederhana** — hash file submission, tandai duplikat antar siswa.
- **Rekap otomatis** — endpoint export nilai 1 kelas ke PDF rapor.
- **Analitik guru** — rata-rata kelas per tugas, distribusi nilai, tugas paling banyak telat.
- **Quiz variatif** — soal esai (dinilai manual) & acak urutan soal per siswa.
- **Versioning materi** — simpan riwayat perubahan materi agar bisa di-rollback.
- **Bank soal** — quiz disusun dari kumpulan soal reusable lintas kelas.
