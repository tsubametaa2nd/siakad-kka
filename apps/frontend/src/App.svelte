<script lang="ts">
  import Router from 'svelte-spa-router';
  import Toast from './lib/components/ui/Toast.svelte';
  import { routes } from './lib/router';
  import { authStore } from './lib/stores/auth.svelte';

  // Restore session from sessionStorage on app mount
  authStore.restore();
</script>

<Toast />
<Router {routes} />
