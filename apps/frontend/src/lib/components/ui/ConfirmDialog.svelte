<script lang="ts">
  import Button from './Button.svelte';
  import Modal from './Modal.svelte';

  interface Props {
    open?: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    onconfirm?: () => void;
    oncancel?: () => void;
  }

  let {
    open = $bindable(false),
    title = 'Konfirmasi Tindakan',
    message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
    confirmText = 'Hapus',
    cancelText = 'Batal',
    loading = false,
    onconfirm,
    oncancel
  }: Props = $props();

  const handleConfirm = () => {
    if (onconfirm) onconfirm();
  };

  const handleCancel = () => {
    open = false;
    if (oncancel) oncancel();
  };
</script>

<Modal bind:open {title} onclose={handleCancel}>
  <p class="font-body font-medium text-base text-black">
    {message}
  </p>

  <div class="flex items-center justify-end gap-3 pt-4 border-t-2 border-black bg-base mt-2 shrink-0">
    <Button variant="surface" size="md" disabled={loading} onclick={handleCancel}>
      {cancelText}
    </Button>
    <Button variant="accent" size="md" {loading} onclick={handleConfirm}>
      {confirmText}
    </Button>
  </div>
</Modal>
