<script lang="ts" module>
	export interface TreeExpandAllToggleProps {
		/** Aggregate expansion state across every expandable row. */
		isAllExpanded: boolean | 'indeterminate';
		/** Expand every expandable row. */
		onExpandAll: () => void;
		/** Collapse every row. */
		onCollapseAll: () => void;
	}
</script>

<script lang="ts">
	import Icon from '../../../icon/icon.svelte';
	import { useTranslator } from '../../../../i18n/index.js';
	import {
		treeChevronAttrs,
		treeChevronMirrorAttrs,
		treeExpanderButtonAttrs
	} from './tree.stylex.js';

	/**
	 * Ported from Astryx's `TreeExpandAllToggle` in
	 * `Table/plugins/tree/useTableTreeData.tsx`, verbatim.
	 *
	 * The header expand-all/collapse-all toggle, rendered in the tree column
	 * header when `hasExpandAllControl` is set and the state hook supplies the
	 * aggregate `isAllExpanded` plus `onExpandAll`/`onCollapseAll`. It shares the
	 * chevron affordance with the per-row expander (`tree-expander.svelte`) —
	 * same button, same rotation, same RTL mirror nesting — and points down only
	 * when **every** expandable row is expanded, matching a row expander.
	 *
	 * `'indeterminate'` therefore reads as collapsed and the next press expands
	 * all, which is upstream's `allExpanded === true` comparison rather than a
	 * truthiness check.
	 */
	let { isAllExpanded, onExpandAll, onCollapseAll }: TreeExpandAllToggleProps = $props();

	const t = useTranslator();
	const allExpanded = $derived(isAllExpanded === true);

	const buttonAttrs = treeExpanderButtonAttrs();
	const chevronAttrs = $derived(treeChevronAttrs(allExpanded));
	const mirror = treeChevronMirrorAttrs();
</script>

<button
	type="button"
	class={buttonAttrs.class}
	style={buttonAttrs.style}
	onclick={(e) => {
		e.stopPropagation();
		if (allExpanded) {
			onCollapseAll();
		} else {
			onExpandAll();
		}
	}}
	aria-label={allExpanded
		? t('@astryx.tableTree.collapseAllRows')
		: t('@astryx.tableTree.expandAllRows')}
	aria-expanded={allExpanded}
>
	<span class={mirror.class} style={mirror.style}>
		<span class={chevronAttrs.class} style={chevronAttrs.style}>
			<Icon icon="chevronRight" size="xsm" />
		</span>
	</span>
</button>
