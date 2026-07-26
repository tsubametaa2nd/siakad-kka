<script lang="ts">
  import { BarChart3, Blocks, Settings, Folder } from 'lucide-svelte';
  import Alert from '../lib/components/ui/Alert.svelte';
  import Badge from '../lib/components/ui/Badge.svelte';
  import Button from '../lib/components/ui/Button.svelte';
  import Card from '../lib/components/ui/Card.svelte';
  import ConfirmDialog from '../lib/components/ui/ConfirmDialog.svelte';
  import EmptyState from '../lib/components/ui/EmptyState.svelte';
  import Dropdown from '../lib/components/ui/Dropdown.svelte';
  import FileInput from '../lib/components/ui/FileInput.svelte';
  import Input from '../lib/components/ui/Input.svelte';
  import Modal from '../lib/components/ui/Modal.svelte';
  import Select from '../lib/components/ui/Select.svelte';
  import Skeleton from '../lib/components/ui/Skeleton.svelte';
  import Table from '../lib/components/ui/Table.svelte';
  import Tabs from '../lib/components/ui/Tabs.svelte';
  import Textarea from '../lib/components/ui/Textarea.svelte';
  import Toast from '../lib/components/ui/Toast.svelte';
  import { toastStore } from '../lib/stores/toast.svelte';

  let activeTab = $state('overview');
  let inputValue = $state('Teks Contoh');
  let inputError = $state('Format tidak valid');
  let textareaValue = $state('Isi deskripsi lengkap...');
  let selectValue = $state('tkj');
  let dropdownValue = $state('rpl');
  let uploadedFiles = $state<File[]>([]);
  let showModal = $state(false);
  let showConfirm = $state(false);
  let isSubmitting = $state(false);

  const sampleTabs = [
    { id: 'overview', label: 'Ringkasan', icon: BarChart3 },
    { id: 'components', label: 'Komponen', icon: Blocks },
    { id: 'settings', label: 'Pengaturan', icon: Settings }
  ];

  const sampleOptions = [
    { value: 'rpl', label: 'Rekayasa Perangkat Lunak' },
    { value: 'tkj', label: 'Teknik Komputer dan Jaringan' },
    { value: 'mm', label: 'Multimedia' }
  ];

  const sampleDropdownOptions = [
    { value: 'rpl', label: 'Rekayasa Perangkat Lunak', icon: Blocks, description: 'Pengembangan web dan aplikasi desktop' },
    { value: 'tkj', label: 'Teknik Komputer dan Jaringan', icon: Settings, description: 'Jaringan lunak dan administrasi server' },
    { value: 'mm', label: 'Multimedia', icon: Folder, description: 'Desain grafis dan animasi 3D' }
  ];
</script>

<Toast />

