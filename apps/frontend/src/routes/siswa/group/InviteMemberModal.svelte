<script lang="ts">
  import { UserPlus } from 'lucide-svelte';
  import type { StudentProfile } from '../../../lib/api/classes';
  import type { GroupItem } from '../../../lib/api/groups';
  import Badge from '../../../lib/components/ui/Badge.svelte';
  import Button from '../../../lib/components/ui/Button.svelte';
  import Input from '../../../lib/components/ui/Input.svelte';
  import Modal from '../../../lib/components/ui/Modal.svelte';

  interface Props {
    open: boolean;
    userGroup: GroupItem | null | undefined;
    unjoinedClassmates: StudentProfile[];
    loadingStudents: boolean;
    inviteSearch: string;
    inviteLoadingId: string | null;
    oninvite: (student: StudentProfile) => Promise<void> | void;
  }

  let {
    open = $bindable(false),
    userGroup,
    unjoinedClassmates = [],
    loadingStudents,
    inviteSearch = $bindable(''),
    inviteLoadingId,
    oninvite,
  }: Props = $props();
</script>

<Modal bind:open title={`Undang Teman Sekelas — ${userGroup?.name || ''}`}>
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
                onclick={() => oninvite(student)}
              >
                <UserPlus size={14} /> Undang
              </Button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <div class="flex justify-end border-t-2 border-black pt-3">
      <Button variant="surface" onclick={() => (open = false)}>Tutup</Button>
    </div>
  </div>
</Modal>
