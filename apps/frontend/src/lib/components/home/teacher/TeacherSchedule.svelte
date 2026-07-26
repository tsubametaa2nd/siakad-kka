<script lang="ts">
  import { Calendar, Clock, MapPin } from 'lucide-svelte';
  import Badge from '../../ui/Badge.svelte';

  interface SlotItem {
    time: string;
    code: string;
    name: string;
    room: string;
    desc: string;
    tagTone: 'neutral' | 'info' | 'warning' | 'danger' | 'success';
  }

  interface DaySchedule {
    day: string;
    dayCode: number;
    slots: SlotItem[];
  }

  interface Props {
    scheduleData: DaySchedule[];
    currentDayIndex: number;
    selectedDayFilter?: 'semua' | 'Senin' | 'Kamis';
    onSelectFilter?: (filter: 'semua' | 'Senin' | 'Kamis') => void;
  }

  let {
    scheduleData,
    currentDayIndex,
    selectedDayFilter = 'semua',
    onSelectFilter,
  }: Props = $props();

  const filteredSchedule = $derived(
    selectedDayFilter === 'semua'
      ? scheduleData
      : scheduleData.filter((s) => s.day === selectedDayFilter)
  );

  const handleFilter = (filter: 'semua' | 'Senin' | 'Kamis') => {
    if (onSelectFilter) onSelectFilter(filter);
  };
</script>

<div
  class="border-[3px] border-black bg-surface p-6 shadow-brutal flex flex-col gap-6"
>
  <div
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4"
  >
    <div>
      <div class="flex items-center gap-2">
        <Calendar size={22} />
        <h2 class="font-display font-black text-xl uppercase tracking-wide">
          Jadwal Mengajar Guru
        </h2>
      </div>
      <p class="font-body text-xs font-medium text-gray-800 mt-1">
        Jadwal tatap muka & praktikum mingguan di laboratorium & kelas teori
      </p>
    </div>

    <!-- Filter Hari -->
    <div
      class="flex flex-wrap items-center gap-1.5 bg-white p-1 border-2 border-black"
    >
      <button
        class="px-3 py-1 font-mono font-bold text-xs uppercase border border-black transition-all cursor-pointer {selectedDayFilter ===
        'semua'
          ? 'bg-primary shadow-brutal-sm'
          : 'bg-transparent hover:bg-gray-100'}"
        onclick={() => handleFilter('semua')}
      >
        Semua Hari
      </button>
      <button
        class="px-3 py-1 font-mono font-bold text-xs uppercase border border-black transition-all cursor-pointer {selectedDayFilter ===
        'Senin'
          ? 'bg-primary shadow-brutal-sm'
          : 'bg-transparent hover:bg-gray-100'}"
        onclick={() => handleFilter('Senin')}
      >
        Senin
      </button>
      <button
        class="px-3 py-1 font-mono font-bold text-xs uppercase border border-black transition-all cursor-pointer {selectedDayFilter ===
        'Kamis'
          ? 'bg-primary shadow-brutal-sm'
          : 'bg-transparent hover:bg-gray-100'}"
        onclick={() => handleFilter('Kamis')}
      >
        Kamis
      </button>
    </div>
  </div>

  <!-- Grid Jadwal -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    {#each filteredSchedule as daySchedule (daySchedule.day)}
      {@const isToday = currentDayIndex === daySchedule.dayCode}
      <div
        class="border-2 border-black bg-white p-5 shadow-brutal flex flex-col gap-4"
      >
        <div
          class="flex items-center justify-between border-b-2 border-black pb-2"
        >
          <div class="flex items-center gap-2">
            <span class="font-display font-black text-lg uppercase"
              >Hari {daySchedule.day}</span
            >
            {#if isToday}
              <Badge tone="danger">HARI INI</Badge>
            {/if}
          </div>
          <Badge tone="neutral">{daySchedule.slots.length} Sesi Kelas</Badge>
        </div>

        <div class="flex flex-col gap-3">
          {#each daySchedule.slots as slot (slot.code + slot.time)}
            <div
              class="border-2 border-black bg-base p-4 shadow-brutal-sm flex flex-col gap-2"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <Badge tone={slot.tagTone}>{slot.code}</Badge>
                  <span class="font-display font-black text-base uppercase"
                    >{slot.name}</span
                  >
                </div>
                <span
                  class="font-mono text-xs font-bold bg-white border border-black px-2 py-0.5 flex items-center gap-1"
                >
                  <Clock size={12} />
                  {slot.time}
                </span>
              </div>

              <p class="font-body text-xs text-gray-700 font-medium">
                {slot.desc}
              </p>

              <div
                class="flex items-center gap-1.5 font-mono text-xs font-bold text-gray-800 pt-1 border-t border-gray-300"
              >
                <MapPin size={14} class="text-accent shrink-0" />
                <span>{slot.room}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
