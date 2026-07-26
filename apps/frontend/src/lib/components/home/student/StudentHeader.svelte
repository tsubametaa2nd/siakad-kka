<script lang="ts">
  import { Users, FileText, Zap, Crown } from 'lucide-svelte';
  import Badge from '../../ui/Badge.svelte';
  import Button from '../../ui/Button.svelte';
  import type { GroupItem } from '../../../api/groups';

  interface Props {
    userName?: string;
    primaryGroup?: GroupItem | null;
    isLeader?: boolean;
  }

  let { userName = 'Siswa', primaryGroup = null, isLeader = false }: Props = $props();
</script>

<div
  class="border-[3px] border-black bg-surface p-4 sm:p-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
>
  <div class="flex flex-col gap-2 z-10">
    <div class="flex flex-wrap items-center gap-2">
      <Badge tone="warning">SISWA SIAKAD</Badge>
      {#if primaryGroup}
        <span
          class="flex items-center gap-1 bg-emerald-300 text-black font-mono text-xs font-bold px-2.5 py-0.5 border border-black shadow-brutal-sm"
        >
          {#if isLeader}<Crown size={12} class="text-amber-700" />{/if}
          {primaryGroup.name}
        </span>
      {:else}
        <span
          class="flex items-center gap-1 bg-accent text-white font-mono text-xs font-bold px-2 py-0.5 border border-black shadow-brutal-sm"
        >
          BELUM PUNYA KELOMPOK
        </span>
      {/if}
    </div>
    <h1
      class="font-display font-black text-2xl md:text-3xl uppercase tracking-wider text-black"
    >
      Selamat Datang, {userName}!
    </h1>
    <p class="font-body font-medium text-sm text-black max-w-2xl">
      Pantau kelompok belajar, tugas individu & kelompok, materi pelajaran,
      serta ikuti quiz evaluasi interaktif.
    </p>
  </div>

  <div class="flex flex-wrap items-center gap-2 shrink-0 z-10">
    <Button
      variant="primary"
      size="sm"
      onclick={() => (window.location.hash = "#/siswa/kelompok")}
    >
      <Users size={14} /> Kelompok Saya
    </Button>
    <Button
      variant="accent"
      size="sm"
      onclick={() => (window.location.hash = "#/siswa/tugas")}
    >
      <FileText size={14} /> Tugas Saya
    </Button>
    <Button
      variant="surface"
      size="sm"
      onclick={() => (window.location.hash = "#/siswa/quiz")}
    >
      <Zap size={14} /> Quiz Saya
    </Button>
  </div>
</div>
