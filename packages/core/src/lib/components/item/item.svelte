<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { ItemAlign, ItemDensity } from './item.stylex.js';

	/**
	 * `onclick` is omitted from `BaseProps` so the narrowed redeclaration below
	 * replaces it. `label`/`description` are `string | Snippet` because a *string*
	 * label opts into single-line truncation automatically (upstream branches on
	 * `typeof label === 'string'`); the other slots are element content, so plain
	 * `Snippet`.
	 */
	export interface ItemProps extends Omit<BaseProps<HTMLElement>, 'onclick'> {
		/**
		 * Root element tag.
		 * @default 'div'
		 */
		as?: 'div' | 'li' | 'span';
		/** Leading marker (a bullet, number, radio dot) — rendered raw, no wrapper. */
		marker?: Snippet;
		/** Leading content (avatar, icon), wrapped in a fixed-size slot. */
		startContent?: Snippet;
		/** The primary line. A string label single-line-truncates by default. */
		label: string | Snippet;
		/** The secondary line below the label. */
		description?: string | Snippet;
		/** Trailing content (badge, timestamp, chevron), pushed to the end. */
		endContent?: Snippet;
		/**
		 * @default 'center'
		 */
		align?: ItemAlign;
		/**
		 * @default 'balanced'
		 */
		density?: ItemDensity;
		/** Max lines for the label before truncating (`1` = ellipsis, `>1` = clamp). */
		labelLines?: number;
		/** Max lines for the description before truncating. */
		descriptionLines?: number;
		/** Click handler. Makes the item interactive (a `<button>` when no `href`). */
		onclick?: (event: MouseEvent) => void;
		/**
		 * A nested control inside the item (e.g. a checkbox in `startContent`) that
		 * already provides the item's keyboard access and action. When set, the item
		 * becomes an enlarged click/tap target that delegates surface clicks to that
		 * control via the `useClickableContainer` pattern: it renders no invisible
		 * button/anchor, so the row adds no second tab stop (WCAG 4.1.2 — one
		 * focusable control per option). Clicks on the control itself, and on any
		 * other nested interactive element, are left to that element. Mutually
		 * exclusive with `onclick`/`href` — when `interactiveRef` is set those are
		 * ignored (the nested control is the sole action), and a dev warning says so.
		 *
		 * Upstream takes a `RefObject<HTMLElement | null>` and reads `.current` at
		 * each use; this port takes a **getter**, read at exactly the same points —
		 * the settled `useOutlineFromDOM` / `useChatStreamScroll` translation. Pass
		 * `() => el` over a `$state` binding, so the read stays live across the
		 * control mounting and unmounting.
		 */
		interactiveRef?: () => HTMLElement | null;
		/** Destination. Makes the item a link. */
		href?: string;
		/** Anchor target. */
		target?: '_blank' | '_self';
		/** Anchor rel. Safe tokens are auto-added for `target="_blank"`. */
		rel?: string;
		/**
		 * @default false
		 */
		isHighlighted?: boolean;
		/**
		 * Selected state. Always applies the selected visual styling. When `role`
		 * permits it (option, tab, row, gridcell, columnheader, rowheader,
		 * treeitem) the state is exposed as `aria-selected`; otherwise (e.g. a
		 * listitem or a bare div, where `aria-selected` is invalid ARIA) it falls
		 * back to `aria-current="true"` so assistive tech is still told which item
		 * is selected. A consumer-provided `aria-current` always wins.
		 * @default false
		 */
		isSelected?: boolean;
		/**
		 * @default false
		 */
		isDisabled?: boolean;
	}

	/**
	 * Roles on which WAI-ARIA permits the `aria-selected` attribute.
	 * https://www.w3.org/TR/wai-aria-1.2/#aria-selected
	 */
	const ARIA_SELECTED_ROLES = new Set([
		'option',
		'tab',
		'row',
		'gridcell',
		'columnheader',
		'rowheader',
		'treeitem'
	]);
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useClickableContainer } from '../../hooks/use-clickable-container.svelte.js';
	import { useDevWarning } from '../../hooks/use-dev-warning.svelte.js';
	import { computeTargetAndRel } from '../link/compute-target-and-rel.js';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import LinkElement from '../link/link-element.svelte';
	import {
		itemContentAttrs,
		itemDescriptionAttrs,
		itemEndContentAttrs,
		itemInvisibleAnchorAttrs,
		itemInvisibleButtonAttrs,
		itemLabelAttrs,
		itemRootAttrs,
		itemStartContentAttrs
	} from './item.stylex.js';

	/**
	 * A universal item primitive — the shared "start content + label +
	 * description + end content" row behind list items, menu items, contact rows
	 * and notifications. Static by default; a `href` makes it a link and an
	 * `onclick` makes it a button, with the whole row clickable but inner
	 * controls left to fire on their own.
	 *
	 * @example
	 * ```svelte
	 * <Item label="Ada Lovelace" description="Engineer" onclick={select}>
	 *   {#snippet startContent()}<Avatar name="Ada Lovelace" size="sm" />{/snippet}
	 *   {#snippet endContent()}<Badge label={3} />{/snippet}
	 * </Item>
	 * ```
	 */
	let {
		as = 'div',
		marker,
		startContent,
		label,
		description,
		endContent,
		align = 'center',
		density = 'balanced',
		labelLines,
		descriptionLines,
		onclick,
		interactiveRef,
		href,
		target: targetFromProps,
		rel: relFromProps,
		isHighlighted = false,
		isSelected = false,
		isDisabled = false,
		xstyle,
		class: className,
		style: styleProp,
		role,
		...rest
	}: ItemProps = $props();

	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink());

	let rootEl = $state<HTMLElement | null>(null);

	// Delegation mode: the row is an enlarged click/tap target for a nested
	// control (e.g. a checkbox) that owns the keyboard access and action. The
	// control is the row's only tab stop; the row proxies surface clicks to it.
	const isDelegate = $derived(interactiveRef != null);

	// Only the click handler is taken: `onmouseup` handles middle-click `href`
	// navigation, which delegation mode never has (`href` is ignored here).
	//
	// `container` is withheld — not merely `disabled` — outside delegation mode,
	// and that guard is load-bearing rather than tidiness: the hook's `$effect`
	// stamps `data-pressable-container` on whatever container it is handed
	// regardless of `disabled`, and that attribute is itself in
	// `INTERACTIVE_SELECTORS`. Stamping every `Item` would make an enclosing
	// clickable container treat plain rows as interactive and stop forwarding
	// clicks through them. Upstream gets the same guard for free: its
	// `containerRef` is only attached to the root element when `isDelegate`.
	const delegated = useClickableContainer(() => ({
		container: isDelegate ? rootEl : null,
		interactive: interactiveRef?.() ?? null,
		disabled: isDisabled
	}));

	useDevWarning(
		'Item',
		'`interactiveRef` is mutually exclusive with `onclick`/`href`. In ' +
			'delegation mode the row only forwards clicks to the referenced control, ' +
			'so `onclick`/`href` are ignored. Drop one of them.',
		() => isDelegate && (onclick != null || href != null)
	);

	const isInteractive = $derived(onclick != null || href != null || isDelegate);
	// A caller-provided role means a parent owns keyboard access — put onclick on
	// the root, skip the invisible button/anchor, and drop the disabled dim.
	const hasParentRole = $derived(role != null);

	// `aria-selected` is only valid on the roles WAI-ARIA 1.2 permits it on, so a
	// plain `listitem` or bare `div` carrying it was invalid ARIA. For those,
	// selection is conveyed via `aria-current` — valid on any element — so the
	// state still reaches AT. Written after `{...rest}` so it defers to a
	// consumer-provided `aria-current`. The selected *styling* is unconditional
	// either way.
	const allowsAriaSelected = $derived(role != null && ARIA_SELECTED_ROLES.has(role));

	const targetAndRel = $derived(computeTargetAndRel(targetFromProps, relFromProps));

	const isStringLabel = $derived(typeof label === 'string');
	const isStringDescription = $derived(typeof description === 'string');

	const theme = $derived(themeProps('item', { density, align }));
	const rootAttrs = $derived(
		itemRootAttrs(
			density,
			align,
			{ isInteractive, isHighlighted, isSelected, isDisabled, hasParentRole },
			xstyle
		)
	);
	const labelAttrs = $derived(itemLabelAttrs(labelLines, isStringLabel));
	const descAttrs = $derived(itemDescriptionAttrs(descriptionLines, isStringDescription));
	const contentAttrs = $derived(itemContentAttrs(isDisabled));
	const buttonAttrs = $derived(itemInvisibleButtonAttrs(isDisabled));
	const anchorAttrs = $derived(itemInvisibleAnchorAttrs(isDisabled));
	const startAttrs = itemStartContentAttrs();
	const endAttrs = $derived(itemEndContentAttrs(isDisabled));

	// The polymorphic link props for the invisible-anchor branch; custom
	// components also get a `to={href}` alias.
	const anchorProps = $derived({
		href,
		...(linkResolved.isNative ? {} : { to: href }),
		target: targetAndRel.target,
		rel: targetAndRel.rel,
		'aria-disabled': isDisabled || undefined,
		tabindex: isDisabled ? -1 : undefined,
		class: anchorAttrs.class,
		style: anchorAttrs.style
	});

	function handleContainerClick(e: MouseEvent): void {
		if (isDisabled) {
			return;
		}
		// A click that landed on an inner control fires that control only, not the row.
		if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) {
			return;
		}
		onclick?.(e);
	}

	const rootOnclick = $derived(
		isDelegate
			? delegated.onclick
			: hasParentRole
				? onclick
				: isInteractive
					? handleContainerClick
					: undefined
	);
