# FE-SPEC-00 — Foundation & Design System (Neo-Brutalism)

| | |
|---|---|
| **Bergantung pada** | — (paling awal) |
| **Stack** | Bun + Vite + Svelte 5 (runes) + TailwindCSS v4 |
| **Estimasi** | ~15 file, komponen < 120 baris |

---

## 1. Tujuan

Menyiapkan proyek, **design token**, dan **komponen UI dasar** bergaya Neo-Brutalism yang dipakai semua halaman. Tidak ada halaman fitur di spec ini.

## 2. Setup

```bash
bun create vite siakad-frontend --template svelte-ts
cd siakad-frontend
bun add -d tailwindcss @tailwindcss/vite
bun add svelte-spa-router
bun run dev
```

`vite.config.ts` memakai plugin `@tailwindcss/vite` (Tailwind v4, konfigurasi berbasis CSS).

## 3. Design Token

`src/app.css`:

```css
@import "tailwindcss";

@theme {
  /* Palet — proporsi 60 / 25 / 10 / 5 */
  --color-base:    #FFF8E7;   /* 60% latar utama   */
  --color-surface: #7DD3FC;   /* 25% kartu & panel */
  --color-primary: #FFE600;   /* 10% CTA utama     */
  --color-accent:  #FF4081;   /*  5% detail        */
  --color-ink:     #000000;   /* border, teks, bayangan */

  /* Bayangan tajam tanpa blur */
  --shadow-brutal-sm: 2px 2px 0px #000;
  --shadow-brutal:    4px 4px 0px #000;
  --shadow-brutal-lg: 6px 6px 0px #000;
  --shadow-brutal-xl: 8px 8px 0px #000;

  --font-display: "Archivo Black", system-ui, sans-serif;
  --font-body:    "Space Grotesk", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;

  --radius-brutal: 0px;       /* Neo-Brutalism: sudut siku */
}
```

## 4. Aturan Visual (WAJIB DIPATUHI)

- **UI-00-1 — Proporsi warna.** `base` untuk latar halaman; `surface` untuk kartu/panel/header tabel; `primary` **hanya** untuk aksi utama; `accent` **hanya** untuk detail kecil. Dalam satu layar: maksimal **satu** tombol `primary`, dan `accent` menempati **kurang dari 5%** luas layar.
- **UI-00-2 — Teks selalu hitam.** `#000000` di atas semua warna palet. **Tidak pernah teks putih** — kontras putih di atas `#FF4081` hanya 3.3:1 dan gagal standar keterbacaan. Hitam di atas keempat warna aman semua (6.3:1 sampai 19:1).
- **UI-00-3 — Border.** `border-2` (2px) untuk elemen kecil (input, badge, tombol kecil); `border-[3px]` untuk kartu, modal, dan panel besar. Selalu `border-ink`, selalu solid.
- **UI-00-4 — Bayangan.** Selalu tajam tanpa blur. Elemen kecil `shadow-brutal-sm`, kartu/tombol `shadow-brutal`, modal `shadow-brutal-xl`. **Tidak boleh** ada `blur`, `opacity` pada bayangan, atau gradien.
- **UI-00-5 — Sudut siku.** `rounded-none` di mana-mana. Tidak ada sudut membulat.
- **UI-00-6 — Tipografi.** Judul & tombol pakai `font-display` (black/900), teks isi pakai `font-body` (500–700), angka/NIS/kode pakai `font-mono`. Tidak ada font-weight di bawah 500.
- **UI-00-7 — Interaksi tekan.** Elemen interaktif punya tiga keadaan:
  - Diam: `shadow-brutal`
  - Hover: geser `-2px, -2px` + `shadow-brutal-lg` (seolah terangkat)
  - Ditekan: geser `+4px, +4px` + bayangan hilang (seolah tertekan rata)
- **UI-00-8 — Transisi cepat.** `transition-all duration-100`. Neo-Brutalism terasa tegas, bukan lembut. Tidak ada easing panjang atau animasi > 150ms.
- **UI-00-9 — Fokus keyboard terlihat jelas.** `outline: 3px solid #000; outline-offset: 3px`. Jangan pernah `outline-none` tanpa pengganti.
- **UI-00-10 — Hormati `prefers-reduced-motion`.** Bila aktif, hilangkan pergeseran hover/tekan; ganti dengan perubahan bayangan saja.
- **UI-00-11 — Elemen nonaktif tidak "terangkat".** `disabled` → bayangan hilang, `opacity-60`, kursor `not-allowed`, tanpa efek hover.

