<script lang="ts">
  import AppShell from '../lib/components/layout/AppShell.svelte';
  import { useStudentDashboard } from '../lib/logic/student/useStudentDashboard.svelte';

  import StudentHeader from '../lib/components/home/student/StudentHeader.svelte';
  import StudentMetrics from '../lib/components/home/student/StudentMetrics.svelte';
  import StudentGroupHero from '../lib/components/home/student/StudentGroupHero.svelte';
  import StudentResourceGrid from '../lib/components/home/student/StudentResourceGrid.svelte';

  const dashboard = useStudentDashboard();
  const breadcrumbs = [{ label: 'Beranda Siswa', href: '/siswa' }];
</script>

<AppShell title="Beranda Siswa" {breadcrumbs}>
  <div class="flex flex-col gap-8 pb-16">
    <StudentHeader
      userName={dashboard.userName}
      primaryGroup={dashboard.primaryGroup}
      isLeader={dashboard.isLeader}
    />

    <StudentMetrics
      classes={dashboard.classes}
      pendingAssignmentsCount={dashboard.pendingAssignments.length}
      activeQuizzesCount={dashboard.activeQuizzes.length}
      materialCount={dashboard.materials.length}
      loading={dashboard.loading}
    />

    <StudentGroupHero
      primaryGroup={dashboard.primaryGroup}
      isLeader={dashboard.isLeader}
      loading={dashboard.loading}
    />

    <StudentResourceGrid
      assignments={dashboard.assignments}
      materials={dashboard.materials}
      quizzes={dashboard.quizzes}
      loading={dashboard.loading}
    />
  </div>
</AppShell>
