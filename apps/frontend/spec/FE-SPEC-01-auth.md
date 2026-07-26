# FE-SPEC-01 — Auth UI (Login, Token Store, Route Guard)

| | |
|---|---|
| **Bergantung pada** | FE-00 |
| **Endpoint backend** | `POST /auth/login`, `GET /auth/me` |
| **Estimasi** | 5 file, semua < 120 baris |

---

## 1. Tujuan

Halaman login NIS/NIP + password, penyimpanan token, dan pengarahan halaman sesuai role. **Semua verifikasi ada di backend** — frontend hanya mengirim, menyimpan, dan melampirkan token.

## 2. Catatan Arsitektur

Rencana awal memakai **NextAuth**, tapi itu khusus Next.js dan **tidak bisa dipakai di Svelte + Vite (SPA)**. Tidak masalah: Elysia sudah menerbitkan JWT sendiri, jadi frontend cukup:

1. Kirim NIS+password ke `/auth/login`
2. Simpan token yang dikembalikan
3. Lampirkan sebagai `Authorization: Bearer` di setiap panggilan berikutnya

> Kalau nanti pindah ke **SvelteKit**, padanan NextAuth adalah `@auth/sveltekit` dengan Credentials provider — polanya sama persis dengan yang dirancang di backend SPEC-01.

## 3. Ruang Lingkup

**Termasuk**
- Halaman login
- Store sesi (token + info user)
- Route guard: belum login → login; salah role → halaman miliknya
- Tombol keluar

**Tidak termasuk**
- Registrasi mandiri (akun dibuat guru — lihat FE-03)
- Lupa password (belum ada di backend)

## 4. Halaman & Route

| Route | Akses | Isi |
|---|---|---|
| `/login` | publik | Form NIS/NIP + password |
| `/` | login | Alihkan: guru → `/guru`, siswa → `/siswa` |

## 5. Tampilan Login

Satu kartu di tengah layar:

- Latar halaman `base`, dengan blok dekoratif `surface` dan `accent` di sudut (statis, bukan animasi)
- Kartu: latar `base`, `border-[3px]`, `shadow-brutal-xl`
- Judul "SIAKAD" dengan `font-display`, ukuran besar
- Field **NIS / NIP** (`font-mono`, `inputmode="numeric"`) dan **Password**
- Tombol Masuk: `variant primary`, lebar penuh — satu-satunya CTA di layar
- Area pesan kesalahan: latar `accent`, teks hitam, `border-2`

## 6. State & Store

`src/lib/stores/auth.svelte.ts`:

```ts
{ token: string | null, user: { id, name, role } | null,
  isAuthenticated: boolean, login(), logout(), restore() }
```

## 7. Aturan UI

- **UI-01-1** — Tombol Masuk nonaktif selama permintaan berjalan dan menampilkan keadaan memuat, agar tidak terkirim ganda.
- **UI-01-2** — Pesan gagal login **memakai `message` dari backend apa adanya**. Jangan membedakan sendiri antara "NIS tidak ada" dan "password salah" — backend sengaja menyamakannya demi keamanan.
- **UI-01-3** — Password memakai `type="password"` dengan tombol lihat/sembunyikan. **Tidak pernah** disimpan di store, localStorage, atau log.
- **UI-01-4** — Setelah login sukses, arahkan sesuai `role` dari response: `teacher` → `/guru`, `student` → `/siswa`.
- **UI-01-5** — Token disimpan di `sessionStorage` (hilang saat tab ditutup) dan dimuat ulang ke memori saat aplikasi dibuka. **Jangan `localStorage`** — token 8 jam yang menetap di perangkat bersama sekolah berisiko dipakai orang lain.
- **UI-01-6** — Membuka route terlindungi tanpa token → alihkan ke `/login`, ingat tujuan awal, lalu kembalikan ke sana setelah berhasil masuk.
- **UI-01-7** — Membuka route milik role lain (siswa membuka `/guru`) → alihkan ke beranda role-nya sendiri, **tanpa** pesan kesalahan yang membingungkan.
- **UI-01-8** — Response `401` dari endpoint mana pun → bersihkan sesi, alihkan ke `/login`, tampilkan pesan "Sesi berakhir, silakan masuk lagi".
- **UI-01-9** — Sudah login lalu membuka `/login` → alihkan ke beranda role-nya.
- **UI-01-10** — Keluar membersihkan token dari memori **dan** `sessionStorage`, lalu ke `/login`.
- **UI-01-11** — Menyembunyikan menu berdasarkan role hanya demi kenyamanan. Frontend **tidak** menganggap itu pengaman; backend yang menolak.

## 8. File yang Dibuat

| File | Isi | Target |
|---|---|---|
| `src/lib/stores/auth.svelte.ts` | State sesi + persist | < 80 |
| `src/routes/Login.svelte` | Halaman login | < 120 |
| `src/lib/components/RouteGuard.svelte` | Pembungkus route terlindungi | < 60 |
| `src/lib/router.ts` | Definisi route + guard | < 70 |
| `src/lib/api/auth.ts` | `login()`, `me()` | < 30 |

## 9. Kriteria Penerimaan

- [ ] Login NIS+password benar → masuk, diarahkan sesuai role
- [ ] Login salah → pesan dari backend tampil di area `accent`
- [ ] Klik Masuk dua kali cepat → hanya satu permintaan terkirim
- [ ] Muat ulang halaman setelah login → tetap masuk (tidak balik ke login)
- [ ] Tutup tab lalu buka lagi → **harus login ulang**
- [ ] Buka `/guru` tanpa login → dialihkan ke `/login`, dan setelah masuk kembali ke `/guru`
- [ ] Siswa membuka `/guru` → dialihkan ke `/siswa`
- [ ] Token dihapus manual dari sessionStorage lalu panggil API → dialihkan ke login dengan pesan sesi berakhir
- [ ] Sudah login lalu buka `/login` → dialihkan ke beranda
- [ ] Keluar → token bersih, tidak bisa kembali dengan tombol Back
- [ ] Password tidak muncul di `sessionStorage` maupun konsol
