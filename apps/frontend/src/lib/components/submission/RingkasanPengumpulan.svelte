<script lang="ts">
  import { FileText, Link, ExternalLink } from 'lucide-svelte';
  import { deleteSubmissionApi, type SubmissionItem } from '../../api/submissions';
  import { toastStore } from '../../stores/toast.svelte';
  import Badge from '../ui/Badge.svelte';
  import Button from '../ui/Button.svelte';
  import Card from '../ui/Card.svelte';
  import ConfirmDialog from '../ui/ConfirmDialog.svelte';
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

  const isGraded = $derived(submission.status === 'Dinilai');

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
      <div class="bg-white p-3 border-2 border-black font-body text-xs font-medium whitespace-pre-line text-gray-900">
        {submission.content}
      </div>
    </div>
  {/if}

  {#if submission.files && submission.files.length > 0}
    <div class="flex flex-col gap-1.5">
      <span class="font-display font-black text-xs uppercase">Berkas Terlampir ({submission.files.length}):</span>
      <div class="flex flex-col gap-1">
        {#each submission.files as file}
          <a
            href={file.url}
            onclick={(e) => { e.preventDefault(); triggerFileDownload(file.url, file.name); }}
            class="bg-white p-2 border-2 border-black flex items-center justify-between font-mono text-xs font-bold hover:bg-yellow-50 underline cursor-pointer"
          >
            <span class="truncate flex items-center gap-1.5">
              <FileText size={14} class="shrink-0" />
              <span>{file.name}</span>
            </span>
            <span class="text-gray-700 flex items-center gap-1">
              ({formatFileSize(file.size)}) <ExternalLink size={12} />
            </span>
          </a>
        {/each}
      </div>
    </div>
  {/if}

  {#if submission.links && submission.links.length > 0}
    <div class="flex flex-col gap-1.5">
      <span class="font-display font-black text-xs uppercase">Tautan Terlampir ({submission.links.length}):</span>
      <div class="flex flex-col gap-1">
        {#each submission.links as link}
          <a
            href={link}
            target="_blank"
            rel="noopener"
            class="bg-white p-2 border-2 border-black font-mono text-xs font-bold text-blue-900 hover:bg-yellow-50 underline truncate flex items-center justify-between gap-2"
          >
            <span class="truncate flex items-center gap-1.5">
              <Link size={14} class="shrink-0" />
              <span class="truncate">{link}</span>
            </span>
            <ExternalLink size={12} class="shrink-0" />
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
      <p class="font-body text-xs text-gray-800 italic">{submission.feedback}</p>
    </div>
  {/if}

  <div class="border-t-2 border-black pt-3 flex items-center justify-end gap-3">
    {#if isGraded}
      <span class="font-body text-xs font-bold text-gray-700 italic">Sudah dinilai, tidak bisa diubah</span>
    {:else}
      {#if onedit}
        <Button variant="surface" size="sm" onclick={onedit}>Ubah Pengumpulan</Button>
      {/if}
      <Button variant="accent" size="sm" onclick={() => showDeleteConfirm = true}>Hapus Pengumpulan</Button>
    {/if}
  </div>
</Card>

<ConfirmDialog
  bind:open={showDeleteConfirm}
  title="Hapus Pengumpulan Tugas?"
  message="Apakah Anda yakin ingin menghapus pengumpulan tugas ini? Seluruh berkas dan tautan yang sudah dikirim akan dihapus secara permanen!"
  confirmText="Hapus Pengumpulan"
  cancelText="Batal"
  loading={deleting}
  onconfirm={handleDelete}
/>
