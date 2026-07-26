# SPEC-03 — Groups (Kelompok, Max 1 per Siswa per Kelas)

| | |
|---|---|
| **Bergantung pada** | SPEC-00, SPEC-01, SPEC-02 |
| **Database** | **Supabase** (`groups`, `group_members`) |
| **Estimasi** | 4 file, semua < 100 baris |

---

## 1. Tujuan

Siswa membentuk kelompok di dalam sebuah kelas. **Satu siswa hanya boleh tergabung di satu kelompok per kelas** — aturan inti spec ini.

## 2. Ruang Lingkup

**Termasuk**
- Buat kelompok (pembuat jadi ketua + anggota pertama)
- Gabung & keluar kelompok
- Lihat daftar kelompok satu kelas

**Tidak termasuk**
- Undangan/approval ketua (siapa saja boleh gabung selama kuota ada)
- Kelompok lintas kelas

## 3. Data Model (Supabase)

```sql
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
  class_id   uuid references classes(id)  on delete cascade,  -- denormalisasi
  joined_at  timestamptz default now(),
  primary key (group_id, student_id),
  -- INTI: 1 siswa hanya boleh 1 kelompok per kelas
  unique (student_id, class_id)
);
```

> `class_id` sengaja didenormalisasi ke `group_members` **khusus** agar constraint `UNIQUE(student_id, class_id)` bisa ditegakkan database. Tanpa kolom ini, aturan max-1-kelompok harus dicek manual di kode dan rawan *race condition* saat dua siswa mendaftar bersamaan.

## 4. Endpoint

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/api/groups` | siswa | Buat kelompok |
| POST | `/api/groups/join` | siswa | Gabung kelompok |
| DELETE | `/api/groups/leave` | siswa | Keluar dari kelompok |
| GET | `/api/groups/class/:classId` | login | List kelompok + anggota |
| GET | `/api/groups/my` | siswa | Kelompok saya (per kelas) |

```jsonc
// POST /groups
{ "name": "Kelompok Mawar", "classId": "uuid" }
// POST /groups/join
{ "groupId": "uuid", "classId": "uuid" }
```

## 5. Aturan Bisnis

- **BR-03-1** — Pembuat kelompok otomatis jadi `leader_id` **dan** langsung tercatat di `group_members`.
- **BR-03-2** — Siswa yang sudah punya kelompok di kelas itu, saat buat/gabung kelompok lain → `409 CONFLICT` ("Kamu sudah punya kelompok di kelas ini").
- **BR-03-3** — Andalkan **constraint database** untuk BR-03-2. Tangkap error Postgres kode `23505` (unique violation) dan ubah jadi `409`. Jangan hanya mengandalkan pengecekan `SELECT` sebelum insert — itu tidak aman terhadap request bersamaan.
- **BR-03-4** — Siswa hanya boleh buat/gabung kelompok di kelas yang **dia ikuti** (cek `enrollments`). Kalau tidak → `403`.
- **BR-03-5** — Gabung kelompok yang anggotanya sudah mencapai `max_members` → `409` ("Kelompok sudah penuh").
- **BR-03-6** — Ketua keluar dari kelompok: kepemimpinan pindah ke anggota terlama. Kalau dia anggota terakhir, kelompok ikut terhapus.
- **BR-03-7** — Gabung ke `groupId` yang `class_id`-nya berbeda dari `classId` yang dikirim → `400`.

## 6. File yang Dibuat

| File | Isi | Target |
|---|---|---|
| `src/features/groups/groups.schema.ts` | `createGroupBody`, `joinGroupBody` | < 25 |
| `src/features/groups/groups.repository.ts` | Query Supabase | < 60 |
| `src/features/groups/groups.service.ts` | Logika + penanganan `23505` | < 90 |
| `src/features/groups/groups.routes.ts` | 5 endpoint | < 45 |

## 7. Kriteria Penerimaan

- [ ] Siswa buat kelompok → dia jadi ketua **dan** anggota
- [ ] Siswa yang sudah punya kelompok, buat kelompok lagi di kelas sama → `409`
- [ ] Siswa yang sudah punya kelompok, gabung kelompok lain di kelas sama → `409`
- [ ] Siswa punya kelompok di kelas A, boleh punya kelompok lain di kelas B → sukses
- [ ] **Dua request gabung bersamaan** dari siswa yang sama → tepat satu sukses, satunya `409`
- [ ] Gabung kelompok penuh → `409`
- [ ] Siswa yang tidak terdaftar di kelas → `403`
- [ ] Ketua keluar → kepemimpinan pindah ke anggota terlama
- [ ] Anggota terakhir keluar → kelompok terhapus
- [ ] `GET /groups/class/:id` menampilkan nama anggota, bukan cuma ID
