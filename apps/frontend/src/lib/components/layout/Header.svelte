<script lang="ts">
  import { Menu } from 'lucide-svelte';
  import Button from '../ui/Button.svelte';
  import ConfirmDialog from '../ui/ConfirmDialog.svelte';
  import { authStore } from '../../stores/auth.svelte';

  interface Props {
    onToggleSidebar?: () => void;
  }

  let { onToggleSidebar }: Props = $props();

  let showLogoutConfirm = $state(false);

  const roleLabel = $derived(
    authStore.user?.role === 'teacher' ? 'Guru' : authStore.user?.role === 'student' ? 'Siswa' : '-'
  );

  const handleConfirmLogout = () => {
    showLogoutConfirm = false;
    authStore.logout();
  };
</script>

<header class="sticky top-0 z-30 bg-base border-b-[3px] border-black px-4 py-3 flex items-center justify-between gap-4 select-none">
  <div class="flex items-center gap-3">
    <button
      type="button"
      onclick={onToggleSidebar}
      aria-label="Buka menu navigasi"
      class="md:hidden p-1.5 border-2 border-black bg-surface text-black shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-[3px] focus-visible:outline-black cursor-pointer"
    >
      <Menu size={20} />
    </button>

    <div class="flex items-center gap-2">
      <span class="font-display font-black text-xl uppercase tracking-wider text-black">
        SIAKAD <span class="bg-primary px-1.5 py-0.5 border border-black text-xs">SMK</span>
      </span>
    </div>
  </div>

  {#if authStore.isAuthenticated && authStore.user}
    <div class="flex items-center gap-4">
      <div class="hidden sm:flex flex-col text-right">
        <span class="font-display font-black text-sm text-black truncate max-w-[180px]">
          {authStore.user.name}
        </span>
        <span class="font-mono text-xs font-bold text-gray-700 uppercase">
          {roleLabel}
        </span>
      </div>

      <Button
        variant="accent"
        size="sm"
        onclick={() => showLogoutConfirm = true}
        ariaLabel="Keluar dari akun"
      >
        Keluar
      </Button>
    </div>
  {/if}
</header>

<ConfirmDialog
  bind:open={showLogoutConfirm}
  title="Keluar dari Aplikasi?"
  message="Apakah Anda yakin ingin keluar dari akun Anda?"
  confirmText="Keluar"
  cancelText="Batal"
  onconfirm={handleConfirmLogout}
/>
