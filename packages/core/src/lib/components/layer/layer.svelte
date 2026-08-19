<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { MouseEventHandler } from 'svelte/elements';
	import type { StyleArg } from '../../internal/sx.js';
	import type { Attachment } from 'svelte/attachments';
	import type {
		ContextLayerMount,
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
		 * Clearance between the layer and its anchor, as a CSS length (a number is
		 * treated as `px`). Applied along the placement axis and flip-safe, so the
		 * gap survives a `position-try-fallbacks` flip to the opposite side.
		 *
		 * Layers sit flush by default: the hook zeroes the UA margins so anchor
		 * positioning has a clean box, and clearance is a deliberate choice per
		 * surface. `var(--spacing-1)` is the system's standard clearance.
		 *
		 * Ignored when `positioning` is `'custom'` — that mode owns its own insets.
		 *
		 * @default 0
		 */
		offset?: number | string;
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
		 * Defaults to `'div'`. Context layers render an inert `<template>` marker at
		 * the layer's position in the template. The marker's parent is checked
		 * before the requested container mounts there or portals outside ancestors
		 * that cannot safely contain it. The marker remains available to detect a
		 * new parent if the render call moves. With `lazyMount`, the first check
		 * waits until `show()`.
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

	const attrs = $derived(
		layerAttrs(isFixed, p.xstyle, p.offset, p.positioning ?? 'anchor', p.placement ?? 'above')
	);

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

	// Context mode resolves where the container may live before rendering it;
	// fixed mode has no marker and always renders. Null means "not resolved yet"
	// — on first render, and again after a `lazyMount` hide.
	const contextMount = $derived(isFixed ? null : (p.layer as ContextLayerReturn).contextMount);
	const shouldRender = $derived(isFixed || contextMount !== null);
	const portalStyle = $derived(contextMount?.portalStyle);

	/**
	 * Where Svelte actually rendered the container, captured on the first attach.
	 * A node this component moved away has to be *put back* when the resolve says
	 * inline, and Svelte will not do it: as far as the runtime is concerned the
	 * element is already rendered, so nothing re-inserts it.
	 */
	let portalHome: { parent: Node; next: Node | null } | null = null;

	/**
	 * Move the container to its corrective portal target. Svelte has no
	 * `createPortal`, so the element renders in place and is relocated — the same
	 * device `ChatComposerInput` uses to move a token's content into its span.
	 *
	 * **The cleanup is load-bearing here, where that one needs none.** Svelte
	 * tears an `{#if}` block down by clearing the range between its anchors in the
	 * block's *original* parent; a node moved out of that range is never reached,
	 * so a portaled layer survived its own unmount and a hidden `lazyMount` card
	 * stayed in the DOM. Removing it explicitly is idempotent — a node Svelte
	 * already removed is simply not in a tree any more.
	 *
	 * **The `null` target is a move, not a no-op.** `target` is `null` whenever the
	 * resolve lands on a safe parent, and it can *become* null while mounted — a
	 * persistent render call that moves from a `<p>` into a `<section>` re-resolves
	 * from host to inline. Returning early there left the previous cleanup's
	 * `node.remove()` as the last word and the container vanished, which is
	 * precisely what upstream's `re-resolves the host when a persistent render call
	 * moves` covers; that case had never been ported.
	 */
	/**
	 * Re-run the hook's popover attachment whenever the resolved mount changes.
	 *
	 * `p.layer.attachPopover` is a stable function, so Svelte runs it once per
	 * element and never again — but a mount change *moves* the container, and a
	 * popover moved in the DOM leaves the top layer. The hook already knows how to
	 * repair that (`attachPopover`'s "changing a portal target remounts the
	 * container" branch re-shows without re-firing `onShow`); it simply never got
	 * the chance, because nothing re-ran it. Threading the mount through gives the
	 * attachment a new identity per mount, which is the trigger that branch needs.
	 *
	 * Without this, upstream's `reopens an open lazy layer after its render call
	 * moves` fails: the layer lands in the right parent, closed.
	 */
	function reattachOnMount(
		_mount: ContextLayerMount | null | undefined,
		attach: Attachment<HTMLElement>
	) {
		return (node: HTMLElement) => attach(node);
	}

	function intoPortal(target: HTMLElement | null | undefined) {
		return (node: HTMLElement) => {
			portalHome ??= { parent: node.parentNode as Node, next: node.nextSibling };
			if (target) {
				target.appendChild(node);
			} else if (node.parentNode !== portalHome.parent && portalHome.parent.isConnected) {
				portalHome.parent.insertBefore(node, portalHome.next);
			}
			return () => node.remove();
		};
	}
</script>

<!--
	The inert marker gives the hook the layer's *real* parent without mounting
	arbitrary children there. A `<template>` is script-supporting content, so it
	is valid in every position a layer might be written into — including the
	structurally restricted ones (`<tr>`, `<ul>`, `<select>`) where the eventual
	container is not — and it renders nothing.
-->
{#if !isFixed}
	<template {@attach (p.layer as ContextLayerReturn).attachSentinel}></template>
{/if}
<!--
	Render as the requested tag. Safe positions preserve the existing DOM order
	and cascade; unsafe positions move to the nearest corrective portal target,
	carrying the writing context that move would otherwise lose.
-->
{#if shouldRender}
	<svelte:element
		this={isFixed ? 'div' : (p.as ?? 'div')}
		{@attach intoPortal(contextMount?.portalTarget)}
		{@attach reattachOnMount(contextMount, p.layer.attachPopover)}
		id={p.layer.id}
		role={isFixed ? undefined : p.role}
		aria-label={isFixed ? undefined : p['aria-label']}
		popover={p.layer.lightDismiss ? 'auto' : 'manual'}
		class={cx(p.class, attrs.class)}
		style={mergeStyle(attrs.style, positionStyle, portalStyle, p.style, p.layer.fallbackStyle)}
		onmouseenter={isFixed ? undefined : p.onmouseenter}
		onmouseleave={isFixed ? undefined : p.onmouseleave}
	>
		{@render p.children()}
	</svelte:element>
{/if}
