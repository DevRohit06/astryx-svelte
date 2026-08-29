<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { LinkComponentType } from '../link/types.js';

	export interface TabProps extends BaseProps<HTMLButtonElement> {
		/**
		 * Custom component to render instead of `<a>` for link tabs.
		 * Overrides the provider-level default set by `LinkProvider`.
		 * Only applies when `href` is provided. Must accept href, class, style and children props.
		 */
		as?: LinkComponentType;
		/** Unique value for this tab. Matched against the `TabList`'s `value`. */
		value: string;
		/**
		 * Accessible label for this tab. Used as visible text by default, or
		 * as `aria-label` when `isLabelHidden` is true.
		 */
		label: string;
		/**
		 * Whether the label is visually hidden. When true, only the icon and
		 * `endContent` are displayed, and `label` is used as `aria-label`.
		 * @default false
		 */
		isLabelHidden?: boolean;
		/**
		 * URL to navigate to. When provided, renders as an anchor element.
		 *
		 * Ignored in a `TabList` given an explicit `role="tablist"`: activating a
		 * tab there swaps a panel in place, so a tab that navigates would be a
		 * false statement.
		 */
		href?: string;
		/**
		 * Id of the panel this tab controls, wired up as `aria-controls` where the
		 * `TabList` speaks the tabs pattern. Put the same id on the panel element.
		 *
		 * Has no effect under the navigation pattern, where there is no panel to
		 * associate — a development warning says so.
		 */
		panelId?: string;
		/** Icon shown when the tab is not selected. */
		icon?: Snippet;
		/** Icon shown when the tab is selected. Falls back to `icon` if not provided. */
		selectedIcon?: Snippet;
		/** Content rendered after the label (e.g. a badge or status dot). */
		endContent?: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { EDGE_COMP_ATTR } from '../../internal/edge-compensation.stylex.js';
	import { useDevWarning } from '../../hooks/use-dev-warning.svelte.js';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import LinkElement from '../link/link-element.svelte';
	import { useTabListContext } from './tab-list-context.svelte.js';
	import {
		tabAttrs,
		tabEndContentAttrs,
		tabHoverBgAttrs,
		tabIconAttrs,
		tabIndicatorAttrs,
		tabLabelContainerAttrs,
		tabLabelSizerAttrs,
		tabLabelTextAttrs
	} from './tab.stylex.js';

	/**
	 * Tab item. Renders as an anchor when `href` is provided, otherwise a button.
	 *
	 * @example
	 * ```svelte
	 * <TabList value={tab} onChange={(v) => (tab = v)}>
	 *   <Tab value="general" label="General" />
	 *   <Tab value="advanced" label="Advanced" />
	 * </TabList>
	 * ```
	 */
	let {
		as,
		value,
		label,
		isLabelHidden = false,
		href,
		panelId,
		icon,
		selectedIcon,
		endContent,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: TabProps = $props();

	const tabList = useTabListContext();
	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink(as));

	const isSelected = $derived(tabList().value === value);
	const size = $derived(tabList().size);
	const isFill = $derived(tabList().layout === 'fill');
	const isTabsPattern = $derived(tabList().pattern === 'tabs');
	const isLink = $derived(href != null && !isTabsPattern);
	const isTabRole = $derived(isTabsPattern && !isLink);
	const displayIcon = $derived(isSelected && selectedIcon ? selectedIcon : icon);
	const hasVisibleLabel = $derived(!isLabelHidden && label !== '');

	function handleSelect(): void {
		tabList().onChange(value);
	}

	useDevWarning(
		'Tab',
		'href is ignored in a role="tablist" TabList — a tab swaps a panel in ' +
			'place rather than navigating. Drop the href, or drop the role for the ' +
			'navigation pattern.',
		() => isTabRole && href != null
	);

	// A consumer who wired aria-controls by hand already said which panel this
	// is, so panelId is the sugar, not the only way in.
	const controls = $derived(panelId ?? rest['aria-controls']);

	useDevWarning(
		'Tab',
		'a tab in a role="tablist" TabList controls nothing: pass panelId with ' +
			'the id of the panel it opens, so assistive technology can associate ' +
			'the two.',
		() => isTabRole && controls == null
	);

	useDevWarning(
		'Tab',
		'panelId does nothing outside a role="tablist" TabList — the navigation ' +
			'pattern has no panel to associate. Give the TabList role="tablist", ' +
			'or drop the panelId.',
		() => !isTabsPattern && panelId != null
	);

	const theme = $derived(themeProps('tab', { selected: isSelected ? 'selected' : null }));
	const indicatorTheme = $derived(
		themeProps('tab-indicator', { selected: isSelected ? 'selected' : null })
	);
	const attrs = $derived(tabAttrs(size, isSelected, isFill, xstyle));
	const hoverBgAttrs = $derived(tabHoverBgAttrs(size));
	const iconAttrs = $derived(tabIconAttrs(size));
	const indicatorAttrs = $derived(tabIndicatorAttrs(isSelected));
	const labelContainerAttrs = tabLabelContainerAttrs();
	const labelTextAttrs = tabLabelTextAttrs();
	const labelSizerAttrs = tabLabelSizerAttrs();
	const endAttrs = tabEndContentAttrs();

	/** Upstream's `sharedProps` — everything both branches carry. */
	const sharedProps = $derived({
		...rest,
		...(isLabelHidden ? { 'aria-label': label } : {}),
		[EDGE_COMP_ATTR]: '',
		'data-tab-value': value,
		...(isTabRole
			? {
					role: 'tab' as const,
					'aria-selected': isSelected,
					// Only when there is a panel to point at: an aria-controls whose
					// target does not exist is an invalid attribute value, which is a
					// worse state than saying nothing. The dev warning above asks for
					// the id instead.
					'aria-controls': controls
				}
			: {
					// Generic `true` ("the current item within a set"), not `page`: the
					// strip switches views in place at least as often as it navigates,
					// and claiming "current page" when no page changed is a false
					// statement to a screen reader. Stays truthful for the `href` case
					// too, just less specific. A tab role states this with
					// aria-selected instead.
					'aria-current': isSelected ? ('true' as const) : undefined
				}),
		// Roving tabindex: the tab strip is a single Tab stop. The selected tab is
		// the tabbable one; the rest are reachable via arrow keys (handled by
		// TabList's onkeydown). When no tab is selected, TabList's repair pass
		// makes the first stop tabbable.
		tabindex: isSelected ? 0 : -1,
		...theme,
		class: cx(theme.class, attrs.class, className),
		style: mergeStyle(attrs.style, styleProp as string | undefined)
	});

	const anchorProps = $derived({
		href,
		// `useLinkComponent`'s `to` alias for `to`-based routers; upstream injects
		// it inside the hook's wrapper component, which has no Svelte counterpart.
		...(linkResolved.isNative ? {} : { to: href }),
		onclick: handleSelect,
		...sharedProps
	});
</script>

{#snippet tabContent()}
	<span aria-hidden="true" class={hoverBgAttrs.class} style={hoverBgAttrs.style}></span>
	{#if displayIcon}
		<span class={iconAttrs.class} style={iconAttrs.style}>{@render displayIcon()}</span>
	{/if}
	{#if hasVisibleLabel}
		<span class={labelContainerAttrs.class} style={labelContainerAttrs.style}>
			<span class={labelTextAttrs.class} style={labelTextAttrs.style}>{label}</span>
			<span aria-hidden="true" class={labelSizerAttrs.class} style={labelSizerAttrs.style}
				>{label}</span
			>
		</span>
	{/if}
	{#if endContent}
		<span class={endAttrs.class} style={endAttrs.style}>{@render endContent()}</span>
	{/if}
	<span
		{...indicatorTheme}
		class={cx(indicatorTheme.class, indicatorAttrs.class)}
		style={indicatorAttrs.style}
	></span>
{/snippet}

{#if isLink}
	<LinkElement component={linkResolved.component} props={anchorProps}>
		{@render tabContent()}
	</LinkElement>
{:else}
	<button type="button" onclick={handleSelect} {...sharedProps}>
		{@render tabContent()}
	</button>
{/if}
