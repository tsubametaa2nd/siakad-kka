# SPEC-01 — Auth (Login NIS/NIP, NextAuth, Pembuatan Akun)

| | |
|---|---|
| **Bergantung pada** | SPEC-00 |
| **Database** | **Supabase** (`profiles`, `credentials`) |
| **Estimasi** | 4 file backend |

---

## 1. Tujuan

Guru dan siswa login dengan **NIS/NIP + password**. Akun **dibuatkan oleh guru/admin**, tidak ada registrasi mandiri. NextAuth di frontend, penerbitan & verifikasi token di Elysia.

## 2. Ruang Lingkup

**Termasuk**
- Tabel `profiles` & `credentials`
- Endpoint login (dipanggil NextAuth), buat akun, cek user aktif
- Konfigurasi NextAuth Credentials provider

**Tidak termasuk**
- Reset password mandiri lewat email (belum ada email service)
- OAuth / login Google

## 3. Alur Auth

```
Browser → NextAuth signIn('credentials', { username, password })
            ↓  authorize()
        POST {API_URL}/api/auth/login   (Elysia)
            ↓  verifikasi argon2 ke tabel credentials
        { token: <JWT 8 jam>, user: { id, name, role } }
            ↓  disimpan di session NextAuth
Browser → fetch Elysia lain dengan header: Authorization: Bearer <token>
```

**Elysia adalah satu-satunya penerbit & pemverifikasi token.** NextAuth hanya membungkusnya jadi sesi web.

## 4. Data Model (Supabase)

```sql
create type user_role as enum ('teacher', 'student');

create table profiles (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  role        user_role not null,
  identifier  text unique,               -- NIS (siswa) / NIP (guru)
  created_at  timestamptz default now()
);

create table credentials (
  profile_id    uuid primary key references profiles(id) on delete cascade,
  username      text unique not null,    -- = NIS / NIP
  password_hash text not null,           -- Bun.password (argon2)
  must_reset    boolean default false,
  created_at    timestamptz default now()
);
```

## 5. Endpoint

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/api/auth/login` | publik | Verifikasi NIS/NIP+password → JWT |
| POST | `/api/auth/accounts` | guru | Buat akun siswa/guru |
| GET | `/api/auth/me` | login | Info user aktif |

**`POST /auth/login`**
```jsonc
// request
{ "username": "12345", "password": "rahasia" }
// response 200
{ "success": true, "data": {
    "token": "eyJ...", "user": { "id": "uuid", "name": "Budi", "role": "student" } } }
```

**`POST /auth/accounts`**
```jsonc
// request
{ "fullName": "Budi", "username": "12345", "role": "student", "password": "rahasia" }
// response 200
{ "success": true, "data": { "id": "uuid", "username": "12345", "role": "student" } }
```

## 6. Aturan Bisnis

- **BR-01-1** — Login gagal (username tidak ada **atau** password salah) → `401 LOGIN_FAILED` dengan pesan **sama persis** untuk kedua kasus, supaya tidak bisa menebak NIS mana yang terdaftar.
- **BR-01-2** — Password disimpan **hanya** sebagai hash argon2. Tidak pernah plaintext, tidak pernah dikembalikan di response mana pun.
- **BR-01-3** — `username` unik. Membuat akun dengan NIS/NIP yang sudah ada → `409 CONFLICT`.
- **BR-01-4** — Hanya **guru** yang boleh membuat akun. Siswa memanggil `/auth/accounts` → `403`.
- **BR-01-5** — `profiles.identifier` diisi sama dengan `username` (NIS/NIP), dipakai sebagai kunci baris di Google Sheets (lihat SPEC-08).
- **BR-01-6** — Pembuatan akun bersifat **dua langkah** (`profiles` lalu `credentials`). Jika langkah kedua gagal, profil yang telanjur dibuat harus dihapus agar tidak ada profil tanpa kredensial.
- **BR-01-7** — Token berlaku 8 jam. `session.maxAge` NextAuth disamakan agar sesi web tidak hidup lebih lama dari token API.
- **BR-01-8** — Password minimal 6 karakter (validasi skema).

## 7. File yang Dibuat

| File | Isi | Target |
|---|---|---|
| `src/features/auth/auth.schema.ts` | `loginBody`, `createAccountBody` | < 25 |
| `src/features/auth/auth.repository.ts` | Query `profiles` & `credentials` | < 40 |
| `src/features/auth/auth.service.ts` | `login`, `createAccount` | < 70 |
| `src/features/auth/auth.routes.ts` | 3 endpoint | < 40 |

## 8. Kriteria Penerimaan

- [ ] Login NIS+password benar → dapat token, `role` sesuai
- [ ] Login password salah → `401`, pesan **identik** dengan kasus NIS tidak terdaftar
- [ ] Password tidak pernah muncul di response mana pun (cek `/auth/me` juga)
- [ ] Guru buat akun siswa → siswa itu langsung bisa login
- [ ] Siswa memanggil `/auth/accounts` → `403`
- [ ] Buat akun dengan NIS duplikat → `409`
- [ ] `/auth/me` dengan token valid mengembalikan `id`, `role`

## 9. Catatan Setup

Buat **1 akun guru/admin awal secara manual** di Supabase (insert `profiles` + `credentials`), karena `/auth/accounts` butuh login guru — tanpa ini tidak ada yang bisa membuat akun pertama.

Skrip seed opsional:
```bash
bun run scripts/seed-admin.ts   # buat 1 guru: NIP + password dari argumen/env
```
