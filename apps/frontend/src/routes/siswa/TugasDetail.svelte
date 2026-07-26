<script lang="ts">
  import { Clock } from 'lucide-svelte';
  import { getAssignmentByIdApi, type AssignmentItem } from '../../lib/api/assignments';
  import { getMySubmissionApi, type SubmissionItem } from '../../lib/api/submissions';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import FormPengumpulan from '../../lib/components/submission/FormPengumpulan.svelte';
  import RingkasanPengumpulan from '../../lib/components/submission/RingkasanPengumpulan.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Badge from '../../lib/components/ui/Badge.svelte';
  import Card from '../../lib/components/ui/Card.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import { formatFullDateTimeWIB, formatTimeRemaining } from '../../lib/utils/date';

  interface Props {
    params?: { id?: string };
  }

  let { params = {} }: Props = $props();
  const assignmentId = $derived(params.id || '');

  let assignment = $state<AssignmentItem | null>(null);
  let submission = $state<SubmissionItem | null>(null);
  let loading = $state(true);
  let isEditing = $state(false);
  let error = $state('');

  const breadcrumbs = $derived([
    { label: 'Beranda Siswa', href: '/siswa' },
    { label: 'Tugas Saya', href: '/siswa/tugas' },
    { label: assignment?.title || 'Detail Tugas', href: `/siswa/tugas/${assignmentId}` },
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
      submission = await getMySubmissionApi(assignmentId);
    } catch (err: any) {
      error = err.message || 'Gagal memuat detail tugas';
    } finally {
      loading = false;
    }
  };

  const handleSubmissionUpdated = (newSub: SubmissionItem) => {
    submission = newSub;
    isEditing = false;
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
          <div class="flex items-center gap-2">
            <Badge tone={assignment.type === 'group' ? 'warning' : 'info'}>
              {assignment.type === 'group' ? 'Tugas Kelompok' : 'Tugas Individu'}
            </Badge>
            {#if assignment.type === 'group'}
              <Badge tone={assignment.group_submission_mode === 'individual' ? 'info' : 'neutral'}>
                Mode: {assignment.group_submission_mode === 'individual' ? 'Masing-masing Mengumpulkan' : '1 Perwakilan Kelompok'}
              </Badge>
            {/if}
            {#if assignment.class_name}
              <Badge tone="neutral">{assignment.class_name}</Badge>
            {/if}
            {#if assignment.group_name}
              <Badge tone="warning">Kelompok: {assignment.group_name}</Badge>
            {/if}
          </div>

          {#if assignment.status}
            <Badge tone={assignment.status === 'Dinilai' ? 'warning' : assignment.status === 'Sudah' ? 'info' : 'danger'}>
              Status: {assignment.status}{#if assignment.status === 'Dinilai' && assignment.score !== undefined && assignment.score !== null}: {assignment.score}/{assignment.max_score}{/if}
            </Badge>
          {/if}
        </div>

        <h2 class="font-display font-black text-2xl uppercase tracking-wide mb-3">
          {assignment.title}
        </h2>

        <div class="font-body text-sm text-gray-800 whitespace-pre-line mb-6 bg-white p-4 border-2 border-black">
          {assignment.description}
        </div>

        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-xs font-bold pt-2 border-t-2 border-black">
          <div>Tenggat Pengumpulan: <span class="underline">{formatFullDateTimeWIB(assignment.due_date)}</span></div>
          <div class="text-accent">⏱️ {formatTimeRemaining(assignment.due_date)}</div>
        </div>
      </Card>

      {#if assignment.type === 'group' && assignment.group_submission_mode !== 'individual' && submission && submission.is_group_leader === false}
        <Alert tone="info" title="Tugas Kelompok (Perwakilan)">
          Pengumpulan tugas kelompok ini dikirim oleh <strong>{submission.submitted_by_name || 'Ketua Kelompok'}</strong>. Hanya Ketua Kelompok yang dapat mengubah pengumpulan.
        </Alert>
        <RingkasanPengumpulan {submission} />
      {:else if submission && !isEditing}
        <RingkasanPengumpulan
          {submission}
          onedit={() => (isEditing = true)}
          ondeleted={() => (submission = null)}
        />
      {:else}
        <FormPengumpulan
          {assignmentId}
          existingSubmission={submission}
          {isEditing}
          onSuccess={handleSubmissionUpdated}
          onCancelEdit={() => (isEditing = false)}
        />
      {/if}
    </div>
  {/if}
</AppShell>
