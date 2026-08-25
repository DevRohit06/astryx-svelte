<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useFocusTrap } from '$lib/hooks/use-focus-trap.svelte.js';

	/**
	 * Upstream's local `Trap` component from
	 * `hooks/useFocusTrapEscapeShim.test.tsx` — a bare focus trap whose two
	 * switches are exactly the two inputs `hasActiveFocusTrapEscape` reads:
	 * whether the trap is active, and whether it has an Escape handler.
	 *
	 * A fixture rather than an inline component because a trap arrives here as an
	 * **attachment** on a real element, which can only be written in a template.
	 *
	 * `children` is the nesting seam: upstream writes `<Trap><Trap /></Trap>`
	 * directly, which becomes a snippet here (`escape-shim-nested-traps.svelte`).
	 */
	interface Props {
		isActive?: boolean;
		hasEscape?: boolean;
		children?: Snippet;
	}

	const { isActive = true, hasEscape = true, children }: Props = $props();

	const trap = useFocusTrap(() => ({
		isActive,
		onEscape: hasEscape ? () => {} : undefined
	}));
</script>

<div {@attach trap.attachContainer}>{@render children?.()}</div>
