<script lang="ts" module>
	export interface ExpandAllToggleProps {
		/** Is every expandable row currently expanded? `'indeterminate'` reads as `false`. */
		allExpanded: boolean;
		/** Called with the desired next state. */
		onToggleExpandAll: (expand: boolean) => void;
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
	 * The expand-all button Astryx builds inline in `transformHeaderCell`, as a
	 * component because a `.ts` hook cannot author markup.
	 *
	 * It is deliberately *not* `ExpansionChevron`: upstream's header button omits
	 * `aria-expanded` and does not stop propagation, and it toggles all rows
	 * rather than one. Only the two style groups are shared.
	 */
	let { allExpanded, onToggleExpandAll, ariaLabel }: ExpandAllToggleProps = $props();

	const buttonAttrs = expansionChevronButtonAttrs();
	const iconAttrs = $derived(expansionChevronIconAttrs(allExpanded));
	const mirror = rtlMirrorAttrs();
</script>

<button
	type="button"
	class={buttonAttrs.class}
	style={buttonAttrs.style}
	onclick={() => onToggleExpandAll(!allExpanded)}
	aria-label={ariaLabel}
>
	<span class={mirror.class} style={mirror.style}>
		<span class={iconAttrs.class} style={iconAttrs.style}>
			<Icon icon="chevronRight" size="xsm" />
		</span>
	</span>
</button>
