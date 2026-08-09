import type { Attachment } from 'svelte/attachments';
import { useClickableContainer } from '../../hooks/use-clickable-container.svelte.js';
import { useMediaQuery } from '../../hooks/use-media-query.svelte.js';
import type { SvelteStyleAttrs } from '../../internal/sx.js';
import type { OverlayScrimProps } from './overlay-scrim.svelte';
import type {
	OverlayAlign,
	OverlayPosition,
	OverlayScrimMode,
	OverlayShowOn
} from './overlay-scrim.stylex.js';
import { overlayContainerAttrs } from './overlay.markers.stylex.js';

/**
 * Ported from Astryx's `Overlay/useOverlay.tsx` — overlay behaviour for a
 * container you already have (a `Card`, an `AspectRatio`, a bare `<div>`),
 * without wrapping it in anything.
 *
 * Almost nothing here is state, and that is the design: `showOn` is resolved
 * entirely in CSS by `overlay-scrim.stylex.ts`. The single piece of JS is the
 * touch tap-toggle, which exists because a device reporting `(hover: none)` has
 * no `:hover` for the CSS to key off.
 *
 * Two things translate:
 * - **`containerRef` becomes `attachContainer` plus a `container` getter.**
 *   Svelte has no ref objects; an attachment has the ref callback's exact
 *   lifecycle, and the getter is what `Overlay` reads where upstream reads
 *   `.current`.
 * - **`element` and `renderOverlay` both become `<OverlayScrim>`.** A hook
 *   cannot return markup, so what it returns instead is `scrimProps` — the five
 *   resolved values `renderOverlay` closed over. Upstream's `content` option
 *   exists only to pre-render `element` from it, so it has no job here and is
 *   absent rather than accepted-and-ignored; the component's `children` is the
 *   one way in, as `renderOverlay`'s argument is upstream.
 */

export interface UseOverlayOptions {
	/**
	 * CSS-driven visibility trigger.
	 * - `"always"` — always visible
	 * - `"hover"` — hover + focus (accessible default). Touch: strip = always visible, fill = tap-to-toggle.
	 * - `"focus"` — focus-within only
	 * - `"hover-or-focus"` — alias for "hover"
	 * @default "always"
	 */
	showOn?: OverlayShowOn;
	/** JS-controlled visibility override. Takes precedence over showOn + touch. */
	isOpen?: boolean;
	/** @default "dark" */
	scrim?: OverlayScrimMode;
	/** @default "fill" */
	position?: OverlayPosition;
	/** @default "end" */
	align?: OverlayAlign;
}

export interface OverlayContainerProps {
	/** Marker + positioning classes. */
	class: string;
	/** Marker + positioning custom properties, when there are any. */
	style: string | undefined;
	/** Touch tap-to-toggle handler. Only set on touch devices with full overlays. */
	onclick: ((event: MouseEvent) => void) | undefined;
	/** Touch tap-to-toggle handler. Only set on touch devices with full overlays. */
	onmouseup: ((event: MouseEvent) => void) | undefined;
}

export interface UseOverlayResult {
	/** Apply to the container element. Upstream's `containerRef`. */
	readonly attachContainer: Attachment<HTMLElement>;
	/** The container element once attached — upstream's `containerRef.current`. */
	readonly container: HTMLElement | null;
	/** Spread onto the container element. */
	readonly containerProps: OverlayContainerProps;
	/**
	 * Spread onto `<OverlayScrim>`. Stands in for both upstream's `element` and
	 * its `renderOverlay`, which differ only in where the content comes from.
	 */
	readonly scrimProps: Omit<OverlayScrimProps, 'children'>;
}

/**
 * Overlay behaviour for an existing container.
 *
 * @example
 * ```svelte
 * const overlay = useOverlay(() => ({ showOn: 'hover' }));
 *
 * <div {@attach overlay.attachContainer} {...overlay.containerProps}>
 *   <img {src} alt="" />
 *   <OverlayScrim {...overlay.scrimProps}>
 *     <Button label="Quick view" variant="ghost" />
 *   </OverlayScrim>
 * </div>
 * ```
 */
export function useOverlay(options: () => UseOverlayOptions = () => ({})): UseOverlayResult {
	let container = $state<HTMLElement | null>(null);
	let touchOpen = $state(false);

	// Upstream hand-rolls the `(hover: none)` subscription with
	// `useSyncExternalStore` rather than reaching for its own `useMediaQuery`.
	// Ours is that hook, because our port of it *is* that translation — the
	// `serverDefault` is upstream's `getServerSnapshot` returning `false`.
	const hoverNone = useMediaQuery(() => '(hover: none)', false);

	const showOn = $derived(options().showOn ?? 'always');
	const scrim = $derived(options().scrim ?? 'dark');
	const position = $derived(options().position ?? 'fill');
	const align = $derived(options().align ?? 'end');

	const isHoverMode = $derived(showOn === 'hover' || showOn === 'hover-or-focus');
	const needsTouchToggle = $derived(hoverNone.matches && isHoverMode);

	function handleToggle(): void {
		touchOpen = !touchOpen;
	}

	const { onclick, onmouseup } = useClickableContainer(() => ({
		container,
		onclick: needsTouchToggle ? handleToggle : undefined,
		disabled: !needsTouchToggle
	}));

	// Resolve isOpen: consumer prop > touch toggle > undefined (CSS)
	const effectiveIsOpen = $derived.by(() => {
		const { isOpen } = options();
		if (isOpen !== undefined) return isOpen;
		return needsTouchToggle ? touchOpen : undefined;
	});

	const attachContainer: Attachment<HTMLElement> = (element) => {
		container = element;
		return () => {
			if (container === element) container = null;
		};
	};

	// Container styles (marker + positioning)
	const resolved: SvelteStyleAttrs = overlayContainerAttrs();

	return {
		attachContainer,
		get container() {
			return container;
		},
		get containerProps(): OverlayContainerProps {
			return {
				class: resolved.class,
				style: resolved.style,
				onclick: needsTouchToggle ? onclick : undefined,
				onmouseup: needsTouchToggle ? onmouseup : undefined
			};
		},
		get scrimProps(): Omit<OverlayScrimProps, 'children'> {
			return {
				scrim,
				position,
				align,
				showOn,
				isOpen: effectiveIsOpen
			};
		}
	};
}
