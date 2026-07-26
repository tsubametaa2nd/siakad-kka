<script lang="ts">
  import {
    ClipboardList,
    Trophy,
    Medal,
    Award,
    CheckCircle2,
    Zap,
    Timer,
  } from "lucide-svelte";
  import {
    getTeacherQuizResultsApi,
    getQuizLeaderboardApi,
    type TeacherQuizResultsResponse,
    type QuizLeaderboardResponse,
    type LeaderboardEntry,
    type InProgressStudent,
  } from "../../lib/api/quiz";
  import AppShell from "../../lib/components/layout/AppShell.svelte";
  import Alert from "../../lib/components/ui/Alert.svelte";
  import Badge from "../../lib/components/ui/Badge.svelte";
  import Table from "../../lib/components/ui/Table.svelte";
  import Tabs from "../../lib/components/ui/Tabs.svelte";
  import Skeleton from "../../lib/components/ui/Skeleton.svelte";
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

  const breadcrumbs = $derived([
    { label: "Beranda Guru", href: "/guru" },
    { label: "Daftar Quiz", href: "/guru/quiz" },
    {
      label: resultsData?.quiz_title || "Rekap Hasil Quiz",
      href: `/guru/quiz/${quizId}/hasil`,
    },
  ]);

  const tabItems = [
    { id: "rekap", label: "Rekap Nilai", icon: ClipboardList },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  ];

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
          </div>
          <div class="flex flex-wrap gap-2">
            <Badge tone="info"
              >{resultsData.attempted_count} dari {resultsData.total_students} Mengerjakan</Badge
            >
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
          <div class="bg-white p-3 border-2 border-black">
            <div class="font-mono text-xs text-gray-600 font-bold uppercase">
              Sudah Selesai
            </div>
            <div
              class="font-display font-black text-2xl text-emerald-700 mt-0.5"
            >
              {resultsData.attempted_count}
            </div>
          </div>
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
          <div class="bg-white p-3 border-2 border-black">
            <div class="font-mono text-xs text-gray-600 font-bold uppercase">
              Belum Mulai
            </div>
            <div class="font-display font-black text-2xl text-red-600 mt-0.5">
              {resultsData.total_students -
                resultsData.attempted_count -
                (resultsData.in_progress_count ?? 0)}
            </div>
          </div>
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
                <td class="p-3 border-r-2 border-black font-bold text-xs"
                  >{item.student_name}</td
                >
                <td class="p-3 border-r-2 border-black font-mono text-xs">
                  {item.completed_at
                    ? formatDateTimeWIB(item.completed_at)
                    : "—"}
                </td>
                <td class="p-3 font-mono font-black text-sm">
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
              </tr>
            {/each}
          </Table>
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
                          <span class="font-bold text-sm"
                            >{entry.student_name}</span
                          >
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
