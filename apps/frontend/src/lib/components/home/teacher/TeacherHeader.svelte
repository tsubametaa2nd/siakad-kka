<script lang="ts">
  import { Plus, Sparkles } from "lucide-svelte";
  import Badge from "../../ui/Badge.svelte";
  import Button from "../../ui/Button.svelte";

  interface Props {
    userName?: string;
    isTodayTeachingDay?: boolean;
  }

  let { userName = "Guru", isTodayTeachingDay = false }: Props = $props();
</script>

<div
  class="border-[3px] border-black bg-primary p-4 sm:p-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
>
  <div class="flex flex-col gap-2 z-10">
    <div class="flex flex-wrap items-center gap-2">
      <Badge tone="info">GURU PENGJAR</Badge>
      {#if isTodayTeachingDay}
        <span
          class="flex items-center gap-1 bg-accent text-white font-mono text-xs font-bold px-2 py-0.5 border border-black shadow-brutal-sm"
        >
          <Sparkles size={12} />
          JADWAL MENGAJAR HARI INI
        </span>
      {/if}
    </div>
    <h1
      class="font-display font-black text-2xl md:text-3xl uppercase tracking-wider text-black"
    >
      Selamat Datang, {userName}!
    </h1>
    <p class="font-body font-medium text-sm text-black max-w-2xl">
      Kelola jadwal mengajar, materi pembelajaran, tugas siswa, serta quiz
      interaktif secara terpusat di Siakad.
    </p>
  </div>

  <div class="flex flex-wrap items-center gap-2 shrink-0 z-10">
    <Button
      variant="accent"
      size="sm"
      onclick={() => (window.location.hash = "#/guru/materi/buat")}
    >
      <Plus size={14} /> Materi Baru
    </Button>
    <Button
      variant="surface"
      size="sm"
      onclick={() => (window.location.hash = "#/guru/tugas")}
    >
      <Plus size={14} /> Tugas Baru
    </Button>
    <Button
      variant="primary"
      size="sm"
      onclick={() => (window.location.hash = "#/guru/quiz/buat")}
    >
      <Plus size={14} /> Quiz Baru
    </Button>
  </div>
</div>
