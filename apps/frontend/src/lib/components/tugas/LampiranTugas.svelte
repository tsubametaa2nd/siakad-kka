<script lang="ts">
  import { FileText, Download, Eye, X, ExternalLink, Paperclip, FileCode, Image as ImageIcon } from 'lucide-svelte';
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
    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) || file.mime?.startsWith('image/')) {
      return { type: 'image', label: 'GAMBAR', color: 'bg-purple-100 text-purple-800 border-purple-400' };
    }
    return { type: 'other', label: ext.toUpperCase() || 'FILE', color: 'bg-gray-100 text-gray-800 border-gray-400' };
  };

  const handlePreview = (file: AssignmentAttachment) => {
    selectedFile = file;
    showPreviewModal = true;
  };
</script>

{#if attachments && attachments.length > 0}
  <div class="border-[3px] border-black bg-yellow-50 p-4 shadow-brutal flex flex-col gap-3">
    <div class="flex items-center justify-between border-b-2 border-black pb-2">
      <h3 class="font-display font-black text-sm uppercase text-black flex items-center gap-1.5">
        <Paperclip size={16} class="shrink-0 text-black" />
        <span>{title} ({attachments.length})</span>
      </h3>
      <span class="font-mono text-xs font-bold text-gray-700">Dapat Diunduh & Dilihat</span>
    </div>

    <div class="flex flex-col gap-2.5">
      {#each attachments as file}
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

<!-- Modal Pratinjau File -->
{#if showPreviewModal && selectedFile}
  {@const info = getFileTypeInfo(selectedFile)}
  <Modal bind:open={showPreviewModal} title={`Pratinjau Berkas: ${selectedFile.name}`} class="max-w-4xl">
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-yellow-100 border-2 border-black font-mono text-xs">
        <div class="flex items-center gap-2 truncate">
          <span class="px-2 py-0.5 border font-black uppercase {info.color}">{info.label}</span>
          <span class="font-bold truncate">{selectedFile.name}</span>
          {#if selectedFile.size}
            <span class="text-gray-600">({formatFileSize(selectedFile.size)})</span>
          {/if}
        </div>
        <button
          type="button"
          onclick={() => triggerFileDownload(selectedFile!.url, selectedFile!.name)}
          class="font-display font-black text-xs uppercase px-3 py-1 bg-yellow-300 text-black border-2 border-black shadow-brutal-sm hover:bg-yellow-400 flex items-center gap-1 cursor-pointer"
        >
          <Download size={13} />
          <span>Unduh Berkas</span>
        </button>
      </div>

      <div class="border-2 border-black bg-gray-100 min-h-[450px] max-h-[70vh] flex items-center justify-center overflow-auto relative">
        {#if info.type === 'pdf'}
          <iframe
            src={selectedFile.url}
            title={selectedFile.name}
            class="w-full h-[550px] border-0"
          ></iframe>
        {:else if info.type === 'image'}
          <img src={selectedFile.url} alt={selectedFile.name} class="max-w-full max-h-[550px] object-contain p-2" />
        {:else if info.type === 'word' && selectedFile.url.startsWith('http')}
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedFile.url)}`}
            title={selectedFile.name}
            class="w-full h-[550px] border-0"
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
