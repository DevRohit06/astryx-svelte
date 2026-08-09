<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	/**
	 * `onclick` is omitted from `BaseProps` so the narrowed redeclaration below
	 * replaces it, as `Item`'s own props do. `label`/`description` are
	 * `string | Snippet` for the same reason they are on `Item`: a *string* opts
	 * into single-line truncation, richer content does not.
	 */
	export interface ListItemProps extends Omit<BaseProps<HTMLLIElement>, 'onclick'> {
		/** Primary text label. A string single-line-truncates automatically. */
		label: string | Snippet;
		/** Secondary description below the label. */
		description?: string | Snippet;
		/** Content rendered before the item (icon, avatar, checkbox). */
		startContent?: Snippet;
		/** Content rendered after the item (badge, action button, chevron). */
		endContent?: Snippet;
		/** Click handler for interactive items. Enables hover/press styles. */
		onclick?: (event: MouseEvent) => void;
		/**
		 * A nested control inside the item (e.g. a checkbox in `startContent`) that
		 * already provides the item's keyboard access and action. When set, the item
		 * becomes an enlarged click/tap target that delegates surface clicks to that
		 * control via the `useClickableContainer` pattern: it renders no invisible
		 * button/anchor, so the row adds no second tab stop (WCAG 4.1.2 — one
		 * focusable control per option). Mutually exclusive with `onclick`/`href` —
		 * when set those are ignored.
		 *
		 * Upstream takes a `RefObject<HTMLElement | null>`; this port takes a
		 * **getter**, read at the same points — the settled `useOutlineFromDOM` /
		 * `useChatStreamScroll` translation. Forwarded verbatim to `Item`.
		 */
		interactiveRef?: () => HTMLElement | null;
		/** URL for link items. Renders an invisible anchor and enables hover/press styles. */
		href?: string;
		/** Link target (e.g. `'_blank'`). Only used with `href`. */
		target?: string;
		/** Link relationship. `noopener noreferrer` is added for `target="_blank"`. */
		rel?: string;
		/**
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * @default false
		 */
		isSelected?: boolean;
	}
</script>

<script lang="ts">
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import Item from '../item/item.svelte';
	import { useList } from './list-context.svelte.js';
	import {
		listItemXstyle,
		markerCircleAttrs,
		markerContainerAttrs,
		markerDotAttrs,
		markerNumberAttrs
	} from './list-item.stylex.js';

	/**
	 * A list item for use within `List`.
	 *
	 * Renders structured content with a label, description and start/end content
	 * areas. `onclick` uses the invisible button pattern; `href` the invisible
	 * anchor one. Density, dividers and markers come from the enclosing `List`.
	 *
	 * @example
	 * ```svelte
	 * <ListItem label="Settings" description="Manage your preferences" />
	 * <ListItem label="Profile" onclick={() => goto('/profile')} />
	 * ```
	 */
	let {
		label,
		description,
		startContent,
		endContent,
		onclick,
		interactiveRef,
		href,
		target,
		rel,
		isDisabled = false,
		isSelected = false,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ListItemProps = $props();

	// Optional by design: upstream's `use(ListContext)` is `null` outside a
	// `<List>` and falls back to these same defaults, so a bare item renders.
	const list = useList();
	const density = $derived(list?.().density ?? 'balanced');
	const hasDividers = $derived(list?.().hasDividers ?? false);
	const listStyle = $derived(list?.().listStyle ?? 'none');
	const hasMarkers = $derived(listStyle !== 'none');

	// Upstream types `ListItem`'s props `BaseProps<HTMLLIElement>` — the element
	// `Item` really renders for `as="li"` — while `Item`'s own props are
	// `BaseProps<HTMLElement>`. Event handlers are contravariant in that element
	// type, so the two are incompatible at the seam even though the DOM agrees.
	// The public type stays upstream's; the widening happens at the one point the
	// rest props cross into `Item`, rather than by weakening what we publish.
	const itemRest = $derived(rest as Omit<BaseProps<HTMLElement>, 'onclick'>);

	const theme = themeProps('list-item');
	const containerAttrs = markerContainerAttrs();
	const dotAttrs = markerDotAttrs();
	const circleAttrs = markerCircleAttrs();
	const numberAttrs = markerNumberAttrs();
</script>

{#snippet marker()}
	{#if listStyle === 'disc'}
		<span class={containerAttrs.class} style={containerAttrs.style}>
			<span class={dotAttrs.class} style={dotAttrs.style}></span>
		</span>
	{:else if listStyle === 'circle'}
		<span class={containerAttrs.class} style={containerAttrs.style}>
			<span class={circleAttrs.class} style={circleAttrs.style}></span>
		</span>
	{:else if listStyle === 'decimal'}
		<span class={numberAttrs.class} style={numberAttrs.style}></span>
	{/if}
{/snippet}

<Item
	{...itemRest}
	as="li"
	marker={hasMarkers ? marker : undefined}
	{startContent}
	{label}
	{description}
	{endContent}
	{onclick}
	{interactiveRef}
	{href}
	target={target as '_blank' | '_self' | undefined}
	{rel}
	{isDisabled}
	{isSelected}
	{density}
	xstyle={listItemXstyle(hasMarkers, hasDividers, xstyle)}
	class={cx(theme.class, className)}
	style={styleProp}
/>
