<script lang="ts">
  import { Zap, ArrowRight, Settings, Trash2, Edit3, BarChart2, FileSpreadsheet } from 'lucide-svelte';
  import { getTeacherQuizzesApi, deleteQuizApi, type QuizItem } from '../../lib/api/quiz';
  import { getTeacherClassesApi, type ClassItem } from '../../lib/api/classes';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import Badge from '../../lib/components/ui/Badge.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import ConfirmDialog from '../../lib/components/ui/ConfirmDialog.svelte';
  import EmptyState from '../../lib/components/ui/EmptyState.svelte';
  import Select from '../../lib/components/ui/Select.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import SettingQuizModal from '../../lib/components/quiz/SettingQuizModal.svelte';
  import ImportSpreadsheetQuizModal from '../../lib/components/quiz/ImportSpreadsheetQuizModal.svelte';
  import { toastStore } from '../../lib/stores/toast.svelte';
  import { formatFullDateTimeWIB } from '../../lib/utils/date';

  let classes = $state<ClassItem[]>([]);
  let selectedClassId = $state<string>('');
  let quizzes = $state<QuizItem[]>([]);
  let loadingClasses = $state(true);
  let loadingQuizzes = $state(false);
  let error = $state('');

  let settingQuiz = $state<QuizItem | null>(null);
  let showSettingModal = $state(false);

  let targetQuizForSync = $state<QuizItem | null>(null);
  let showSpreadsheetModal = $state(false);

  let targetQuizForDelete = $state<QuizItem | null>(null);
  let showDeleteConfirm = $state(false);
  let showForceDeleteConfirm = $state(false);
  let deleting = $state(false);

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

  const openSettings = (quiz: QuizItem) => {
    settingQuiz = quiz;
    showSettingModal = true;
  };

  const openSpreadsheetModal = (quiz: QuizItem) => {
    targetQuizForSync = quiz;
    showSpreadsheetModal = true;
  };

  const promptDeleteQuiz = (quiz: QuizItem) => {
    targetQuizForDelete = quiz;
    showDeleteConfirm = true;
  };

  const handleDeleteQuiz = async (force = false) => {
    if (!targetQuizForDelete) return;
    deleting = true;
    try {
      await deleteQuizApi(targetQuizForDelete.id, force);
      toastStore.add(`Quiz "${targetQuizForDelete.title}" berhasil dihapus`, 'success');
      showDeleteConfirm = false;
      showForceDeleteConfirm = false;
      targetQuizForDelete = null;
      await loadQuizzes(selectedClassId);
    } catch (err: any) {
      if (!force && err.status === 409) {
        showDeleteConfirm = false;
        showForceDeleteConfirm = true;
      } else {
        toastStore.add(err.message || 'Gagal menghapus quiz', 'danger');
      }
    } finally {
      deleting = false;
    }
  };

  const classOptions = $derived(
    classes.map((c) => ({ value: c.id, label: `${c.name} (${c.level || c.academicYear || ''})` }))
  );

  const currentClass = $derived(classes.find((c) => c.id === selectedClassId));
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
                <div class="flex items-center justify-between gap-2 mb-2">
                  <div class="flex items-center gap-2">
                    <Badge tone="info">{quiz.duration_minutes} Menit</Badge>
                    <Badge tone="neutral">{quiz.question_count} Soal</Badge>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      onclick={() => openSpreadsheetModal(quiz)}
                      class="p-1.5 border-2 border-black bg-emerald-100 text-emerald-900 hover:bg-emerald-200 transition-colors cursor-pointer shadow-brutal-sm"
                      title="Impor Nilai ke Spreadsheet Kelas"
                      aria-label="Impor Nilai ke Spreadsheet"
                    >
                      <FileSpreadsheet size={14} />
                    </button>
                    <button
                      type="button"
                      onclick={() => openSettings(quiz)}
                      class="p-1.5 border-2 border-black bg-white hover:bg-yellow-200 transition-colors cursor-pointer shadow-brutal-sm"
                      title="Pengaturan Quiz (Ubah Nama & Waktu)"
                      aria-label="Pengaturan Quiz"
                    >
                      <Settings size={14} />
                    </button>
                    <button
                      type="button"
                      onclick={() => (window.location.hash = `#/guru/quiz/${quiz.id}/edit`)}
                      class="p-1.5 border-2 border-black bg-white hover:bg-blue-200 transition-colors cursor-pointer shadow-brutal-sm"
                      title="Edit Butir Soal"
                      aria-label="Edit Butir Soal"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onclick={() => promptDeleteQuiz(quiz)}
                      class="p-1.5 border-2 border-black bg-red-400 text-white hover:bg-red-500 transition-colors cursor-pointer shadow-brutal-sm"
                      title="Hapus Quiz"
                      aria-label="Hapus Quiz"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 class="font-display font-black text-xl uppercase tracking-wide mb-2 truncate" title={quiz.title}>
                  {quiz.title}
                </h3>
                <div class="font-body text-xs text-gray-800 font-medium">
                  Ditutup: <strong>{formatFullDateTimeWIB(quiz.due_date)}</strong>
                </div>
              </div>
              <div class="border-t-2 border-black pt-3 flex items-center justify-between gap-2">
                <a href={`#/guru/quiz/${quiz.id}/hasil`} class="font-display font-black text-xs uppercase underline flex items-center gap-1 hover:text-primary transition-colors">
                  <BarChart2 size={14} />
                  <span>Lihat Rekap Hasil</span>
                </a>
                <div class="flex items-center gap-1.5">
                  <Button variant="surface" size="sm" onclick={() => openSpreadsheetModal(quiz)} title="Impor nilai quiz ke Google Spreadsheet kelas">
                    <FileSpreadsheet size={13} class="mr-1 inline text-emerald-700" />
                    <span>Sheets</span>
                  </Button>
                  <Button variant="surface" size="sm" onclick={() => openSettings(quiz)}>
                    <Settings size={13} class="mr-1 inline" />
                    <span>Atur</span>
                  </Button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</AppShell>

<SettingQuizModal
  bind:open={showSettingModal}
  quiz={settingQuiz}
  onSuccess={() => loadQuizzes(selectedClassId)}
/>

<ConfirmDialog
  bind:open={showDeleteConfirm}
  title="Hapus Quiz"
  message={`Apakah Anda yakin ingin menghapus quiz "${targetQuizForDelete?.title}"?`}
  confirmText="Hapus Quiz"
  loading={deleting}
  onconfirm={() => handleDeleteQuiz(false)}
/>

<ConfirmDialog
  bind:open={showForceDeleteConfirm}
  title="Quiz Memiliki Hasil Pengerjaan Siswa"
  message={`Quiz "${targetQuizForDelete?.title}" sudah memiliki data pengerjaan dari siswa. Apakah Anda yakin ingin menghapus quiz ini BESERTA SELURUH riwayat nilai dan pengerjaan siswa di dalamnya? Tindakan ini permanen dan tidak dapat dibatalkan.`}
  confirmText="Hapus Paksa Beserta Hasil Siswa"
  loading={deleting}
  onconfirm={() => handleDeleteQuiz(true)}
/>

<ImportSpreadsheetQuizModal
  bind:open={showSpreadsheetModal}
  quizId={targetQuizForSync?.id || ""}
  quizTitle={targetQuizForSync?.title || ""}
  classId={selectedClassId}
  className={currentClass?.name}
  spreadsheetId={currentClass?.spreadsheetId}
  totalStudents={currentClass?.studentCount || 0}
/>

