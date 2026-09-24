<script lang="ts">
  import {
    ClipboardList,
    Trophy,
    Medal,
    Award,
    CheckCircle2,
    Zap,
    Timer,
    UserX,
    Copy,
    Check,
    Search,
    Eye,
    FileSpreadsheet,
    ExternalLink,
    ArrowRight,
  } from "lucide-svelte";
  import {
    getTeacherQuizResultsApi,
    getQuizLeaderboardApi,
    type TeacherQuizResultsResponse,
    type QuizLeaderboardResponse,
    type LeaderboardEntry,
    type InProgressStudent,
    type UnattemptedStudent,
  } from "../../lib/api/quiz";
  import DetailJawabanSiswaModal from "../../lib/components/quiz/DetailJawabanSiswaModal.svelte";
  import ImportSpreadsheetQuizModal from "../../lib/components/quiz/ImportSpreadsheetQuizModal.svelte";
  import AppShell from "../../lib/components/layout/AppShell.svelte";
  import Alert from "../../lib/components/ui/Alert.svelte";
  import Badge from "../../lib/components/ui/Badge.svelte";
  import Button from "../../lib/components/ui/Button.svelte";
  import EmptyState from "../../lib/components/ui/EmptyState.svelte";
  import Input from "../../lib/components/ui/Input.svelte";
  import Table from "../../lib/components/ui/Table.svelte";
  import Tabs from "../../lib/components/ui/Tabs.svelte";
  import Skeleton from "../../lib/components/ui/Skeleton.svelte";
  import { toastStore } from "../../lib/stores/toast.svelte";
  import { formatDateTimeWIB } from "../../lib/utils/date";

  interface Props {
    params?: { id?: string };
  }

  let { params = {} }: Props = $props();
  const quizId = $derived(params.id || "");

  let resultsData = $state<TeacherQuizResultsResponse | null>(null);
  let leaderboardData = $state<QuizLeaderboardResponse | null>(null);
  let loading = $state(true);
  let loadingLeaderboard = $state(false);
  let error = $state("");
  let errorLeaderboard = $state("");
  let activeTab = $state<string>("rekap");
  let lastUpdated = $state<Date | null>(null);
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let searchUnattemptedQuery = $state<string>("");
  let copied = $state<boolean>(false);

  let showStudentDetailModal = $state(false);
  let selectedStudentId = $state("");
  let selectedStudentName = $state("");
  let selectedStudentIdentifier = $state("");

  let showSpreadsheetModal = $state(false);

  const openStudentDetail = (id: string, name: string, identifier: string) => {
    selectedStudentId = id;
    selectedStudentName = name;
    selectedStudentIdentifier = identifier;
    showStudentDetailModal = true;
  };

  const breadcrumbs = $derived([
    { label: "Beranda Guru", href: "/guru" },
    { label: "Daftar Quiz", href: "/guru/quiz" },
    {
      label: resultsData?.quiz_title || "Rekap Hasil Quiz",
      href: `/guru/quiz/${quizId}/hasil`,
    },
  ]);

  const unattemptedList = $derived(resultsData?.unattempted ?? []);
  const unattemptedCount = $derived(
    resultsData?.unattempted_count ??
      unattemptedList.length ??
      (resultsData ? resultsData.total_students - resultsData.attempted_count - (resultsData.in_progress_count ?? 0) : 0)
  );

  const tabItems = $derived([
    { id: "rekap", label: `Rekap Nilai (${resultsData?.attempted_count ?? 0})`, icon: ClipboardList },
    { id: "belum", label: `Belum Mengerjakan (${unattemptedCount})`, icon: UserX },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  ]);

  const copyUnattemptedNames = () => {
    if (!unattemptedList.length) return;
    const text = unattemptedList
      .map((s, idx) => `${idx + 1}. ${s.student_name} (${s.identifier})`)
      .join("\n");
    navigator.clipboard.writeText(`Daftar Siswa Belum Mengerjakan Quiz "${resultsData?.quiz_title}":\n${text}`);
    copied = true;
    toastStore.add("Daftar siswa berhasil disalin ke clipboard!", "info");
    setTimeout(() => {
      copied = false;
    }, 2500);
  };

  $effect(() => {
    if (quizId) {
      loadResults();
      // Auto-refresh setiap 15 detik
      pollInterval = setInterval(() => {
        silentRefresh();
      }, 15000);

      return () => {
        if (pollInterval) clearInterval(pollInterval);
      };
    }
  });

  $effect(() => {
    if (activeTab === "leaderboard" && quizId && !loadingLeaderboard) {
      loadLeaderboard();
    }
  });

  const loadResults = async () => {
    loading = true;
    error = "";
    try {
      resultsData = await getTeacherQuizResultsApi(quizId);
      lastUpdated = new Date();
    } catch (err: any) {
      error = err.message || "Gagal memuat rekap nilai quiz";
    } finally {
      loading = false;
    }
  };

  const silentRefresh = async () => {
    if (!quizId) return;
    try {
      const [newResults, newLeaderboard] = await Promise.all([
        getTeacherQuizResultsApi(quizId),
        activeTab === "leaderboard"
          ? getQuizLeaderboardApi(quizId)
          : Promise.resolve(leaderboardData),
      ]);
      resultsData = newResults;
      if (newLeaderboard) leaderboardData = newLeaderboard;
      lastUpdated = new Date();
    } catch {
      /* silent */
    }
  };

  const loadLeaderboard = async () => {
    loadingLeaderboard = true;
    errorLeaderboard = "";
    try {
      leaderboardData = await getQuizLeaderboardApi(quizId);
    } catch (err: any) {
      errorLeaderboard = err.message || "Gagal memuat leaderboard";
    } finally {
      loadingLeaderboard = false;
    }
  };

  const top3 = $derived(leaderboardData?.entries.slice(0, 3) ?? []);

  const podiumOrder = $derived(() => {
    if (top3.length === 0) return [];
    const order: LeaderboardEntry[] = [];
    if (top3.length >= 2) order.push(top3[1]);
    order.push(top3[0]);
    if (top3.length >= 3) order.push(top3[2]);
    return order;
  });

  const getFastest = (entries: LeaderboardEntry[]) => {
    const done = entries.filter((e) => e.time_taken_seconds != null);
    if (!done.length) return null;
    return done.reduce((a, b) =>
      a.time_taken_seconds! < b.time_taken_seconds! ? a : b,
    );
  };

  const fastest = $derived(
    leaderboardData ? getFastest(leaderboardData.entries) : null,
  );
  const isPerfect = (e: LeaderboardEntry) =>
    leaderboardData ? e.score === leaderboardData.max_score : false;

  const formatTimeTaken = (seconds: number | null) => {
    if (seconds == null) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s} dtk`;
    return `${m}m ${s}s`;
  };

  const formatLastUpdated = (d: Date | null) => {
    if (!d) return "";
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };
</script>

<AppShell
  title={resultsData?.quiz_title
    ? `Hasil Quiz: ${resultsData.quiz_title}`
    : "Hasil Quiz"}
  {breadcrumbs}
>
  {#if loading}
    <Skeleton height="h-64" />
  {:else if error}
    <Alert
      tone="danger"
      title="Gagal Memuat Hasil Quiz"
      message={error}
      onretry={loadResults}
    />
  {:else if resultsData}
    <div class="flex flex-col gap-6">
      <div
        class="flex flex-col gap-4 border-[3px] border-black bg-surface p-5 shadow-brutal"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3"
        >
          <div>
            <h2
              class="font-display font-black text-xl uppercase tracking-wider"
            >
              {resultsData.quiz_title}
            </h2>
            {#if resultsData.class_name}
              <div class="font-mono text-xs text-gray-700 font-bold mt-0.5">
                Kelas: {resultsData.class_name}
              </div>
            {/if}
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Badge tone="info"
              >{resultsData.attempted_count} dari {resultsData.total_students} Mengerjakan</Badge
            >
            <Button
              variant="primary"
              size="sm"
              onclick={() => (showSpreadsheetModal = true)}
              class="shrink-0"
            >
              <span class="flex items-center gap-1.5">
                <FileSpreadsheet size={15} />
                <span>Impor Nilai ke Spreadsheet</span>
              </span>
            </Button>
          </div>
        </div>

        <!-- Google Sheets Banner -->
        <div class="border-2 border-black bg-white p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-brutal-sm">
          <div class="flex items-start sm:items-center gap-3">
            <div class="p-2 border-2 border-black {resultsData.spreadsheet_id ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} shrink-0">
              <FileSpreadsheet size={20} />
            </div>
            <div class="flex flex-col gap-0.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-display font-black text-xs uppercase tracking-wide">Google Spreadsheet Kelas:</span>
                {#if resultsData.spreadsheet_id}
                  <Badge tone="success">Terhubung</Badge>
                  <span class="font-mono text-xs text-gray-700 font-semibold truncate max-w-[180px] sm:max-w-xs" title={resultsData.spreadsheet_id}>
                    ID: {resultsData.spreadsheet_id}
                  </span>
                {:else}
                  <Badge tone="warning">Belum Ditautkan</Badge>
                {/if}
              </div>
              <p class="font-body text-xs text-gray-700">
                {#if resultsData.spreadsheet_id}
                  Nilai quiz siswa dapat langsung diimpor ke spreadsheet kelas yang sudah tertera ini.
                {:else}
                  Tautkan Spreadsheet ID di <strong>Pengaturan Kelas</strong> agar nilai quiz dapat otomatis diimpor ke Google Sheets.
                {/if}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {#if resultsData.spreadsheet_id}
              {#if resultsData.spreadsheet_url}
                <a
                  href={resultsData.spreadsheet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-black bg-white font-display font-black text-xs uppercase shadow-brutal-sm hover:bg-gray-100 transition-colors"
                >
                  <span>Buka Sheet</span>
                  <ExternalLink size={12} />
                </a>
              {/if}
              <Button
                variant="primary"
                size="sm"
                onclick={() => (showSpreadsheetModal = true)}
              >
                <span class="flex items-center gap-1.5">
                  <FileSpreadsheet size={14} />
                  <span>Impor Sekarang</span>
                </span>
              </Button>
            {:else if resultsData.class_id}
              <a
                href={`#/guru/kelas/${resultsData.class_id}`}
                class="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-black bg-yellow-400 font-display font-black text-xs uppercase shadow-brutal-sm hover:bg-yellow-500 transition-colors"
              >
                <span>Atur di Pengaturan Kelas</span>
                <ArrowRight size={12} />
              </a>
            {/if}
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div class="bg-white p-3 border-2 border-black">
            <div class="font-mono text-xs text-gray-600 font-bold uppercase">
              Total Peserta
            </div>
            <div class="font-display font-black text-2xl mt-0.5">
              {resultsData.total_students}
            </div>
          </div>
          <button
            type="button"
            onclick={() => (activeTab = "rekap")}
            class="bg-white p-3 border-2 border-black text-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-500 transition-all {activeTab === 'rekap' ? 'bg-emerald-50 border-emerald-600' : ''}"
            title="Lihat rekap nilai siswa yang sudah selesai"
          >
            <div class="font-mono text-xs text-gray-600 font-bold uppercase">
              Sudah Selesai
            </div>
            <div
              class="font-display font-black text-2xl text-emerald-700 mt-0.5"
            >
              {resultsData.attempted_count}
            </div>
          </button>
          <div
            class="bg-amber-50 p-3 border-2 border-amber-500 relative overflow-hidden"
          >
            <div
              class="font-mono text-xs text-amber-700 font-bold uppercase flex items-center justify-center gap-1"
            >
              Sedang Mengerjakan
            </div>
            <div class="font-display font-black text-2xl text-amber-600 mt-0.5">
              {resultsData.in_progress_count ?? 0}
            </div>
          </div>
          <button
            type="button"
            onclick={() => (activeTab = "belum")}
            class="bg-white p-3 border-2 border-black text-center cursor-pointer hover:bg-red-50 hover:border-red-500 transition-all {activeTab === 'belum' ? 'bg-red-50 border-red-600' : ''}"
            title="Klik untuk melihat siapa saja yang belum mengerjakan"
          >
            <div class="font-mono text-xs text-gray-600 font-bold uppercase">
              Belum Mulai
            </div>
            <div class="font-display font-black text-2xl text-red-600 mt-0.5">
              {unattemptedCount}
            </div>
          </button>
        </div>

        <div class="pt-2">
          <Tabs tabs={tabItems} bind:active={activeTab} />
        </div>
      </div>

      {#if activeTab === "rekap"}
        <!-- Panel: Sedang Mengerjakan -->
        {#if (resultsData.in_progress?.length ?? 0) > 0}
          <div
            class="border-[3px] border-amber-500 bg-amber-50 shadow-brutal p-4"
          >
            <div
              class="flex items-center justify-between mb-3 pb-2 border-b-2 border-amber-400"
            >
              <h3
                class="font-display font-black text-sm uppercase tracking-wide text-amber-800 flex items-center gap-2"
              >
                <span
                  class="w-4 h-4 rounded-full border-2 border-amber-600 border-t-transparent animate-spin inline-block"
                ></span>
                Sedang Mengerjakan ({resultsData.in_progress?.length ?? 0} Siswa)
              </h3>
              <span
                class="flex items-center gap-1.5 bg-amber-200 border border-amber-600 px-2 py-0.5 text-xs font-bold text-amber-700"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"
                ></span>
                LIVE
              </span>
            </div>
            <div class="flex flex-wrap gap-3">
              {#each resultsData.in_progress as student (student.student_id)}
                {@const pct =
                  student.total_questions > 0
                    ? Math.round(
                        (student.answered_count / student.total_questions) *
                          100,
                      )
                    : 0}
                <div
                  class="bg-white border-2 border-amber-400 px-3 py-2.5 flex flex-col gap-1.5 text-xs min-w-[180px]"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-bold truncate"
                      >{student.student_name}</span
                    >
                    <span
                      class="text-amber-600 font-mono shrink-0 flex items-center gap-1"
                    >
                      <Timer size={10} />
                      {Math.floor((student.elapsed_seconds ?? 0) / 60)}m {(student.elapsed_seconds ??
                        0) % 60}s
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div
                      class="flex-1 h-2 bg-amber-100 border border-amber-300 overflow-hidden"
                    >
                      <div
                        class="h-full bg-amber-400 transition-all duration-500"
                        style="width: {pct}%"
                      ></div>
                    </div>
                    <span class="font-mono font-bold text-amber-700 shrink-0"
                      >{student.answered_count}/{student.total_questions}</span
                    >
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <div class="border-[3px] border-black bg-white shadow-brutal p-4">
          <div
            class="flex items-center justify-between mb-4 pb-2 border-b-2 border-black"
          >
            <h3 class="font-display font-black text-lg uppercase tracking-wide">
              Tabel Rekap Nilai Siswa
            </h3>
            <div class="flex items-center gap-2">
              <span
                class="flex items-center gap-1.5 bg-emerald-100 border border-emerald-600 px-2 py-0.5 text-xs font-bold text-emerald-700"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"
                ></span>
                LIVE
              </span>
              {#if lastUpdated}
                <span class="font-mono text-xs font-bold text-gray-600"
                  >Diperbarui: {formatLastUpdated(lastUpdated)}</span
                >
              {/if}
            </div>
          </div>

          <Table
            headers={[
              "No",
              "NIS",
              "Nama Siswa",
              "Waktu Penyelesaian",
              "Skor Akhir",
              "Aksi",
            ]}
          >
            {#each resultsData.results as item, idx (item.student_id)}
              <tr class="hover:bg-yellow-50 transition-colors">
                <td
                  class="p-3 border-r-2 border-black font-mono font-bold text-xs"
                  >{idx + 1}</td
                >
                <td
                  class="p-3 border-r-2 border-black font-mono font-bold text-xs"
                  >{item.identifier}</td
                >
                <td class="p-3 border-r-2 border-black text-xs">
                  <button
                    type="button"
                    onclick={() =>
                      openStudentDetail(
                        item.student_id,
                        item.student_name,
                        item.identifier
                      )}
                    class="text-left font-bold text-black hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1.5 group"
                    title="Klik untuk melihat analisis jawaban siswa (salah/benar)"
                  >
                    <span>{item.student_name}</span>
                    <Eye
                      size={13}
                      class="text-gray-400 group-hover:text-blue-700 transition-colors shrink-0"
                    />
                  </button>
                </td>
                <td class="p-3 border-r-2 border-black font-mono text-xs">
                  {item.completed_at
                    ? formatDateTimeWIB(item.completed_at)
                    : "—"}
                </td>
                <td class="p-3 border-r-2 border-black font-mono font-black text-sm">
                  {#if item.score !== undefined && item.score !== null}
                    <span
                      class="bg-black text-primary px-2 py-0.5 border border-black"
                      >{item.score} / {item.max_score}</span
                    >
                  {:else}
                    <span class="text-gray-400 italic text-xs font-normal"
                      >Belum ada nilai</span
                    >
                  {/if}
                </td>
                <td class="p-3 font-mono text-xs">
                  <Button
                    variant="surface"
                    size="sm"
                    onclick={() =>
                      openStudentDetail(
                        item.student_id,
                        item.student_name,
                        item.identifier
                      )}
                    class="flex items-center gap-1 text-[11px] py-1 px-2.5 font-bold"
                    title="Analisis butir soal salah & benar"
                  >
                    <Eye size={12} />
                    <span>Lihat Jawaban</span>
                  </Button>
                </td>
              </tr>
            {/each}
          </Table>
        </div>
      {/if}

      {#if activeTab === "belum"}
        {@const filteredUnattempted = unattemptedList.filter(
          (s) =>
            s.student_name.toLowerCase().includes(searchUnattemptedQuery.toLowerCase()) ||
            s.identifier.toLowerCase().includes(searchUnattemptedQuery.toLowerCase())
        )}

        <div class="border-[3px] border-black bg-white shadow-brutal p-4 sm:p-5 flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-black">
            <div>
              <h3 class="font-display font-black text-lg uppercase tracking-wide">
                Daftar Siswa Belum Mengerjakan ({unattemptedList.length} Siswa)
              </h3>
              <p class="font-body text-xs text-gray-600">
                Siswa terdaftar di kelas yang belum memulai atau belum mengirimkan jawaban kuis ini.
              </p>
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto">
              {#if unattemptedList.length > 0}
                <Button
                  variant="surface"
                  size="sm"
                  onclick={copyUnattemptedNames}
                  class="flex items-center gap-1.5"
                  title="Salin daftar siswa untuk diumumkan ke kelas"
                >
                  {#if copied}
                    <Check size={14} class="text-emerald-600" />
                    <span>Tersalin!</span>
                  {:else}
                    <Copy size={14} />
                    <span>Salin Daftar Siswa</span>
                  {/if}
                </Button>
              {/if}
            </div>
          </div>

          {#if unattemptedList.length === 0}
            <EmptyState
              icon={CheckCircle2}
              title="Semua Siswa Sudah Mengerjakan!"
              description="Seluruh siswa yang terdaftar di kelas ini sudah mulai atau menyelesaikan kuis ini."
            />
          {:else}
            <div class="w-full sm:max-w-xs">
              <Input
                placeholder="Cari NIS atau Nama Siswa..."
                bind:value={searchUnattemptedQuery}
                class="font-body text-xs"
              />
            </div>

            {#if filteredUnattempted.length === 0}
              <EmptyState
                icon={Search}
                title="Tidak Ditemukan"
                description={`Tidak ada siswa yang cocok dengan pencarian "${searchUnattemptedQuery}".`}
              />
            {:else}
              <Table headers={["No", "NIS", "Nama Siswa", "Status"]}>
                {#each filteredUnattempted as student, idx (student.student_id)}
                  <tr class="hover:bg-red-50/50 transition-colors">
                    <td class="p-3 border-r-2 border-black font-mono font-bold text-xs">{idx + 1}</td>
                    <td class="p-3 border-r-2 border-black font-mono font-bold text-xs">{student.identifier}</td>
                    <td class="p-3 border-r-2 border-black font-bold text-xs">{student.student_name}</td>
                    <td class="p-3 text-xs">
                      <Badge tone="danger">Belum Mulai</Badge>
                    </td>
                  </tr>
                {/each}
              </Table>
            {/if}
          {/if}
        </div>
      {/if}

      {#if activeTab === "leaderboard"}
        {#if loadingLeaderboard}
          <Skeleton height="h-64" />
        {:else if errorLeaderboard}
          <Alert
            tone="danger"
            title="Gagal Memuat Leaderboard"
            message={errorLeaderboard}
            onretry={loadLeaderboard}
          />
        {:else if leaderboardData}
          <div class="flex flex-col gap-8">
            {#if top3.length > 0}
              <div
                class="border-[3px] border-black bg-surface p-6 shadow-brutal"
              >
                <div
                  class="font-display font-black text-lg uppercase mb-4 text-center flex items-center justify-center gap-2"
                >
                  <Trophy size={20} />
                  <span>Podium Top 3 Peserta</span>
                  <span
                    class="flex items-center gap-1.5 bg-emerald-100 border border-emerald-600 px-2 py-0.5 text-xs font-bold text-emerald-700 ml-2"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"
                    ></span>
                    LIVE
                  </span>
                </div>
                <div class="flex items-end justify-center gap-1.5 sm:gap-4 pt-2">
                  {#each podiumOrder() as entry (entry.rank)}
                    <div
                      class="flex flex-col items-center flex-1 max-w-[110px] sm:max-w-[180px]"
                    >
                      <div
                        class="w-full bg-white border-2 border-black p-2 sm:p-3 shadow-brutal-sm text-center mb-2 flex flex-col items-center gap-1"
                      >
                        <div class="flex justify-center">
                          {#if entry.rank === 1}
                            <Trophy size={22} class="text-yellow-600 sm:w-7 sm:h-7" />
                          {:else if entry.rank === 2}
                            <Medal size={20} class="text-gray-500 sm:w-6 sm:h-6" />
                          {:else}
                            <Award size={18} class="text-amber-700 sm:w-5 sm:h-5" />
                          {/if}
                        </div>
                        <div
                          class="font-display font-black text-[10px] sm:text-xs uppercase truncate w-full"
                        >
                          {entry.student_name}
                        </div>
                        <div
                          class="font-mono font-black text-xs sm:text-sm bg-black text-primary px-1.5 sm:px-2 py-0.5 mt-1"
                        >
                          {entry.score} Pts
                        </div>
                        <div
                          class="font-mono text-[9px] sm:text-[11px] text-gray-700 font-bold"
                        >
                          {formatTimeTaken(entry.time_taken_seconds)}
                        </div>
                      </div>
                      <div
                        class="w-full border-2 border-black flex items-center justify-center font-display font-black text-black text-sm sm:text-base shadow-brutal-sm {entry.rank ===
                        1
                          ? 'h-24 sm:h-28 bg-yellow-400'
                          : entry.rank === 2
                            ? 'h-16 sm:h-20 bg-gray-300'
                            : 'h-12 sm:h-14 bg-orange-400'}"
                      >
                        #{entry.rank}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <div
              class="border-[3px] border-black bg-white shadow-brutal overflow-x-auto"
            >
              <div
                class="bg-base border-b-[3px] border-black p-4 font-display font-black text-sm uppercase flex items-center justify-between"
              >
                <span
                  >Peringkat Keseluruhan Peserta ({leaderboardData.entries
                    .length})</span
                >
              </div>

              <table class="w-full text-left font-body border-collapse">
                <thead>
                  <tr class="bg-black text-white">
                    <th
                      class="p-3 text-center font-display font-black uppercase text-xs border-r border-white/20 w-16"
                      >Rank</th
                    >
                    <th
                      class="p-3 font-display font-black uppercase text-xs border-r border-white/20"
                      >Nama Siswa</th
                    >
                    <th
                      class="p-3 font-display font-black uppercase text-xs border-r border-white/20 hidden sm:table-cell"
                      >NIS</th
                    >
                    <th
                      class="p-3 text-right font-display font-black uppercase text-xs border-r border-white/20"
                      >Skor</th
                    >
                    <th
                      class="p-3 text-right font-display font-black uppercase text-xs"
                      >Waktu</th
                    >
                  </tr>
                </thead>
                <tbody>
                  {#each leaderboardData.entries as entry (entry.student_id)}
                    {@const fast = fastest?.student_id === entry.student_id}
                    {@const perfect = isPerfect(entry)}
                    <tr
                      class="border-b-2 border-black {entry.rank % 2 === 0
                        ? 'bg-gray-50'
                        : 'bg-white'} hover:bg-yellow-50 transition-colors"
                    >
                      <td
                        class="p-3 border-r-2 border-black font-mono font-black text-center text-base"
                      >
                        {#if entry.rank === 1}
                          <Trophy size={18} class="inline text-yellow-600" />
                        {:else if entry.rank === 2}
                          <Medal size={18} class="inline text-gray-500" />
                        {:else if entry.rank === 3}
                          <Award size={18} class="inline text-amber-700" />
                        {:else}
                          <span class="text-sm">{entry.rank}</span>
                        {/if}
                      </td>
                      <td class="p-3 border-r-2 border-black">
                        <div class="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onclick={() =>
                              openStudentDetail(
                                entry.student_id,
                                entry.student_name,
                                entry.identifier
                              )}
                            class="text-left font-bold text-sm text-black hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1 group"
                            title="Klik untuk melihat analisis jawaban siswa"
                          >
                            <span>{entry.student_name}</span>
                            <Eye
                              size={12}
                              class="text-gray-400 group-hover:text-blue-700 transition-colors shrink-0"
                            />
                          </button>
                          {#if perfect}<Badge tone="success"
                              ><CheckCircle2 size={12} class="inline mr-1" /> Sempurna</Badge
                            >{/if}
                          {#if fast}<Badge tone="info"
                              ><Zap size={12} class="inline mr-1" /> Tercepat</Badge
                            >{/if}
                        </div>
                      </td>
                      <td
                        class="p-3 border-r-2 border-black font-mono text-xs hidden sm:table-cell"
                        >{entry.identifier}</td
                      >
                      <td
                        class="p-3 border-r-2 border-black text-right font-mono font-black"
                      >
                        <span class="bg-black text-primary px-2 py-0.5"
                          >{entry.score}</span
                        >
                        <span class="text-xs text-gray-500 ml-1"
                          >/ {entry.max_score}</span
                        >
                      </td>
                      <td
                        class="p-3 text-right font-mono text-xs font-bold text-gray-700"
                      >
                        {formatTimeTaken(entry.time_taken_seconds)}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</AppShell>

<DetailJawabanSiswaModal
  bind:open={showStudentDetailModal}
  {quizId}
  studentId={selectedStudentId}
  studentName={selectedStudentName}
  identifier={selectedStudentIdentifier}
/>

<ImportSpreadsheetQuizModal
  bind:open={showSpreadsheetModal}
  {quizId}
  quizTitle={resultsData?.quiz_title || ""}
  classId={resultsData?.class_id}
  className={resultsData?.class_name}
  spreadsheetId={resultsData?.spreadsheet_id}
  spreadsheetUrl={resultsData?.spreadsheet_url}
  attemptedCount={resultsData?.attempted_count || 0}
  totalStudents={resultsData?.total_students || 0}
/>

