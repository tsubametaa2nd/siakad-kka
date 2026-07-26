import { onMount } from 'svelte';
import { authStore } from '../../stores/auth.svelte';
import { getStudentClassesApi, type ClassItem } from '../../api/classes';
import { getMyGroupsApi, type GroupItem } from '../../api/groups';
import { getStudentAssignmentsApi, type AssignmentItem } from '../../api/assignments';
import { getStudentMaterialsApi, type MaterialItem } from '../../api/materials';
import { getStudentQuizzesApi, type QuizItem } from '../../api/quiz';

export function useStudentDashboard() {
  let classes = $state<ClassItem[]>([]);
  let myGroups = $state<GroupItem[]>([]);
  let assignments = $state<AssignmentItem[]>([]);
  let materials = $state<MaterialItem[]>([]);
  let quizzes = $state<QuizItem[]>([]);
  let loading = $state(true);

  onMount(() => {
    loadDashboardData();
  });

  const loadDashboardData = async () => {
    loading = true;

    const pClasses = getStudentClassesApi().then((res) => { classes = res || []; }).catch(() => {});
    const pGroups = getMyGroupsApi().then((res) => { myGroups = res || []; }).catch(() => {});
    const pAssignments = getStudentAssignmentsApi().then((res) => { assignments = res || []; }).catch(() => {});
    const pMaterials = getStudentMaterialsApi().then((res) => { materials = res || []; }).catch(() => {});
    const pQuizzes = getStudentQuizzesApi().then((res) => { quizzes = res || []; }).catch(() => {});

    await Promise.allSettled([pClasses, pGroups, pAssignments, pMaterials, pQuizzes]);
    loading = false;
  };

  const primaryGroup = $derived(myGroups.length > 0 ? myGroups[0] : null);
  const isLeader = $derived(
    primaryGroup && authStore.user
      ? primaryGroup.leader_id === authStore.user.id
      : false
  );

  const pendingAssignments = $derived(
    assignments.filter((a) => a.status === 'Belum' || a.status === 'Telat')
  );

  const activeQuizzes = $derived(
    quizzes.filter((q) => q.status !== 'Sudah')
  );

  return {
    get userName() { return authStore.user?.name; },
    get classes() { return classes; },
    get myGroups() { return myGroups; },
    get assignments() { return assignments; },
    get materials() { return materials; },
    get quizzes() { return quizzes; },
    get loading() { return loading; },
    get primaryGroup() { return primaryGroup; },
    get isLeader() { return isLeader; },
    get pendingAssignments() { return pendingAssignments; },
    get activeQuizzes() { return activeQuizzes; },
  };
}
