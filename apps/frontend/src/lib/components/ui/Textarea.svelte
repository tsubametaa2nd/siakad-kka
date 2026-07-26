<script lang="ts">
  interface Props {
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    value?: string;
    rows?: number;
    placeholder?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
    class?: string;
    oninput?: (e: Event) => void;
  }

  let {
    label,
    error,
    hint,
    required = false,
    value = $bindable(''),
    rows = 4,
    placeholder = '',
    disabled = false,
    id = crypto.randomUUID(),
    name,
    class: className = '',
    oninput
  }: Props = $props();
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

  <textarea
    {id}
    {name}
    {rows}
    {placeholder}
    {disabled}
    {required}
    bind:value
    {oninput}
    class="w-full px-3.5 py-2.5 bg-white text-black font-body font-medium border-2 border-black rounded-none shadow-brutal-sm transition-all duration-100 focus:outline-[3px] focus:outline-black focus:outline-offset-2 disabled:bg-gray-100 disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed resize-y {error ? 'border-accent bg-pink-50' : ''}"
  ></textarea>

  {#if error}
    <span class="font-body font-bold text-xs text-black bg-accent px-2 py-0.5 border border-black inline-block self-start">
      {error}
    </span>
  {:else if hint}
    <span class="font-body font-medium text-xs text-gray-700">
      {hint}
    </span>
  {/if}
</div>
