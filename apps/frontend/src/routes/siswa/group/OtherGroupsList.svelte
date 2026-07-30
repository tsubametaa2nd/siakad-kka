<script lang="ts">
  import type { GroupItem } from '../../../lib/api/groups';
  import GroupCard from '../../../lib/components/kelompok/GroupCard.svelte';

  interface Props {
    groups: GroupItem[];
    userGroupId: string | null;
    currentStudentId: string;
    actionLoading: boolean;
    onjoin: (groupId: string) => void;
    onleave: (group: GroupItem) => void;
  }

  let { groups = [], userGroupId, currentStudentId, actionLoading, onjoin, onleave }: Props = $props();

  const filteredOtherGroups = $derived(
    userGroupId ? groups.filter((g) => g.id !== userGroupId) : groups
  );
</script>

{#if filteredOtherGroups.length > 0}
  <div class="mt-4 flex flex-col gap-4 border-t-2 border-black pt-6">
    {#if userGroupId}
      <h3 class="font-display font-black text-lg uppercase tracking-wide">
        Kelompok Lain di Kelas Ini ({filteredOtherGroups.length})
      </h3>
    {/if}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredOtherGroups as group (group.id)}
        <GroupCard
          {group}
          {userGroupId}
          {currentStudentId}
          joining={actionLoading}
          leaving={actionLoading}
          {onjoin}
          {onleave}
        />
      {/each}
    </div>
  </div>
{/if}
