<script lang="ts">
  import { Users, UserPlus, Crown, GraduationCap } from "lucide-svelte";
  import Badge from "../../ui/Badge.svelte";
  import Button from "../../ui/Button.svelte";
  import Skeleton from "../../ui/Skeleton.svelte";
  import type { GroupItem } from "../../../api/groups";

  interface Props {
    primaryGroup: GroupItem | null;
    isLeader?: boolean;
    loading?: boolean;
  }

  let { primaryGroup, isLeader = false, loading = false }: Props = $props();
</script>

<div
  class="border-[3px] border-black bg-white p-6 shadow-brutal flex flex-col gap-6"
>
  <div
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4"
  >
    <div class="flex items-center gap-2">
      <Users size={24} class="text-blue-600" />
      <h2 class="font-display font-black text-xl uppercase tracking-wide">
        Kelompok Belajar Saya
      </h2>
    </div>
    <Button
      variant="primary"
      size="sm"
      onclick={() => (window.location.hash = "#/siswa/kelompok")}
    >
      Buka Halaman Kelompok →
    </Button>
  </div>

  {#if loading}
    <Skeleton height="h-32" />
  {:else if !primaryGroup}
    <!-- State: Belum Punya Kelompok -->
    <div
      class="border-2 border-black bg-yellow-100 p-5 shadow-brutal-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 bg-amber-400 border-2 border-black flex items-center justify-center shrink-0"
        >
          <UserPlus size={24} />
        </div>
        <div>
          <h3 class="font-display font-black text-lg uppercase">
            Kamu Belum Memiliki Kelompok!
          </h3>
          <p class="font-body text-xs font-medium text-gray-800 mt-0.5">
            Buat kelompok baru atau minta Ketua Kelompok sekelasmu untuk
            mengundangmu menggunakan Kode Kelompok.
          </p>
        </div>
      </div>
      <Button
        variant="accent"
        size="sm"
        onclick={() => (window.location.hash = "#/siswa/kelompok")}
      >
        + Buat / Gabung Kelompok
      </Button>
    </div>
  {:else}
    <!-- State: Sudah Memiliki Kelompok -->
    <div
      class="border-2 border-black bg-surface p-5 shadow-brutal flex flex-col gap-5"
    >
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3"
      >
        <div>
          <div class="flex items-center gap-2">
            <span
              class="font-display font-black text-2xl uppercase tracking-wide"
              >{primaryGroup.name}</span
            >
            {#if isLeader}
              <Badge tone="warning">KETUA KELOMPOK</Badge>
            {:else}
              <Badge tone="info">ANGGOTA KELOMPOK</Badge>
            {/if}
          </div>
          <p class="font-mono text-xs font-bold text-gray-800 mt-1">
            Kapasitas: <strong
              >{primaryGroup.member_count ?? primaryGroup.members?.length ?? 0} dari
              {primaryGroup.max_members ?? 5} Siswa</strong
            >
          </p>
        </div>

        <Button
          variant="surface"
          size="sm"
          onclick={() => (window.location.hash = "#/siswa/kelompok")}
        >
          Detail & Tugas Kelompok →
        </Button>
      </div>

      <!-- Daftar Anggota Kelompok -->
      <div>
        <div
          class="font-display font-black text-xs uppercase text-gray-800 mb-2 flex items-center gap-1.5"
        >
          <Users size={14} /> Anggota Kelompok ({(primaryGroup.members ?? [])
            .length}):
        </div>
        <div class="flex flex-wrap gap-2">
          {#each primaryGroup.members ?? [] as member (member.student_id)}
            {@const memberIsLeader =
              member.student_id === primaryGroup.leader_id}
            <div
              class="bg-white border-2 border-black px-3 py-1.5 shadow-brutal-sm flex items-center gap-2 text-xs"
            >
              {#if memberIsLeader}
                <Crown size={14} class="text-amber-600 shrink-0" />
              {:else}
                <GraduationCap size={14} class="text-gray-600 shrink-0" />
              {/if}
              <span class="font-bold">{member.name}</span>
              <span class="font-mono text-[10px] text-gray-600 font-bold"
                >({member.identifier || "NIS"})</span
              >
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
