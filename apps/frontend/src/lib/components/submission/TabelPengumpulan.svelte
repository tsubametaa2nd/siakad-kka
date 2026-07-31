<script lang="ts">
  import { ClipboardList, CheckCircle2, AlertTriangle, XCircle, FileText, Link, ExternalLink, PenLine, Users, ChevronDown, ChevronUp, Crown, User } from 'lucide-svelte';
  import Badge from '../ui/Badge.svelte';
  import Button from '../ui/Button.svelte';
  import Table from '../ui/Table.svelte';
  import Tabs from '../ui/Tabs.svelte';
  import { formatDateTimeWIB } from '../../utils/date';
  import { formatFileSize, triggerFileDownload } from '../../utils/format';
  import type { TeacherSubmissionRow, TeacherSubmissionsResponse } from '../../api/submissions';

  interface Props {
    data: TeacherSubmissionsResponse;
    assignmentId?: string;
    assignmentType?: 'individual' | 'group';
    ongrade?: (row: TeacherSubmissionRow) => void;
  }

  let { data, assignmentId = '', assignmentType = 'individual', ongrade }: Props = $props();

  let activeTab = $state('Sudah');
  let expandedRows = $state<Record<string, boolean>>({});

  const isGroup = $derived(assignmentType === 'group' || (data.submissions && data.submissions.some((s) => !!s.group_members)));

  const filterTabs = $derived([
    { id: 'Sudah', label: 'Sudah Mengumpulkan', icon: CheckCircle2 },
    { id: 'all', label: isGroup ? 'Semua Kelompok' : 'Semua Siswa', icon: ClipboardList },
    { id: 'Telat', label: 'Terlambat', icon: AlertTriangle },
    { id: 'Belum', label: 'Belum Mengumpulkan', icon: XCircle },
  ]);

  const filteredRows = $derived(
    (data.submissions || []).filter((s) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'Sudah') return s.status === 'Sudah' || s.status === 'Dinilai';
      return s.status === activeTab;
    })
  );

  const totalCount = $derived(data.total_groups || (data.submissions ? data.submissions.length : data.total_students));

  const statusTone = (status: string) => {
    if (status === 'Dinilai') return 'warning';
    if (status === 'Sudah') return 'info';
    if (status === 'Telat') return 'danger';
    return 'neutral';
  };

  const toggleExpand = (id: string) => {
    expandedRows = { ...expandedRows, [id]: !expandedRows[id] };
  };

  const goToGrading = (studentId?: string) => {
    if (assignmentId) {
      const targetUrl = studentId
        ? `#/guru/tugas/${assignmentId}/nilai?studentId=${encodeURIComponent(studentId)}`
        : `#/guru/tugas/${assignmentId}/nilai`;
      window.location.hash = targetUrl;
    }
  };
</script>

<div class="flex flex-col gap-4">
  <div class="bg-yellow-100 p-3.5 sm:p-4 border-[3px] border-black shadow-brutal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-black">
    <div class="font-display font-black text-sm sm:text-base uppercase text-black">
      {data.submitted_count} dari {totalCount} {isGroup ? 'kelompok' : 'siswa'} sudah mengumpulkan
    </div>
    <div class="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start flex-wrap">
      <Badge tone="info">{Math.round((data.submitted_count / (totalCount || 1)) * 100)}% Pengumpulan</Badge>
      {#if assignmentId && data.submitted_count > 0}
        <Button variant="primary" size="sm" onclick={() => goToGrading()}>
          <span class="flex items-center gap-1.5"><PenLine size={14} /> Mulai Menilai</span>
        </Button>
      {/if}
    </div>
  </div>

  <Tabs tabs={filterTabs} bind:active={activeTab} />

  {#if filteredRows.length === 0}
    <div class="p-6 border-2 border-black bg-white text-center font-body text-sm text-black italic">
      Belum ada {isGroup ? 'kelompok' : 'siswa'} untuk kategori/filter ini.
    </div>
  {:else}
    <Table headers={["No", isGroup ? "Nama Kelompok" : "Nama Siswa", "Status", "Waktu Pengumpulan", "Berkas & Tautan", "Skor", "Aksi"]}>
      {#each filteredRows as row, idx (row.student_id)}
        {@const rowKey = row.group_id || row.student_id}
        {@const isExpanded = !!expandedRows[rowKey]}
        <tr>
          <td class="p-3 border-r-2 border-black font-mono font-bold text-xs">{idx + 1}</td>
          <td class="p-3 border-r-2 border-black text-xs">
            <div class="flex flex-col gap-1">
              <span class="font-display font-black text-sm uppercase text-black">{row.group_name || row.student_name}</span>
              
              {#if row.group_members && row.group_members.length > 0}
                <button
                  type="button"
                  onclick={() => toggleExpand(rowKey)}
                  class="self-start font-mono text-[11px] font-bold text-black hover:bg-yellow-200 transition-colors flex items-center gap-1 bg-yellow-100 px-2 py-0.5 border border-black shadow-brutal-sm"
                >
                  <Users size={12} class="shrink-0" />
                  <span>{row.group_members.length} Anggota</span>
                  {#if isExpanded}
                    <ChevronUp size={12} />
                  {:else}
                    <ChevronDown size={12} />
                  {/if}
                </button>

                {#if isExpanded}
                  <div class="mt-2 p-2.5 bg-white border-2 border-black font-body text-xs flex flex-col gap-1.5 shadow-brutal-sm min-w-[220px]">
                    <span class="font-display font-black text-[10px] uppercase text-gray-500 border-b border-black pb-1 mb-0.5">Daftar Anggota Kelompok:</span>
                    {#each row.group_members as member}
                      <div class="flex items-center justify-between gap-2">
                        <span class="font-bold text-gray-900 flex items-center gap-1">
                          {#if member.is_leader}
                            <span title="Ketua Kelompok"><Crown size={13} class="text-amber-500 shrink-0" /></span>
                          {:else}
                            <User size={13} class="text-gray-400 shrink-0" />
                          {/if}
                          <span>{member.name}</span>
                        </span>
                        {#if member.identifier}
                          <span class="font-mono text-[10px] text-gray-600 font-bold">({member.identifier})</span>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/if}
              {:else if row.identifier}
                <span class="font-mono text-xs text-gray-600 font-bold">({row.identifier})</span>
              {/if}
            </div>
          </td>
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
                <a
                  href={file.url}
                  onclick={(e) => { e.preventDefault(); triggerFileDownload(file.url, file.name); }}
                  class="underline font-mono text-[11px] hover:text-accent flex items-center gap-1 cursor-pointer"
                >
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
            {#if assignmentId}
              <button
                type="button"
                onclick={() => goToGrading(row.student_id)}
                class="px-3 py-1.5 bg-primary text-black border-2 border-black font-display font-black text-xs uppercase shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform flex items-center gap-1.5"
              >
                <PenLine size={13} />
                <span>{row.score !== undefined && row.score !== null ? 'Edit Nilai' : isGroup ? 'Nilai Kelompok' : 'Nilai'}</span>
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
