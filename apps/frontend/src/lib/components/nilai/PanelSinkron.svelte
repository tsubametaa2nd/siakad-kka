<script lang="ts">
  import { RefreshCw, ArrowRight } from 'lucide-svelte';
  import { syncClassGradesApi } from '../../api/grading';
  import { toastStore } from '../../stores/toast.svelte';
  import Badge from '../ui/Badge.svelte';
  import Button from '../ui/Button.svelte';

  interface Props {
    classId: string;
    className: string;
    spreadsheetId?: string | null;
    pendingCount?: number;
    onsynced?: () => void;
  }

  let {
    classId,
    className,
    spreadsheetId = null,
    pendingCount = 0,
    onsynced
  }: Props = $props();

  let syncing = $state(false);

  const handleSync = async () => {
    if (!classId) return;
    syncing = true;
    try {
      await syncClassGradesApi(classId);
      toastStore.add(`Berhasil menyinkronkan nilai kelas ${className} ke Spreadsheet!`, 'success');
      if (onsynced) onsynced();
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal menyinkronkan nilai', 'danger');
    } finally {
      syncing = false;
    }
  };
</script>

<div class="bg-base border-2 border-black p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  <div class="flex flex-col gap-1">
    <div class="flex items-center gap-2">
      <span class="font-display font-black text-sm uppercase">Status Google Sheets:</span>
      <Badge tone={spreadsheetId ? (pendingCount > 0 ? 'warning' : 'info') : 'neutral'}>
        {spreadsheetId ? (pendingCount > 0 ? `${pendingCount} Menunggu Sinkron` : 'Tersinkronasi') : 'Belum Ditautkan'}
      </Badge>
    </div>

    {#if !spreadsheetId}
      <p class="font-body text-xs text-gray-700">
        Tautkan Spreadsheet ID di Pengaturan Kelas untuk mengaktifkan sinkronisasi nilai otomatis.
        <a href={`#/guru/kelas/${classId}`} class="underline font-bold hover:text-accent inline-flex items-center gap-0.5">
          <span>Atur di Pengaturan Kelas</span> <ArrowRight size={12} />
        </a>
      </p>
    {:else if pendingCount > 0}
      <p class="font-body text-xs text-gray-800 font-medium">
        Terdapat <strong>{pendingCount} nilai baru/diubah</strong> yang belum masuk ke Google Spreadsheet.
      </p>
    {:else}
      <p class="font-body text-xs text-gray-800 font-medium">
        Seluruh nilai kelas <strong>{className}</strong> sudah tersinkron rapi ke Google Spreadsheet.
      </p>
    {/if}
  </div>

  {#if spreadsheetId && pendingCount > 0}
    <Button variant="primary" size="sm" loading={syncing} onclick={handleSync} class="shrink-0">
      <span class="flex items-center gap-1.5"><RefreshCw size={14} /> Sinkron Ulang Ke Spreadsheet</span>
    </Button>
  {/if}
</div>
