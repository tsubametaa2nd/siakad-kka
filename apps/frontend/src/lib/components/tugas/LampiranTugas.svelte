<script lang="ts">
  import { FileText, Download, Eye, Paperclip, Image as ImageIcon, ExternalLink, ZoomIn, Maximize2 } from 'lucide-svelte';
  import type { AssignmentAttachment } from '../../api/assignments';
  import Button from '../ui/Button.svelte';
  import Modal from '../ui/Modal.svelte';
  import { formatFileSize, triggerFileDownload } from '../../utils/format';

  interface Props {
    attachments?: AssignmentAttachment[];
    title?: string;
  }

  let { attachments = [], title = 'Berkas & Lampiran Soal Tugas' }: Props = $props();

  let selectedFile = $state<AssignmentAttachment | null>(null);
  let showPreviewModal = $state(false);

  const isImageAttachment = (file: AssignmentAttachment) => {
    if (file.mime && file.mime.startsWith('image/')) return true;
    if (file.url && (file.url.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(file.url))) return true;
    if (file.name && /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name)) return true;
    return false;
  };

  const imageAttachments = $derived(attachments.filter(isImageAttachment));
  const documentAttachments = $derived(attachments.filter((f) => !isImageAttachment(f)));

  const getFileTypeInfo = (file: AssignmentAttachment) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf' || file.mime === 'application/pdf') {
      return { type: 'pdf', label: 'PDF', color: 'bg-red-100 text-red-800 border-red-400' };
    }
    if (['doc', 'docx'].includes(ext) || file.mime?.includes('word')) {
      return { type: 'word', label: 'WORD', color: 'bg-blue-100 text-blue-800 border-blue-400' };
    }
    if (['xls', 'xlsx'].includes(ext) || file.mime?.includes('excel') || file.mime?.includes('spreadsheet')) {
      return { type: 'excel', label: 'EXCEL', color: 'bg-emerald-100 text-emerald-800 border-emerald-400' };
    }
    if (['ppt', 'pptx'].includes(ext) || file.mime?.includes('presentation')) {
      return { type: 'ppt', label: 'PPT', color: 'bg-orange-100 text-orange-800 border-orange-400' };
    }
    if (isImageAttachment(file)) {
      return { type: 'image', label: 'FOTO / GAMBAR', color: 'bg-purple-100 text-purple-800 border-purple-400' };
    }
    return { type: 'other', label: ext.toUpperCase() || 'FILE', color: 'bg-gray-100 text-gray-800 border-gray-400' };
  };

  const handlePreview = (file: AssignmentAttachment) => {
    selectedFile = file;
    showPreviewModal = true;
  };
</script>

