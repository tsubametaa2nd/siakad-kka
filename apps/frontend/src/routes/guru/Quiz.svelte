<script lang="ts">
  import { Zap, ArrowRight } from 'lucide-svelte';
  import { getTeacherQuizzesApi, type QuizItem } from '../../lib/api/quiz';
  import { getTeacherClassesApi, type ClassItem } from '../../lib/api/classes';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import Badge from '../../lib/components/ui/Badge.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import EmptyState from '../../lib/components/ui/EmptyState.svelte';
  import Select from '../../lib/components/ui/Select.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import { formatFullDateTimeWIB } from '../../lib/utils/date';

  let classes = $state<ClassItem[]>([]);
  let selectedClassId = $state<string>('');
  let quizzes = $state<QuizItem[]>([]);
  let loadingClasses = $state(true);
  let loadingQuizzes = $state(false);
  let error = $state('');

  const breadcrumbs = [{ label: 'Beranda Guru', href: '/guru' }, { label: 'Quiz Guru' }];

  $effect(() => {
    loadClasses();
  });

  const loadClasses = async () => {
    loadingClasses = true;
    error = '';
    try {
      classes = await getTeacherClassesApi();
      if (classes.length > 0) {
        selectedClassId = classes[0].id;
        await loadQuizzes(selectedClassId);
      }
    } catch (err: any) {
      error = err.message || 'Gagal memuat kelas';
    } finally {
      loadingClasses = false;
    }
  };

  const loadQuizzes = async (classId: string) => {
    if (!classId) return;
    loadingQuizzes = true;
    error = '';
    try {
      quizzes = await getTeacherQuizzesApi(classId);
    } catch (err: any) {
      error = err.message || 'Gagal memuat daftar quiz';
    } finally {
      loadingQuizzes = false;
    }
  };

  const handleClassChange = (e: Event) => {
    const val = (e.target as HTMLSelectElement).value;
    selectedClassId = val;
    loadQuizzes(val);
  };

  const classOptions = $derived(
    classes.map((c) => ({ value: c.id, label: `${c.name} (${c.level || c.academicYear || ''})` }))
  );
</script>

<AppShell title="Manajemen Quiz Guru" {breadcrumbs}>
  {#if loadingClasses}
    <Skeleton height="h-24" />
  {:else if error && classes.length === 0}
    <Alert tone="danger" title="Gagal Memuat Kelas" message={error} onretry={loadClasses} />
  {:else}
    <div class="flex flex-col gap-6">
      <div class="bg-white p-4 border-[3px] border-black shadow-brutal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Select
          label="Pilih Kelas"
          options={classOptions}
          bind:value={selectedClassId}
          onchange={handleClassChange}
          class="w-full sm:max-w-md"
        />
        <Button variant="primary" onclick={() => (window.location.hash = '#/guru/quiz/buat')}>
          + Buat Quiz Baru
        </Button>
      </div>

      {#if loadingQuizzes}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton height="h-40" />
          <Skeleton height="h-40" />
        </div>
      {:else if error}
        <Alert tone="danger" title="Gagal Memuat Quiz" message={error} onretry={() => loadQuizzes(selectedClassId)} />
      {:else if quizzes.length === 0}
        <EmptyState icon={Zap} title="Belum Ada Quiz" description="Belum ada quiz yang dibuat untuk kelas ini. Klik '+ Buat Quiz Baru' untuk membuatnya.">
          {#snippet action()}
            <Button variant="primary" onclick={() => (window.location.hash = '#/guru/quiz/buat')}>+ Buat Quiz Pertama</Button>
          {/snippet}
        </EmptyState>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each quizzes as quiz (quiz.id)}
            <div class="border-[3px] border-black bg-surface text-black p-5 shadow-brutal rounded-none flex flex-col justify-between gap-4">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <Badge tone="info">{quiz.duration_minutes} Menit</Badge>
                  <Badge tone="neutral">{quiz.question_count} Soal</Badge>
                </div>
                <h3 class="font-display font-black text-xl uppercase tracking-wide mb-2 truncate">{quiz.title}</h3>
                <div class="font-body text-xs text-gray-800 font-medium">
                  Ditutup: <strong>{formatFullDateTimeWIB(quiz.due_date)}</strong>
                </div>
              </div>
              <div class="border-t-2 border-black pt-3 flex justify-end">
                <a href={`#/guru/quiz/${quiz.id}/hasil`} class="font-display font-black text-xs uppercase underline flex items-center gap-1">
                  <span>Lihat Rekap Hasil</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</AppShell>
