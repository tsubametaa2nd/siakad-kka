<script lang="ts">
  import { CheckCircle2, Clock, FileText } from 'lucide-svelte';
  import type { AssignmentItem } from '../../../lib/api/assignments';
  import Badge from '../../../lib/components/ui/Badge.svelte';
  import Button from '../../../lib/components/ui/Button.svelte';
  import Skeleton from '../../../lib/components/ui/Skeleton.svelte';
  import { formatDateTimeWIB } from '../../../lib/utils/date';

  interface Props {
    groupAssignments: AssignmentItem[];
    loadingAssignments: boolean;
  }

  let { groupAssignments = [], loadingAssignments }: Props = $props();
</script>

<div class="lg:col-span-2 border-[3px] border-black bg-white p-5 shadow-brutal flex flex-col gap-4">
  <div class="flex items-center justify-between border-b-2 border-black pb-3">
    <h3 class="font-display font-black text-base uppercase flex items-center gap-2 text-black">
      <FileText size={18} class="text-black shrink-0" />
      <span class="text-black font-extrabold">Tugas Kelompok ({groupAssignments.length})</span>
    </h3>
  </div>

  {#if loadingAssignments}
    <Skeleton height="h-24" />
  {:else if groupAssignments.length === 0}
    <div class="bg-gray-50 border-2 border-dashed border-gray-400 p-6 text-center">
      <p class="font-body text-sm text-gray-700 font-medium">
        Belum ada tugas kelompok yang ditugaskan oleh guru untuk kelas ini.
      </p>
    </div>
  {:else}
    <div class="flex flex-col gap-3">
      {#each groupAssignments as assignment (assignment.id)}
        {@const isDone = assignment.status === 'Sudah' || assignment.status === 'Dinilai'}
        <div class="border-2 border-black bg-surface p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="font-display font-black text-base text-black uppercase">{assignment.title}</span>
              {#if isDone}
                <Badge tone="success" class="flex items-center gap-1">
                  <CheckCircle2 size={12} /> {assignment.status}
                </Badge>
              {:else}
                <Badge tone="warning" class="flex items-center gap-1">
                  <Clock size={12} /> Belum Dikumpulkan
                </Badge>
              {/if}
            </div>
            <p class="font-body text-xs text-gray-700 line-clamp-1">{assignment.description || 'Tugas Kelompok'}</p>
            <span class="font-mono text-[11px] text-gray-600 font-bold">
              Batas Pengumpulan: {formatDateTimeWIB(assignment.due_date)}
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onclick={() => (window.location.hash = `#/siswa/tugas/${assignment.id}`)}
            class="shrink-0"
          >
            Buka Tugas →
          </Button>
        </div>
      {/each}
    </div>
  {/if}
</div>
