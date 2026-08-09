<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { Elevation } from '../../internal/types.js';
	import type { SizeValue, SpacingStep } from '../../internal/types.js';
	import type { CardVariant } from '../card/card.stylex.js';

	/**
	 * `onclick` is redeclared as a loose `MouseEvent` handler (matching upstream's
	 * `MouseEvent<HTMLElement>`) so it threads into `useClickableContainer` and onto
	 * the hidden `<button>` without a currentTarget mismatch.
	 */
	export interface ClickableCardProps extends Omit<BaseProps<HTMLDivElement>, 'onclick'> {
		/** Accessible name — becomes the hidden control's `aria-label`. */
		label: string;
		/** Fires when the card surface (not a nested control) is clicked. */
		onclick?: (event: MouseEvent) => void;
		/** Navigation URL. Ctrl/Cmd+click opens a new tab. */
		href?: string;
		/** Link target for `href` navigation. */
		target?: string;
		/** Disabled cards stay discoverable (the control keeps its label). @default false */
		isDisabled?: boolean;
		children?: Snippet;
		/** @default 4 (16px) */
		padding?: SpacingStep;
		/** @default 'default' */
		variant?: CardVariant;
		/**
		 * Resting elevation — the shadow depth the card sits at. Often raised to
		 * signal that the surface is interactive.
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
	import LinkElement from '../link/link-element.svelte';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useClickableContainer } from '../../hooks/use-clickable-container.svelte.js';
	import { clickableCardControlAttrs, clickableCardXstyle } from './clickable-card.stylex.js';

	/**
	 * An interactive card that acts as a single navigation or action target.
	 * Composes `Card` for all visual styling and adds an interactive layer via
	 * `useClickableContainer`. A visually-hidden `<button>` (action) or `<a>`
	 * (link) inside carries the accessible role/label — the card surface has none.
	 *
	 * Both DOM elements the hook needs are captured without a `Card` element seam:
	 * the container `<div>` via an attachment through `{...rest}`, and the hidden
	 * control via `bind:this` (button) or an attachment through `LinkElement` (link).
	 */
	const {
		label,
		onclick: onClickProp,
		onmouseup: onMouseUpProp,
		href,
		target,
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
	}: ClickableCardProps = $props();

	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink());
	const isLink = $derived(href != null);

	let container = $state<HTMLElement | null>(null);
	let interactive = $state<HTMLElement | null>(null);

	const clickable = useClickableContainer(() => ({
		container,
		interactive,
		onclick: onClickProp,
		href,
		target,
		disabled: isDisabled
	}));

	type DivMouseEvent = Parameters<NonNullable<ClickableCardProps['onmouseup']>>[0];
	const handleMouseUp = $derived(
		onMouseUpProp
			? (event: DivMouseEvent) => {
					clickable.onmouseup(event);
					onMouseUpProp(event);
				}
			: clickable.onmouseup
	);

	const theme = $derived(themeProps('clickable-card', { variant }));
	const controlAttrs = clickableCardControlAttrs();

	// Stable attachments (keys created once) that capture the two elements the
	// hook needs — Card's <div> and, in link mode, the hidden anchor.
	const containerAttach = {
		[createAttachmentKey()]: (node: HTMLElement) => {
			container = node;
			return () => {
				container = null;
			};
		}
	};
	const controlAttach = {
		[createAttachmentKey()]: (node: HTMLElement) => {
			interactive = node;
			return () => {
				interactive = null;
			};
		}
	};

	// The polymorphic anchor props for the hidden link; a custom component also
	// gets a `to={href}` alias, matching upstream's `createLinkWithTo`.
	const anchorProps = $derived({
		...controlAttach,
		href,
		...(linkResolved.isNative ? {} : { to: href }),
		target,
		'aria-label': label,
		'aria-disabled': isDisabled || undefined,
		tabindex: isDisabled ? -1 : 0,
		class: controlAttrs.class,
		style: controlAttrs.style
	});
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
	xstyle={clickableCardXstyle({ variant, isDisabled }, xstyle)}
	onclick={!isDisabled ? clickable.onclick : undefined}
	onmouseup={!isDisabled ? handleMouseUp : undefined}
>
	{#if isLink}
		<!-- The hidden anchor has no content; LinkElement requires a children snippet. -->
		<LinkElement component={linkResolved.component} props={anchorProps} children={emptyControl} />
	{:else}
		<button
			bind:this={interactive}
			type="button"
			aria-label={label}
			disabled={isDisabled}
			onclick={onClickProp}
			class={controlAttrs.class}
			style={controlAttrs.style}
		></button>
	{/if}
	{@render children?.()}
</Card>

{#snippet emptyControl()}{/snippet}
