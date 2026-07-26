<script lang="ts">
  import Button from '../ui/Button.svelte';
  import Input from '../ui/Input.svelte';

  interface Props {
    links: string[];
    disabled?: boolean;
  }

  let { links = $bindable([]), disabled = false }: Props = $props();

  const addLink = () => {
    links = [...links, ''];
  };

  const removeLink = (index: number) => {
    links = links.filter((_, i) => i !== index);
  };

  const normalizeLink = (index: number, val: string) => {
    let trimmed = val.trim();
    if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = `https://${trimmed}`;
    }
    links[index] = trimmed;
  };
</script>

<div class="flex flex-col gap-3">
  <div class="flex items-center justify-between">
    <span class="font-display font-black text-xs uppercase tracking-wider">
      Tautan Lampiran (Google Drive / GitHub / YouTube):
    </span>
    {#if !disabled}
      <Button type="button" variant="surface" size="sm" onclick={addLink}>
        + Tambah Tautan
      </Button>
    {/if}
  </div>

  {#if links.length === 0}
    <p class="font-body text-xs italic text-gray-700">Belum ada tautan ditambahkan.</p>
  {:else}
    <div class="flex flex-col gap-2">
      {#each links as link, idx (idx)}
        <div class="flex items-center gap-2">
          <Input
            value={link}
            placeholder="https://drive.google.com/..."
            disabled={disabled}
            class="flex-1 font-mono text-xs"
            onblur={(e: FocusEvent) => normalizeLink(idx, (e.target as HTMLInputElement).value)}
            oninput={(e: Event) => (links[idx] = (e.target as HTMLInputElement).value)}
          />
          {#if !disabled}
            <Button type="button" variant="accent" size="sm" onclick={() => removeLink(idx)}>
              Hapus
            </Button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
