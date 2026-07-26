<script lang="ts">
  import { onMount } from 'svelte';
  import { Maximize2, Minimize2 } from 'lucide-svelte';
  import { getMaterialByIdApi, type MaterialDetail } from '../../lib/api/materials';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import RenderBlok from '../../lib/components/materi/RenderBlok.svelte';
  import ActiveReadersBar from '../../lib/components/materi/ActiveReadersBar.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import { authStore } from '../../lib/stores/auth.svelte';

  interface Props {
    params?: { id?: string };
  }

  let { params = {} }: Props = $props();
  const materialId = $derived(params.id || '');

  let material = $state<MaterialDetail | null>(null);
  let loading = $state(true);
  let error = $state('');
  let scrollProgress = $state(0);
  let isFullscreen = $state(false);

  const isTeacher = $derived(authStore.user?.role === 'teacher');

  const breadcrumbs = $derived([
    { label: isTeacher ? 'Beranda Guru' : 'Beranda Siswa', href: isTeacher ? '/guru' : '/siswa' },
    { label: isTeacher ? 'Daftar Materi' : 'Materi Saya', href: isTeacher ? '/guru/materi' : '/siswa/materi' },
    { label: material?.title || 'Baca Materi' },
  ]);

  $effect(() => {
    if (materialId) loadMaterial();
  });

  const loadMaterial = async () => {
    loading = true;
    error = '';
    try {
      material = await getMaterialByIdApi(materialId);
    } catch (err: any) {
      error = err.message || 'Gagal memuat materi';
    } finally {
      loading = false;
    }
  };

  const toggleFullscreen = async () => {
    isFullscreen = !isFullscreen;
    try {
      if (isFullscreen) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      // Fallback mode CSS overlay
    }
  };

  onMount(() => {
    const handleFullscreenChange = () => {
      isFullscreen = !!document.fullscreenElement;
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        isFullscreen = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  // UI-08-12: Scroll progress indicator (client-side only)
  $effect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  });
</script>

<!-- Scroll progress bar — fixed at top -->
<div class="fixed top-0 left-0 right-0 z-100 h-1.5 bg-gray-200">
  <div
    class="h-full bg-primary border-r border-black transition-all duration-100"
    style="width: {scrollProgress}%"
    role="progressbar"
    aria-valuenow={scrollProgress}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label="Kemajuan membaca"
  ></div>
</div>

<!-- FULLSCREEN READING OVERLAY MODE -->
{#if isFullscreen && material}
  <div class="fixed inset-0 z-90 bg-base p-4 sm:p-8 overflow-y-auto flex flex-col items-center">
    <div class="w-full max-w-5xl flex flex-col gap-6">
      <!-- Fullscreen Control Bar (scrolls along with page) -->
      <div
        class="bg-white border-[3px] border-black p-4 shadow-brutal flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <h2 class="font-display font-black text-lg sm:text-xl uppercase tracking-wide truncate">
          {material.title}
        </h2>

        <div class="flex items-center gap-2 shrink-0">
          <ActiveReadersBar materialId={material.id || materialId} />
          <button
            type="button"
            onclick={toggleFullscreen}
            title="Keluar Fullscreen (Esc)"
            class="w-[42px] h-[42px] border-2 border-black bg-accent text-black shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center shrink-0 cursor-pointer transition-all"
          >
            <Minimize2 size={18} />
          </button>
        </div>
      </div>

      <!-- Material Blocks Container -->
      <div class="bg-white border-[3px] border-black p-6 sm:p-10 shadow-brutal flex flex-col gap-8">
        {#each material.blocks as block, i (i)}
          <RenderBlok {block} />
        {/each}

        <div class="border-t-[3px] border-black pt-6 text-center font-display font-black text-sm uppercase text-gray-600">
          — Selesai Membaca —
        </div>
      </div>
    </div>
  </div>
{:else}
  <AppShell title={material?.title || 'Baca Materi'} {breadcrumbs}>
    {#snippet headerAction()}
      {#if material}
        <div class="flex items-center gap-2">
          <ActiveReadersBar materialId={material.id || materialId} />
          <button
            type="button"
            onclick={toggleFullscreen}
            title="Buka Mode Layar Penuh"
            class="w-[42px] h-[42px] border-2 border-black bg-primary text-black shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center shrink-0 cursor-pointer transition-all"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      {/if}
    {/snippet}

    {#if loading}
      <div class="flex flex-col gap-6 w-full">
        <Skeleton height="h-12" />
        <Skeleton height="h-48" />
        <Skeleton height="h-32" />
      </div>
    {:else if error}
      <Alert tone="danger" title="Gagal Memuat Materi" message={error} onretry={loadMaterial} />
    {:else if material}
      <div class="w-full flex flex-col gap-6">
        <!-- Render blocks -->
        {#each material.blocks as block, i (i)}
          <RenderBlok {block} />
        {/each}

        <div class="border-t-[3px] border-black pt-4 text-center font-display font-black text-sm uppercase text-gray-600">
          — Selesai —
        </div>
      </div>
    {/if}
  </AppShell>
{/if}
