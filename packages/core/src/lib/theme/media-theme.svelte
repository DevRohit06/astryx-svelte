<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/** Surface luminance context, or `"off"` for no media context at all. */
	export type MediaThemeMode = 'dark' | 'light' | 'auto' | 'off';

	export interface MediaThemeProps {
		/**
		 * The surface luminance context for children.
		 * - `"dark"` — children are on a dark background (get light text/icons)
		 * - `"light"` — children are on a light background (get dark text/icons)
		 * - `"auto"` — measure the painted surface and use whichever side reads
		 *   better on it, or no media context at all when the surface's ambient
		 *   text already reads better than either
		 * - `"off"` — children keep the ambient theme; the surface needs no
		 *   inversion
		 */
		mode: MediaThemeMode;
		/**
		 * Which side `mode="auto"` uses when the surface cannot be measured: on the
		 * server, on the first client frame, and whenever the backdrop is not
		 * knowable from CSS — most often a `background-image`, whose pixels need
		 * sampling (see `useImageMode`) rather than a computed style.
		 *
		 * Ignored unless `mode="auto"`.
		 * @default "dark"
		 */
		fallback?: 'dark' | 'light';
		/** Content to render in the media context. */
		children: Snippet;
	}
</script>

<script lang="ts">
	import { useAutoMediaMode } from '../hooks/use-auto-media-mode.svelte.js';
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
	 * 4. `mode="auto"` measures the painted surface and picks a side — or none;
	 *    `mode="off"` renders the same element with no media attribute, so either
	 *    can change without remounting children.
	 *
	 * @example
	 * ```svelte
	 * <div style="background-color: var(--color-background-inverted)">
	 *   <MediaTheme mode="auto">
	 *     <Button label="Undo" variant="ghost" />
	 *   </MediaTheme>
	 * </div>
	 * ```
	 */
	const { mode, fallback = 'dark', children }: MediaThemeProps = $props();

	// Measures this element's PARENT — see `useAutoMediaMode`. `display: contents`
	// means the parent is the element that actually paints the surface.
	let element = $state<HTMLDivElement | null>(null);
	const detected = useAutoMediaMode(
		() => element,
		() => mode === 'auto'
	);

	const resolved = $derived(mode === 'auto' ? (detected.current ?? fallback) : mode);
	const attrs = $derived(mediaThemeAttrs(resolved !== 'off'));
</script>

<!--
  "off" keeps the element — and therefore the DOM structure — identical, so a
  surface can switch its media context on and off without remounting children.
-->
<div
	bind:this={element}
	{...resolved === 'off' ? {} : { [dataAttr('media')]: resolved }}
	class={attrs.class}
	style={attrs.style}
>
	{@render children()}
</div>
