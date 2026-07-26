<script lang="ts">
  import Badge from '../ui/Badge.svelte';
  import Button from '../ui/Button.svelte';
  import type { GroupItem } from '../../api/groups';

  interface Props {
    group: GroupItem;
    userGroupId?: string | null;
    currentStudentId?: string;
    isTeacher?: boolean;
    joining?: boolean;
    leaving?: boolean;
    onjoin?: (groupId: string) => void;
    onleave?: (group: GroupItem) => void;
    class?: string;
  }

  let {
    group,
    userGroupId = null,
    currentStudentId,
    isTeacher = false,
    joining = false,
    leaving = false,
    onjoin,
    onleave,
    class: className = ''
  }: Props = $props();

  const isInThisGroup = $derived(userGroupId === group.id);
  const isFull = $derived(group.member_count >= group.max_members);
  const isInOtherGroup = $derived(!!userGroupId && userGroupId !== group.id);
</script>

<div class="border-[3px] border-black bg-surface text-black p-5 shadow-brutal rounded-none flex flex-col gap-4 {className}">
  <div class="flex items-start justify-between gap-3 border-b-2 border-black pb-3">
    <div>
      <h3 class="font-display font-black text-xl uppercase tracking-wide truncate">{group.name}</h3>
      <span class="font-mono text-xs font-bold text-gray-800">{group.member_count} / {group.max_members} Anggota</span>
    </div>
    {#if isFull}
      <Badge tone="danger">Penuh</Badge>
    {:else if isInThisGroup}
      <Badge tone="warning">Kelompok Anda</Badge>
    {/if}
  </div>

  <div class="flex flex-col gap-2">
    <span class="font-display font-black text-xs uppercase tracking-wider">Anggota ({group.members?.length || 0}):</span>
    <div class="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
      {#each group.members || [] as member}
        <div class="bg-white px-3 py-1.5 border-2 border-black flex items-center justify-between font-body text-xs">
          <div class="truncate">
            <span class="font-bold">{member.name}</span>
          </div>
          {#if member.student_id === group.leader_id}
            <Badge tone="warning">Ketua</Badge>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  {#if !isTeacher}
    <div class="border-t-2 border-black pt-3 flex flex-col gap-1">
      {#if isInThisGroup}
        <Button variant="accent" size="sm" loading={leaving} onclick={() => onleave && onleave(group)}>
          Keluar dari Kelompok
        </Button>
      {:else if isInOtherGroup}
        <Button variant="surface" size="sm" disabled={true}>
          Kamu Sudah Ada Kelompok
        </Button>
      {:else if isFull}
        <Button variant="surface" size="sm" disabled={true}>
          Kelompok Penuh
        </Button>
      {:else}
        <Button variant="surface" size="sm" loading={joining} onclick={() => onjoin && onjoin(group.id)}>
          Gabung Kelompok
        </Button>
      {/if}
    </div>
  {/if}
</div>
