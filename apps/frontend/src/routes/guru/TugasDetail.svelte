<script lang="ts">
  import { Clock, Pencil } from 'lucide-svelte';
  import { getAssignmentByIdApi, type AssignmentItem } from '../../lib/api/assignments';
  import { getAssignmentSubmissionsApi, type TeacherSubmissionsResponse } from '../../lib/api/submissions';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import BuatTugasModal from '../../lib/components/tugas/BuatTugasModal.svelte';
  import TabelPengumpulan from '../../lib/components/submission/TabelPengumpulan.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Badge from '../../lib/components/ui/Badge.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import Card from '../../lib/components/ui/Card.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import { formatFullDateTimeWIB, formatTimeRemaining } from '../../lib/utils/date';

  interface Props {
    params?: { id?: string };
  }

  let { params = {} }: Props = $props();
  const assignmentId = $derived(params.id || '');

  let assignment = $state<AssignmentItem | null>(null);
  let submissionsData = $state<TeacherSubmissionsResponse | null>(null);
  let loading = $state(true);
  let loadingSubmissions = $state(true);
  let error = $state('');
  let showEditModal = $state(false);

  const breadcrumbs = $derived([
    { label: 'Beranda Guru', href: '/guru' },
    { label: 'Daftar Tugas', href: '/guru/tugas' },
    { label: assignment?.title || 'Detail Tugas', href: `/guru/tugas/${assignmentId}` },
  ]);

  $effect(() => {
    if (assignmentId) {
      loadData();
    }
  });

  const loadData = async () => {
    loading = true;
    error = '';
    try {
      assignment = await getAssignmentByIdApi(assignmentId);
      loadSubmissions();
    } catch (err: any) {
      error = err.message || 'Gagal memuat detail tugas';
    } finally {
      loading = false;
    }
  };

  const loadSubmissions = async () => {
    loadingSubmissions = true;
    try {
      submissionsData = await getAssignmentSubmissionsApi(assignmentId);
    } catch (err: any) {
      submissionsData = { total_students: 0, submitted_count: 0, submissions: [] };
    } finally {
      loadingSubmissions = false;
    }
  };
</script>

<AppShell title={assignment?.title || 'Detail Tugas'} {breadcrumbs}>
  {#if loading}
    <Skeleton height="h-48" />
  {:else if error}
    <Alert tone="danger" title="Gagal Memuat Detail" message={error} onretry={loadData} />
  {:else if assignment}
    <div class="flex flex-col gap-6">
      <Card tone="surface" class="border-[3px] border-black shadow-brutal">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4 border-b-2 border-black pb-3">
          <div class="flex items-center gap-2 flex-wrap">
            <Badge tone={assignment.type === 'group' ? 'warning' : 'info'}>
              {assignment.type === 'group' ? 'Tugas Kelompok' : 'Tugas Individu'}
            </Badge>
            {#if assignment.class_name}
              <Badge tone="neutral">{assignment.class_name}</Badge>
            {/if}
          </div>
          <div class="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-start">
            <span class="font-mono text-xs sm:text-sm font-bold bg-yellow-200 px-2.5 sm:px-3 py-1 border border-black">
              Nilai Maksimal: {assignment.max_score}
            </span>
            <Button variant="surface" size="sm" onclick={() => showEditModal = true}>
              <span class="flex items-center gap-1.5"><Pencil size={14} /> Edit Tugas</span>
            </Button>
          </div>
        </div>

        <h2 class="font-display font-black text-xl sm:text-2xl uppercase tracking-wide mb-3 text-black">
          {assignment.title}
        </h2>

        <div class="font-body text-xs sm:text-sm text-gray-800 whitespace-pre-line mb-6 bg-white p-3.5 sm:p-4 border-2 border-black overflow-x-auto max-w-full">
          {assignment.description}
        </div>

        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-xs font-bold pt-2 border-t-2 border-black">
          <div>Tenggat Pengumpulan: <span class="underline">{formatFullDateTimeWIB(assignment.due_date)}</span></div>
          <div class="text-accent flex items-center gap-1">
            <Clock size={14} />
            {formatTimeRemaining(assignment.due_date)}
          </div>
        </div>
      </Card>

      {#if loadingSubmissions}
        <Skeleton height="h-64" />
      {:else if submissionsData}
        <TabelPengumpulan data={submissionsData} assignmentId={assignmentId} assignmentType={assignment.type} />
      {/if}
    </div>

    <BuatTugasModal bind:open={showEditModal} assignmentToEdit={assignment} onSuccess={loadData} />
  {/if}
</AppShell>
