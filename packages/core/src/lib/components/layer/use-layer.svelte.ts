import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { addAnchorName, readAnchorNames, removeAnchorName } from './anchor-name.js';
import { resolveLayerPortalTarget } from './layer-host.js';

/**
 * The core layer primitive, ported from Astryx's `Layer/useLayer.tsx`. Every
 * overlay in the system routes through it.
 *
 * The mechanism ports unchanged, and that is the point of the design: it is the
 * native Popover API plus CSS anchor positioning, so there is no portal, no
 * positioning library, and no measurement loop to translate. The logical
 * `placement`/`alignment` pair maps to a `position-area` in the `self-*` keyword
 * family, which resolves against the popover's own inherited direction — RTL
 * mirrors with no JS at all.
 *
 * Three things did not port as-is:
 *
 * **`render` is gone; `<Layer>` replaces it.** Upstream's hook returns a
 * function that produces JSX. A Svelte hook cannot return markup, so the
 * rendering half becomes a component and the hook hands it the pieces the
 * closure used to capture — `attachPopover`, `id`, `anchorId`, `lightDismiss`.
 * The consumer writes `<Layer {layer} placement="above">` where upstream writes
 * `layer.render(children, {placement: 'above'})`.
 *
 * **The id is passed in.** Upstream calls React's `useId()` inside the hook.
 * `$props.id()` is its exact Svelte analogue — unique per instance, stable
 * across the SSR/hydration boundary — but the compiler only permits it at the
 * top level of a *component*, so it cannot be called from a `.svelte.ts`
 * module. It is therefore a required option, and every consumer (each one a
 * component) passes `id: $props.id()`. A module-level counter would have kept
 * the signature identical and silently mismatched between server and client,
 * which is the failure `useId` exists to prevent.
 *
 * **Two ref-lifetime workarounds disappear.** `isOpenRef` mirrors `isOpen`
 * purely so the imperative `show`/`hide` avoid reading a stale closure; `$state`
 * reads are synchronous, so the mirror has no job. Larger: the whole
 * `bindToggleListener` / `listenedElRef` / `listenedHandlerRef` block exists
 * because a ref callback re-fires when `handleToggle`'s identity changes with a
 * new `onHide`, and stale listeners would otherwise accumulate on one element.
 * An attachment binds on attach and unbinds on detach, and the handler reads
 * `onHide` through the options getter at *event* time, so the identity never
 * changes and there is nothing to re-bind. Roughly 55 lines of upstream go with
 * it, and so does the `useEffect` that existed only to catch the case the ref
 * callback could not.
 */

/**
 * Position placement relative to anchor.
 * Logical: start/end resolve against the popover's own inherited direction
 * via CSS (RTL contexts mirror automatically, no JS involved).
 */
export type LayerPlacement = 'above' | 'below' | 'start' | 'end';

/** Alignment along the placement axis */
export type LayerAlignment = 'start' | 'center' | 'end';

/** Base options shared by both modes */
interface BaseLayerOptions {
	/**
	 * SSR-stable unique id for the layer element — the `aria-describedby` target
	 * a trigger points at. Pass `$props.id()` from the calling component; see the
	 * module comment for why the hook cannot mint it itself.
	 */
	id: string;

	/** Callback fired when layer is shown. */
	onShow?: () => void;

	/** Callback fired when layer is hidden. */
	onHide?: () => void;

	/**
	 * Whether clicking outside should dismiss the layer.
	 * When true, uses popover="auto" for native light-dismiss behavior.
	 * @default false
	 */
	lightDismiss?: boolean;
}

/** Options for context mode (CSS anchor positioning) */
export interface ContextLayerOptions extends BaseLayerOptions {
	mode: 'context';
	/**
	 * Defer mounting the final layer and resolving its inline/portal position
	 * until `show()` is requested. Hiding unmounts it while the inert marker
	 * remains at the render position. Use this when rich content must never
	 * enter an unsafe ancestor, even briefly, and does not need to exist while
	 * closed.
	 *
	 * @default false
	 */
	lazyMount?: boolean;
}

