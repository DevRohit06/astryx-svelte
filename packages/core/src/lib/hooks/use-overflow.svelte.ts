import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { observeResize, unobserveResize } from '../internal/shared-resize-observer.js';
import { devWarn } from '../utils/dev-warning.js';
import { computeOverflow } from './compute-overflow.js';

/**
 * Horizontal overflow measurement, ported from Astryx's `hooks/useOverflow.ts`.
 *
 * All the items are rendered once into a hidden measurement container; the hook
 * reads their widths and works out how many fit in the visible container, so a
 * list collapses without ever flickering. A `ResizeObserver` recalculates when
 * the container changes size.
 *
 * The measurement container should hold the items followed by the overflow
 * indicator, if there is one — it is identified by being the extra child past
 * `itemCount`, and its width is reserved on every step but the last.
 *
 * Upstream returns two **ref callbacks**; both become attachments, which have
 * the same attach/replace/detach lifecycle. `useIsomorphicLayoutEffect` — one of
 * the modules `planning/06` records as obviated — is a plain `$effect` here: it
 * exists upstream only to avoid React's SSR warning about `useLayoutEffect`, and
 * effects do not run during SSR at all in Svelte.
 *
 * The fit/clamp/row-packing math itself lives in the pure `compute-overflow.ts`
 * module, as upstream's does — it holds no DOM, so it is unit-tested directly in
 * the server project rather than through a rendered component.
 */

export interface UseOverflowOptions {
	/**
	 * Gap between items in pixels. Used in width calculations.
	 * @default 0
	 */
	gap?: number;

	/**
	 * Minimum number of items to always show, even if they don't fit.
	 * @default 0
	 */
	minVisibleItems?: number;

	/**
	 * Maximum number of items to ever show, even if they all fit. The ceiling
	 * partner to `minVisibleItems`. `undefined` means no cap. When it is less
	 * than `minVisibleItems`, the floor wins and a dev-only warning is emitted.
	 * @default undefined
	 */
	maxVisibleItems?: number;

	/**
	 * Wrap items across up to this many rows before collapsing the rest into the
	 * overflow indicator. `undefined` (or `1`) keeps the single-line behaviour.
	 * A number, not a boolean: unbounded wrapping is a plain flex-wrap layout,
	 * not overflow collapse. Assumes uniform row height.
	 * @default undefined
	 */
	maxRows?: number;

	/**
	 * Which end to collapse items from.
	 * @default 'end'
	 */
	collapseFrom?: 'start' | 'end';

	/**
	 * Which element to observe for overflow calculations.
	 * - `'observeSelf'`: uses the container's own width (default)
	 * - `'observeParent'`: observes the container's parent element for
	 *   resize and uses the parent's content width. This allows the
	 *   visible container to remain content-sized while still detecting
	 *   available space for grow-back. Siblings that don't fit alongside
	 *   the items can wrap and be clipped by the parent's overflow.
	 * @default 'observeSelf'
	 */
	behavior?: 'observeParent' | 'observeSelf';
}

export interface UseOverflowReturn {
	/** Attach to the visible container element. */
	readonly attachContainer: Attachment<HTMLElement>;
	/** Attach to the hidden measurement container. */
	readonly attachMeasure: Attachment<HTMLElement>;
	/** Number of items that fit in the visible container */
	readonly visibleCount: number;
	/** Whether any items are overflowing */
	readonly hasOverflow: boolean;
	/** Number of rows the visible items occupy (1 for the single-line path). */
	readonly rows: number;
	/** Measured max item height in pixels; used to size the multi-row container. */
	readonly rowHeight: number;
}

/**
 * Manages horizontal overflow of a list of items.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const overflow = useOverflow(() => items.length, () => ({ gap: 8 }));
 * </script>
 *
 * <div {@attach overflow.attachContainer}>
 *   {#each items.slice(0, overflow.visibleCount) as item}…{/each}
 * </div>
 * <div {@attach overflow.attachMeasure} aria-hidden="true">…</div>
 * ```
 */
