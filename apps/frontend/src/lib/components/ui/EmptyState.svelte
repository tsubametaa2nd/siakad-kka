<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { Inbox } from 'lucide-svelte';

  interface Props {
    // eslint-disable-next-ok
    icon?: Component<any> | any;
    title?: string;
    description?: string;
    action?: Snippet;
    class?: string;
  }

  let {
    icon: Icon = Inbox,
    title = 'Data Kosong',
    description = 'Belum ada data yang tersedia saat ini.',
    action,
    class: className = ''
  }: Props = $props();
</script>

<div
  class="border-[3px] border-black bg-surface text-black p-8 text-center flex flex-col items-center justify-center gap-3 shadow-brutal rounded-none my-4 {className}"
>
  <div class="text-black select-none p-2 bg-base border-2 border-black shadow-brutal-sm rounded-none mb-1">
    <Icon size={36} strokeWidth={2} />
  </div>
  <h3 class="font-display font-black text-xl uppercase tracking-wide">{title}</h3>
  <p class="font-body font-medium text-sm max-w-md text-black">{description}</p>
  {#if action}
    <div class="mt-3">
      {@render action()}
    </div>
  {/if}
</div>
