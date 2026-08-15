<script lang="ts" module>
	export interface TreeExpanderProps {
		/** Whether this row is currently expanded. */
		isExpanded: boolean;
		/** Toggle this row's expansion. */
		onToggle: () => void;
	}
</script>

<script lang="ts">
	import Icon from '../../../icon/icon.svelte';
	import { useTranslator } from '../../../../i18n/index.js';
	import {
		treeChevronIconCollapsedStyle,
		treeChevronIconExpandedStyle,
		treeChevronIconStyle,
		treeExpanderButtonAttrs
	} from './tree.stylex.js';

	/**
	 * Ported from Astryx's `TreeExpander` in
	 * `Table/plugins/tree/useTableTreeData.tsx`, verbatim — the element, the
	 * `stopPropagation` (a row-level click handler from another plugin must not
	 * also fire), both ARIA attributes and the two translator keys are upstream's.
	 */
	let { isExpanded, onToggle }: TreeExpanderProps = $props();

	const t = useTranslator();

	const buttonAttrs = treeExpanderButtonAttrs();
	const chevronXstyle = $derived([
		treeChevronIconStyle,
		isExpanded ? treeChevronIconExpandedStyle : treeChevronIconCollapsedStyle
	]);
</script>

<button
	type="button"
	class={buttonAttrs.class}
	style={buttonAttrs.style}
	onclick={(e) => {
		e.stopPropagation();
		onToggle();
	}}
	aria-label={isExpanded ? t('@astryx.tableTree.collapseRow') : t('@astryx.tableTree.expandRow')}
	aria-expanded={isExpanded}
>
	<!--
		The rotation rides on the glyph rather than a wrapper span so the theme
		target reaches both the mark and its open/closed transform (#4838).
	-->
	<Icon icon="chevronRight" size="xsm" xstyle={chevronXstyle} />
</button>
