<script lang="ts">
  import { BookOpen, ArrowRight } from 'lucide-svelte';
  import { getStudentMaterialsApi, type MaterialItem } from '../../lib/api/materials';
  import { getStudentClassesApi, type ClassItem } from '../../lib/api/classes';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import EmptyState from '../../lib/components/ui/EmptyState.svelte';
  import Select from '../../lib/components/ui/Select.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import { formatDateTimeWIB } from '../../lib/utils/date';

  let materials = $state<MaterialItem[]>([]);
  let classes = $state<ClassItem[]>([]);
  let selectedClassId = $state('all');
  let loadingClasses = $state(true);
  let loadingMaterials = $state(true);
  let error = $state('');

  const breadcrumbs = [
    { label: 'Beranda Siswa', href: '/siswa' },
    { label: 'Materi Saya', href: '/siswa/materi' },
  ];

  $effect(() => {
    loadClasses();
  });

  const loadClasses = async () => {
    try {
      loadingClasses = true;
      classes = await getStudentClassesApi();
    } catch {
      // Abaikan error kelas, biarkan filter 'Semua Kelas'
    } finally {
      loadingClasses = false;
      loadMaterials('all');
    }
  };

  const loadMaterials = async (classId: string) => {
    try {
      loadingMaterials = true;
      error = '';
      const filterId = classId === 'all' ? undefined : classId;
      materials = await getStudentMaterialsApi(filterId);
    } catch (err: unknown) {
      error = (err as Error).message || 'Gagal memuat daftar materi';
    } finally {
      loadingMaterials = false;
    }
  };

  let selectedMaterialTitle = $state('');

  const classOptions = $derived([
    { value: 'all', label: 'Semua Kelas' },
    ...classes.map((c) => ({ value: c.id, label: c.name }))
  ]);

  const materialFilterOptions = $derived([
    { value: '', label: 'Semua Materi' },
    ...Array.from(new Set(materials.map((m) => m.title))).map((title) => ({
      value: title,
      label: title,
    })),
  ]);

  const filteredMaterials = $derived(
    selectedMaterialTitle
      ? materials.filter((m) => m.title === selectedMaterialTitle)
      : materials
  );

  const handleClassChange = (newVal: string) => {
    selectedClassId = newVal;
    selectedMaterialTitle = '';
    loadMaterials(newVal);
  };
</script>

<AppShell title="Materi Saya" {breadcrumbs}>
  <div class="flex flex-col sm:flex-row items-center gap-4 mb-6">
    <div class="w-full sm:w-64">
      <Select
        label="Saring Kelas"
        options={classOptions}
        bind:value={selectedClassId}
        disabled={loadingClasses}
        onchange={(e: Event) => handleClassChange((e.target as HTMLSelectElement).value)}
      />
    </div>
    <div class="w-full sm:w-64">
      <Select
        label="Saring Materi"
        options={materialFilterOptions}
        bind:value={selectedMaterialTitle}
        disabled={loadingMaterials || materials.length === 0}
      />
    </div>
  </div>

  {#if loadingMaterials}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Skeleton height="h-36" />
      <Skeleton height="h-36" />
    </div>
  {:else if error}
    <Alert tone="danger" title="Gagal Memuat Materi" message={error} onretry={() => loadMaterials(selectedClassId)} />
  {:else if materials.length === 0}
    <EmptyState icon={BookOpen} title="Belum Ada Materi" description="Belum ada materi yang tersedia saat ini." />
  {:else if filteredMaterials.length === 0}
    <EmptyState icon={BookOpen} title="Materi Tidak Ditemukan" description="Tidak ada materi yang sesuai dengan saringan yang dipilih.">
      {#snippet action()}
        <Button variant="surface" onclick={() => (selectedMaterialTitle = '')}>Tampilkan Semua Materi</Button>
      {/snippet}
    </EmptyState>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredMaterials as material, i (material.id || i)}
        <div class="border-[3px] border-black bg-surface text-black p-5 shadow-brutal flex flex-col justify-between gap-4">
          <div>
            <div class="font-body text-xs font-bold text-gray-700 mb-2">{material.class_name || '—'}</div>
            <h3 class="font-display font-black text-lg uppercase tracking-wide text-black mb-2 line-clamp-2">{material.title}</h3>
            <div class="font-mono text-xs font-bold text-gray-600">
              {material.block_count ?? 0} blok · {formatDateTimeWIB(material.updated_at)}
            </div>
          </div>
          <div class="border-t-2 border-black pt-3">
            <Button
              variant="primary"
              size="sm"
              onclick={() => (window.location.hash = `#/materi/${material.slug || material.id}`)}
            >
              <span class="flex items-center gap-1">Baca Materi <ArrowRight size={14} /></span>
            </Button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</AppShell>
