<script lang="ts">
  import { GraduationCap, BookOpen, FileText, Zap } from 'lucide-svelte';

  interface Props {
    classCount?: number;
    materialCount?: number;
    assignmentCount?: number;
    quizCount?: number;
    loading?: boolean;
  }

  let {
    classCount = 0,
    materialCount = 0,
    assignmentCount = 0,
    quizCount = 0,
    loading = false,
  }: Props = $props();
</script>

<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
  <div
    class="border-[3px] border-black bg-white p-3 sm:p-4 shadow-brutal flex items-center gap-2.5 sm:gap-3"
  >
    <div
      class="w-12 h-12 bg-surface border-2 border-black flex items-center justify-center shrink-0"
    >
      <GraduationCap size={24} />
    </div>
    <div>
      <div class="font-mono text-xs font-bold text-gray-600 uppercase">
        Kelas Mengajar
      </div>
      <div class="font-display font-black text-2xl">
        {loading ? '...' : classCount}
      </div>
    </div>
  </div>

  <div
    class="border-[3px] border-black bg-white p-3 sm:p-4 shadow-brutal flex items-center gap-2.5 sm:gap-3"
  >
    <div
      class="w-12 h-12 bg-primary border-2 border-black flex items-center justify-center shrink-0"
    >
      <BookOpen size={24} />
    </div>
    <div>
      <div class="font-mono text-xs font-bold text-gray-600 uppercase">
        Materi Aktif
      </div>
      <div class="font-display font-black text-2xl">
        {loading ? '...' : materialCount}
      </div>
    </div>
  </div>

  <div
    class="border-[3px] border-black bg-white p-3 sm:p-4 shadow-brutal flex items-center gap-2.5 sm:gap-3"
  >
    <div
      class="w-12 h-12 bg-accent text-white border-2 border-black flex items-center justify-center shrink-0"
    >
      <FileText size={24} />
    </div>
    <div>
      <div class="font-mono text-xs font-bold text-gray-600 uppercase">
        Total Tugas
      </div>
      <div class="font-display font-black text-2xl">
        {loading ? '...' : assignmentCount}
      </div>
    </div>
  </div>

  <div
    class="border-[3px] border-black bg-white p-3 sm:p-4 shadow-brutal flex items-center gap-2.5 sm:gap-3"
  >
    <div
      class="w-12 h-12 bg-emerald-300 border-2 border-black flex items-center justify-center shrink-0"
    >
      <Zap size={24} />
    </div>
    <div>
      <div class="font-mono text-xs font-bold text-gray-600 uppercase">
        Quiz Evaluasi
      </div>
      <div class="font-display font-black text-2xl">
        {loading ? '...' : quizCount}
      </div>
    </div>
  </div>
</div>
