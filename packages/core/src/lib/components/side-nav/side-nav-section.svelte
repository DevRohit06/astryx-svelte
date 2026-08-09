<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	/**
	 * `title` is declared explicitly because `BaseProps` omits it — upstream omits
	 * the same attribute and re-declares it here as the section's heading text
	 * rather than a tooltip.
	 */
	export interface SideNavSectionProps extends BaseProps<HTMLDivElement> {
		/** Section title. */
		title: string;
		/** Section subtitle. */
		subtitle?: string;
		/** Section items. */
		children: Snippet;
		/** Right-side content in the section header. */
		endContent?: Snippet;
		/**
		 * Whether the section header is visually hidden.
		 * The section title stays available to screen readers.
		 * @default false
		 */
		isHeaderHidden?: boolean;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useSideNavCollapse } from './side-nav-collapse-context.svelte.js';
	import {
		sideNavSectionEndContentAttrs,
		sideNavSectionHeaderAttrs,
		sideNavSectionHiddenStyle,
		sideNavSectionItemsAttrs,
		sideNavSectionRootAttrs,
		sideNavSectionSubtitleAttrs,
		sideNavSectionTitleAttrs,
		sideNavSectionTitleContainerAttrs
	} from './side-nav-section.stylex.js';

	/**
	 * A labelled grouping of `SideNav` items — a `role="group"` whose
	 * `aria-labelledby` points at its title.
	 *
	 * The header is *visually* hidden rather than removed when `isHeaderHidden` is
	 * set or the sidebar is collapsed, because removing it would leave the group
	 * unnamed. That hiding is an inline style on both sides, not StyleX.
	 *
	 * @example
	 * ```svelte
	 * <SideNavSection title="Main">
	 *   <SideNavItem label="Dashboard" isSelected />
	 *   <SideNavItem label="Projects" />
	 * </SideNavSection>
	 * ```
	 */
	let {
		title,
		subtitle,
		children,
		endContent,
		isHeaderHidden = false,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId,
		...rest
	}: SideNavSectionProps = $props();

	const collapse = useSideNavCollapse();
	const id = $props.id();
	const titleId = `${id}-title`;

	const shouldHideHeader = $derived(isHeaderHidden || collapse().isCollapsed);

	const theme = themeProps('side-nav-section');
	const rootAttrs = $derived(sideNavSectionRootAttrs(xstyle));
	const headerAttrs = sideNavSectionHeaderAttrs();
	const titleContainerAttrs = sideNavSectionTitleContainerAttrs();
	const titleAttrs = sideNavSectionTitleAttrs();
	const subtitleAttrs = sideNavSectionSubtitleAttrs();
	const endContentAttrs = sideNavSectionEndContentAttrs();
	const itemsAttrs = sideNavSectionItemsAttrs();
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, rootAttrs.class, className)}
	style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	role="group"
	aria-labelledby={titleId}
	data-testid={testId}
>
	<div
		class={headerAttrs.class}
		style={shouldHideHeader ? sideNavSectionHiddenStyle : headerAttrs.style}
	>
		<span class={titleContainerAttrs.class} style={titleContainerAttrs.style}>
			<span id={titleId} class={titleAttrs.class} style={titleAttrs.style}>{title}</span>
			{#if subtitle}
				<span class={subtitleAttrs.class} style={subtitleAttrs.style}>{subtitle}</span>
			{/if}
		</span>
		{#if endContent}
			<span class={endContentAttrs.class} style={endContentAttrs.style}>
				{@render endContent()}
			</span>
		{/if}
	</div>
	<div class={itemsAttrs.class} style={itemsAttrs.style}>{@render children()}</div>
</div>
