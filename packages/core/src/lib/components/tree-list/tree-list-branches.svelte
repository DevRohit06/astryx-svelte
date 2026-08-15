<script lang="ts" module>
	export interface TreeListBranchesProps {
		ancestorsIsLast: ReadonlyArray<boolean>;
		isLast: boolean;
		nestedLevel: number;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		BRANCH_MARGIN,
		LEVEL_INDENT,
		treeBranchContainerAttrs,
		treeBranchLineAttrs
	} from './tree-list-branches.stylex.js';

	/**
	 * Internal — renders vertical lines showing parent-child relationships in the
	 * tree. Positioned in a full-height container to span the entire item
	 * including children.
	 *
	 * Not exported: upstream keeps `TreeListBranches` out of `TreeList/index.ts`
	 * too.
	 */
	let { ancestorsIsLast, isLast, nestedLevel }: TreeListBranchesProps = $props();

	// The guide lines are the documented way to restyle the hierarchy under
	// `TreeList.variant`, so they carry their own stable theme target.
	const guideTheme = themeProps('tree-list-guide');

	const containerAttrs = treeBranchContainerAttrs();
	// An ancestor continuation column always has a row below it, so it always
	// bridges the inter-row gap; only the current item's own terminus depends on
	// `isLast`.
	const continuationLineAttrs = treeBranchLineAttrs(false);
	const terminusLineAttrs = $derived(treeBranchLineAttrs(isLast));

	/** The per-level `left` offset, an inline style exactly as upstream's is. */
	function offsetStyle(level: number): string | undefined {
		return mergeStyle(
			containerAttrs.style,
			`left:calc(${BRANCH_MARGIN} + ${level} * ${LEVEL_INDENT})`
		);
	}

	/**
	 * The ancestor columns that still need a continuation line: an ancestor that
	 * was its parent's last child has no line below it, and the level the current
	 * item's own connector occupies (`nestedLevel - 1`) is drawn separately below
	 * with the correct terminus style.
	 */
	const continuations = $derived(
		ancestorsIsLast
			.map((ancestorIsLast, level) => ({ ancestorIsLast, level }))
			.filter(({ ancestorIsLast, level }) => !ancestorIsLast && level !== nestedLevel - 1)
			.map(({ level }) => level)
	);
</script>

{#each continuations as level (level)}
	<div class={containerAttrs.class} style={offsetStyle(level)}>
		<div
			{...guideTheme}
			class={cx(guideTheme.class, continuationLineAttrs.class)}
			style={continuationLineAttrs.style}
		></div>
	</div>
{/each}

{#if nestedLevel > 0}
	<div class={containerAttrs.class} style={offsetStyle(nestedLevel - 1)}>
		<!--
			The last item in a group has no sibling below, so its connector is clamped
			to the row box's bottom edge (`verticalLast`) instead of bridging into the
			inter-row gap — no overhang into empty space. Every other row bridges the
			gap (`verticalFull`) so the line stays continuous down to the next sibling.
		-->
		<div
			{...guideTheme}
			class={cx(guideTheme.class, terminusLineAttrs.class)}
			style={terminusLineAttrs.style}
		></div>
	</div>
{/if}
