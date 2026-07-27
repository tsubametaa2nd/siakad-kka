<script lang="ts">
  import { ChevronLeft, ChevronRight, Link, ExternalLink, Save } from 'lucide-svelte';
  import {
    getAssignmentGradingApi,
    gradeStudentApi,
    type AssignmentGradingResponse,
    type SubmissionGradingRow,
  } from '../../lib/api/grading';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import PratinjauBerkas from '../../lib/components/nilai/PratinjauBerkas.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Badge from '../../lib/components/ui/Badge.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import Card from '../../lib/components/ui/Card.svelte';
  import Input from '../../lib/components/ui/Input.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import Textarea from '../../lib/components/ui/Textarea.svelte';
  import { toastStore } from '../../lib/stores/toast.svelte';

  interface Props {
    params?: { id?: string };
  }

  let { params = {} }: Props = $props();
  const assignmentId = $derived(params.id || '');

  let data = $state<AssignmentGradingResponse | null>(null);
  let currentIndex = $state(0);
  let filterUngraded = $state(false);
  let loading = $state(true);
  let submitting = $state(false);
  let error = $state('');
  let initialStudentIdSelected = $state(false);

  let scoreInput = $state<string | number>('');
  let feedbackInput = $state('');
  let syncStatus = $state<{ synced: boolean } | null>(null);

  const breadcrumbs = $derived([
    { label: 'Beranda Guru', href: '/guru' },
    { label: 'Daftar Tugas', href: '/guru/tugas' },
    { label: data?.assignment.title || 'Penilaian', href: `/guru/tugas/${assignmentId}/nilai` },
  ]);

  const filteredSubmissions = $derived(
    data?.submissions.filter((s) => (filterUngraded ? s.status !== 'Dinilai' : true)) || []
  );

  const currentSub = $derived(filteredSubmissions[currentIndex] as SubmissionGradingRow | undefined);
  const maxScore = $derived(data?.assignment.max_score || 100);

  $effect(() => {
    if (assignmentId) loadGradingData();
  });

  $effect(() => {
    if (data && filteredSubmissions.length > 0 && !initialStudentIdSelected) {
      const hash = window.location.hash;
      const qIndex = hash.indexOf('?');
      if (qIndex !== -1) {
        const params = new URLSearchParams(hash.slice(qIndex + 1));
        const targetSid = params.get('studentId') || params.get('student_id');
        if (targetSid) {
          const idx = filteredSubmissions.findIndex((s) => s.student_id === targetSid);
          if (idx !== -1) {
            currentIndex = idx;
          }
        }
      }
      initialStudentIdSelected = true;
    }
  });

  $effect(() => {
    if (currentSub) {
      scoreInput = currentSub.score !== undefined && currentSub.score !== null ? currentSub.score : '';
      feedbackInput = currentSub.feedback || '';
      syncStatus = currentSub.syncedToSheet !== undefined ? { synced: currentSub.syncedToSheet } : null;
    }
  });

  const loadGradingData = async () => {
    loading = true;
    error = '';
    try {
      data = await getAssignmentGradingApi(assignmentId);
    } catch (err: any) {
      error = err.message || 'Gagal memuat data penilaian tugas';
    } finally {
      loading = false;
    }
  };

  const focusScoreInput = () => {
    setTimeout(() => {
      const inputEl = document.getElementById('score-input-field');
      if (inputEl) (inputEl as HTMLInputElement).focus();
    }, 50);
  };

  const handleSaveAndNext = async (e?: Event) => {
    if (e) e.preventDefault();
    if (!currentSub || !data || submitting) return;

    const numScore = Number(scoreInput);
    if (scoreInput === '' || isNaN(numScore)) {
      toastStore.add('Masukkan nilai numerik yang valid', 'danger');
      return;
    }

    if (numScore < 0 || numScore > maxScore) {
      toastStore.add(`Nilai harus di antara 0 sampai ${maxScore} (sesuai batas tugas ini)`, 'danger');
      return;
    }

    submitting = true;
    try {
      const res = await gradeStudentApi({
        assignment_id: data.assignment.id,
        student_id: currentSub.student_id,
        submission_id: currentSub.submission_id,
        score: numScore,
        feedback: feedbackInput.trim() || undefined,
      });

      syncStatus = { synced: res.syncedToSheet };

      const targetIdx = data.submissions.findIndex((s) => s.student_id === currentSub.student_id);
      if (targetIdx !== -1) {
        data.submissions[targetIdx] = {
          ...data.submissions[targetIdx],
          score: numScore,
          feedback: feedbackInput.trim(),
          status: 'Dinilai',
          syncedToSheet: res.syncedToSheet,
        };
      }

      toastStore.add(
        res.syncedToSheet
          ? `Nilai ${currentSub.student_name} tersimpan dan tersinkron`
          : `Nilai ${currentSub.student_name} tersimpan (menunggu sinkron)`,
        'success'
      );

      if (currentIndex < filteredSubmissions.length - 1) {
        currentIndex += 1;
        focusScoreInput();
      }
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal menyimpan nilai', 'danger');
    } finally {
      submitting = false;
    }
  };
</script>

