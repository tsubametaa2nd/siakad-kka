<script lang="ts">
  import { FileText } from 'lucide-svelte';
  import { deleteAssignmentApi, getTeacherAssignmentsApi, type AssignmentItem } from '../../lib/api/assignments';
  import { getTeacherClassesApi, type ClassItem } from '../../lib/api/classes';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import BuatTugasModal from '../../lib/components/tugas/BuatTugasModal.svelte';
  import TugasCard from '../../lib/components/tugas/TugasCard.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import ConfirmDialog from '../../lib/components/ui/ConfirmDialog.svelte';
  import EmptyState from '../../lib/components/ui/EmptyState.svelte';
  import Select from '../../lib/components/ui/Select.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import { toastStore } from '../../lib/stores/toast.svelte';

  let assignments = $state<AssignmentItem[]>([]);
  let teacherClasses = $state<ClassItem[]>([]);
  let selectedClassId = $state<string>('');

  let loadingClasses = $state(true);
  let loadingAssignments = $state(true);
  let error = $state('');

  let showCreateModal = $state(false);
  let targetAssignment = $state<AssignmentItem | null>(null);
  let showDeleteConfirm = $state(false);
  let showForceDeleteConfirm = $state(false);
  let actionLoading = $state(false);

  const breadcrumbs = [
    { label: 'Beranda Guru', href: '/guru' },
    { label: 'Daftar Tugas', href: '/guru/tugas' },
  ];

  const classFilterOptions = $derived([
    { value: '', label: 'Semua Kelas' },
    ...teacherClasses.map((c) => ({ value: c.id, label: `${c.name} (${c.level})` })),
  ]);

  $effect(() => {
    loadClasses();
  });

  const loadClasses = async () => {
    loadingClasses = true;
    try {
      teacherClasses = await getTeacherClassesApi();
      await loadAssignments(selectedClassId);
    } catch (err: any) {
      error = err.message || 'Gagal memuat kelas';
      loadingAssignments = false;
    } finally {
      loadingClasses = false;
    }
  };

  const loadAssignments = async (classId?: string) => {
    loadingAssignments = true;
    error = '';
    try {
      assignments = await getTeacherAssignmentsApi(classId || undefined);
    } catch (err: any) {
      error = err.message || 'Gagal memuat daftar tugas';
    } finally {
      loadingAssignments = false;
    }
  };

  const handleClassFilterChange = (e: Event) => {
    const val = (e.target as HTMLSelectElement).value;
    selectedClassId = val;
    loadAssignments(val);
  };

  const promptDeleteAssignment = (id: string) => {
    const found = assignments.find((a) => a.id === id);
    if (found) {
      targetAssignment = found;
      showDeleteConfirm = true;
    }
  };

  const handleDeleteAssignment = async (force = false) => {
    if (!targetAssignment) return;
    actionLoading = true;
    try {
      await deleteAssignmentApi(targetAssignment.id, force);
      toastStore.add(`Tugas "${targetAssignment.title}" berhasil dihapus`, 'success');
      showDeleteConfirm = false;
      showForceDeleteConfirm = false;
      targetAssignment = null;
      await loadAssignments(selectedClassId);
    } catch (err: any) {
      if (!force && err.status === 409) {
        showDeleteConfirm = false;
        showForceDeleteConfirm = true;
      } else {
        toastStore.add(err.message || 'Gagal menghapus tugas', 'danger');
      }
    } finally {
      actionLoading = false;
    }
  };
</script>

<AppShell title="Daftar Tugas Guru" {breadcrumbs}>
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
    <div class="w-full sm:max-w-xs">
      <Select label="Saring Kelas" options={classFilterOptions} bind:value={selectedClassId} onchange={handleClassFilterChange} disabled={loadingClasses} />
    </div>
    <Button variant="primary" onclick={() => showCreateModal = true}>
      + Buat Tugas
    </Button>
  </div>

  {#if loadingAssignments}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Skeleton height="h-44" />
      <Skeleton height="h-44" />
      <Skeleton height="h-44" />
    </div>
  {:else if error}
    <Alert tone="danger" title="Gagal Memuat Tugas" message={error} onretry={() => loadAssignments(selectedClassId)} />
  {:else if assignments.length === 0}
    <EmptyState icon={FileText} title="Belum Ada Tugas" description="Belum ada tugas yang dibuat untuk kelas ini. Klik '+ Buat Tugas' untuk membuat tugas baru.">
      {#snippet action()}
        <Button variant="primary" onclick={() => showCreateModal = true}>+ Buat Tugas Pertama</Button>
      {/snippet}
    </EmptyState>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each assignments as item (item.id)}
        <TugasCard {item} isTeacher={true} ondelete={promptDeleteAssignment} />
      {/each}
    </div>
  {/if}
</AppShell>

<BuatTugasModal bind:open={showCreateModal} onSuccess={() => loadAssignments(selectedClassId)} />

<ConfirmDialog
  bind:open={showDeleteConfirm}
  title="Hapus Tugas?"
  message={`Apakah Anda yakin ingin menghapus tugas "${targetAssignment?.title || ''}"?`}
  confirmText="Hapus Tugas"
  cancelText="Batal"
  loading={actionLoading}
  onconfirm={() => handleDeleteAssignment(false)}
/>

<ConfirmDialog
  bind:open={showForceDeleteConfirm}
  title="HAPUS PAKSA TUGAS?"
  message={`Tugas "${targetAssignment?.title || ''}" sudah memiliki pengumpulan dari siswa. Jika dihapus paksa, seluruh berkas & nilai siswa pada tugas ini akan HILANG PERMANEN!`}
  confirmText="Hapus Paksa Permanen"
  cancelText="Batal"
  loading={actionLoading}
  onconfirm={() => handleDeleteAssignment(true)}
/>
