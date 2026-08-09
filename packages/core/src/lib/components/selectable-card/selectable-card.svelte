<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { Elevation } from '../../internal/types.js';
	import type { SizeValue, SpacingStep } from '../../internal/types.js';
	import type { CardVariant } from '../card/card.stylex.js';

	/**
	 * `onchange` is omitted from `BaseProps` so the custom `onChange` selection
	 * callback replaces the DOM one (the Switch precedent).
	 */
	export interface SelectableCardProps extends Omit<BaseProps<HTMLDivElement>, 'onchange'> {
		/** Accessible name — becomes the hidden checkbox's `aria-label`. */
		label: string;
		/** Controlled selection state. */
		isSelected: boolean;
		/** Called with the next selection state when the card is toggled. */
		onChange: (isSelected: boolean) => void;
		/** Disabled cards stay discoverable (the checkbox keeps its label). @default false */
		isDisabled?: boolean;
		children?: Snippet;
		/** @default 4 (16px) */
		padding?: SpacingStep;
		/** @default 'default' */
		variant?: CardVariant;
		/**
		 * Resting elevation — the shadow depth the card sits at.
		 * Composes with the selection ring rather than replacing it: both are
		 * listed in `Card`'s single `box-shadow`, via `--_card-elevation` and
		 * `--_card-ring`.
		 * @default 'none'
		 */
		elevation?: Elevation;
		width?: SizeValue;
		height?: SizeValue;
		maxWidth?: SizeValue;
	}
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import Card from '../card/card.svelte';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useClickableContainer } from '../../hooks/use-clickable-container.svelte.js';
	import { selectableCardInputAttrs, selectableCardXstyle } from './selectable-card.stylex.js';

	/**
	 * A card that toggles between selected and unselected. Composes `Card` for all
	 * visual styling and adds an inset box-shadow selection ring (zero layout
	 * jitter). A visually-hidden `<input type="checkbox">` inside the card carries
	 * the accessible role/label/state — the card surface itself has no role.
	 * Space toggles it natively; Enter is wired up as an additional toggle key.
	 *
	 * `useClickableContainer` needs the card's DOM element; since `Card` exposes no
	 * element seam but does spread `{...rest}`, we capture it with an attachment
	 * passed through rest rather than modifying `Card`.
	 */
	const {
		label,
		isSelected,
		onChange,
		onclick: onClickProp,
		onmouseup: onMouseUpProp,
		isDisabled = false,
		children,
		padding,
		variant = 'default',
		elevation = 'none',
		width,
		height,
		maxWidth,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: SelectableCardProps = $props();

	let container = $state<HTMLElement | null>(null);
	let interactive = $state<HTMLInputElement | null>(null);

	function handleClick(): void {
		if (!isDisabled) {
			onChange(!isSelected);
		}
	}

	/**
	 * The focusable control is a native checkbox, which toggles on Space but
	 * ignores Enter. Enter is wired up as an extra toggle key; Space keeps its
	 * native handling, so it is deliberately *not* handled here — doing so would
	 * fire `onChange` twice for one press.
	 */
	function handleKeyDown(event: KeyboardEvent): void {
		if (!isDisabled && event.key === 'Enter') {
			event.preventDefault();
			onChange(!isSelected);
		}
	}

	const clickable = useClickableContainer(() => ({
		container,
		interactive,
		onclick: handleClick,
		disabled: isDisabled
	}));

	// The div's event type (narrowed `currentTarget`), so the wrapper satisfies
	// both the hook (which takes a plain `MouseEvent`) and the consumer handler.
	type DivMouseEvent = Parameters<NonNullable<SelectableCardProps['onclick']>>[0];

	const composedOnClick = $derived(
		onClickProp
			? (event: DivMouseEvent) => {
					clickable.onclick(event);
					onClickProp(event);
				}
			: clickable.onclick
	);
	const composedOnMouseUp = $derived(
		onMouseUpProp
			? (event: DivMouseEvent) => {
					clickable.onmouseup(event);
					onMouseUpProp(event);
				}
			: clickable.onmouseup
	);

	const theme = $derived(
		themeProps('selectable-card', { variant, selected: isSelected ? 'true' : 'false' })
	);
	const inputAttrs = selectableCardInputAttrs();

	// Captures Card's rendered <div> for the clickable-container hook. Created once
	// so the attachment key stays stable across renders.
	const containerAttach = {
		[createAttachmentKey()]: (node: HTMLElement) => {
			container = node;
			return () => {
				container = null;
			};
		}
	};
</script>

<Card
	{...rest}
	{...theme}
	{...containerAttach}
	{width}
	{height}
	{maxWidth}
	{padding}
	{variant}
	{elevation}
	class={cx(theme.class, className)}
	style={styleProp as string | undefined}
	xstyle={selectableCardXstyle({ variant, isSelected, isDisabled }, xstyle)}
	onclick={!isDisabled ? composedOnClick : undefined}
	onmouseup={!isDisabled ? composedOnMouseUp : undefined}
>
	<input
		bind:this={interactive}
		type="checkbox"
		checked={isSelected}
		aria-label={label}
		disabled={isDisabled}
		onchange={() => onChange(!isSelected)}
		onkeydown={handleKeyDown}
		class={inputAttrs.class}
		style={inputAttrs.style}
	/>
	{@render children?.()}
</Card>
