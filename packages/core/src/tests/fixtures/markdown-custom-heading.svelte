<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A `MarkdownComponents['heading']` override — upstream's
	 * `({children}) => <h2 data-custom>{children}</h2>`, as a component file
	 * because `MarkdownComponents.heading` is a `Component<{level, children}>`.
	 *
	 * `level` is declared and deliberately ignored, exactly as upstream's inline
	 * override ignores it: the case is about the default theme target *not* being
	 * imposed on a custom component, and a custom component owns its own markup.
	 */
	// eslint-disable-next-line svelte/no-unused-props -- `level` is part of the contract
	const { children }: { level: 1 | 2 | 3 | 4 | 5 | 6; children: Snippet } = $props();
</script>

<h2 data-custom>{@render children()}</h2>
