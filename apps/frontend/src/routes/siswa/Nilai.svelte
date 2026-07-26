<script lang="ts">
  import { BarChart3 } from 'lucide-svelte';
  import { getStudentGradesApi, type StudentGradeItem } from '../../lib/api/grading';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Card from '../../lib/components/ui/Card.svelte';
  import EmptyState from '../../lib/components/ui/EmptyState.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import { formatDateTimeWIB } from '../../lib/utils/date';

  let grades = $state<StudentGradeItem[]>([]);
  let loading = $state(true);
  let error = $state('');

  const breadcrumbs = [
    { label: 'Beranda Siswa', href: '/siswa' },
    { label: 'Daftar Nilai Saya', href: '/siswa/nilai' },
  ];

  $effect(() => {
    loadGrades();
  });

  const loadGrades = async () => {
    loading = true;
    error = '';
    try {
      grades = await getStudentGradesApi();
    } catch (err: any) {
      error = err.message || 'Gagal memuat daftar nilai';
    } finally {
      loading = false;
    }
  };
</script>

<AppShell title="Daftar Nilai Saya" {breadcrumbs}>
  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Skeleton height="h-44" />
      <Skeleton height="h-44" />
    </div>
  {:else if error}
    <Alert tone="danger" title="Gagal Memuat Nilai" message={error} onretry={loadGrades} />
  {:else if grades.length === 0}
    <EmptyState icon={BarChart3} title="Belum Ada Nilai" description="Belum ada tugas atau quiz yang dinilai oleh guru Anda." />
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#each grades as item (item.assignment_id + item.graded_at)}
        <Card tone="surface" class="border-[3px] border-black shadow-brutal flex flex-col justify-between gap-4">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3 border-b-2 border-black pb-2">
              <span class="font-body text-xs font-bold text-gray-800">{item.class_name}</span>
              <span class="font-mono text-xs font-bold text-gray-700">Dinilai: {formatDateTimeWIB(item.graded_at)}</span>
            </div>

            <h3 class="font-display font-black text-xl uppercase tracking-wide mb-3">{item.assignment_title}</h3>

            <div class="bg-primary p-4 border-[3px] border-black shadow-brutal-sm flex items-center justify-between my-2">
              <span class="font-display font-black text-xs uppercase text-black">Nilai Akhir:</span>
              <div class="font-mono font-black text-2xl text-black">
                {item.score} <span class="text-sm font-bold text-gray-800">/ {item.max_score}</span>
              </div>
            </div>

            {#if item.feedback}
              <div class="bg-white p-3 border-2 border-black mt-3">
                <span class="font-display font-black text-xs uppercase block mb-1">Catatan Guru:</span>
                <p class="font-body text-xs font-bold text-gray-800 italic">{item.feedback}</p>
              </div>
            {/if}
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</AppShell>
