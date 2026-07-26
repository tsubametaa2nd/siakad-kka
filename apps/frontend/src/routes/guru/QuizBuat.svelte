<script lang="ts">
  import { createQuizApi, type QuestionDraft } from '../../lib/api/quiz';
  import { getTeacherClassesApi, type ClassItem } from '../../lib/api/classes';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import EditorSoal from '../../lib/components/quiz/EditorSoal.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import Card from '../../lib/components/ui/Card.svelte';
  import Input from '../../lib/components/ui/Input.svelte';
  import Select from '../../lib/components/ui/Select.svelte';
  import { toastStore } from '../../lib/stores/toast.svelte';
  import { localToUtcIso } from '../../lib/utils/date';

  let title = $state('');
  let classId = $state('');
  let durationMinutes = $state(30);
  let dueDateLocal = $state('');
  let questions = $state<QuestionDraft[]>([
    { question: '', options: ['', ''], answer_index: 0, weight: 1 },
  ]);

  let teacherClasses = $state<ClassItem[]>([]);
  let loadingClasses = $state(true);
  let invalidIndices = $state<number[]>([]);
  let submitting = $state(false);

  const breadcrumbs = [
    { label: 'Beranda Guru', href: '/guru' },
    { label: 'Daftar Quiz', href: '/guru/quiz' },
    { label: 'Penyusun Quiz Baru', href: '/guru/quiz/buat' },
  ];

  const classOptions = $derived(
    teacherClasses.map((c) => ({ value: c.id, label: `${c.name} (${c.level})` }))
  );

  const totalWeight = $derived(questions.reduce((acc, q) => acc + (Number(q.weight) || 1), 0));

  $effect(() => {
    loadClasses();
  });

  const loadClasses = async () => {
    loadingClasses = true;
    try {
      teacherClasses = await getTeacherClassesApi();
      if (teacherClasses.length > 0 && !classId) {
        classId = teacherClasses[0].id;
      }
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal memuat kelas', 'danger');
    } finally {
      loadingClasses = false;
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

    if (new Date(dueDateLocal).getTime() <= Date.now()) {
      toastStore.add('Tenggat waktu quiz harus di masa mendatang', 'danger');
      return;
    }

    if (!validateQuiz()) {
      toastStore.add('Mohon lengkapi soal & kunci jawaban yang ditandai merah', 'danger');
      return;
    }

    submitting = true;
    try {
      const utcDueDate = localToUtcIso(dueDateLocal);
      await createQuizApi({
        class_id: classId,
        title: title.trim(),
        duration_minutes: Number(durationMinutes) || 30,
        due_date: utcDueDate,
        questions: questions.map((q) => ({
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()),
          answer_index: q.answer_index,
          weight: Number(q.weight) || 1,
        })),
      });

      toastStore.add(`Quiz "${title}" berhasil diterbitkan`, 'success');
      window.location.hash = '#/guru/quiz';
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal menerbitkan quiz', 'danger');
    } finally {
      submitting = false;
    }
  };
</script>

<AppShell title="Penyusun Quiz Baru" {breadcrumbs}>
  <form onsubmit={handleSaveQuiz} class="flex flex-col gap-6 pb-24">
    <Card tone="surface" class="border-[3px] border-black">
      <h3 class="font-display font-black text-lg uppercase mb-4">Informasi Utama Quiz</h3>
      <div class="flex flex-col gap-4">
        <Input label="Judul Quiz" required={true} bind:value={title} placeholder="Contoh: Quiz Bab 1 Pemrograman Web" />
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Pilih Kelas" options={classOptions} bind:value={classId} disabled={loadingClasses} />
          <Input label="Durasi Pengerjaan (Menit)" type="number" required={true} bind:value={durationMinutes} />
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
          Terbit & Simpan Quiz
        </Button>
      </div>
    </div>
  </form>
</AppShell>
