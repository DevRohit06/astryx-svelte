<script lang="ts">
	import type { InteractiveRole } from '$lib/hooks/use-interactive-role.svelte.js';
	import type { UseInteractiveRoleOptions } from '$lib/hooks/use-interactive-role.svelte.js';
	import { setInteractiveRoleContext } from '$lib/interactive-role-context.svelte.js';
	import InteractiveRoleProvider from './interactive-role-provider.svelte';
	import InteractiveRoleProbe from './interactive-role-probe.svelte';

	interface Props {
		role: InteractiveRole | null;
		/** When set, nests a second provider inside this one, as upstream's nesting test does. */
		innerRole?: InteractiveRole | null;
		options?: UseInteractiveRoleOptions;
	}

	const { role, innerRole, options = {} }: Props = $props();

	setInteractiveRoleContext(() => role);
</script>

{#if innerRole !== undefined}
	<InteractiveRoleProvider role={innerRole} {options} />
{:else}
	<InteractiveRoleProbe {options} />
{/if}
