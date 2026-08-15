<script lang="ts">
  import { Pin, Paperclip, Trash2, Upload, FileText } from 'lucide-svelte';
  import { createAssignmentApi, updateAssignmentApi, type AssignmentItem, type AssignmentAttachment } from '../../api/assignments';
  import { getTeacherClassesApi, type ClassItem } from '../../api/classes';
  import { toastStore } from '../../stores/toast.svelte';
  import Button from '../ui/Button.svelte';
  import Input from '../ui/Input.svelte';
  import Modal from '../ui/Modal.svelte';
  import Select from '../ui/Select.svelte';
  import Textarea from '../ui/Textarea.svelte';
  import { localToUtcIso, utcIsoToLocalDatetime } from '../../utils/date';
  import { formatFileSize } from '../../utils/format';

  interface Props {
    open?: boolean;
    assignmentToEdit?: AssignmentItem | null;
    onSuccess?: (assignment: AssignmentItem) => void;
  }

  let { open = $bindable(false), assignmentToEdit = null, onSuccess }: Props = $props();

  let title = $state('');
  let description = $state('');
  let classId = $state('');
  let type = $state<'individual' | 'group'>('individual');
  let groupSubmissionMode = $state<'representative' | 'individual'>('representative');
  let dueDateLocal = $state('');
  let maxScore = $state(100);

  let classes = $state<ClassItem[]>([]);
  let loadingClasses = $state(false);
  let submitting = $state(false);
  let uploadProgress = $state(0);

  let selectedFiles = $state<File[]>([]);
  let existingAttachments = $state<AssignmentAttachment[]>([]);
  let fileInputRef = $state<HTMLInputElement | null>(null);

  const isEditMode = $derived(!!assignmentToEdit);

  const typeOptions = [
    { value: 'individual', label: 'Individu' },
    { value: 'group', label: 'Kelompok' },
  ];

  const groupSubmissionModeOptions = [
    { value: 'representative', label: 'Perwakilan (1 Siswa Mewakili Kelompok)' },
    { value: 'individual', label: 'Masing-masing (Setiap Anggota Mengumpulkan)' },
  ];

  const classOptions = $derived(
    classes.map((c) => ({ value: c.id, label: `${c.name} (${c.level})` }))
  );

  $effect(() => {
    if (open) {
      loadClasses();
      selectedFiles = [];
      uploadProgress = 0;
      if (assignmentToEdit) {
        title = assignmentToEdit.title;
        description = assignmentToEdit.description;
        classId = assignmentToEdit.class_id;
        type = assignmentToEdit.type || 'individual';
        groupSubmissionMode = assignmentToEdit.group_submission_mode || 'representative';
        dueDateLocal = utcIsoToLocalDatetime(assignmentToEdit.due_date);
        maxScore = assignmentToEdit.max_score || 100;
        existingAttachments = assignmentToEdit.attachments ? [...assignmentToEdit.attachments] : [];
      } else {
        title = '';
        description = '';
        dueDateLocal = '';
        maxScore = 100;
        groupSubmissionMode = 'representative';
        type = 'individual';
        existingAttachments = [];
      }
    }
  });

  const loadClasses = async () => {
    loadingClasses = true;
    try {
      classes = await getTeacherClassesApi();
      if (classes.length > 0 && !classId) {
        classId = classes[0].id;
      }
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal memuat daftar kelas', 'danger');
    } finally {
      loadingClasses = false;
    }
  };

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target.files) return;
    const newFiles = Array.from(target.files);

    const totalCount = existingAttachments.length + selectedFiles.length + newFiles.length;
    if (totalCount > 5) {
      toastStore.add('Maksimal 5 berkas lampiran per tugas', 'danger');
      return;
    }

    const allowedExts = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.webp', '.zip', '.txt'];
    for (const f of newFiles) {
      if (f.size > 10 * 1024 * 1024) {
        toastStore.add(`Ukuran berkas "${f.name}" melebihi batas 10 MB`, 'danger');
        return;
      }
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      if (!allowedExts.includes(ext)) {
        toastStore.add(`Format berkas "${f.name}" tidak diizinkan. Gunakan PDF/Word/Dokumen.`, 'danger');
        return;
      }
    }

    selectedFiles = [...selectedFiles, ...newFiles];
    if (target) target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
  };

  const removeExistingAttachment = (index: number) => {
    existingAttachments = existingAttachments.filter((_, i) => i !== index);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!title || !description || !classId || !dueDateLocal || submitting) return;

    const selectedTime = new Date(dueDateLocal).getTime();
    if (selectedTime <= Date.now() && !isEditMode) {
      toastStore.add('Tenggat waktu harus di masa mendatang', 'danger');
      return;
    }

    submitting = true;
    uploadProgress = 0;
    try {
      const utcDueDate = localToUtcIso(dueDateLocal);
      let result: AssignmentItem;

      if (isEditMode && assignmentToEdit) {
        result = await updateAssignmentApi(
          assignmentToEdit.id,
          {
            title,
            description,
            type,
            group_submission_mode: type === 'group' ? groupSubmissionMode : undefined,
            due_date: utcDueDate,
            max_score: Number(maxScore) || 100,
            existing_attachments: existingAttachments,
            files: selectedFiles.length > 0 ? selectedFiles : undefined,
          },
          (percent) => (uploadProgress = percent)
        );
        toastStore.add(`Tugas "${title}" berhasil diperbarui`, 'success');
      } else {
        result = await createAssignmentApi(
          {
            class_id: classId,
            title,
            description,
            type,
            group_submission_mode: type === 'group' ? groupSubmissionMode : undefined,
            due_date: utcDueDate,
            max_score: Number(maxScore) || 100,
            files: selectedFiles.length > 0 ? selectedFiles : undefined,
          },
          (percent) => (uploadProgress = percent)
        );
        toastStore.add(`Tugas "${title}" berhasil dibuat`, 'success');
      }

      open = false;
      if (onSuccess) onSuccess(result);
    } catch (err: any) {
      toastStore.add(err.message || (isEditMode ? 'Gagal mengedit tugas' : 'Gagal membuat tugas baru'), 'danger');
    } finally {
      submitting = false;
      uploadProgress = 0;
    }
  };
