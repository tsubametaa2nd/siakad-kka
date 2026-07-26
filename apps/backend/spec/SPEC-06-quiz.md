# SPEC-06 — Quiz (Pilihan Ganda + Auto-Grading)

| | |
|---|---|
| **Bergantung pada** | SPEC-00, SPEC-01, SPEC-02 |
| **Database** | **AstraDB** (koleksi `quizzes`, `quiz_attempts`) |
| **Estimasi** | 4 file, semua < 120 baris |

---

## 1. Tujuan

Guru membuat quiz pilihan ganda dengan tenggat dan batas waktu pengerjaan. Siswa mengerjakan, sistem **menilai otomatis**.

## 2. Ruang Lingkup

**Termasuk**
- Buat quiz beserta soal, opsi, kunci, dan bobot
- Siswa mengerjakan (sekali percobaan)
- Auto-grading + tampilkan skor
- Guru melihat rekap hasil

**Tidak termasuk**
- Soal esai (dinilai manual) — ide lanjutan
- Timer yang dipaksakan server-side (v1 cukup client-side + validasi kasar)

## 3. Data Model (AstraDB)

```ts
// koleksi: quizzes
interface Quiz {
  _id: string;
  classId: string;
  teacherId: string;
  title: string;
  questions: QuizQuestion[];
  deadline: string;                     // ISO UTC
  timeLimitMinutes: number;
  createdAt: string;
}
interface QuizQuestion {
  text: string;
  options: string[];                    // minimal 2
  answer: number;                       // index kunci — RAHASIA
  points: number;
}

// koleksi: quiz_attempts
interface QuizAttempt {
  _id: string;
  quizId: string;
  studentId: string;
  answers: number[];
  score: number;
  maxScore: number;
  startedAt: string;
  submittedAt: string;
}
```

## 4. Endpoint

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/api/quiz` | guru | Buat quiz |
| GET | `/api/quiz/class/:classId` | login | List quiz |
| GET | `/api/quiz/:id` | siswa | Ambil soal (tanpa kunci) |
| POST | `/api/quiz/start` | siswa | Mulai mengerjakan (catat `startedAt`) |
| POST | `/api/quiz/attempt` | siswa | Kirim jawaban → skor |
| GET | `/api/quiz/:id/results` | guru | Rekap hasil semua siswa |

```jsonc
// POST /quiz/attempt
{ "quizId": "uuid", "answers": [0, 2, 1, 3] }
// response
{ "success": true, "data": { "score": 80, "maxScore": 100 } }
```

## 5. Aturan Bisnis

- **BR-06-1** — **Kunci jawaban tidak pernah dikirim ke siswa.** Endpoint yang diakses siswa wajib membuang field `answer` lewat *projection* di query, bukan disaring di JavaScript setelah data terambil.
- **BR-06-2** — Satu siswa hanya boleh **satu kali** percobaan per quiz. Percobaan kedua → `409`.
- **BR-06-3** — Mengirim jawaban setelah `deadline` → `400` (ditolak, beda dengan tugas yang masih diterima sebagai `late`).
- **BR-06-4** — Penilaian: jawaban benar mendapat `points` soal itu; salah/kosong mendapat 0. Tidak ada nilai minus.
- **BR-06-5** — Penilaian dilakukan **di server**. Skor yang dikirim dari client diabaikan sepenuhnya.
- **BR-06-6** — Panjang array `answers` harus sama dengan jumlah soal → kalau tidak, `400`.
- **BR-06-7** — Nilai tiap opsi jawaban harus dalam rentang index opsi yang tersedia → kalau di luar, `400`.
- **BR-06-8** — `POST /quiz/start` mencatat `startedAt`. Saat submit, jika selisih waktu melebihi `timeLimitMinutes` + toleransi 1 menit → `400` ("Waktu habis").
- **BR-06-9** — Quiz wajib punya minimal 1 soal, tiap soal minimal 2 opsi, dan `answer` menunjuk index yang valid → validasi saat pembuatan.
- **BR-06-10** — Hanya guru pengampu kelas yang boleh membuat quiz & melihat rekap (`assertTeacherOwnsClass`).
- **BR-06-11** — Siswa hanya boleh mengerjakan quiz dari kelas yang dia ikuti → `403`.

## 6. File yang Dibuat

| File | Isi | Target |
|---|---|---|
| `src/features/quiz/quiz.schema.ts` | Skema soal & attempt | < 40 |
| `src/features/quiz/quiz.repository.ts` | Query AstraDB + projection kunci | < 55 |
| `src/features/quiz/quiz.service.ts` | Auto-grading + validasi waktu | < 110 |
| `src/features/quiz/quiz.routes.ts` | 6 endpoint | < 50 |

## 7. Kriteria Penerimaan

- [ ] Guru buat quiz 4 soal → tersimpan
- [ ] Siswa ambil soal → **tidak ada** field `answer` di response (cek JSON mentah)
- [ ] Siswa jawab semua benar → skor = total bobot
- [ ] Siswa jawab sebagian → skor sesuai bobot soal yang benar
- [ ] Kerjakan kedua kali → `409`
- [ ] Submit setelah deadline → `400`
- [ ] Kirim `answers` lebih pendek dari jumlah soal → `400`
- [ ] Kirim index opsi di luar jangkauan → `400`
- [ ] Submit lewat dari `timeLimitMinutes` → `400`
- [ ] Buat quiz tanpa soal → `400`
- [ ] Siswa kelas lain mencoba mengerjakan → `403`
- [ ] Guru lihat rekap → daftar siswa + skor
