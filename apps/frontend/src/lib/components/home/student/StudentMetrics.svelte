<script lang="ts">
  import { GraduationCap, FileText, Zap, BookOpen } from 'lucide-svelte';
  import type { ClassItem } from '../../../api/classes';

  interface Props {
    classes: ClassItem[];
    pendingAssignmentsCount?: number;
    activeQuizzesCount?: number;
    materialCount?: number;
    loading?: boolean;
  }

  let {
    classes,
    pendingAssignmentsCount = 0,
    activeQuizzesCount = 0,
    materialCount = 0,
    loading = false,
  }: Props = $props();
</script>

<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
  <!-- KELAS METRIC -->
  <a
    href="#/siswa/kelas"
    class="border-[3px] border-black bg-white p-3 sm:p-4 shadow-brutal flex items-center gap-2.5 sm:gap-3 hover:-translate-y-0.5 transition-transform"
  >
    <div
      class="w-12 h-12 bg-primary border-2 border-black flex items-center justify-center shrink-0"
    >
      <GraduationCap size={24} />
    </div>
    <div class="truncate">
      <div class="font-mono text-xs font-bold text-gray-600 uppercase">
        Kelas Saya
      </div>
      <div class="font-display font-black text-lg uppercase truncate">
        {loading
          ? "..."
          : classes.length > 0
            ? classes.length === 1
              ? classes[0].name
              : `${classes[0].name} (+${classes.length - 1})`
            : "Belum Ada"}
      </div>
    </div>
  </a>

  <!-- TUGAS METRIC -->
  <a
    href="#/siswa/tugas"
    class="border-[3px] border-black bg-white p-3 sm:p-4 shadow-brutal flex items-center gap-2.5 sm:gap-3 hover:-translate-y-0.5 transition-transform"
  >
    <div
      class="w-12 h-12 bg-accent text-white border-2 border-black flex items-center justify-center shrink-0"
    >
      <FileText size={24} />
    </div>
    <div>
      <div class="font-mono text-xs font-bold text-gray-600 uppercase">
        Tugas Belum
      </div>
      <div class="font-display font-black text-2xl">
        {loading ? "..." : pendingAssignmentsCount}
      </div>
    </div>
  </a>

  <!-- QUIZ METRIC -->
  <a
    href="#/siswa/quiz"
    class="border-[3px] border-black bg-white p-3 sm:p-4 shadow-brutal flex items-center gap-2.5 sm:gap-3 hover:-translate-y-0.5 transition-transform"
  >
    <div
      class="w-12 h-12 bg-amber-300 border-2 border-black flex items-center justify-center shrink-0"
    >
      <Zap size={24} />
    </div>
    <div>
      <div class="font-mono text-xs font-bold text-gray-600 uppercase">
        Quiz Aktif
      </div>
      <div class="font-display font-black text-2xl">
        {loading ? "..." : activeQuizzesCount}
      </div>
    </div>
  </a>

  <!-- MATERI METRIC -->
  <a
    href="#/siswa/materi"
    class="border-[3px] border-black bg-white p-3 sm:p-4 shadow-brutal flex items-center gap-2.5 sm:gap-3 hover:-translate-y-0.5 transition-transform"
  >
    <div
      class="w-12 h-12 bg-surface border-2 border-black flex items-center justify-center shrink-0"
    >
      <BookOpen size={24} />
    </div>
    <div>
      <div class="font-mono text-xs font-bold text-gray-600 uppercase">
        Materi Pelajaran
      </div>
      <div class="font-display font-black text-2xl">
        {loading ? "..." : materialCount}
      </div>
    </div>
  </a>
</div>
