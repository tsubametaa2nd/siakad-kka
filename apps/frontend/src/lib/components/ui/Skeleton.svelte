<script lang="ts">
  interface Props {
    width?: string;
    height?: string;
    class?: string;
  }

  let {
    width = 'w-full',
    height = 'h-6',
    class: className = ''
  }: Props = $props();
</script>

<div
  class="bg-gray-300 border-2 border-black rounded-none shadow-brutal-sm animate-pulse {width} {height} {className}"
  aria-hidden="true"
></div>
