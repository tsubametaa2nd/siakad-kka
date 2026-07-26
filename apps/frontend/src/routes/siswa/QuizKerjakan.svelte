<script lang="ts">
  import { PartyPopper, Clock, Trophy, ArrowLeft, ArrowRight } from 'lucide-svelte';
  import {
    startQuizApi,
    submitQuizAttemptApi,
    reportProgressApi,
    type QuizStartResponse,
    type QuizSubmitResult,
  } from '../../lib/api/quiz';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import PetaSoal from '../../lib/components/quiz/PetaSoal.svelte';
  import Pewaktu from '../../lib/components/quiz/Pewaktu.svelte';
  import { formatTimeTaken } from '../../lib/utils/date';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import Card from '../../lib/components/ui/Card.svelte';
  import ConfirmDialog from '../../lib/components/ui/ConfirmDialog.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import { toastStore } from '../../lib/stores/toast.svelte';

  interface Props {
    params?: { id?: string };
  }

  let { params = {} }: Props = $props();
  const quizId = $derived(params.id || '');

  let quizData = $state<QuizStartResponse | null>(null);
  let result = $state<QuizSubmitResult | null>(null);
  let answers = $state<Record<string, number>>({});
  let currentIndex = $state(0);
  let loading = $state(true);
  let submitting = $state(false);
  let error = $state('');
  let showConfirmModal = $state(false);

  const breadcrumbs = $derived([
    { label: 'Beranda Siswa', href: '/siswa' },
    { label: 'Quiz Saya', href: '/siswa/quiz' },
    { label: 'Layar Pengerjaan Quiz', href: `/siswa/quiz/${quizId}` },
  ]);

  const currentQuestion = $derived(quizData?.questions[currentIndex]);
  const questionIds = $derived(quizData?.questions.map((q) => q.id) || []);
  const totalQuestions = $derived(quizData?.questions.length || 0);

  const unansweredCount = $derived(
    quizData?.questions.filter((q) => answers[q.id] === undefined).length || 0
  );

  $effect(() => {
    if (quizId) {
      initQuiz();
    }
  });

  $effect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (quizData && !result && !submitting) {
        e.preventDefault();
        e.returnValue = 'Quiz sedang berlangsung. Yakin ingin meninggalkan halaman?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  const initQuiz = async () => {
    loading = true;
    error = '';
    try {
      quizData = await startQuizApi(quizId);
    } catch (err: any) {
      error = err.message || 'Gagal memulai quiz';
    } finally {
      loading = false;
    }
  };

  const selectOption = (questionId: string, optionIndex: number) => {
    if (result) return;
    answers = { ...answers, [questionId]: optionIndex };
    // Laporkan progress ke server (best-effort, tidak memblok UI)
    if (quizData?.attempt_id) {
      const answeredCount = Object.keys(answers).length;
      reportProgressApi(quizData.attempt_id, answeredCount);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      currentIndex += 1;
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
    }
  };

  const handleTimeout = () => {
    if (quizData && !result && !submitting) {
      toastStore.add('Waktu pengerjaan telah habis! Mengirimkan jawaban otomatis...', 'warning');
      executeSubmission();
    }
  };

  const executeSubmission = async () => {
    if (!quizData || submitting || result) return;
    submitting = true;
    showConfirmModal = false;

    try {
      const payloadAnswers = Object.entries(answers).map(([qId, idx]) => ({
        question_id: qId,
        selected_option_index: idx,
      }));

      const res = await submitQuizAttemptApi(quizData.attempt_id, payloadAnswers);
      result = res;
      toastStore.add('Quiz berhasil dikumpulkan', 'success');
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal mengirim jawaban quiz', 'danger');
    } finally {
      submitting = false;
    }
  };
</script>

