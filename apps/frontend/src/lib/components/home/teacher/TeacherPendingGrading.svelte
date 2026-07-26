<script lang="ts">
  import { CheckSquare, ArrowRight } from 'lucide-svelte';
  import Badge from '../../ui/Badge.svelte';
  import Button from '../../ui/Button.svelte';
  import type { AssignmentItem } from '../../../api/assignments';

  interface Props {
    pendingGradingAssignments: AssignmentItem[];
  }

  let { pendingGradingAssignments }: Props = $props();
</script>

{#if pendingGradingAssignments.length > 0}
  <div
    class="border-[3px] border-black bg-amber-100 p-6 shadow-brutal flex flex-col gap-4"
  >
    <div
      class="flex items-center justify-between border-b-2 border-black pb-3"
    >
      <div class="flex items-center gap-2">
        <CheckSquare size={22} class="text-amber-800" />
        <h2
          class="font-display font-black text-xl uppercase tracking-wide text-amber-900"
        >
          Tugas Siswa Perlu Dinilai ({pendingGradingAssignments.length})
        </h2>
      </div>
      <Button
        variant="accent"
        size="sm"
        onclick={() => (window.location.hash = "#/guru/tugas")}
      >
        Kelola Semua Penilaian →
      </Button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each pendingGradingAssignments.slice(0, 3) as assignment (assignment.id)}
        <div
          class="border-2 border-black bg-white p-4 shadow-brutal-sm flex flex-col justify-between gap-3"
        >
          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <Badge
                tone={assignment.type === "group" ? "warning" : "info"}
              >
                {assignment.type === "group" ? "Kelompok" : "Individu"}
              </Badge>
              <span
                class="font-mono text-xs font-bold text-amber-800 bg-amber-200 border border-black px-2 py-0.5"
              >
                {assignment.submission_count} Pengumpulan
              </span>
            </div>
            <h4
              class="font-display font-black text-base uppercase truncate"
            >
              {assignment.title}
            </h4>
            <p class="font-body text-xs text-gray-700 line-clamp-1 mt-1">
              {assignment.description || "Tidak ada deskripsi"}
            </p>
          </div>

          <div
            class="border-t border-black pt-2 flex items-center justify-between"
          >
            <span class="font-mono text-xs font-bold text-gray-600"
              >Maks: {assignment.max_score}</span
            >
            <a
              href={`#/guru/tugas/${assignment.id}/nilai`}
              class="font-display font-black text-xs uppercase underline text-black flex items-center gap-1 hover:text-accent"
            >
              Mulai Menilai <ArrowRight size={12} />
            </a>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
