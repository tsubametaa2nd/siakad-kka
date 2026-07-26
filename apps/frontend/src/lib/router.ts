import { wrap } from 'svelte-spa-router/wrap';
import GuruKelas from '../routes/guru/Kelas.svelte';
import GuruKelasDetail from '../routes/guru/KelasDetail.svelte';
import GuruMateri from '../routes/guru/Materi.svelte';
import GuruMateriBuat from '../routes/guru/MateriBuat.svelte';
import GuruNilai from '../routes/guru/Nilai.svelte';
import GuruNilaiTugas from '../routes/guru/NilaiTugas.svelte';
import GuruPengaturan from '../routes/guru/Pengaturan.svelte';
import GuruQuiz from '../routes/guru/Quiz.svelte';
import GuruQuizBuat from '../routes/guru/QuizBuat.svelte';
import GuruQuizHasil from '../routes/guru/QuizHasil.svelte';
import GuruTugas from '../routes/guru/Tugas.svelte';
import GuruTugasDetail from '../routes/guru/TugasDetail.svelte';
import KitchenSink from '../routes/KitchenSink.svelte';
import Login from '../routes/Login.svelte';
import NotFound from '../routes/NotFound.svelte';
import SiswaKelasSaya from '../routes/siswa/KelasSaya.svelte';
import SiswaKelompok from '../routes/siswa/Kelompok.svelte';
import SiswaMateri from '../routes/siswa/Materi.svelte';
import SiswaMateriBaca from '../routes/siswa/MateriBaca.svelte';
import SiswaNilai from '../routes/siswa/Nilai.svelte';
import SiswaPengaturan from '../routes/siswa/Pengaturan.svelte';
import SiswaQuiz from '../routes/siswa/Quiz.svelte';
import SiswaQuizKerjakan from '../routes/siswa/QuizKerjakan.svelte';
import SiswaQuizLeaderboard from '../routes/siswa/QuizLeaderboard.svelte';
import SiswaTugas from '../routes/siswa/Tugas.svelte';
import SiswaTugasDetail from '../routes/siswa/TugasDetail.svelte';
import StudentHome from '../routes/StudentHome.svelte';
import TeacherHome from '../routes/TeacherHome.svelte';
import RouteGuard from './components/RouteGuard.svelte';

const guard = (component: any, allowedRoles?: Array<'teacher' | 'student'>) =>
  wrap({
    component: RouteGuard,
    props: {
      component,
      allowedRoles,
    },
  });

export const routes = {
  '/login': Login,

  // Teacher routes
  '/guru': guard(TeacherHome, ['teacher']),
  '/guru/kelas': guard(GuruKelas, ['teacher']),
  '/guru/kelas/:id': guard(GuruKelasDetail, ['teacher']),
  '/guru/tugas': guard(GuruTugas, ['teacher']),
  '/guru/tugas/:id': guard(GuruTugasDetail, ['teacher']),
  '/guru/tugas/:id/nilai': guard(GuruNilaiTugas, ['teacher']),
  '/guru/quiz': guard(GuruQuiz, ['teacher']),
  '/guru/quiz/buat': guard(GuruQuizBuat, ['teacher']),
  '/guru/quiz/:id/hasil': guard(GuruQuizHasil, ['teacher']),
  '/guru/materi': guard(GuruMateri, ['teacher']),
  '/guru/materi/buat': guard(GuruMateriBuat, ['teacher']),
  '/guru/nilai': guard(GuruNilai, ['teacher']),
  '/guru/pengaturan': guard(GuruPengaturan, ['teacher']),
  '/guru/*': guard(TeacherHome, ['teacher']),

  // Student routes
  '/siswa': guard(StudentHome, ['student']),
  '/siswa/kelas': guard(SiswaKelasSaya, ['student']),
  '/siswa/kelompok': guard(SiswaKelompok, ['student']),
  '/siswa/tugas': guard(SiswaTugas, ['student']),
  '/siswa/tugas/:id': guard(SiswaTugasDetail, ['student']),
  '/siswa/quiz': guard(SiswaQuiz, ['student']),
  '/siswa/quiz/:id': guard(SiswaQuizKerjakan, ['student']),
  '/siswa/quiz/:id/leaderboard': guard(SiswaQuizLeaderboard, ['student']),
  '/siswa/materi': guard(SiswaMateri, ['student']),
  '/siswa/materi/:id': guard(SiswaMateriBaca, ['student']),
  '/siswa/nilai': guard(SiswaNilai, ['student']),
  '/siswa/pengaturan': guard(SiswaPengaturan, ['student']),
  '/siswa/*': guard(StudentHome, ['student']),

  // Direct material shortcut by slug or ID (e.g. /materi/KKA_BAB1)
  '/materi/:id': guard(SiswaMateriBaca, ['student', 'teacher']),

  '/kitchen-sink': KitchenSink,

  // Root redirect
  '/': guard(TeacherHome, ['teacher', 'student']),

  // Fallback 404
  '*': NotFound,
};
