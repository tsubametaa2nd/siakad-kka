<script lang="ts">
  import { Users, UserPlus, CheckCircle, Copy } from 'lucide-svelte';
  import { createGroupApi, joinGroupApi, type GroupItem } from '../../api/groups';
  import { getClassStudentsApi, type StudentProfile } from '../../api/classes';
  import { toastStore } from '../../stores/toast.svelte';
  import { authStore } from '../../stores/auth.svelte';
  import Button from '../ui/Button.svelte';
  import Input from '../ui/Input.svelte';
  import Modal from '../ui/Modal.svelte';
  import Badge from '../ui/Badge.svelte';

  interface Props {
    open?: boolean;
    classId: string;
    onSuccess?: (newGroup: GroupItem) => void;
  }

  let { open = $bindable(false), classId, onSuccess }: Props = $props();

  // Step 1: create
  let name = $state('');
  let maxMembers = $state(5);
  let submitting = $state(false);

  // Step 2: invite
  let step = $state<'create' | 'invite'>('create');
  let createdGroup = $state<GroupItem | null>(null);
  let classStudents = $state<StudentProfile[]>([]);
  let loadingStudents = $state(false);
  let inviting = $state(false);
  let inviteSearch = $state('');
  let invitedIds = $state<Set<string>>(new Set());
  let inviteLoading = $state<Record<string, boolean>>({});

  const currentUserId = $derived(authStore.user?.id || '');
  const charCount = $derived(name.length);

  const filteredStudents = $derived(
    classStudents.filter(
      (s) =>
        s.id !== currentUserId &&
        (s.name.toLowerCase().includes(inviteSearch.toLowerCase()) ||
          s.identifier.toLowerCase().includes(inviteSearch.toLowerCase()))
    )
  );

  const handleClose = () => {
    open = false;
    step = 'create';
    name = '';
    maxMembers = 5;
    createdGroup = null;
    classStudents = [];
    inviteSearch = '';
    invitedIds = new Set();
    inviteLoading = {};
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!name.trim() || submitting || !classId) return;
    if (name.length > 30) {
      toastStore.add('Nama kelompok maksimal 30 karakter', 'danger');
      return;
    }

    submitting = true;
    try {
      const created = await createGroupApi(classId, name.trim(), Number(maxMembers) || 5);
      toastStore.add(`Kelompok "${created.name}" berhasil dibuat! Kini undang teman-temanmu.`, 'success');
      createdGroup = created;
      step = 'invite';
      // Load classmates
      loadingStudents = true;
      try {
        classStudents = await getClassStudentsApi(classId);
      } catch {
        classStudents = [];
      } finally {
        loadingStudents = false;
      }
    } catch (err: any) {
      toastStore.add(err.message || 'Gagal membuat kelompok', 'danger');
    } finally {
      submitting = false;
    }
  };

  const handleCopyInvite = async () => {
    if (!createdGroup) return;
    const code = `Gabung kelompok "${createdGroup.name}" di SIAKAD!\nKode Kelompok: ${createdGroup.id}\nAtau buka: ${window.location.href.split('#')[0]}#/siswa/kelompok`;
    try {
      await navigator.clipboard.writeText(code);
      toastStore.add('Pesan undangan disalin! Bagikan ke teman-teman.', 'success');
    } catch {
      toastStore.add('Gagal menyalin. Salin kode kelompok secara manual.', 'danger');
    }
  };

  const handleDone = () => {
    if (createdGroup && onSuccess) onSuccess(createdGroup);
    handleClose();
  };
</script>

<Modal bind:open title={step === 'create' ? 'Buat Kelompok Baru' : `Undang Anggota — ${createdGroup?.name}`}>
  {#if step === 'create'}
    <!-- Step 1: Create Group -->
    <form onsubmit={handleSubmit} class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <Input
          label="Nama Kelompok"
          required={true}
          bind:value={name}
          placeholder="Contoh: Kelompok Alpha"
          hint={`${charCount}/30 karakter (Maksimal 30)`}
        />
      </div>

      <Input
        label="Kapasitas Maksimal Anggota"
        type="number"
        required={true}
        bind:value={maxMembers}
        hint="Rekomendasi: 5 hingga 7 siswa"
      />

      <div class="flex items-center justify-end gap-3 pt-4 border-t-2 border-black bg-base mt-2 shrink-0">
        <Button type="button" variant="surface" onclick={handleClose}>Batal</Button>
        <Button type="submit" variant="primary" loading={submitting} disabled={!name.trim() || name.length > 30}>
          Buat & Undang Anggota →
        </Button>
      </div>
    </form>

  {:else}
    <!-- Step 2: Invite Classmates -->
    <div class="flex flex-col gap-4">
      <div class="bg-green-50 border-2 border-green-600 p-3 flex items-center gap-2">
        <CheckCircle size={18} class="text-green-600 shrink-0" />
        <p class="font-body text-sm font-bold text-green-800">
          Kelompok <strong>{createdGroup?.name}</strong> berhasil dibuat! Kamu otomatis menjadi ketua.
        </p>
      </div>

      <div class="bg-yellow-100 border-2 border-black p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p class="font-display font-black text-xs uppercase">Bagikan Undangan</p>
          <p class="font-body text-xs text-gray-800">Salin info kelompok & kirim ke grup WhatsApp teman-temanmu.</p>
        </div>
        <Button variant="primary" size="sm" onclick={handleCopyInvite} class="shrink-0">
          <Copy size={14} /> Salin Undangan
        </Button>
      </div>

      <div>
        <p class="font-display font-black text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <UserPlus size={14} /> Daftar Siswa di Kelas Ini ({filteredStudents.length})
        </p>
        <Input
          bind:value={inviteSearch}
          placeholder="Cari nama atau NIS..."
        />
      </div>

      {#if loadingStudents}
        <p class="font-body text-sm text-gray-600 text-center py-4">Memuat daftar siswa...</p>
      {:else if filteredStudents.length === 0}
        <p class="font-body text-sm text-gray-600 text-center py-4">Tidak ada siswa lain ditemukan.</p>
      {:else}
        <div class="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
          {#each filteredStudents as student (student.id)}
            <div class="flex items-center justify-between gap-3 border-2 border-black bg-white px-3 py-1.5">
              <div class="flex flex-col">
                <span class="font-bold text-xs">{student.name}</span>
                <span class="font-mono text-[10px] text-gray-600">NIS: {student.identifier || '-'}</span>
              </div>
              <Badge tone="info">Satu Kelas</Badge>
            </div>
          {/each}
        </div>
      {/if}

      <div class="flex items-center justify-end gap-3 pt-4 border-t-2 border-black mt-2 shrink-0">
        <Button variant="primary" onclick={handleDone}>
          <Users size={14} /> Selesai
        </Button>
      </div>
    </div>
  {/if}
</Modal>
