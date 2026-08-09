/**
 * Ported from the first half of Astryx's `Selector/hooks.ts`.
 *
 * Upstream keeps both selector hooks in one `hooks.ts`; this port's convention is
 * one unit per kebab-case file, so `useCombobox` sits beside this one in
 * `use-combobox.svelte.ts`. Both are published from the barrel, as upstream's
 * `Selector/index.ts` publishes them.
 *
 * Two translations:
 *
 * **The `RefObject`s become elements.** Upstream takes `listboxRef`/`triggerRef`
 * as `RefObject<T | null>` and reads `.current`; here the options getter returns
 * the elements themselves, the shape `Popover`'s `anchorRef` already settled.
 * That also makes the effect fire when the listbox mounts, which is what
 * upstream's layout effect gets for free from the render that mounts it.
 *
 * **`useIsomorphicLayoutEffect` becomes a plain `$effect`.** Svelte's effects run
 * in a microtask after the DOM is written and before paint, which is the property
 * `useLayoutEffect` exists to buy — the offset is measured and committed without
 * an intervening frame, so the listbox never paints at the unpositioned spot.
 * (`$effect.pre` would be wrong: it runs *before* the DOM update, so the items
 * being measured would not be there yet.) `useIsomorphicLayoutEffect`'s own
 * reason to exist — React warns about `useLayoutEffect` during SSR — has no
 * counterpart at all, since Svelte effects simply do not run on the server.
 */

/**
 * Options for `useSelectedItemOffset`. Module-private, as upstream declares it.
 */
interface UseSelectedItemOffsetOptions {
	/** Whether the dropdown is open. Closed resets the offset. */
	isOpen: boolean;
	/** Index of the selected item within the flattened option list, or `-1`. */
	selectedItemIndex: number;
	/** The listbox's id — item ids are derived from it. */
	listboxId: string;
	/** The listbox element, once mounted. Upstream's `listboxRef`. */
	listboxEl: HTMLElement | null | undefined;
	/** The trigger button element. Upstream's `triggerRef`. */
	triggerEl: HTMLElement | null | undefined;
}

/** Return value of `useSelectedItemOffset`. Module-private, and named as upstream names it. */
interface UseSelectedItemOffsetResult {
	/** Negative block-start margin, in px, to apply to the layer container. */
	readonly offset: number;
	/** Whether the measurement has run — the listbox stays transparent until it has. */
	readonly isPositioned: boolean;
}

/**
 * Calculates the offset needed to position the dropdown so that the selected
 * item appears centered over the trigger button (macOS-style selector).
 *
 * The desired dropdown top is calculated directly from the trigger center and
 * selected-item center, then clamped to the viewport. This preserves the
 * default "selected item over trigger" behavior while letting the menu slide
 * upward near the bottom edge or downward near the top edge instead of being
 * clipped off-screen.
 */
export function useSelectedItemOffset(
	options: () => UseSelectedItemOffsetOptions
): UseSelectedItemOffsetResult {
	let offset = $state(0);
	let isPositioned = $state(false);

	function commitPosition(nextOffset: number, nextIsPositioned: boolean): void {
		offset = nextOffset;
		isPositioned = nextIsPositioned;
	}

	$effect(() => {
		const { isOpen, selectedItemIndex, listboxId, listboxEl, triggerEl } = options();

		if (!isOpen) {
			// Reset offset when closed
			commitPosition(0, false);
			return;
		}

		if (!listboxEl || !triggerEl) {
			commitPosition(0, true);
			return;
		}

		// Find the target item: selected item or first item
		const targetIndex = selectedItemIndex >= 0 ? selectedItemIndex : 0;
		const targetItemId = `${listboxId}-item-${targetIndex}`;
		// Use getElementById - works with special characters without escaping
		const targetItem = document.getElementById(targetItemId);

		if (!targetItem) {
			commitPosition(0, true);
			return;
		}

		// Get positions. Browsers provide real dimensions before paint.
		const listboxRect = listboxEl.getBoundingClientRect();
		const itemRect = targetItem.getBoundingClientRect();
		const triggerRect = triggerEl.getBoundingClientRect();

		const listboxHeight = listboxRect.height;
		if (listboxHeight <= 0) {
			commitPosition(0, true);
			return;
		}

		// Item center relative to listbox top. This remains stable even as the
		// popover's top changes between measurements.
		const itemCenterInListbox = itemRect.top - listboxRect.top + itemRect.height / 2;
		const triggerCenter = triggerRect.top + triggerRect.height / 2;

		// Desired top aligns the selected item's center with trigger center.
		const desiredTop = triggerCenter - itemCenterInListbox;
		const viewportHeight = window.innerHeight;
		const maxTop = Math.max(0, viewportHeight - listboxHeight);
		const clampedTop = Math.min(Math.max(desiredTop, 0), maxTop);

		// The layer positions the popover below the trigger. Apply a negative
		// block-start margin to the layer container so the listbox top moves from
		// triggerRect.bottom to clampedTop.
		const clampedOffset = Math.max(0, triggerRect.bottom - clampedTop);

		commitPosition(clampedOffset, true);
	});

	return {
		get offset() {
			return offset;
		},
		get isPositioned() {
			return isPositioned;
		}
	};
}
