<script lang="ts">
  interface BreadcrumbItem {
    label: string;
    href?: string;
  }

  interface Props {
    items?: BreadcrumbItem[];
    class?: string;
  }

  let { items = [], class: className = '' }: Props = $props();
</script>

{#if items.length > 0}
  <nav aria-label="Breadcrumb" class="font-body text-xs font-bold text-gray-700 flex items-center gap-1.5 flex-wrap mb-2 select-none {className}">
    {#each items as item, index}
      {#if index > 0}
        <span class="text-black font-black">/</span>
      {/if}

      {#if item.href && index < items.length - 1}
        {@const formattedHref = item.href.startsWith('#') ? item.href : `#${item.href}`}
        <a href={formattedHref} class="hover:text-black underline transition-colors duration-100">
          {item.label}
        </a>
      {:else}
        <span class="text-black">{item.label}</span>
      {/if}
    {/each}
  </nav>
{/if}
