<script lang="ts">
  import { ArrowUp, ArrowDown, X, Check } from 'lucide-svelte';
  import Button from '../ui/Button.svelte';
  import Input from '../ui/Input.svelte';
  import Textarea from '../ui/Textarea.svelte';
  import type { MaterialBlock } from '../../api/materials';

  interface Props {
    blocks: MaterialBlock[];
  }

  let { blocks = $bindable([]) }: Props = $props();

  const addBlock = (type: MaterialBlock['type']) => {
    const newBlock: MaterialBlock =
      type === 'checkpoint'
        ? {
            type: 'checkpoint',
            question: '',
            options: ['', ''],
            answer_index: 0
          }
        : { type: 'html', content: '' };
    blocks = [...blocks, newBlock];
  };

  const removeBlock = (idx: number) => {
    blocks = blocks.filter((_, i) => i !== idx);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const copy = [...blocks];
    [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
    blocks = copy;
  };

  const moveDown = (idx: number) => {
    if (idx === blocks.length - 1) return;
    const copy = [...blocks];
    [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
    blocks = copy;
  };

  const addCheckpointOption = (idx: number) => {
    const block = blocks[idx];
    if (block.type !== 'checkpoint') return;
    const opts = [...(block.options || []), ''];
    blocks[idx] = { ...block, options: opts };
  };

  const removeCheckpointOption = (blockIdx: number, optIdx: number) => {
    const block = blocks[blockIdx];
    if (block.type !== 'checkpoint' || !block.options) return;
    if (block.options.length <= 2) return;
    const opts = block.options.filter((_, i) => i !== optIdx);
    let ansIndex = block.answer_index ?? 0;
    if (ansIndex >= opts.length) ansIndex = opts.length - 1;
    blocks[blockIdx] = { ...block, options: opts, answer_index: ansIndex };
  };

  const typeLabel: Record<string, string> = {
    html: 'Konten HTML / Teks',
    checkpoint: 'Cek Pemahaman (Kuis Singkat)'
  };

  const typeBg: Record<string, string> = {
    html: 'bg-yellow-50',
    checkpoint: 'bg-blue-50'
  };
</script>

<div class="flex flex-col gap-6">
  <!-- Daftar blok -->
  {#if blocks.length === 0}
    <div class="p-8 border-[3px] border-dashed border-black bg-surface text-center flex flex-col items-center gap-3">
      <div class="font-display font-black text-base uppercase">Belum ada blok materi</div>
      <p class="font-body text-xs text-gray-800">
        Tambahkan blok baru menggunakan tombol di bawah untuk menyusun isi materi.
      </p>
    </div>
  {:else}
    {#each blocks as block, idx (idx)}
      <div class="border-[3px] border-black bg-white flex flex-col gap-0 shadow-brutal">
        <!-- Block header -->
        <div class="flex items-center justify-between gap-2 px-4 py-2.5 border-b-2 border-black {typeBg[block.type] || 'bg-gray-100'}">
          <span class="font-display font-black text-xs uppercase">{typeLabel[block.type] || block.type} #{idx + 1}</span>
          <div class="flex items-center gap-1.5">
            <button type="button" onclick={() => moveUp(idx)} disabled={idx === 0} aria-label="Pindah ke atas" class="border border-black p-1 font-mono text-xs bg-white hover:bg-yellow-100 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-[3px] focus:outline-black transition-all duration-100">
              <ArrowUp size={14} />
            </button>
            <button type="button" onclick={() => moveDown(idx)} disabled={idx === blocks.length - 1} aria-label="Pindah ke bawah" class="border border-black p-1 font-mono text-xs bg-white hover:bg-yellow-100 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-[3px] focus:outline-black transition-all duration-100">
              <ArrowDown size={14} />
            </button>
            <button type="button" onclick={() => removeBlock(idx)} aria-label="Hapus blok" class="border border-black p-1 font-mono text-xs bg-accent hover:opacity-80 focus:outline-[3px] focus:outline-black transition-all duration-100">
              <X size={14} />
            </button>
          </div>
        </div>

        <!-- Block editor -->
        <div class="p-4">
          {#if block.type === 'html'}
            <Textarea
              label="Konten HTML / Teks Tambahan"
              value={block.content || ''}
              rows={6}
              placeholder="Tuliskan format HTML atau paragraf teks di sini..."
              oninput={(e: Event) => {
                blocks[idx] = { ...blocks[idx], content: (e.target as HTMLTextAreaElement).value };
              }}
            />
          {:else if block.type === 'checkpoint'}
            <div class="flex flex-col gap-4">
              <Input
                label="Pertanyaan Cek Pemahaman"
                value={block.question || ''}
                placeholder="Mis: Apa fungsi dari tag <h1>?"
                oninput={(e: Event) => {
                  blocks[idx] = { ...blocks[idx], question: (e.target as HTMLInputElement).value };
                }}
              />

              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="font-display font-black text-xs uppercase">Pilihan Jawaban (Klik tombol huruf untuk kunci):</span>
                  <Button type="button" variant="surface" size="sm" onclick={() => addCheckpointOption(idx)}>
                    + Tambah Opsi
                  </Button>
                </div>

                {#each block.options || [] as _, optIdx}
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      onclick={() => (blocks[idx] = { ...blocks[idx], answer_index: optIdx })}
                      class="shrink-0 border-2 border-black px-2 py-1 text-xs font-display font-black transition-all duration-100 focus:outline-[3px] focus:outline-black flex items-center gap-1 {block.answer_index === optIdx ? 'bg-primary' : 'bg-gray-100 hover:bg-yellow-100'}"
                      title="Kunci jawaban"
                    >
                      <span>{String.fromCharCode(65 + optIdx)}</span>
                      {#if block.answer_index === optIdx}
                        <Check size={12} />
                      {/if}
                    </button>
                    <Input
                      value={block.options?.[optIdx] ?? ''}
                      placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}...`}
                      class="flex-1 text-xs"
                      oninput={(e: Event) => {
                        const opts = [...(blocks[idx].options || [])];
                        opts[optIdx] = (e.target as HTMLInputElement).value;
                        blocks[idx] = { ...blocks[idx], options: opts };
                      }}
                    />
                    {#if (block.options?.length || 0) > 2}
                      <button type="button" onclick={() => removeCheckpointOption(idx, optIdx)} aria-label="Hapus opsi" class="border border-black p-1 text-xs font-mono bg-accent hover:opacity-80 focus:outline-[3px] focus:outline-black">
                        <X size={12} />
                      </button>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  {/if}
</div>
