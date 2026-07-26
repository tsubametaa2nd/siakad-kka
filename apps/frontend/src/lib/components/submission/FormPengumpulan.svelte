<script lang="ts">
  import { FolderUp } from 'lucide-svelte';
  import { submitAssignmentApi, updateSubmissionApi, type SubmissionItem } from '../../api/submissions';
  import { toastStore } from '../../stores/toast.svelte';
  import Button from '../ui/Button.svelte';
  import Card from '../ui/Card.svelte';
  import ConfirmDialog from '../ui/ConfirmDialog.svelte';
  import DaftarBerkas from './DaftarBerkas.svelte';
  import InputTautan from './InputTautan.svelte';

  interface Props {
    assignmentId: string;
    existingSubmission?: SubmissionItem | null;
    isEditing?: boolean;
    onSuccess?: (submission: SubmissionItem) => void;
    onCancelEdit?: () => void;
  }

  let { assignmentId, existingSubmission = null, isEditing = false, onSuccess, onCancelEdit }: Props = $props();

  let selectedFiles = $state<File[]>([]);
  let links = $state<string[]>([]);
  let isDragOver = $state(false);
  let uploading = $state(false);
  let uploadProgress = $state(0);
  let error = $state('');
  let showConfirm = $state(false);

  $effect(() => {
    if (isEditing && existingSubmission) {
      links = [...(existingSubmission.links || [])];
    }
  });

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/zip',
    'application/x-zip-compressed'
  ];

  const validateAndAddFiles = (files: FileList | File[]) => {
    error = '';
    const fileArray = Array.from(files);

    if (selectedFiles.length + fileArray.length > 5) {
      toastStore.add('Maksimal 5 berkas sekaligus', 'danger');
      return;
    }

    const validNewFiles: File[] = [];
    for (const f of fileArray) {
      if (!ALLOWED_TYPES.includes(f.type) && !f.name.endsWith('.zip') && !f.name.endsWith('.docx') && !f.name.endsWith('.pptx') && !f.name.endsWith('.xlsx')) {
        toastStore.add(`${f.name} — tipe tidak didukung`, 'danger');
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        toastStore.add(`${f.name} — ukuran melebihi 10 MB`, 'danger');
        continue;
      }
      validNewFiles.push(f);
    }

    selectedFiles = [...selectedFiles, ...validNewFiles];
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    isDragOver = false;
    if (e.dataTransfer?.files) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      validateAndAddFiles(target.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
  };

  const executeSubmission = async () => {
    uploading = true;
    uploadProgress = 0;
    error = '';

    try {
      const finalLinks = links.filter((l) => l.trim().length > 0);
      let res: SubmissionItem;

      if (isEditing && existingSubmission) {
        res = await updateSubmissionApi(
          existingSubmission.id,
          existingSubmission.version || 1,
          selectedFiles,
          finalLinks,
          (p: number) => { uploadProgress = p; }
        );
        toastStore.add('Pengumpulan tugas berhasil diperbarui!', 'success');
      } else {
        res = await submitAssignmentApi(
          assignmentId,
          selectedFiles,
          finalLinks,
          (p: number) => { uploadProgress = p; }
        );
        toastStore.add('Tugas berhasil dikumpulkan!', 'success');
      }

      selectedFiles = [];
      if (onSuccess) onSuccess(res);
    } catch (err: unknown) {
      error = (err as Error).message || 'Gagal mengumpulkan tugas';
      toastStore.add(error, 'danger');
    } finally {
      uploading = false;
    }
  };

  const startSubmissionProcess = (e: Event) => {
    e.preventDefault();
    error = '';

    if (selectedFiles.length === 0 && links.length === 0) {
      error = 'Mohon unggah setidaknya 1 berkas atau 1 tautan tugas.';
      return;
    }

    executeSubmission();
  };

  const canSubmit = $derived(selectedFiles.length > 0 || links.some((l) => l.trim().length > 0));
</script>

<Card tone="surface" class="border-[3px] border-black shadow-brutal flex flex-col gap-4">
  <div class="border-b-2 border-black pb-3">
    <h3 class="font-display font-black text-xl uppercase tracking-wide">
      {isEditing ? 'Ubah Pengumpulan Tugas' : 'Kirim Pengumpulan Tugas'}
    </h3>
    <p class="font-body font-medium text-xs text-gray-800">
      Silakan unggah dokumen atau lampirkan tautan hasil pengerjaan Anda di bawah ini.
    </p>
  </div>

  {#if error}
    <div class="bg-accent p-3 border-2 border-black font-body font-bold text-xs">
      {error}
    </div>
  {/if}

  <form onsubmit={startSubmissionProcess} class="flex flex-col gap-4">
    <div
      class="border-[3px] border-dashed border-black p-6 text-center cursor-pointer transition-colors duration-100 flex flex-col items-center justify-center gap-2 select-none {isDragOver ? 'bg-primary' : 'bg-white hover:bg-yellow-50'}"
      ondragover={(e) => { e.preventDefault(); isDragOver = true; }}
      ondragleave={() => (isDragOver = false)}
      ondrop={handleDrop}
      onclick={() => document.getElementById('file-drop-input')?.click()}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === 'Enter' && document.getElementById('file-drop-input')?.click()}
    >
      <input id="file-drop-input" type="file" multiple onchange={handleFileInputChange} class="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.zip" />
      <FolderUp size={36} class="text-black" />
      <div class="font-display font-black text-sm uppercase">Seret & Lepas Berkas ke Sini</div>
      <div class="font-body text-xs text-gray-700">atau klik untuk memilih dari perangkat</div>
      <div class="font-mono text-[11px] font-bold text-gray-600">PDF, DOCX, PPTX, XLSX, PNG, JPG, ZIP (Maks 10 MB per berkas, Maks 5 berkas)</div>
    </div>

    <DaftarBerkas files={selectedFiles} progress={uploadProgress} {uploading} disabled={uploading} onremove={handleRemoveFile} />

    <InputTautan bind:links disabled={uploading} />

    <div class="flex items-center justify-end gap-3 pt-2">
      {#if isEditing && onCancelEdit}
        <Button type="button" variant="surface" disabled={uploading} onclick={onCancelEdit}>Batal</Button>
      {/if}
      <Button type="submit" variant="primary" loading={uploading} disabled={!canSubmit}>
        {isEditing ? 'Simpan Perubahan' : 'Kumpulkan Tugas'}
      </Button>
    </div>
  </form>
</Card>