<AppShell title={data?.assignment.title ? `Penilaian: ${data.assignment.title}` : 'Penilaian Tugas'} {breadcrumbs}>
  {#if loading}
    <Skeleton height="h-96" />
  {:else if error}
    <Alert tone="danger" title="Gagal Memuat Halaman Penilaian" message={error} onretry={loadGradingData} />
  {:else if data && filteredSubmissions.length === 0}
    <Alert tone="info" title="Tidak Ada Data" message="Tidak ada pengumpulan siswa yang memenuhi kriteria filter." />
  {:else if data && currentSub}
    <div class="flex flex-col gap-4">
      <div class="border-[3px] border-black bg-surface p-4 shadow-brutal flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <Button variant="surface" size="sm" disabled={currentIndex === 0} onclick={() => { currentIndex -= 1; focusScoreInput(); }}>
            <span class="flex items-center gap-1"><ChevronLeft size={16} /> Siswa Sebelum</span>
          </Button>
          <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span class="font-display font-black text-sm uppercase bg-yellow-200 px-2 py-0.5 border border-black">
              Siswa {currentIndex + 1} dari {filteredSubmissions.length}
            </span>
            <span class="font-display font-black text-base uppercase text-black">
              {currentSub.student_name} {#if currentSub.identifier}<span class="font-mono text-xs text-gray-700">({currentSub.identifier})</span>{/if}
            </span>
          </div>
          <Button variant="surface" size="sm" disabled={currentIndex === filteredSubmissions.length - 1} onclick={() => { currentIndex += 1; focusScoreInput(); }}>
            <span class="flex items-center gap-1">Siswa Berikut <ChevronRight size={16} /></span>
          </Button>
        </div>
        <Badge tone={currentSub.status === 'Dinilai' ? 'warning' : currentSub.status === 'Sudah' ? 'info' : currentSub.status === 'Telat' ? 'danger' : 'neutral'}>
          {currentSub.status === 'Dinilai' ? `Sudah Dinilai (${currentSub.score})` : currentSub.status}
        </Badge>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div class="xl:col-span-7 flex flex-col gap-4">
          {#if currentSub.content}
            <Card tone="surface" class="border-[3px] border-black p-4 bg-yellow-50 shadow-brutal">
              <div class="flex items-center justify-between border-b-2 border-black pb-2 mb-2">
                <span class="font-display font-black text-sm uppercase text-black">💬 Teks Jawaban / Catatan Siswa:</span>
                {#if currentSub.submitted_at}
                  <span class="font-mono text-xs text-gray-600 font-bold">{new Date(currentSub.submitted_at).toLocaleString('id-ID')}</span>
                {/if}
              </div>
              <div class="font-body text-sm whitespace-pre-line text-black bg-white p-4 border-2 border-black leading-relaxed">
                {currentSub.content}
              </div>
            </Card>
          {/if}

          {#if currentSub.files && currentSub.files.length > 0}
            <PratinjauBerkas files={currentSub.files} />
          {:else if !currentSub.content && (!currentSub.links || currentSub.links.length === 0)}
            <Card tone="surface" class="border-[3px] border-black p-8 text-center bg-blue-50 shadow-brutal">
              <span class="font-display font-black text-base uppercase text-gray-700 block mb-1">
                Belum Ada Pengumpulan
              </span>
              <span class="font-body text-xs italic text-gray-600">
                Siswa ini belum mengirimkan jawaban dalam bentuk berkas maupun teks.
              </span>
            </Card>
          {/if}

          {#if currentSub.links && currentSub.links.length > 0}
            <Card tone="base" class="border-2 border-black p-3">
              <span class="font-display font-black text-xs uppercase block mb-1">Tautan Ditambahkan Siswa:</span>
              <div class="flex flex-col gap-1">
                {#each currentSub.links as linkItem}
                  <a href={linkItem} target="_blank" rel="noopener" class="font-mono text-xs text-blue-900 underline truncate flex items-center gap-1">
                    <Link size={13} class="shrink-0" />
                    <span class="truncate">{linkItem}</span>
                    <ExternalLink size={12} class="shrink-0" />
                  </a>
                {/each}
              </div>
            </Card>
          {/if}
        </div>

        <div class="xl:col-span-5 flex flex-col gap-4">
          <Card tone="surface" class="border-[3px] border-black shadow-brutal p-5 flex flex-col gap-4">
            <div class="flex items-center justify-between border-b-2 border-black pb-3">
              <h3 class="font-display font-black text-lg uppercase tracking-wide">Form Penilaian</h3>
              <span class="font-mono text-xs font-bold bg-yellow-200 px-2 py-1 border border-black">
                Maksimal: {maxScore}
              </span>
            </div>

            <form onsubmit={handleSaveAndNext} class="flex flex-col gap-4">
              <Input
                id="score-input-field"
                label={`Input Nilai (0 - ${maxScore})`}
                type="number"
                required={true}
                bind:value={scoreInput}
                placeholder={`0 - ${maxScore}`}
                class="font-mono text-xl font-black"
              />

              <Textarea
                label="Catatan Guru / Feedback (opsional)"
                bind:value={feedbackInput}
                rows={4}
                placeholder="Tuliskan umpan balik atau saran perbaikan..."
              />

              <div class="border-t-2 border-black pt-3 flex flex-col gap-2">
                <Button type="submit" variant="primary" loading={submitting} class="w-full">
                  <span class="flex items-center justify-center gap-1.5"><Save size={16} /> Simpan & Berikutnya (Enter)</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  {/if}
</AppShell>
