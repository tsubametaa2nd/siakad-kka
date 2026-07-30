<script lang="ts">
  import { Crown, Users } from 'lucide-svelte';
  import type { GroupItem } from '../../../lib/api/groups';
  import Badge from '../../../lib/components/ui/Badge.svelte';

  interface Props {
    userGroup: GroupItem;
    currentStudentId: string;
  }

  let { userGroup, currentStudentId }: Props = $props();
</script>

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
