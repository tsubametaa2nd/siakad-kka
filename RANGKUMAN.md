# Panduan & Rangkuman Lengkap: Deployment ElysiaJS di Vercel (Bebas Error 500)

Dokumen ini berisi panduan lengkap, analisis penyebab **HTTP 500 Internal Server Error / `FUNCTION_INVOCATION_FAILED`**, serta rekomendasi pendekatan terbaik untuk men-deploy backend **ElysiaJS** ke platform **Vercel**.

---

## 📌 Ringkasan Eksekutif

ElysiaJS dirancang secara bawaan (*native*) untuk **Bun runtime**. Saat di-deploy ke Vercel (lingkungan *Serverless Function*), terjadi perbedaan skenario eksekusi dibanding server VPS konvensional:
1. Vercel menjalankan fungsi secara *on-demand* (serverless), bukan proses server yang terus berjalan (*long-running process*).
2. Kegagalan konfigurasi runtime, *path alias*, atau *top-level code execution* akan langsung memicu **HTTP 500**.

---

## 🛠️ Pendekatan Deployment Terbaik (Deployment Approaches)

Terdapat 2 pendekatan utama untuk men-deploy Elysia ke Vercel:

### 1. Pendekatan A: Zero-Config (Bun Runtime Vercel)
Mengandalkan Vercel untuk mendeteksi Bun dan langsung mengeksekusi *source code* TypeScript Elysia.

- **Kelebihan**: Cepat & simpel untuk proyek skala kecil.
- **Kekurangan**: Rentan masalah resolver `tsconfig` (*path alias*) dan kompatibilitas paket saat *build*.

### 2. Pendekatan B: Manual Bundling / Pre-build (`bun build`) ⭐ **[SANGAT DIREKOMENDASIKAN]**
Mengompilasi (*bundle*) seluruh *source code* Elysia dan dependensinya menjadi satu file JavaScript JavaScript (ESM) sebelum Vercel memprosesnya.

- **Kelebihan**: 
  - 100% bebas dari masalah *path alias* (`@/...`).
  - *Cold start* jauh lebih cepat.
  - Menghindari kegagalan resolusi modul (*module resolution error*) di Vercel Builder.

---

## 🚨 6 Penyebab Utama HTTP Error 500 & Solusinya

Berikut adalah penyebab tersering HTTP 500 di Vercel beserta solusinya:

### 1. Memanggil `.listen()` di Serverless Environment
- **Masalah**: Fungsi `app.listen(3000)` mencoba mendaftarkan port jaringan di serverless function yang tidak memiliki akses port biasa. Ini menyebabkan Vercel timeout atau crash.
- **Solusi**: Hanya panggil `.listen()` jika aplikasi berjalan di environment non-Vercel (misal: lokal dev). Export instance Elysia secara langsung.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
  .get('/', () => 'Hello Vercel!')
  .get('/api/health', () => ({ status: 'ok' }))

// ❌ JANGAN LAKUKAN INI: app.listen(3000)

// ✅ LAKUKAN INI: Export instance Elysia sebagai default export
export default app
```

---

### 2. Path Alias (`tsconfig.json`) Rusak saat Build di Vercel
- **Masalah**: Penggunaan path alias seperti `@/services/...` di `tsconfig.json` sering tidak terresolusi dengan benar oleh Vercel Serverless Builder, menyebabkan `Cannot find module '@/...'` (Exit Status 1 / Error 500).
- **Solusi A**: Gunakan relative import (misal `../../services/...`).
- **Solusi B (Terbaik)**: Gunakan script `bun build` untuk mem-bundle aplikasi sebelum dipublikasikan ke Vercel.

---

### 3. Ketidakcocokan Runtime (Bun vs Node.js) & Native Bun API
- **Masalah**: Secara standar, Vercel menggunakan **Node.js runtime**. Jika kode Anda menggunakan API bawaan Bun (seperti `Bun.file()`, `Bun.password`, atau `bun:sqlite`), fungsi akan *crash* dengan pesan error `Bun is not defined`.
- **Solusi**: 
  1. Aktifkan Bun runtime di Vercel melalui `vercel.json`:
     ```json
     {
       "$schema": "https://openapi.vercel.sh/vercel.json",
       "bunVersion": "1.x"
     }
     ```
  2. Jika menggunakan Node runtime, ganti API khusus Bun dengan API standar Web/Node (misal: `@libsql/client` / `pg` untuk database).

---

### 4. `package.json` Tanpa `"type": "module"` atau Dependensi Salah Tempat
- **Masalah**: 
  - Elysia berbasis ESM (*ES Modules*). Tanpa `"type": "module"`, Node/Vercel akan melempar `SyntaxError: Cannot use import statement outside a module`.
  - Paket yang dibutuhkan di runtime terpasang di `devDependencies`. Vercel hanya menginstal `dependencies` untuk Serverless Function.
- **Solusi**:
  1. Pastikan `package.json` memiliki `"type": "module"`.
  2. Pindahkan dependensi runtime (misal `elysia`, `@elysiajs/cors`, `drizzle-orm`) ke bagian `"dependencies"`.

---

### 5. Uncaught Exception pada Database Connection / Top-Level Async
- **Masalah**: Koneksi database (Prisma/Drizzle/Kysely) atau *top-level await* yang gagal saat *cold start* akan menggagalkan inisialisasi Serverless Function secara keseluruhan.
- **Solusi**: Bungkus inisialisasi sensitif dengan *error handling* atau buat *connection pool* yang bersifat *lazy loading*. Gunakan *global error handler* Elysia:

```typescript
import { Elysia } from 'elysia'

