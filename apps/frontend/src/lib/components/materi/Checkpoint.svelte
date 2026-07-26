<script lang="ts">
  import { Lightbulb, CheckCircle2, XCircle, PartyPopper } from 'lucide-svelte';

  interface Props {
    question: string;
    options: string[];
    answerIndex: number;
  }

  let { question, options, answerIndex }: Props = $props();

  let selected = $state<number | null>(null);
  let isCorrect = $derived(selected !== null && selected === answerIndex);
  let isWrong = $derived(selected !== null && selected !== answerIndex);

  const reset = () => {
    selected = null;
  };
</script>

<div class="border-[3px] border-black bg-primary p-5 shadow-brutal flex flex-col gap-4 my-6">
  <div class="flex items-center gap-2 border-b-2 border-black pb-3">
    <Lightbulb size={20} class="shrink-0 text-black" />
    <span class="font-display font-black text-sm uppercase tracking-wide">Cek Pemahaman</span>
  </div>

  <p class="font-body font-bold text-base text-black">{question}</p>

  <div class="flex flex-col gap-2">
    {#each options as option, i (i)}
      {@const isSelected = selected === i}
      {@const showCorrect = isSelected && isCorrect}
      {@const showWrong = isSelected && isWrong}
      <button
        type="button"
        onclick={() => (selected = i)}
        class="w-full text-left p-3 border-2 border-black font-body font-bold text-sm flex items-center gap-3 transition-all duration-100 focus:outline-[3px] focus:outline-black {showCorrect ? 'bg-surface' : showWrong ? 'bg-accent' : isSelected ? 'bg-white' : 'bg-white hover:bg-yellow-100'}"
      >
        <span class="w-7 h-7 border-2 border-black flex items-center justify-center font-mono font-black text-xs shrink-0 bg-gray-100">
          {String.fromCharCode(65 + i)}
        </span>
        <span class="flex-1">{option}</span>
        {#if showCorrect}
          <span class="font-display font-black text-xs flex items-center gap-1"><CheckCircle2 size={14} /> Benar!</span>
        {:else if showWrong}
          <span class="font-display font-black text-xs flex items-center gap-1"><XCircle size={14} /> Salah</span>
        {/if}
      </button>
    {/each}
  </div>

  {#if isWrong}
    <div class="flex items-center justify-between gap-2">
      <span class="font-body text-xs font-bold text-black">Coba lagi, yuk!</span>
      <button
        type="button"
        onclick={reset}
        class="font-display font-black text-xs uppercase px-3 py-1.5 border-2 border-black bg-white hover:bg-yellow-100 transition-all duration-100 shadow-brutal-sm hover:shadow-brutal focus:outline-[3px] focus:outline-black"
      >
        Ulangi
      </button>
    </div>
  {:else if isCorrect}
    <div class="font-body text-xs font-bold text-black flex items-center gap-1.5">
      <PartyPopper size={16} />
      <span>Tepat! Lanjutkan membaca.</span>
    </div>
  {/if}
</div>
