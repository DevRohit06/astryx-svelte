import type { Attachment } from 'svelte/attachments';
import { addAnchorName, readAnchorNames, removeAnchorName } from './anchor-name.js';

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

/** Return type for context mode */
export interface ContextLayerReturn extends LayerRenderable {
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
 * Map logical placement/alignment to a CSS position-area value.
 *
 * Uses the self-* logical keyword family: the inline axis resolves against
 * the popover's own inherited direction (the layer renders inside the
 * trigger's subtree, so it inherits `direction` and mirrors in RTL with no
 * JS). The block axis is direction-neutral but must come from the same
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

	let isOpen = $state(false);
	let popover: HTMLElement | null = null;

	// Rendered visibility for the no-Popover-API fallback; `undefined` whenever
	// the API is present, so nothing is emitted on a supporting browser. See
	// `LayerRenderable.fallbackStyle` for why this is state rather than a direct
	// `popover.style.display` write.
	let fallbackDisplay = $state<'block' | 'none' | undefined>(undefined);

	function show(): void {
		// Finding infra-4: the Popover API is unsupported on Safari <17 and
		// Firefox <125. On those browsers `showPopover` does not exist, so
		// calling it unconditionally throws a TypeError and the layer never
		// opens. Guard behind a feature check; when the API is missing, fall
		// back to plain visibility (the [popover] attribute is inert there, so
		// the element sits in normal flow) so the layer still becomes visible.
		if (popover && !isOpen) {
			if (typeof popover.showPopover === 'function') {
				popover.showPopover();
			} else {
				fallbackDisplay = 'block';
			}
			isOpen = true;
			options().onShow?.();
		}
	}

	function hide(): void {
		if (isOpen) {
			// See the infra-4 note in `show`: mirror the same guard on hide so
			// unsupported browsers degrade gracefully instead of throwing.
			if (popover) {
				if (typeof popover.hidePopover === 'function') {
					popover.hidePopover();
				} else {
					fallbackDisplay = 'none';
				}
			}
			isOpen = false;
			options().onHide?.();
		}
	}

	/**
	 * Upstream's trigger ref callback. It has to remove only *this* layer's
	 * anchor name from the element it is leaving, so layers sharing a trigger
	 * keep theirs — which is precisely an attachment's cleanup, so the
	 * "previous element" bookkeeping and its `triggerRef` both go.
	 */
	const attachTrigger: Attachment<HTMLElement> = (element) => {
		const name = anchorId;
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
				isOpen = false;
				options().onHide?.();
			}
		};

		element.addEventListener('toggle', handleToggle);

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
