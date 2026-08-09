<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { TabListLayout, TabListSize } from './tab-list-context.svelte.js';

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
		/** `Tab` and `TabMenu` children. */
		children: Snippet;
	}

	/**
	 * Selector matching the focusable stops in the tab strip: every `Tab`
	 * (`[data-tab-value]`) and every `TabMenu` trigger (`[data-tab-menu]`),
	 * in DOM order. Disabled stops are filtered out by the handler.
	 */
	const TAB_STOP_SELECTOR = '[data-tab-value],[data-tab-menu]';
</script>

<script lang="ts">
	import KeyboardHintLayer from '../../hooks/keyboard-hint-layer.svelte';
	import { useKeyboardHint } from '../../hooks/use-keyboard-hint.svelte.js';
	import { useListFocus } from '../../hooks/use-list-focus.svelte.js';
	import { useSize } from '../../internal/contexts.svelte.js';
	import { EDGE_COMP_ATTR } from '../../internal/edge-compensation.stylex.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { setTabListContext } from './tab-list-context.svelte.js';
	import { tabListNavAttrs } from './tab-list.stylex.js';

	/**
	 * Tab navigation wrapper. Provides context for value/onChange/size/layout to
	 * `Tab` and `TabMenu` children, and owns roving-tabindex keyboard navigation
	 * (Arrow/Home/End) across the strip so it is a single Tab stop.
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
		xstyle,
		class: className,
		style: styleProp,
		children,
		onkeydown: onKeyDownProp,
		onfocusin: onFocusProp,
		onfocusout: onBlurProp,
		'aria-label': ariaLabelFromProps,
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

	const hintId = $props.id();

	// Roving-tabindex keyboard navigation across the tab strip via the shared
	// hook. `orientation: 'both'` accepts both arrow axes per the WAI-ARIA APG
	// allowance for tab strips (ArrowRight/ArrowDown advance, ArrowLeft/ArrowUp
	// retreat). This has always been unconditional, which is why upstream removed
	// the `orientation` prop in 0.2.0: it never rendered vertical tabs and never
	// changed which arrows worked — it only toggled the hint badge's glyphs.
	//
	// `hasRovingTabIndex` makes the hook own the single tab stop: it stamps
	// tabindex 0/-1, repairs the stop on mount and as stops mount/unmount or
	// toggle disabled, and — via `handleFocus` on the nav — keeps the stop in
	// sync after clicks or programmatic focus. Individual `Tab`s still render
	// `tabindex={isSelected ? 0 : -1}` as the initial source of truth; the hook's
	// repair preserves an existing tab stop and only promotes the first enabled
	// stop when none is tabbable.
	const list = useListFocus(() => ({
		itemSelector: TAB_STOP_SELECTOR,
		orientation: 'both',
		hasRovingTabIndex: true
	}));

	// No `orientation`: the hook's own `'horizontal'` default is what the badge
	// shows, matching upstream's now argument-less `useKeyboardHint()` call. The
	// `id` stays because this port's hook cannot mint one itself (see `useLayer`).
	const keyboardHint = useKeyboardHint(() => ({ id: hintId }));

	setTabListContext(() => ({ value, onChange, size, layout }));

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
	}

	function handleRootBlur(e: FocusEvent): void {
		onBlurProp?.(e as FocusEvent & { currentTarget: EventTarget & HTMLElement });
		if (e.defaultPrevented) {
			return;
		}
		keyboardHint.onBlur(e);
	}

	const theme = $derived(themeProps('tab-list', { size }));
	const navAttrs = $derived(tabListNavAttrs(layout === 'fill', hasDivider, xstyle));
</script>

<nav
	{...rest}
	{@attach list.attachList}
	aria-label={ariaLabel}
	onkeydown={handleRootKeyDown}
	onfocusin={handleRootFocus}
	onfocusout={handleRootBlur}
	{...{ [EDGE_COMP_ATTR]: '' }}
	{...theme}
	class={cx(theme.class, navAttrs.class, className)}
	style={mergeStyle(navAttrs.style, styleProp as string | undefined)}
>
	{@render children()}
	<KeyboardHintLayer hint={keyboardHint} />
</nav>
