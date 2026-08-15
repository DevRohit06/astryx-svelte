<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface CommandPaletteItemProps extends Omit<
		BaseProps<HTMLDivElement>,
		'onchange' | 'onselect'
	> {
		/** Unique value for identification and selection. */
		value: string;
		/** Called when this item is selected (via click or Enter). */
		onSelect?: (value: string) => void;
		/**
		 * Whether this item is visually highlighted (keyboard focus).
		 * When omitted inside CommandPalette, derived from context.
		 * @default false
		 */
		isHighlighted?: boolean;
		/**
		 * Whether this item is currently selected (picker mode).
		 * @default false
		 */
		isSelected?: boolean;
		/**
		 * Whether the item is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/** Item content. Fully custom — render icons, descriptions, shortcuts, etc. */
		children: Snippet;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { themeProps } from '../../internal/theme-props.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { useCommandPaletteContext } from './command-palette-context.svelte.js';
	import { useDialogContext } from '../dialog/dialog-context.svelte.js';
	import { commandPaletteItemAttrs } from './command-palette-item.stylex.js';

	/**
	 * A selectable item in the command palette, ported from Astryx's
	 * `CommandPalette/CommandPaletteItem.tsx`. Accepts arbitrary children for full
	 * rendering control.
	 *
	 * When used inside `CommandPalette`, reads context for keyboard navigation and
	 * selection. Can also be used standalone with explicit
	 * `isHighlighted`/`isSelected` props.
	 */
	const {
		value,
		onSelect,
		isHighlighted: controlledHighlighted,
		isSelected: controlledSelected,
		isDisabled = false,
		children,
		xstyle,
		class: className,
		style: styleProp,
		// Destructured out of `rest` so the row's own handlers can COMPOSE with a
		// consumer's rather than shadow them (#4725). Spread into the element, an
		// attribute handler declared after `{...rest}` silently wins, where React
		// ran both — so a caller's `onclick` was being dropped on the floor.
		onclick: onclickProp,
		onmouseenter: onmouseenterProp,
		...rest
	}: CommandPaletteItemProps = $props();

	const ctx = useCommandPaletteContext();
	const dialogContext = useDialogContext();
	const isInlineDialog = $derived(dialogContext()?.isInline === true);

	let itemEl = $state<HTMLDivElement | null>(null);
	// Upstream's `didMountRef`. A plain `let`, because it is a ref: nothing renders
	// from it and making it `$state` would re-run the effect that writes it.
	let didMount = false;

	// Find this item's index in the flat selectable items list (DOM order).
	// This aligns with useCombobox's index-based navigation.
	const itemIndex = $derived(
		ctx?.().selectableItems.findIndex((item) => item.value === value) ?? -1
	);

	// Highlight from useCombobox: index-based, matches DOM order
	const isHighlighted = $derived(
		controlledHighlighted ?? (ctx ? ctx().highlightedIndex === itemIndex && itemIndex >= 0 : false)
	);
	const isSelected = $derived(controlledSelected ?? (ctx ? ctx().value === value : false));

	$effect(() => {
		// Upstream keys this on `[isHighlighted, isInlineDialog]`; read exactly
		// those two, and nothing else, so a context change elsewhere cannot make an
		// unrelated item scroll itself into view.
		const highlighted = isHighlighted;
		const inline = isInlineDialog;

		// Inline dialogs are documentation/showcase previews. Avoid scrolling the
		// surrounding page when picker mode auto-highlights its selected item on
		// mount, while preserving scroll-into-view after user navigation.
		const shouldSkipInitialInlineScroll = inline && !didMount;
		didMount = true;

		if (shouldSkipInitialInlineScroll) {
			return;
		}

		if (highlighted) {
			untrack(() => itemEl)?.scrollIntoView?.({ block: 'nearest' });
		}
	});

	function handleClick(event: MouseEvent): void {
		onclickProp?.(event as Parameters<NonNullable<typeof onclickProp>>[0]);
		if (isDisabled) {
			return;
		}
		onSelect?.(value);
		if (ctx) {
			ctx().selectItem(value);
			ctx().onClose();
		}
	}

	function handleMouseEnter(event: MouseEvent): void {
		onmouseenterProp?.(event as Parameters<NonNullable<typeof onmouseenterProp>>[0]);
		if (isDisabled || !ctx || itemIndex < 0) {
			return;
		}
		ctx().setHighlightedIndex(itemIndex);
	}

	const theme = $derived(themeProps('command-palette-item'));
	const attrs = $derived(commandPaletteItemAttrs(isDisabled, isHighlighted, isSelected, xstyle));
</script>

<!--
	`role="option"` on a div with click/mouseenter, exactly as upstream: the
	listbox owns keyboard access through `aria-activedescendant`, so the row is
	deliberately not focusable and needs no key handler of its own.
-->
<div
	{...rest}
	bind:this={itemEl}
	id={ctx && itemIndex >= 0 ? ctx().getItemId(itemIndex) : undefined}
	role="option"
	aria-selected={isSelected}
	aria-disabled={isDisabled || undefined}
	data-value={value}
	onclick={handleClick}
	onmouseenter={handleMouseEnter}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{@render children()}
</div>
