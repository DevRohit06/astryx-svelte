<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type {
		OverlayAlign,
		OverlayPosition,
		OverlayScrimMode,
		OverlayShowOn
	} from './overlay-scrim.stylex.js';

	/**
	 * Upstream's `Pick<BaseProps<HTMLDivElement>, 'xstyle' | 'className' | 'style'>`
	 * — a closed list rather than the full base type, so unlike `Layout` there is
	 * no rest spread owed here.
	 */
	export interface OverlayProps extends Pick<
		BaseProps<HTMLDivElement>,
		'xstyle' | 'class' | 'style'
	> {
		/** Base content — an image, a card, a video. */
		children?: Snippet;
		/** Content rendered inside the overlay scrim. */
		content: Snippet;
		/** @default "always" */
		showOn?: OverlayShowOn;
		/** JS-controlled visibility override. */
		isOpen?: boolean;
		/** @default "dark" */
		scrim?: OverlayScrimMode;
		/** @default "fill" */
		position?: OverlayPosition;
		/** @default "end" */
		align?: OverlayAlign;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import OverlayScrim from './overlay-scrim.svelte';
	import { overlayContainerAttrs } from './overlay.markers.stylex.js';
	import { useOverlay } from './use-overlay.svelte.js';

	/**
	 * Renders content on top of media with a scrim background and automatic theme
	 * inversion. `children` is the base content, `content` is what appears over
	 * it — the same division `Tooltip` makes.
	 *
	 * To put an overlay on a container you already have, use `useOverlay`
	 * directly instead; this component is the thin wrapper over it.
	 */
	const {
		children,
		content,
		showOn,
		isOpen,
		scrim,
		position,
		align,
		xstyle,
		class: className,
		style: styleProp
	}: OverlayProps = $props();

	const overlay = useOverlay(() => ({ showOn, isOpen, scrim, position, align }));

	// Border radius: mirror the first child's radius onto the wrapper, so a
	// rounded image inside a square wrapper does not show corners through the
	// scrim. Only the component needs this — a hook consumer owns its own radius.
	// Upstream's `useIsomorphicLayoutEffect` is a plain `$effect`, for the reason
	// `useOverflow` first recorded: Svelte effects never run during SSR, which is
	// the only thing that module was dodging.
	$effect(() => {
		const el = overlay.container;
		if (!el) {
			return;
		}
		const firstChild = el.firstElementChild as HTMLElement | null;
		if (!firstChild) {
			return;
		}
		const radius = getComputedStyle(firstChild).borderRadius;
		if (radius && radius !== '0px') {
			el.style.borderRadius = radius;
		}
	});

	const attrs = $derived(overlayContainerAttrs(xstyle));
	const theme = themeProps('overlay');
</script>

<div
	{@attach overlay.attachContainer}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
	onclick={overlay.containerProps.onclick}
	onmouseup={overlay.containerProps.onmouseup}
>
	{@render children?.()}
	<!--
		Upstream's `element` is `content != null ? renderOverlay(content) : null`, so a
		nullish `content` renders no scrim at all. `Snippet` excludes `null` where
		`ReactNode` does not, which makes this unreachable through the typed API — it
		is here because the branch is upstream's, not because the type needs it.
	-->
	{#if content}
		<OverlayScrim {...overlay.scrimProps}>{@render content()}</OverlayScrim>
	{/if}
</div>
