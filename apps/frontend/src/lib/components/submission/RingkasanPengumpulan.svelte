<script lang="ts">
  import { FileText, Link, ExternalLink, Image as ImageIcon, Eye, Download } from 'lucide-svelte';
  import { deleteSubmissionApi, type SubmissionItem } from '../../api/submissions';
  import { toastStore } from '../../stores/toast.svelte';
  import Badge from '../ui/Badge.svelte';
  import Button from '../ui/Button.svelte';
  import Card from '../ui/Card.svelte';
  import ConfirmDialog from '../ui/ConfirmDialog.svelte';
  import FormattedText from '../ui/FormattedText.svelte';
  import Modal from '../ui/Modal.svelte';
  import { formatFullDateTimeWIB } from '../../utils/date';
  import { formatFileSize, triggerFileDownload } from '../../utils/format';

  interface Props {
    submission: SubmissionItem;
    onedit?: () => void;
    ondeleted?: () => void;
  }

  let { submission, onedit, ondeleted }: Props = $props();

  let showDeleteConfirm = $state(false);
  let deleting = $state(false);
  let previewImageModal = $state<{ open: boolean; name: string; url: string }>({ open: false, name: '', url: '' });

  const isGraded = $derived(submission.status === 'Dinilai');

  const isImageFile = (file: { name: string; url: string; mime?: string }) => {
    if (file.mime?.startsWith('image/')) return true;
    if (file.url?.startsWith('data:image/')) return true;
    return /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
  };

  const handleDelete = async () => {
    deleting = true;
    try {
      await deleteSubmissionApi(submission.id);
      toastStore.add('Pengumpulan tugas berhasil dihapus', 'success');
      showDeleteConfirm = false;
      if (ondeleted) ondeleted();
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal menghapus pengumpulan', 'danger');
    } finally {
      deleting = false;
    }
  };
</script>

