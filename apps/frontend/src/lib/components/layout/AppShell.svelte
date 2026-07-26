<script lang="ts">
  import type { Snippet } from 'svelte';
  import Breadcrumb from './Breadcrumb.svelte';
  import Header from './Header.svelte';
  import Sidebar from './Sidebar.svelte';
  import ToastHost from '../ToastHost.svelte';

  interface BreadcrumbItem {
    label: string;
    href?: string;
  }

  interface Props {
    title?: string;
    breadcrumbs?: BreadcrumbItem[];
    headerAction?: Snippet;
    children?: Snippet;
  }

  let { title = '', breadcrumbs = [], headerAction, children }: Props = $props();

  let mobileSidebarOpen = $state(false);

  const toggleMobileSidebar = () => {
    mobileSidebarOpen = !mobileSidebarOpen;
  };

  const closeMobileSidebar = () => {
    mobileSidebarOpen = false;
  };
</script>

<div class="min-h-screen bg-base text-black flex flex-col">
  <Header onToggleSidebar={toggleMobileSidebar} />

  <div class="flex-1 flex flex-col md:flex-row">
    <Sidebar openMobile={mobileSidebarOpen} onCloseMobile={closeMobileSidebar} />

    <main class="flex-1 p-4 sm:p-6 md:p-8 w-full min-w-0">
      {#if breadcrumbs.length > 0}
        <Breadcrumb items={breadcrumbs} />
      {/if}

      {#if title || headerAction}
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-3 mb-6">
          {#if title}
            <h1 class="font-display font-black text-xl sm:text-2xl md:text-3xl uppercase tracking-wide text-black">
              {title}
            </h1>
          {/if}
          {#if headerAction}
            <div>
              {@render headerAction()}
            </div>
          {/if}
        </div>
      {/if}

      {#if children}
        {@render children()}
      {/if}
    </main>
  </div>
</div>