## 5. Komponen Dasar

Semua di `src/lib/components/ui/`:

| Komponen | Varian / Prop penting |
|---|---|
| `Button.svelte` | `variant`: primary \| surface \| accent \| ghost; `size`: sm \| md \| lg; `loading`, `disabled` |
| `Card.svelte` | `tone`: base \| surface; slot header/body/footer |
| `Input.svelte` | `label`, `error`, `hint`, `required` |
| `Textarea.svelte` | sama dengan Input |
| `Select.svelte` | `options`, `label`, `error` |
| `FileInput.svelte` | `multiple`, `accept`, `maxSize`; area drag-and-drop |
| `Badge.svelte` | `tone`: neutral \| info \| warning \| danger \| success |
| `Modal.svelte` | `open`, `title`, tutup via Esc & klik latar |
| `Table.svelte` | header `surface`, garis pemisah tebal |
| `Tabs.svelte` | tab aktif `primary`, tab lain `base` |
| `Toast.svelte` | posisi kanan-atas, hilang otomatis 4 detik |
| `EmptyState.svelte` | ikon + pesan + aksi opsional |
| `Skeleton.svelte` | kotak abu berborder hitam, tanpa animasi kilau |
| `Alert.svelte` | `tone`: info \| danger |
| `ConfirmDialog.svelte` | untuk aksi merusak (hapus) |

**Pemetaan warna komponen:**

- `Button primary` → latar `primary`, dipakai untuk aksi utama satu-satunya per layar
- `Button surface` → latar `surface`, aksi sekunder
- `Button accent` → latar `accent`, **hanya** aksi merusak (hapus)
- `Badge danger` → `accent`; `Badge info` → `surface`; `Badge warning` → `primary`
- `Modal` → latar `base`, header `surface`, overlay hitam 40%

## 6. Struktur Folder

```
src/
├── main.ts
├── App.svelte                  # router + shell
├── app.css                     # token & base style
├── lib/
│   ├── api/
│   │   └── client.ts           # fetch wrapper + Bearer + unwrap envelope
│   ├── stores/
│   │   └── toast.svelte.ts     # notifikasi global
│   ├── components/ui/          # komponen di tabel atas
│   └── utils/
│       ├── date.ts             # format tanggal & sisa waktu (WIB)
│       └── format.ts           # ukuran file, nama, inisial
└── routes/                     # halaman (diisi spec berikutnya)
```

## 7. API Client

`src/lib/api/client.ts` — satu pintu untuk semua panggilan backend:

- Menempelkan `Authorization: Bearer <token>` otomatis
- Membuka envelope `{ success, data }` → mengembalikan `data` saja
- Bila `success: false`, lempar error berisi `code` & `message` **dari backend**
- Status `401` → hapus token & arahkan ke halaman login
- Mendukung `multipart/form-data` untuk unggah berkas

**UI-00-12** — Pesan error yang ditampilkan ke pengguna **memakai `message` dari backend apa adanya** (sudah berbahasa Indonesia). Jangan menerjemahkan ulang atau mengarang pesan sendiri.

## 8. File yang Dibuat

| File | Target |
|---|---|
| `vite.config.ts`, `src/main.ts`, `src/App.svelte` | < 40 tiap file |
| `src/app.css` | < 90 |
| `src/lib/api/client.ts` | < 80 |
| `src/lib/stores/toast.svelte.ts` | < 40 |
| 15 komponen di `lib/components/ui/` | < 120 tiap file |
| `src/lib/utils/date.ts`, `format.ts` | < 60 tiap file |

## 9. Kriteria Penerimaan

- [ ] `bun run dev` jalan tanpa error
- [ ] Halaman contoh menampilkan seluruh komponen (halaman "kitchen sink")
- [ ] Semua tombol menunjukkan tiga keadaan: diam, terangkat saat hover, tertekan saat diklik
- [ ] Tidak ada satu pun sudut membulat di seluruh komponen
- [ ] Tidak ada bayangan berblur; semua tajam
- [ ] Tidak ada teks putih di mana pun
- [ ] Navigasi Tab menampilkan outline hitam yang jelas di setiap elemen interaktif
- [ ] Tombol `disabled` tidak terangkat saat hover
- [ ] Dengan `prefers-reduced-motion: reduce`, elemen tidak bergeser
- [ ] Dalam satu layar contoh hanya ada satu tombol `primary`
- [ ] API client melampirkan Bearer otomatis dan membuka envelope dengan benar