/** Options for fixed mode (manual positioning) */
export interface FixedLayerOptions extends BaseLayerOptions {
	mode: 'fixed';
}

/** The parts of the layer `<Layer>` needs — upstream's `render` closure. */
interface LayerRenderable {
	/**
	 * Attach to the popover element. `<Layer>` does this; it is upstream's
	 * `popoverRefCallback`, which was private because `render` owned the element.
	 */
	readonly attachPopover: Attachment<HTMLElement>;

	/** Unique ID for aria-describedby */
	readonly id: string;

	/** Whether the popover uses native light dismiss (`popover="auto"`). */
	readonly lightDismiss: boolean;

	/**
	 * The visibility declaration for the **no-Popover-API fallback** (finding
	 * infra-4), or `undefined` where the API exists and the UA stylesheet owns
	 * visibility. `<Layer>` merges it last into the element's `style`.
	 *
	 * It is rendered rather than assigned imperatively because the element's
	 * `style` attribute belongs to `<Layer>`'s template: Svelte applies a changed
	 * `style` by writing the whole attribute, so an out-of-band `element.style.
	 * display = 'none'` is discarded the next time any other part of that string
	 * changes. That was unreachable while every consumer left `style` constant,
	 * and became reachable when `Selector` started passing a computed
	 * `margin-block-start` that flips exactly at open and close — the same class
	 * of hazard `attachTrigger`'s `anchor-name` observer repairs, avoided here by
	 * never writing out of band in the first place.
	 */
	readonly fallbackStyle: string | undefined;
}

/**
 * Where a context layer's container should mount, resolved from the inert
 * marker's real position in the DOM.
 */
export interface ContextLayerMount {
	/** Null means the marker's parent is safe and the layer stays inline. */
	portalTarget: HTMLElement | null;
	/**
	 * Logical writing context lost when moving outside an unsafe ancestor, as a
	 * CSS declaration string. Upstream builds a `CSSProperties` object; `<Layer>`
	 * merges inline styles as strings, so this is the same content in the shape
	 * this port's style pipeline consumes.
	 */
	portalStyle: string;
}

/** Return type for context mode */
export interface ContextLayerReturn extends LayerRenderable {
	/**
	 * Attach to the inert `<template>` marker `<Layer>` renders at the layer's
	 * real position in the template. Its parent is what decides whether the
	 * container can stay inline or needs a corrective portal — and, because the
	 * marker outlives the container, it also reports a move if the render call
	 * relocates while the hook stays mounted. Upstream's `sentinelRef`.
	 *
	 * Typed `Attachment<HTMLElement>`, not `HTMLTemplateElement`: attachments are
	 * contravariant in their element, so Svelte's `<template>` slot only accepts
	 * the wider type — and nothing here reads a template-specific member.
	 */
	readonly attachSentinel: Attachment<HTMLElement>;

	/**
	 * Null until the marker resolves (and again after a `lazyMount` hide), which
	 * is `<Layer>`'s signal not to render the container yet.
	 */
	readonly contextMount: ContextLayerMount | null;
	/**
	 * Attach to the trigger element. Injects this layer's anchor name for CSS
	 * anchor positioning, and removes it again on detach. Upstream's `ref`.
	 */
	readonly attachTrigger: Attachment<HTMLElement>;

	/**
	 * The CSS anchor name to use for positioning.
	 * Use this when you need to set anchorName manually (e.g. a `display:contents`
	 * wrapper).
	 */
	readonly anchorId: string;

	/** Show the layer */
	show: () => void;

	/** Hide the layer */
	hide: () => void;

	/** Whether the layer is currently open */
	readonly isOpen: boolean;
}

/** Return type for fixed mode */
export interface FixedLayerReturn extends LayerRenderable {
	/**
	 * No trigger element in fixed mode. Declared rather than omitted, as
	 * upstream declares `ref: undefined`, so the two returns discriminate.
	 */
	readonly attachTrigger: undefined;

