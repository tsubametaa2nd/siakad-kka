<script lang="ts">
  import Alert from '../ui/Alert.svelte';
  import Button from '../ui/Button.svelte';
  import Card from '../ui/Card.svelte';
  import Input from '../ui/Input.svelte';
  import { changePasswordApi } from '../../api/auth';
  import { toastStore } from '../../stores/toast.svelte';

  let oldPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');

  let loading = $state(false);
  let errorMessage = $state('');
  let successMessage = $state('');

  const handleChangePassword = async (e: Event) => {
    e.preventDefault();
    errorMessage = '';
    successMessage = '';

    if (!oldPassword) {
      errorMessage = 'Password saat ini wajib diisi';
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      errorMessage = 'Password baru minimal 6 karakter';
      return;
    }

    if (newPassword !== confirmPassword) {
      errorMessage = 'Konfirmasi password baru tidak cocok';
      return;
    }

    loading = true;

    try {
      const res = await changePasswordApi(oldPassword, newPassword);
      successMessage = res.message || 'Password berhasil diperbarui!';
      toastStore.add('Password berhasil diperbarui', 'success');
      oldPassword = '';
      newPassword = '';
      confirmPassword = '';
    } catch (err: any) {
      errorMessage = err.message || 'Gagal memperbarui password.';
    } finally {
      loading = false;
    }
  };
</script>

<Card tone="surface" title="Ganti Password Akun">
  <form onsubmit={handleChangePassword} class="flex flex-col gap-4">
    <Input
      type="password"
      label="Password Saat Ini"
      placeholder="Masukkan password saat ini..."
      bind:value={oldPassword}
      required={true}
      disabled={loading}
    />

    <Input
      type="password"
      label="Password Baru (min. 6 karakter)"
      placeholder="Masukkan password baru..."
      bind:value={newPassword}
      required={true}
      disabled={loading}
    />

    <Input
      type="password"
      label="Konfirmasi Password Baru"
      placeholder="Ulangi password baru..."
      bind:value={confirmPassword}
      required={true}
      disabled={loading}
    />

    {#if errorMessage}
      <Alert tone="danger" title="Gagal Mengubah Password" message={errorMessage} />
    {/if}

    {#if successMessage}
      <Alert tone="success" title="Berhasil" message={successMessage} />
    {/if}

    <div class="flex justify-end pt-2">
      <Button
        type="submit"
        variant="accent"
        size="md"
        {loading}
        disabled={loading || !oldPassword || !newPassword || !confirmPassword}
      >
        {loading ? 'MEMPROSES...' : 'PERBARUI PASSWORD'}
      </Button>
    </div>
  </form>
</Card>
