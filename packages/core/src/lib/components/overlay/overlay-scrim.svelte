<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type {
		OverlayAlign,
		OverlayPosition,
		OverlayScrimMode,
		OverlayShowOn
	} from './overlay-scrim.stylex.js';

	/**
	 * Upstream's own `OverlayScrimProps`, unchanged.
	 *
	 * The type is upstream's; what changed is that the component is **public**
	 * here. Upstream keeps it internal because `renderOverlay` and the
	 * pre-rendered `element` are how a hook consumer gets a scrim — and a Svelte
	 * hook cannot return markup, so those two collapse into this component. The
	 * same split `renderTooltip` → `<TooltipLayer>` took.
	 */
	export interface OverlayScrimProps {
		scrim: OverlayScrimMode;
		position: OverlayPosition;
		align: OverlayAlign;
		showOn: OverlayShowOn;
		isOpen: boolean | undefined;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import MediaTheme from '../../theme/media-theme.svelte';
	import { overlayScrimAttrs } from './overlay-scrim.stylex.js';

	/**
	 * The scrim itself: the absolutely-positioned surface that sits over the
	 * container's content, tints it, and inverts the theme for whatever it holds.
	 *
	 * Everything about *when* it shows is CSS — see `overlay-scrim.stylex.ts`.
	 * The one thing JS decides is `inert`, and only in controlled mode: a hidden
	 * scrim must not be reachable, but a CSS-driven one is only hidden while the
	 * container is un-hovered, which the browser already handles through
	 * `visibility`.
	 */
	const { scrim, position, align, showOn, isOpen, children }: OverlayScrimProps = $props();

	const isControlled = $derived(isOpen !== undefined);
	const themeMode = $derived(scrim === 'dark' ? 'dark' : scrim === 'light' ? 'light' : null);
	const attrs = $derived(overlayScrimAttrs({ scrim, position, align, showOn, isOpen }));
	const theme = $derived(themeProps('overlay-scrim', { position }));
</script>

<div
	{...theme}
	class={cx(theme.class, attrs.class)}
	style={attrs.style}
	inert={isControlled && !isOpen ? true : undefined}
>
	{#if themeMode}
		<MediaTheme mode={themeMode}>{@render children()}</MediaTheme>
	{:else}
		{@render children()}
	{/if}
</div>
