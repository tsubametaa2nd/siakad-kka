<script lang="ts">
  import { BarChart3, ArrowRight } from 'lucide-svelte';
  import { getGradingSummaryApi, type ClassGradingSummary } from '../../lib/api/grading';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import PanelSinkron from '../../lib/components/nilai/PanelSinkron.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Badge from '../../lib/components/ui/Badge.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import EmptyState from '../../lib/components/ui/EmptyState.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';

  let summaryList = $state<ClassGradingSummary[]>([]);
  let loading = $state(true);
  let error = $state('');

  const breadcrumbs = [
    { label: 'Beranda Guru', href: '/guru' },
    { label: 'Penilaian Guru' },
  ];

  $effect(() => {
    loadSummary();
  });

  const loadSummary = async () => {
    loading = true;
    error = '';
    try {
      summaryList = await getGradingSummaryApi();
    } catch (err: any) {
      error = err.message || 'Gagal memuat ringkasan penilaian';
    } finally {
      loading = false;
    }
  };
</script>

<AppShell title="Pusat Penilaian Guru & Sinkronisasi" {breadcrumbs}>
  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Skeleton height="h-32" />
      <Skeleton height="h-32" />
    </div>
  {:else if error}
    <Alert tone="danger" title="Gagal Memuat Ringkasan" message={error} onretry={loadSummary} />
  {:else if summaryList.length === 0}
    <EmptyState icon={BarChart3} title="Belum Ada Kelas" description="Belum ada data kelas yang terdaftar." />
  {:else}
    <div class="flex flex-col gap-8">
      {#each summaryList as item (item.class_id)}
        <div class="border-[3px] border-black bg-white p-5 shadow-brutal flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
            <div>
              <h3 class="font-display font-black text-xl uppercase tracking-wide">{item.class_name}</h3>
              <span class="font-mono text-xs font-bold text-gray-700">
                {item.total_assignments} Tugas · {item.ungraded_submissions} Pengumpulan Belum Dinilai
              </span>
            </div>
            <div class="flex items-center gap-2">
              <Badge tone={item.ungraded_submissions > 0 ? 'warning' : 'info'}>
                {item.ungraded_submissions > 0 ? `${item.ungraded_submissions} Perlu Dinilai` : 'Semua Dinilai'}
              </Badge>
              <Button variant="primary" size="sm" onclick={() => (window.location.hash = `#/guru/tugas`)}>
                <span class="flex items-center gap-1">Lihat Tugas Kelas <ArrowRight size={14} /></span>
              </Button>
            </div>
          </div>

          <PanelSinkron
            classId={item.class_id}
            className={item.class_name}
            spreadsheetId={item.spreadsheet_id}
            pendingCount={item.pending_sync_count}
            onsynced={loadSummary}
          />
        </div>
      {/each}
    </div>
  {/if}
</AppShell>
