<script lang="ts">
  import { Pin } from 'lucide-svelte';
  import { createAssignmentApi, type AssignmentItem } from '../../api/assignments';
  import { getTeacherClassesApi, type ClassItem } from '../../api/classes';
  import { toastStore } from '../../stores/toast.svelte';
  import Button from '../ui/Button.svelte';
  import Input from '../ui/Input.svelte';
  import Modal from '../ui/Modal.svelte';
  import Select from '../ui/Select.svelte';
  import Textarea from '../ui/Textarea.svelte';
  import { localToUtcIso } from '../../utils/date';

  interface Props {
    open?: boolean;
    onSuccess?: (newAssignment: AssignmentItem) => void;
  }

  let { open = $bindable(false), onSuccess }: Props = $props();

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

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!title || !description || !classId || !dueDateLocal || submitting) return;

    const selectedTime = new Date(dueDateLocal).getTime();
    if (selectedTime <= Date.now()) {
      toastStore.add('Tenggat waktu harus di masa mendatang', 'danger');
      return;
    }

    submitting = true;
    try {
      const utcDueDate = localToUtcIso(dueDateLocal);
      const created = await createAssignmentApi({
        class_id: classId,
        title,
        description,
        type,
        group_submission_mode: type === 'group' ? groupSubmissionMode : undefined,
        due_date: utcDueDate,
        max_score: Number(maxScore) || 100,
      });

      toastStore.add(`Tugas "${title}" berhasil dibuat`, 'success');
      title = '';
      description = '';
      dueDateLocal = '';
      maxScore = 100;
      groupSubmissionMode = 'representative';
      open = false;
      if (onSuccess) onSuccess(created);
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal membuat tugas baru', 'danger');
    } finally {
      submitting = false;
    }
  };
</script>

<Modal bind:open title="Buat Tugas Baru" class="max-w-2xl">
  <form onsubmit={handleSubmit} class="flex flex-col gap-4">
    <Input label="Judul Tugas" required={true} bind:value={title} placeholder="Contoh: Modul 1 Web Design" />

    <Textarea label="Deskripsi & Petunjuk Tugas" required={true} bind:value={description} rows={3} placeholder="Tuliskan petunjuk pengerjaan tugas..." />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select label="Pilih Kelas" options={classOptions} bind:value={classId} disabled={loadingClasses} />
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

    <div class="flex items-center justify-end gap-3 pt-4 border-t-2 border-black bg-base mt-2 shrink-0">
      <Button type="button" variant="surface" onclick={() => (open = false)}>Batal</Button>
      <Button type="submit" variant="primary" loading={submitting} disabled={!title || !description || !classId || !dueDateLocal}>
        Simpan Tugas
      </Button>
    </div>
  </form>
</Modal>
