<script lang="ts">
  import { ClipboardList, CheckCircle2, AlertTriangle, XCircle, FileText, Link, ExternalLink, PenLine } from 'lucide-svelte';
  import Badge from '../ui/Badge.svelte';
  import Button from '../ui/Button.svelte';
  import Table from '../ui/Table.svelte';
  import Tabs from '../ui/Tabs.svelte';
  import { formatDateTimeWIB } from '../../utils/date';
  import { formatFileSize } from '../../utils/format';
  import type { TeacherSubmissionRow, TeacherSubmissionsResponse } from '../../api/submissions';

  interface Props {
    data: TeacherSubmissionsResponse;
    assignmentId?: string;
    ongrade?: (row: TeacherSubmissionRow) => void;
  }

  let { data, assignmentId = '', ongrade }: Props = $props();

  let activeTab = $state('Sudah');

  const filterTabs = [
    { id: 'Sudah', label: 'Sudah Mengumpulkan', icon: CheckCircle2 },
    { id: 'all', label: 'Semua Siswa', icon: ClipboardList },
    { id: 'Telat', label: 'Terlambat', icon: AlertTriangle },
    { id: 'Belum', label: 'Belum Mengumpulkan', icon: XCircle },
  ];

  const filteredRows = $derived(
    (data.submissions || []).filter((s) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'Sudah') return s.status === 'Sudah' || s.status === 'Dinilai';
      return s.status === activeTab;
    })
  );

  const statusTone = (status: string) => {
    if (status === 'Dinilai') return 'warning';
    if (status === 'Sudah') return 'info';
    if (status === 'Telat') return 'danger';
    return 'neutral';
  };

  const goToGrading = () => {
    if (assignmentId) {
      window.location.hash = `#/guru/tugas/${assignmentId}/nilai`;
    }
  };
</script>

<div class="flex flex-col gap-4">
  <div class="bg-yellow-100 p-4 border-[3px] border-black shadow-brutal flex items-center justify-between text-black">
    <div class="font-display font-black text-base uppercase text-black">
      {data.submitted_count} dari {data.total_students} siswa sudah mengumpulkan
    </div>
    <div class="flex items-center gap-2">
      <Badge tone="info">{Math.round((data.submitted_count / (data.total_students || 1)) * 100)}% Pengumpulan</Badge>
      {#if assignmentId && data.submitted_count > 0}
        <Button variant="primary" size="sm" onclick={goToGrading}>
          <span class="flex items-center gap-1.5"><PenLine size={14} /> Mulai Menilai</span>
        </Button>
      {/if}
    </div>
  </div>

  <Tabs tabs={filterTabs} bind:active={activeTab} />

  {#if filteredRows.length === 0}
    <div class="p-6 border-2 border-black bg-white text-center font-body text-sm italic">
      Belum ada siswa untuk kategori/filter ini.
    </div>
  {:else}
    <Table headers={["No", "Nama Siswa", "Status", "Waktu Pengumpulan", "Berkas & Tautan", "Skor", "Aksi"]}>
      {#each filteredRows as row, idx (row.student_id)}
        <tr>
          <td class="p-3 border-r-2 border-black font-mono font-bold text-xs">{idx + 1}</td>
          <td class="p-3 border-r-2 border-black font-bold text-xs">{row.student_name}</td>
          <td class="p-3 border-r-2 border-black text-xs">
            <Badge tone={statusTone(row.status)}>{row.status}</Badge>
          </td>
          <td class="p-3 border-r-2 border-black font-mono text-xs">
            {row.submitted_at ? formatDateTimeWIB(row.submitted_at) : '-'}
          </td>
          <td class="p-3 border-r-2 border-black text-xs">
            <div class="flex flex-col gap-1">
              {#if row.content}
                <div class="bg-yellow-50 p-1.5 border border-black font-body text-[11px] font-bold line-clamp-2 max-w-xs" title={row.content}>
                  💬 {row.content}
                </div>
              {/if}
              {#each row.files || [] as file}
                <a href={file.url} target="_blank" rel="noopener" class="underline font-mono text-[11px] hover:text-accent flex items-center gap-1">
                  <FileText size={13} class="shrink-0" />
                  <span>{file.name} ({formatFileSize(file.size)})</span>
                  <ExternalLink size={12} class="shrink-0" />
                </a>
              {/each}
              {#each row.links || [] as link}
                <a href={link} target="_blank" rel="noopener" class="underline font-mono text-[11px] text-blue-800 hover:text-accent truncate flex items-center gap-1 max-w-xs">
                  <Link size={13} class="shrink-0" />
                  <span class="truncate">{link}</span>
                  <ExternalLink size={12} class="shrink-0" />
                </a>
              {/each}
              {#if !row.content && (!row.files || row.files.length === 0) && (!row.links || row.links.length === 0)}
                <span class="text-gray-500 italic">-</span>
              {/if}
            </div>
          </td>
          <td class="p-3 border-r-2 border-black font-mono font-bold text-xs">
            {#if row.score !== undefined && row.score !== null}
              <span class="bg-yellow-200 px-2 py-1 border border-black font-black">{row.score}</span>
            {:else}
              <span class="text-gray-500 italic">Belum dinilai</span>
            {/if}
          </td>
          <td class="p-3 text-xs">
            {#if row.status !== 'Belum' && assignmentId}
              <button
                type="button"
                onclick={goToGrading}
                class="px-3 py-1.5 bg-primary text-black border-2 border-black font-display font-black text-xs uppercase shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform flex items-center gap-1.5"
              >
                <PenLine size={13} />
                <span>{row.score !== undefined && row.score !== null ? 'Edit Nilai' : 'Nilai'}</span>
              </button>
            {:else}
              <span class="text-gray-400 italic text-xs">-</span>
            {/if}
          </td>
        </tr>
      {/each}
    </Table>
  {/if}
</div>

