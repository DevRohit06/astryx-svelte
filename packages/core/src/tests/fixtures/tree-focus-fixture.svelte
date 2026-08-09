<script lang="ts" module>
	export interface TreeNode {
		id: string;
		label: string;
		level: number;
		disabled?: boolean;
		/** `true` expanded, `false` collapsed, omitted for a leaf. */
		expanded?: boolean;
	}
</script>

<script lang="ts">
	import { useTreeFocus } from '$lib/hooks/use-tree-focus.svelte.js';

	/**
	 * Upstream's `Tree`: a minimal harness driven by a flat list of visible nodes,
	 * mirroring the DOM contract TreeList exposes — `role="treeitem"`,
	 * `aria-level`, `aria-expanded`, `data-tree-id`, `data-tree-disabled`.
	 * Expansion is faked by swapping the visible node list on toggle, which is
	 * what lets ArrowRight/ArrowLeft be exercised at all.
	 */
	const {
		collapsed = [],
		expanded = [],
		onActivate,
		dir
	}: {
		collapsed?: TreeNode[];
		expanded?: TreeNode[];
		onActivate?: (id: string | undefined) => boolean | undefined;
		/** Writing direction stamped on the tree container, as upstream's does. */
		dir?: 'ltr' | 'rtl';
	} = $props();

	let isOpen = $state(false);
	const nodes = $derived(isOpen && expanded.length > 0 ? expanded : collapsed);

	const tree = useTreeFocus(() => ({
		onToggleExpand: () => (isOpen = !isOpen),
		onActivate: onActivate
			? (_item: HTMLElement, id: string | undefined) => onActivate(id)
			: undefined
	}));
</script>

<ul {@attach tree.attachTree} role="tree" {dir} onkeydown={tree.handleKeyDown}>
	{#each nodes as n (n.id)}
		<!-- svelte-ignore a11y_role_has_required_aria_props -->
		<li
			role="treeitem"
			aria-level={n.level}
			aria-expanded={n.expanded}
			data-tree-id={n.id}
			data-tree-disabled={n.disabled || undefined}
			tabindex={-1}
			data-testid={n.id}
		>
			{n.label}
		</li>
	{/each}
</ul>
