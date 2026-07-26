# SPEC-07 — Materials (HTML → Halaman Interaktif)

| | |
|---|---|
| **Bergantung pada** | SPEC-00, SPEC-01, SPEC-02 |
| **Database** | **AstraDB** (koleksi `materials`) |
| **Estimasi** | 5 file, semua < 120 baris |

---

## 1. Tujuan

Guru mengirim materi berbentuk **blok-blok** (HTML, video, checkpoint). Sistem merendernya menjadi **halaman interaktif** yang bisa dibuka siswa — dengan soal cepat di tengah materi.

## 2. Ruang Lingkup

**Termasuk**
- Buat, ubah, hapus materi
- Sanitasi HTML sebelum simpan
- Endpoint viewer yang mengembalikan halaman HTML utuh
- Blok `checkpoint` interaktif (dicek di sisi client)

**Tidak termasuk**
- Editor WYSIWYG (itu urusan frontend)
- Menyimpan nilai checkpoint (murni latihan mandiri, tidak dinilai)

## 3. Kenapa Berbasis Blok?

Menyimpan satu bongkahan HTML mentah membuat materi sulit dijadikan interaktif dan berisiko XSS. Dengan blok:

- Tiap tipe blok dirender dengan aturannya sendiri
- Hanya blok `html` yang perlu disanitasi
- Menambah tipe blok baru (kuis, embed, kode) tidak mengubah struktur lama

## 4. Data Model (AstraDB — koleksi `materials`)

```ts
interface Material {
  _id: string;
  classId: string;
  teacherId: string;
  title: string;
  blocks: MaterialBlock[];
  createdAt: string;
  updatedAt: string;
}

type MaterialBlock =
  | { type: 'html';       content: string }                                    // disanitasi
  | { type: 'video';      url: string }
  | { type: 'checkpoint'; question: string; options: string[]; answer: number };
```

## 5. Endpoint

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/api/materials` | guru | Kirim materi |
| PUT | `/api/materials/:id` | guru | Ubah materi |
| DELETE | `/api/materials/:id` | guru | Hapus materi |
| GET | `/api/materials/class/:classId` | login | List materi |
| GET | `/api/materials/:id` | login | Detail (JSON, untuk editor) |
| GET | `/api/materials/:id/view` | login | **Halaman HTML interaktif** |

## 6. Aturan Bisnis

- **BR-07-1** — Semua blok `html` **wajib disanitasi** dengan `sanitize-html` **sebelum disimpan**, bukan saat dirender. Data kotor tidak boleh masuk database.
- **BR-07-2** — Tag `<script>`, atribut `on*` (onclick, onerror, dll), dan `javascript:` URL **selalu dibuang**. Ini pertahanan utama terhadap XSS.
- **BR-07-3** — Tag yang diizinkan: teks & struktur dasar (`p`, `h1`–`h6`, `ul`, `ol`, `li`, `strong`, `em`, `a`, `img`, `table`, `pre`, `code`, `blockquote`, `br`, `hr`). Atribut: `href`, `src`, `alt`, `title`, `class`.
- **BR-07-4** — `GET /:id/view` mengembalikan `Content-Type: text/html`, **bukan** envelope JSON. Ini satu-satunya pengecualian dari aturan envelope.
- **BR-07-5** — Judul materi dan teks pertanyaan checkpoint di-*escape* saat dirender (bukan disanitasi sebagai HTML), karena itu teks biasa.
- **BR-07-6** — Jawaban checkpoint (`answer`) boleh ikut ke client karena sifatnya latihan mandiri, tidak dinilai. Ini **berbeda** dari quiz di SPEC-06 yang kuncinya wajib rahasia.
- **BR-07-7** — URL video divalidasi `http`/`https` saja.
- **BR-07-8** — Hanya guru pengampu kelas yang boleh membuat materi; hanya pembuat yang boleh mengubah/menghapus → selain itu `403`.
- **BR-07-9** — Siswa hanya bisa membuka materi kelas yang dia ikuti → `403`.
- **BR-07-10** — Materi wajib punya minimal 1 blok → `400` kalau kosong.

## 7. File yang Dibuat

| File | Isi | Target |
|---|---|---|
| `src/features/materials/materials.schema.ts` | Skema blok | < 35 |
| `src/features/materials/materials.repository.ts` | Query AstraDB | < 45 |
| `src/features/materials/materials.service.ts` | Sanitasi + logika | < 90 |
| `src/features/materials/materials.render.ts` | Blok → HTML | < 70 |
| `src/features/materials/materials.routes.ts` | 6 endpoint | < 50 |
| `public/viewer.js` | Interaksi checkpoint di client | < 60 |

## 8. Kriteria Penerimaan

- [ ] Guru kirim materi 3 blok (html, video, checkpoint) → tersimpan
- [ ] Kirim HTML berisi `<script>alert(1)</script>` → **tersimpan tanpa** tag script (cek isi database, bukan cuma tampilan)
- [ ] Kirim `<img src=x onerror=alert(1)>` → atribut `onerror` hilang
- [ ] Kirim `<a href="javascript:alert(1)">` → href dibersihkan
- [ ] `GET /:id/view` mengembalikan `Content-Type: text/html`
- [ ] Halaman viewer menampilkan judul, isi, video, dan checkpoint
- [ ] Klik opsi checkpoint memberi umpan balik benar/salah tanpa reload
- [ ] Judul mengandung `<b>` tampil sebagai teks, bukan tebal
- [ ] Guru lain ubah materi bukan miliknya → `403`
- [ ] Siswa kelas lain buka viewer → `403`
- [ ] Materi tanpa blok → `400`
