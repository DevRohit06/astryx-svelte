<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { OutlineItem } from './types.js';
	import type { OutlineDensity } from './outline.stylex.js';

	// Upstream's `Outline.tsx` re-exports `OutlineItem`; here the root barrel takes
	// it straight from `./types.js` instead. Re-exporting a symbol this module also
	// imports trips eslint's `no-import-assign` inside a Svelte module script, and
	// the type module is the honest source anyway — the shape `TreeListItemData`
	// already uses. Consumer-visible surface is identical.

	export interface OutlineProps extends BaseProps<HTMLElement> {
		/** Ordered list of heading items to render. */
		items: OutlineItem[];

		/** ID of the currently active item. When provided, disables built-in scroll-spy. */
		activeId?: string;

		/** Called when the active item changes from scroll-spy or click. */
		onActiveIdChange?: (id: string) => void;

		/** Accessible label for the nav landmark. @default 'Table of contents' */
		label?: string;

		/**
		 * Density variant controlling item padding.
		 * - 'default': Standard spacing (default)
		 * - 'compact': Reduced spacing for dense UIs
		 * @default 'default'
		 */
		density?: OutlineDensity;

		/**
		 * Called when navigation to an item begins, before the scroll starts.
		 * Receives the item `id`. Pair with `onNavigateEnd` to drive an arrival
		 * effect (flash, ring, pulse) on the target heading.
		 */
		onNavigateStart?: (id: string) => void;

		/**
		 * Called once when navigation to an item resolves — when the smooth scroll
		 * settles, or immediately-ish when reduced motion turns it into a jump.
		 *
		 * Fires exactly once for every `onNavigateStart`, including when the user
		 * interrupts the scroll by scrolling manually, so a "navigating" state can
		 * never leak. It does not fire if the Outline unmounts mid-scroll.
		 */
		onNavigateEnd?: (id: string) => void;

		/**
		 * Height in px of a fixed header overlaying the top of the scroll root.
		 *
		 * Shifts both the activation line *and* the scroll landing by the same
		 * amount, so a heading activates exactly where navigating to it puts it —
		 * below the header rather than hidden underneath it.
		 *
		 * It composes with each heading's own `scroll-margin-top` (the header, then
		 * the breathing room below it) rather than replacing it. When nothing
		 * overlays the content, leave this at 0 and let `scroll-margin-top` do the
		 * work — the browser already honors it.
		 *
		 * @default 0
		 */
		offset?: number;

		/**
		 * Scroll container to track, instead of auto-detecting the nearest
		 * scrollable ancestor. Use this when the content scrolls inside a split
		 * pane, modal, or dashboard panel rather than the viewport.
		 *
		 * Upstream takes a `RefObject`; this port takes a getter, the settled
		 * translation for a ref-valued option (`ChatLayout.scrollRef`).
		 */
		scrollContainerRef?: () => HTMLElement | null;

		/**
		 * Whether activating an item smooth-scrolls to it. Set to false to own the
		 * scrolling yourself (virtualized content, a router) — the Outline still
		 * updates the active item, the hash, and the navigate callbacks, but
		 * performs no scroll and suppresses the anchor's default jump.
		 * @default true
		 */
		hasScrollOnClick?: boolean;

		/** Test ID for testing frameworks. */
		'data-testid'?: string;
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import LinkElement from '../link/link-element.svelte';
	import { themeProps } from '../../internal/theme-props.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { useListFocus } from '../../hooks/use-list-focus.svelte.js';
	import { useScrollSpy } from './use-scroll-spy.svelte.js';
	import {
		outlineRootAttrs,
		outlineListAttrs,
		outlineItemAttrs,
		outlineLinkAttrs,
		outlineLabelAttrs,
		outlineTrackAttrs,
		outlineDividerLineAttrs,
		outlineIndicatorAttrs
	} from './outline.stylex.js';

	/**
	 * A table-of-contents navigation component for document headings, ported from
	 * Astryx's `Outline/Outline.tsx`.
	 *
	 * `Outline` accepts a flat `items` array and renders anchor links with
	 * indentation based on each heading level. Features a sliding indicator track
	 * that animates to the active item.
	 *
	 * When `activeId` is omitted, it tracks scroll position and marks the last
	 * heading whose top has passed its activation line — which is exactly where
	 * navigating to that heading lands it: `offset` (a fixed header overlaying the
	 * scroll root) plus the heading's own `scroll-margin-top`. It defaults to the
	 * first item at the top and the last at the bottom.
	 *
	 * Keyboard: the list is a single tab stop (roving tabindex), seated on the
	 * active heading. Arrow keys move between headings, Home/End jump to the ends,
	 * and Enter/Space activate — so a long table of contents costs one Tab press,
	 * not one per heading.
	 *
	 * **The indicator's anchor name is a literal, not per-instance** —
	 * `--outline-active`, exactly as upstream declares it. Two `Outline`s in one
	 * document therefore declare the same `anchor-name`, and each indicator
	 * resolves it to the last such element in DOM order rather than to its own
	 * outline's active link. Replicated rather than fixed: minting a per-instance
	 * name would need the name in an inline style, which is the shape
	 * `useLayer.attachTrigger` has to repair against Svelte's whole-attribute
	 * `style` writes. Recorded in TODO.md.
	 *
	 * @example
	 * ```svelte
	 * <Outline
	 *   items={[
	 *     { id: 'intro', label: 'Introduction', level: 1 },
	 *     { id: 'features', label: 'Features', level: 2 },
	 *     { id: 'api', label: 'API Reference', level: 1 }
	 *   ]}
	 * />
	 * ```
	 */
	const {
		items,
		activeId,
		onActiveIdChange,
		label: labelFromProps,
		density = 'default',
		onNavigateStart,
		onNavigateEnd,
		offset = 0,
		scrollContainerRef,
		hasScrollOnClick = true,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId,
		...rest
	}: OutlineProps = $props();

	const t = useTranslator();
	const label = $derived(labelFromProps ?? t('@astryx.outline.label'));

	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink());

	// Upstream forwards `ref` to the nav via `mergeRefs(rootRef, ref)`; here the
	// component's own handle is `bind:this` and a caller's is an attachment
	// travelling through `{...rest}`, so nothing needs merging.
	let rootEl = $state<HTMLElement | null>(null);
	let listEl = $state<HTMLUListElement | null>(null);

	const spy = useScrollSpy(() => ({
		activeId,
		items,
		onActiveIdChange,
		rootEl,
		offset,
		scrollContainerRef,
		hasScrollOnClick,
		onNavigateStart,
		onNavigateEnd
	}));

	// Roving tabindex over the links: the whole outline is one tab stop, and
	// arrows move between headings. The hook owns `tabindex` on the items.
	const list = useListFocus(() => ({
		itemSelector: 'a[href]',
		orientation: 'vertical',
		hasRovingTabIndex: true
	}));

	// Seat the tab stop on the *active* heading. WAI-ARIA puts the single tab stop
	// on the current item, so tabbing into a table of contents while reading
	// section 7 lands on section 7 — not back at section 1, which is where
	// `useListFocus` would otherwise leave it (it promotes the first item on mount
	// and then keeps whichever item already holds the stop).
	//
	// Only while focus is outside the list: once the reader has arrowed to an
	// item, the stop is theirs and scroll-spy must not yank it away. Sets
	// `tabindex` only — it never steals focus.
	//
	// Upstream orders this after `useListFocus`'s own layout effect so it wins.
	// **Here the order does not matter, and that is worth stating rather than
	// relying on**: `syncTabStops` keeps whichever enabled item already carries
	// `tabindex="0"` and only promotes the first as a fallback, so running before
	// this effect leaves item 0 stamped and this effect moves it, while running
	// after finds the active item stamped and keeps it. Both orders converge.
	$effect(() => {
		// The reads that make this run again: the active id, and the items whose
		// links it must find. `listEl` is what makes it run at all.
		void spy.activeId;
		void items;

		const el = listEl;
		if (el == null || el.contains(document.activeElement)) {
			return;
		}
		const links = Array.from(el.querySelectorAll<HTMLElement>('a[href]'));
		const active = links.find((link) => link.getAttribute('aria-current') === 'location');
		if (active == null) {
			return;
		}
		for (const link of links) {
			const tabIndex = link === active ? '0' : '-1';
			if (link.getAttribute('tabindex') !== tabIndex) {
				link.setAttribute('tabindex', tabIndex);
			}
		}
	});

	const theme = $derived(themeProps('outline', { density }));
	const rootAttrs = $derived(outlineRootAttrs(xstyle));
	const listAttrs = $derived(outlineListAttrs());
	const itemAttrs = $derived(outlineItemAttrs());
	const labelAttrs = $derived(outlineLabelAttrs());
	const trackAttrs = $derived(outlineTrackAttrs());
	const dividerLineAttrs = $derived(outlineDividerLineAttrs());
	const indicatorTheme = $derived(themeProps('outline-indicator'));
	const indicatorAttrs = $derived(outlineIndicatorAttrs());

	/**
	 * The single navigation path, shared by click and keyboard activation: push
	 * the hash, then hand off to the scroll-spy's `scrollTo`, which fires the
	 * navigate callbacks and moves the indicator when the scroll settles.
	 */
	function navigate(id: string): void {
		if (spy.scrollTo(id)) {
			window.history.pushState(null, '', `#${id}`);
		}
	}

	/** Whether an event carries a modifier chord we must leave to the browser. */
	function hasModifier(event: MouseEvent | KeyboardEvent): boolean {
		return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
	}

	function handleClick(id: string, event: MouseEvent): void {
		// Let the browser handle modified clicks (open in new tab, etc.) without
		// touching the active state.
		if (event.defaultPrevented || hasModifier(event)) {
			return;
		}

		// With no target in the DOM — lazily-rendered or virtualized content —
		// there is nothing to scroll to and nothing to make active. Leave the
		// anchor to the browser's native fragment navigation (which still updates
		// the URL) rather than swallowing the click into a dead link.
		if (document.getElementById(id) == null) {
			return;
		}

		// Suppress the anchor's default jump: we own the scroll (or, with
		// `hasScrollOnClick={false}`, deliberately leave it to the consumer).
		event.preventDefault();
		navigate(id);
	}

	function handleKeyDown(id: string, event: KeyboardEvent): void {
		// Enter is a link's native activation and already produces a click. Space
		// is not, so wire it up here to match the button-like affordance.
		if (event.key !== ' ' && event.key !== 'Spacebar') {
			return;
		}
		if (event.defaultPrevented || hasModifier(event)) {
			return;
		}

		// preventDefault does double duty: it stops the page from scrolling, and it
		// tells useScrollSpy this Space is an activation, not a manual scroll.
		event.preventDefault();
		navigate(id);
	}
