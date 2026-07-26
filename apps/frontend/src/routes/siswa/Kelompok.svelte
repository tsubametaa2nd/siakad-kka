<script lang="ts">
  import { School, Users, UserPlus, FileText, CheckCircle2, Clock, Crown, LogOut } from 'lucide-svelte';
  import { getStudentClassesApi, getClassStudentsApi, type ClassItem, type StudentProfile } from '../../lib/api/classes';
  import {
    getGroupsByClassApi,
    joinGroupApi,
    leaveGroupApi,
    inviteStudentApi,
    type GroupItem,
  } from '../../lib/api/groups';
  import { getStudentAssignmentsApi, type AssignmentItem } from '../../lib/api/assignments';
  import BuatKelompokModal from '../../lib/components/kelompok/BuatKelompokModal.svelte';
  import GroupCard from '../../lib/components/kelompok/GroupCard.svelte';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Badge from '../../lib/components/ui/Badge.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import Card from '../../lib/components/ui/Card.svelte';
  import ConfirmDialog from '../../lib/components/ui/ConfirmDialog.svelte';
  import EmptyState from '../../lib/components/ui/EmptyState.svelte';
  import Input from '../../lib/components/ui/Input.svelte';
  import Modal from '../../lib/components/ui/Modal.svelte';
  import Select from '../../lib/components/ui/Select.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import { authStore } from '../../lib/stores/auth.svelte';
  import { toastStore } from '../../lib/stores/toast.svelte';
  import { formatDateTimeWIB } from '../../lib/utils/date';

  let studentClasses = $state<ClassItem[]>([]);
  let selectedClassId = $state<string>('');
  let groups = $state<GroupItem[]>([]);
  let groupAssignments = $state<AssignmentItem[]>([]);

  let loadingClasses = $state(true);
  let loadingGroups = $state(false);
  let loadingAssignments = $state(false);
  let error = $state('');

  let showCreateModal = $state(false);
  let showInviteModal = $state(false);
  let groupToLeave = $state<GroupItem | null>(null);
  let showLeaveConfirm = $state(false);
  let actionLoading = $state(false);

  // Invite modal state
  let classStudents = $state<StudentProfile[]>([]);
  let loadingStudents = $state(false);
  let inviteSearch = $state('');
  let inviteLoadingId = $state<string | null>(null);

  const breadcrumbs = [
    { label: 'Beranda Siswa', href: '/siswa' },
    { label: 'Kelompok Saya', href: '/siswa/kelompok' },
  ];

  const classOptions = $derived(
    studentClasses.map((c) => ({ value: c.id, label: `${c.name} (${c.level})` }))
  );

  const currentStudentId = $derived(authStore.user?.id || '');

  const userGroup = $derived(
    groups.find((g) => g.members?.some((m) => m.student_id === currentStudentId))
  );

  const userGroupId = $derived(userGroup?.id || null);
  const isLeader = $derived(userGroup?.leader_id === currentStudentId);

  const isLeaderOfLeavingGroup = $derived(
    groupToLeave ? groupToLeave.leader_id === currentStudentId : false
  );

  const unjoinedClassmates = $derived(
    classStudents.filter((s) => {
      if (s.id === currentStudentId) return false;
      const alreadyInGroup = userGroup?.members?.some((m) => m.student_id === s.id);
      if (alreadyInGroup) return false;
      const query = inviteSearch.toLowerCase();
      return s.name.toLowerCase().includes(query) || (s.identifier || '').toLowerCase().includes(query);
    })
  );

  $effect(() => {
    loadClasses();
  });

  const loadClasses = async () => {
    loadingClasses = true;
    error = '';
    try {
      studentClasses = await getStudentClassesApi();
      if (studentClasses.length > 0) {
        selectedClassId = studentClasses[0].id;
        await loadGroupsAndAssignments(selectedClassId);
      }
    } catch (err: any) {
      error = err.message || 'Gagal memuat kelas Anda';
    } finally {
      loadingClasses = false;
    }
  };

  const loadGroupsAndAssignments = async (classId: string) => {
    if (!classId) return;
    loadingGroups = true;
    loadingAssignments = true;
    error = '';
    try {
      const [fetchedGroups, fetchedAssignments] = await Promise.all([
        getGroupsByClassApi(classId),
        getStudentAssignmentsApi(classId).catch(() => []),
      ]);
      groups = fetchedGroups;
      groupAssignments = fetchedAssignments.filter((a) => a.type === 'group');
    } catch (err: any) {
      error = err.message || 'Gagal memuat kelompok kelas';
    } finally {
      loadingGroups = false;
      loadingAssignments = false;
    }
  };

  const handleClassChange = (e: Event) => {
    const newClassId = (e.target as HTMLSelectElement).value;
    selectedClassId = newClassId;
    loadGroupsAndAssignments(newClassId);
  };

  const handleJoin = async (groupId: string) => {
    actionLoading = true;
    try {
      await joinGroupApi(groupId);
      toastStore.add('Berhasil bergabung dengan kelompok', 'success');
      await loadGroupsAndAssignments(selectedClassId);
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal bergabung dengan kelompok', 'danger');
    } finally {
      actionLoading = false;
    }
  };

  const openInviteModal = async () => {
    showInviteModal = true;
    loadingStudents = true;
    try {
      classStudents = await getClassStudentsApi(selectedClassId);
    } catch (err: any) {
      toastStore.add('Gagal memuat daftar teman sekelas', 'danger');
    } finally {
      loadingStudents = false;
    }
  };

  const handleInviteStudent = async (student: StudentProfile) => {
    if (!userGroup) return;
    inviteLoadingId = student.id;
    try {
      await inviteStudentApi(userGroup.id, student.id);
      toastStore.add(`Berhasil mengundang ${student.name} ke kelompok!`, 'success');
      await loadGroupsAndAssignments(selectedClassId);
    } catch (err: any) {
      toastStore.add(err.message || `Gagal mengundang ${student.name}`, 'danger');
    } finally {
      inviteLoadingId = null;
    }
  };

  const promptLeaveGroup = (group: GroupItem) => {
    groupToLeave = group;
    showLeaveConfirm = true;
  };

  const handleConfirmLeave = async () => {
    if (!groupToLeave) return;
    actionLoading = true;
    try {
      await leaveGroupApi(groupToLeave.id);
      toastStore.add('Berhasil keluar dari kelompok', 'success');
      showLeaveConfirm = false;
      groupToLeave = null;
      await loadGroupsAndAssignments(selectedClassId);
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal keluar dari kelompok', 'danger');
    } finally {
      actionLoading = false;
    }
  };