export function useOverflow(
	itemCount: () => number,
	options: () => UseOverflowOptions = () => ({})
): UseOverflowReturn {
	let visibleCount = $state(itemCount());
	let rows = $state(1);
	let rowHeight = $state(0);

	// Upstream's three refs. None of them is rendered, so none is reactive —
	// they hold identity, exactly as `useRef` does.
	let containerEl: HTMLElement | null = null;
	let measureEl: HTMLElement | null = null;
	let observedEl: HTMLElement | null = null;

	function calculate(): void {
		const container = containerEl;
		const measure = measureEl;
		if (!container || !measure) {
			return;
		}

		const count = itemCount();
		const {
			gap = 0,
			minVisibleItems = 0,
			maxVisibleItems,
			maxRows,
			collapseFrom = 'end',
			behavior = 'observeSelf'
		} = options();
		const observeParent = behavior === 'observeParent';

		let availableWidth: number;

		if (observeParent && container.parentElement) {
			const parent = container.parentElement;
			const parentStyle = getComputedStyle(parent);
			availableWidth =
				parent.clientWidth -
				parseFloat(parentStyle.paddingLeft) -
				parseFloat(parentStyle.paddingRight);
		} else {
			availableWidth = container.offsetWidth;
		}

		const allChildren = Array.from(measure.children) as HTMLElement[];

		// The measurement container holds itemCount items, plus optionally
		// an overflow indicator as the last child.
		const hasIndicator = allChildren.length > count;
		const children = hasIndicator ? allChildren.slice(0, count) : allChildren;
		const indicatorWidth = hasIndicator ? allChildren[allChildren.length - 1].offsetWidth : 0;

		if (children.length === 0) {
			visibleCount = 0;
			rows = 0;
			return;
		}

		const widths = children.map((child) => child.offsetWidth);
		const measuredRowHeight = children.reduce(
			(max, child) => Math.max(max, child.offsetHeight || 0),
			0
		);

		const result = computeOverflow({
			widths,
			gap,
			availableWidth,
			indicatorWidth,
			minVisibleItems,
			maxVisibleItems,
			maxRows,
			collapseFrom
		});

		visibleCount = result.visibleCount;
		rows = result.rows;
		rowHeight = measuredRowHeight;
	}

	// Both attachments run their body untracked. An attachment is an effect, and
	// they call `calculate`, which reads `itemCount()` and `options()` — without
	// this they would re-subscribe every time either changed. Upstream's ref
	// callbacks have no reactive subscription at all, and neither should these:
	// re-measuring on a change is the `$effect` below's job.

	const attachContainer: Attachment<HTMLElement> = (element) =>
		untrack(() => {
			containerEl = element;

			// Clean up previous observation. Upstream tracks the observed element
			// separately because under `observeParent` it is not the one it was handed.
			if (observedEl) {
				unobserveResize(observedEl);
				observedEl = null;
			}

			const observeParent = options().behavior === 'observeParent';
			const target = observeParent && element.parentElement ? element.parentElement : element;
			// observeResize fires once on registration, which is what performs the
			// first measurement.
			observeResize(target, calculate);
			observedEl = target;

			return () => {
				if (observedEl) {
					unobserveResize(observedEl);
					observedEl = null;
				}
				containerEl = null;
			};
		});

	const attachMeasure: Attachment<HTMLElement> = (element) =>
		untrack(() => {
			measureEl = element;
			calculate();

			return () => {
				measureEl = null;
			};
		});

	// Recalculate when itemCount or any option changes — upstream's
	// `useIsomorphicLayoutEffect(calculate, [calculate])`, where `calculate` is
	// re-created whenever one of those inputs does. Both are read here rather
	// than left to `calculate`, which bails before touching them when the
	// elements are not attached yet.
	$effect(() => {
		itemCount();
		options();
		calculate();
	});

	// Re-point the ResizeObserver when `behavior` flips at runtime. Upstream lists
	// `observeParent` in `containerRef`'s dependency array, so a change tears down
	// the ref callback and re-observes the now-relevant element (the parent under
	// `observeParent`, the container otherwise). Our `attachContainer` only re-runs
	// when the *element* changes, so mirror that re-registration here — otherwise
	// the observer keeps watching the old target and later resizes of the relevant
	// one never recalculate. The guard makes the common case (no behavior change,
	// or the target already correct) a no-op, so option changes like `gap` that
	// also re-run this effect cost nothing.
	$effect(() => {
		const observeParent = options().behavior === 'observeParent';
		const container = containerEl;
		if (!container) return;
		const target = observeParent && container.parentElement ? container.parentElement : container;
		if (target === observedEl) return;
		untrack(() => {
			if (observedEl) unobserveResize(observedEl);
			observeResize(target, calculate);
			observedEl = target;
		});
	});

	// Upstream's `useDevWarning('useOverflow', …)`: a ref latch inside an effect,
	// so the hint fires at most once per hook instance and never during SSR.
	// Expanded inline rather than calling our `useDevWarning`, because the message
	// interpolates two options that can change after mount and the hook takes
	// `message` as a plain string — captured at init, it would report the mount-time
	// numbers when the condition first turns true later.
	let hasWarnedVisibleItems = false;
	$effect(() => {
		const { minVisibleItems = 0, maxVisibleItems } = options();
		if (maxVisibleItems != null && maxVisibleItems < minVisibleItems && !hasWarnedVisibleItems) {
			hasWarnedVisibleItems = true;
			devWarn(
				'useOverflow',
				`maxVisibleItems (${maxVisibleItems}) is less than ` +
					`minVisibleItems (${minVisibleItems}); the floor wins and ` +
					`minVisibleItems items will be shown.`
			);
		}
	});

	return {
		attachContainer,
		attachMeasure,
		get visibleCount() {
			return visibleCount;
		},
		get hasOverflow() {
			return visibleCount < itemCount();
		},
		get rows() {
			return rows;
		},
		get rowHeight() {
			return rowHeight;
		}
	};
}
