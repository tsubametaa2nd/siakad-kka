<script lang="ts">
  interface Props {
    totalQuestions: number;
    currentIndex: number;
    answeredQuestionIds: Record<string, number>;
    questionIds: string[];
    onselect?: (index: number) => void;
    class?: string;
  }

  let {
    totalQuestions,
    currentIndex,
    answeredQuestionIds = {},
    questionIds = [],
    onselect,
    class: className = '',
  }: Props = $props();
</script>

<div class="border-[3px] border-black bg-white p-4 shadow-brutal flex flex-col gap-3 {className}">
  <div class="font-display font-black text-xs uppercase tracking-wider">Peta Navigasi Soal:</div>
  <div class="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
    {#each Array(totalQuestions) as _, i}
      {@const qId = questionIds[i]}
      {@const isCurrent = currentIndex === i}
      {@const isAnswered = qId !== undefined && answeredQuestionIds[qId] !== undefined}
      <button
        type="button"
        onclick={() => onselect && onselect(i)}
        class="w-8 h-8 sm:w-10 sm:h-10 border-2 border-black font-mono font-bold text-xs sm:text-sm flex items-center justify-center transition-all duration-100 focus:outline-[3px] focus:outline-black {isCurrent ? 'bg-primary shadow-brutal-sm scale-105 font-black' : isAnswered ? 'bg-surface hover:bg-cyan-200' : 'bg-white hover:bg-yellow-50'}"
      >
        {i + 1}
      </button>
    {/each}
  </div>
</div>