{#if attachments && attachments.length > 0}
  <div class="border-[3px] border-black bg-yellow-50 p-4 shadow-brutal flex flex-col gap-4">
    <!-- Header Lampiran -->
    <div class="flex flex-wrap items-center justify-between border-b-2 border-black pb-2.5 gap-2">
      <h3 class="font-display font-black text-sm sm:text-base uppercase text-black flex items-center gap-2">
        <Paperclip size={18} class="shrink-0 text-black" />
        <span>{title} ({attachments.length})</span>
      </h3>
      <div class="flex items-center gap-2 flex-wrap">
        {#if imageAttachments.length > 0}
          <span class="font-mono text-[11px] font-bold bg-purple-100 text-purple-900 px-2 py-0.5 border border-black shadow-brutal-sm flex items-center gap-1">
            <ImageIcon size={12} /> {imageAttachments.length} Foto Soal
          </span>
        {/if}
        {#if documentAttachments.length > 0}
          <span class="font-mono text-[11px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 border border-black shadow-brutal-sm flex items-center gap-1">
            <FileText size={12} /> {documentAttachments.length} Dokumen
          </span>
        {/if}
      </div>
    </div>

    <!-- Bagian 1: Galeri Foto Soal & Panduan Gambar -->
    {#if imageAttachments.length > 0}
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-1.5 text-xs font-display font-black uppercase text-purple-950">
          <ImageIcon size={15} class="text-purple-700" />
          <span>Foto Lembar Soal / Lampiran Gambar:</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {#each imageAttachments as photo}
            <div class="group relative flex flex-col bg-white border-2 border-black shadow-brutal-sm overflow-hidden transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal">
              <!-- Thumbnail Gambar -->
              <button
                type="button"
                onclick={() => handlePreview(photo)}
                class="w-full h-44 bg-gray-900 overflow-hidden relative cursor-pointer flex items-center justify-center select-none"
                title="Klik untuk memperbesar foto soal"
              >
                <img
                  src={photo.url}
                  alt={photo.name}
                  class="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                <!-- Hover Overlay -->
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span class="bg-primary text-black font-display font-black text-xs uppercase px-3 py-1.5 border-2 border-black shadow-brutal-sm flex items-center gap-1">
                    <ZoomIn size={14} />
                    <span>Perbesar</span>
                  </span>
                </div>
              </button>

              <!-- Keterangan & Aksi Foto -->
              <div class="p-2.5 flex flex-col gap-2 border-t-2 border-black bg-yellow-100">
                <div class="flex items-start justify-between gap-1.5 min-w-0">
                  <div class="flex flex-col min-w-0">
                    <span class="font-display font-black text-xs text-black truncate" title={photo.name}>
                      {photo.name}
                    </span>
                    {#if photo.size}
                      <span class="font-mono text-[11px] text-gray-700 font-bold">
                        {formatFileSize(photo.size)}
                      </span>
                    {/if}
                  </div>
                  <span class="px-1.5 py-0.5 text-[9px] font-black uppercase bg-purple-200 text-purple-900 border border-purple-400 shrink-0">
                    FOTO
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-1.5 pt-1 border-t border-black/20">
                  <button
                    type="button"
                    onclick={() => handlePreview(photo)}
                    class="font-display font-black text-[11px] uppercase py-1 px-2 bg-blue-100 text-blue-900 border border-black shadow-brutal-sm hover:bg-blue-200 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>Lihat</span>
                  </button>

                  <button
                    type="button"
                    onclick={() => triggerFileDownload(photo.url, photo.name)}
                    class="font-display font-black text-[11px] uppercase py-1 px-2 bg-yellow-300 text-black border border-black shadow-brutal-sm hover:bg-yellow-400 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download size={12} />
                    <span>Unduh</span>
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Bagian 2: Dokumen Lampiran Lainnya (PDF / Word / dsb.) -->
    {#if documentAttachments.length > 0}
      <div class="flex flex-col gap-2 {imageAttachments.length > 0 ? 'pt-3 border-t-2 border-black' : ''}">
        {#if imageAttachments.length > 0}
          <div class="flex items-center gap-1.5 text-xs font-display font-black uppercase text-blue-950">
            <FileText size={15} class="text-blue-700" />
            <span>Dokumen & Berkas Panduan:</span>
          </div>
        {/if}

        <div class="flex flex-col gap-2">
          {#each documentAttachments as file}
            {@const info = getFileTypeInfo(file)}
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border-2 border-black shadow-brutal-sm">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="font-mono text-[10px] font-black uppercase px-2 py-0.5 border {info.color} shrink-0">
                  {info.label}
                </span>
                <div class="flex flex-col min-w-0">
                  <span class="font-display font-bold text-sm text-black truncate" title={file.name}>
                    {file.name}
                  </span>
                  {#if file.size}
                    <span class="font-mono text-xs text-gray-500 font-medium">
                      {formatFileSize(file.size)}
                    </span>
                  {/if}
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onclick={() => handlePreview(file)}
                  class="font-display font-black text-xs uppercase px-3 py-1.5 bg-blue-100 text-blue-900 border-2 border-black shadow-brutal-sm hover:bg-blue-200 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Eye size={14} />
                  <span>Lihat</span>
                </button>

                <button
                  type="button"
                  onclick={() => triggerFileDownload(file.url, file.name)}
                  class="font-display font-black text-xs uppercase px-3 py-1.5 bg-yellow-300 text-black border-2 border-black shadow-brutal-sm hover:bg-yellow-400 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Unduh</span>
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

<!-- Modal Pratinjau File / Lightbox Foto -->
{#if showPreviewModal && selectedFile}
  {@const info = getFileTypeInfo(selectedFile)}
  <Modal bind:open={showPreviewModal} title={`Pratinjau: ${selectedFile.name}`} class="max-w-5xl">
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-yellow-100 border-2 border-black font-mono text-xs">
        <div class="flex items-center gap-2 truncate">
          <span class="px-2 py-0.5 border font-black uppercase {info.color}">{info.label}</span>
          <span class="font-bold truncate text-black">{selectedFile.name}</span>
          {#if selectedFile.size}
            <span class="text-gray-600">({formatFileSize(selectedFile.size)})</span>
          {/if}
        </div>
        <div class="flex items-center gap-2">
          {#if selectedFile.url}
            <a
              href={selectedFile.url}
              target="_blank"
              rel="noopener noreferrer"
              class="font-display font-black text-xs uppercase px-3 py-1 bg-white text-black border-2 border-black shadow-brutal-sm hover:bg-yellow-50 flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>Buka Tab Baru</span>
            </a>
          {/if}
          <button
            type="button"
            onclick={() => triggerFileDownload(selectedFile!.url, selectedFile!.name)}
            class="font-display font-black text-xs uppercase px-3 py-1 bg-yellow-300 text-black border-2 border-black shadow-brutal-sm hover:bg-yellow-400 flex items-center gap-1 cursor-pointer"
          >
            <Download size={13} />
            <span>Unduh Berkas</span>
          </button>
        </div>
      </div>

      <div class="border-2 border-black bg-gray-950 min-h-[450px] max-h-[75vh] flex items-center justify-center overflow-auto relative p-2">
        {#if info.type === 'image'}
          <img
            src={selectedFile.url}
            alt={selectedFile.name}
            class="max-w-full max-h-[70vh] object-contain rounded-none border border-black/40 shadow-2xl bg-white"
          />
        {:else if info.type === 'pdf'}
          <iframe
            src={selectedFile.url}
            title={selectedFile.name}
            class="w-full h-[600px] border-0 bg-white"
          ></iframe>
        {:else if info.type === 'word' && selectedFile.url.startsWith('http')}
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedFile.url)}`}
            title={selectedFile.name}
            class="w-full h-[600px] border-0 bg-white"
          ></iframe>
        {:else}
          <div class="p-8 text-center flex flex-col items-center gap-4 bg-white border-2 border-black shadow-brutal m-4">
            <FileText size={48} class="text-blue-600" />
            <div class="flex flex-col gap-1">
              <h4 class="font-display font-black text-base uppercase text-black">{selectedFile.name}</h4>
              <p class="font-body text-xs text-gray-600 font-medium max-w-md">
                Berkas format <strong>{info.label}</strong> dapat diunduh langsung untuk dibaca atau dibuka di aplikasi perangkat kamu (seperti Microsoft Word / WPS Office).
              </p>
            </div>
            <button
              type="button"
              onclick={() => triggerFileDownload(selectedFile!.url, selectedFile!.name)}
              class="font-display font-black text-xs uppercase px-5 py-2.5 bg-primary text-black border-2 border-black shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer mt-2"
            >
              <Download size={16} />
              <span>Unduh Berkas ({selectedFile.name})</span>
            </button>
          </div>
        {/if}
      </div>

      <div class="flex justify-end pt-2 border-t-2 border-black">
        <Button variant="surface" onclick={() => (showPreviewModal = false)}>Tutup Pratinjau</Button>
      </div>
    </div>
  </Modal>
{/if}
