<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { TabListLayout, TabListSize } from './tab-list-context.svelte.js';

	/**
	 * How a strip narrower than its tabs behaves.
	 *
	 * - `'auto'` — the component picks the strategy. Today that is always
	 *   `'scroll'`.
	 * - `'scroll'` — the tabs scroll horizontally. Every tab stays a tab.
	 * - `'visible'` — no overflow handling: tabs keep their intrinsic widths and
	 *   spill out of the strip, as they did before overflow existed.
	 */
	export type TabListOverflow = 'auto' | 'scroll' | 'visible';

	export interface TabListProps extends Omit<BaseProps<HTMLElement>, 'onchange'> {
		/** The currently selected tab value. */
		value: string;
		/** Callback fired when a tab is selected. */
		onChange: (value: string) => void;
		/**
		 * Size of the tab hover targets. Uses the same element size tokens
		 * as `Button` and `TextInput` (`sm` = 28px, `md` = 32px, `lg` = 36px).
		 * @default 'md'
		 */
		size?: TabListSize;
		/**
		 * Layout mode for tab sizing.
		 * - `'hug'` (default): each tab hugs its content width.
		 * - `'fill'`: tabs stretch equally to fill the container width.
		 * @default 'hug'
		 */
		layout?: TabListLayout;
		/**
		 * Whether to show a bottom divider under the tab list.
		 * @default false
		 */
		hasDivider?: boolean;
		/**
		 * What happens when the tabs are wider than the strip.
		 *
		 * `'auto'` lets the component choose; today it always scrolls. `'scroll'`
		 * scrolls the tabs horizontally, with edge fades and — for pointers that
		 * can hover — arrow affordances. `'visible'` turns overflow handling off
		 * and lets the tabs spill out of the strip.
		 *
		 * The selected tab is always scrolled back into view.
		 * @default 'auto'
		 */
		overflow?: TabListOverflow;
		/** `Tab` and `TabMenu` children. */
		children: Snippet;
	}

	/**
	 * Selector matching the focusable stops in the tab strip: every `Tab`
	 * (`[data-tab-value]`) and every `TabMenu` trigger (`[data-tab-menu]`),
	 * in DOM order. Disabled stops are filtered out by the handler.
	 */
	const TAB_STOP_SELECTOR = '[data-tab-value],[data-tab-menu]';

	/** Fraction of the visible strip an arrow press scrolls. */
	const SCROLL_PAGE_RATIO = 0.8;
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import KeyboardHintLayer from '../../hooks/keyboard-hint-layer.svelte';
	import { isRtlElement } from '../../hooks/is-rtl-element.js';
	import { useKeyboardHint } from '../../hooks/use-keyboard-hint.svelte.js';
	import { useListFocus } from '../../hooks/use-list-focus.svelte.js';
	import { useScrollOverflow } from '../../hooks/use-scroll-overflow.svelte.js';
	import { useSize } from '../../internal/contexts.svelte.js';
	import { EDGE_COMP_ATTR } from '../../internal/edge-compensation.stylex.js';
	import { observeResize, unobserveResize } from '../../internal/shared-resize-observer.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { devWarn } from '../../utils/dev-warning.js';
	import { rtlStyles } from '../../utils/rtl.stylex.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import Icon from '../icon/icon.svelte';
	import { setTabListContext } from './tab-list-context.svelte.js';
	import {
		tabListNavAttrs,
		tabScrollButtonAttrs,
		tabStripAttrs,
		type TabStripFade
	} from './tab-list.stylex.js';

	/**
	 * Tab strip wrapper. Provides context for value/onChange/size/layout and the
	 * resolved ARIA pattern to `Tab` and `TabMenu` children. A `<nav>` landmark by
	 * default; it speaks the WAI-ARIA tabs pattern where the caller asks for it
	 * with `role="tablist"`. Owns roving-tabindex keyboard navigation
	 * (Arrow/Home/End) across the strip so it is a single Tab stop, and owns
	 * horizontal scrolling when the tabs are wider than the strip.
	 *
	 * @example
	 * ```svelte
	 * <TabList value={activeTab} onChange={(v) => (activeTab = v)}>
	 *   <Tab value="home" label="Home" />
	 *   <Tab value="settings" label="Settings" />
	 *   <TabMenu label="More" options={[{ value: 'analytics', label: 'Analytics' }]} />
	 * </TabList>
	 * ```
	 */
	let {
		value,
		onChange,
		size: sizeProp,
		layout = 'hug',
		hasDivider = false,
		// NOT re-declared in `TabListProps`, unlike upstream, which restates it on
		// the interface for its doc comment. `BaseProps` already publishes it, as
		// upstream's does — restating it here would *narrow* Svelte's
		// `AriaRole | null` to `AriaRole`, which is a change to this port's public
		// type rather than a copy of upstream's. The behaviour it drives is
		// documented on the component instead; only `'tablist'` switches the
		// pattern, and every other value passes through to the element untouched.
		role,
		overflow = 'auto',
		xstyle,
		class: className,
		style: styleProp,
		children,
		onkeydown: onKeyDownProp,
		onfocusin: onFocusProp,
		onfocusout: onBlurProp,
		'aria-label': ariaLabelFromProps,
		'aria-labelledby': ariaLabelledBy,
		// Read and dropped, as upstream reads and drops it: `aria-orientation` is
		// not an allowed attribute on the navigation role and trips axe's
		// `aria-allowed-attr`.
		'aria-orientation': _ariaOrientation,
		// Written literally, not as `[EDGE_COMP_ATTR]`: a `$props()` destructuring
		// pattern may not carry a computed key. The constant is still what the
		// element below is stamped with, so the two cannot drift apart silently —
		// a rename would leave this branch spreading the caller's value through
		// `rest`, which the element then overwrites anyway.
		'data-astryx-edge-comp': _edgeCompAttr,
		...rest
	}: TabListProps = $props();

	const t = useTranslator();
	const ariaLabel = $derived(ariaLabelFromProps ?? t('@astryx.tabList.label'));
	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));
	const hasScroll = $derived(overflow !== 'visible');

	// Only an asserted `role="tablist"` switches the pattern. Left unset the strip
	// is the `<nav>` it has always been, and every other role passes through to
	// the element untouched.
	const isTabList = $derived(role === 'tablist');

	let stripEl = $state<HTMLDivElement | null>(null);
	let rootEl = $state<HTMLElement | null>(null);

	const hintId = $props.id();

	// Roving-tabindex keyboard navigation across the tab strip via the shared
	// hook. Under the navigation pattern `orientation: 'both'` accepts both arrow
	// axes per the WAI-ARIA APG allowance for tab strips (ArrowRight/ArrowDown
	// advance, ArrowLeft/ArrowUp retreat). A tablist reports itself as horizontal,
	// so there the strip takes only the horizontal arrows and leaves ArrowUp and
	// ArrowDown to scroll the page. We do not set `aria-orientation` on the
	// `<nav>`: that attribute is invalid on the navigation role and triggers an
	// axe `aria-allowed-attr` violation.
	//
	// `hasRovingTabIndex` makes the hook own the single tab stop: it stamps
	// tabindex 0/-1, repairs the stop on mount and as stops mount/unmount or
	// toggle disabled, and — via `handleFocus` on the wrapper — keeps the stop in
	// sync after clicks or programmatic focus. Individual `Tab`s still render
	// `tabindex={isSelected ? 0 : -1}` as the initial source of truth; the hook's
	// repair preserves an existing tab stop and only promotes the first enabled
	// stop when none is tabbable.
	const list = useListFocus(() => ({
		itemSelector: TAB_STOP_SELECTOR,
		orientation: isTabList ? 'horizontal' : 'both',
		hasRovingTabIndex: true
	}));

	// No `orientation`: the hook's own `'horizontal'` default is what the badge
	// shows, matching upstream's now argument-less `useKeyboardHint()` call. The
	// `id` stays because this port's hook cannot mint one itself (see `useLayer`).
	const keyboardHint = useKeyboardHint(() => ({ id: hintId }));

	const scrollOverflow = useScrollOverflow();

	/**
	 * Upstream's `attachStrip` ref callback, which hands the scroll hook the strip
	 * only while overflow is handled and `null` otherwise. An attachment has the
	 * same attach/replace/detach lifecycle, so swapping the attachment on
	 * `hasScroll` is the same statement: the listeners and the resize observation
	 * go away with `overflow="visible"` rather than measuring a strip that never
	 * scrolls.
	 */
	const detached: Attachment<HTMLElement> = () => {};
	const attachStrip = $derived(hasScroll ? scrollOverflow.attach : detached);

	setTabListContext(() => ({
		value,
		onChange,
		size,
		layout,
		pattern: isTabList ? 'tabs' : 'nav'
	}));

	/**
	 * Scroll `stop` clear of the faded edges, if it is not already. Upstream's
	 * `revealStop`.
	 */
	function revealStop(stop: HTMLElement | null): void {
		const strip = stripEl;
		if (!hasScroll || !strip || !stop) {
			return;
		}
		const stripBox = strip.getBoundingClientRect();
		const stopBox = stop.getBoundingClientRect();
		const inset = parseFloat(getComputedStyle(strip).scrollPaddingLeft) || 0;
		const pastEnd = stopBox.right - (stripBox.right - inset);
		const pastStart = stopBox.left - (stripBox.left + inset);
		// A stop wider than the space kept clear cannot be shown whole, so show
		// its reading start, the way `scrollIntoView({inline: 'nearest'})` does.
		const tooWide = stopBox.width > stripBox.width - 2 * inset;
		const delta = tooWide
			? isRtlElement(strip)
				? pastEnd
				: pastStart
			: pastEnd > 0
				? pastEnd
				: pastStart < 0
					? pastStart
					: 0;
		if (delta !== 0) {
			// Not an animation: the strip has to arrive already showing the right
			// tab, so this overrides the CSS smooth behaviour arrow presses use.
			strip.scrollBy({ left: delta, behavior: 'instant' });
		}
	}

	function revealSelectedTab(): void {
		const strip = stripEl;
		if (!strip) {
			return;
		}
		revealStop(
			Array.from(strip.querySelectorAll<HTMLElement>('[data-tab-value]')).find(
				(el) => el.dataset.tabValue === value
			) ?? null
		);
	}

	// The tab you are on has to be visible. Selection can move without focus — on
	// mount, or when the host sets `value` itself — and neither scrolls the strip
	// the way clicking or arrowing to a tab does. The check is what makes a
	// selection change the trigger, rather than the effect happening to run.
	//
	// A plain `let`, not `$state`: upstream's `useRef` exists to hold a value
	// across renders without causing one, which a closure variable already is.
	let revealedValue: string | null = null;
	$effect(() => {
		const strip = stripEl;
		const next = value;
		// The strip is read **tracked**, and the latch is only taken once it
		// exists. React attaches every ref before it runs any effect, so upstream
		// can depend on `[value]` alone; a Svelte `bind:this` carries no such
		// guarantee, and latching against a strip that had not landed yet would
		// spend the mount reveal on nothing.
		if (strip == null || revealedValue === next) {
			return;
		}
		revealedValue = next;
		// `untrack` so a selection change is what re-runs this, as upstream's
		// dependency list says — not the reveal's own reads of `hasScroll` or of
		// the scroll state its `scrollBy` then changes.
		untrack(revealSelectedTab);
	});

	// ...and it has to stay visible when the strip is what moved. A strip that
	// fitted at one width can hide the selected tab at a narrower one, and no prop
	// changes when that happens. This one re-reveals the same selection by design,
	// which is why the check above sits in the effect rather than in
	// `revealSelectedTab`.
	//
	// The wrapper is observed rather than the strip because the shared observer
	// keeps one callback per element and `useScrollOverflow` already holds the
	// strip's.
	$effect(() => {
		const root = rootEl;
		if (!hasScroll || !root) {
			return;
		}
		const onResize = () => untrack(revealSelectedTab);
		observeResize(root, onResize);
		return () => unobserveResize(root);
	});

	function scrollByPage(direction: -1 | 1): void {
		const strip = stripEl;
		if (!strip) {
			return;
		}
		// Under RTL the scroll axis is inverted, so flip the physical delta.
		const rtlSign = isRtlElement(strip) ? -1 : 1;
		strip.scrollBy({
			left: rtlSign * direction * strip.clientWidth * SCROLL_PAGE_RATIO
		});
	}

	function handleRootKeyDown(e: KeyboardEvent): void {
		onKeyDownProp?.(e as KeyboardEvent & { currentTarget: EventTarget & HTMLElement });
		if (e.defaultPrevented) {
			return;
		}
		keyboardHint.onKeyDown(e);
		list.handleKeyDown(e);
	}

	function handleRootFocus(e: FocusEvent): void {
		onFocusProp?.(e as FocusEvent & { currentTarget: EventTarget & HTMLElement });
		if (e.defaultPrevented) {
			return;
		}
		keyboardHint.onFocus(e);
		list.handleFocus(e);
		// The browser scrolls a focused element into view only when it is entirely
		// outside the scrollport, so arrowing onto a half-visible stop leaves it cut
		// off under the fade. Finish the job it started.
		revealStop((e.target as HTMLElement | null)?.closest(TAB_STOP_SELECTOR) ?? null);
	}

	function handleRootBlur(e: FocusEvent): void {
		onBlurProp?.(e as FocusEvent & { currentTarget: EventTarget & HTMLElement });
		if (e.defaultPrevented) {
			return;
		}
		keyboardHint.onBlur(e);
	}

	/**
	 * Nothing hidden from assistive technology should end up holding focus, and a
	 * click would put it there.
	 */
	function preventFocus(e: MouseEvent): void {
		e.preventDefault();
	}

	// `role="tablist"` owns only tabs, so anything else in the strip is invalid
	// markup. Dev-only, and only under the asserted role — nothing else in the
	// component reads the rendered DOM.
	//
	// Upstream runs this from a **dependency-less** effect, i.e. after every
	// commit, because React cannot know which render put a stranger in the strip.
	// Svelte has no after-every-render hook and the strip's children belong to the
	// *consumer's* snippet, so a `MutationObserver` on the child list is the
	// DOM-level counterpart — the same substitution `useListFocus` makes for its
	// roving-tab-stop repair. It cannot loop or repeat: the latch below fires the
	// warning at most once per instance.
	let hasWarnedContent = false;

	function checkStripContent(): void {
		const strip = stripEl;
		if (process.env.NODE_ENV === 'production' || !isTabList || !strip || hasWarnedContent) {
			return;
		}
		const stranger = Array.from(strip.children).find(
			(child) => child.getAttribute('role') !== 'tab'
		);
		if (stranger) {
			hasWarnedContent = true;
			devWarn(
				'TabList',
				`role="tablist" owns only tabs, but the strip contains a <${stranger.tagName.toLowerCase()}> that is not one. ` +
					'Render menus and other controls outside the strip, or drop the role for the navigation pattern.'
			);
		}
	}

	$effect(() => {
		const strip = stripEl;
		if (!isTabList || !strip) {
			return;
		}
		untrack(checkStripContent);
		const observer = new MutationObserver(() => untrack(checkStripContent));
		observer.observe(strip, { childList: true });
		return () => observer.disconnect();
	});

	const fade = $derived<TabStripFade>(
		!hasScroll
			? null
			: scrollOverflow.overflowStart && scrollOverflow.overflowEnd
				? 'both'
				: scrollOverflow.overflowStart
					? 'start'
					: scrollOverflow.overflowEnd
						? 'end'
						: null
	);

	// A tablist is not navigation, so the landmark element is only right under the
	// navigation pattern. The role is fixed by a prop rather than by what the strip
	// happens to hold, so this is settled once at the callsite.
	const wrapper = $derived(isTabList ? 'div' : 'nav');

	const theme = $derived(themeProps('tab-list', { size }));
	const stripTheme = themeProps('tab-strip');
	const arrowTheme = themeProps('tab-scroll-button');
	const navAttrs = $derived(tabListNavAttrs(layout === 'fill', hasDivider, xstyle));
	const stripAttrs = $derived(tabStripAttrs(hasScroll, fade));
	const arrowStartAttrs = $derived(tabScrollButtonAttrs('start', size));
	const arrowEndAttrs = $derived(tabScrollButtonAttrs('end', size));
