<script lang="ts">
  import { FileText, RotateCw, Download, ExternalLink, AlertTriangle, Paperclip } from 'lucide-svelte';
  import Button from '../ui/Button.svelte';
  import { formatFileSize, triggerFileDownload } from '../../utils/format';

  interface FileInfo {
    name: string;
    url: string;
    size?: number;
    type?: string;
  }

  interface Props {
    files?: FileInfo[];
    onrefresh?: () => void;
  }

  let { files = [], onrefresh }: Props = $props();

  let activeIndex = $state(0);
  let previewError = $state(false);

  const activeFile = $derived(files[activeIndex] || null);

  const getFileExt = (f: FileInfo | null) => {
    if (!f) return '';
    if (f.name) {
      const parts = f.name.split('.');
      if (parts.length > 1) {
        const ext = parts.pop()?.toLowerCase();
        if (ext) return ext;
      }
    }
    if (f.url) {
      const cleanUrl = f.url.split('?')[0].split('#')[0];
      const parts = cleanUrl.split('.');
      if (parts.length > 1) {
        const ext = parts.pop()?.toLowerCase();
        if (ext) return ext;
      }
    }
    return '';
  };

  const isImage = $derived.by(() => {
    if (!activeFile) return false;
    if (activeFile.type && activeFile.type.startsWith('image/')) return true;
    if (activeFile.url && activeFile.url.startsWith('data:image/')) return true;
    const ext = getFileExt(activeFile);
    return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext);
  });

  const isPdf = $derived.by(() => {
    if (!activeFile) return false;
    if (activeFile.type === 'application/pdf') return true;
    if (activeFile.url && activeFile.url.startsWith('data:application/pdf')) return true;
    const ext = getFileExt(activeFile);
    return ext === 'pdf';
  });

  $effect(() => {
    // Reset error jika file aktif berganti
    if (activeIndex >= 0) previewError = false;
  });
</script>

<div class="border-[3px] border-black bg-surface p-4 shadow-brutal flex flex-col gap-3">
  <div class="flex items-center justify-between border-b-2 border-black pb-2">
    <h3 class="font-display font-black text-sm uppercase text-black flex items-center gap-1.5">
      <FileText size={16} class="shrink-0" />
      <span>Berkas Pengumpulan ({files.length})</span>
    </h3>
  </div>

  {#if files.length > 1}
    <div class="flex flex-wrap gap-2">
      {#each files as f, idx}
        <button
          type="button"
          onclick={() => (activeIndex = idx)}
          class="px-2.5 py-1 border-2 border-black font-mono text-xs font-bold transition-all flex items-center gap-1 {activeIndex === idx ? 'bg-primary text-black shadow-brutal-sm' : 'bg-white text-gray-700 hover:bg-yellow-100'}"
        >
          <FileText size={13} class="shrink-0" />
          <span class="max-w-[150px] truncate">{f.name}</span>
        </button>
      {/each}
    </div>
  {/if}

  {#if activeFile}
    <div class="bg-yellow-100 p-2.5 border-2 border-black flex items-center justify-between gap-2 shadow-brutal-sm">
      <div class="truncate">
        <span class="font-display font-black text-xs uppercase">{activeFile.name}</span>
        {#if activeFile.size}
          <span class="font-mono text-xs font-bold text-gray-700 ml-2">({formatFileSize(activeFile.size)})</span>
        {/if}
      </div>
      <div class="flex items-center gap-2 shrink-0">
        {#if onrefresh}
          <Button variant="surface" size="sm" onclick={onrefresh}>
            <RotateCw size={13} class="shrink-0" />
            <span>Muat Ulang Tautan</span>
          </Button>
        {/if}
        <button
          type="button"
          onclick={() => triggerFileDownload(activeFile.url, activeFile.name)}
          class="font-display font-black text-xs uppercase px-2.5 py-1 bg-yellow-200 text-black border-2 border-black shadow-brutal-sm hover:bg-yellow-300 flex items-center gap-1 cursor-pointer"
        >
          <span>Unduh Berkas</span>
          <Download size={13} class="shrink-0" />
        </button>
      </div>
    </div>

    <div class="flex-1 border-2 border-black bg-gray-100 relative min-h-[320px] overflow-hidden flex items-center justify-center">
      {#if previewError}
        <div class="p-6 text-center flex flex-col items-center gap-3">
          <AlertTriangle size={32} class="text-accent" />
          <span class="font-body text-xs font-bold text-black">Pratinjau gagal dimuat atau tautan telah kedaluwarsa.</span>
          {#if onrefresh}
            <Button variant="primary" size="sm" onclick={onrefresh}>Segarkan Tautan Signed URL</Button>
          {/if}
        </div>
      {:else if isImage}
        <img
          src={activeFile.url}
          alt={activeFile.name}
          onerror={() => (previewError = true)}
          class="max-w-full max-h-[450px] object-contain p-2"
        />
      {:else if isPdf}
        <iframe
          src={activeFile.url}
          title={activeFile.name}
          onerror={() => (previewError = true)}
          class="w-full h-full min-h-[420px] border-0"
        ></iframe>
      {:else}
        <div class="p-8 text-center flex flex-col items-center gap-3">
          <Paperclip size={40} class="text-black" />
          <span class="font-body text-sm font-bold text-black">Tipe berkas ini tidak dapat dipratinjau langsung.</span>
          <button
            type="button"
            onclick={() => triggerFileDownload(activeFile.url, activeFile.name)}
            class="font-display font-black text-xs uppercase px-4 py-2 bg-primary text-black border-2 border-black shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Unduh Berkas ({activeFile.name})</span>
            <Download size={14} class="shrink-0" />
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
