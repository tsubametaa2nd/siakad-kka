<script lang="ts">
  import {
    CheckCircle2,
    XCircle,
    HelpCircle,
    Clock,
    Award,
    AlertCircle,
    Check,
    X,
    Filter,
  } from 'lucide-svelte';
  import {
    getStudentQuizAttemptDetailApi,
    type StudentAttemptDetailResponse,
    type StudentAttemptItemBreakdown,
  } from '../../api/quiz';
  import Badge from '../ui/Badge.svelte';
  import Button from '../ui/Button.svelte';
  import EmptyState from '../ui/EmptyState.svelte';
  import Modal from '../ui/Modal.svelte';
  import Skeleton from '../ui/Skeleton.svelte';
  import { formatDateTimeWIB, formatTimeTaken } from '../../utils/date';

  interface Props {
    open?: boolean;
    quizId: string;
    studentId: string;
    studentName?: string;
    identifier?: string;
  }

  let {
    open = $bindable(false),
    quizId,
    studentId,
    studentName = '',
    identifier = '',
  }: Props = $props();

  let loading = $state(false);
  let error = $state('');
  let detail = $state<StudentAttemptDetailResponse | null>(null);
  let filterMode = $state<'all' | 'wrong' | 'correct'>('all');

  $effect(() => {
    if (open && quizId && studentId) {
      loadDetail();
    }
  });

  const loadDetail = async () => {
    loading = true;
    error = '';
    filterMode = 'all';
    try {
      detail = await getStudentQuizAttemptDetailApi(quizId, studentId);
    } catch (err: any) {
      error = err.message || 'Gagal memuat detail jawaban siswa';
    } finally {
      loading = false;
    }
  };

  const filteredItems = $derived(() => {
    if (!detail) return [];
    if (filterMode === 'wrong') {
      return detail.items.filter((item) => !item.is_correct);
    }
    if (filterMode === 'correct') {
      return detail.items.filter((item) => item.is_correct);
    }
    return detail.items;
  });

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
</script>