</script>

<nav
	{...rest}
	bind:this={rootEl}
	aria-label={label}
	data-testid={testId}
	{...theme}
	class={cx(theme.class, rootAttrs.class, className)}
	style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
>
	<!--
		The handlers delegate for the `<a>` children, they do not make the list
		itself operable: `handleKeyDown` moves the roving tab stop between links
		that are already interactive, and `handleFocus` only reconciles `tabindex`
		after one of them takes focus. Nothing here is reachable without first
		focusing a link, so the list needs no role or tab stop of its own — which
		is the composite-widget container pattern, and what upstream's `<ul>` does.
	-->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<ul
		{@attach list.attachList}
		bind:this={listEl}
		class={listAttrs.class}
		style={listAttrs.style}
		role="list"
		onkeydown={list.handleKeyDown}
		onfocusin={list.handleFocus}
	>
		{#each items as item (item.id)}
			{@const isActive = item.id === spy.activeId}
			{@const itemTheme = themeProps('outline-item', {
				active: isActive ? 'active' : null,
				level: item.level
			})}
			{@const linkAttrs = outlineLinkAttrs(density, item.level, isActive)}
			<li class={itemAttrs.class} style={itemAttrs.style} role="listitem">
				<LinkElement
					component={linkResolved.component}
					props={{
						href: `#${item.id}`,
						...(linkResolved.isNative ? {} : { to: `#${item.id}` }),
						'aria-current': isActive ? 'location' : undefined,
						onclick: (event: MouseEvent) => handleClick(item.id, event),
						onkeydown: (event: KeyboardEvent) => handleKeyDown(item.id, event),
						...itemTheme,
						class: cx(itemTheme.class, linkAttrs.class),
						style: linkAttrs.style
					}}
				>
					<span class={labelAttrs.class} style={labelAttrs.style}>{item.label}</span>
				</LinkElement>
			</li>
		{/each}
	</ul>

	<!-- Track divider. Rendered after the list so the active anchor appears
	     earlier in DOM order; `order: -1` keeps the track visually before it. -->
	<div class={trackAttrs.class} style={trackAttrs.style} aria-hidden="true">
		<span class={dividerLineAttrs.class} style={dividerLineAttrs.style}></span>
	</div>
	<span
		{...indicatorTheme}
		class={cx(indicatorTheme.class, indicatorAttrs.class)}
		style={indicatorAttrs.style}
		aria-hidden="true"
	></span>
</nav>
