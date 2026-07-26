<script lang="ts">
  import Dropdown, { type DropdownOption } from './Dropdown.svelte';

  interface Props {
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    value?: string | number;
    options?: { value: string | number; label: string; icon?: any; description?: string }[];
    placeholder?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
    class?: string;
    onchange?: (e: Event) => void;
    onselect?: (value: string | number, option?: DropdownOption) => void;
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
    id,
    name,
    class: className = '',
    onchange,
    onselect
  }: Props = $props();
</script>

<Dropdown
  {label}
  {error}
  {hint}
  {required}
  bind:value
  {options}
  {placeholder}
  {disabled}
  {id}
  {name}
  class={className}
  {onchange}
  {onselect}
/>
