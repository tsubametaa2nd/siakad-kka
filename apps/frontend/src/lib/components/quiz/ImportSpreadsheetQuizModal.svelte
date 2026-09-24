<script lang="ts">
  import {
    FileSpreadsheet,
    ExternalLink,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    RefreshCw,
    Users,
    Sparkles,
  } from "lucide-svelte";
  import {
    syncQuizGradesToSpreadsheetApi,
    getTeacherQuizResultsApi,
    type SyncQuizGradesResponse,
  } from "../../api/quiz";
  import { toastStore } from "../../stores/toast.svelte";
  import Alert from "../ui/Alert.svelte";
  import Badge from "../ui/Badge.svelte";
  import Button from "../ui/Button.svelte";
  import Input from "../ui/Input.svelte";
  import Modal from "../ui/Modal.svelte";

  interface Props {
    open?: boolean;
    quizId: string;
    quizTitle: string;
    classId?: string;
    className?: string;
    spreadsheetId?: string | null;
    spreadsheetUrl?: string | null;
    attemptedCount?: number;
    totalStudents?: number;
    onSuccess?: (result: SyncQuizGradesResponse) => void;
  }

  let {
    open = $bindable(false),
    quizId,
    quizTitle,
    classId = "",
    className = "",
    spreadsheetId = null,
    spreadsheetUrl = null,
    attemptedCount = 0,
    totalStudents = 0,
    onSuccess,
  }: Props = $props();

  let columnTitle = $state("");
  let includeAllStudents = $state(false);
  let unattemptedScore = $state(0);
  let submitting = $state(false);
  let lastSyncResult = $state<SyncQuizGradesResponse | null>(null);
  let errorMessage = $state("");

  let localAttemptedCount = $state<number | null>(null);
  let localTotalStudents = $state<number | null>(null);
  let localSpreadsheetId = $state<string | null>(null);
  let localSpreadsheetUrl = $state<string | null>(null);
  let loadingDetails = $state(false);

  const effectiveAttemptedCount = $derived(
    localAttemptedCount !== null ? localAttemptedCount : attemptedCount
  );
  const effectiveTotalStudents = $derived(
    localTotalStudents !== null ? localTotalStudents : totalStudents
  );
  const effectiveSpreadsheetId = $derived(
    localSpreadsheetId || spreadsheetId
  );
  const effectiveSpreadsheetUrl = $derived(
    lastSyncResult?.spreadsheet_url ||
      localSpreadsheetUrl ||
      spreadsheetUrl ||
      (effectiveSpreadsheetId
        ? `https://docs.google.com/spreadsheets/d/${effectiveSpreadsheetId}/edit`
        : null)
  );
  const unattemptedCount = $derived(
    Math.max(0, effectiveTotalStudents - effectiveAttemptedCount)
  );

  $effect(() => {
    if (open && quizId) {
      lastSyncResult = null;
      errorMessage = "";
      localAttemptedCount = null;
      localTotalStudents = null;
      localSpreadsheetId = null;
      localSpreadsheetUrl = null;

      // Buat default judul kolom yang rapi
      const clean = (quizTitle || "").trim();
      const isQuizPrefixed =
        clean.toLowerCase().startsWith("quiz") ||
        clean.toLowerCase().startsWith("kuis");
      columnTitle = isQuizPrefixed ? clean : `Quiz: ${clean}`;

      // Ambil detail pengerjaan quiz secara otomatis
      loadingDetails = true;
      getTeacherQuizResultsApi(quizId)
        .then((res) => {
          localAttemptedCount = res.attempted_count;
          localTotalStudents = res.total_students;
          if (res.spreadsheet_id) {
            localSpreadsheetId = res.spreadsheet_id;
            localSpreadsheetUrl = res.spreadsheet_url ?? null;
          }
        })
        .catch(() => {})
        .finally(() => {
          loadingDetails = false;
        });
    }
  });

  const handleSync = async (e: Event) => {
    e.preventDefault();
    if (!quizId || submitting) return;

    if (!columnTitle.trim()) {
      toastStore.add("Nama kolom di spreadsheet tidak boleh kosong", "danger");
      return;
    }

    submitting = true;
    errorMessage = "";
    lastSyncResult = null;

    try {
      const res = await syncQuizGradesToSpreadsheetApi(quizId, {
        column_title: columnTitle.trim(),
        include_all_students: includeAllStudents,
        unattempted_score: includeAllStudents ? Number(unattemptedScore) : null,
      });

      lastSyncResult = res;
      toastStore.add(
        `Berhasil mengimpor ${res.synced_count} nilai quiz ke Google Spreadsheet!`,
        "success"
      );
      if (onSuccess) onSuccess(res);
    } catch (err: any) {
      errorMessage =
        err.message ||
        "Gagal menyinkronkan nilai quiz ke Google Spreadsheet. Pastikan Spreadsheet sudah di-share sebagai Editor ke Email Service Account.";
      toastStore.add(errorMessage, "danger");
    } finally {
      submitting = false;
    }
  };
</script>

