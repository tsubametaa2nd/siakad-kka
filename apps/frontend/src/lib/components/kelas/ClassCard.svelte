<script lang="ts">
  import { ArrowRight } from 'lucide-svelte';
  import Badge from '../ui/Badge.svelte';
  import type { ClassItem } from '../../api/classes';

  interface Props {
    item: ClassItem;
    href?: string;
    isTeacher?: boolean;
    class?: string;
  }

  let { item, href, isTeacher = false, class: className = '' }: Props = $props();

  const targetHref = $derived(href || (isTeacher ? `#/guru/kelas/${item.id}` : `#/siswa/kelas/${item.id}`));
</script>

<a
  href={targetHref}
  class="block border-[3px] border-black bg-surface text-black p-5 shadow-brutal rounded-none transition-all duration-100 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none focus-visible:outline-[3px] focus-visible:outline-black select-none {className}"
>
  <div class="flex items-start justify-between gap-3 mb-2">
    <h3 class="font-display font-black text-xl uppercase tracking-wide truncate">
      {item.name}
    </h3>
    {#if item.studentCount !== undefined}
      <Badge tone="info">{item.studentCount} Siswa</Badge>
    {/if}
  </div>

  <div class="flex items-center gap-2 font-body font-medium text-sm text-gray-800 mb-4">
    <span>Tingkat: <strong>{item.level}</strong></span>
    <span>•</span>
    <span>Tahun: <strong>{item.academicYear}</strong></span>
  </div>

  {#if isTeacher}
    <div class="border-t-2 border-black pt-3 flex items-center justify-between gap-2">
      {#if !item.spreadsheetId}
        <Badge tone="danger">Spreadsheet Belum Diatur</Badge>
      {:else}
        <Badge tone="success">Synced to Sheets</Badge>
      {/if}
      <span class="font-display font-black text-xs uppercase underline flex items-center gap-1">
        <span>Detail</span>
        <ArrowRight size={14} />
      </span>
    </div>
  {/if}
</a>
