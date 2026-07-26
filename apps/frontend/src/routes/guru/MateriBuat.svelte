<script lang="ts">
  import { FileCode, FolderUp, Link } from "lucide-svelte";
  import {
    createMaterialApi,
    type MaterialBlock,
  } from "../../lib/api/materials";
  import { getTeacherClassesApi, type ClassItem } from "../../lib/api/classes";
  import AppShell from "../../lib/components/layout/AppShell.svelte";
  import PenyusunBlok from "../../lib/components/materi/PenyusunBlok.svelte";
  import RenderBlok from "../../lib/components/materi/RenderBlok.svelte";
  import Alert from "../../lib/components/ui/Alert.svelte";
  import Button from "../../lib/components/ui/Button.svelte";
  import Card from "../../lib/components/ui/Card.svelte";
  import Input from "../../lib/components/ui/Input.svelte";
  import Select from "../../lib/components/ui/Select.svelte";
  import { toastStore } from "../../lib/stores/toast.svelte";
  import { localToUtcIso } from "../../lib/utils/date";

  let title = $state("");
  let slug = $state("");
  let classId = $state("");
  let blocks = $state<MaterialBlock[]>([]);
  let teacherClasses = $state<ClassItem[]>([]);
  let loadingClasses = $state(true);
  let submitting = $state(false);
  let isDirty = $state(false);
  let fileInputRef: HTMLInputElement | null = $state(null);

  const breadcrumbs = [
    { label: "Beranda Guru", href: "/guru" },
    { label: "Daftar Materi", href: "/guru/materi" },
    { label: "Buat Materi Baru", href: "/guru/materi/buat" },
  ];

  const classOptions = $derived([
    { value: "ALL_CLASSES", label: "SELURUH KELAS SAYA (Kirim Sekaligus)" },
    ...teacherClasses.map((c) => ({
      value: c.id,
      label: `${c.name} (${c.level})`,
    })),
  ]);

  // Track dirty state whenever blocks or title change
  $effect(() => {
    if (title || blocks.length > 0) isDirty = true;
  });

  $effect(() => {
    loadClasses();
  });

  const loadClasses = async () => {
    try {
      loadingClasses = true;
      teacherClasses = await getTeacherClassesApi();
      if (!classId) {
        classId = "ALL_CLASSES";
      }
    } catch {
      toastStore.add("Gagal memuat daftar kelas", "danger");
    } finally {
      loadingClasses = false;
    }
  };

  const handleHtmlFileUpload = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      toastStore.add('File harus berformat .html atau .htm', 'danger');
      return;
    }

    try {
      const htmlText = await file.text();
      const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      if (!title) {
        title = filenameWithoutExt.replace(/[-_]/g, ' ').toUpperCase();
      }

      blocks = [
        ...blocks,
        {
          type: 'fullhtml',   // Simpan sebagai fullhtml agar JS interaktif berjalan di iframe
          content: htmlText,
          caption: filenameWithoutExt,
        },
      ];

      toastStore.add(
        `File HTML ${file.name} berhasil diimpor sebagai materi interaktif!`,
        'success'
      );
      input.value = '';
    } catch (err: unknown) {
      toastStore.add('Gagal membaca isi file HTML', 'danger');
    }
  };

  const handleSave = async (e: Event) => {
    e.preventDefault();
    if (!title.trim() || !classId) {
      toastStore.add("Mohon isi Judul Materi dan Pilih Kelas Tujuan", "danger");
      return;
    }
    if (blocks.length === 0) {
      toastStore.add("Materi minimal harus memiliki 1 blok konten", "danger");
      return;
    }

    submitting = true;
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        class_id: classId,
        blocks,
      };
      await createMaterialApi(payload);
      toastStore.add("Materi baru berhasil diterbitkan!", "success");
      window.location.hash = `#/guru/materi`;
    } catch (err: unknown) {
      toastStore.add(
        (err as Error).message || "Gagal menyimpan materi",
        "danger",
      );
    } finally {
      submitting = false;
    }
  };
