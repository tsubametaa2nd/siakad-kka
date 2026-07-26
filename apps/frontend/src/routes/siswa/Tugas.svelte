<script lang="ts">
  import { FileText } from 'lucide-svelte';
  import { getStudentAssignmentsApi, type AssignmentItem } from '../../lib/api/assignments';
  import { getStudentClassesApi, type ClassItem } from '../../lib/api/classes';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import TugasCard from '../../lib/components/tugas/TugasCard.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import EmptyState from '../../lib/components/ui/EmptyState.svelte';
  import Select from '../../lib/components/ui/Select.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';

  let assignments = $state<AssignmentItem[]>([]);
  let studentClasses = $state<ClassItem[]>([]);
  let selectedClassId = $state<string>('');

  let loadingClasses = $state(true);
  let loadingAssignments = $state(true);
  let error = $state('');

  const breadcrumbs = [
    { label: 'Beranda Siswa', href: '/siswa' },
    { label: 'Tugas Saya', href: '/siswa/tugas' },
  ];

  const classFilterOptions = $derived([
    { value: '', label: 'Semua Kelas' },
    ...studentClasses.map((c) => ({ value: c.id, label: `${c.name} (${c.level})` })),
  ]);

  const sortedAssignments = $derived.by(() => {
    return [...assignments].sort((a, b) => {
      const order: Record<string, number> = { 'Belum': 1, 'Telat': 2, 'Sudah': 3, 'Dinilai': 4 };
      const scoreA = order[a.status || 'Belum'] || 1;
      const scoreB = order[b.status || 'Belum'] || 1;
      if (scoreA !== scoreB) return scoreA - scoreB;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  });

  $effect(() => {
    loadClasses();
  });

  const loadClasses = async () => {
    loadingClasses = true;
    try {
      studentClasses = await getStudentClassesApi();
      await loadAssignments(selectedClassId);
    } catch (err: any) {
      error = err.message || 'Gagal memuat kelas';
      loadingAssignments = false;
    } finally {
      loadingClasses = false;
    }
  };

  const loadAssignments = async (classId?: string) => {
    loadingAssignments = true;
    error = '';
    try {
      assignments = await getStudentAssignmentsApi(classId || undefined);
    } catch (err: any) {
      error = err.message || 'Gagal memuat daftar tugas';
    } finally {
      loadingAssignments = false;
    }
  };

  const handleClassFilterChange = (e: Event) => {
    const val = (e.target as HTMLSelectElement).value;
    selectedClassId = val;
    loadAssignments(val);
  };
</script>

<AppShell title="Tugas Saya" {breadcrumbs}>
  <div class="flex items-center justify-between gap-4 mb-6">
    <Select label="Saring Kelas" options={classFilterOptions} bind:value={selectedClassId} onchange={handleClassFilterChange} disabled={loadingClasses} class="w-full sm:max-w-xs" />
  </div>

  {#if loadingAssignments}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Skeleton height="h-44" />
      <Skeleton height="h-44" />
    </div>
  {:else if error}
    <Alert tone="danger" title="Gagal Memuat Tugas" message={error} onretry={() => loadAssignments(selectedClassId)} />
  {:else if sortedAssignments.length === 0}
    <EmptyState icon={FileText} title="Belum Ada Tugas" description="Tidak ada tugas akademik yang perlu dikerjakan saat ini." />
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each sortedAssignments as item (item.id)}
        <TugasCard {item} isTeacher={false} />
      {/each}
    </div>
  {/if}
</AppShell>
