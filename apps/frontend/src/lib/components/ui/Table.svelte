<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    headers?: string[];
    headerSnippet?: Snippet;
    children?: Snippet;
    class?: string;
  }

  let {
    headers = [],
    headerSnippet,
    children,
    class: className = ''
  }: Props = $props();
</script>

<div class="w-full overflow-x-auto border-[3px] border-black shadow-brutal bg-white rounded-none text-black {className}">
  <table class="w-full text-left border-collapse font-body">
    <thead>
      <tr class="bg-surface border-b-[3px] border-black font-display font-black text-sm uppercase tracking-wider">
        {#if headerSnippet}
          {@render headerSnippet()}
        {:else}
          {#each headers as h}
            <th class="p-3.5 border-r-2 border-black last:border-r-0">{h}</th>
          {/each}
        {/if}
      </tr>
    </thead>
    <tbody class="divide-y-2 divide-black font-medium text-sm">
      {#if children}
        {@render children()}
      {/if}
    </tbody>
  </table>
</div>
