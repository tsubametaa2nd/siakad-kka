<script lang="ts">
  import { updateStudentAccountApi, type StudentProfile } from "../../api/classes";
  import { toastStore } from "../../stores/toast.svelte";
  import Button from "../ui/Button.svelte";
  import Input from "../ui/Input.svelte";
  import Modal from "../ui/Modal.svelte";

  interface Props {
    open?: boolean;
    student: StudentProfile | null;
    onSuccess?: () => void;
  }

  let { open = $bindable(false), student, onSuccess }: Props = $props();

  let editName = $state("");
  let editIdentifier = $state("");
  let newPassword = $state("");
  let submitting = $state(false);

  $effect(() => {
    if (open && student) {
      editName = student.name;
      editIdentifier = student.identifier;
      newPassword = "";
    }
  });

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pass = "";
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    newPassword = pass;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!student || !editName || !editIdentifier) return;

    submitting = true;
    try {
      const payload: any = {
        name: editName,
        identifier: editIdentifier,
      };
      if (newPassword) {
        payload.password = newPassword;
      }
      
      await updateStudentAccountApi(student.id, payload);
      toastStore.add("Data siswa berhasil diperbarui", "success");
      
      if (newPassword) {
        // Optional: show it or just inform the teacher
        navigator.clipboard.writeText(newPassword);
        toastStore.add("Password disalin ke clipboard", "info");
      }

      if (onSuccess) onSuccess();
      open = false;
    } catch (err: any) {
      toastStore.add(err.message || "Gagal memperbarui data siswa", "danger");
    } finally {
      submitting = false;
    }
  };
</script>

<Modal bind:open title="Edit Data Siswa" class="max-w-md">
  {#if student}
    <form onsubmit={handleSubmit} class="flex flex-col gap-4">
      <Input
        label="Nama Lengkap Siswa"
        required={true}
        bind:value={editName}
        placeholder="Budi Santoso"
      />
      <Input
        label="NIS Siswa"
        required={true}
        bind:value={editIdentifier}
        placeholder="12345"
        class="font-mono"
      />

      <div class="flex items-end gap-2 mt-2 pt-4 border-t-2 border-black">
        <Input
          label="Password Baru (Kosongkan jika tidak ingin diubah)"
          bind:value={newPassword}
          placeholder="Password..."
          class="flex-1 font-mono"
        />
        <Button
          type="button"
          variant="surface"
          size="md"
          onclick={generateRandomPassword}
          class="mb-[2px]">Acak</Button>
      </div>
      <p class="text-xs text-gray-600">Jika diisi, password akan diganti.</p>

      <div class="flex justify-end gap-3 mt-4">
        <Button type="button" variant="surface" onclick={() => (open = false)}>Batal</Button>
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          disabled={!editName || !editIdentifier}
        >
          Simpan Perubahan
        </Button>
      </div>
    </form>
  {/if}
</Modal>
