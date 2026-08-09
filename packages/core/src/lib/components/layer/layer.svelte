<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { MouseEventHandler } from 'svelte/elements';
	import type { StyleArg } from '../../internal/sx.js';
	import type {
		ContextLayerReturn,
		FixedLayerReturn,
		LayerAlignment,
		LayerPlacement
	} from './use-layer.svelte.js';

	/**
	 * The rendering half of `useLayer`, replacing upstream's `layer.render()`.
	 *
	 * A Svelte hook cannot return markup, so what upstream expresses as two
	 * `render` overloads becomes one component whose props are a discriminated
	 * union: the `layer` you pass decides which set is accepted, exactly as
	 * `mode` decides which overload applies upstream. Fixed mode therefore
	 * *requires* `x`/`y`, and context mode rejects them.
	 */

	/** Render props for context mode (anchor positioning) */
	export interface ContextRenderProps {
		layer: ContextLayerReturn;
		/**
		 * Who authors the layer's position styles.
		 *
		 * `'anchor'` (default): the component derives CSS anchor-positioning styles —
		 * `position-area` and `position-try-fallbacks` — from the logical
		 * `placement`/`alignment`.
		 *
		 * `'custom'`: the consumer authors its own position styles via `style`
		 * (e.g. explicit `anchor()` insets or an `anchor-size()` cover). The
		 * popover behavior and the `position-anchor` wiring are kept but no
		 * placement-derived styles are emitted, so direction handling becomes the
		 * consumer's responsibility. `placement`/`alignment` are ignored.
		 *
		 * @default 'anchor'
		 */
		positioning?: 'anchor' | 'custom';
		/**
		 * Logical placement relative to the anchor. Ignored when `positioning`
		 * is `'custom'`.
		 */
		placement?: LayerPlacement;
		/**
		 * Alignment along the placement axis. Ignored when `positioning`
		 * is `'custom'`.
		 */
		alignment?: LayerAlignment;
		/**
		 * ARIA role applied to the popover container (e.g. `'tooltip'`). Lets
		 * consumers complete the ARIA pattern and gives test tooling a stable,
		 * non-hashed selector for the layer.
		 */
		role?: string;
		/**
		 * Accessible name applied to the popover container via `aria-label`.
		 * Pair with `role` so layers with a named role (e.g. `'dialog'`) expose a
		 * proper name to assistive technology.
		 */
		'aria-label'?: string;
		/** StyleX styles for the popover container. */
		xstyle?: StyleArg;
		/**
		 * Additional CSS class name(s) for the popover container.
		 * Use with `themeProps()` for theme targeting when reflecting visual props.
		 */
		class?: string;
		/**
		 * Inline styles for the popover container.
		 * Merged after StyleX and anchor positioning styles.
		 */
		style?: string;
		/**
		 * HTML tag to render the popover container as.
		 *
		 * Defaults to `'div'`. Pass `'span'` when the layer must render inline-safe
		 * markup — e.g. a `HoverCard` wrapping inline text inside a `<p>`. A `<span>`
		 * is phrasing content, so it stays put in the DOM tree instead of being
		 * reparented out of a paragraph by the HTML parser, which keeps server and
		 * client markup identical. The Popover API and CSS anchor positioning work
		 * the same on either tag.
		 *
		 * @default 'div'
		 */
		as?: 'div' | 'span';
		/**
		 * Pointer-enter handler attached to the popover container itself. Lets a
		 * consumer keep a hover-driven layer open while the pointer is over the
		 * surface (e.g. Tooltip/HoverCard "hoverable" behavior — WCAG 1.4.13).
		 */
		onmouseenter?: MouseEventHandler<HTMLElement>;
		/** Pointer-leave handler attached to the popover container itself. */
		onmouseleave?: MouseEventHandler<HTMLElement>;
		children: Snippet;
	}

	/** Render props for fixed mode (manual coordinates) */
	export interface FixedRenderProps {
		layer: FixedLayerReturn;
		x: number;
		y: number;
		/** StyleX styles for the popover container. */
		xstyle?: StyleArg;
		/** Additional CSS class name(s) for the popover container. */
		class?: string;
		/** Inline styles, merged after StyleX and position styles. */
		style?: string;
		children: Snippet;
	}

	/**
	 * The component's own props. Upstream has no counterpart name because it has
	 * no component — the two halves are its `render` overloads, and both of those
	 * names it does export.
	 */
	export type LayerProps = ContextRenderProps | FixedRenderProps;
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { layerAttrs } from './layer.stylex.js';
	import { contextPositionStyle } from './use-layer.svelte.js';

	// Every prop is read through the widened `p` below. `no-unused-props` follows
	// member access on the `$props()` result itself, so it cannot see through the
	// union widening and reports the whole set as unused.
	// eslint-disable-next-line svelte/no-unused-props
	const props: LayerProps = $props();

	// Consumers see the union above — one `layer` shape per prop set, which is
	// what upstream's overloads buy. Inside there is a single popover element,
	// so one widened view covers both branches. `layer` stays a union rather
	// than an intersection: `attachTrigger` is an attachment in context mode and
	// `undefined` in fixed, so intersecting the two collapses to `never`.
	type WidenedProps = Omit<ContextRenderProps, 'layer'> &
		Partial<Omit<FixedRenderProps, 'layer'>> & { layer: ContextLayerReturn | FixedLayerReturn };

	const p = $derived(props as unknown as WidenedProps);

	const isFixed = $derived(p.layer.attachTrigger === undefined);

	const attrs = $derived(layerAttrs(isFixed, p.xstyle));

	const positionStyle = $derived(
		isFixed
			? `top:${p.y}px;left:${p.x}px`
			: contextPositionStyle(
					(p.layer as ContextLayerReturn).anchorId,
					p.positioning ?? 'anchor',
					p.placement ?? 'above',
					p.alignment ?? 'center'
				)
	);
</script>

<!--
	Render as the requested tag. A `span` keeps the layer phrasing content so it
	is valid (and stays put on hydration) inside inline contexts like a `<p>`;
	`div` remains the default for block layers.
-->
<svelte:element
	this={isFixed ? 'div' : (p.as ?? 'div')}
	{@attach p.layer.attachPopover}
	id={p.layer.id}
	role={isFixed ? undefined : p.role}
	aria-label={isFixed ? undefined : p['aria-label']}
	popover={p.layer.lightDismiss ? 'auto' : 'manual'}
	class={cx(p.class, attrs.class)}
	style={mergeStyle(attrs.style, positionStyle, p.style, p.layer.fallbackStyle)}
	onmouseenter={isFixed ? undefined : p.onmouseenter}
	onmouseleave={isFixed ? undefined : p.onmouseleave}
>
	{@render p.children()}
</svelte:element>
