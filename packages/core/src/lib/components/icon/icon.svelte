<script lang="ts" module>
	import type { SVGAttributes } from 'svelte/elements';
	import type { StyleArg } from '../../internal/sx.js';
	import type { IconName, IconType } from './icon-registry.js';
	import type { IconColor, IconSize } from './icon.stylex.js';

	export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'color'> {
		icon: IconName | IconType;
		/** @default 'inherit' */
		color?: IconColor;
		/**
		 * - `xsm`: 0.75rem (12px at a 16px root)
		 * - `sm`: 1rem (16px)
		 * - `md`: 1.25rem (20px)
		 * - `lg`: 1.5rem (24px)
		 *
		 * @default 'md'
		 */
		size?: IconSize;
		/**
		 * Accessible name for the icon. Set this only when the icon is MEANINGFUL on
		 * its own — a standalone status glyph or an icon-only indicator with no
		 * adjacent text conveying the same information. Providing it exposes the
		 * icon to assistive tech as `role="img"` with this string as the accessible
		 * name (via `aria-label`) and drops the default `aria-hidden="true"`.
		 *
		 * Omit it (the default) for decorative icons — the common case, e.g. an icon
		 * beside a text label — and the icon stays hidden from assistive tech
		 * (`aria-hidden="true"`). An empty string (`''`) is treated the same as
		 * omitting it (decorative), since an empty accessible name is meaningless.
		 *
		 * Don't set `label` when an interactive parent (Button, IconButton, link)
		 * already names the control — that produces a duplicate announcement.
		 *
		 * @example
		 * ```svelte
		 * <Icon icon="success" label="Completed" />
		 * <Icon icon="search" />
		 * ```
		 */
		label?: string;
		/**
		 * StyleX styles created via `stylex.create()`. Folded into the icon's own
		 * `stylex.props()` call (as the last argument) so it merges with the base
		 * colour/size styles for optimal deduplication, matching how every other
		 * component accepts `xstyle`.
		 */
		xstyle?: StyleArg;
	}

	/**
	 * Derives the ARIA attributes for an icon from its `label` prop.
	 *
	 * - Non-empty `label` → meaningful image: `role="img"` + `aria-label`, and no
	 *   `aria-hidden` (an `aria-hidden` element is removed from the accessibility
	 *   tree, so its accessible name would be ignored).
	 * - Omitted or empty `label` → decorative default: `aria-hidden="true"`.
	 *
	 * The result is spread BEFORE the rest props in both render modes so an
	 * explicit `aria-hidden` / `role` / `aria-label` from the consumer still wins.
	 */
	function getIconA11yProps(
		label: string | undefined
	): { role: 'img'; 'aria-label': string } | { 'aria-hidden': 'true' } {
		return label != null && label !== ''
			? { role: 'img', 'aria-label': label }
			: { 'aria-hidden': 'true' };
	}
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useThemeContext } from '../../theme/theme-context.js';
	import { useThemeName } from '../../theme/use-theme.svelte.js';
	import { getIcon } from './icon-registry.js';
	import { iconAttrs, iconSpanAttrs } from './icon.stylex.js';

	/**
	 * An icon, in either of two modes.
	 *
	 * - **Name mode** — a semantic name (`'close'`, `'chevronDown'`) resolved from
	 *   the icon registry and wrapped in a sized `<span>`. The registry holds
	 *   snippets, so a theme can preset props on the icons it registers.
	 * - **Component mode** — an SVG component (`@lucide/svelte`, your own), which
	 *   receives the sizing and colour classes directly.
	 *
	 * The split is upstream's, including the asymmetry in types: the *prop* takes
	 * a component, the *registry* holds rendered nodes.
	 */
	// Typed against the SVG surface, as upstream is: the common case forwards
	// SVG attributes to the icon component. Name mode casts to the HTML surface
	// for its `<span>` wrapper, which is upstream's cast too.

	const {
		icon,
		color = 'inherit',
		size = 'md',
		label,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: IconProps = $props();

	// Name mode resolves against the nearest `<Theme>` before the global
	// registrations, so nested themes each render their own glyph instead of the
	// last one registered winning for the whole document. Upstream's
	// `IconFromRegistry` does `getIcon(name, useThemeName())`; the source here is
	// the theme *object* off the context rather than its name, because Svelte's
	// context is readable during SSR and the name indirection is upstream's
	// workaround for RSC, where `use(ThemeContext)` is not.
	//
	// `useThemeName` is the second arm, and it is not optional: upstream's
	// `useThemeName` falls back to the name the root `<Theme>` mirrored onto
	// `<html data-astryx-theme>` when no `<Theme>` is in scope. Without it an icon
	// rendered outside the provider subtree — a portal, a detached root,
	// `useToast`'s fallback viewport — silently resolves the built-in default
	// glyph instead of the app's themed one. That arm has no theme object to reach
	// for, so it passes the name through the registry exactly as upstream does.
	// It subscribes to no DOM on the context path, so the common case still
	// creates no MutationObserver. `use-icon.svelte.ts` carries the same pair.
	const themeContext = useThemeContext();
	const themeName = useThemeName();

	const resolved = $derived(
		typeof icon === 'string'
			? getIcon(icon, themeContext?.().theme ?? themeName.current)
			: undefined
	);
	const IconComponent = $derived(typeof icon === 'string' ? undefined : icon);

	// Decorative (aria-hidden) by default, or a meaningful image (role="img" +
	// aria-label) when `label` is non-empty.
	const a11yProps = $derived(getIconA11yProps(label));

	const attrs = $derived(iconAttrs(color, size, xstyle));
	const spanAttrs = $derived(iconSpanAttrs(color, size, xstyle));
	const theme = $derived(themeProps('icon', { size, color }));
</script>

<!--
	The derived a11y attributes sit before the rest spread in both modes, so a
	consumer's explicit `aria-hidden` / `role` / `aria-label` still wins as an
	escape hatch.

	The two modes then differ in where `rest` lands, and upstream's own two
	branches differ the same way: component mode spreads consumer props **last**
	(`Icon.tsx:345`, after the merged theme/style props), registry mode spreads
	them **before** the theme (`Icon.tsx:403`). Faithful to each, not tidied into
	agreement.
-->
{#if IconComponent}
	<IconComponent
		{...a11yProps}
		{...theme}
		class={cx(theme.class, attrs.class, className)}
		style={mergeStyle(attrs.style, styleProp as string | undefined)}
		{...rest}
	/>
{:else if resolved}
	<span
		{...a11yProps}
		{...rest as HTMLAttributes<HTMLSpanElement>}
		{...theme}
		class={cx(theme.class, spanAttrs.class, className)}
		style={mergeStyle(spanAttrs.style, styleProp as string | undefined)}
	>
		{@render resolved()}
	</span>
{/if}