</script>

<AppShell title="Penyusun Materi Baru" {breadcrumbs}>
  <form onsubmit={handleSave} class="flex flex-col gap-6">
    <!-- Quick HTML File Upload Banner -->
    <div
      class="bg-yellow-100 border-[3px] border-black p-4 shadow-brutal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div>
        <h4
          class="font-display font-black text-sm uppercase flex items-center gap-2"
        >
          <FileCode size={18} class="shrink-0" />
          <span>Upload Berkas HTML Materi</span>
        </h4>
        <p class="font-body text-xs text-gray-800">
          Punya file HTML materi interaktif (termasuk quiz, animasi, dan JS)? Unggah langsung  materi akan ditampilkan secara utuh seperti membuka file HTML di browser.
        </p>
      </div>
      <div>
        <input
          type="file"
          accept=".html,.htm"
          bind:this={fileInputRef}
          onchange={handleHtmlFileUpload}
          class="hidden"
          id="html-file-upload"
        />
        <Button
          type="button"
          variant="primary"
          onclick={() => fileInputRef?.click()}
        >
          <span class="flex items-center gap-1.5"
            ><FolderUp size={16} /> Pilih File .HTML</span
          >
        </Button>
      </div>
    </div>

    <Card tone="surface" class="border-[3px] border-black">
      <h3 class="font-display font-black text-lg uppercase mb-4">
        Informasi Materi
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Judul Materi"
          required={true}
          bind:value={title}
          placeholder="Contoh: Bab 1 — Pengantar Algoritma"
        />
        <div>
          <Input
            label="Slug / URL Custom (opsional)"
            bind:value={slug}
            placeholder="Contoh: KKA_BAB1"
          />
          {#if slug.trim() || title.trim()}
            <span
              class="font-mono text-[10px] text-blue-700 font-bold flex items-center gap-1 mt-1"
            >
              <Link size={12} />
              <span
                >Link URL: <code class="bg-white px-1 border border-black"
                  >#/materi/{slug.trim() || title.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '')}</code
                ></span
              >
            </span>
          {/if}
        </div>
        <Select
          label="Kelas Tujuan"
          options={classOptions}
          bind:value={classId}
          disabled={loadingClasses}
        />
      </div>
    </Card>

    <!-- Two-column layout: editor left, preview right (desktop) -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Left: Block editor -->
      <div class="flex flex-col gap-4">
        <h3
          class="font-display font-black text-xl uppercase tracking-wide border-b-2 border-black pb-2"
        >
          Penyusun Blok
        </h3>
        <PenyusunBlok bind:blocks />
      </div>

      <!-- Right: Live preview (same RenderBlok used by students — UI-08-8) -->
      <div class="flex flex-col gap-4">
        <h3
          class="font-display font-black text-xl uppercase tracking-wide border-b-2 border-black pb-2 flex items-center gap-2"
        >
          <span>Pratinjau</span>
          <span class="text-xs font-body font-bold normal-case text-gray-600"
            >(tampilan sama dengan siswa)</span
          >
        </h3>
        <div
          class="border-[3px] border-black bg-white p-5 shadow-brutal min-h-40"
        >
          {#if blocks.length === 0}
            <p class="font-body text-sm italic text-gray-500">
              Pratinjau akan muncul di sini saat blok ditambahkan.
            </p>
          {:else}
            {#if title}
              <h2
                class="font-display font-black text-2xl uppercase tracking-wide mb-4 pb-2 border-b-2 border-black text-black"
              >
                {title}
              </h2>
            {/if}
            {#each blocks as block, i (i)}
              <RenderBlok {block} />
            {/each}
          {/if}
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3 border-t-2 border-black pt-4">
      <Button
        type="button"
        variant="surface"
        onclick={() => (window.location.hash = "#/guru/materi")}>Batal</Button
      >
      <Button
        type="submit"
        variant="primary"
        loading={submitting}
        disabled={!title.trim() || !classId}
      >
        Simpan Materi
      </Button>
    </div>
  </form>
</AppShell>
