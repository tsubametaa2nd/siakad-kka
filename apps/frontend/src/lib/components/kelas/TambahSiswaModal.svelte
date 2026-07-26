<script lang="ts">
  import { Search, UserPlus, Sheet } from "lucide-svelte";
  import {
    enrollStudentsApi,
    getExistingStudentsApi,
    createStudentAccountApi,
    importFromSpreadsheetApi,
    type StudentProfile,
    type SpreadsheetImportResult,
  } from "../../api/classes";
  import { toastStore } from "../../stores/toast.svelte";
  import Alert from "../ui/Alert.svelte";
  import Button from "../ui/Button.svelte";
  import Input from "../ui/Input.svelte";
  import Modal from "../ui/Modal.svelte";
  import Tabs from "../ui/Tabs.svelte";

  interface Props {
    open?: boolean;
    classId: string;
    existingEnrolledStudentIds?: string[];
    onSuccess?: () => void;
  }

  let {
    open = $bindable(false),
    classId,
    existingEnrolledStudentIds = [],
    onSuccess,
  }: Props = $props();

  let activeTab = $state("existing");
  let searchQuery = $state("");
  let existingStudents = $state<StudentProfile[]>([]);
  let selectedStudentIds = $state<string[]>([]);
  let loadingExisting = $state(false);
  let submittingEnroll = $state(false);

  let newName = $state("");
  let newIdentifier = $state("");
  let newPassword = $state("");
  let submittingNewAccount = $state(false);
  let createdAccounts = $state<
    { name: string; identifier: string; password: string }[]
  >([]);

  // Spreadsheet import state
  let spreadsheetUrl = $state("");
  let importingSpreadsheet = $state(false);
  let importResult = $state<SpreadsheetImportResult | null>(null);
  let importError = $state("");

  const modalTabs = [
    { id: "existing", label: "Pilih Siswa Ada", icon: Search },
    { id: "new", label: "Buat Akun Baru", icon: UserPlus },
    { id: "spreadsheet", label: "Import Spreadsheet", icon: Sheet },
  ];

  $effect(() => {
    if (open && activeTab === "existing") loadExistingStudents();
  });

  // Reset state saat modal dibuka
  $effect(() => {
    if (!open) {
      importResult = null;
      importError = "";
    }
  });

  const loadExistingStudents = async () => {
    loadingExisting = true;
    try {
      existingStudents = await getExistingStudentsApi();
    } catch (err: any) {
      toastStore.add(err.message || "Gagal memuat daftar siswa", "danger");
    } finally {
      loadingExisting = false;
    }
  };

  const filteredExistingStudents = $derived(
    existingStudents.filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.identifier.toLowerCase().includes(q)
      );
    }),
  );

  const toggleSelectStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      selectedStudentIds = selectedStudentIds.filter((i) => i !== id);
    } else {
      selectedStudentIds = [...selectedStudentIds, id];
    }
  };

  const handleEnrollExisting = async () => {
    if (selectedStudentIds.length === 0) return;
    submittingEnroll = true;
    try {
      await enrollStudentsApi(classId, selectedStudentIds);
      toastStore.add("Siswa berhasil ditambahkan ke kelas", "success");
      selectedStudentIds = [];
      if (onSuccess) onSuccess();
      open = false;
    } catch (err: any) {
      toastStore.add(err.message || "Gagal mendaftarkan siswa", "danger");
    } finally {
      submittingEnroll = false;
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pass = "";
    for (let i = 0; i < 8; i++)
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    newPassword = pass;
  };

  const handleCreateNewAccount = async (e: Event) => {
    e.preventDefault();
    if (!newName || !newIdentifier || !newPassword || submittingNewAccount)
      return;

    submittingNewAccount = true;
    try {
      const newStudent = await createStudentAccountApi({
        name: newName,
        identifier: newIdentifier,
        password: newPassword,
      });
      await enrollStudentsApi(classId, [newStudent.id]);
      createdAccounts = [
        ...createdAccounts,
        { name: newName, identifier: newIdentifier, password: newPassword },
      ];
      toastStore.add(
        `Akun ${newName} berhasil dibuat & didaftarkan`,
        "success",
      );
      newName = "";
      newIdentifier = "";
      newPassword = "";
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toastStore.add(err.message || "Gagal membuat akun siswa", "danger");
    } finally {
      submittingNewAccount = false;
    }
  };

  const handleImportSpreadsheet = async (e: Event) => {
    e.preventDefault();
    if (!spreadsheetUrl.trim() || importingSpreadsheet) return;
    importResult = null;
    importError = "";
    importingSpreadsheet = true;
    try {
      importResult = await importFromSpreadsheetApi(
        classId,
        spreadsheetUrl.trim(),
      );
      if (importResult.enrolled > 0 && onSuccess) onSuccess();
      if (importResult.created > 0 || importResult.skipped > 0) {
        toastStore.add(
          `Import selesai: ${importResult.enrolled} siswa didaftarkan ke kelas`,
          "success",
        );
      }
    } catch (err: any) {
      importError = err.message || "Gagal mengimpor spreadsheet";
    } finally {
      importingSpreadsheet = false;
    }
  };
</script>

<Modal bind:open title="Tambah Siswa ke Kelas" class="max-w-2xl">
  <div class="flex flex-col gap-4">
    <Tabs tabs={modalTabs} bind:active={activeTab} />

    {#if activeTab === "existing"}
      <div class="flex flex-col gap-3">
        <Input
          placeholder="Cari nama atau NIS siswa..."
          bind:value={searchQuery}
        />
        {#if loadingExisting}
          <p class="font-body text-sm">Memuat daftar siswa...</p>
        {:else if filteredExistingStudents.length === 0}
          <p class="font-body text-sm italic text-gray-700">
            Tidak ada siswa ditemukan.
          </p>
        {:else}
          <div
            class="max-h-60 overflow-y-auto border-2 border-black divide-y-2 divide-black bg-white"
          >
            {#each filteredExistingStudents as student}
              {@const isEnrolled = existingEnrolledStudentIds.includes(
                student.id,
              )}
              <label
                class="p-3 flex items-center justify-between cursor-pointer hover:bg-yellow-50"
              >
                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student.id) ||
                      isEnrolled}
                    disabled={isEnrolled}
                    onchange={() => toggleSelectStudent(student.id)}
                    class="w-4 h-4 rounded-none border-2 border-black text-black focus:ring-0"
                  />
                  <div>
                    <div class="font-display font-black text-sm">
                      {student.name}
                    </div>
                  </div>
                </div>
                {#if isEnrolled}
                  <span
                    class="font-mono text-xs text-gray-600 font-bold uppercase bg-gray-200 px-2 py-0.5 border border-black"
                    >Sudah Terdaftar</span
                  >
                {/if}
              </label>
            {/each}
          </div>
        {/if}

        <div class="flex justify-end pt-2">
          <Button
            variant="primary"
            disabled={selectedStudentIds.length === 0 || submittingEnroll}
            loading={submittingEnroll}
            onclick={handleEnrollExisting}
          >
            Tambahkan ({selectedStudentIds.length}) Siswa
          </Button>
        </div>
      </div>
    {:else if activeTab === "new"}
      <form onsubmit={handleCreateNewAccount} class="flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nama Lengkap Siswa"
            required={true}
            bind:value={newName}
            placeholder="Budi Santoso"
          />
          <Input
            label="NIS Siswa"
            required={true}
            bind:value={newIdentifier}
            placeholder="12345"
            class="font-mono"
          />
        </div>

        <div class="flex items-end gap-2">
          <Input
            label="Password Akun"
            required={true}
            bind:value={newPassword}
            placeholder="Password..."
            class="flex-1 font-mono"
          />
          <Button
            type="button"
            variant="surface"
            size="md"
            onclick={generateRandomPassword}
            class="mb-[2px]">Acak Password</Button
          >
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={submittingNewAccount}
          disabled={!newName || !newIdentifier || !newPassword}
        >
          Buat & Daftarkan Siswa
        </Button>

        {#if createdAccounts.length > 0}
          <div
            class="border-[3px] border-black bg-yellow-50 p-4 flex flex-col gap-3"
          >
            <Alert tone="warning" title="Simpan Password Akun Baru">
              Password hanya ditampilkan SATU KALI ini dan tidak bisa dilihat
              lagi setelah dialog ditutup!
            </Alert>
            <div class="font-display font-black text-sm uppercase">
              Akun Dibuat ({createdAccounts.length}):
            </div>
            <div class="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {#each createdAccounts as acc}
                <div
                  class="bg-white p-3 border-2 border-black flex items-center justify-between font-mono text-xs font-bold"
                >
                  <div>
                    <div>
                      <strong>{acc.name}</strong> (NIS: {acc.identifier})
                    </div>
                    <div class="text-accent">Password: {acc.password}</div>
                  </div>
                  <Button
                    variant="surface"
                    size="sm"
                    onclick={() => {
                      navigator.clipboard.writeText(acc.password);
                      toastStore.add("Password disalin", "info");
                    }}>Salin</Button
                  >
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </form>
    {:else}
      <!-- Tab Import Spreadsheet -->
      <form onsubmit={handleImportSpreadsheet} class="flex flex-col gap-4">
        <!-- Panduan format -->
        <div class="border-2 border-black bg-blue-50 p-4 flex flex-col gap-2">
          <div class="font-display font-black text-sm uppercase">
            Format Google Sheets yang Diperlukan:
          </div>
          <div class="font-mono text-xs font-bold">
            <div
              class="grid grid-cols-4 gap-1 border-b-2 border-black pb-1 mb-1 text-center"
            >
              <span class="border border-black px-1 bg-gray-100">A (NIS)</span>
              <span class="border border-black px-1 bg-gray-100"
                >B (Nama Siswa)</span
              >
              <span class="border border-black px-1 bg-gray-100">C (Kelas)</span
              >
              <span class="border border-black px-1 bg-gray-100"
                >D (Password)</span
              >
            </div>
            <div class="grid grid-cols-4 gap-1 text-center text-gray-600">
              <span class="border border-gray-300 px-1">12345</span>
              <span class="border border-gray-300 px-1">Nino Nakano</span>
              <span class="border border-gray-300 px-1">DKV</span>
              <span class="border border-gray-300 px-1">123456</span>
            </div>
          </div>
          <ul
            class="font-body text-xs text-gray-700 list-disc list-inside mt-1 space-y-0.5"
          >
            <li>Baris 1–2: kosong atau info bebas</li>
            <li>
              Baris 3: <strong>Header</strong> (NIS, Nama Siswa, Kelas, Password)
            </li>
            <li>Baris 4+: <strong>Data siswa</strong></li>
            <li>
              Spreadsheet harus dibagikan: <strong
                >Anyone with the link → Viewer</strong
              >
            </li>
          </ul>
        </div>

        <Input
          label="URL Google Sheets"
          required={true}
          bind:value={spreadsheetUrl}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          class="font-mono text-xs"
          hint="Salin URL lengkap dari address bar browser saat membuka spreadsheet"
        />

        {#if importError}
          <Alert tone="danger" title="Gagal Import" message={importError} />
        {/if}

        {#if importResult}
          <div
            class="border-[3px] border-black bg-green-50 p-4 flex flex-col gap-3"
          >
            <div
              class="font-display font-black text-sm uppercase text-green-800"
            >
              ✓ Import Selesai!
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-white border-2 border-black p-3 text-center">
                <div class="font-display font-black text-2xl text-black">
                  {importResult.enrolled}
                </div>
                <div class="font-mono text-xs font-bold text-gray-600">
                  DIDAFTARKAN
                </div>
              </div>
              <div class="bg-white border-2 border-black p-3 text-center">
                <div class="font-display font-black text-2xl text-green-700">
                  {importResult.created}
                </div>
                <div class="font-mono text-xs font-bold text-gray-600">
                  AKUN BARU
                </div>
              </div>
              <div class="bg-white border-2 border-black p-3 text-center">
                <div class="font-display font-black text-2xl text-blue-700">
                  {importResult.skipped}
                </div>
                <div class="font-mono text-xs font-bold text-gray-600">
                  SUDAH ADA
                </div>
              </div>
              <div class="bg-white border-2 border-black p-3 text-center">
                <div class="font-display font-black text-2xl text-red-700">
                  {importResult.failed}
                </div>
                <div class="font-mono text-xs font-bold text-gray-600">
                  GAGAL
                </div>
              </div>
            </div>

            {#if importResult.details.failed.length > 0}
              <div class="mt-1">
                <div
                  class="font-display font-black text-xs uppercase text-red-700 mb-1"
                >
                  Gagal diproses:
                </div>
                <div class="max-h-28 overflow-y-auto flex flex-col gap-1">
                  {#each importResult.details.failed as f}
                    <div
                      class="font-mono text-xs bg-red-100 border border-red-300 px-2 py-1"
                    >
                      NIS {f.nis}: {f.reason}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}

        <Button
          type="submit"
          variant="primary"
          loading={importingSpreadsheet}
          disabled={!spreadsheetUrl.trim()}
        >
          {importingSpreadsheet
            ? "Sedang Mengimpor..."
            : "Import & Daftarkan Siswa"}
        </Button>
      </form>
    {/if}
  </div>
</Modal>
