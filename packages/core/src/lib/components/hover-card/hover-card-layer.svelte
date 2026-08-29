<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { LayerAlignment, LayerPlacement } from '../layer/use-layer.svelte.js';
	import type { HoverCardReturn } from './use-hover-card.svelte.js';

	/**
	 * As with `LayerProps` and `TooltipLayerProps`, upstream has no counterpart
	 * name: `renderHoverCard` is a function on the hook's return, not a
	 * component, so there is nothing there for a props type to describe.
	 *
	 * `class` and `style` come from `BaseProps`, so they accept exactly what an
	 * element does. Upstream accepts both on the render props and then drops
	 * them — see the component comment; they are honoured here, on the popover
	 * container its own code aims them at.
	 */
	export interface HoverCardLayerProps extends Pick<BaseProps, 'xstyle' | 'class' | 'style'> {
		/** The value returned by `useHoverCard`. */
		hoverCard: HoverCardReturn;
		/**
		 * Placement for this render, overriding the hook's. Note it drives the
		 * entry animation only — the surface's margin gap is fixed by the hook's
		 * `placement`, as upstream's is.
		 */
		placement?: LayerPlacement;
		/** Alignment for this render, overriding the hook's. */
		alignment?: LayerAlignment;
		/** Hover card content — interactive content is expected here. */
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { layerAnimations } from '../layer/layer-animations.stylex.js';
	import Layer from '../layer/layer.svelte';
	import { hoverCardContentAttrs } from './use-hover-card.stylex.js';

	/**
	 * The rendering half of `useHoverCard`, replacing upstream's
	 * `renderHoverCard`.
	 *
	 * The same split `layer.render` → `<Layer>` took, one level up: a Svelte hook
	 * cannot return markup, so the render function becomes a component and the
	 * hook hands it what the closure captured.
	 *
	 * Upstream types the second argument `Omit<ContextRenderProps, 'positioning'>`
	 * but its body used to read only `placement` and `alignment` from it, dropping
	 * `className`/`style` outright — the divergence this port recorded. 0.2.0
	 * honours all three, so only the props that can have an effect are exposed,
	 * as `TooltipLayer` already decided, and the list is now upstream's own.
	 *
	 * Two things differ from `TooltipLayer`, and both are upstream's:
	 *
	 * **The layer renders as a `<span>`.** Phrasing content stays put inside a
	 * `<p>` instead of being reparented by the HTML parser, which keeps the
	 * server markup and the first client render identical. `Tooltip` uses a
	 * `div`; a hover card must not.
	 *
	 * **The theme class sits on the layer container**, with the inner content span
	 * keeping only its padding. 0.2.0 moved it there deliberately: the container
	 * is where the background, radius and shadow live, so a theme targeting
	 * `.astryx-hovercard` and a consumer's `class` now land on the same element —
	 * the visual surface — instead of the theme reaching a span the consumer
	 * cannot style. It used to sit on the inner span here, matching upstream then.
	 */
	const {
		hoverCard,
		placement,
		alignment,
		xstyle,
		class: className,
		style,
		children
	}: HoverCardLayerProps = $props();

	const renderPlacement = $derived(placement ?? hoverCard.placement);
	const renderAlignment = $derived(alignment ?? hoverCard.alignment);

	const content = hoverCardContentAttrs();
</script>

<Layer
	layer={hoverCard.layer}
	placement={renderPlacement}
	alignment={renderAlignment}
	role={hoverCard.role}
	aria-label={hoverCard.label}
	xstyle={[hoverCard.xstyle, layerAnimations[renderPlacement], xstyle]}
	class={cx(themeProps('hovercard').class, className)}
	style={style ?? undefined}
>
	<!--
		The content surface carries the interaction handlers, as upstream's does.
		`onfocusout`, not `onblur`: React's `onBlur` is the delegated *bubbling*
		`focusout`, and this handler reads `relatedTarget` and asks whether
		`currentTarget` contains it — which only means anything for focus leaving a
		descendant. Native `blur` does not bubble, so `onblur` would never fire for
		the case the handler exists to serve.

		A `<div>` as of 0.4.2: `useLayer` mounts the container only after verifying
		or correcting its parent, so the card's content no longer has to be
		phrasing-safe and can use block markup (#5039).

		There is no `onkeydown` as of 0.5.0. It handled Escape by dismissing and
		refocusing the trigger, and upstream deleted it when the hook joined the
		shared dismissal stack — the stack's one document-level listener routes the
		press to the top-most layer, and `useHoverCard`'s `onDismiss` does the
		refocus. The div is a styling and event surface either way; the ARIA
		pattern is completed by the `role="dialog"` on the layer container above
		it, and giving this div a role of its own would put a second element in the
		accessibility tree where upstream has one.
	-->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class={content.class}
		style={content.style}
		onmouseenter={hoverCard.handleContentMouseEnter}
		onmouseleave={hoverCard.handleContentMouseLeave}
		onfocusout={hoverCard.handleContentFocusOut}
	>
		{@render children()}
	</div>
</Layer>
