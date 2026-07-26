<script lang="ts">
  import { Zap, ArrowRight } from 'lucide-svelte';
  import { getStudentQuizzesApi, type QuizItem } from '../../lib/api/quiz';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Badge from '../../lib/components/ui/Badge.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import EmptyState from '../../lib/components/ui/EmptyState.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import { formatFullDateTimeWIB } from '../../lib/utils/date';

  let quizzes = $state<QuizItem[]>([]);
  let loading = $state(true);
  let error = $state('');

  const breadcrumbs = [
    { label: 'Beranda Siswa', href: '/siswa' },
    { label: 'Quiz Saya', href: '/siswa/quiz' },
  ];

  $effect(() => {
    loadQuizzes();
  });

  const loadQuizzes = async () => {
    loading = true;
    error = '';
    try {
      quizzes = await getStudentQuizzesApi();
    } catch (err: any) {
      error = err.message || 'Gagal memuat daftar quiz';
    } finally {
      loading = false;
    }
  };
</script>

<AppShell title="Daftar Quiz Saya" {breadcrumbs}>
  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Skeleton height="h-40" />
      <Skeleton height="h-40" />
    </div>
  {:else if error}
    <Alert tone="danger" title="Gagal Memuat Quiz" message={error} onretry={loadQuizzes} />
  {:else if quizzes.length === 0}
    <EmptyState icon={Zap} title="Belum Ada Quiz" description="Saat ini belum ada quiz yang ditugaskan untuk Anda." />
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each quizzes as quiz (quiz.id)}
        {@const isClosed = quiz.status === 'Ditutup' || new Date(quiz.due_date).getTime() <= Date.now()}
        {@const isCompleted = quiz.status === 'Sudah'}

        <div class="border-[3px] border-black bg-surface text-black p-5 shadow-brutal rounded-none flex flex-col justify-between gap-4">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <Badge tone={isCompleted ? 'info' : isClosed ? 'neutral' : 'warning'}>
                {isCompleted ? 'Sudah Dikerjakan' : isClosed ? 'Ditutup' : 'Belum Dikerjakan'}
              </Badge>
              <span class="font-mono text-xs font-bold text-gray-800">{quiz.duration_minutes} Menit</span>
            </div>

            <h3 class="font-display font-black text-xl uppercase tracking-wide mb-2 truncate">{quiz.title}</h3>
            {#if quiz.class_name}
              <div class="font-body text-xs font-bold text-gray-700 mb-2">Kelas: {quiz.class_name}</div>
            {/if}
            <div class="font-body text-xs text-gray-800 font-medium">
              Ditutup: <strong>{formatFullDateTimeWIB(quiz.due_date)}</strong>
            </div>

            {#if isCompleted && quiz.score !== undefined && quiz.score !== null}
              <div class="mt-3 bg-yellow-200 p-2.5 border-2 border-black flex items-center justify-between font-mono text-xs font-bold">
                <span>Nilai Saya:</span>
                <span class="font-black text-sm text-black">{quiz.score} / {quiz.max_score || 100}</span>
              </div>
            {/if}
          </div>

          <div class="border-t-2 border-black pt-3 flex justify-end">
            {#if isCompleted}
              <span class="font-body text-xs font-bold text-gray-700 italic">Selesai (Tidak bisa diulang)</span>
            {:else if isClosed}
              <Button variant="surface" size="sm" disabled={true}>Quiz Ditutup</Button>
            {:else}
              <Button variant="primary" size="sm" onclick={() => (window.location.hash = `#/siswa/quiz/${quiz.id}`)}>
                <span class="flex items-center gap-1">Kerjakan Quiz <ArrowRight size={14} /></span>
              </Button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</AppShell>