</script>

<svelte:element
	this={wrapper}
	bind:this={rootEl}
	{@attach list.attachList}
	{...rest}
	role={isTabList ? undefined : role}
	aria-label={isTabList ? undefined : ariaLabel}
	aria-labelledby={isTabList ? undefined : ariaLabelledBy}
	onkeydown={handleRootKeyDown}
	onfocusin={handleRootFocus}
	onfocusout={handleRootBlur}
	{...{ [EDGE_COMP_ATTR]: '' }}
	{...theme}
	class={cx(theme.class, navAttrs.class, className)}
	style={mergeStyle(navAttrs.style, styleProp as string | undefined)}
>
	<div
		bind:this={stripEl}
		{@attach attachStrip}
		role={isTabList ? 'tablist' : undefined}
		aria-label={isTabList ? ariaLabel : undefined}
		aria-labelledby={isTabList ? ariaLabelledBy : undefined}
		{...stripTheme}
		class={cx(stripTheme.class, stripAttrs.class)}
		style={stripAttrs.style}
	>
		{@render children()}
	</div>
	{#if hasScroll && scrollOverflow.overflowStart}
		<button
			type="button"
			aria-hidden="true"
			tabindex={-1}
			onmousedown={preventFocus}
			onclick={() => scrollByPage(-1)}
			{...arrowTheme}
			class={cx(arrowTheme.class, arrowStartAttrs.class)}
			style={arrowStartAttrs.style}
		>
			<Icon icon="chevronLeft" size="sm" color="inherit" xstyle={rtlStyles.mirror} />
		</button>
	{/if}
	{#if hasScroll && scrollOverflow.overflowEnd}
		<button
			type="button"
			aria-hidden="true"
			tabindex={-1}
			onmousedown={preventFocus}
			onclick={() => scrollByPage(1)}
			{...arrowTheme}
			class={cx(arrowTheme.class, arrowEndAttrs.class)}
			style={arrowEndAttrs.style}
		>
			<Icon icon="chevronRight" size="sm" color="inherit" xstyle={rtlStyles.mirror} />
		</button>
	{/if}
	<KeyboardHintLayer hint={keyboardHint} />
</svelte:element>
