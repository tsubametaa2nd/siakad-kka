<script lang="ts">
  import { createQuizApi, updateQuizApi, getQuizDetailApi, type QuestionDraft } from '../../lib/api/quiz';
  import { getTeacherClassesApi, type ClassItem } from '../../lib/api/classes';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import EditorSoal from '../../lib/components/quiz/EditorSoal.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import Card from '../../lib/components/ui/Card.svelte';
  import Input from '../../lib/components/ui/Input.svelte';
  import Select from '../../lib/components/ui/Select.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import { toastStore } from '../../lib/stores/toast.svelte';
  import { localToUtcIso, utcIsoToLocalDatetime } from '../../lib/utils/date';

  interface Props {
    params?: { id?: string };
  }

  let { params = {} }: Props = $props();
  const editQuizId = $derived(params.id || '');
  const isEditMode = $derived(!!editQuizId);

  let title = $state('');
  let classId = $state('');
  let durationMinutes = $state(30);
  let dueDateLocal = $state('');
  let questions = $state<QuestionDraft[]>([
    { question: '', options: ['', ''], answer_index: 0, weight: 1 },
  ]);

  let teacherClasses = $state<ClassItem[]>([]);
  let loadingClasses = $state(true);
  let loadingQuiz = $state(false);
  let invalidIndices = $state<number[]>([]);
  let submitting = $state(false);

  const breadcrumbs = $derived([
    { label: 'Beranda Guru', href: '/guru' },
    { label: 'Daftar Quiz', href: '/guru/quiz' },
    {
      label: isEditMode ? `Edit Quiz: ${title || '...'}` : 'Penyusun Quiz Baru',
      href: isEditMode ? `#/guru/quiz/${editQuizId}/edit` : '/guru/quiz/buat',
    },
  ]);

  const classOptions = $derived(
    teacherClasses.map((c) => ({ value: c.id, label: `${c.name} (${c.level})` }))
  );

  const totalWeight = $derived(questions.reduce((acc, q) => acc + (Number(q.weight) || 1), 0));

  $effect(() => {
    loadClasses();
  });

  $effect(() => {
    if (editQuizId) {
      loadQuizToEdit(editQuizId);
    }
  });

  const loadClasses = async () => {
    loadingClasses = true;
    try {
      teacherClasses = await getTeacherClassesApi();
      if (teacherClasses.length > 0 && !classId && !isEditMode) {
        classId = teacherClasses[0].id;
      }
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal memuat kelas', 'danger');
    } finally {
      loadingClasses = false;
    }
  };

  const loadQuizToEdit = async (id: string) => {
    loadingQuiz = true;
    try {
      const q = await getQuizDetailApi(id);
      title = q.title || '';
      classId = q.classId || '';
      durationMinutes = q.timeLimitMinutes ?? q.duration_minutes ?? 30;
      dueDateLocal = (q.deadline || q.due_date) ? utcIsoToLocalDatetime(q.deadline || q.due_date) : '';
      if (Array.isArray(q.questions) && q.questions.length > 0) {
        questions = q.questions.map((item: any) => ({
          question: item.text || item.question || '',
          options: Array.isArray(item.options) ? item.options : ['', ''],
          answer_index: item.answer !== undefined ? item.answer : (item.answer_index ?? 0),
          weight: item.points !== undefined ? Number(item.points) : (Number(item.weight) || 1),
        }));
      }
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal memuat data quiz untuk diedit', 'danger');
    } finally {
      loadingQuiz = false;
    }
  };

  const addQuestion = () => {
    questions = [...questions, { question: '', options: ['', ''], answer_index: 0, weight: 1 }];
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toastStore.add('Quiz minimal harus memiliki 1 soal', 'danger');
      return;
    }
    questions = questions.filter((_, i) => i !== index);
  };

  const validateQuiz = (): boolean => {
    const invalid: number[] = [];
    if (questions.length === 0) return false;

    questions.forEach((q, idx) => {
      const qTextValid = q.question.trim().length > 0;
      const validOpts = q.options.filter((o) => o.trim().length > 0);
      const optsValid = validOpts.length >= 2;
      const keyValid = q.answer_index >= 0 && q.answer_index < q.options.length;
      const weightValid = Number(q.weight) >= 1;

      if (!qTextValid || !optsValid || !keyValid || !weightValid) {
        invalid.push(idx);
      }
    });

    invalidIndices = invalid;
    return invalid.length === 0;
  };

  const handleSaveQuiz = async (e: Event) => {
    e.preventDefault();
    if (!title.trim() || !classId || !dueDateLocal || submitting) return;

    if (!validateQuiz()) {
      toastStore.add('Mohon lengkapi soal & kunci jawaban yang ditandai merah', 'danger');
      return;
    }

    submitting = true;
    try {
      const utcDueDate = localToUtcIso(dueDateLocal);
      const formattedQuestions = questions.map((q) => ({
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        answer_index: q.answer_index,
        weight: Number(q.weight) || 1,
      }));

      if (isEditMode) {
        await updateQuizApi(editQuizId, {
          title: title.trim(),
          duration_minutes: Number(durationMinutes) || 30,
          due_date: utcDueDate,
          questions: formattedQuestions,
        });
        toastStore.add(`Perubahan quiz "${title}" berhasil disimpan`, 'success');
      } else {
        if (new Date(dueDateLocal).getTime() <= Date.now()) {
          toastStore.add('Tenggat waktu quiz harus di masa mendatang', 'danger');
          submitting = false;
          return;
        }

        await createQuizApi({
          class_id: classId,
          title: title.trim(),
          duration_minutes: Number(durationMinutes) || 30,
          due_date: utcDueDate,
          questions: formattedQuestions,
        });
        toastStore.add(`Quiz "${title}" berhasil diterbitkan`, 'success');
      }

      window.location.hash = '#/guru/quiz';
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal menyimpan quiz', 'danger');
    } finally {
      submitting = false;
    }
  };
