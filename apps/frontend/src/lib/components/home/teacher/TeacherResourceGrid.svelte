<script lang="ts">
  import { BookOpen, FileText, Zap, ArrowRight } from 'lucide-svelte';
  import Badge from '../../ui/Badge.svelte';
  import Button from '../../ui/Button.svelte';
  import Skeleton from '../../ui/Skeleton.svelte';
  import EmptyState from '../../ui/EmptyState.svelte';
  import type { MaterialItem } from '../../../api/materials';
  import type { AssignmentItem } from '../../../api/assignments';
  import type { QuizItem } from '../../../api/quiz';

  interface Props {
    materials: MaterialItem[];
    assignments: AssignmentItem[];
    quizzes: QuizItem[];
    loading?: boolean;
  }

  let { materials, assignments, quizzes, loading = false }: Props = $props();
</script>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <!-- DAFTAR MATERI PEMBELAJARAN -->
  <div
    class="border-[3px] border-black bg-white p-5 shadow-brutal flex flex-col justify-between gap-4"
  >
    <div>
      <div
        class="flex items-center justify-between border-b-2 border-black pb-3 mb-4"
      >
        <div class="flex items-center gap-2">
          <BookOpen size={20} class="text-blue-600" />
          <h3
            class="font-display font-black text-lg uppercase tracking-wide"
          >
            Daftar Materi
          </h3>
        </div>
        <a
          href="#/guru/materi"
          class="font-mono font-bold text-xs uppercase underline"
          >Lihat Semua</a
        >
      </div>

      {#if loading}
        <div class="flex flex-col gap-3">
          <Skeleton height="h-16" />
          <Skeleton height="h-16" />
        </div>
      {:else if materials.length === 0}
        <EmptyState
          icon={BookOpen}
          title="Belum Ada Materi"
          description="Belum ada materi pembelajaran yang dibuat."
        >
          {#snippet action()}
            <Button
              variant="surface"
              size="sm"
              onclick={() => (window.location.hash = "#/guru/materi/buat")}
              >+ Buat Materi</Button
            >
          {/snippet}
        </EmptyState>
      {:else}
        <div class="flex flex-col gap-3">
          {#each materials.slice(0, 4) as mat (mat.id)}
            <a
              href={`#/materi/${mat.id}`}
              class="border-2 border-black bg-surface text-black p-3 shadow-brutal-sm hover:-translate-y-0.5 transition-transform flex items-center justify-between gap-2"
            >
              <div class="truncate">
                <h4
                  class="font-display font-black text-sm uppercase truncate"
                >
                  {mat.title}
                </h4>
                <span class="font-mono text-xs text-gray-700 font-bold"
                  >{mat.block_count ?? 0} Blok Konten</span
                >
              </div>
              <ArrowRight size={16} class="shrink-0" />
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <Button
      variant="surface"
      size="sm"
      class="w-full mt-2"
      onclick={() => (window.location.hash = "#/guru/materi/buat")}
    >
      + Tambah Materi Baru
    </Button>
  </div>

  <!-- DAFTAR TUGAS SISWA -->
  <div
    class="border-[3px] border-black bg-white p-5 shadow-brutal flex flex-col justify-between gap-4"
  >
    <div>
      <div
        class="flex items-center justify-between border-b-2 border-black pb-3 mb-4"
      >
        <div class="flex items-center gap-2">
          <FileText size={20} class="text-pink-600" />
          <h3
            class="font-display font-black text-lg uppercase tracking-wide"
          >
            Daftar Tugas
          </h3>
        </div>
        <a
          href="#/guru/tugas"
          class="font-mono font-bold text-xs uppercase underline"
          >Lihat Semua</a
        >
      </div>

      {#if loading}
        <div class="flex flex-col gap-3">
          <Skeleton height="h-16" />
          <Skeleton height="h-16" />
        </div>
      {:else if assignments.length === 0}
        <EmptyState
          icon={FileText}
          title="Belum Ada Tugas"
          description="Belum ada tugas siswa yang dibuat."
        >
          {#snippet action()}
            <Button
              variant="accent"
              size="sm"
              onclick={() => (window.location.hash = "#/guru/tugas")}
              >+ Buat Tugas</Button
            >
          {/snippet}
        </EmptyState>
      {:else}
        <div class="flex flex-col gap-3">
          {#each assignments.slice(0, 4) as asg (asg.id)}
            <a
              href={`#/guru/tugas/${asg.id}`}
              class="border-2 border-black bg-yellow-50 text-black p-3 shadow-brutal-sm hover:-translate-y-0.5 transition-transform flex items-center justify-between gap-2"
            >
              <div class="truncate">
                <div class="flex items-center gap-1.5 mb-1">
                  <Badge tone={asg.type === "group" ? "warning" : "info"}
                    >{asg.type === "group" ? "Kelompok" : "Individu"}</Badge
                  >
                  <span
                    class="font-mono text-[10px] font-bold text-gray-600"
                    >{asg.submission_count ?? 0} Dikumpulkan</span
                  >
                </div>
                <h4
                  class="font-display font-black text-sm uppercase truncate"
                >
                  {asg.title}
                </h4>
              </div>
              <ArrowRight size={16} class="shrink-0" />
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <Button
      variant="accent"
      size="sm"
      class="w-full mt-2"
      onclick={() => (window.location.hash = "#/guru/tugas")}
    >
      + Buat Tugas Baru
    </Button>
  </div>

  <!-- DAFTAR QUIZ & EVALUASI -->
  <div
    class="border-[3px] border-black bg-white p-5 shadow-brutal flex flex-col justify-between gap-4"
  >
    <div>
      <div
        class="flex items-center justify-between border-b-2 border-black pb-3 mb-4"
      >
        <div class="flex items-center gap-2">
          <Zap size={20} class="text-amber-500" />
          <h3
            class="font-display font-black text-lg uppercase tracking-wide"
          >
            Quiz & Leaderboard
          </h3>
        </div>
        <a
          href="#/guru/quiz"
          class="font-mono font-bold text-xs uppercase underline"
          >Lihat Semua</a
        >
      </div>

      {#if loading}
        <div class="flex flex-col gap-3">
          <Skeleton height="h-16" />
          <Skeleton height="h-16" />
        </div>
      {:else if quizzes.length === 0}
        <EmptyState
          icon={Zap}
          title="Belum Ada Quiz"
          description="Belum ada quiz evaluasi interaktif."
        >
          {#snippet action()}
            <Button
              variant="primary"
              size="sm"
              onclick={() => (window.location.hash = "#/guru/quiz/buat")}
              >+ Buat Quiz</Button
            >
          {/snippet}
        </EmptyState>
      {:else}
        <div class="flex flex-col gap-3">
          {#each quizzes.slice(0, 4) as qz (qz.id)}
            <a
              href={`#/guru/quiz/${qz.id}/hasil`}
              class="border-2 border-black bg-amber-50 text-black p-3 shadow-brutal-sm hover:-translate-y-0.5 transition-transform flex items-center justify-between gap-2"
            >
              <div class="truncate">
                <div class="flex items-center gap-1.5 mb-1">
                  <Badge tone="info">{qz.duration_minutes} Menit</Badge>
                  <Badge tone="neutral">{qz.question_count} Soal</Badge>
                </div>
                <h4
                  class="font-display font-black text-sm uppercase truncate"
                >
                  {qz.title}
                </h4>
              </div>
              <ArrowRight size={16} class="shrink-0" />
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <Button
      variant="primary"
      size="sm"
      class="w-full mt-2"
      onclick={() => (window.location.hash = "#/guru/quiz/buat")}
    >
      + Menerbitkan Quiz Baru
    </Button>
  </div>
</div>
