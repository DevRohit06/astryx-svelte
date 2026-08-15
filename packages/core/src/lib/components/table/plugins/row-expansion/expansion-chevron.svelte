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
	import { expansionChevronButtonAttrs } from './row-expansion.stylex.js';

	/**
	 * Ported from Astryx's `ExpansionChevron`, the module-private component
	 * `useTableRowExpansion.tsx` renders in the synthetic expansion column.
	 *
	 * Module-private upstream, so the props type is exported for `$props()`
	 * typing but is deliberately not on the barrel.
	 *
	 * At 0.4.1 the rotation moved onto the **button** — `stylex.props(chevronButton,
	 * isExpanded && chevronExpanded)` — so the icon is a bare `<Icon>` with no
	 * wrapper span and no `rtlStyles.mirror`. Both spans were this port's reading
	 * of the pre-0.4.1 markup and both are gone with it.
	 */
	let { isExpanded, onToggle, ariaLabel }: ExpansionChevronProps = $props();

	const buttonAttrs = $derived(expansionChevronButtonAttrs(isExpanded));
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
	<Icon icon="chevronRight" size="xsm" />
</button>
