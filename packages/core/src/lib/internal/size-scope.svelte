<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ElementSize } from './contexts.svelte.js';

	export interface SizeScopeProps {
		/** The size to cascade to the wrapped subtree. */
		value: ElementSize;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { setSizeContext } from './contexts.svelte.js';

	/**
	 * Internal — publishes `SizeContext` to a subtree. Upstream's `SizeProvider`.
	 *
	 * React scopes a context to part of a tree by wrapping that part in a
	 * provider element. Svelte sets context at *component* init, so scoping needs
	 * a component boundary: this is that boundary and nothing more, rendering no
	 * element of its own. `setSizeContext` remains the right call for a component
	 * that cascades a size to the whole of its own subtree, as `Toolbar` does;
	 * this exists for the case upstream needs a provider for — cascading to one
	 * *part* of a component's output, as `SideNav` does to its icon rows.
	 *
	 * Published as `SizeProvider`, which is upstream's name for it. An earlier note
	 * here argued the opposite — that `setSizeContext` was already the counterpart,
	 * so exporting this would invent surface. That was wrong, and the paragraph
	 * above says why: `setSizeContext` cascades to a component's *whole* subtree,
	 * where `SizeProvider` scopes to *part* of one. They are different
	 * capabilities, and only this one can express upstream's.
	 */
	let { value, children }: SizeScopeProps = $props();

	setSizeContext(() => value);
</script>

{#if children}{@render children()}{/if}
