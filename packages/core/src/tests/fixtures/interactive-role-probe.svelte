<script lang="ts">
	import {
		useInteractiveRole,
		type UseInteractiveRoleOptions
	} from '$lib/hooks/use-interactive-role.svelte.js';
	import { useInteractiveRoleContext } from '$lib/interactive-role-context.svelte.js';

	/**
	 * Stands in for `@testing-library/react`'s `renderHook`, which Svelte has no
	 * equivalent of: a hook has to run inside a component's init, so the harness
	 * is a component that runs it and renders what it saw.
	 */
	const { options = {} }: { options?: UseInteractiveRoleOptions } = $props();

	const readContext = useInteractiveRoleContext();
	const resolveRole = useInteractiveRole();
</script>

<span data-testid="context">{readContext() ?? 'null'}</span>
<span data-testid="role">{resolveRole(options)}</span>
