<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { StyleArg } from '../../internal/sx.js';
	import type { LayerAlignment, LayerPlacement } from '../layer/use-layer.svelte.js';
	import type { UsePopoverReturn } from './use-popover.svelte.js';

	/**
	 * As with `LayerProps` and `HoverCardLayerProps`, upstream has no counterpart
	 * name: `usePopover`'s `render` is a function on the hook's return, not a
	 * component, so there is nothing there for a props type to describe.
	 */
	export interface PopoverLayerProps {
		/** The value returned by `usePopover`. */
		popover: UsePopoverReturn;
		/** Logical placement relative to the trigger. Upstream's `render` prop. */
		placement?: LayerPlacement;
		/** Alignment along the placement axis. Upstream's `render` prop. */
		alignment?: LayerAlignment;
		/**
		 * StyleX styles for the layer's positioned container — upstream's
		 * `render` prop `xstyle` (the `[popoverXstyle, gap, layerAnimations]`
		 * array `Popover` builds). Distinct from the hook's `xstyle` option,
		 * which styles the inner content wrapper.
		 */
		xstyle?: StyleArg;
		/**
		 * Inline styles for the layer's positioned container — upstream's `render`
		 * prop `style`, which `usePopover` passes straight through to `layer.render`
		 * along with the rest of its `ContextRenderProps`. `Selector` is the first
		 * consumer: its selected-item overlay is a computed negative
		 * `margin-block-start`, a per-instance measurement with no class worth
		 * minting.
		 */
		style?: string;
		/** Popover content. */
		children: Snippet;
	}
</script>

<script lang="ts">
	import Button from '../button/button.svelte';
	import Layer from '../layer/layer.svelte';
	import {
		popoverCloseButtonWrapperAttrs,
		popoverContentWrapperAttrs
	} from './use-popover.stylex.js';

	/**
	 * The rendering half of `usePopover`, replacing upstream's `render` function.
	 *
	 * The same split `layer.render` → `<Layer>` and `renderHoverCard` →
	 * `<HoverCardLayer>` took: a Svelte hook cannot return markup, so the render
	 * function becomes a component and the hook hands it what the closure
	 * captured.
	 *
	 * The element tree is upstream's `render` verbatim: a `<Layer>` container
	 * wrapping a focus-trap content `<div>` (the `role="dialog"` wrapper, carrying
	 * `aria-modal`/`aria-label`, the surface styles and the focus-trap
	 * attachment), the caller's content, and the hidden close button that reveals
	 * on focus.
	 *
	 * The layer container gets no `role`: upstream's `layer.render` is called with
	 * only `{placement, alignment, xstyle}`, so the dialog role lives on the inner
	 * wrapper, not the popover element.
	 */
	const {
		popover,
		placement,
		alignment,
		xstyle,
		style: styleProp,
		children
	}: PopoverLayerProps = $props();

	// contentWrapper + (hasSurface && surface) + the hook's option xstyle.
	const contentWrapper = $derived(popoverContentWrapperAttrs(popover.hasSurface, popover.xstyle));
	const closeWrapper = popoverCloseButtonWrapperAttrs();

	const isDialog = $derived(popover.role === 'dialog');
</script>

<Layer layer={popover.layer} {placement} {alignment} {xstyle} style={styleProp}>
	<div
		{@attach popover.attachContent}
		role={isDialog ? 'dialog' : undefined}
		aria-modal={isDialog && popover.isModal ? true : undefined}
		aria-label={isDialog ? popover.dialogLabel : undefined}
		class={contentWrapper.class}
		style={contentWrapper.style}
	>
		{@render children()}
		{#if popover.hasCloseButton}
			<div class={closeWrapper.class} style={closeWrapper.style}>
				<Button variant="secondary" label={popover.closeButtonLabel} onclick={popover.hide} />
			</div>
		{/if}
	</div>
</Layer>
