<script lang="ts" module>
	export interface ExpansionChevronProps {
		/** Is the row this chevron belongs to currently expanded? */
		isExpanded: boolean;
		/** Toggles this row. */
		onToggle: () => void;
		/** Accessible name, resolved by the hook so every `t()` call site stays there. */
		ariaLabel: string;
	}
</script>

<script lang="ts">
	import Icon from '../../../icon/icon.svelte';
	import {
		expansionChevronButtonAttrs,
		expansionChevronIconAttrs
	} from './row-expansion.stylex.js';
	import { rtlMirrorAttrs } from '../../../../utils/rtl.stylex.js';

	/**
	 * Ported from Astryx's `ExpansionChevron`, the module-private component
	 * `useTableRowExpansion.tsx` renders in both the synthetic expansion column
	 * and (for child rows) inline in the first content column.
	 *
	 * Module-private upstream, so the props type is exported for `$props()`
	 * typing but is deliberately not on the barrel.
	 */
	let { isExpanded, onToggle, ariaLabel }: ExpansionChevronProps = $props();

	const buttonAttrs = expansionChevronButtonAttrs();
	const iconAttrs = $derived(expansionChevronIconAttrs(isExpanded));
	const mirror = rtlMirrorAttrs();
</script>

<button
	type="button"
	class={buttonAttrs.class}
	style={buttonAttrs.style}
	onclick={(e) => {
		e.stopPropagation();
		onToggle();
	}}
	aria-label={ariaLabel}
	aria-expanded={isExpanded}
>
	<span class={mirror.class} style={mirror.style}>
		<span class={iconAttrs.class} style={iconAttrs.style}>
			<Icon icon="chevronRight" size="xsm" />
		</span>
	</span>
</button>
