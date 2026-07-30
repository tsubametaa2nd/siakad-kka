<script lang="ts">
  import { Crown, LogOut, Pencil, UserPlus } from 'lucide-svelte';
  import type { GroupItem } from '../../../lib/api/groups';
  import { updateGroupNameApi } from '../../../lib/api/groups';
  import Badge from '../../../lib/components/ui/Badge.svelte';
  import Button from '../../../lib/components/ui/Button.svelte';
  import { toastStore } from '../../../lib/stores/toast.svelte';

  interface Props {
    userGroup: GroupItem;
    isLeader: boolean;
    oninviteclick: () => void;
    onleaveclick: () => void;
    onnameupdated: () => Promise<void> | void;
  }

  let { userGroup, isLeader, oninviteclick, onleaveclick, onnameupdated }: Props = $props();

  let isEditingGroupName = $state(false);
  let editedGroupName = $state('');
  let savingGroupName = $state(false);

  const startEditGroupName = () => {
    editedGroupName = userGroup.name;
    isEditingGroupName = true;
  };

  const handleSaveGroupName = async () => {
    if (!editedGroupName.trim()) return;
    savingGroupName = true;
    try {
      await updateGroupNameApi(userGroup.id, editedGroupName.trim());
      toastStore.success('Nama kelompok berhasil diperbarui!');
      isEditingGroupName = false;
      await onnameupdated();
    } catch (err: any) {
      toastStore.error(err?.message || 'Gagal memperbarui nama kelompok');
    } finally {
      savingGroupName = false;
    }
  };
</script>

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

    {#if isEditingGroupName}
      <form onsubmit={(e) => { e.preventDefault(); handleSaveGroupName(); }} class="flex items-center gap-2 mt-1 flex-wrap">
        <input
          type="text"
          bind:value={editedGroupName}
          placeholder="Nama Kelompok Baru"
          required={true}
          class="px-3 py-1.5 border-[3px] border-black font-display font-black text-base uppercase bg-white text-black focus:bg-yellow-50 focus:outline-none shadow-brutal-sm min-w-[240px]"
        />
        <Button variant="primary" size="sm" type="submit" disabled={savingGroupName}>
          {savingGroupName ? 'Menyimpan...' : 'Simpan'}
        </Button>
        <Button variant="surface" size="sm" type="button" onclick={() => (isEditingGroupName = false)}>
          Batal
        </Button>
      </form>
    {:else}
      <div class="flex items-center gap-2.5 flex-wrap">
        <h2 class="font-display font-black text-2xl md:text-3xl uppercase tracking-wide text-black">
          {userGroup.name}
        </h2>
        <button
          type="button"
          onclick={startEditGroupName}
          title="Ubah Nama Kelompok"
          class="px-2 py-1 bg-white hover:bg-yellow-100 border border-black shadow-brutal-sm transition-colors text-black flex items-center gap-1 font-mono text-xs font-bold cursor-pointer"
        >
          <Pencil size={13} />
          <span>Ubah Nama</span>
        </button>
      </div>
    {/if}

    <p class="font-body text-sm text-gray-800 font-medium">
      {userGroup.member_count} dari {userGroup.max_members} Anggota Terisi
    </p>
  </div>

  <div class="flex items-center gap-3 shrink-0 flex-wrap">
    {#if isLeader}
      <Button variant="primary" onclick={oninviteclick}>
        <UserPlus size={16} /> Undang Teman Sekelas
      </Button>
    {/if}
    <Button variant="accent" size="sm" onclick={onleaveclick}>
      <LogOut size={14} /> Keluar Kelompok
    </Button>
  </div>
</div>
