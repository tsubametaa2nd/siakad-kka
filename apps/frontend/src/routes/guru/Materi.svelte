<script lang="ts">
  import { BookOpen, Link } from 'lucide-svelte';
  import { getTeacherMaterialsApi, deleteMaterialApi, type MaterialItem } from '../../lib/api/materials';
  import { getTeacherClassesApi, type ClassItem } from '../../lib/api/classes';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import EmptyState from '../../lib/components/ui/EmptyState.svelte';
  import Select from '../../lib/components/ui/Select.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import ConfirmDialog from '../../lib/components/ui/ConfirmDialog.svelte';
  import { toastStore } from '../../lib/stores/toast.svelte';
  import { formatDateTimeWIB } from '../../lib/utils/date';

  let materials = $state<MaterialItem[]>([]);
  let teacherClasses = $state<ClassItem[]>([]);
  let selectedClassId = $state('');
  let selectedMaterialTitle = $state('');
  let loadingMaterials = $state(true);
  let loadingClasses = $state(true);
  let error = $state('');
  let deleteTargetId = $state<string | null>(null);
  let showDeleteConfirm = $state(false);
  let deleting = $state(false);

  const breadcrumbs = [
    { label: 'Beranda Guru', href: '/guru' },
    { label: 'Daftar Materi', href: '/guru/materi' },
  ];

  const classFilterOptions = $derived([
    { value: '', label: 'Semua Kelas' },
    ...teacherClasses.map((c) => ({ value: c.id, label: `${c.name} (${c.level})` })),
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

  $effect(() => {
    loadClasses();
  });

  const loadClasses = async () => {
    loadingClasses = true;
    try {
      teacherClasses = await getTeacherClassesApi();
      await loadMaterials('');
    } catch (err: any) {
      error = err.message || 'Gagal memuat kelas';
    } finally {
      loadingClasses = false;
    }
  };

  const loadMaterials = async (classId: string) => {
    loadingMaterials = true;
    selectedMaterialTitle = '';
    error = '';
    try {
      materials = await getTeacherMaterialsApi(classId || undefined);
    } catch (err: any) {
      error = err.message || 'Gagal memuat daftar materi';
    } finally {
      loadingMaterials = false;
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    deleting = true;
    try {
      await deleteMaterialApi(deleteTargetId);
      toastStore.add('Materi berhasil dihapus', 'success');
      deleteTargetId = null;
      showDeleteConfirm = false;
      await loadMaterials(selectedClassId);
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal menghapus materi', 'danger');
    } finally {
      deleting = false;
    }
  };
</script>

<AppShell title="Daftar Materi" {breadcrumbs}>
  <div class="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6">
    <div class="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
      <div class="w-full sm:w-64">
        <Select
          label="Saring Kelas"
          options={classFilterOptions}
          bind:value={selectedClassId}
          disabled={loadingClasses}
          onchange={(e: Event) => {
            selectedClassId = (e.target as HTMLSelectElement).value;
            loadMaterials(selectedClassId);
          }}
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
    <Button variant="primary" onclick={() => (window.location.hash = '#/guru/materi/buat')}>
      + Buat Materi Baru
    </Button>
  </div>

  {#if loadingMaterials}
    <div class="flex flex-col gap-4">
      <Skeleton height="h-20" />
      <Skeleton height="h-20" />
    </div>
  {:else if error}
    <Alert tone="danger" title="Gagal Memuat" message={error} onretry={() => loadMaterials(selectedClassId)} />
  {:else if materials.length === 0}
    <EmptyState icon={BookOpen} title="Belum Ada Materi" description="Belum ada materi untuk kelas ini. Buat materi baru untuk siswa.">
      {#snippet action()}
        <Button variant="primary" onclick={() => (window.location.hash = '#/guru/materi/buat')}>+ Buat Materi Pertama</Button>
      {/snippet}
    </EmptyState>
  {:else if filteredMaterials.length === 0}
    <EmptyState icon={BookOpen} title="Materi Tidak Ditemukan" description="Tidak ada materi yang sesuai dengan saringan yang dipilih.">
      {#snippet action()}
        <Button variant="surface" onclick={() => (selectedMaterialTitle = '')}>Tampilkan Semua Materi</Button>
      {/snippet}
    </EmptyState>
  {:else}
    <div class="flex flex-col gap-4">
      {#each filteredMaterials as material, i (material.id || i)}
        <div class="border-[3px] border-black bg-white p-4 shadow-brutal flex items-center justify-between gap-4">
          <div class="flex flex-col gap-1">
            <h3 class="font-display font-black text-lg md:text-xl uppercase tracking-wide text-black">{material.title}</h3>
            <div class="font-mono text-xs font-bold text-gray-600">
              {material.class_name || '—'} · {material.block_count ?? 0} blok · Diperbarui: {formatDateTimeWIB(material.updated_at)}
            </div>
            <div class="font-mono text-xs text-blue-700 font-bold mt-0.5 flex items-center gap-1">
              <Link size={13} class="shrink-0" />
              <span>Link URL: <a href={`#/materi/${material.slug || material.id}`} class="underline">#/materi/{material.slug || material.id}</a></span>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <Button variant="accent" size="sm" onclick={() => { deleteTargetId = material.id; showDeleteConfirm = true; }}>Hapus</Button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</AppShell>

<ConfirmDialog
  bind:open={showDeleteConfirm}
  title="Hapus Materi?"
  message="Materi ini akan dihapus permanen beserta seluruh bloknya."
  confirmText="Hapus Materi"
  cancelText="Batal"
  loading={deleting}
  onconfirm={handleDelete}
/>