<Modal bind:open title="Impor Nilai Quiz ke Spreadsheet">
  <div class="flex flex-col gap-5">
    {#if !effectiveSpreadsheetId && !loadingDetails}
      <Alert
        tone="warning"
        title="Google Spreadsheet Belum Ditautkan"
        message={`Kelas ${className ? `"${className}"` : "ini"} belum memiliki ID Google Spreadsheet yang ditautkan.`}
      />

      <div class="bg-amber-50 border-2 border-black p-4 text-xs font-body text-gray-800 flex flex-col gap-2">
        <p class="font-bold flex items-center gap-1.5 text-amber-900">
          <AlertTriangle size={15} /> Langkah Menghubungkan Spreadsheet:
        </p>
        <ol class="list-decimal list-inside space-y-1 text-gray-700 pl-1">
          <li>Buka <strong>Pengaturan Kelas</strong> di menu Kelas.</li>
          <li>Masukkan ID Google Spreadsheet pada kolom yang tersedia.</li>
          <li>Pastikan dokumen spreadsheet sudah dibagikan (<em>share</em>) ke email Service Account dengan akses <strong>Editor</strong>.</li>
        </ol>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onclick={() => (open = false)}>Tutup</Button>
        {#if classId}
          <a
            href={`#/guru/kelas/${classId}`}
            onclick={() => (open = false)}
            class="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-black bg-primary text-black font-display font-black text-xs uppercase shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <span>Buka Pengaturan Kelas</span>
            <ArrowRight size={14} />
          </a>
        {/if}
      </div>
    {:else}
      <!-- Status Box Spreadsheet -->
      <div class="bg-surface border-2 border-black p-4 flex flex-col gap-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2.5">
          <div class="flex items-center gap-2">
            <div class="p-1.5 bg-emerald-100 border-2 border-black">
              <FileSpreadsheet size={18} class="text-emerald-700" />
            </div>
            <div>
              <span class="font-display font-black text-xs uppercase block text-gray-700">
                Target Google Spreadsheet
              </span>
              <span class="font-mono text-xs font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs block" title={effectiveSpreadsheetId || ""}>
                {effectiveSpreadsheetId || "Memuat..."}
              </span>
            </div>
          </div>
          {#if effectiveSpreadsheetUrl}
            <a
              href={effectiveSpreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="font-display font-bold text-xs uppercase underline flex items-center gap-1 text-blue-700 hover:text-blue-900 transition-colors"
            >
              <span>Buka Dokumen</span>
              <ExternalLink size={12} />
            </a>
          {/if}
        </div>

        <div class="flex flex-wrap items-center gap-2 pt-1">
          <Badge tone="info">
            <span class="flex items-center gap-1 font-bold">
              <Users size={12} /> {effectiveAttemptedCount} Siswa Siap Diimpor
            </span>
          </Badge>
          {#if unattemptedCount > 0}
            <Badge tone="neutral">
              {unattemptedCount} Siswa Belum Mengerjakan
            </Badge>
          {/if}
        </div>
      </div>

      {#if lastSyncResult}
        <div class="bg-emerald-50 border-2 border-emerald-600 p-4 flex flex-col gap-3">
          <div class="flex items-start gap-2 text-emerald-800">
            <CheckCircle2 size={18} class="shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <div class="font-display font-black text-sm uppercase">
                Impor Nilai Berhasil!
              </div>
              <div class="font-body text-xs mt-0.5">
                Sebanyak <strong>{lastSyncResult.synced_count} nilai siswa</strong> berhasil dimasukkan ke kolom <code>"{lastSyncResult.column_title}"</code> pada Spreadsheet kelas.
              </div>
            </div>
          </div>
          <div class="flex justify-end pt-1">
            <a
              href={lastSyncResult.spreadsheet_url}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-black bg-emerald-400 text-black font-display font-black text-xs uppercase shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <FileSpreadsheet size={14} />
              <span>Lihat Hasil di Google Spreadsheet ↗</span>
            </a>
          </div>
        </div>
      {/if}

      {#if errorMessage}
        <Alert
          tone="danger"
          title="Gagal Mengimpor Nilai"
          message={errorMessage}
        />
      {/if}

      <!-- Form Pengaturan Impor -->
      <form onsubmit={handleSync} class="flex flex-col gap-4">
        <Input
          label="Judul Kolom di Spreadsheet"
          bind:value={columnTitle}
          placeholder="Contoh: Quiz: Ekosistem"
          hint="Judul kolom ini akan otomatis dibuat atau diperbarui di baris pertama spreadsheet kelas"
          required
        />

        {#if unattemptedCount > 0}
          <div class="border-2 border-black p-3 bg-white flex flex-col gap-2.5">
            <label class="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                bind:checked={includeAllStudents}
                class="mt-1 w-4 h-4 border-2 border-black rounded-none text-primary focus:ring-0 cursor-pointer"
              />
              <div class="flex flex-col">
                <span class="font-display font-bold text-xs uppercase">
                  Sertakan juga siswa yang belum mengerjakan ({unattemptedCount} siswa)
                </span>
                <span class="font-body text-xs text-gray-600">
                  Secara default, hanya siswa yang sudah selesai yang diimpor ke sheet. Centang ini untuk mengisi nilai default bagi siswa yang belum mengerjakan.
                </span>
              </div>
            </label>

            {#if includeAllStudents}
              <div class="pl-6 pt-1">
                <Input
                  type="number"
                  label="Nilai untuk Siswa Belum Mengerjakan"
                  bind:value={unattemptedScore}
                  min={0}
                  max={100}
                  class="w-32"
                  hint="Biasanya diisi 0 untuk penanda belum mengumpulkan"
                />
              </div>
            {/if}
          </div>
        {/if}

        <div class="flex items-center justify-end gap-2 border-t-2 border-black pt-4">
          <Button variant="ghost" onclick={() => (open = false)} disabled={submitting}>
            {lastSyncResult ? "Selesai" : "Batal"}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={attemptedCount === 0 && !includeAllStudents}
          >
            <span class="flex items-center gap-1.5">
              <FileSpreadsheet size={15} />
              <span>{submitting ? "Mengimpor ke Sheets..." : "Mulai Impor ke Spreadsheet"}</span>
            </span>
          </Button>
        </div>
      </form>
    {/if}
  </div>
</Modal>
