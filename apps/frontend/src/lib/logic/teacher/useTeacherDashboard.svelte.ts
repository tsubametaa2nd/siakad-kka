import { onMount } from 'svelte';
import { authStore } from '../../stores/auth.svelte';
import { getTeacherClassesApi, type ClassItem } from '../../api/classes';
import { getTeacherMaterialsApi, type MaterialItem } from '../../api/materials';
import { getTeacherAssignmentsApi, type AssignmentItem } from '../../api/assignments';
import { getTeacherQuizzesApi, type QuizItem } from '../../api/quiz';

export const teacherScheduleData = [
  {
    day: 'Senin',
    dayCode: 1,
    slots: [
      {
        time: '10.00 - 11.30',
        code: 'MP',
        name: 'Manajemen Perkantoran',
        room: 'Lab AK',
        desc: 'Kelas X MP (Manajemen Perkantoran).',
        tagTone: 'warning' as const,
      },
      {
        time: '11.30 - 13.30',
        code: 'LP',
        name: 'Layanan Perbankan',
        room: 'Lab AK',
        desc: 'Kelas X LP (Layanan Perbankan).',
        tagTone: 'info' as const,
      },
    ],
  },
  {
    day: 'Kamis',
    dayCode: 4,
    slots: [
      {
        time: '08.15 - 09.45',
        code: 'DKV',
        name: 'Desain Komunikasi Visual',
        room: 'Lab AK',
        desc: 'Kelas X DKV (Desain Komunikasi Visual).',
        tagTone: 'danger' as const,
      },
      {
        time: '11.35 - 13.35',
        code: 'ANM',
        name: 'Animasi 2D & 3D',
        room: 'Lab AK',
        desc: 'Kelas X ANM (Animasi 2D & 3D).',
        tagTone: 'success' as const,
      },
    ],
  },
];

export function useTeacherDashboard() {
  const now = new Date();
  const currentDayIndex = now.getDay();

  let selectedDayFilter = $state<'semua' | 'Senin' | 'Kamis'>('semua');
  let classes = $state<ClassItem[]>([]);
  let materials = $state<MaterialItem[]>([]);
  let assignments = $state<AssignmentItem[]>([]);
  let quizzes = $state<QuizItem[]>([]);
  let loading = $state(true);

  onMount(() => {
    loadDashboardData();
  });

  const loadDashboardData = async () => {
    loading = true;
    const pClasses = getTeacherClassesApi().then((res) => { classes = res || []; }).catch(() => {});
    const pMaterials = getTeacherMaterialsApi().then((res) => { materials = res || []; }).catch(() => {});
    const pAssignments = getTeacherAssignmentsApi().then((res) => { assignments = res || []; }).catch(() => {});
    const pQuizzes = getTeacherQuizzesApi().then((res) => { quizzes = res || []; }).catch(() => {});

    await Promise.allSettled([pClasses, pMaterials, pAssignments, pQuizzes]);
    loading = false;
  };

  const pendingGradingAssignments = $derived(
    assignments.filter((a) => (a.submission_count ?? 0) > 0)
  );

  const isTodayTeachingDay = $derived(
    currentDayIndex === 1 || currentDayIndex === 4
  );

  return {
    get userName() { return authStore.user?.name; },
    get classes() { return classes; },
    get materials() { return materials; },
    get assignments() { return assignments; },
    get quizzes() { return quizzes; },
    get loading() { return loading; },
    get selectedDayFilter() { return selectedDayFilter; },
    set selectedDayFilter(val: 'semua' | 'Senin' | 'Kamis') { selectedDayFilter = val; },
    get currentDayIndex() { return currentDayIndex; },
    get isTodayTeachingDay() { return isTodayTeachingDay; },
    get pendingGradingAssignments() { return pendingGradingAssignments; },
    scheduleData: teacherScheduleData,
  };
}
