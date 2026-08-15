<script lang="ts">
  import { ExternalLink } from 'lucide-svelte';

  interface Props {
    text?: string;
    class?: string;
  }

  let { text = '', class: className = '' }: Props = $props();

  interface TextToken {
    type: 'text' | 'link';
    content: string;
    href?: string;
  }

  // Tokenize text into plain text chunks and clickable link tokens
  const parseTokens = (inputText: string): TextToken[] => {
    if (!inputText) return [];

    const tokens: TextToken[] = [];
    // Regex matching:
    // 1. Markdown link: [text](url)
    // 2. HTTP/HTTPS URL: https?:\/\/[^\s<]+
    // 3. WWW URL: www\.[^\s<]+
    const combinedRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<]+)|(www\.[^\s<]+)/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = combinedRegex.exec(inputText)) !== null) {
      // Add preceding plain text
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          content: inputText.slice(lastIndex, match.index),
        });
      }

      if (match[1]) {
        // Markdown link: [label](url)
        const label = match[2];
        const url = match[3];
        tokens.push({
          type: 'link',
          content: label,
          href: url,
        });
      } else {
        // Raw URL or www URL
        let rawUrl = match[4] || match[5];
        let trailingPunctuation = '';

        // Strip trailing punctuation like .,;:!?)] from URL
        const punctMatch = rawUrl.match(/[.,;:!?)]+$/);
        if (punctMatch) {
          trailingPunctuation = punctMatch[0];
          rawUrl = rawUrl.slice(0, -trailingPunctuation.length);
        }

        let href = rawUrl;
        if (rawUrl.startsWith('www.')) {
          href = `https://${rawUrl}`;
        }

        tokens.push({
          type: 'link',
          content: rawUrl,
          href: href,
        });

        if (trailingPunctuation) {
          tokens.push({
            type: 'text',
            content: trailingPunctuation,
          });
        }
      }

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (lastIndex < inputText.length) {
      tokens.push({
        type: 'text',
        content: inputText.slice(lastIndex),
      });
    }

    return tokens;
  };

  const tokens = $derived(parseTokens(text));
</script>

<div class="whitespace-pre-line leading-relaxed {className}">
  {#each tokens as token}
    {#if token.type === 'link' && token.href}
      <a
        href={token.href}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 underline hover:bg-yellow-200 px-1 py-0.5 border border-transparent hover:border-black transition-colors rounded-none break-all cursor-pointer"
        onclick={(e) => e.stopPropagation()}
        title={`Buka tautan: ${token.href}`}
      >
        <span>{token.content}</span>
        <ExternalLink size={12} class="inline shrink-0 opacity-80" />
      </a>
    {:else}
      <span>{token.content}</span>
    {/if}
  {/each}
</div>
