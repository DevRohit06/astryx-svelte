<script lang="ts">
	import { Button, ComplexSelector, HStack, Text, VStack } from '$lib/index.js';
	import ComplexSelectorFruitMatrix, {
		formatFruitValue,
		type FruitValue
	} from './complex-selector-fruit-matrix.svelte';
	import ComplexSelectorTreeContent, {
		formatDestinationValue,
		type DestinationNode,
		type DestinationValue
	} from './complex-selector-tree-content.svelte';

	/**
	 * Upstream's `ComplexSelector.stories.tsx`, as a sibling route component —
	 * the `table-tree-demos.svelte` shape.
	 *
	 * **All 3 stories:** `FruitRipenessGrid`, `TreeListWithSearch` and
	 * `CategoryTreeSelector`. Upstream's two content helpers,
	 * `FruitRipenessMatrix` and `TreeSearchContent`, are components here for the
	 * reason they are components upstream — each runs hooks or holds state over
	 * the *selected* value, which arrives as a parameter of the content snippet.
	 * `.svelte` declares one component per file, so they are the two siblings
	 * beside this one.
	 *
	 * Three translations:
	 *
	 * - **The render prop is a parameterised snippet.** Upstream's
	 *   `{(value, onChange, close) => …}` child becomes
	 *   `{#snippet children(selectedValue, onChange, close)}`, taking the four
	 *   arguments in upstream's order. The fourth — the render state — is unused
	 *   by every upstream story, so it is unnamed here too.
	 * - **`contentXstyle` has no counterpart in these blocks.** It takes compiled
	 *   StyleX, and StyleX may not be imported from a `.svelte` file, so upstream's
	 *   `styles.fruitContent` / `styles.treeContent` (which only size and pad the
	 *   popup) become a plain sized wrapper *inside* the snippet. Same box, drawn
	 *   from the content side.
	 * - **`useState` → `$state`**, and `setValue` becomes a plain reassignment.
	 */

	// =============================================================================
	// Sample Data
	// =============================================================================

	const destinationTree: DestinationNode[] = [
		{
			id: 'workspace',
			label: 'Workspace',
			path: '/Workspace',
			kind: 'space',
			children: [
				{
					id: 'workspace-research',
					label: 'Research',
					path: '/Workspace/Research',
					kind: 'folder',
					children: [
						{
							id: 'workspace-research-field-notes',
							label: 'Field notes',
							path: '/Workspace/Research/Field notes',
							kind: 'folder'
						},
						{
							id: 'workspace-research-interviews',
							label: 'Interviews',
							path: '/Workspace/Research/Interviews',
							kind: 'folder'
						}
					]
				},
				{
					id: 'workspace-roadmap',
					label: 'Roadmap',
					path: '/Workspace/Roadmap',
					kind: 'folder'
				}
			]
		},
		{
			id: 'teams',
			label: 'Teams',
			path: '/Teams',
			kind: 'space',
			children: [
				{
					id: 'teams-design-systems',
					label: 'Design systems',
					path: '/Teams/Design systems',
					kind: 'team',
					children: [
						{
							id: 'teams-design-systems-components',
							label: 'Components',
							path: '/Teams/Design systems/Components',
							kind: 'folder'
						},
						{
							id: 'teams-design-systems-accessibility',
							label: 'Accessibility',
							path: '/Teams/Design systems/Accessibility',
							kind: 'folder'
						}
					]
				},
				{
					id: 'teams-growth',
					label: 'Growth',
					path: '/Teams/Growth',
					kind: 'team'
				}
			]
		},
		{
			id: 'archive',
			label: 'Archive',
			path: '/Archive',
			kind: 'space',
			children: [
				{
					id: 'archive-2025',
					label: '2025 projects',
					path: '/Archive/2025 projects',
					kind: 'folder'
				}
			]
		}
	];

	const categoryTree: DestinationNode[] = [
		{
			id: 'produce',
			label: 'Produce',
			path: 'Produce',
			kind: 'space',
			children: [
				{
					id: 'produce-fruit',
					label: 'Fruit',
					path: 'Produce / Fruit',
					kind: 'folder',
					children: [
						{
							id: 'produce-fruit-citrus',
							label: 'Citrus',
							path: 'Produce / Fruit / Citrus',
							kind: 'folder'
						},
						{
							id: 'produce-fruit-stone',
							label: 'Stone fruit',
							path: 'Produce / Fruit / Stone fruit',
							kind: 'folder'
						}
					]
				},
				{
					id: 'produce-vegetables',
					label: 'Vegetables',
					path: 'Produce / Vegetables',
					kind: 'folder'
				}
			]
		},
		{
			id: 'pantry',
			label: 'Pantry',
			path: 'Pantry',
			kind: 'space',
			children: [
				{ id: 'pantry-grains', label: 'Grains', path: 'Pantry / Grains', kind: 'folder' },
				{ id: 'pantry-snacks', label: 'Snacks', path: 'Pantry / Snacks', kind: 'folder' }
			]
		}
	];

	// =============================================================================
	// Stories
	// =============================================================================

	// FruitRipenessGrid
	let fruitValue = $state<FruitValue>({ fruit: 'Apple', ripeness: 'Juicy' });

	// TreeListWithSearch
	let destinationValue = $state<DestinationValue>({
		id: 'teams-design-systems-accessibility',
		label: 'Accessibility',
		path: '/Teams/Design systems/Accessibility'
	});

	// CategoryTreeSelector
	let categoryValue = $state<DestinationValue>({
		id: 'produce-fruit-citrus',
		label: 'Citrus',
		path: 'Produce / Fruit / Citrus'
	});
