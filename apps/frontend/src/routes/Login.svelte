<script lang="ts">
  import { replace } from "svelte-spa-router";
  import Alert from "../lib/components/ui/Alert.svelte";
  import Button from "../lib/components/ui/Button.svelte";
  import Card from "../lib/components/ui/Card.svelte";
  import Input from "../lib/components/ui/Input.svelte";
  import { authStore } from "../lib/stores/auth.svelte";

  let identifier = $state("");
  let password = $state("");
  let showPassword = $state(false);
  let loading = $state(false);
  let errorMessage = $state("");

  // Redirect if already logged in (UI-01-9)
  $effect(() => {
    if (authStore.isAuthenticated && authStore.user) {
      const target = authStore.user.role === "teacher" ? "/guru" : "/siswa";
      replace(target);
    }
  });

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    if (!identifier || !password || loading) return;

    loading = true;
    errorMessage = "";

    try {
      const user = await authStore.login(identifier, password);
      const targetUrl =
        authStore.clearRedirectUrl() ||
        (user.role === "teacher" ? "/guru" : "/siswa");
      replace(targetUrl);
    } catch (err: any) {
      errorMessage = err.message || "Gagal masuk. Silakan coba lagi.";
    } finally {
      loading = false;
    }
  };
</script>

<div
  class="min-h-screen bg-base flex items-center justify-center p-4 relative overflow-hidden text-black"
>
  <!-- Static decorative corner blocks -->
  <div
    class="hidden sm:block absolute -top-10 -left-10 w-40 h-40 bg-surface border-[3px] border-black shadow-brutal pointer-events-none"
  ></div>
  <div
    class="hidden sm:block absolute -bottom-10 -right-10 w-48 h-48 bg-accent border-[3px] border-black shadow-brutal pointer-events-none"
  ></div>

  <div class="w-full max-w-md relative z-10">
    <Card tone="base" class="shadow-brutal-xl">
      <div class="text-center mb-6 border-b-2 border-black pb-4">
        <h1
          class="font-display font-black text-4xl uppercase tracking-wider text-black"
        >
          SIAKAD
        </h1>
        <p class="font-body font-bold text-sm text-gray-800 mt-1">
          Sistem Informasi Akademik SMK
        </p>
      </div>

      <form onsubmit={handleLogin} class="flex flex-col gap-4">
        <Input
          label="NIS"
          placeholder="Masukkan NIS..."
          bind:value={identifier}
          required={true}
          disabled={loading}
          class="font-mono"
        />

        <div class="flex flex-col gap-1.5">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan password..."
            bind:value={password}
            required={true}
            disabled={loading}
          />
          <button
            type="button"
            onclick={() => (showPassword = !showPassword)}
            class="self-end text-xs font-mono font-bold uppercase underline cursor-pointer hover:text-accent focus:outline-none"
          >
            {showPassword ? "Sembunyikan Password" : "Lihat Password"}
          </button>
        </div>

        {#if errorMessage}
          <Alert tone="danger" title="Gagal Masuk" message={errorMessage} />
        {/if}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          {loading}
          disabled={loading || !identifier || !password}
          class="w-full mt-2"
        >
          {loading ? "MEMPROSES..." : "MASUK"}
        </Button>
      </form>
    </Card>
  </div>
</div>
