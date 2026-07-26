# SPEC-00 — Foundation (Config, Shared Layer, Entry Point)

| | |
|---|---|
| **Bergantung pada** | — (paling awal) |
| **Database** | Supabase (klien), AstraDB (klien), Google Sheets (klien) |
| **Estimasi** | ~10 file, semua < 150 baris |

---

## 1. Tujuan

Menyiapkan pondasi yang dipakai **semua** fitur: koneksi database, autentikasi JWT, error handling seragam, dan akses file storage. Tidak ada fitur bisnis di spec ini.

## 2. Ruang Lingkup

**Termasuk**
- Validasi environment variable saat boot (gagal cepat)
- Klien Supabase, AstraDB, Google Sheets
- Util JWT (sign & verify) dan hashing password
- Middleware: auth guard, role guard, error handler
- Util response envelope & kelas error
- Helper Supabase Storage (upload, signed URL, hapus)
- Entry point Elysia + Swagger + CORS

**Tidak termasuk**
- Endpoint fitur apa pun (ada di SPEC-01..08)
- Skema tabel Supabase (dibuat di spec yang memakainya)

## 3. Environment Variable

```env
PORT=3000
AUTH_JWT_SECRET=<random panjang>
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
ASTRA_DB_ENDPOINT=...
ASTRA_DB_TOKEN=AstraCS:...
GOOGLE_SA_EMAIL=...
GOOGLE_SA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n"
```

## 4. Kontrak Antar-Layer

**Response envelope** — semua endpoint mengembalikan bentuk ini:

```jsonc
// sukses
{ "success": true, "data": { } }
// gagal
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

**Kelas error** — `AppError(status, code, message)` plus helper `NotFound`, `Forbidden`, `BadRequest`, `Conflict`, masing-masing memetakan ke HTTP status yang benar (404/403/400/409).

**Context auth** — setelah `authGuard`, context punya `user: { id, role, token }`. `role` bertipe `'teacher' | 'student'`.

**JWT** — payload `{ sub: profileId, role, name }`, algoritma HS256, kedaluwarsa **8 jam**, ditandatangani dengan `AUTH_JWT_SECRET` memakai `jose`.

**Password** — hash & verify memakai `Bun.password` (argon2). Tidak ada dependency tambahan.

**Storage** — bucket privat `submissions`, akses lewat **signed URL** (default 1 jam), tidak pernah public URL.

## 5. Aturan Bisnis

- **BR-00-1** — Aplikasi **gagal boot** kalau ada env yang belum diset, dengan pesan menyebut nama env-nya.
- **BR-00-2** — `authGuard` memverifikasi JWT **tanpa query database**; identitas diambil dari payload token.
- **BR-00-3** — Token tidak ada / tidak valid / kedaluwarsa → `401 UNAUTHORIZED`.
- **BR-00-4** — `requireRole(role)` menolak role yang tidak cocok dengan `403 FORBIDDEN`.
- **BR-00-5** — Semua error yang tidak tertangani → `500` dengan pesan generik; detail asli hanya di log server, tidak dikirim ke client.
- **BR-00-6** — Backend mengakses Supabase memakai **service key** saja. Tidak ada klien "atas nama user".

## 6. File yang Dibuat

| File | Isi | Target |
|---|---|---|
| `src/config/env.ts` | Validasi & ekspor env | < 40 |
| `src/config/supabase.ts` | Klien admin | < 20 |
| `src/config/astra.ts` | Klien + daftar koleksi | < 30 |
| `src/config/sheets.ts` | Klien Google Sheets (JWT SA) | < 20 |
| `src/shared/types.ts` | `Role`, `AuthUser` | < 15 |
| `src/shared/utils/errors.ts` | `AppError` + helper | < 30 |
| `src/shared/utils/response.ts` | `ok`, `fail` | < 15 |
| `src/shared/auth/password.ts` | hash & verify | < 15 |
| `src/shared/auth/jwt.ts` | sign & verify token | < 40 |
| `src/shared/middleware/auth.ts` | `authGuard`, `requireRole` | < 40 |
| `src/shared/middleware/error.ts` | Error handler global | < 25 |
| `src/shared/storage/files.ts` | upload / signedUrl / remove | < 45 |
| `src/index.ts` | Entry point, gabung fitur | < 45 |

## 7. Kriteria Penerimaan

- [ ] `bun run src/index.ts` jalan, `GET /health` mengembalikan `{ status: 'ok' }`
- [ ] Menghapus 1 env lalu boot → error jelas menyebut nama env tersebut
- [ ] `GET /docs` menampilkan Swagger
- [ ] Request tanpa header Authorization ke endpoint ber-`authGuard` → `401` berbentuk envelope
- [ ] Token siswa dipakai di endpoint `requireRole('teacher')` → `403`
- [ ] Token yang sudah lewat 8 jam → `401`
- [ ] Error tak terduga tidak membocorkan stack trace ke client
- [ ] Semua file di bawah target baris

## 8. Catatan

- `AUTH_JWT_SECRET` (backend) **berbeda** dari `AUTH_SECRET` (cookie NextAuth di frontend). Jangan disamakan.
- Daftar koleksi AstraDB dipusatkan di `config/astra.ts` supaya nama koleksi tidak salah ketik di banyak tempat.