</script>

<Modal bind:open title={isEditMode ? "Edit Tugas Guru" : "Buat Tugas Baru"} class="max-w-2xl">
  <form onsubmit={handleSubmit} class="flex flex-col gap-4">
    <Input label="Judul Tugas" required={true} bind:value={title} placeholder="Contoh: Modul 1 Web Design" />

    <Textarea label="Deskripsi & Petunjuk Tugas" required={true} bind:value={description} rows={3} placeholder="Tuliskan petunjuk pengerjaan tugas atau tautan link terkait..." />

    <!-- Unggah Foto Soal & Lampiran Berkas Guru -->
    <div class="border-2 border-black p-3.5 bg-yellow-50 flex flex-col gap-2.5">
      <div class="flex items-center justify-between">
        <label for="assignment-files-input" class="font-display font-black text-xs uppercase tracking-wide text-black flex items-center gap-1.5 cursor-pointer">
          <Paperclip size={15} />
          <span>Foto Soal & Lampiran Berkas (Gambar / PDF / Word / PPT)</span>
        </label>
        <span class="font-mono text-xs text-gray-600 font-bold">
          {existingAttachments.length + selectedFiles.length}/5 Berkas
        </span>
      </div>

      <p class="font-body text-xs text-gray-700 font-medium">
        Unggah <strong>foto lembar soal (PNG, JPG, WebP)</strong> atau berkas panduan tugas (PDF / Word / PPT / Excel). Siswa dapat langsung melihat foto soal dan mengunduh berkas pada halaman tugas.
      </p>

      <input
        id="assignment-files-input"
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.webp,.txt"
        class="hidden"
        bind:this={fileInputRef}
        onchange={handleFileSelect}
      />

      <div class="flex items-center gap-2">
        <Button
          type="button"
          variant="surface"
          size="sm"
          onclick={() => fileInputRef?.click()}
          disabled={existingAttachments.length + selectedFiles.length >= 5}
        >
          <Upload size={14} />
          <span>+ Pilih Foto Soal / Berkas</span>
        </Button>
      </div>

      <!-- List Lampiran Lama (Mode Edit) -->
      {#if existingAttachments.length > 0}
        <div class="flex flex-col gap-1.5 pt-1">
          <span class="font-mono text-xs font-bold text-gray-800 uppercase">Berkas Terpasang:</span>
          {#each existingAttachments as file, idx}
            {@const isImg = file.mime?.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name)}
            <div class="flex items-center justify-between p-2 bg-white border-2 border-black font-mono text-xs gap-2">
              <div class="flex items-center gap-2.5 truncate min-w-0">
                {#if isImg && file.url}
                  <img src={file.url} alt={file.name} class="w-10 h-10 object-cover border border-black shrink-0 bg-gray-100" />
                  <span class="px-1.5 py-0.5 text-[10px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-400 shrink-0">FOTO</span>
                {:else}
                  <div class="w-10 h-10 flex items-center justify-center bg-blue-50 border border-black shrink-0">
                    <FileText size={18} class="text-blue-600" />
                  </div>
                  <span class="px-1.5 py-0.5 text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-400 shrink-0">DOKUMEN</span>
                {/if}
                <div class="flex flex-col truncate min-w-0">
                  <span class="truncate font-bold text-black" title={file.name}>{file.name}</span>
                  {#if file.size}
                    <span class="text-gray-500 text-[11px]">({formatFileSize(file.size)})</span>
                  {/if}
                </div>
              </div>
              <button
                type="button"
                onclick={() => removeExistingAttachment(idx)}
                class="text-red-600 hover:text-red-800 p-1.5 cursor-pointer shrink-0 border border-transparent hover:border-black hover:bg-red-50"
                title="Hapus lampiran ini"
              >
                <Trash2 size={14} />
              </button>
            </div>
          {/each}
        </div>
      {/if}

      <!-- List Lampiran Baru Ditambahkan -->
      {#if selectedFiles.length > 0}
        <div class="flex flex-col gap-1.5 pt-1">
          <span class="font-mono text-xs font-bold text-green-800 uppercase">Berkas Baru Ditambahkan:</span>
          {#each selectedFiles as file, idx}
            {@const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name)}
            <div class="flex items-center justify-between p-2 bg-green-50 border-2 border-black font-mono text-xs gap-2">
              <div class="flex items-center gap-2.5 truncate min-w-0">
                {#if isImg}
                  <img src={URL.createObjectURL(file)} alt={file.name} class="w-10 h-10 object-cover border border-black shrink-0 bg-gray-100" />
                  <span class="px-1.5 py-0.5 text-[10px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-400 shrink-0">FOTO</span>
                {:else}
                  <div class="w-10 h-10 flex items-center justify-center bg-green-100 border border-black shrink-0">
                    <FileText size={18} class="text-green-700" />
                  </div>
                  <span class="px-1.5 py-0.5 text-[10px] font-black uppercase bg-green-200 text-green-900 border border-green-500 shrink-0">DOKUMEN</span>
                {/if}
                <div class="flex flex-col truncate min-w-0">
                  <span class="truncate font-bold text-black" title={file.name}>{file.name}</span>
                  <span class="text-gray-600 text-[11px]">({formatFileSize(file.size)})</span>
                </div>
              </div>
              <button
                type="button"
                onclick={() => removeSelectedFile(idx)}
                class="text-red-600 hover:text-red-800 p-1.5 cursor-pointer shrink-0 border border-transparent hover:border-black hover:bg-red-50"
                title="Batal unggah file ini"
              >
                <Trash2 size={14} />
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select label="Pilih Kelas" options={classOptions} bind:value={classId} disabled={loadingClasses || isEditMode} />
      <Select label="Tipe Tugas" options={typeOptions} bind:value={type} />
    </div>

    {#if type === 'group'}
      <div class="bg-yellow-50 p-3 border-2 border-black">
        <Select
          label="Mode Pengumpulan Tugas Kelompok"
          options={groupSubmissionModeOptions}
          bind:value={groupSubmissionMode}
        />
        <p class="font-body text-xs text-gray-700 mt-1 font-medium flex items-start gap-1.5">
          <Pin size={14} class="shrink-0 mt-0.5" />
          <span>
            {#if groupSubmissionMode === 'representative'}
              <strong>Perwakilan:</strong> 1 siswa mengumpulkan mewakili kelompok. Nilai otomatis sama untuk semua anggota.
            {:else}
              <strong>Masing-masing:</strong> Setiap anggota kelompok mengumpulkan tugasnya sendiri & dinilai secara individu.
            {/if}
          </span>
        </p>
      </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Tenggat Waktu (WIB)"
        type="datetime-local"
        required={true}
        bind:value={dueDateLocal}
        hint="Pilih tanggal dan jam tenggat pengumpulan"
      />
      <Input
        label="Nilai Maksimal"
        type="number"
        required={true}
        bind:value={maxScore}
      />
    </div>

    {#if submitting && uploadProgress > 0 && uploadProgress < 100}
      <div class="w-full bg-gray-200 border-2 border-black h-4 overflow-hidden">
        <div class="bg-primary h-full transition-all duration-150" style="width: {uploadProgress}%"></div>
      </div>
    {/if}

    <div class="flex items-center justify-end gap-3 pt-4 border-t-2 border-black bg-base mt-2 shrink-0">
      <Button type="button" variant="surface" onclick={() => (open = false)}>Batal</Button>
      <Button type="submit" variant="primary" loading={submitting} disabled={!title || !description || !classId || !dueDateLocal}>
        {isEditMode ? 'Simpan Perubahan Tugas' : 'Simpan Tugas'}
      </Button>
    </div>
  </form>
</Modal>

