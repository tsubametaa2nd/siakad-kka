<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Users, Eye, Search } from 'lucide-svelte';
  import Modal from '../ui/Modal.svelte';
  import Badge from '../ui/Badge.svelte';
  import Button from '../ui/Button.svelte';
  import {
    recordMaterialPresenceApi,
    getActiveMaterialReadersApi,
    type ActiveReaderItem,
  } from '../../api/materials';

  interface Props {
    materialId: string;
  }

  let { materialId }: Props = $props();

  let readers = $state<ActiveReaderItem[]>([]);
  let activeCount = $state(0);
  let showModal = $state(false);
  let searchQuery = $state('');

  let heartbeatInterval: any;
  let pollInterval: any;

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const avatarColors = [
    'bg-amber-300 text-black',
    'bg-emerald-300 text-black',
    'bg-sky-300 text-black',
    'bg-pink-300 text-black',
    'bg-purple-300 text-black',
  ];

  const fetchReaders = async () => {
    if (!materialId) return;
    const res = await getActiveMaterialReadersApi(materialId);
    readers = res.readers || [];
    activeCount = res.active_count || readers.length;
  };

  const sendPresence = async () => {
    if (!materialId) return;
    await recordMaterialPresenceApi(materialId);
  };

  onMount(() => {
    sendPresence();
    fetchReaders();

    // Heartbeat presence update every 10s
    heartbeatInterval = setInterval(() => {
      sendPresence();
    }, 10000);

    // Poll active readers every 8s
    pollInterval = setInterval(() => {
      fetchReaders();
    }, 8000);
  });

  onDestroy(() => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (pollInterval) clearInterval(pollInterval);
  });

  const visibleReaders = $derived(readers.slice(0, 4));
  const remainingCount = $derived(Math.max(0, readers.length - 4));

  const filteredReaders = $derived(
    searchQuery.trim() === ''
      ? readers
      : readers.filter(
          (r) =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.identifier.toLowerCase().includes(searchQuery.toLowerCase())
        )
  );
</script>

<!-- Container Widget Header -->
<div class="flex items-center gap-2">
  <button
    type="button"
    onclick={() => (showModal = true)}
    class="h-[42px] flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 shadow-brutal-sm hover:-translate-y-0.5 transition-transform cursor-pointer group"
    title="Lihat daftar siswa yang sedang membaca"
  >
    <div class="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-800 border-r-2 border-black pr-2.5">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black shadow-sm animate-pulse"></span>
      <span class="hidden sm:inline font-display uppercase tracking-wide">Sedang Membaca</span>
      <span class="bg-emerald-100 border border-black px-1.5 py-0.5 font-mono text-[11px] font-black">{activeCount}</span>
    </div>

    {#if readers.length === 0}
      <span class="font-mono text-xs font-bold text-gray-500 italic px-1">Belum ada pembaca</span>
    {:else}
      <div class="flex items-center -space-x-2 overflow-hidden py-0.5">
        {#each visibleReaders as reader, idx (reader.student_id)}
          {@const colorClass = avatarColors[idx % avatarColors.length]}
          <div
            class="w-7 h-7 rounded-full border-2 border-black font-display font-black text-[10px] flex items-center justify-center shadow-brutal-sm transition-transform group-hover:scale-105 {colorClass}"
            title={reader.name}
          >
            {getInitials(reader.name)}
          </div>
        {/each}

        {#if remainingCount > 0}
          <div
            class="w-7 h-7 rounded-full border-2 border-black bg-primary font-mono font-black text-[10px] flex items-center justify-center shadow-brutal-sm transition-transform group-hover:scale-105"
            title={`+${remainingCount} siswa lainnya`}
          >
            +{remainingCount}
          </div>
        {/if}
      </div>
    {/if}
  </button>
</div>

<!-- Modal Listing Readers -->
<Modal
  bind:open={showModal}
  title="Siswa Sedang Membaca"
>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between bg-emerald-100 border-2 border-black p-3 shadow-brutal-sm">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-emerald-500 border border-black animate-pulse"></span>
        <span class="font-display font-black text-sm uppercase">Total Pembaca Aktif</span>
      </div>
      <Badge tone="success">{activeCount} Siswa</Badge>
    </div>

    {#if readers.length > 5}
      <div class="relative">
        <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Cari nama siswa..."
          class="w-full bg-white border-2 border-black pl-9 pr-3 py-1.5 font-body text-xs font-bold focus:outline-none focus:bg-yellow-50"
        />
      </div>
    {/if}

    <div class="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
      {#if filteredReaders.length === 0}
        <div class="text-center py-6 font-mono text-xs text-gray-500 font-bold">
          Tidak ada siswa aktif yang cocok dengan pencarian.
        </div>
      {:else}
        {#each filteredReaders as reader, idx (reader.student_id)}
          {@const colorClass = avatarColors[idx % avatarColors.length]}
          <div class="border-2 border-black bg-white p-3 shadow-brutal-sm flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full border-2 border-black font-display font-black text-xs flex items-center justify-center shrink-0 shadow-brutal-sm {colorClass}">
                {getInitials(reader.name)}
              </div>
              <span class="font-display font-black text-sm uppercase">{reader.name}</span>
            </div>

            <div class="flex items-center gap-1 bg-emerald-50 border border-black px-2 py-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500 border border-black"></span>
              <span class="font-mono text-[10px] font-bold text-emerald-800">Sedang Membaca</span>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  {#snippet footer()}
    <Button variant="surface" size="sm" onclick={() => (showModal = false)}>
      Tutup
    </Button>
  {/snippet}
</Modal>