	/** Show the layer */
	show: () => void;

	/** Hide the layer */
	hide: () => void;

	/** Whether the layer is currently open */
	readonly isOpen: boolean;
}

/**
 * The two properties a corrective portal would silently change.
 *
 * Custom properties are deliberately NOT snapshotted: the portal target is the
 * closest safe ancestor, so theme variables continue to inherit and update
 * there. These two can be set on the unsafe chain itself and directly affect the
 * logical anchor-positioning keywords the layer uses. Only values the portal
 * would actually lose are overridden; matching values keep inheriting from the
 * target so a later direction change stays live.
 */
function readPortalWritingContext(element: HTMLElement, portalTarget: HTMLElement): string {
	const view = element.ownerDocument.defaultView;
	if (!view) {
		return '';
	}
	const sourceStyle = view.getComputedStyle(element);
	const targetStyle = view.getComputedStyle(portalTarget);

	const declarations: string[] = [];
	if (sourceStyle.direction !== targetStyle.direction) {
		declarations.push(`direction:${sourceStyle.direction}`);
	}
	if (sourceStyle.writingMode !== targetStyle.writingMode) {
		declarations.push(`writing-mode:${sourceStyle.writingMode}`);
	}
	return declarations.join(';');
}

/**
 * Map logical placement/alignment to a CSS position-area value.
 *
 * Uses the self-* logical keyword family: the inline axis resolves against
 * the popover's own direction (inherited inline, or preserved when portaled),
 * so it mirrors in RTL without placement-specific JS. The block axis is
 * direction-neutral but must come from the same
 * keyword family — mixing physical `top` with `self-inline-*` produces an
 * invalid position-area (computes to `none`, which pins the popover to the
 * viewport corner because the base styles zero the UA margins).
 *
 * Note the plain logical family (`inline-start`, no `self-`) is NOT a
 * substitute: it resolves against the containing block — the page root for
 * a top-layer popover — so it ignores `direction` set on a subtree, which
 * is exactly #3389's repro.
 */
function getPositionArea(
	placement: LayerPlacement = 'above',
	alignment: LayerAlignment = 'center'
): string {
	if (placement === 'above' || placement === 'below') {
		const block = placement === 'above' ? 'self-block-start' : 'self-block-end';
		if (alignment === 'start') {
			return `${block} span-self-inline-end`;
		}
		if (alignment === 'end') {
			return `${block} span-self-inline-start`;
		}
		return block; // center
	}

	const inline = placement === 'start' ? 'self-inline-start' : 'self-inline-end';
	if (alignment === 'start') {
		return `${inline} span-self-block-end`;
	}
	if (alignment === 'end') {
		return `${inline} span-self-block-start`;
	}
	return inline; // center
}

/**
 * Compute the `position-try-fallbacks` list for a placement/alignment pair.
 *
 * Flips alone cannot rescue a centered layer — flipping along the alignment
 * axis maps center → center, so overflow on that axis renders clipped
 * (#3671). Centered alignments therefore append span-based fallbacks letting
 * the browser slide the layer along the alignment axis as a last resort
 * (same-side spans first). Flips already resolve non-centered alignments.
 */
export function getPositionTryFallbacks(
	placement: LayerPlacement = 'above',
	alignment: LayerAlignment = 'center'
): string {
	const flips = 'flip-block, flip-inline, flip-block flip-inline';

	if (alignment !== 'center') {
		return flips;
	}

	if (placement === 'above' || placement === 'below') {
		const [same, opposite] = placement === 'above' ? ['top', 'bottom'] : ['bottom', 'top'];
		return `${flips}, ${same} span-left, ${same} span-right, ${opposite} span-left, ${opposite} span-right`;
	}

	const [same, opposite] = placement === 'start' ? ['left', 'right'] : ['right', 'left'];
	return `${flips}, ${same} span-top, ${same} span-bottom, ${opposite} span-top, ${opposite} span-bottom`;
}

