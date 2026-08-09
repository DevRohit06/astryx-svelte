<script lang="ts">
	import { useDirection } from '$lib/i18n/use-direction.svelte.js';

	/**
	 * The consumer half of `use-direction-probe.svelte`. Separate component, not
	 * a snippet: `useDirection()` reads Svelte context and so must run during a
	 * component's *initialisation*, which a snippet body is too late for. It also
	 * has to sit below the provider in the component tree for the context to
	 * reach it at all.
	 *
	 * The direction is rendered rather than exposed as an instance `export const`
	 * because the hook returns a getter — a value captured at init would report
	 * the initial direction forever, and the suite could not tell a live read
	 * from a frozen one.
	 */
	const direction = useDirection();
</script>

<span data-testid="direction">{direction()}</span>
