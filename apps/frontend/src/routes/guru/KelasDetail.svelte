<script lang="ts">
  import { Users, Settings, Search } from 'lucide-svelte';
  import { getClassByIdApi, getClassStudentsApi, updateClassApi, type ClassItem, type StudentProfile } from '../../lib/api/classes';
  import { getGroupsByClassApi, type GroupItem } from '../../lib/api/groups';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import GroupCard from '../../lib/components/kelompok/GroupCard.svelte';
  import TambahSiswaModal from '../../lib/components/kelas/TambahSiswaModal.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Badge from '../../lib/components/ui/Badge.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import Card from '../../lib/components/ui/Card.svelte';
  import EmptyState from '../../lib/components/ui/EmptyState.svelte';
  import Input from '../../lib/components/ui/Input.svelte';
  import Select from '../../lib/components/ui/Select.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import Table from '../../lib/components/ui/Table.svelte';
  import Tabs from '../../lib/components/ui/Tabs.svelte';
  import { toastStore } from '../../lib/stores/toast.svelte';

  interface Props {
    params?: { id?: string };
  }

  let { params = {} }: Props = $props();
  const classId = $derived(params.id || '');

  let classData = $state<ClassItem | null>(null);
  let students = $state<StudentProfile[]>([]);
  let groups = $state<GroupItem[]>([]);

  let activeTab = $state('students');
  let searchQuery = $state('');

  let loadingClass = $state(true);
  let loadingStudents = $state(true);
  let loadingGroups = $state(false);
  let error = $state('');

  let showAddStudentModal = $state(false);

  let editName = $state('');
  let editLevel = $state('');
  let editAcademicYear = $state('');
  let editSpreadsheetId = $state('');
  let editScheduleDay = $state('');
  let editScheduleTime = $state('');
  let editStartTime = $state('');
  let editEndTime = $state('');
  let editRoom = $state('');
  let submittingSettings = $state(false);

  const dayOptions = [
    { value: '', label: 'Belum Ditentukan' },
    { value: 'Senin', label: 'Senin' },
    { value: 'Selasa', label: 'Selasa' },
    { value: 'Rabu', label: 'Rabu' },
    { value: 'Kamis', label: 'Kamis' },
    { value: 'Jumat', label: 'Jumat' },
    { value: 'Sabtu', label: 'Sabtu' },
  ];

  const detailTabs = [
    { id: 'students', label: 'Daftar Siswa', icon: Users },
    { id: 'groups', label: 'Kelompok', icon: Users },
    { id: 'settings', label: 'Pengaturan Kelas', icon: Settings }
  ];

  const breadcrumbs = $derived([
    { label: 'Beranda Guru', href: '/guru' },
    { label: 'Daftar Kelas', href: '/guru/kelas' },
    { label: classData?.name || 'Detail Kelas', href: `/guru/kelas/${classId}` }
  ]);

  $effect(() => {
    if (classId) {
      loadClassData();
      loadStudents();
    }
  });

  $effect(() => {
    if (activeTab === 'groups' && classId && groups.length === 0 && !loadingGroups) {
      loadGroups();
    }
  });

  const loadClassData = async () => {
    loadingClass = true;
    error = '';
    try {
      classData = await getClassByIdApi(classId);
      editName = classData.name;
      editLevel = classData.level;
      editAcademicYear = classData.academicYear;
      editSpreadsheetId = classData.spreadsheetId || '';
      editScheduleDay = classData.scheduleDay || '';
      editScheduleTime = classData.scheduleTime || '';
      editStartTime = classData.startTime || '';
      editEndTime = classData.endTime || '';
      if ((!editStartTime || !editEndTime) && editScheduleTime && editScheduleTime.includes('-')) {
        const parts = editScheduleTime.split('-').map((s) => s.trim().replace('.', ':'));
        if (parts.length === 2) {
          if (!editStartTime) editStartTime = parts[0];
          if (!editEndTime) editEndTime = parts[1];
        }
      }
      editRoom = classData.room || '';
    } catch (err: any) {
      error = err.message || 'Gagal memuat detail kelas';
    } finally {
      loadingClass = false;
    }
  };

  const loadStudents = async () => {
    loadingStudents = true;
    try {
      students = await getClassStudentsApi(classId);
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal memuat siswa', 'danger');
    } finally {
      loadingStudents = false;
    }
  };

  const loadGroups = async () => {
    loadingGroups = true;
    try {
      groups = await getGroupsByClassApi(classId);
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal memuat kelompok kelas', 'danger');
    } finally {
      loadingGroups = false;
    }
  };

  const handleSaveSettings = async (e: Event) => {
    e.preventDefault();
    submittingSettings = true;
    try {
      const computedScheduleTime = (editStartTime && editEndTime) ? `${editStartTime} - ${editEndTime}` : editScheduleTime;
      await updateClassApi(classId, {
        name: editName,
        level: editLevel,
        academicYear: editAcademicYear,
        spreadsheetId: editSpreadsheetId,
        scheduleDay: editScheduleDay,
        startTime: editStartTime,
        endTime: editEndTime,
        scheduleTime: computedScheduleTime,
        room: editRoom,
      });
      toastStore.add('Pengaturan & jadwal kelas berhasil diperbarui!', 'success');
      await loadClassData();
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal memperbarui pengaturan kelas', 'danger');
    } finally {
      submittingSettings = false;
    }
  };

  const filteredStudents = $derived(
    students.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.identifier.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const enrolledStudentIds = $derived(students.map((s) => s.id));
</script>

<AppShell title={classData?.name || 'Detail Kelas Guru'} {breadcrumbs}>
  {#if loadingClass}
    <Skeleton height="h-64" />
  {:else if error || !classData}
    <Alert tone="danger" title="Gagal Memuat Kelas" message={error || 'Kelas tidak ditemukan'} onretry={loadClassData} />
  {:else}
    <div class="flex flex-col gap-6 w-full pb-12">
      <Card tone="surface" class="border-[3px] border-black shadow-brutal p-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
          <div>
            <h2 class="font-display font-black text-2xl uppercase tracking-wide">{classData.name}</h2>
            <p class="font-body font-bold text-sm text-gray-700">{classData.level} · {classData.academicYear || 'Tahun Ajaran Aktif'}</p>
          </div>
          <div class="flex items-center gap-2">
            <Badge tone="info">Tingkat: {classData.level}</Badge>
            <Badge tone="neutral">{students.length} Siswa</Badge>
          </div>
        </div>

        <div class="pt-4">
          <Tabs tabs={detailTabs} bind:active={activeTab} />
        </div>
      </Card>

      {#if activeTab === 'students'}
        <div class="flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 border-2 border-black">
            <Input placeholder="Cari NIS atau Nama siswa..." bind:value={searchQuery} class="w-full sm:w-80 font-body text-xs" />
            <Button variant="primary" onclick={() => showAddStudentModal = true}>
              + Tambah Siswa Baru
            </Button>
          </div>

          {#if loadingStudents}
            <Skeleton height="h-64" />
          {:else if students.length === 0}
            <EmptyState icon={Users} title="Belum Ada Siswa" description="Kelas ini belum memiliki siswa terdaftar. Klik 'Tambah Siswa' untuk mendaftarkan siswa.">
              {#snippet action()}
                <Button variant="primary" onclick={() => showAddStudentModal = true}>+ Tambah Siswa Pertama</Button>
              {/snippet}
            </EmptyState>
          {:else if filteredStudents.length === 0}
            <EmptyState icon={Search} title="Tidak Ditemukan" description={`Tidak ada siswa cocok dengan kata kunci "${searchQuery}".`} />
          {:else}
            <Table headers={["No", "NIS", "Nama Siswa", "Tanggal Terdaftar"]}>
              {#each filteredStudents as student, idx (student.id)}
                <tr>
                  <td class="p-3.5 border-r-2 border-black font-mono font-bold">{idx + 1}</td>
                  <td class="p-3.5 border-r-2 border-black font-mono font-bold">{student.identifier}</td>
                  <td class="p-3.5 border-r-2 border-black font-bold">{student.name}</td>
                  <td class="p-3.5 border-r-2 border-black font-mono text-xs">{student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString('id-ID') : '-'}</td>
                </tr>
              {/each}
            </Table>
          {/if}
        </div>
      {:else if activeTab === 'groups'}
        <div class="flex flex-col gap-4">
          {#if loadingGroups}
            <Skeleton height="h-48" />
          {:else if groups.length === 0}
            <EmptyState icon={Users} title="Belum Ada Kelompok" description="Siswa di kelas ini belum membentuk kelompok." />
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {#each groups as group (group.id)}
                <GroupCard {group} isTeacher={true} />
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <Card tone="surface" title="Pengaturan Informasi Kelas">
          <form onsubmit={handleSaveSettings} class="flex flex-col gap-4">
            <Input label="Nama Kelas" required={true} bind:value={editName} />
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Tingkat Kelas" required={true} bind:value={editLevel} />
              <Input label="Tahun Ajaran" required={true} bind:value={editAcademicYear} />
            </div>

            <div class="border-t-2 border-black pt-3 mt-1 flex flex-col gap-3">
              <h4 class="font-display font-black text-sm uppercase text-black">Jadwal & Ruangan Mengajar Kelas</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select label="Hari Mengajar" options={dayOptions} bind:value={editScheduleDay} />
                <Input label="Jam Mulai" type="time" bind:value={editStartTime} hint="Format HH:MM (contoh: 08:15)" />
                <Input label="Jam Selesai" type="time" bind:value={editEndTime} hint="Format HH:MM (contoh: 09:45)" />
                <Input label="Ruangan / Laboratorium" bind:value={editRoom} placeholder="Contoh: Lab AK" hint="Lokasi kelas / lab" />
              </div>
            </div>

            <div class="flex flex-col gap-1.5 pt-2">
              <Input
                label="ID Spreadsheet Google Sheets"
                bind:value={editSpreadsheetId}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                class="font-mono text-xs"
                hint="ID Spreadsheet diambil dari bagian URL: docs.google.com/spreadsheets/d/[ID_SPREADSHEET]/edit"
              />
              <Alert tone="info" class="mt-1 text-xs">
                <strong>Ketentuan Google Sheets:</strong> Pastikan Anda membuka sheet terkait, mengeklik tombol <strong>Bagikan (Share)</strong>, dan memberikan peran <strong>Editor</strong> kepada email Service Account aplikasi agar nilai tugas/quiz otomatis tersinkron.
              </Alert>
            </div>

            <div class="pt-4 flex justify-end">
              <Button type="submit" variant="primary" loading={submittingSettings}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Card>
      {/if}
    </div>
  {/if}
</AppShell>

<TambahSiswaModal
  bind:open={showAddStudentModal}
  {classId}
  existingEnrolledStudentIds={enrolledStudentIds}
  onSuccess={loadStudents}
/>
