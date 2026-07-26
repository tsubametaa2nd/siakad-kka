<script lang="ts">
  import type { Component } from 'svelte';

  export interface TabItem {
    id: string;
    label: string;
    icon?: string | Component<any> | any;
  }

  interface Props {
    tabs?: TabItem[];
    active?: string;
    onchange?: (id: string) => void;
    class?: string;
  }

  let {
    tabs = [],
    active = $bindable(tabs[0]?.id || ''),
    onchange,
    class: className = ''
  }: Props = $props();

  const selectTab = (id: string) => {
    active = id;
    if (onchange) onchange(id);
  };
</script>

<div class="flex items-center gap-2 border-b-[3px] border-black pb-2 overflow-x-auto max-w-full text-black {className}">
  {#each tabs as tab}
    <button
      type="button"
      onclick={() => selectTab(tab.id)}
      class="font-display font-black text-sm uppercase px-4 py-2 border-2 border-black rounded-none transition-all duration-100 cursor-pointer flex items-center gap-2 focus-visible:outline-[3px] focus-visible:outline-black focus-visible:outline-offset-2 {active === tab.id ? 'bg-primary shadow-brutal translate-y-[-2px]' : 'bg-base hover:bg-surface hover:shadow-brutal-sm'}"
    >
      {#if tab.icon}
        {#if typeof tab.icon === 'string'}
          <span>{tab.icon}</span>
        {:else}
          {@const Icon = tab.icon}
          <Icon size={16} class="shrink-0" />
        {/if}
      {/if}
      {tab.label}
    </button>
  {/each}
</div>