<AppShell title="Pengerjaan Quiz" {breadcrumbs}>
  {#if loading}
    <Skeleton height="h-64" />
  {:else if error}
    <Alert tone="danger" title="Gagal Memulai Quiz" message={error} onretry={initQuiz} />
  {:else if result}
    <!-- Screen Hasil -->
    <div class="flex flex-col gap-6 max-w-xl mx-auto">
      <Card tone="surface" class="border-[3px] border-black bg-primary shadow-brutal p-8 text-center flex flex-col items-center gap-4">
        <div class="p-3 bg-white border-2 border-black shadow-brutal-sm rounded-none">
          <PartyPopper size={48} class="text-black" />
        </div>
        <h2 class="font-display font-black text-2xl uppercase tracking-wide">Quiz Selesai!</h2>
        <div class="bg-white border-[3px] border-black p-6 w-full shadow-brutal flex flex-col gap-3">
          <span class="font-display font-black text-xs uppercase tracking-wider block text-gray-700 mb-1">Skor Akhir Anda:</span>
          <div class="font-display font-black text-6xl text-black my-2">{result.score}</div>
          <div class="font-mono text-sm font-bold text-gray-800">
            ({result.score} dari {result.max_score})
          </div>
          {#if result.time_taken_seconds != null}
            <div class="bg-yellow-100 border-2 border-black px-3 py-2 flex items-center justify-between font-mono text-xs font-bold">
              <span class="flex items-center gap-1.5"><Clock size={14} /> Waktu Penyelesaian:</span>
              <span class="font-black text-black">{formatTimeTaken(result.time_taken_seconds)}</span>
            </div>
          {/if}
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Button variant="surface" class="w-full" onclick={() => (window.location.hash = '#/siswa/quiz')}>
            Kembali ke Daftar Quiz
          </Button>
          <Button variant="primary" class="w-full flex items-center justify-center gap-1.5" onclick={() => (window.location.hash = `#/siswa/quiz/${quizId}/leaderboard`)}>
            <Trophy size={16} />
            <span>Lihat Leaderboard</span>
          </Button>
        </div>
      </Card>
    </div>
  {:else if quizData && currentQuestion}
    <div class="flex flex-col gap-6">
      <Pewaktu expiresAtIso={quizData.expires_at} ontimeout={handleTimeout} />

      <PetaSoal
        {totalQuestions}
        {currentIndex}
        answeredQuestionIds={answers}
        {questionIds}
        onselect={(idx) => (currentIndex = idx)}
      />

      <Card tone="base" class="border-[3px] border-black shadow-brutal flex flex-col gap-6 p-6">
        <div class="flex items-center justify-between border-b-2 border-black pb-3">
          <span class="font-display font-black text-sm uppercase bg-yellow-200 px-3 py-1 border border-black">
            Soal {currentIndex + 1} dari {totalQuestions}
          </span>
          <span class="font-mono text-xs font-bold text-gray-700">Bobot: {currentQuestion.weight}</span>
        </div>

        <div class="font-body text-base font-bold text-black whitespace-pre-line bg-yellow-50 p-4 border-2 border-black">
          {currentQuestion.question}
        </div>

        <div class="flex flex-col gap-3">
          <span class="font-display font-black text-xs uppercase tracking-wider">Pilih Jawaban:</span>
          {#each currentQuestion.options as option, optIdx (optIdx)}
            {@const isSelected = answers[currentQuestion.id] === optIdx}
            <button
              type="button"
              onclick={() => selectOption(currentQuestion.id, optIdx)}
              class="w-full text-left p-3.5 border-2 border-black font-body font-bold text-sm transition-all duration-100 flex items-center gap-3 focus:outline-[3px] focus:outline-black {isSelected ? 'bg-primary shadow-brutal-sm scale-[1.01]' : 'bg-white hover:bg-yellow-100'}"
            >
              <span class="w-8 h-8 border-2 border-black flex items-center justify-center font-mono font-black text-xs shrink-0 {isSelected ? 'bg-white' : 'bg-gray-100'}">
                {String.fromCharCode(65 + optIdx)}
              </span>
              <span class="flex-1">{option}</span>
              {#if isSelected}
                <span class="font-display font-black text-xs uppercase bg-black text-primary px-2 py-0.5 border border-black">Terpilih</span>
              {/if}
            </button>
          {/each}
        </div>

        <div class="flex items-center justify-between border-t-2 border-black pt-4">
          <Button variant="surface" disabled={currentIndex === 0} onclick={prevQuestion}>
            <span class="flex items-center gap-1"><ArrowLeft size={16} /> Sebelumnya</span>
          </Button>

          {#if currentIndex < totalQuestions - 1}
            <Button variant="surface" onclick={nextQuestion}>
              <span class="flex items-center gap-1">Berikutnya <ArrowRight size={16} /></span>
            </Button>
          {:else}
            <Button variant="primary" onclick={() => (showConfirmModal = true)}>
              Kumpulkan Quiz
            </Button>
          {/if}
        </div>
      </Card>
    </div>
  {/if}
</AppShell>

<ConfirmDialog
  bind:open={showConfirmModal}
  title="Kumpulkan Jawaban Quiz?"
  message={unansweredCount > 0
    ? `Ada ${unansweredCount} soal yang belum Anda jawab. Apakah Anda yakin ingin mengumpulkan sekarang?`
    : 'Apakah Anda yakin ingin menyelesaikan dan mengumpulkan quiz ini?'}
  confirmText="Ya, Kumpulkan Sekarang"
  cancelText="Periksa Kembali"
  loading={submitting}
  onconfirm={executeSubmission}
/>