<Card tone="surface" class="border-[3px] border-black shadow-brutal flex flex-col gap-4">
  <div class="flex items-center justify-between gap-3 border-b-2 border-black pb-3">
    <div>
      <h3 class="font-display font-black text-lg uppercase tracking-wide">Ringkasan Pengumpulan</h3>
      <span class="font-mono text-xs font-bold text-gray-700">Dikumpulkan: {formatFullDateTimeWIB(submission.submitted_at)}</span>
    </div>
    <Badge tone={submission.status === 'Dinilai' ? 'warning' : submission.status === 'Sudah' ? 'info' : 'danger'}>
      {submission.status}
    </Badge>
  </div>

  {#if submission.submitted_by_name}
    <div class="font-body text-xs font-bold bg-white p-2 border-2 border-black">
      Dikumpulkan oleh: <span class="underline">{submission.submitted_by_name}</span>
    </div>
  {/if}

  {#if submission.content}
    <div class="flex flex-col gap-1.5">
      <span class="font-display font-black text-xs uppercase">Teks Jawaban / Catatan:</span>
      <div class="bg-white p-3 border-2 border-black font-body text-xs font-medium text-gray-900">
        <FormattedText text={submission.content} />
      </div>
    </div>
  {/if}

  {#if submission.files && submission.files.length > 0}
    <div class="flex flex-col gap-1.5">
      <span class="font-display font-black text-xs uppercase">Berkas Terlampir ({submission.files.length}):</span>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {#each submission.files as file}
          {@const isImg = isImageFile(file)}
          {#if isImg}
            <div class="bg-white border-2 border-black p-2 flex items-center justify-between gap-2 shadow-brutal-sm">
              <div class="flex items-center gap-2 truncate min-w-0">
                <button
                  type="button"
                  onclick={() => (previewImageModal = { open: true, name: file.name, url: file.url })}
                  class="w-12 h-12 shrink-0 bg-gray-100 border border-black overflow-hidden cursor-pointer hover:opacity-90"
                  title="Klik untuk perbesar foto"
                >
                  <img src={file.url} alt={file.name} class="w-full h-full object-cover" />
                </button>
                <div class="flex flex-col truncate min-w-0">
                  <span class="font-display font-bold text-xs truncate text-black">{file.name}</span>
                  <span class="font-mono text-[11px] text-gray-600 font-bold">{formatFileSize(file.size)}</span>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onclick={() => (previewImageModal = { open: true, name: file.name, url: file.url })}
                  class="p-1.5 bg-blue-100 border border-black shadow-brutal-sm hover:bg-blue-200"
                  title="Lihat Foto"
                >
                  <Eye size={13} />
                </button>
                <button
                  type="button"
                  onclick={() => triggerFileDownload(file.url, file.name)}
                  class="p-1.5 bg-yellow-300 border border-black shadow-brutal-sm hover:bg-yellow-400"
                  title="Unduh Foto"
                >
                  <Download size={13} />
                </button>
              </div>
            </div>
          {:else}
            <a
              href={file.url}
              onclick={(e) => { e.preventDefault(); triggerFileDownload(file.url, file.name); }}
              class="bg-white p-2.5 border-2 border-black flex items-center justify-between font-mono text-xs font-bold hover:bg-yellow-50 underline cursor-pointer shadow-brutal-sm"
            >
              <span class="truncate flex items-center gap-1.5">
                <FileText size={15} class="shrink-0 text-blue-600" />
                <span class="truncate">{file.name}</span>
              </span>
              <span class="text-gray-700 flex items-center gap-1 shrink-0 text-[11px]">
                ({formatFileSize(file.size)}) <ExternalLink size={12} />
              </span>
            </a>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  {#if submission.links && submission.links.length > 0}
    <div class="flex flex-col gap-1.5">
      <span class="font-display font-black text-xs uppercase">Tautan Terlampir ({submission.links.length}):</span>
      <div class="flex flex-col gap-1.5">
        {#each submission.links as link}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            class="bg-white p-2.5 border-2 border-black font-mono text-xs font-bold text-blue-900 hover:bg-yellow-50 underline truncate flex items-center justify-between gap-2 shadow-brutal-sm"
          >
            <span class="truncate flex items-center gap-1.5">
              <Link size={14} class="shrink-0" />
              <span class="truncate">{link}</span>
            </span>
            <ExternalLink size={13} class="shrink-0" />
          </a>
        {/each}
      </div>
    </div>
  {/if}

  {#if submission.score !== undefined && submission.score !== null}
    <div class="bg-yellow-100 p-3 border-2 border-black flex items-center justify-between">
      <span class="font-display font-black text-sm uppercase">Nilai Guru:</span>
      <span class="font-mono font-black text-lg text-black">{submission.score}</span>
    </div>
  {/if}

  {#if submission.feedback}
    <div class="bg-white p-3 border-2 border-black">
      <span class="font-display font-black text-xs uppercase block mb-1">Catatan Guru:</span>
      <div class="font-body text-xs text-gray-800 italic">
        <FormattedText text={submission.feedback} />
      </div>
    </div>
  {/if}

  <div class="border-t-2 border-black pt-3 flex items-center justify-end gap-3">
    {#if isGraded}
      <span class="font-body text-xs font-bold text-gray-700 italic">Sudah dinilai, tidak bisa diubah</span>
    {:else}
      {#if onedit}
        <Button variant="surface" size="sm" onclick={onedit}>Ubah Pengumpulan</Button>
      {/if}
      <Button variant="accent" size="sm" onclick={() => (showDeleteConfirm = true)}>Hapus Pengumpulan</Button>
    {/if}
  </div>
</Card>

{#if previewImageModal.open}
  <Modal bind:open={previewImageModal.open} title={`Pratinjau Foto: ${previewImageModal.name}`} class="max-w-4xl">
    <div class="flex flex-col gap-3">
      <div class="border-2 border-black bg-gray-950 p-2 flex items-center justify-center max-h-[70vh] overflow-auto">
        <img src={previewImageModal.url} alt={previewImageModal.name} class="max-w-full max-h-[65vh] object-contain" />
      </div>
      <div class="flex items-center justify-between pt-2 border-t-2 border-black">
        <a
          href={previewImageModal.url}
          target="_blank"
          rel="noopener noreferrer"
          class="font-display font-black text-xs uppercase px-3 py-1.5 bg-white text-black border-2 border-black shadow-brutal-sm hover:bg-yellow-50 flex items-center gap-1.5"
        >
          <ExternalLink size={13} />
          <span>Buka Resolusi Penuh</span>
        </a>
        <Button variant="surface" onclick={() => (previewImageModal.open = false)}>Tutup</Button>
      </div>
    </div>
  </Modal>
{/if}

<ConfirmDialog
  bind:open={showDeleteConfirm}
  title="Hapus Pengumpulan Tugas?"
  message="Apakah Anda yakin ingin menghapus pengumpulan tugas ini? Seluruh berkas dan tautan yang sudah dikirim akan dihapus secara permanen!"
  confirmText="Hapus Pengumpulan"
  cancelText="Batal"
  loading={deleting}
  onconfirm={handleDelete}
/>
