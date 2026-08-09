<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { LayerAlignment, LayerPlacement } from '../layer/use-layer.svelte.js';
	import type { TooltipReturn } from './use-tooltip.svelte.js';

	/**
	 * As with `LayerProps`, upstream has no counterpart name: `renderTooltip` is a
	 * function on the hook's return, not a component, so there is nothing there
	 * for a props type to describe.
	 */
	export interface TooltipLayerProps {
		/** The value returned by `useTooltip`. */
		tooltip: TooltipReturn;
		/**
		 * Placement for this render, overriding the hook's. Note it drives the
		 * entry animation only — the surface's margin gap is fixed by the hook's
		 * `placement`, as upstream's is.
		 */
		placement?: LayerPlacement;
		/** Alignment for this render, overriding the hook's. */
		alignment?: LayerAlignment;
		/** Tooltip content, typically short non-interactive text. */
		children: Snippet;
	}
</script>

<script lang="ts">
	import { themeProps } from '../../internal/theme-props.js';
	import { layerAnimations } from '../layer/layer-animations.stylex.js';
	import Layer from '../layer/layer.svelte';
	import { tooltipContentAttrs } from './use-tooltip.stylex.js';

	/**
	 * The rendering half of `useTooltip`, replacing upstream's `renderTooltip`.
	 *
	 * The same split `layer.render` → `<Layer>` took, one level up: a Svelte hook
	 * cannot return markup, so the render function becomes a component and the
	 * hook hands it what the closure captured.
	 *
	 * Upstream types the second argument `Omit<ContextRenderProps, 'positioning'>`
	 * but its body reads only `placement` and `alignment` from it — `className`,
	 * `xstyle`, `style`, `as` and `role` are accepted by the type and then
	 * overwritten by the tooltip's own values. Only the two that are honoured are
	 * exposed here, so the props do not advertise an effect they cannot have.
	 */
	const { tooltip, placement, alignment, children }: TooltipLayerProps = $props();

	const renderPlacement = $derived(placement ?? tooltip.placement);
	const renderAlignment = $derived(alignment ?? tooltip.alignment);

	const content = tooltipContentAttrs();
</script>

<!--
	`onmouseenter`/`onmouseleave` keep the tooltip open while the pointer is over
	the surface itself (WCAG 1.4.13 hoverable). They sit on the layer container —
	the element the user actually hovers — not the inner content div, since
	mouseenter/leave do not bubble.
-->

<Layer
	layer={tooltip.layer}
	placement={renderPlacement}
	alignment={renderAlignment}
	role="tooltip"
	xstyle={[tooltip.xstyle, layerAnimations[renderPlacement]]}
	class={themeProps('tooltip').class}
	onmouseenter={tooltip.cancelHide}
	onmouseleave={tooltip.scheduleHide}
>
	<div class={content.class} style={content.style}>{@render children()}</div>
</Layer>
