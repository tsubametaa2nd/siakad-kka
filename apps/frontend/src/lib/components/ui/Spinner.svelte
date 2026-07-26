<script lang="ts">
  interface Props {
    size?: 'sm' | 'md' | 'lg';
    class?: string;
  }

  let { size = 'md', class: className = '' }: Props = $props();

  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-[3px]',
    lg: 'w-10 h-10 border-4',
  };
</script>

<span
  class="inline-block rounded-full border-current border-t-transparent animate-spin shrink-0 {sizeClasses[size]} {className}"
  aria-label="Loading"
  role="status"
></span>
