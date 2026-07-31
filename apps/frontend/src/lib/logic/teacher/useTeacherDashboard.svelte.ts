import { onMount } from 'svelte';
import { authStore } from '../../stores/auth.svelte';
import { getTeacherClassesApi, type ClassItem } from '../../api/classes';
import { getTeacherMaterialsApi, type MaterialItem } from '../../api/materials';
import { getTeacherAssignmentsApi, type AssignmentItem } from '../../api/assignments';
import { getTeacherQuizzesApi, type QuizItem } from '../../api/quiz';

const dayCodeMap: Record<string, number> = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
  Minggu: 0,
};

const defaultScheduleFallback = [
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

  let selectedDayFilter = $state<string>('semua');
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

  const dynamicScheduleData = $derived.by(() => {
    const configuredClasses = classes.filter((c) => !!c.scheduleDay && !!c.scheduleTime);
    if (configuredClasses.length === 0) {
      return defaultScheduleFallback;
    }

    const tagTones: Array<'warning' | 'info' | 'danger' | 'success' | 'neutral'> = ['warning', 'info', 'danger', 'success', 'neutral'];
    const dayMap = new Map<string, { day: string; dayCode: number; slots: any[] }>();

    configuredClasses.forEach((c, idx) => {
      const day = c.scheduleDay || 'Senin';
      const dayCode = dayCodeMap[day] ?? 1;
      if (!dayMap.has(day)) {
        dayMap.set(day, {
          day,
          dayCode,
          slots: [],
        });
      }
      const group = dayMap.get(day)!;
      group.slots.push({
        time: c.scheduleTime || '08.00 - 09.30',
        code: c.name,
        name: `Kelas ${c.level} ${c.name}`,
        room: c.room || 'Ruang Kelas',
        desc: `Kelas ${c.level} ${c.name} (${c.academicYear || 'Aktif'}).`,
        tagTone: tagTones[idx % tagTones.length],
      });
    });

    return Array.from(dayMap.values());
  });

  const isTodayTeachingDay = $derived(
    dynamicScheduleData.some((d) => d.dayCode === currentDayIndex)
  );

  return {
    get userName() { return authStore.user?.name; },
    get classes() { return classes; },
    get materials() { return materials; },
    get assignments() { return assignments; },
    get quizzes() { return quizzes; },
    get loading() { return loading; },
    get selectedDayFilter() { return selectedDayFilter; },
    set selectedDayFilter(val: string) { selectedDayFilter = val; },
    get currentDayIndex() { return currentDayIndex; },
    get isTodayTeachingDay() { return isTodayTeachingDay; },
    get pendingGradingAssignments() { return pendingGradingAssignments; },
    get scheduleData() { return dynamicScheduleData; },
  };
}
