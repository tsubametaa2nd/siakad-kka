<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    tone?: 'base' | 'surface';
    title?: string;
    header?: Snippet;
    children?: Snippet;
    footer?: Snippet;
    class?: string;
  }

  let {
    tone = 'surface',
    title,
    header,
    children,
    footer,
    class: className = ''
  }: Props = $props();

  const toneClasses = {
    base: 'bg-base text-black',
    surface: 'bg-surface text-black'
  };
</script>

<div
  class="border-[3px] border-black shadow-brutal rounded-none p-5 text-black {toneClasses[tone]} {className}"
>
  {#if header}
    <div class="border-b-2 border-black pb-3 mb-4 font-display font-black text-xl">
      {@render header()}
    </div>
  {:else if title}
    <div class="border-b-2 border-black pb-3 mb-4 font-display font-black text-xl">
      {title}
    </div>
  {/if}

  {#if children}
    <div class="font-body font-medium">
      {@render children()}
    </div>
  {/if}

  {#if footer}
    <div class="border-t-2 border-black pt-3 mt-4 flex items-center justify-end gap-3">
      {@render footer()}
    </div>
  {/if}
</div>
