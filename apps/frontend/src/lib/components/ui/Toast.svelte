<script lang="ts">
  import { Info, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-svelte';
  import { toastStore } from '../../stores/toast.svelte';

  const toneClasses = {
    info: 'bg-surface text-black border-2 border-black shadow-brutal',
    success: 'bg-surface text-black border-2 border-black shadow-brutal',
    warning: 'bg-primary text-black border-2 border-black shadow-brutal',
    danger: 'bg-accent text-black border-2 border-black shadow-brutal'
  };

  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: XCircle
  };
</script>

<div class="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
  {#each toastStore.toasts as toast (toast.id)}
    {@const Icon = icons[toast.type] || icons.info}
    <div
      class="pointer-events-auto p-4 rounded-none flex items-start justify-between gap-3 font-body font-bold text-sm transition-all duration-100 {toneClasses[toast.type] || toneClasses.info}"
    >
      <div class="flex items-center gap-2.5">
        <Icon size={18} class="shrink-0" />
        <span>{toast.message}</span>
      </div>

      <button
        type="button"
        onclick={() => toastStore.remove(toast.id)}
        aria-label="Tutup notifikasi"
        class="font-black p-0.5 leading-none hover:opacity-75 focus:outline-none cursor-pointer"
      >
        <X size={16} />
      </button>
    </div>
  {/each}
</div>
