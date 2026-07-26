<script lang="ts">
  import Checkpoint from './Checkpoint.svelte';
  import type { MaterialBlock } from '../../api/materials';

  interface Props {
    block: MaterialBlock;
  }

  let { block }: Props = $props();

  // Extract a YouTube embed URL from various YouTube link formats
  const toEmbedUrl = (url: string): string => {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
        return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
      }
      if (u.hostname === 'youtu.be') {
        return `https://www.youtube.com/embed${u.pathname}`;
      }
    } catch {}
    return url;
  };

  const embedUrl = $derived(block.url ? toEmbedUrl(block.url) : '');

  // Auto-resize iframe height for fullhtml blocks
  let iframeEl = $state<HTMLIFrameElement | null>(null);

  const adjustIframeHeight = () => {
    if (!iframeEl) return;
    try {
      const doc = iframeEl.contentDocument || iframeEl.contentWindow?.document;
      if (doc?.body) {
        const h = Math.max(doc.body.scrollHeight, doc.documentElement?.scrollHeight || 0);
        iframeEl.style.height = Math.max(h + 40, 400) + 'px';
      }
    } catch {
      // cross-origin fallback
      iframeEl.style.height = '800px';
    }
  };

  $effect(() => {
    if (iframeEl && block.type === 'fullhtml') {
      // Observe content changes after load
      const interval = setInterval(adjustIframeHeight, 500);
      const timeout = setTimeout(() => clearInterval(interval), 10000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  });
</script>

{#if block.type === 'fullhtml'}
  <!-- Interactive full HTML material rendered in sandboxed iframe -->
  <div class="border-[3px] border-black shadow-brutal overflow-hidden bg-white">
    <iframe
      bind:this={iframeEl}
      srcdoc={block.content}
      title={block.caption || 'Materi Interaktif'}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      onload={adjustIframeHeight}
      class="w-full border-0"
      style="min-height: 600px;"
    ></iframe>
  </div>
  {#if block.caption}
    <p class="font-body text-xs font-bold text-gray-700 text-center italic mt-2">{block.caption}</p>
  {/if}

{:else if block.type === 'html'}
  <!-- UI-08-2: {@html} hanya untuk blok html dari endpoint materi -->
  <!-- UI-08-6: overflow wrapper agar tabel lebar bisa digulir di ponsel -->
  <!-- UI-08-7: gambar dibatasi max-w-full -->
  <div class="prose-block overflow-x-auto max-w-full">
    {@html block.content}
  </div>

{:else if block.type === 'video'}
  <div class="my-4 flex flex-col gap-2">
    {#if embedUrl}
      <div class="border-[3px] border-black shadow-brutal overflow-hidden">
        <iframe
          src={embedUrl}
          title={block.caption || 'Video Materi'}
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="w-full aspect-video block"
        ></iframe>
      </div>
    {/if}
    {#if block.caption}
      <p class="font-body text-xs font-bold text-gray-700 text-center italic">{block.caption}</p>
    {/if}
  </div>

{:else if block.type === 'checkpoint'}
  {#if block.question && block.options && block.answer_index !== undefined}
    <Checkpoint
      question={block.question}
      options={block.options}
      answerIndex={block.answer_index}
    />
  {/if}
{/if}

