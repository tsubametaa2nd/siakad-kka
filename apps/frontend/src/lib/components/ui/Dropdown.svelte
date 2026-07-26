<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { ChevronDown, Check } from 'lucide-svelte';

  export interface DropdownOption {
    value: string | number;
    label: string;
    icon?: Component<any> | any;
    disabled?: boolean;
    description?: string;
  }

  interface Props {
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    value?: string | number;
    options?: DropdownOption[];
    placeholder?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
    class?: string;
    menuClass?: string;
    triggerClass?: string;
    onchange?: (e: Event) => void;
    onselect?: (value: string | number, option?: DropdownOption) => void;
    trigger?: Snippet;
    children?: Snippet;
  }

  let {
    label,
    error,
    hint,
    required = false,
    value = $bindable(''),
    options = [],
    placeholder = '-- Pilih --',
    disabled = false,
    id = crypto.randomUUID(),
    name,
    class: className = '',
    menuClass = '',
    triggerClass = '',
    onchange,
    onselect,
    trigger,
    children
  }: Props = $props();

  let isOpen = $state(false);
  let containerRef: HTMLDivElement | null = $state(null);
  let focusedIndex = $state(-1);

  const selectedOption = $derived(
    options.find((opt) => String(opt.value) === String(value))
  );

  const toggleDropdown = () => {
    if (disabled) return;
    isOpen = !isOpen;
    if (isOpen) {
      const idx = options.findIndex((opt) => String(opt.value) === String(value));
      focusedIndex = idx >= 0 ? idx : 0;
    }
  };

  const selectOption = (optValue: string | number, opt?: DropdownOption) => {
    if (disabled) return;
    value = optValue;
    isOpen = false;

    if (onselect) {
      onselect(optValue, opt);
    }

    if (onchange) {
      const synthEvent = {
        target: { value: optValue, name, id },
        currentTarget: { value: optValue },
        preventDefault: () => {},
        stopPropagation: () => {}
      } as unknown as Event;
      onchange(synthEvent);
    }
  };

  // Close when clicking outside or pressing Escape
  $effect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef && !containerRef.contains(e.target as Node)) {
        isOpen = false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isOpen = false;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusedIndex = (focusedIndex + 1) % options.length;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusedIndex = (focusedIndex - 1 + options.length) % options.length;
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          e.preventDefault();
          const targetOpt = options[focusedIndex];
          if (!targetOpt.disabled) {
            selectOption(targetOpt.value, targetOpt);
          }
        }
      }
    };

    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<div bind:this={containerRef} class="relative flex flex-col gap-1.5 text-black {className}">
  {#if label}
    <label for={id} class="font-display font-black text-sm uppercase tracking-wide flex items-center gap-1 select-none">
      {label}
      {#if required}
        <span class="text-accent font-bold">*</span>
      {/if}
    </label>
  {/if}

  {#if trigger}
    <div onclick={toggleDropdown} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && toggleDropdown()}>
      {@render trigger()}
    </div>
  {:else}
    <button
      {id}
      type="button"
      {disabled}
      onclick={toggleDropdown}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      class="w-full px-3.5 py-2.5 bg-white text-black font-body font-bold text-sm border-[3px] border-black rounded-none shadow-brutal-sm transition-all duration-100 flex items-center justify-between gap-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[1px] active:translate-y-[1px] active:shadow-none focus:outline-[3px] focus:outline-black focus:outline-offset-2 disabled:bg-gray-100 disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer select-none {isOpen ? 'bg-yellow-200 shadow-brutal' : ''} {error ? 'border-accent bg-pink-50' : ''} {triggerClass}"
    >
      {#if selectedOption}
        <span class="flex items-center gap-2 truncate">
          {#if selectedOption.icon}
            {@const Icon = selectedOption.icon}
            <Icon size={18} class="shrink-0 stroke-[2.5]" />
          {/if}
          <span class="truncate">{selectedOption.label}</span>
        </span>
      {:else}
        <span class="text-gray-500 font-medium truncate">{placeholder}</span>
      {/if}

      <ChevronDown
        size={18}
        class="shrink-0 stroke-[3] transition-transform duration-200 {isOpen ? 'transform rotate-180 text-black' : 'text-black'}"
      />
    </button>
  {/if}

  {#if isOpen}
    <div
      role="listbox"
      tabindex="-1"
      class="absolute left-0 right-0 top-full mt-2 bg-white border-[3px] border-black shadow-brutal-lg z-50 overflow-hidden max-h-60 overflow-y-auto duration-100 {menuClass}"
    >
      {#if children}
        {@render children()}
      {:else if options.length === 0}
        <div class="px-4 py-3 text-xs font-body font-bold text-gray-500 text-center select-none">
          Tidak ada pilihan
        </div>
      {:else}
        {#each options as opt, index (opt.value)}
          {@const isSelected = String(value) === String(opt.value)}
          <button
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={opt.disabled}
            onclick={() => selectOption(opt.value, opt)}
            onmouseenter={() => (focusedIndex = index)}
            class="w-full px-4 py-3 text-left font-body font-bold text-sm flex items-center justify-between gap-3 transition-colors duration-75 select-none border-b border-gray-200 last:border-b-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed {isSelected ? 'bg-yellow-200 text-black font-extrabold border-l-4 border-l-black' : focusedIndex === index ? 'bg-yellow-100 text-black' : 'bg-white hover:bg-yellow-100 text-black'}"
          >
            <div class="flex items-center gap-2.5 truncate">
              {#if opt.icon}
                {@const Icon = opt.icon}
                <Icon size={18} class="shrink-0 stroke-[2.5]" />
              {/if}
              <div class="flex flex-col truncate">
                <span class="truncate">{opt.label}</span>
                {#if opt.description}
                  <span class="font-body text-xs text-gray-600 font-normal truncate">{opt.description}</span>
                {/if}
              </div>
            </div>

            {#if isSelected}
              <Check size={16} class="shrink-0 stroke-[3] text-black" />
            {/if}
          </button>
        {/each}
      {/if}
    </div>
  {/if}

  {#if error}
    <span class="font-body font-bold text-xs text-black bg-accent px-2 py-0.5 border border-black inline-block self-start shadow-brutal-sm">
      {error}
    </span>
  {:else if hint}
    <span class="font-body font-medium text-xs text-gray-700">
      {hint}
    </span>
  {/if}
</div>
