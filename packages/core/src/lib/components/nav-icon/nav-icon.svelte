<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface NavIconProps extends BaseProps<HTMLSpanElement> {
		/**
		 * The icon to render inside the circular background. An `Icon` or any
		 * comparable glyph.
		 */
		icon: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { navIconAttrs } from './nav-icon.stylex.js';

	/**
	 * A circular icon container for navigation headers.
	 *
	 * An accent-filled disc sized to the medium element token, used as the logo
	 * slot in `TopNav` and `SideNav` title areas.
	 *
	 * @example
	 * ```svelte
	 * <NavIcon>
	 *   {#snippet icon()}<Icon icon="menu" size="sm" />{/snippet}
	 * </NavIcon>
	 * ```
	 */
	const { icon, xstyle, class: className, style: styleProp, ...rest }: NavIconProps = $props();

	const attrs = $derived(navIconAttrs(xstyle));
	// `navicon` ran the compound name together; themes styling it keep working
	// until the next major.
	const theme = themeProps('nav-icon', undefined, { legacyNames: ['navicon'] });
</script>

<span
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
	{...rest}
>
	{@render icon()}
</span>
