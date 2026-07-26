<script lang="ts">
  import { School } from 'lucide-svelte';
  import AppShell from '../../lib/components/layout/AppShell.svelte';
  import ClassCard from '../../lib/components/kelas/ClassCard.svelte';
  import Alert from '../../lib/components/ui/Alert.svelte';
  import EmptyState from '../../lib/components/ui/EmptyState.svelte';
  import Skeleton from '../../lib/components/ui/Skeleton.svelte';
  import { getStudentClassesApi, type ClassItem } from '../../lib/api/classes';

  let classes = $state<ClassItem[]>([]);
  let loading = $state(true);
  let error = $state('');

  const breadcrumbs = [
    { label: 'Beranda Siswa', href: '/siswa' },
    { label: 'Kelas Saya', href: '/siswa/kelas' }
  ];

  $effect(() => {
    loadStudentClasses();
  });

  const loadStudentClasses = async () => {
    loading = true;
    error = '';
    try {
      classes = await getStudentClassesApi();
    } catch (err: any) {
      error = err.message || 'Gagal memuat daftar kelas Anda.';
    } finally {
      loading = false;
    }
  };
</script>

<AppShell title="Kelas Saya" {breadcrumbs}>
  <p class="font-body font-medium text-sm text-gray-800 mb-6">
    Daftar kelas akademik yang Anda ikuti semester ini.
  </p>

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Skeleton height="h-36" />
      <Skeleton height="h-36" />
    </div>
  {:else if error}
    <Alert tone="danger" title="Gagal Memuat Data Kelas" message={error} onretry={loadStudentClasses} />
  {:else if classes.length === 0}
    <EmptyState icon={School} title="Belum Terdaftar di Kelas" description="Anda belum dimasukkan ke kelas mana pun oleh guru. Hubungi guru mata pelajaran Anda." />
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each classes as item (item.id)}
        <ClassCard {item} isTeacher={false} />
      {/each}
    </div>
  {/if}
</AppShell>
