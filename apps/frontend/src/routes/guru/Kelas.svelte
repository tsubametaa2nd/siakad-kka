<script lang="ts">
  import { School } from "lucide-svelte";
  import AppShell from "../../lib/components/layout/AppShell.svelte";
  import ClassCard from "../../lib/components/kelas/ClassCard.svelte";
  import Alert from "../../lib/components/ui/Alert.svelte";
  import Button from "../../lib/components/ui/Button.svelte";
  import EmptyState from "../../lib/components/ui/EmptyState.svelte";
  import Input from "../../lib/components/ui/Input.svelte";
  import Modal from "../../lib/components/ui/Modal.svelte";
  import Select from "../../lib/components/ui/Select.svelte";
  import Skeleton from "../../lib/components/ui/Skeleton.svelte";
  import {
    createClassApi,
    getTeacherClassesApi,
    type ClassItem,
  } from "../../lib/api/classes";
  import { toastStore } from "../../lib/stores/toast.svelte";

  let classes = $state<ClassItem[]>([]);
  let loading = $state(true);
  let error = $state("");

  // Modal Create Class
  let showModal = $state(false);
  let name = $state("");
  let level = $state("X");
  let academicYear = $state("2026/2027");
  let spreadsheetId = $state("");
  let submitting = $state(false);

  const levelOptions = [
    { value: "X", label: "Tingkat X (Kelas 10)" },
    { value: "XI", label: "Tingkat XI (Kelas 11)" },
    { value: "XII", label: "Tingkat XII (Kelas 12)" },
  ];

  const breadcrumbs = [
    { label: "Beranda Guru", href: "/guru" },
    { label: "Daftar Kelas", href: "/guru/kelas" },
  ];

  $effect(() => {
    loadClasses();
  });

  const loadClasses = async () => {
    loading = true;
    error = "";
    try {
      classes = await getTeacherClassesApi();
    } catch (err: any) {
      error = err.message || "Gagal memuat daftar kelas.";
    } finally {
      loading = false;
    }
  };

  const handleCreateClass = async (e: Event) => {
    e.preventDefault();
    if (!name || !level || !academicYear || submitting) return;

    submitting = true;
    try {
      const created = await createClassApi({
        name,
        level,
        academicYear,
        spreadsheetId: spreadsheetId.trim() || undefined,
      });

      classes = [created, ...classes];
      toastStore.add(`Kelas ${name} berhasil dibuat`, "success");
      showModal = false;
      name = "";
      spreadsheetId = "";
    } catch (err: any) {
      toastStore.add(err.message || "Gagal membuat kelas baru", "danger");
    } finally {
      submitting = false;
    }
  };
</script>

<AppShell title="Daftar Kelas Guru" {breadcrumbs}>
  <div class="flex items-center justify-between gap-4 mb-6">
    <p class="font-body font-medium text-sm text-gray-800">
      Kelola kelas, daftarkan siswa, dan atur tautan Google Sheets sinkronisasi
      nilai.
    </p>
    <Button variant="primary" size="md" onclick={() => (showModal = true)}>
      + Buat Kelas
    </Button>
  </div>

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Skeleton height="h-40" />
      <Skeleton height="h-40" />
      <Skeleton height="h-40" />
    </div>
  {:else if error}
    <Alert
      tone="danger"
      title="Gagal Memuat Data"
      message={error}
      onretry={loadClasses}
    />
  {:else if classes.length === 0}
    <EmptyState
      icon={School}
      title="Belum Ada Kelas"
      description="Anda belum membuat kelas akademik. Buat kelas pertama Anda sekarang."
    >
      {#snippet action()}
        <Button variant="primary" onclick={() => (showModal = true)}
          >+ Buat Kelas Pertama</Button
        >
      {/snippet}
    </EmptyState>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each classes as item (item.id)}
        <ClassCard {item} isTeacher={true} />
      {/each}
    </div>
  {/if}
</AppShell>

<Modal bind:open={showModal} title="Buat Kelas Baru">
  <form onsubmit={handleCreateClass} class="flex flex-col gap-4">
    <Input
      label="Nama Kelas"
      required={true}
      bind:value={name}
      placeholder="Contoh: XII RPL 1"
    />

    <div class="grid grid-cols-2 gap-4">
      <Select
        label="Tingkat Kelas"
        required={true}
        options={levelOptions}
        bind:value={level}
      />
      <Input
        label="Tahun Ajaran"
        required={true}
        bind:value={academicYear}
        placeholder="Contoh: 2026/2027"
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Input
        label="ID Spreadsheet Google Sheets (Opsional)"
        bind:value={spreadsheetId}
        placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
        class="font-mono text-xs"
        hint="Ambil dari URL Google Sheet: docs.google.com/spreadsheets/d/[ID_SPREADSHEET]/edit"
      />
      <Alert tone="info" class="mt-1 text-xs">
        <strong>Pengingat:</strong> Pastikan Anda telah membagikan akses
        <strong>Editor</strong> pada Google Sheet tersebut ke alamat email Service
        Account agar nilai dapat tersinkron otomatis.
      </Alert>
    </div>

    <div
      class="flex items-center justify-end gap-3 pt-4 border-t-2 border-black sticky bottom-0 bg-base mt-2"
    >
      <Button
        variant="surface"
        type="button"
        onclick={() => (showModal = false)}>Batal</Button
      >
      <Button
        variant="primary"
        type="submit"
        loading={submitting}
        disabled={!name || !level || !academicYear}>Simpan Kelas</Button
      >
    </div>
  </form>
</Modal>
