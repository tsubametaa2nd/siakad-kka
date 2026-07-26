<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Info, AlertCircle, Zap, CheckCircle2 } from 'lucide-svelte';

  interface Props {
    tone?: 'info' | 'danger' | 'warning' | 'success';
    title?: string;
    message?: string;
    onretry?: () => void;
    children?: Snippet;
    class?: string;
  }

  let {
    tone = 'info',
    title,
    message,
    onretry,
    children,
    class: className = ''
  }: Props = $props();

  const toneClasses = {
    info: 'bg-surface text-black border-[3px] border-black shadow-brutal',
    danger: 'bg-accent text-black border-[3px] border-black shadow-brutal',
    warning: 'bg-primary text-black border-[3px] border-black shadow-brutal',
    success: 'bg-emerald-400 text-black border-[3px] border-black shadow-brutal'
  };

  const icons = {
    info: Info,
    danger: AlertCircle,
    warning: Zap,
    success: CheckCircle2
  };
</script>

{const Icon = icons[tone]}
<div class="p-4 rounded-none font-body text-black flex flex-col gap-2 {toneClasses[tone]} {className}">
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <Icon size={20} class="shrink-0" />
      {#if title}
        <h4 class="font-display font-black text-base uppercase">{title}</h4>
      {/if}
    </div>
    {#if onretry}
      <button
        type="button"
        onclick={onretry}
        class="font-display font-black text-xs uppercase px-3 py-1 bg-white text-black border-2 border-black shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        Coba Lagi
      </button>
    {/if}
  </div>

  {#if message}
    <p class="font-medium text-sm">{message}</p>
  {/if}

  {#if children}
    <div class="font-medium text-sm mt-1">
      {@render children()}
    </div>
  {/if}
</div>