</script>

<AppShell title="Pembagian Kelompok Siswa" {breadcrumbs}>
  {#if loadingClasses}
    <Skeleton height="h-24" />
  {:else if error}
    <Alert tone="danger" title="Gagal Memuat Data" message={error} onretry={loadClasses} />
  {:else if studentClasses.length === 0}
    <EmptyState icon={School} title="Belum Terdaftar di Kelas" description="Anda belum terdaftar di kelas mana pun." />
  {:else}
    <div class="flex flex-col gap-6">
      <!-- Selector Kelas -->
      <div class="bg-white p-4 border-[3px] border-black shadow-brutal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Select label="Pilih Kelas Akademik" options={classOptions} bind:value={selectedClassId} onchange={handleClassChange} class="w-full sm:max-w-md" />
        {#if !userGroup}
          <Button variant="primary" onclick={() => (showCreateModal = true)}>
            + Buat Kelompok Baru
          </Button>
        {/if}
      </div>

      {#if loadingGroups}
        <Skeleton height="h-48" />
      {:else if userGroup}
        <!-- DASHBOARD KELOMPOK SAYA (Siswa Sudah Memiliki Kelompok) -->
        <div class="flex flex-col gap-6">
          <div class="bg-yellow-200 border-[3px] border-black p-6 shadow-brutal flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2 flex-wrap">
                <Badge tone="warning">KELOMPOK SAYA</Badge>
                {#if isLeader}
                  <Badge tone="info" class="flex items-center gap-1">
                    <Crown size={12} /> KETUA KELOMPOK
                  </Badge>
                {:else}
                  <Badge tone="neutral">ANGGOTA</Badge>
                {/if}
              </div>
              <h2 class="font-display font-black text-2xl md:text-3xl uppercase tracking-wide text-black">
                {userGroup.name}
              </h2>
              <p class="font-body text-sm text-gray-800 font-medium">
                {userGroup.member_count} dari {userGroup.max_members} Anggota Terisi
              </p>
            </div>

            <div class="flex items-center gap-3 shrink-0 flex-wrap">
              {#if isLeader}
                <Button variant="primary" onclick={openInviteModal}>
                  <UserPlus size={16} /> Undang Teman Sekelas
                </Button>
              {/if}
              <Button variant="accent" size="sm" onclick={() => promptLeaveGroup(userGroup)}>
                <LogOut size={14} /> Keluar Kelompok
              </Button>
            </div>
          </div>

          <!-- GRID DAFTAR ANGGOTA & TUGAS KELOMPOK -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Kolom 1: Anggota Kelompok -->
            <div class="lg:col-span-1 border-[3px] border-black bg-white p-5 shadow-brutal flex flex-col gap-4">
              <div class="flex items-center justify-between border-b-2 border-black pb-3">
                <h3 class="font-display font-black text-base uppercase flex items-center gap-2 text-black">
                  <Users size={18} class="text-black shrink-0" />
                  <span class="text-black font-extrabold">Anggota Kelompok</span>
                </h3>
                <span class="font-mono text-xs font-bold bg-black text-white px-2 py-0.5">
                  {userGroup.members?.length || 0}/{userGroup.max_members}
                </span>
              </div>

              <div class="flex flex-col gap-2.5">
                {#each userGroup.members || [] as member (member.student_id)}
                  {@const isMemberLeader = member.student_id === userGroup.leader_id}
                  {@const isSelf = member.student_id === currentStudentId}
                  <div class="bg-surface border-2 border-black p-3 flex items-center justify-between gap-3">
                    <div class="flex flex-col min-w-0">
                      <span class="font-bold text-sm truncate flex items-center gap-1.5 text-black">
                        {member.name}
                        {#if isSelf}
                          <span class="text-[10px] text-gray-700 font-normal">(Kamu)</span>
                        {/if}
                      </span>
                      <span class="font-mono text-xs text-gray-600">NIS: {member.identifier || '-'}</span>
                    </div>
                    {#if isMemberLeader}
                      <Badge tone="warning" class="shrink-0 flex items-center gap-1">
                        <Crown size={12} /> Ketua
                      </Badge>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>

            <!-- Kolom 2: Tugas Kelompok -->
            <div class="lg:col-span-2 border-[3px] border-black bg-white p-5 shadow-brutal flex flex-col gap-4">
              <div class="flex items-center justify-between border-b-2 border-black pb-3">
                <h3 class="font-display font-black text-base uppercase flex items-center gap-2 text-black">
                  <FileText size={18} class="text-black shrink-0" />
                  <span class="text-black font-extrabold">Tugas Kelompok ({groupAssignments.length})</span>
                </h3>
              </div>

              {#if loadingAssignments}
                <Skeleton height="h-24" />
              {:else if groupAssignments.length === 0}
                <div class="bg-gray-50 border-2 border-dashed border-gray-400 p-6 text-center">
                  <p class="font-body text-sm text-gray-700 font-medium">
                    Belum ada tugas kelompok yang ditugaskan oleh guru untuk kelas ini.
                  </p>
                </div>
              {:else}
                <div class="flex flex-col gap-3">
                  {#each groupAssignments as assignment (assignment.id)}
                    {@const isDone = assignment.status === 'Sudah' || assignment.status === 'Dinilai'}
                    <div class="border-2 border-black bg-surface p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-2">
                          <span class="font-display font-black text-base text-black uppercase">{assignment.title}</span>
                          {#if isDone}
                            <Badge tone="success" class="flex items-center gap-1">
                              <CheckCircle2 size={12} /> {assignment.status}
                            </Badge>
                          {:else}
                            <Badge tone="warning" class="flex items-center gap-1">
                              <Clock size={12} /> Belum Dikumpulkan
                            </Badge>
                          {/if}
                        </div>
                        <p class="font-body text-xs text-gray-700 line-clamp-1">{assignment.description || 'Tugas Kelompok'}</p>
                        <span class="font-mono text-[11px] text-gray-600 font-bold">
                          Batas Pengumpulan: {formatDateTimeWIB(assignment.due_date)}
                        </span>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onclick={() => (window.location.hash = `#/siswa/tugas/${assignment.id}`)}
                        class="shrink-0"
                      >
                        Buka Tugas →
                      </Button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- LIST KELOMPOK LAIN DI KELAS -->
        {#if groups.length > 1}
          <div class="mt-4 flex flex-col gap-4 border-t-2 border-black pt-6">
            <h3 class="font-display font-black text-lg uppercase tracking-wide">
              Kelompok Lain di Kelas Ini ({groups.length - 1})
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {#each groups.filter((g) => g.id !== userGroup.id) as group (group.id)}
                <GroupCard
                  {group}
                  userGroupId={userGroup.id}
                  {currentStudentId}
                  joining={actionLoading}
                  leaving={actionLoading}
                  onjoin={handleJoin}
                  onleave={promptLeaveGroup}
                />
              {/each}
            </div>
          </div>
        {/if}

      {:else}
        <!-- BELUM PUNYA KELOMPOK -->
        <Card tone="base" class="border-primary border-[3px] bg-yellow-100 p-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 class="font-display font-black text-xl uppercase">Kamu Belum Punya Kelompok</h3>
              <p class="font-body text-sm text-gray-800">
                Pilih salah satu kelompok yang tersedia di bawah untuk bergabung, atau buat kelompok baru.
              </p>
            </div>
            <Button variant="primary" onclick={() => (showCreateModal = true)}>+ Buat Kelompok Baru</Button>
          </div>
        </Card>

        {#if groups.length === 0}
          <EmptyState icon={Users} title="Belum Ada Kelompok" description="Belum ada kelompok yang dibentuk di kelas ini. Jadi ketua kelompok pertama!">
            {#snippet action()}
              <Button variant="primary" onclick={() => (showCreateModal = true)}>+ Buat Kelompok Pertama</Button>
            {/snippet}
          </EmptyState>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each groups as group (group.id)}
              <GroupCard
                {group}
                userGroupId={null}
                {currentStudentId}
                joining={actionLoading}
                leaving={actionLoading}
                onjoin={handleJoin}
                onleave={promptLeaveGroup}
              />
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</AppShell>

<!-- MODAL BUAT KELOMPOK BARU -->
<BuatKelompokModal bind:open={showCreateModal} classId={selectedClassId} onSuccess={() => loadGroupsAndAssignments(selectedClassId)} />

<!-- MODAL UNDANG TEMAN SEKELAS (Khusus Ketua Kelompok) -->
<Modal bind:open={showInviteModal} title={`Undang Teman Sekelas — ${userGroup?.name || ''}`}>
  <div class="flex flex-col gap-4">
    <Input
      bind:value={inviteSearch}
      placeholder="Cari nama atau NIS siswa..."
      hint={`Kapasitas kelompok saat ini: ${userGroup?.member_count || 0} / ${userGroup?.max_members || 5} anggota`}
    />

    {#if loadingStudents}
      <p class="font-body text-sm text-gray-600 text-center py-4">Memuat daftar siswa sekelas...</p>
    {:else if unjoinedClassmates.length === 0}
      <p class="font-body text-sm text-gray-600 text-center py-4">Tidak ada teman sekelas yang tersedia untuk diundang.</p>
    {:else}
      <div class="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
        {#each unjoinedClassmates as student (student.id)}
          {@const isFull = (userGroup?.member_count || 0) >= (userGroup?.max_members || 5)}
          <div class="flex items-center justify-between gap-3 border-2 border-black bg-white px-3 py-2">
            <div class="flex flex-col">
              <span class="font-bold text-sm">{student.name}</span>
              <span class="font-mono text-xs text-gray-600">NIS: {student.identifier || '-'}</span>
            </div>
            {#if isFull}
              <Badge tone="neutral">Kelompok Penuh</Badge>
            {:else}
              <Button
                size="sm"
                variant="primary"
                loading={inviteLoadingId === student.id}
                onclick={() => handleInviteStudent(student)}
              >
                <UserPlus size={14} /> Undang
              </Button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <div class="flex justify-end border-t-2 border-black pt-3">
      <Button variant="surface" onclick={() => (showInviteModal = false)}>Tutup</Button>
    </div>
  </div>
</Modal>

<!-- DIALOG KONFIRMASI KELUAR -->
<ConfirmDialog
  bind:open={showLeaveConfirm}
  title="Keluar dari Kelompok?"
  message={isLeaderOfLeavingGroup
    ? "Anda adalah KETUA kelompok. Jika Anda keluar, kepemimpinan akan otomatis berpindah ke anggota terlama yang bergabung."
    : "Apakah Anda yakin ingin keluar dari kelompok ini?"}
  confirmText="Ya, Keluar"
  cancelText="Batal"
  loading={actionLoading}
  onconfirm={handleConfirmLeave}
/>
