<script lang="ts">
  import { Clock, ArrowRight } from 'lucide-svelte';
  import Badge from '../ui/Badge.svelte';
  import Button from '../ui/Button.svelte';
  import { formatFullDateTimeWIB, formatTimeRemaining, isDeadlineUrgent } from '../../utils/date';
  import type { AssignmentItem } from '../../api/assignments';

  interface Props {
    item: AssignmentItem;
    isTeacher?: boolean;
    onedit?: (item: AssignmentItem) => void;
    ondelete?: (id: string) => void;
    class?: string;
  }

  let { item, isTeacher = false, onedit, ondelete, class: className = '' }: Props = $props();

  let remainingText = $state('');

  $effect(() => {
    remainingText = formatTimeRemaining(item.due_date);
    const interval = setInterval(() => {
      remainingText = formatTimeRemaining(item.due_date);
    }, 60000);
    return () => clearInterval(interval);
  });

  const urgent = $derived(isDeadlineUrgent(item.due_date));
  const isExpired = $derived(remainingText.startsWith('Lewat'));

  const statusTone = $derived.by(() => {
    if (!item.status) return 'neutral';
    if (item.status === 'Dinilai') return 'warning';
    if (item.status === 'Sudah') return 'info';
    if (item.status === 'Telat') return 'danger';
    if (item.status === 'Belum' && urgent) return 'danger';
    return 'neutral';
  });

  const detailHref = $derived(isTeacher ? `#/guru/tugas/${item.id}` : `#/siswa/tugas/${item.id}`);
</script>

<a
  href={detailHref}
  class="block border-[3px] border-black bg-surface text-black p-5 shadow-brutal rounded-none transition-all duration-100 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none focus-visible:outline-[3px] focus-visible:outline-black select-none {className}"
>
  <div class="flex items-start justify-between gap-3 mb-3">
    <div class="flex flex-wrap items-center gap-2">
      <Badge tone={item.type === 'group' ? 'warning' : 'info'}>
        {item.type === 'group' ? 'Kelompok' : 'Individu'}
      </Badge>
      {#if item.class_name}
        <Badge tone="neutral">{item.class_name}</Badge>
      {/if}
      {#if item.group_name}
        <Badge tone="warning">Kelompok: {item.group_name}</Badge>
      {/if}
    </div>

    {#if !isTeacher && item.status}
      <Badge tone={statusTone}>
        {item.status}{#if item.status === 'Dinilai' && item.score !== undefined && item.score !== null}: {item.score}/{item.max_score}{/if}
      </Badge>
    {/if}
  </div>

  <h3 class="font-display font-black text-xl uppercase tracking-wide mb-2 line-clamp-2">
    {item.title}
  </h3>

  <div class="flex flex-col gap-1 font-body text-xs font-medium text-gray-900 mb-4">
    <div><strong>Tenggat:</strong> {formatFullDateTimeWIB(item.due_date)}</div>
    <div class="font-mono font-bold text-xs flex items-center gap-1.5 {urgent && item.status === 'Belum' ? 'text-accent' : isExpired ? 'text-red-700' : 'text-gray-800'}">
      <Clock size={14} />
      <span>{remainingText}</span>
    </div>
  </div>

  <div class="border-t-2 border-black pt-3 flex items-center justify-between gap-2">
    <span class="font-mono text-xs font-bold text-gray-700">Maks Score: {item.max_score}</span>
    {#if isTeacher}
      <div class="flex items-center gap-1.5">
        {#if onedit}
          <Button
            variant="surface"
            size="sm"
            onclick={(e) => { e.preventDefault(); e.stopPropagation(); onedit(item); }}
          >
            Edit
          </Button>
        {/if}
        {#if ondelete}
          <Button
            variant="accent"
            size="sm"
            onclick={(e) => { e.preventDefault(); e.stopPropagation(); ondelete(item.id); }}
          >
            Hapus
          </Button>
        {/if}
      </div>
    {:else}
      <span class="font-display font-black text-xs uppercase underline flex items-center gap-1">
        Lihat Detail <ArrowRight size={14} />
      </span>
    {/if}
  </div>
</a>
