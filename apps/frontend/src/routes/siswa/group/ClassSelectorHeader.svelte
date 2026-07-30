<script lang="ts">
  import Button from '../../../lib/components/ui/Button.svelte';
  import Select from '../../../lib/components/ui/Select.svelte';

  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    classOptions: Option[];
    selectedClassId: string;
    hasGroup: boolean;
    onclasschange: (e: Event) => void;
    oncreateclick: () => void;
  }

  let { classOptions, selectedClassId = $bindable(), hasGroup, onclasschange, oncreateclick }: Props = $props();
</script>

<div class="bg-white p-4 border-[3px] border-black shadow-brutal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  <Select label="Pilih Kelas Akademik" options={classOptions} bind:value={selectedClassId} onchange={onclasschange} class="w-full sm:max-w-md" />
  {#if !hasGroup}
    <Button variant="primary" onclick={oncreateclick}>
      + Buat Kelompok Baru
    </Button>
  {/if}
</div>