/**
 * The inline position styles `<Layer>` writes for context mode. Exported for
 * the component only — upstream builds the same object inside `renderContext`.
 */
export function contextPositionStyle(
	anchorId: string,
	positioning: 'anchor' | 'custom',
	placement?: LayerPlacement,
	alignment?: LayerAlignment
): string {
	// Consumer authors its own position styles via `style` — keep only the
	// anchor wiring, derive nothing from placement.
	if (positioning === 'custom') {
		return `position-anchor:${anchorId}`;
	}
	return (
		`position-anchor:${anchorId}` +
		`;position-area:${getPositionArea(placement, alignment)}` +
		`;position-try-fallbacks:${getPositionTryFallbacks(placement, alignment)}`
	);
}

/**
 * Core layer hook that handles popover behavior and positioning.
 *
 * Supports two positioning modes with type-safe returns:
 * - `context`: CSS anchor positioning relative to a trigger element
 * - `fixed`: Fixed positioning at specified coordinates
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const id = $props.id();
 *   const layer = useLayer(() => ({ mode: 'context', id }));
 * </script>
 *
 * <button {@attach layer.attachTrigger} onclick={layer.show}>Trigger</button>
 * <Layer {layer} placement="above" alignment="center">
 *   <Content />
 * </Layer>
 * ```
 */
