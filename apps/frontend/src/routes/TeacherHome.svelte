<script lang="ts">
  import AppShell from '../lib/components/layout/AppShell.svelte';
  import { useTeacherDashboard } from '../lib/logic/teacher/useTeacherDashboard.svelte';

  import TeacherHeader from '../lib/components/home/teacher/TeacherHeader.svelte';
  import TeacherMetrics from '../lib/components/home/teacher/TeacherMetrics.svelte';
  import TeacherSchedule from '../lib/components/home/teacher/TeacherSchedule.svelte';
  import TeacherPendingGrading from '../lib/components/home/teacher/TeacherPendingGrading.svelte';
  import TeacherResourceGrid from '../lib/components/home/teacher/TeacherResourceGrid.svelte';

  const dashboard = useTeacherDashboard();
  const breadcrumbs = [{ label: 'Beranda Guru', href: '/guru' }];
</script>

<AppShell title="Beranda Guru" {breadcrumbs}>
  <div class="flex flex-col gap-8 pb-16">
    <TeacherHeader
      userName={dashboard.userName}
      isTodayTeachingDay={dashboard.isTodayTeachingDay}
    />

    <TeacherMetrics
      classCount={dashboard.classes.length}
      materialCount={dashboard.materials.length}
      assignmentCount={dashboard.assignments.length}
      quizCount={dashboard.quizzes.length}
      loading={dashboard.loading}
    />

    <TeacherSchedule
      scheduleData={dashboard.scheduleData}
      currentDayIndex={dashboard.currentDayIndex}
      selectedDayFilter={dashboard.selectedDayFilter}
      onSelectFilter={(f) => (dashboard.selectedDayFilter = f)}
    />

    <TeacherPendingGrading pendingGradingAssignments={dashboard.pendingGradingAssignments} />

    <TeacherResourceGrid
      materials={dashboard.materials}
      assignments={dashboard.assignments}
      quizzes={dashboard.quizzes}
      loading={dashboard.loading}
    />
  </div>
</AppShell>
