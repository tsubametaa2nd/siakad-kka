<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    tone?: 'neutral' | 'info' | 'warning' | 'danger' | 'success';
    children?: Snippet;
    class?: string;
  }

  let {
    tone = 'neutral',
    children,
    class: className = ''
  }: Props = $props();

  const toneClasses = {
    neutral: 'bg-white text-black border-2 border-black',
    info: 'bg-surface text-black border-2 border-black',
    warning: 'bg-primary text-black border-2 border-black',
    danger: 'bg-accent text-black border-2 border-black',
    success: 'bg-emerald-400 text-black border-2 border-black'
  };
</script>

<span
  class="font-mono font-bold text-xs uppercase px-2.5 py-0.5 rounded-none inline-flex items-center gap-1 select-none shadow-brutal-sm {toneClasses[tone]} {className}"
>
  {#if children}
    {@render children()}
  {/if}
</span>