export function useLayer(options: () => ContextLayerOptions): ContextLayerReturn;
export function useLayer(options: () => FixedLayerOptions): FixedLayerReturn;
export function useLayer(
	options: () => ContextLayerOptions | FixedLayerOptions
): ContextLayerReturn | FixedLayerReturn {
	// Read once, untracked: a layer does not change positioning mode, and
	// upstream's destructure is equally a one-time read of a render-stable prop.
	const mode = options().mode;

	const id = $derived(options().id);
	const anchorId = $derived(`--astryx-layer-${options().id.replace(/:/g, '')}`);
	const lightDismiss = $derived(options().lightDismiss ?? false);

	// `lazyMount` is context-only, and read reactively for the same reason
	// upstream re-reads it every render: a consumer may flip it with a prop.
	const lazyMount = $derived(
		mode === 'context' ? ((options() as ContextLayerOptions).lazyMount ?? false) : false
	);

	let isOpen = $state(false);
	let popover: HTMLElement | null = null;
	// The element the current logical open state was applied to. A portal-target
	// change replaces the popover element; keeping the old reference lets the
	// attachment recognise and reopen its replacement.
	let openedPopover: HTMLElement | null = null;
	// The trigger, kept so `showPopover` can name it as the popover's invoker
	// `source`. It was not needed before 0.4.2 — the anchor-name attachment does
	// its own cleanup, so nothing else read the element.
	let triggerEl: HTMLElement | null = null;
	// The inert marker at the layer's real position in the template.
	let sentinel: HTMLElement | null = null;
	let contextMount = $state<ContextLayerMount | null>(null);
	// A show() that arrives before the container mounts is replayed when its
	// popover attachment runs.
	let pendingShow = false;

	// Rendered visibility for the no-Popover-API fallback; `undefined` whenever
	// the API is present, so nothing is emitted on a supporting browser. See
	// `LayerRenderable.fallbackStyle` for why this is state rather than a direct
	// `popover.style.display` write.
	let fallbackDisplay = $state<'block' | 'none' | undefined>(undefined);

	function showPopoverElement(element: HTMLElement): void {
		// Finding infra-4: the Popover API is unsupported on Safari <17 and
		// Firefox <125. On those browsers `showPopover` does not exist, so
		// calling it unconditionally throws a TypeError and the layer never
		// opens. Guard behind a feature check; when the API is missing, fall
		// back to plain visibility (the [popover] attribute is inert there, so
		// the element sits in normal flow) so the layer still becomes visible.
		if (typeof element.showPopover === 'function') {
			// The trigger is passed as the popover's invoker `source`: a layer
			// hosted away from its trigger then still takes its sequential focus
			// order (and its popover nesting) from the trigger rather than from
			// its own DOM position. Browsers without the option ignore it.
			element.showPopover({ source: triggerEl ?? undefined });
		} else {
			fallbackDisplay = 'block';
		}
		openedPopover = element;
	}

	/**
	 * Whether `element` is the container the *current* mount resolves to. A
	 * context popover left over from a previous mount must not be reopened.
	 */
	function isCurrentContextPopover(element: HTMLElement): boolean {
		if (mode !== 'context') {
			return true;
		}
		const mount = contextMount;
		if (mount === null) {
			return false;
		}
		const expectedParent = mount.portalTarget ?? sentinel?.parentElement ?? null;
		return element.parentElement === expectedParent;
	}

	function requestContextMount(): void {
		if (mode !== 'context') {
			return;
		}
		const inlineParent = sentinel?.parentElement ?? null;
		if (!sentinel || !inlineParent) {
			return;
		}
		const portalTarget = resolveLayerPortalTarget(inlineParent);
		const portalStyle = portalTarget ? readPortalWritingContext(sentinel, portalTarget) : '';
		// Bail out when the resolve lands on the mount we already have. Upstream
		// re-sets an equal `contextMount` freely: React re-renders into the *same*
		// `createPortal` container and no DOM moves. Here the object's identity is
		// what `<Layer>`'s `{@attach intoPortal(...)}` is keyed on, so a new-but-equal
		// mount tears the attachment down — running its `() => node.remove()` — and
		// re-appends. Removing a *showing* popover evicts it from the top layer
		// without firing `toggle`, and `attachPopover` does not re-run to re-show it,
		// so the layer is hidden for good. Equality here makes every re-resolve that
		// changes nothing cost nothing.
		const current = contextMount;
		if (current && current.portalTarget === portalTarget && current.portalStyle === portalStyle) {
			return;
		}
		contextMount = { portalTarget, portalStyle };
	}

	function clearContextMount(): void {
		if (mode !== 'context' || !lazyMount) {
			return;
		}
		contextMount = null;
	}

	function show(): void {
		const candidate = popover;
		const element = candidate && isCurrentContextPopover(candidate) ? candidate : null;
		if (!element) {
			pendingShow = true;
			requestContextMount();
			return;
		}
		if (!isOpen) {
			showPopoverElement(element);
			isOpen = true;
			options().onShow?.();
		}
	}

	function hide(): void {
		pendingShow = false;
		if (isOpen) {
			// See the infra-4 note in `showPopoverElement`: mirror the same guard on
			// hide so unsupported browsers degrade gracefully instead of throwing.
			if (popover) {
				if (typeof popover.hidePopover === 'function') {
					popover.hidePopover();
				} else {
					fallbackDisplay = 'none';
				}
			}
			openedPopover = null;
			isOpen = false;
			options().onHide?.();
		}
		clearContextMount();
	}

	/**
	 * Upstream's trigger ref callback. It has to remove only *this* layer's
	 * anchor name from the element it is leaving, so layers sharing a trigger
	 * keep theirs — which is precisely an attachment's cleanup, so the
	 * "previous element" bookkeeping and its `triggerRef` both go.
	 */
	const attachTrigger: Attachment<HTMLElement> = (element) => {
		const name = anchorId;
		triggerEl = element;
		addAnchorName(element, name);

		// `anchor-name` lives in the element's *inline style*, and that element
		// belongs to a caller's template. Svelte applies a changed `style`
		// attribute by assigning `cssText`, which replaces the whole declaration
		// block and takes the anchor name with it — after which `position-anchor`
		// names nothing, `position-area` computes to `none`, and the popover pins
		// to the viewport corner (the failure this module documents above). React
		// never hits it: it writes style *objects* per-property, and upstream's
		// trigger ref re-runs after every commit anyway, which doubles as a repair
		// pass. This observer is that repair. The membership check is what keeps it
		// from looping on its own write — and it means a caller using `style:`
		// directives (per-property `setProperty`, the shape `Slider`'s thumb uses)
		// never triggers a rewrite at all.
		const observer = new MutationObserver(() => {
			if (!readAnchorNames(element).includes(name)) {
				addAnchorName(element, name);
			}
		});
		observer.observe(element, { attributeFilter: ['style'] });

		return () => {
			observer.disconnect();
			removeAnchorName(element, name);
			if (triggerEl === element) {
				triggerEl = null;
			}
		};
	};

	/**
	 * The inert marker's attachment. Reading `lazyMount` is the only tracked read
	 * here; the resolve itself runs untracked so the attachment does not
	 * subscribe to whatever `getComputedStyle` and the options getter touch.
	 *
	 * `isOpen` is `$state` and must be read through `untrack`. Upstream reads
	 * `isOpenRef.current` — a ref, which cannot schedule anything — so its
	 * callback depends only on `[lazyMount, requestContextMount]`. Reading the
	 * `$state` directly subscribes this attachment to it, and then opening the
	 * layer re-runs the attachment, re-resolves the mount and moves the popover
	 * out of the top layer mid-open. `pendingShow` is a plain `let` and is safe
	 * either way; it is inside the `untrack` because the two are one condition.
	 */
	const attachSentinel: Attachment<HTMLElement> = (element) => {
		sentinel = element;
		if (!lazyMount || untrack(() => pendingShow || isOpen)) {
			// The render call may have moved while the hook stayed mounted. Resolve
			// again from the newly attached marker rather than reusing a portal
			// target from its previous position.
			untrack(requestContextMount);
		}
		return () => {
			if (sentinel === element) {
				sentinel = null;
			}
		};
	};

	/**
	 * Reconcile browser-initiated closes (light-dismiss, `popover="auto"` stack
	 * eviction). These are the only cases where the DOM mutates without going
	 * through our show/hide — we sync state back to match.
	 *
	 * No "open" case: the browser never spontaneously opens a popover. Opens
	 * only happen via showPopover() which we always call from show().
	 *
	 * The `isOpen` guard prevents double-firing: when our hide() already set it
	 * false, the subsequent toggle event (which the browser fires as a
	 * side-effect of hidePopover) sees false and skips.
	 */
	const attachPopover: Attachment<HTMLElement> = (element) => {
		popover = element;

		const handleToggle = (event: Event) => {
			const toggleEvent = event as ToggleEvent;
			if (toggleEvent.newState === 'closed' && isOpen) {
				openedPopover = null;
				isOpen = false;
				options().onHide?.();
				clearContextMount();
			}
		};

		element.addEventListener('toggle', handleToggle);

		if (pendingShow) {
			pendingShow = false;
			untrack(show);
		} else if (isOpen && openedPopover !== element && isCurrentContextPopover(element)) {
			// Changing a portal target remounts the container. Preserve the logical
			// open state without firing `onShow` again for the replacement element.
			untrack(() => showPopoverElement(element));
		}

		return () => {
			element.removeEventListener('toggle', handleToggle);
			if (popover === element) {
				popover = null;
			}
		};
	};

	if (mode === 'context') {
		return {
			attachTrigger,
			attachPopover,
			attachSentinel,
			get contextMount() {
				return contextMount;
			},
			get anchorId() {
				return anchorId;
			},
			show,
			hide,
			get isOpen() {
				return isOpen;
			},
			get id() {
				return id;
			},
			get lightDismiss() {
				return lightDismiss;
			},
			get fallbackStyle() {
				return fallbackDisplay ? `display:${fallbackDisplay}` : undefined;
			}
		};
	}

	return {
		attachTrigger: undefined,
		attachPopover,
		show,
		hide,
		get isOpen() {
			return isOpen;
		},
		get id() {
			return id;
		},
		get lightDismiss() {
			return lightDismiss;
		},
		get fallbackStyle() {
			return fallbackDisplay ? `display:${fallbackDisplay}` : undefined;
		}
	};
}
