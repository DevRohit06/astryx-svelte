<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { BreadcrumbsVariant } from './breadcrumbs-context.svelte.js';

	export interface BreadcrumbsProps extends BaseProps<HTMLElement> {
		/** `BreadcrumbItem`s making up the trail. */
		children: Snippet;
		/**
		 * Separator rendered between items. Decorative only (`aria-hidden`).
		 * @default '/'
		 */
		separator?: string | Snippet;
		/**
		 * @default 'default'
		 */
		variant?: BreadcrumbsVariant;
		/**
		 * Accessible label for the nav landmark.
		 * @default 'Breadcrumb'
		 */
		label?: string;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { setBreadcrumbContext } from './breadcrumbs-context.svelte.js';
	import { breadcrumbsListAttrs, breadcrumbsNavAttrs } from './breadcrumbs.stylex.js';

	/**
	 * A navigation breadcrumb trail, wrapping `BreadcrumbItem` children in
	 * semantic `<nav>` + `<ol>` markup with separators between items.
	 *
	 * The last child is auto-detected as the current page when no item sets
	 * `isCurrent` — each item decides for itself by inspecting the DOM, so no
	 * child introspection is needed.
	 *
	 * @example
	 * ```svelte
	 * <Breadcrumbs>
	 *   <BreadcrumbItem href="/">Home</BreadcrumbItem>
	 *   <BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
	 *   <BreadcrumbItem isCurrent>My Project</BreadcrumbItem>
	 * </Breadcrumbs>
	 * ```
	 */
	let {
		children,
		separator = '/',
		variant = 'default',
		xstyle,
		class: className,
		style: styleProp,
		label: labelFromProps,
		...rest
	}: BreadcrumbsProps = $props();

	const t = useTranslator();
	const label = $derived(labelFromProps ?? t('@astryx.breadcrumbs.label'));

	setBreadcrumbContext(() => ({ variant, separator }));

	const theme = $derived(themeProps('breadcrumbs', { variant }));
	const navAttrs = $derived(breadcrumbsNavAttrs(xstyle));
	const listAttrs = breadcrumbsListAttrs();
</script>

<nav
	aria-label={label}
	{...theme}
	class={cx(theme.class, navAttrs.class, className)}
	style={mergeStyle(navAttrs.style, styleProp as string | undefined)}
	{...rest}
>
	<ol class={listAttrs.class} style={listAttrs.style}>{@render children()}</ol>
</nav>
