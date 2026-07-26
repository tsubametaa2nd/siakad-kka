<script lang="ts">
  import { Check } from 'lucide-svelte';
  import Button from '../ui/Button.svelte';
  import Input from '../ui/Input.svelte';
  import Textarea from '../ui/Textarea.svelte';
  import type { QuestionDraft } from '../../api/quiz';

  interface Props {
    question: QuestionDraft;
    index: number;
    total?: number;
    hasError?: boolean;
    ondelete?: () => void;
    onremove?: () => void;
    onmoveup?: () => void;
    onmovedown?: () => void;
  }

  let {
    question = $bindable(),
    index,
    total = 1,
    hasError = false,
    ondelete,
    onremove,
    onmoveup,
    onmovedown,
  }: Props = $props();

  const addOption = () => {
    if (question.options.length < 6) {
      question.options = [...question.options, ''];
    }
  };

  const removeOption = (optIdx: number) => {
    if (question.options.length <= 2) return;
    question.options = question.options.filter((_, i) => i !== optIdx);
    if (question.answer_index >= question.options.length) {
      question.answer_index = question.options.length - 1;
    }
  };

  const selectAnswerKey = (optIdx: number) => {
    question.answer_index = optIdx;
  };
</script>

<div class="border-[3px] border-black bg-white p-5 shadow-brutal flex flex-col gap-4">
  <div class="flex items-center justify-between border-b-2 border-black pb-3">
    <span class="font-display font-black text-sm uppercase">Soal #{index + 1}</span>

    <div class="flex items-center gap-2">
      <Button variant="surface" size="sm" disabled={index === 0} onclick={onmoveup}>↑</Button>
      <Button variant="surface" size="sm" disabled={index === total - 1} onclick={onmovedown}>↓</Button>
      <Button variant="accent" size="sm" onclick={ondelete}>Hapus</Button>
    </div>
  </div>

  <Textarea
    label="Pertanyaan Soal"
    required={true}
    bind:value={question.question}
    rows={3}
    placeholder="Tuliskan pertanyaan kuis di sini..."
  />

  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <span class="font-display font-black text-xs uppercase">Pilihan Jawaban (Pilih 1 Kunci):</span>
      {#if question.options.length < 6}
        <Button variant="surface" size="sm" onclick={addOption}>+ Tambah Opsi</Button>
      {/if}
    </div>

    <div class="flex flex-col gap-2">
      {#each question.options as option, optIdx (optIdx)}
        {@const isKey = question.answer_index === optIdx}
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={() => selectAnswerKey(optIdx)}
            class="px-3 py-2 border-2 border-black font-display font-black text-xs uppercase transition-all duration-100 flex items-center gap-1.5 shrink-0 {isKey ? 'bg-primary shadow-brutal-sm' : 'bg-gray-100 hover:bg-yellow-100'}"
            title="Klik untuk memilih sebagai kunci jawaban"
          >
            <span>{String.fromCharCode(65 + optIdx)}.</span>
            {#if isKey}
              <span class="flex items-center gap-1"><Check size={14} /> Kunci</span>
            {/if}
          </button>

          <Input
            value={option}
            placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}...`}
            class="flex-1 font-body text-xs"
            oninput={(e: Event) => (question.options[optIdx] = (e.target as HTMLInputElement).value)}
          />

          {#if question.options.length > 2}
            <Button type="button" variant="accent" size="sm" onclick={() => removeOption(optIdx)}>
              Hapus
            </Button>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
