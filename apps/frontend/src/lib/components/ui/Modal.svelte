<script lang="ts">
  import type { Snippet } from 'svelte';
  import { X } from 'lucide-svelte';

  interface Props {
    open?: boolean;
    title?: string;
    onclose?: () => void;
    children?: Snippet;
    footer?: Snippet;
    class?: string;
  }

  let {
    open = $bindable(false),
    title = '',
    onclose,
    children,
    footer,
    class: className = ''
  }: Props = $props();

  let modalEl = $state<HTMLDivElement | null>(null);

  const close = () => {
    open = false;
    if (onclose) onclose();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      close();
    }
  };
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-none transition-opacity duration-100"
    role="presentation"
    onclick={(e) => { if (e.target === e.currentTarget) close(); }}
    onkeydown={() => {}}
  >
    <div
      bind:this={modalEl}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      class="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg bg-base text-black border-[3px] border-black shadow-brutal-xl rounded-none p-4 sm:p-6 relative flex flex-col max-h-[92vh] overflow-hidden {className}"
    >
      <div class="flex items-center justify-between border-b-2 border-black pb-3 shrink-0">
        <h2 id="modal-title" class="font-display font-black text-xl uppercase tracking-wide">
          {title}
        </h2>
        <button
          type="button"
          onclick={close}
          aria-label="Tutup modal"
          class="font-black p-1 border-2 border-black bg-accent text-black shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-[3px] focus-visible:outline-black cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {#if children}
        <div class="font-body font-medium my-2 overflow-y-auto pr-1 flex-1 flex flex-col gap-4">
          {@render children()}
        </div>
      {/if}

      {#if footer}
        <div class="border-t-2 border-black pt-4 flex items-center justify-end gap-3 shrink-0">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
