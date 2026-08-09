<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface MediaThemeProps {
		/**
		 * The surface luminance the children sit on.
		 * - `"dark"` — a dark background, so children take light text and icons
		 * - `"light"` — a light background, so children take dark text and icons
		 */
		mode: 'dark' | 'light';
		children: Snippet;
	}
</script>

<script lang="ts">
	import { dataAttr } from '../internal/naming.js';
	import { mediaThemeAttrs } from './media-theme.stylex.js';

	/**
	 * Theming context for content sitting on a surface whose luminance differs
	 * from the page background — a toast on an inverted bar, a control over a
	 * photograph.
	 *
	 * It writes `data-astryx-media`, and everything else is CSS:
	 *
	 * 1. `base.css` flips `color-scheme` on that attribute, so every
	 *    `light-dark()` token resolves to the surface's side.
	 * 2. The theme's `generateOnMediaCss` block overrides the handful of tokens
	 *    that need a different value on an inverted surface than on a page of the
	 *    same mode — text and icon primary, accent — and any component overrides
	 *    the theme declares under `onDark` / `onLight`.
	 * 3. The parent theme's own component overrides pass straight through, so
	 *    structural styling (radius, weight) survives and only tokens change.
	 *
	 * @example
	 * ```svelte
	 * <div style="background-color: var(--color-background-inverted)">
	 *   <MediaTheme mode="dark">
	 *     <Button label="Undo" variant="ghost" />
	 *   </MediaTheme>
	 * </div>
	 * ```
	 */
	const { mode, children }: MediaThemeProps = $props();

	const attrs = mediaThemeAttrs();
</script>

<div {...{ [dataAttr('media')]: mode }} class={attrs.class} style={attrs.style}>
	{@render children()}
</div>
