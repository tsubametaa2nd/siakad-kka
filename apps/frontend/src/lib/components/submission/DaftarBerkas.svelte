<script lang="ts">
  import Button from '../ui/Button.svelte';
  import { formatFileSize } from '../../utils/format';

  interface Props {
    files: File[];
    progress?: number;
    uploading?: boolean;
    disabled?: boolean;
    onremove?: (index: number) => void;
  }

  let { files = [], progress = 0, uploading = false, disabled = false, onremove }: Props = $props();
</script>

{#if files.length > 0}
  <div class="flex flex-col gap-2 border-2 border-black p-3 bg-white">
    <div class="font-display font-black text-xs uppercase tracking-wider">
      Berkas Terpilih ({files.length}):
    </div>
    
    <div class="flex flex-col gap-2">
      {#each files as file, idx (file.name + idx)}
        <div class="border-2 border-black p-2.5 bg-yellow-50 flex flex-col gap-2">
          <div class="flex items-center justify-between gap-3">
            <div class="truncate">
              <span class="font-bold font-body text-xs">{file.name}</span>
              <span class="font-mono text-xs font-bold text-gray-700 ml-1">({formatFileSize(file.size)})</span>
            </div>
            {#if !uploading && !disabled && onremove}
              <Button variant="accent" size="sm" onclick={() => onremove(idx)}>
                Hapus
              </Button>
            {/if}
          </div>

          {#if uploading}
            <div class="w-full bg-gray-200 border border-black h-3 overflow-hidden rounded-none">
              <div
                class="bg-primary h-full transition-all duration-200 border-r border-black"
                style="width: {progress}%"
              ></div>
            </div>
            <div class="font-mono text-[10px] text-right font-bold">{progress}% Mengunggah...</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