<Modal bind:open title="Analisis Jawaban Siswa" class="max-w-2xl">
  {#if loading}
    <div class="flex flex-col gap-4 py-4">
      <Skeleton height="h-20" />
      <Skeleton height="h-48" />
      <Skeleton height="h-48" />
    </div>
  {:else if error}
    <div class="border-2 border-black bg-red-100 p-4 text-center">
      <AlertCircle size={32} class="mx-auto text-red-600 mb-2" />
      <p class="font-display font-black text-sm uppercase text-red-800">{error}</p>
      <div class="mt-3">
        <Button variant="surface" size="sm" onclick={loadDetail}>Coba Lagi</Button>
      </div>
    </div>
  {:else if detail}
    <div class="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
      <!-- Info Header Siswa -->
      <div class="border-2 border-black bg-amber-100 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-brutal-sm">
        <div>
          <div class="font-display font-black text-base uppercase tracking-wide">
            {detail.student_name || studentName || 'Siswa'}
          </div>
          <div class="font-mono text-xs text-gray-700 font-bold">
            NIS: {detail.identifier || identifier || '-'} · Quiz: {detail.quiz_title}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="text-right">
            <div class="font-mono text-[10px] text-gray-600 font-bold uppercase">Skor Diperoleh</div>
            <div class="font-mono font-black text-lg bg-black text-primary px-2 py-0.5 inline-block">
              {detail.score} / {detail.max_score} ({detail.percentage}%)
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Breakdown -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div class="border-2 border-black bg-white p-2.5">
          <div class="font-mono text-gray-600 font-bold uppercase text-[10px]">Total Soal</div>
          <div class="font-display font-black text-lg mt-0.5">{detail.total_questions}</div>
        </div>
        <div class="border-2 border-black bg-emerald-50 p-2.5">
          <div class="font-mono text-emerald-700 font-bold uppercase text-[10px]">Jawaban Benar</div>
          <div class="font-display font-black text-lg text-emerald-700 mt-0.5">
            {detail.correct_count} Soal
          </div>
        </div>
        <div class="border-2 border-black bg-red-50 p-2.5">
          <div class="font-mono text-red-700 font-bold uppercase text-[10px]">Jawaban Salah</div>
          <div class="font-display font-black text-lg text-red-700 mt-0.5">
            {detail.incorrect_count + detail.unanswered_count} Soal
          </div>
        </div>
        <div class="border-2 border-black bg-white p-2.5">
          <div class="font-mono text-gray-600 font-bold uppercase text-[10px]">Waktu Selesai</div>
          <div class="font-display font-black text-base mt-0.5">
            {formatTimeTaken(detail.time_taken_seconds)}
          </div>
        </div>
      </div>

      <!-- Filter Controls: Fokus ke yang Salah -->
      <div class="flex flex-wrap items-center justify-between gap-2 border-y-2 border-black py-2.5 bg-gray-50 px-2">
        <div class="font-display font-black text-xs uppercase flex items-center gap-1.5">
          <Filter size={14} />
          <span>Filter Butir Soal:</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            onclick={() => (filterMode = 'all')}
            class="px-2.5 py-1 text-xs font-bold border-2 border-black cursor-pointer transition-all {filterMode === 'all' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}"
          >
            Semua ({detail.total_questions})
          </button>
          <button
            type="button"
            onclick={() => (filterMode = 'wrong')}
            class="px-2.5 py-1 text-xs font-bold border-2 border-black cursor-pointer transition-all {filterMode === 'wrong' ? 'bg-red-600 text-white shadow-brutal-sm' : 'bg-red-100 text-red-800 hover:bg-red-200'}"
          >
            ❌ Salah ({detail.incorrect_count + detail.unanswered_count})
          </button>
          <button
            type="button"
            onclick={() => (filterMode = 'correct')}
            class="px-2.5 py-1 text-xs font-bold border-2 border-black cursor-pointer transition-all {filterMode === 'correct' ? 'bg-emerald-600 text-white shadow-brutal-sm' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}"
          >
            ✔️ Benar ({detail.correct_count})
          </button>
        </div>
      </div>

      <!-- Daftar Soal -->
      {#if filteredItems().length === 0}
        <div class="py-6">
          <EmptyState
            icon={CheckCircle2}
            title={filterMode === 'wrong' ? 'Hebat! Tidak Ada Jawaban Salah' : 'Tidak Ada Soal'}
            description={filterMode === 'wrong' ? 'Siswa menjawab seluruh pertanyaan dengan benar (skor sempurna).' : 'Tidak ada soal yang cocok dengan filter.'}
          />
        </div>
      {:else}
        <div class="flex flex-col gap-4">
          {#each filteredItems() as item (item.number)}
            <div class="border-[2.5px] border-black p-4 bg-white shadow-brutal-sm flex flex-col gap-3 {item.is_correct ? 'border-l-8 border-l-emerald-500' : 'border-l-8 border-l-red-500'}">
              <div class="flex items-center justify-between gap-2 border-b-2 border-black/15 pb-2">
                <div class="font-display font-black text-sm uppercase">
                  Soal Nomor {item.number}
                </div>
                <div>
                  {#if item.is_correct}
                    <Badge tone="success">
                      <Check size={12} class="mr-1 inline" />
                      BENAR (+{item.earned_points} Poin)
                    </Badge>
                  {:else if !item.is_answered}
                    <Badge tone="neutral">
                      <HelpCircle size={12} class="mr-1 inline" />
                      TIDAK DIJAWAB (0 / {item.points} Poin)
                    </Badge>
                  {:else}
                    <Badge tone="danger">
                      <X size={12} class="mr-1 inline" />
                      SALAH (0 / {item.points} Poin)
                    </Badge>
                  {/if}
                </div>
              </div>

              <!-- Teks Soal -->
              <div class="font-body font-bold text-sm text-black whitespace-pre-wrap">
                {item.question}
              </div>

              <!-- Pilihan Jawaban -->
              <div class="flex flex-col gap-2 pt-1">
                {#each item.options as opt, optIdx}
                  {@const isStudentChoice = optIdx === item.student_answer_index}
                  {@const isKeyAnswer = optIdx === item.correct_answer_index}

                  <div
                    class="p-2.5 border-2 text-xs font-body flex items-start justify-between gap-2 transition-all
                      {isStudentChoice && isKeyAnswer
                        ? 'border-emerald-600 bg-emerald-100 text-emerald-950 font-bold'
                        : isStudentChoice
                        ? 'border-red-600 bg-red-100 text-red-950 font-bold'
                        : isKeyAnswer
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-black/30 bg-white text-gray-800'}"
                  >
                    <div class="flex items-start gap-2">
                      <span class="font-mono font-black shrink-0">{optionLetters[optIdx] || optIdx + 1}.</span>
                      <span>{opt}</span>
                    </div>

                    <div class="shrink-0 flex items-center gap-1 font-mono text-[10px] font-bold">
                      {#if isStudentChoice && isKeyAnswer}
                        <span class="bg-emerald-600 text-white px-1.5 py-0.5 rounded-none flex items-center gap-1">
                          <Check size={11} /> Jawaban Siswa & Kunci
                        </span>
                      {:else if isStudentChoice}
                        <span class="bg-red-600 text-white px-1.5 py-0.5 rounded-none flex items-center gap-1">
                          <X size={11} /> Jawaban Siswa (Salah)
                        </span>
                      {:else if isKeyAnswer}
                        <span class="bg-emerald-600 text-white px-1.5 py-0.5 rounded-none flex items-center gap-1">
                          <Check size={11} /> Kunci Jawaban
                        </span>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>

              <!-- Ringkasan Salah Jika Tidak Benar -->
              {#if !item.is_correct}
                <div class="bg-red-50 border border-red-300 p-2 text-xs font-body text-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span class="font-bold">❌ Jawaban Siswa:</span>{' '}
                    <span class="font-mono font-bold text-red-700">
                      {item.is_answered
                        ? `${optionLetters[item.student_answer_index] || item.student_answer_index}. ${item.student_answer_text}`
                        : '(Tidak Dijawab)'}
                    </span>
                  </div>
                  <div>
                    <span class="font-bold">✔️ Kunci Jawaban:</span>{' '}
                    <span class="font-mono font-bold text-emerald-700">
                      {optionLetters[item.correct_answer_index] || item.correct_answer_index}. {item.correct_answer_text}
                    </span>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <div class="flex items-center justify-end gap-3 pt-3 border-t-2 border-black bg-base mt-2 shrink-0">
    <Button variant="surface" size="md" onclick={() => (open = false)}>
      Tutup
    </Button>
  </div>
</Modal>
