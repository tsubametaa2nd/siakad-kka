<script lang="ts">
  import { Compass } from 'lucide-svelte';
  import { replace } from 'svelte-spa-router';
  import Button from '../lib/components/ui/Button.svelte';
  import Card from '../lib/components/ui/Card.svelte';
  import { authStore } from '../lib/stores/auth.svelte';

  const handleGoHome = () => {
    if (authStore.user?.role === 'teacher') {
      replace('/guru');
    } else if (authStore.user?.role === 'student') {
      replace('/siswa');
    } else {
      replace('/login');
    }
  };
</script>

<div class="min-h-screen bg-base flex items-center justify-center p-4 text-black select-none">
  <div class="w-full max-w-md">
    <Card tone="surface" title="404 Halaman Tidak Ditemukan" class="shadow-brutal-xl text-center flex flex-col items-center">
      <div class="my-6 p-4 bg-primary border-[3px] border-black shadow-brutal inline-block">
        <Compass size={64} strokeWidth={2} />
      </div>
      <p class="font-body font-bold text-base mb-6">
        Maaf, halaman yang Anda tuju tidak ditemukan atau alamat URL telah berubah.
      </p>
      {#snippet footer()}
        <Button variant="primary" size="lg" onclick={handleGoHome} class="w-full">
          Kembali ke Beranda
        </Button>
      {/snippet}
    </Card>
  </div>
</div>
