<script lang="ts">
  import { FolderUp, X } from 'lucide-svelte';
  import { formatFileSize } from '../../utils/format';

  interface Props {
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    multiple?: boolean;
    accept?: string;
    maxSize?: number;
    files?: File[];
    disabled?: boolean;
    id?: string;
    class?: string;
    onchange?: (files: File[]) => void;
  }

  let {
    label,
    error: propError,
    hint,
    required = false,
    multiple = false,
    accept = '',
    maxSize = 10 * 1024 * 1024,
    files = $bindable([]),
    disabled = false,
    id = crypto.randomUUID(),
    class: className = '',
    onchange
  }: Props = $props();

  let isDragging = $state(false);
  let localError = $state('');

  const handleFileSelection = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    localError = '';
    const validFiles: File[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (maxSize && file.size > maxSize) {
        localError = `File ${file.name} melebihi ukuran maksimum (${formatFileSize(maxSize)})`;
        return;
      }
      validFiles.push(file);
    }

    if (multiple) {
      files = [...files, ...validFiles];
    } else {
      files = validFiles.slice(0, 1);
    }

    if (onchange) onchange(files);
  };

  const removeFile = (index: number) => {
    files = files.filter((_, i) => i !== index);
    if (onchange) onchange(files);
  };
</script>

<div class="flex flex-col gap-1.5 text-black {className}">
  {#if label}
    <label for={id} class="font-display font-black text-sm uppercase tracking-wide flex items-center gap-1">
      {label}
      {#if required}
        <span class="text-accent font-bold">*</span>
      {/if}
    </label>
  {/if}

  <div
    role="region"
    aria-label="Area unggah berkas"
    class="relative border-[3px] border-dashed border-black p-6 bg-white text-center cursor-pointer transition-all duration-100 {isDragging ? 'bg-yellow-100 border-solid shadow-brutal' : 'hover:bg-yellow-50'} {disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''}"
    ondragover={(e) => { e.preventDefault(); if (!disabled) isDragging = true; }}
    ondragleave={() => { isDragging = false; }}
    ondrop={(e) => {
      e.preventDefault();
      isDragging = false;
      if (!disabled) handleFileSelection(e.dataTransfer?.files || null);
    }}
  >
    <input
      {id}
      type="file"
      {multiple}
      {accept}
      {disabled}
      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      onchange={(e) => handleFileSelection((e.target as HTMLInputElement).files)}
    />

    <div class="flex flex-col items-center gap-2 pointer-events-none">
      <FolderUp size={32} class="text-black" />
      <span class="font-display font-black text-base uppercase">
        {multiple ? 'Pilih / Geser Berkas ke Sini' : 'Pilih Berkas'}
      </span>
      <span class="font-body text-xs text-gray-700">
        Maksimal {formatFileSize(maxSize)} per berkas
      </span>
    </div>
  </div>

  {#if files.length > 0}
    <div class="flex flex-col gap-1 mt-2">
      {#each files as file, i}
        <div class="flex items-center justify-between bg-surface px-3 py-1.5 border-2 border-black font-mono text-xs font-bold">
          <span class="truncate">{file.name} ({formatFileSize(file.size)})</span>
          <button
            type="button"
            onclick={() => removeFile(i)}
            disabled={disabled}
            class="text-black hover:text-accent font-black p-0.5 ml-2 focus:outline-none"
            aria-label="Hapus berkas"
          >
            <X size={14} />
          </button>
        </div>
      {/each}
    </div>
  {/if}

  {#if propError || localError}
    <span class="font-body font-bold text-xs text-black bg-accent px-2 py-0.5 border border-black inline-block self-start">
      {propError || localError}
    </span>
  {:else if hint}
    <span class="font-body font-medium text-xs text-gray-700">
      {hint}
    </span>
  {/if}
</div>
