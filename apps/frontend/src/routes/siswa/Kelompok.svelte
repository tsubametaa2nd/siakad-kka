<script lang="ts">
  import { School } from 'lucide-svelte';
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
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import ConfirmDialog from '../../lib/components/ui/ConfirmDialog.svelte';
  import EmptyState from '../../lib/components/ui/EmptyState.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import { authStore } from '../../lib/stores/auth.svelte';
  import { toastStore } from '../../lib/stores/toast.svelte';

  // Sub-komponen modul kelompok siswa
  import ClassSelectorHeader from './group/ClassSelectorHeader.svelte';
  import MyGroupBanner from './group/MyGroupBanner.svelte';
  import GroupMembersList from './group/GroupMembersList.svelte';
  import GroupAssignmentsList from './group/GroupAssignmentsList.svelte';
  import OtherGroupsList from './group/OtherGroupsList.svelte';
  import NoGroupCard from './group/NoGroupCard.svelte';
  import InviteMemberModal from './group/InviteMemberModal.svelte';

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
      <ClassSelectorHeader
        {classOptions}
        bind:selectedClassId
        hasGroup={!!userGroup}
        onclasschange={handleClassChange}
        oncreateclick={() => (showCreateModal = true)}
      />

      {#if loadingGroups}
        <Skeleton height="h-48" />
      {:else if userGroup}
        <div class="flex flex-col gap-6">
          <MyGroupBanner
            {userGroup}
            {isLeader}
            oninviteclick={openInviteModal}
            onleaveclick={() => promptLeaveGroup(userGroup)}
            onnameupdated={() => loadGroupsAndAssignments(selectedClassId)}
          />

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GroupMembersList {userGroup} {currentStudentId} />
            <GroupAssignmentsList {groupAssignments} {loadingAssignments} />
          </div>
        </div>

        <OtherGroupsList
          {groups}
          {userGroupId}
          {currentStudentId}
          {actionLoading}
          onjoin={handleJoin}
          onleave={promptLeaveGroup}
        />
      {:else}
        <NoGroupCard
          hasGroupsInClass={groups.length > 0}
          oncreateclick={() => (showCreateModal = true)}
        />

        <OtherGroupsList
          {groups}
          userGroupId={null}
          {currentStudentId}
          {actionLoading}
          onjoin={handleJoin}
          onleave={promptLeaveGroup}
        />
      {/if}
    </div>
  {/if}
</AppShell>

<BuatKelompokModal bind:open={showCreateModal} classId={selectedClassId} onSuccess={() => loadGroupsAndAssignments(selectedClassId)} />

<InviteMemberModal
  bind:open={showInviteModal}
  {userGroup}
  {unjoinedClassmates}
  {loadingStudents}
  bind:inviteSearch
  {inviteLoadingId}
  oninvite={handleInviteStudent}
/>

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
