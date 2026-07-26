<script lang="ts">
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import Card from '../../lib/components/ui/Card.svelte';
  import Input from '../../lib/components/ui/Input.svelte';
  import ChangePasswordForm from '../../lib/components/auth/ChangePasswordForm.svelte';
  import { updateProfileApi } from '../../lib/api/auth';
  import { authStore } from '../../lib/stores/auth.svelte';
  import { toastStore } from '../../lib/stores/toast.svelte';

  const breadcrumbs = [
    { label: 'Beranda Siswa', href: '/siswa' },
    { label: 'Pengaturan' }
  ];

  let fullName = $state(authStore.user?.name || '');
  let loading = $state(false);
  let errorMessage = $state('');
  let successMessage = $state('');

  const handleSave = async (e: Event) => {
    e.preventDefault();
    if (!fullName.trim() || loading) return;

    loading = true;
    errorMessage = '';
    successMessage = '';

    try {
      const res = await updateProfileApi(fullName.trim());
      authStore.updateName(res.name || fullName.trim());
      successMessage = 'Nama profil berhasil diperbarui!';
      toastStore.add('Nama profil berhasil diperbarui', 'success');
    } catch (err: any) {
      errorMessage = err.message || 'Gagal memperbarui profil.';
    } finally {
      loading = false;
    }
  };
</script>

<AppShell title="Pengaturan Akun Siswa" {breadcrumbs}>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
    <Card tone="surface" title="Ubah Nama Profil">
      <form onsubmit={handleSave} class="flex flex-col gap-4">
        <Input
          label="Role (Read-only)"
          value="Siswa"
          disabled={true}
          class="bg-gray-100 cursor-not-allowed"
        />

        <Input
          label="Nama Lengkap Siswa"
          placeholder="Masukkan nama lengkap siswa..."
          bind:value={fullName}
          required={true}
          disabled={loading}
        />

        {#if errorMessage}
          <Alert tone="danger" title="Gagal Menyimpan" message={errorMessage} />
        {/if}

        {#if successMessage}
          <Alert tone="success" title="Berhasil" message={successMessage} />
        {/if}

        <div class="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            {loading}
            disabled={loading || !fullName.trim()}
          >
            {loading ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
          </Button>
        </div>
      </form>
    </Card>

    <ChangePasswordForm />
  </div>
</AppShell>
