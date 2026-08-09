<script lang="ts" module>
	import type { TreeListItemData } from '$lib/index.js';

	export interface DestinationValue {
		id: string;
		label: string;
		path: string;
	}

	export interface DestinationNode {
		id: string;
		label: string;
		path: string;
		kind: 'folder' | 'space' | 'team';
		isExpanded?: boolean;
		children?: DestinationNode[];
	}

	export function formatDestinationValue(value: DestinationValue): string {
		return value.path;
	}

	function nodeMatchesQuery(node: DestinationNode, normalizedQuery: string): boolean {
		return (
			node.label.toLowerCase().includes(normalizedQuery) ||
			node.path.toLowerCase().includes(normalizedQuery)
		);
	}

	function filterDestinationTree(nodes: DestinationNode[], query: string): DestinationNode[] {
		const normalizedQuery = query.trim().toLowerCase();
		const result: DestinationNode[] = [];

		for (const node of nodes) {
			const filteredChildren = node.children
				? filterDestinationTree(node.children, query)
				: undefined;
			const isMatch = normalizedQuery.length === 0 || nodeMatchesQuery(node, normalizedQuery);

			if (!isMatch && (!filteredChildren || filteredChildren.length === 0)) {
				continue;
			}

			result.push({
				...node,
				isExpanded: normalizedQuery.length > 0 || node.children != null,
				children: filteredChildren
			});
		}

		return result;
	}
</script>

<script lang="ts">
	import { HStack, Text, TextInput, Token, TreeList, VStack } from '$lib/index.js';

	/**
	 * Upstream's `TreeSearchContent`, shared by `ComplexSelector.stories.tsx`'s
	 * `TreeListWithSearch` and `CategoryTreeSelector` stories.
	 *
	 * A component here for the reason it is one upstream: it holds its own
	 * `query` state, and the two stories each need their own. A snippet cannot
	 * carry state, so the React component translates to a Svelte one rather than
	 * to a second snippet in the demos file.
	 *
	 * Two translations:
	 *
	 * - **`useMemo` → `$derived`.** Both derivations are pure functions of
	 *   `query`, `tree` and `value.id`, which is exactly what upstream's
	 *   dependency arrays say.
	 * - **`endContent` is a `Snippet`, not a `ReactNode`.** Upstream puts a
	 *   `<Token>` element straight into the item data; `TreeListItemData` takes a
	 *   snippet here, so the shared `teamToken` snippet below is what the mapper
	 *   attaches.
	 */
	interface Props {
		label: string;
		value: DestinationValue;
		tree: DestinationNode[];
		searchPlaceholder: string;
		onChange: (value: DestinationValue) => void;
		close: () => void;
	}

	const { label, value, tree, searchPlaceholder, onChange, close }: Props = $props();

	let query = $state('');

	function toTreeListItems(nodes: DestinationNode[], selectedId: string): TreeListItemData[] {
		return nodes.map((node) => {
			const hasChildren = node.children != null && node.children.length > 0;
			return {
				id: node.id,
				label: node.label,
				description: node.path,
				isExpanded: hasChildren,
				isSelected: !hasChildren && node.id === selectedId,
				endContent: node.kind === 'team' ? teamToken : undefined,
				onClick: hasChildren
					? undefined
					: () => {
							onChange({ id: node.id, label: node.label, path: node.path });
							close();
						},
				children: hasChildren ? toTreeListItems(node.children ?? [], selectedId) : undefined
			};
		});
	}

	const filteredTree = $derived(filterDestinationTree(tree, query));
	const treeItems = $derived(toTreeListItems(filteredTree, value.id));
</script>

{#snippet teamToken()}
	<Token label="Team" size="sm" color="blue" />
{/snippet}

<VStack gap={3}>
	<div class="search-area">
		<TextInput
			label={`Search ${label}`}
			isLabelHidden
			value={query}
			onChange={(next) => (query = next)}
			hasClear
			placeholder={searchPlaceholder}
		/>
	</div>
	<div class="tree-panel">
		{#if treeItems.length > 0}
			<TreeList items={treeItems} density="compact" />
		{:else}
			<div role="status" class="empty-state">
				<Text type="supporting" color="secondary">No matching destinations.</Text>
			</div>
		{/if}
	</div>
	<div class="selected-summary">
		<HStack gap={2} wrap="wrap">
			<Text type="supporting" color="secondary">Current:</Text>
			<Token label={value.path} size="sm" color="blue" />
		</HStack>
	</div>
</VStack>

<style>
	/* Upstream authors these in `stylex.create`; plain rules over the same theme
	   tokens, for the reason the fruit matrix records. */
	.search-area {
		margin-block-end: var(--spacing-3);
	}

	.tree-panel {
		max-height: 280px;
		overflow: auto;
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-container);
		padding: var(--spacing-1);
	}

	.selected-summary {
		margin-block-start: var(--spacing-3);
		padding-block-start: var(--spacing-3);
		border-block-start: var(--border-width) solid var(--color-border);
	}

	.empty-state {
		padding: var(--spacing-3);
		color: var(--color-text-secondary);
		text-align: center;
	}
</style>