<div class="min-h-screen bg-base p-6 text-black max-w-6xl mx-auto flex flex-col gap-8 pb-20">
  <header class="border-[3px] border-black bg-surface p-6 shadow-brutal flex flex-col gap-2">
    <div class="flex items-center gap-3">
      <Badge tone="warning">FE-SPEC-00</Badge>
      <Badge tone="info">Neo-Brutalism</Badge>
    </div>
    <h1 class="font-display font-black text-3xl uppercase tracking-wider">
      SIAKAD SMK — Design System Kitchen Sink
    </h1>
    <p class="font-body font-bold text-base text-black">
      Demonstrasi 15 Komponen UI Dasar dengan Svelte 5 Runes & TailwindCSS v4 Tokens.
    </p>
  </header>

  <!-- Navigation Tabs -->
  <section>
    <Tabs tabs={sampleTabs} bind:active={activeTab} />
  </section>

  <!-- 1. Buttons -->
  <Card title="1. Button (Varian, Ukuran & Keadaan)">
    <div class="flex flex-col gap-4">
      <p class="text-sm font-bold text-gray-800">
        Aturan: Maksimal 1 tombol Primary (kuning) per layar. Destructive aksi menggunakan Accent (merah muda).
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <Button variant="primary">Primary CTA</Button>
        <Button variant="surface">Surface Button</Button>
        <Button variant="accent">Accent (Hapus)</Button>
        <Button variant="ghost">Ghost Button</Button>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <Button variant="surface" size="sm">Ukuran Kecil (sm)</Button>
        <Button variant="surface" size="md">Ukuran Sedang (md)</Button>
        <Button variant="surface" size="lg">Ukuran Besar (lg)</Button>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <Button variant="surface" loading={true}>Memuat...</Button>
        <Button variant="surface" disabled={true}>Nonaktif (Disabled)</Button>
      </div>
    </div>
  </Card>

  <!-- 2. Badges -->
  <Card tone="base" title="2. Badge (Penanda & Status)">
    <div class="flex flex-wrap items-center gap-3">
      <Badge tone="neutral">Neutral</Badge>
      <Badge tone="info">Info (Surface)</Badge>
      <Badge tone="warning">Warning (Primary)</Badge>
      <Badge tone="danger">Danger (Accent)</Badge>
      <Badge tone="success">Success (Green)</Badge>
    </div>
  </Card>

  <!-- 3. Form Controls -->
  <Card title="3. Form Inputs (Input, Textarea, Select, Dropdown, FileInput)">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Input label="Nama Lengkap" required={true} placeholder="Masukkan nama..." bind:value={inputValue} hint="Sesuai ijazah resmi" />
      <Input label="NIS / Username" required={true} value="12345" error={inputError} />
      <Textarea label="Catatan Guru" bind:value={textareaValue} rows={3} hint="Tulis umpan balik singkat" />
      <Select label="Select Biasa" required={true} options={sampleOptions} bind:value={selectValue} />
      <div class="md:col-span-2">
        <Dropdown label="Dropdown Neo Brutalism (Dengan Ikon & Deskripsi)" options={sampleDropdownOptions} bind:value={dropdownValue} hint="Mendukung ikon, deskripsi, keyboard navigation, & animasi" />
      </div>
      <div class="md:col-span-2">
        <FileInput label="Unggah Tugas (PDF / ZIP)" multiple={true} bind:files={uploadedFiles} hint="Maksimal 10MB per file" />
      </div>
    </div>
  </Card>

  <!-- 4. Alerts & Notifications -->
  <Card title="4. Alert & Toast System">
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Alert tone="info" title="Informasi" message="Pendaftaran semester baru telah dibuka." />
        <Alert tone="warning" title="Peringatan" message="Batas pengumpulan tugas tinggal 2 jam lagi." />
        <Alert tone="success" title="Berhasil" message="Data nilai berhasil disimpan ke server." />
        <Alert tone="danger" title="Galat Server" message="Koneksi terputus. Silakan coba lagi." onretry={() => toastStore.add("Mencoba ulang koneksi...", "info")} />
      </div>

      <div class="flex flex-wrap items-center gap-3 pt-2">
        <Button variant="surface" size="sm" onclick={() => toastStore.add("Informasi baru tersedia", "info")}>Trigger Toast Info</Button>
        <Button variant="surface" size="sm" onclick={() => toastStore.add("Data berhasil diperbarui!", "success")}>Trigger Toast Success</Button>
        <Button variant="surface" size="sm" onclick={() => toastStore.add("Peringatan tenggat waktu", "warning")}>Trigger Toast Warning</Button>
        <Button variant="accent" size="sm" onclick={() => toastStore.add("Gagal mengunduh berkas!", "danger")}>Trigger Toast Danger</Button>
      </div>
    </div>
  </Card>

  <!-- 5. Tables & Data Display -->
  <Card tone="base" title="5. Table (Header Surface & Pembatas Tebal)">
    <Table headers={["NIS", "Nama Siswa", "Kelas", "Status", "Nilai"]}>
      <tr>
        <td class="p-3.5 border-r-2 border-black font-mono font-bold">12345</td>
        <td class="p-3.5 border-r-2 border-black">Budi Santoso</td>
        <td class="p-3.5 border-r-2 border-black">XII RPL 1</td>
        <td class="p-3.5 border-r-2 border-black"><Badge tone="success">Sudah</Badge></td>
        <td class="p-3.5 border-r-2 border-black font-mono font-bold">95</td>
      </tr>
      <tr>
        <td class="p-3.5 border-r-2 border-black font-mono font-bold">12346</td>
        <td class="p-3.5 border-r-2 border-black">Ani Wijaya</td>
        <td class="p-3.5 border-r-2 border-black">XII RPL 1</td>
        <td class="p-3.5 border-r-2 border-black"><Badge tone="warning">Telat</Badge></td>
        <td class="p-3.5 border-r-2 border-black font-mono font-bold">80</td>
      </tr>
    </Table>
  </Card>

  <!-- 6. States (Skeleton & EmptyState) -->
  <Card title="6. States (Memuat & Kosong)">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 class="font-display font-black text-sm uppercase mb-2">Skeleton Loader (Static Gray Block)</h4>
        <div class="flex flex-col gap-2">
          <Skeleton height="h-8" width="w-3/4" />
          <Skeleton height="h-4" width="w-full" />
          <Skeleton height="h-4" width="w-5/6" />
          <Skeleton height="h-10" width="w-1/2" />
        </div>
      </div>
      <div>
        <h4 class="font-display font-black text-sm uppercase mb-2">EmptyState (Pesan + Aksi)</h4>
        <EmptyState icon={Folder} title="Belum Ada Berkas" description="Silakan unggah berkas tugas pertama Anda di sini.">
          {#snippet action()}
            <Button variant="primary" size="sm" onclick={() => toastStore.add("Membuka dialog berkas", "info")}>Unggah Berkas</Button>
          {/snippet}
        </EmptyState>
      </div>
    </div>
  </Card>

  <!-- 7. Modals & Dialogs -->
  <Card tone="base" title="7. Modals & Confirm Dialog">
    <div class="flex flex-wrap items-center gap-4">
      <Button variant="surface" onclick={() => showModal = true}>Buka Modal Biasa</Button>
      <Button variant="accent" onclick={() => showConfirm = true}>Buka Konfirmasi Hapus</Button>
    </div>
  </Card>
</div>

<!-- Modal Standard -->
<Modal bind:open={showModal} title="Detail Informasi Kelas">
  <p class="mb-4">
    Ini adalah dialog modal bergaya Neo-Brutalism. Fokus terkunci di dalam modal, tombol Esc atau klik di luar area akan menutup modal ini secara otomatis.
  </p>
  {#snippet footer()}
    <Button variant="surface" onclick={() => showModal = false}>Tutup</Button>
  {/snippet}
</Modal>

<!-- Confirm Dialog -->
<ConfirmDialog
  bind:open={showConfirm}
  title="Hapus Data Siswa?"
  message="Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."
  confirmText="Ya, Hapus"
  cancelText="Batal"
  loading={isSubmitting}
  onconfirm={() => {
    isSubmitting = true;
    setTimeout(() => {
      isSubmitting = false;
      showConfirm = false;
      toastStore.add("Data berhasil dihapus!", "success");
    }, 1000);
  }}
/>
