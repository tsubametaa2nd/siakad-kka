<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'surface' | 'accent' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    ariaLabel?: string;
    title?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
    class?: string;
  }

  let {
    variant = 'surface',
    size = 'md',
    loading = false,
    disabled = false,
    type = 'button',
    ariaLabel,
    title,
    onclick,
    children,
    class: className = ''
  }: Props = $props();

  const variantClasses = {
    primary: 'bg-primary text-black border-2 border-black shadow-brutal hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    surface: 'bg-surface text-black border-2 border-black shadow-brutal hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    accent: 'bg-accent text-black border-2 border-black shadow-brutal hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    ghost: 'bg-transparent text-black border-2 border-transparent hover:border-black hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm shadow-brutal-sm hover:shadow-brutal',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg'
  };
</script>

<button
  {type}
  {title}
  disabled={disabled || loading}
  aria-label={ariaLabel}
  {onclick}
  class="font-display font-black uppercase tracking-wider rounded-none transition-all duration-100 cursor-pointer inline-flex items-center justify-center gap-2 select-none focus-visible:outline-[3px] focus-visible:outline-black focus-visible:outline-offset-3 disabled:opacity-60 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed {variantClasses[variant]} {sizeClasses[size]} {className}"
>
  {#if loading}
    <span class="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>
