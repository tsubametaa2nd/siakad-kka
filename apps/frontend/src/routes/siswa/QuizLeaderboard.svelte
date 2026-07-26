<script lang="ts">
  import { Trophy, Medal, Award, Zap, ArrowLeft, CheckCircle2 } from 'lucide-svelte';
  import { getStudentQuizLeaderboardApi, type QuizLeaderboardResponse, type LeaderboardEntry } from '../../lib/api/quiz';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import Badge from '../../lib/components/ui/Badge.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import Button from '../../lib/components/ui/Button.svelte';
  import { formatTimeTaken } from '../../lib/utils/date';

  interface Props {
    params?: { id?: string };
  }

  let { params = {} }: Props = $props();
  const quizId = $derived(params.id || '');

  const currentUser = (() => {
    try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  let data = $state<QuizLeaderboardResponse | null>(null);
  let loading = $state(true);
  let error = $state('');

  const breadcrumbs = $derived([
    { label: 'Beranda Siswa', href: '/siswa' },
    { label: 'Quiz Saya', href: '/siswa/quiz' },
    { label: data?.quiz_title || 'Leaderboard', href: `/siswa/quiz/${quizId}/leaderboard` },
  ]);

  $effect(() => {
    if (quizId) load();
  });

  const load = async () => {
    loading = true;
    error = '';
    try {
      data = await getStudentQuizLeaderboardApi(quizId);
    } catch (err: any) {
      error = err.message || 'Gagal memuat leaderboard';
    } finally {
      loading = false;
    }
  };

  const top3 = $derived(data?.entries.slice(0, 3) ?? []);

  const podiumOrder = $derived(() => {
    if (top3.length === 0) return [];
    const order = [];
    if (top3.length >= 2) order.push(top3[1]);
    order.push(top3[0]);
    if (top3.length >= 3) order.push(top3[2]);
    return order;
  });

  const isSelf = (entry: LeaderboardEntry) => entry.student_id === currentUser?.id;

  const getFastest = (entries: LeaderboardEntry[]) => {
    const completed = entries.filter(e => e.time_taken_seconds != null);
    if (!completed.length) return null;
    return completed.reduce((a, b) => (a.time_taken_seconds! < b.time_taken_seconds! ? a : b));
  };

  const fastest = $derived(data ? getFastest(data.entries) : null);
  const isPerfect = (e: LeaderboardEntry) => e.score === e.max_score;
</script>

<AppShell title={data?.quiz_title || 'Leaderboard Quiz'} {breadcrumbs}>
  {#if loading}
    <Skeleton height="h-96" />
  {:else if error}
    <Alert tone="danger" title="Gagal Memuat Leaderboard" message={error} onretry={load} />
  {:else if data}
    <div class="flex flex-col gap-8">

      <div class="bg-primary border-[3px] border-black shadow-brutal p-4 flex flex-wrap items-center justify-between gap-3">
        <div class="font-display font-black text-lg uppercase flex items-center gap-2">
          <Trophy size={20} /> {data.quiz_title}
        </div>
        <div class="flex items-center gap-3">
          <Badge tone="neutral">{data.entries.length} Peserta</Badge>
          <Badge tone="info">Maks. {data.max_score} Poin</Badge>
        </div>
      </div>

      {#if top3.length > 0}
        <div class="flex items-end justify-center gap-1.5 sm:gap-3 pt-4 px-1">
          {#each podiumOrder() as entry (entry.rank)}
            {@const self = isSelf(entry)}
            <div class="flex flex-col items-center gap-1.5 sm:gap-2 flex-1 max-w-[110px] sm:max-w-[160px]">
              <div class="relative">
                <div
                  class="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-[3px] flex items-center justify-center font-display font-black text-base sm:text-xl
                    {self ? 'border-primary bg-primary shadow-brutal' : 'border-black bg-white'}"
                >
                  {entry.student_name.charAt(0).toUpperCase()}
                </div>
                <span class="absolute -top-2 -right-2 text-base sm:text-lg">
                    {#if entry.rank === 1}<Trophy size={16} class="text-yellow-500 fill-yellow-500 sm:w-[20px] sm:h-[20px]" />
                    {:else if entry.rank === 2}<Medal size={16} class="text-gray-400 fill-gray-400 sm:w-[20px] sm:h-[20px]" />
                    {:else}<Award size={16} class="text-orange-400 fill-orange-400 sm:w-[20px] sm:h-[20px]" />{/if}
                </span>
              </div>
              <div class="text-center w-full">
                <div class="font-display font-black text-[10px] sm:text-xs uppercase truncate max-w-[85px] sm:max-w-[120px] mx-auto {self ? 'text-primary' : ''}">{entry.student_name}</div>
                <div class="font-mono font-bold text-xs sm:text-sm">{entry.score}</div>
                {#if entry.time_taken_seconds != null}
                  <div class="font-mono text-[10px] sm:text-xs text-gray-600">{formatTimeTaken(entry.time_taken_seconds)}</div>
                {/if}
              </div>
              <div class="w-full {entry.rank === 1 ? 'h-24 sm:h-28 bg-yellow-400' : entry.rank === 2 ? 'h-16 sm:h-20 bg-gray-300' : 'h-12 sm:h-14 bg-orange-400'} border-[3px] border-black flex items-center justify-center font-display font-black text-xs sm:text-sm shadow-brutal">
                #{entry.rank}
              </div>
            </div>
          {/each}
        </div>
      {/if}

      {#if data.entries.length === 0}
        <div class="p-8 border-[3px] border-black bg-white text-center font-body italic text-sm">
          Belum ada peserta yang menyelesaikan quiz ini.
        </div>
      {:else}
        <div class="border-[3px] border-black shadow-brutal overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-black text-white">
                <th class="p-3 text-left font-display font-black uppercase text-xs border-r border-white/20 w-12">Rank</th>
                <th class="p-3 text-left font-display font-black uppercase text-xs border-r border-white/20">Nama Siswa</th>
                <th class="p-3 text-left font-display font-black uppercase text-xs border-r border-white/20 hidden sm:table-cell">NIS</th>
                <th class="p-3 text-right font-display font-black uppercase text-xs border-r border-white/20">Skor</th>
                <th class="p-3 text-right font-display font-black uppercase text-xs">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {#each data.entries as entry (entry.student_id)}
                {@const self = isSelf(entry)}
                {@const fast = fastest?.student_id === entry.student_id}
                {@const perfect = isPerfect(entry)}
                <tr
                  class="border-b-2 border-black transition-colors
                    {self ? 'bg-primary' : entry.rank % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    hover:bg-yellow-50"
                >
                  <td class="p-3 border-r-2 border-black font-mono font-black text-center">
                    {#if entry.rank === 1}<Trophy size={16} class="inline" />{:else if entry.rank === 2}<Medal size={16} class="inline" />{:else if entry.rank === 3}<Award size={16} class="inline" />{:else}{entry.rank}{/if}
                  </td>
                  <td class="p-3 border-r-2 border-black">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-bold {self ? 'font-black' : ''}">{entry.student_name}</span>
                      {#if self}
                        <Badge tone="warning">Saya</Badge>
                      {/if}
                      {#if perfect}
                        <Badge tone="success"><CheckCircle2 size={12} class="inline mr-1" /> Sempurna</Badge>
                      {/if}
                      {#if fast}
                        <Badge tone="info"><Zap size={12} class="inline mr-1" /> Tercepat</Badge>
                      {/if}
                    </div>
                  </td>
                  <td class="p-3 border-r-2 border-black font-mono text-xs hidden sm:table-cell">{entry.identifier}</td>
                  <td class="p-3 border-r-2 border-black text-right font-mono font-black">
                    <span class="bg-black text-primary px-2 py-0.5 text-sm">{entry.score}</span>
                    <span class="text-xs text-gray-500 ml-1">/ {entry.max_score}</span>
                  </td>
                  <td class="p-3 text-right font-mono text-xs font-bold">
                    {formatTimeTaken(entry.time_taken_seconds)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      <div class="flex justify-center">
        <Button variant="surface" onclick={() => (window.location.hash = '#/siswa/quiz')}>
          <ArrowLeft size={16} class="mr-2" /> Kembali ke Daftar Quiz
        </Button>
      </div>

    </div>
  {/if}
</AppShell>
