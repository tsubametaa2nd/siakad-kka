<script lang="ts">
  import { Settings, FileEdit, Clock, Calendar, Check } from 'lucide-svelte';
  import { updateQuizApi, type QuizItem } from '../../api/quiz';
  import { toastStore } from '../../stores/toast.svelte';
  import { localToUtcIso, utcIsoToLocalDatetime } from '../../utils/date';
  import Button from '../ui/Button.svelte';
  import Input from '../ui/Input.svelte';
  import Modal from '../ui/Modal.svelte';

  interface Props {
    open?: boolean;
    quiz: QuizItem | null;
    onSuccess?: (updatedQuiz?: QuizItem) => void;
  }

  let { open = $bindable(false), quiz, onSuccess }: Props = $props();

  let editTitle = $state('');
  let editDuration = $state(30);
  let editDueDateLocal = $state('');
  let submitting = $state(false);

  $effect(() => {
    if (open && quiz) {
      editTitle = quiz.title || '';
      editDuration = quiz.duration_minutes || 30;
      editDueDateLocal = quiz.due_date ? utcIsoToLocalDatetime(quiz.due_date) : '';
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!quiz || !editTitle.trim() || submitting) return;

    if (editDuration < 1) {
      toastStore.add('Durasi pengerjaan minimal 1 menit', 'danger');
      return;
    }

    if (!editDueDateLocal) {
      toastStore.add('Tenggat waktu wajib diisi', 'danger');
      return;
    }

    submitting = true;
    try {
      const utcDueDate = localToUtcIso(editDueDateLocal);
      const updated = await updateQuizApi(quiz.id, {
        title: editTitle.trim(),
        duration_minutes: Number(editDuration),
        due_date: utcDueDate,
      });

      toastStore.add(`Pengaturan quiz "${editTitle.trim()}" berhasil disimpan!`, 'success');
      if (onSuccess) onSuccess(updated);
      open = false;
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal menyimpan pengaturan quiz', 'danger');
    } finally {
      submitting = false;
    }
  };

  const goToFullEditor = () => {
    if (!quiz) return;
    open = false;
    window.location.hash = `#/guru/quiz/${quiz.id}/edit`;
  };
</script>

<Modal bind:open title="Pengaturan Quiz" class="max-w-lg">
  {#if quiz}
    <form onsubmit={handleSubmit} class="flex flex-col gap-4">
      <div class="bg-amber-100 border-2 border-black p-3 text-xs font-mono font-medium flex items-center justify-between">
        <span class="truncate">ID Quiz: <strong>{quiz.id}</strong></span>
        <span class="shrink-0">{quiz.question_count} Soal Tersimpan</span>
      </div>

      <Input
        label="Nama / Judul Quiz"
        required={true}
        bind:value={editTitle}
        placeholder="Contoh: Quiz Bab 1 Akuntansi Keuangan"
      />

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Durasi Pengerjaan (Menit)"
          type="number"
          required={true}
          bind:value={editDuration}
          min="1"
        />
        <Input
          label="Tenggat Waktu Ditutup (WIB)"
          type="datetime-local"
          required={true}
          bind:value={editDueDateLocal}
        />
      </div>

      <div class="border-t-2 border-dashed border-black/30 pt-3 mt-1 flex items-center justify-between">
        <div class="text-xs font-body text-gray-700">
          Perlu mengubah atau menambah butir pertanyaan?
        </div>
        <Button
          type="button"
          variant="surface"
          size="sm"
          onclick={goToFullEditor}
          class="flex items-center gap-1.5 font-bold"
        >
          <FileEdit size={14} />
          <span>Edit Butir Soal</span>
        </Button>
      </div>

      <div class="flex items-center justify-end gap-3 pt-4 border-t-2 border-black bg-base mt-2 shrink-0">
        <Button
          type="button"
          variant="surface"
          size="md"
          disabled={submitting}
          onclick={() => (open = false)}
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={submitting}
          disabled={!editTitle.trim() || !editDueDateLocal}
        >
          Simpan Pengaturan
        </Button>
      </div>
    </form>
  {/if}
</Modal>
