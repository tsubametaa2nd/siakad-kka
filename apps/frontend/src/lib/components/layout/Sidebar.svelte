<script lang="ts">
  import { router } from 'svelte-spa-router';
  import { X } from 'lucide-svelte';
  import { getMenusForRole } from '../../config/menu';
  import { authStore } from '../../stores/auth.svelte';

  interface Props {
    openMobile?: boolean;
    onCloseMobile?: () => void;
  }

  let { openMobile = false, onCloseMobile }: Props = $props();

  const menus = $derived(getMenusForRole(authStore.user?.role));

  const roleLabel = $derived(
    authStore.user?.role === 'teacher'
      ? 'Guru'
      : authStore.user?.role === 'student'
        ? 'Siswa'
        : ''
  );

  const isMenuParamActive = (href: string) => {
    const path = router.location || '';
    if (href === '/guru' || href === '/siswa') {
      return path === href;
    }
    return path.startsWith(href);
  };

  const handleNavigate = () => {
    if (onCloseMobile) onCloseMobile();
  };
</script>

<!-- Desktop Sidebar -->
<aside class="hidden md:flex flex-col w-64 bg-surface border-r-[3px] border-black sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto p-4 select-none shrink-0">
  <nav class="flex flex-col gap-2">
    {#each menus as menu}
      {@const isActive = isMenuParamActive(menu.href)}
      {@const Icon = menu.icon}
      <a
        href={`#${menu.href}`}
        class="font-display font-black text-sm uppercase px-4 py-3 border-2 rounded-none transition-all duration-100 flex items-center gap-3 focus-visible:outline-[3px] focus-visible:outline-black focus-visible:outline-offset-2 {isActive ? 'bg-primary text-black border-black shadow-brutal-sm translate-x-1' : 'bg-surface text-black border-transparent hover:border-black hover:bg-base'}"
      >
        <Icon size={20} class="shrink-0" />
        <span>{menu.title}</span>
      </a>
    {/each}
  </nav>
</aside>

<!-- Mobile Drawer -->
{#if openMobile}
  <div
    class="fixed inset-0 z-40 bg-black/40 backdrop-blur-none md:hidden"
    role="button"
    tabindex="0"
    onclick={onCloseMobile}
    onkeydown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') onCloseMobile?.(); }}
  ></div>

  <aside class="fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] bg-surface border-r-[3px] border-black p-4 flex flex-col gap-4 md:hidden shadow-brutal-xl select-none">
    <div class="flex items-center justify-between border-b-2 border-black pb-3">
      <div class="flex flex-col min-w-0 pr-2">
        <span class="font-display font-black text-sm uppercase text-black truncate">{authStore.user?.name || 'Navigasi'}</span>
        {#if roleLabel}
          <span class="font-mono text-[10px] font-bold text-gray-700 uppercase tracking-wider">{roleLabel}</span>
        {/if}
      </div>
      <button
        type="button"
        onclick={onCloseMobile}
        aria-label="Tutup menu"
        class="font-black text-xl p-1 border-2 border-black bg-accent text-black shadow-brutal-sm hover:shadow-brutal focus-visible:outline-[3px] focus-visible:outline-black shrink-0"
      >
        <X size={20} />
      </button>
    </div>

    <nav class="flex flex-col gap-2">
      {#each menus as menu}
        {@const isActive = isMenuParamActive(menu.href)}
        {@const Icon = menu.icon}
        <a
          href={`#${menu.href}`}
          onclick={handleNavigate}
          class="font-display font-black text-sm uppercase px-4 py-3 border-2 rounded-none transition-all duration-100 flex items-center gap-3 focus-visible:outline-[3px] focus-visible:outline-black focus-visible:outline-offset-2 {isActive ? 'bg-primary text-black border-black shadow-brutal-sm' : 'bg-surface text-black border-transparent hover:border-black hover:bg-base'}"
        >
          <Icon size={20} class="shrink-0" />
          <span>{menu.title}</span>
        </a>
      {/each}
    </nav>
  </aside>
{/if}