</script>

<AppShell title={isEditMode ? 'Edit Quiz Guru' : 'Penyusun Quiz Baru'} {breadcrumbs}>
  {#if loadingQuiz}
    <div class="flex flex-col gap-6">
      <Skeleton height="h-48" />
      <Skeleton height="h-64" />
    </div>
  {:else}
    <form onsubmit={handleSaveQuiz} class="flex flex-col gap-6 pb-24">
      <Card tone="surface" class="border-[3px] border-black">
        <h3 class="font-display font-black text-lg uppercase mb-4">
          {isEditMode ? 'Pengaturan & Informasi Quiz' : 'Informasi Utama Quiz'}
        </h3>
        <div class="flex flex-col gap-4">
          <Input label="Judul / Nama Quiz" required={true} bind:value={title} placeholder="Contoh: Quiz Bab 1 Pemrograman Web" />
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Pilih Kelas" options={classOptions} bind:value={classId} disabled={loadingClasses || isEditMode} />
            <Input label="Durasi Pengerjaan (Menit)" type="number" required={true} bind:value={durationMinutes} min="1" />
            <Input label="Tenggat Waktu Ditutup (WIB)" type="datetime-local" required={true} bind:value={dueDateLocal} />
          </div>
        </div>
      </Card>

      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h3 class="font-display font-black text-xl uppercase tracking-wide">Daftar Soal ({questions.length})</h3>
          <Button type="button" variant="surface" onclick={addQuestion}>+ Tambah Soal</Button>
        </div>

        {#each questions as question, idx (idx)}
          <EditorSoal
            index={idx}
            bind:question={questions[idx]}
            hasError={invalidIndices.includes(idx)}
            onremove={() => removeQuestion(idx)}
          />
        {/each}
      </div>

      <div class="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t-[3px] border-black p-3 sm:p-4 shadow-brutal-lg flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div class="font-mono text-xs font-bold text-black flex items-center gap-4">
          <span>Jumlah Soal: <strong>{questions.length}</strong></span>
          <span>Total Bobot: <strong>{totalWeight}</strong></span>
        </div>
        <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          <Button type="button" variant="surface" onclick={() => (window.location.hash = '#/guru/quiz')}>Batal</Button>
          <Button type="submit" variant="primary" loading={submitting} disabled={!title.trim() || !dueDateLocal}>
            {isEditMode ? 'Simpan Perubahan Quiz' : 'Terbit & Simpan Quiz'}
          </Button>
        </div>
      </div>
    </form>
  {/if}
</AppShell>

