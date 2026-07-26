<script lang="ts">
  import { Clock } from 'lucide-svelte';

  interface Props {
    expiresAtIso: string;
    ontimeout?: () => void;
    class?: string;
  }

  let { expiresAtIso, ontimeout, class: className = '' }: Props = $props();

  let remainingSec = $state(0);

  const calculateRemaining = () => {
    if (!expiresAtIso) return 0;
    const expiresTime = new Date(expiresAtIso).getTime();
    const diff = Math.floor((expiresTime - Date.now()) / 1000);
    return Math.max(0, diff);
  };

  $effect(() => {
    remainingSec = calculateRemaining();
    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      remainingSec = remaining;
      if (remaining <= 0) {
        clearInterval(timer);
        if (ontimeout) ontimeout();
      }
    }, 1000);
    return () => clearInterval(timer);
  });

  const minutes = $derived(Math.floor(remainingSec / 60));
  const seconds = $derived(remainingSec % 60);
  const formattedTime = $derived(
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  );
  const isUrgent = $derived(remainingSec > 0 && remainingSec < 120);
</script>

<div
  class="sticky top-0 z-20 border-[3px] border-black p-3 flex items-center justify-between font-mono shadow-brutal transition-colors duration-100 {isUrgent ? 'bg-accent text-black' : 'bg-surface text-black'} {className}"
>
  <div class="flex items-center gap-2">
    <Clock size={20} class="shrink-0" />
    <span class="font-display font-black text-sm uppercase">Sisa Waktu Pengerjaan:</span>
  </div>
  <div class="font-display font-black text-2xl tracking-wider">
    {formattedTime}
  </div>
</div>
