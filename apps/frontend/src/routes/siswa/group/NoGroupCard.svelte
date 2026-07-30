<script lang="ts">
  import { Users } from 'lucide-svelte';
  import Button from '../../../lib/components/ui/Button.svelte';
  import Card from '../../../lib/components/ui/Card.svelte';
  import EmptyState from '../../../lib/components/ui/EmptyState.svelte';

  interface Props {
    hasGroupsInClass: boolean;
    oncreateclick: () => void;
  }

  let { hasGroupsInClass, oncreateclick }: Props = $props();
</script>

<Card tone="base" class="border-primary border-[3px] bg-yellow-100 p-6">
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h3 class="font-display font-black text-xl uppercase">Kamu Belum Punya Kelompok</h3>
      <p class="font-body text-sm text-gray-800">
        Pilih salah satu kelompok yang tersedia di bawah untuk bergabung, atau buat kelompok baru.
      </p>
    </div>
    <Button variant="primary" onclick={oncreateclick}>+ Buat Kelompok Baru</Button>
  </div>
</Card>

{#if !hasGroupsInClass}
  <EmptyState icon={Users} title="Belum Ada Kelompok" description="Belum ada kelompok yang dibentuk di kelas ini. Jadi ketua kelompok pertama!">
    {#snippet action()}
      <Button variant="primary" onclick={oncreateclick}>+ Buat Kelompok Pertama</Button>
    {/snippet}
  </EmptyState>
{/if}
