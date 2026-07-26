<script lang="ts">
  import type { Component } from 'svelte';
  import { replace } from 'svelte-spa-router';
  import { authStore } from '../stores/auth.svelte';

  interface Props {
    component?: Component<any>;
    allowedRoles?: Array<'teacher' | 'student'>;
    params?: Record<string, any>;
    userData?: {
      component: Component<any>;
      allowedRoles?: Array<'teacher' | 'student'>;
    };
  }

  let { component, allowedRoles, params = {}, userData }: Props = $props();

  const TargetComponent = $derived(component || userData?.component);
  const roles = $derived(allowedRoles || userData?.allowedRoles);

  $effect(() => {
    if (!authStore.isAuthenticated || !authStore.user) {
      const currentHash = window.location.hash.replace(/^#/, '');
      if (currentHash && currentHash !== '/login') {
        authStore.setRedirectUrl(currentHash);
      }
      replace('/login');
      return;
    }

    if (roles && roles.length > 0 && !roles.includes(authStore.user.role)) {
      const homeRoute = authStore.user.role === 'teacher' ? '/guru' : '/siswa';
      replace(homeRoute);
    }
  });
</script>

{#if authStore.isAuthenticated && authStore.user && (!roles || roles.includes(authStore.user.role)) && TargetComponent}
  {@const Comp = TargetComponent}
  <Comp {params} />
{/if}