export const app = new Elysia()
  .onError(({ code, error, set }) => {
    console.error(`[Elysia Error ${code}]:`, error)
    set.status = code === 'NOT_FOUND' ? 404 : 500
    return {
      success: false,
      message: error.message || 'Internal Server Error'
    }
  })
  .get('/', () => 'OK')

export default app
```

---

### 6. Struktur File & Routing Vercel yang Keliru
- **Masalah**: Vercel Serverless mengarahkan trafik berdasarkan struktur direktori `api/` atau konfigurasi *rewrites*.
- **Solusi**: Atur `vercel.json` agar seluruh *route* diarahkan ke *entry point* Elysia.

---

## 📑 Struktur Konfigurasi Lengkap & Siap Pakai

Berikut adalah templat file konfigurasi untuk deployment yang stabil:

### 1. `package.json`
```json
{
  "name": "my-elysia-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build ./src/index.ts --outfile ./dist/index.js --target bun",
    "vercel-build": "bun run build"
  },
  "dependencies": {
    "elysia": "^1.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "bun-types": "latest"
  }
}
```

### 2. `vercel.json`
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "bunVersion": "1.x",
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.ts"
    }
  ]
}
```

> **Catatan Struktur File**:
> Buat file `api/index.ts` sebagai jembatan untuk Vercel Serverless Function:
> 
> ```typescript
> // api/index.ts
> import app from '../src/index'
> 
> export default app
> ```

### 3. `src/index.ts` (Entry Point Utama)
```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
  .onError(({ code, error }) => {
    console.error(`[Elysia Error] ${code}:`, error)
    return { success: false, error: error.message }
  })
  .get('/', () => ({ message: 'Elysia API running smoothly on Vercel' }))
  .get('/health', () => ({ status: 'healthy', timestamp: new Date().toISOString() }))

// Hanya listen jika dijalankan secara lokal
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(3000, () => {
    console.log('🦊 Elysia is running on http://localhost:3000')
  })
}

export default app
```

---

## 🔍 Cara Debugging Jika Tetap Mengalami Error 500

1. **Cek Vercel Runtime Logs**:
   Jalankan perintah Vercel CLI di terminal untuk melihat detail *stack trace*:
   ```bash
   vercel logs <deployment-url>
   ```
2. **Uji Serverless Function Secara Lokal**:
   Gunakan Vercel CLI untuk menyimulasikan lingkungan Vercel di mesin lokal:
   ```bash
   vercel dev
   ```
3. **Periksa Environment Variables**:
   Pastikan variabel seperti `DATABASE_URL`, `JWT_SECRET`, dll., sudah didaftarkan pada menu **Settings > Environment Variables** di Dashboard Vercel.

---

## ✅ Checklist Sebelum Push ke Git / Deploy

- [ ] Memastikan `export default app` di-export tanpa langsung memanggil `.listen()` secara unconditional.
- [ ] Menambahkan `"type": "module"` pada `package.json`.
- [ ] Memasang `"bunVersion": "1.x"` pada `vercel.json`.
- [ ] Memastikan semua paket dependensi backend ada di `"dependencies"` (bukan `devDependencies`).
- [ ] Memastikan tidak ada *path alias* yang memicu error pembacaan modul (atau sudah di-bundle dengan `bun build`).
- [ ] Memastikan Environment Variables sudah terkonfigurasi di Dashboard Vercel.
- [ ] Menambahkan `app.onError()` untuk *logging error* yang lebih detail.