</script>

<h3>Fruit ripeness selector</h3>
<VStack gap={4} class="complex-selector-wrapper">
	<ComplexSelector
		label="Fruit blend"
		description="Choose a fruit and ripeness level in one selector. Arrow down preserves the ripeness column."
		value={fruitValue}
		onChange={(next) => (fruitValue = next)}
		triggerLabel={formatFruitValue(fruitValue)}
	>
		{#snippet children(selectedValue, onChange, close)}
			<div class="fruit-content">
				<div class="intro">
					<Text type="supporting" color="secondary">
						Pick a blend profile. The compact pills mirror a hover-rich selector while staying
						available to keyboard users.
					</Text>
				</div>

				<ComplexSelectorFruitMatrix
					value={selectedValue}
					onChange={(nextValue) => {
						onChange(nextValue);
						close();
					}}
				/>

				<div class="keyboard-hint">
					<HStack gap={2} wrap="wrap">
						<Text type="supporting" color="secondary">Try keyboard:</Text>
						<Text type="supporting">↓ from Apple J lands on Pear J.</Text>
					</HStack>
				</div>
			</div>
		{/snippet}
	</ComplexSelector>
</VStack>

<h3>Tree list with search</h3>
<VStack gap={4} class="complex-selector-wrapper">
	<ComplexSelector
		label="Project destination"
		description="Search and browse nested folders from one selector."
		value={destinationValue}
		onChange={(next) => (destinationValue = next)}
		triggerLabel={formatDestinationValue(destinationValue)}
	>
		{#snippet children(selectedValue, onChange, close)}
			<div class="tree-content">
				<ComplexSelectorTreeContent
					label="destinations"
					value={selectedValue}
					tree={destinationTree}
					searchPlaceholder="Search folders or teams"
					{onChange}
					{close}
				/>
			</div>
		{/snippet}
	</ComplexSelector>
</VStack>

<h3>Category tree selector</h3>
<VStack gap={4} class="complex-selector-wrapper">
	<ComplexSelector
		label="Product category"
		description="Search or browse a category tree."
		value={categoryValue}
		onChange={(next) => (categoryValue = next)}
		triggerLabel={categoryValue.path}
	>
		{#snippet children(selectedValue, onChange, close)}
			<div class="tree-content">
				<ComplexSelectorTreeContent
					label="categories"
					value={selectedValue}
					tree={categoryTree}
					searchPlaceholder="Search categories"
					{onChange}
					{close}
				/>
			</div>
		{/snippet}
	</ComplexSelector>
	<Button label="Save category" variant="primary" />
</VStack>

<style>
	/* Upstream's `styles.wrapper` (340px) around each story, and the two popup
	   sizings it passes as `contentXstyle`. The popup ones sit on the content
	   instead: `contentXstyle` takes compiled StyleX, which a `.svelte` file
	   cannot author. */
	:global(.complex-selector-wrapper) {
		width: 340px;
	}

	.fruit-content {
		width: 500px;
		padding: var(--spacing-2);
	}

	.tree-content {
		width: 420px;
		padding: var(--spacing-3);
	}

	.intro {
		margin-block-end: var(--spacing-3);
	}

	.keyboard-hint {
		margin-block-start: var(--spacing-3);
		padding-block-start: var(--spacing-3);
		border-block-start: var(--border-width) solid var(--color-border);
	}
</style>