</script>

{#snippet labelAndDescription()}
	<span class={labelAttrs.class} style={labelAttrs.style}>
		{#if typeof label === 'function'}{@render label()}{:else}{label}{/if}
	</span>
	{#if description != null}
		<span class={descAttrs.class} style={descAttrs.style}>
			{#if typeof description === 'function'}{@render description()}{:else}{description}{/if}
		</span>
	{/if}
{/snippet}

<svelte:element
	this={as}
	bind:this={rootEl}
	{...rest}
	aria-selected={(allowsAriaSelected && isSelected) || undefined}
	aria-current={rest['aria-current'] ?? (isSelected && !allowsAriaSelected ? true : undefined)}
	aria-disabled={isDisabled || undefined}
	{...theme}
	class={cx(theme.class, rootAttrs.class, className)}
	style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	{role}
	onclick={rootOnclick}
>
	{#if marker}{@render marker()}{/if}
	{#if startContent != null}
		<span class={startAttrs.class} style={startAttrs.style}>{@render startContent()}</span>
	{/if}

	{#if hasParentRole || isDelegate}
		<!--
			Delegation mode (and parent-role mode) put the label in a plain span:
			keyboard access lives on the nested control, so no invisible
			button/anchor is rendered and the row adds no second tab stop.
		-->
		<span class={contentAttrs.class} style={contentAttrs.style}>
			{@render labelAndDescription()}
		</span>
	{:else if href != null}
		<LinkElement component={linkResolved.component} props={anchorProps}>
			{@render labelAndDescription()}
		</LinkElement>
	{:else if onclick != null}
		<button
			type="button"
			{onclick}
			disabled={isDisabled}
			class={buttonAttrs.class}
			style={buttonAttrs.style}
		>
			{@render labelAndDescription()}
		</button>
	{:else}
		<span class={contentAttrs.class} style={contentAttrs.style}>
			{@render labelAndDescription()}
		</span>
	{/if}

	{#if endContent != null}
		<span class={endAttrs.class} style={endAttrs.style}>{@render endContent()}</span>
	{/if}
</svelte:element>
