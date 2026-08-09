import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { isRtlElement } from './is-rtl-element.js';

/**
 * Linear-list keyboard navigation, ported from Astryx's `hooks/useListFocus.ts`.
 *
 * The WAI-ARIA menu/listbox/toolbar pattern: arrows move between items, Home/End
 * jump to the ends, Escape calls back, disabled items are skipped rather than
 * focused (a `.focus()` on a disabled element silently no-ops, which is what
 * froze navigation in upstream's menus-4 regression). All of that is DOM work
 * and transcribes unchanged, including the caret guard that keeps a nested text
 * input or `contenteditable` composer from having its arrow keys stolen.
 *
 * Four translations:
 *
 * Upstream returns a `RefObject` for the consumer to attach with `ref=`. Svelte
 * has no ref objects, so the hook hands back an **attachment** instead.
 *
 * `handleFocus` goes on **`onfocusin`**, not `onfocus`. Upstream documents
 * `onFocus`, but React's synthetic `onFocus` is delivered by the native
 * `focusin` event, which bubbles; Svelte's `onfocus` is native `focus`, which
 * does not. Attaching to `onfocus` would fire only when the container itself
 * takes focus — never when an item inside it does, which is the entire case the
 * handler exists for.
 *
 * The options come in as a getter, read at *event* time. Upstream's twelve-entry
 * `useCallback` dependency list on `handleKeyDown` exists only to keep that
 * closure current; a getter is current by construction, so the list has nothing
 * left to describe.
 *
 * The one place a mechanism had to be invented rather than translated is the
 * roving tab stop. Upstream repairs it from a **dependency-less** layout effect
 * — "after every commit" — because React cannot know which render added an item
 * or toggled one disabled. Svelte has no after-every-render hook, and the item
 * list belongs to the *consumer's* template, so nothing the hook can read tells
 * it the children changed. A `MutationObserver` on the container is the
 * DOM-level counterpart, and it is the contract `hasRovingTabIndex` documents
 * ("repaired whenever items mount/unmount or toggle disabled") rather than an
 * addition to it. It cannot loop: `setTabIndex` writes only when the value
 * differs, so the sync triggered by a sync is a no-op and the cascade stops.
 */

/**
 * Navigation orientation for a linear list.
 * - `'horizontal'`: ArrowLeft/ArrowRight move between items.
 * - `'vertical'`: ArrowUp/ArrowDown move between items.
 * - `'both'`: all four arrows move between items (in linear DOM order).
 */
export type ListFocusOrientation = 'horizontal' | 'vertical' | 'both';

/** Configuration for list focus behavior */
export interface UseListFocusOptions {
	/**
	 * Selector for focusable items within the list.
	 * @default '[role="menuitem"]'
	 */
	itemSelector?: string;

	/**
	 * Selector identifying a list boundary — used to scope a list that contains
	 * *nested* lists of the same kind (e.g. a menu with submenu flyouts).
	 *
	 * Overlays like submenu flyouts render inline (native popover, not a
	 * portal), so a nested list's items are DOM descendants of the parent list.
	 * Without scoping, the parent's `querySelectorAll` sweeps the nested items
	 * into its roving order (leaving hidden items `.focus()` can't land on), and
	 * key events from the nested list bubble into the parent's handler (moving
	 * focus twice). When set, `useListFocus`:
	 *   - counts an item as its own only when the item's nearest
	 *     `boundarySelector` ancestor is this list's container, and
	 *   - ignores key events whose nearest `boundarySelector` ancestor is not
	 *     this list's container (i.e. they originated in a nested list).
	 *
	 * Typically `'[role="menu"]'` for menus. Omit for flat lists.
	 */
	boundarySelector?: string;

	/**
	 * Whether arrow navigation wraps around at the ends.
	 * @default true
	 */
	wrap?: boolean;

	/** Callback when Escape key is pressed. */
	onEscape?: () => void;

	/**
	 * Navigation orientation. `'horizontal'` uses ArrowLeft/ArrowRight,
	 * `'vertical'` uses ArrowUp/ArrowDown, `'both'` accepts all four arrows.
	 * @default 'vertical'
	 */
	orientation?: ListFocusOrientation;

	/**
	 * Whether Home/End jump to the first/last enabled item.
	 * @default true
	 */
	hasHomeEnd?: boolean;

	/**
	 * @deprecated Direction is auto-detected from the container's computed
	 * `direction` — omit this. The explicit override is redundant (there's no
	 * valid reason to force RTL arrows in an LTR context) and will be removed in
	 * an upcoming major.
	 *
	 * When set, forces whether the list is right-to-left: ArrowLeft/ArrowRight
	 * are swapped so horizontal navigation follows visual direction. When
	 * omitted (preferred), the direction is auto-detected from the container's
	 * computed `direction` (read lazily on keydown, horizontal arrows only).
	 * @default undefined (auto-detect from the container)
	 */
	isRtl?: boolean;

	/**
	 * Roving-tabindex ownership. When true, the hook manages a single tab stop
	 * across the items: exactly one enabled item carries `tabindex="0"` and the
	 * rest `tabindex="-1"`. The tab stop is stamped on mount and repaired
	 * whenever items mount/unmount or toggle disabled, and moves with arrow
	 * navigation. Attach the returned {@link UseListFocusReturn.handleFocus} to
	 * the container's `onfocusin` to keep the stop in sync after clicks or
	 * programmatic focus.
	 *
	 * When false (the default), the hook only *moves* focus (`.focus()`) and
	 * never touches `tabindex` — the caller owns tab-stop management.
	 * @default false
	 */
	hasRovingTabIndex?: boolean;

	/**
	 * When true, arrow keys are not stolen from a nested text input/textarea
	 * whose caret is not at the boundary in the direction of travel (or that has
	 * a non-collapsed selection), and are never stolen from a nested
	 * `contenteditable` (rich-text editor / chat composer). This preserves
	 * normal caret movement while the user is editing inline within the list
	 * (e.g. a toolbar search field or composer).
	 * @default false
	 */
	hasCaretGuard?: boolean;
}

/** Return type for useListFocus hook */
export interface UseListFocusReturn {
	/**
	 * Attach to the list container element with `{@attach list.attachList}`.
	 * Upstream's `listRef`.
	 */
	readonly attachList: Attachment<HTMLElement>;

	/** Key down handler to attach to the list container. */
	handleKeyDown: (event: KeyboardEvent) => void;

	/**
	 * Focus handler to attach to the container's `onfocusin`. Keeps the roving tab
	 * stop in sync when `hasRovingTabIndex` is enabled; a no-op otherwise, so it
	 * is always safe to attach.
	 */
	handleFocus: (event: FocusEvent) => void;

	/** Focus a specific item by index. */
	focusItem: (index: number) => void;

	/** Focus the first enabled item. Returns true when an item was focused. */
	focusFirst: () => boolean;

	/** Focus the last enabled item. Returns true when an item was focused. */
	focusLast: () => boolean;

	/**
	 * Whether a key event belongs to this list level (vs. a nested list that
	 * shares the same `boundarySelector`). Useful when a consumer wraps
	 * `handleKeyDown` with extra behavior (Enter/Space activation, typeahead)
	 * and must apply it only to events this level owns. Always true when no
	 * `boundarySelector` is configured.
	 */
	ownsEvent: (event: KeyboardEvent) => boolean;

	/**
	 * The current, in-DOM-order list of this level's focusable items (already
	 * scoped by `boundarySelector`). Exposed so consumers can build typeahead
	 * targets from the same source of truth as roving focus, rather than
	 * re-querying and re-filtering.
	 */
	getItems: () => HTMLElement[];
}

// Text-editing inputs whose caret must not be hijacked by arrow navigation.
const TEXT_INPUT_TYPES = new Set(['text', 'search', 'url', 'tel', 'email', 'password', 'number']);

/**
 * The nearest `contenteditable` root for `el`, or null when `el` is not inside
 * an editable region. Prefers the browser's `isContentEditable` property and
 * falls back to the closest `[contenteditable]` ancestor whose value is not
 * `"false"` (so environments without `isContentEditable` still work).
 */
function getContentEditableRoot(el: HTMLElement): HTMLElement | null {
	if (el.isContentEditable) {
		return el;
	}
	const candidate = el.closest<HTMLElement>('[contenteditable]');
	if (candidate && candidate.getAttribute('contenteditable') !== 'false') {
		return candidate;
	}
	return null;
}

/**
 * Whether an arrow/Home/End key should be left to the browser because the
 * event target is a text-editing element whose caret is not yet at the boundary
 * in the direction of travel (or a selection is present). Returns true when the
 * list should NOT steal the key.
 *
 * Covers three editing surfaces:
 * - `<textarea>` and text-type `<input>` — use `selectionStart`/`selectionEnd`
 *   to steal only at the boundary in the travel direction.
 * - `contenteditable` (rich-text editor / chat composer) — precise caret
 *   boundary detection in an arbitrary editable subtree is fragile, so we err
 *   on the side of never hijacking an active editor: defer on every caret key
 *   whenever focus is inside a non-empty contenteditable. (An empty editable
 *   has nothing to caret through, so navigation may proceed.)
 */
function shouldDeferToCaret(target: EventTarget | null, key: string): boolean {
	if (!(target instanceof HTMLElement)) {
		return false;
	}

	// contenteditable (covers an element with contenteditable="" / "true" and
	// descendants that inherit it). `isContentEditable` is the reliable property
	// in the browser; fall back to the nearest `contenteditable` ancestor for
	// environments that don't implement the property.
	const editableRoot = getContentEditableRoot(target);
	if (editableRoot) {
		const selection = typeof window !== 'undefined' ? window.getSelection() : null;
		// A non-collapsed selection means the user is selecting text — never steal.
		if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
			return true;
		}
		// Collapsed caret (or no selection API): defer whenever the editor has
		// content, so arrow keys stay with the active rich-text editor.
		return (editableRoot.textContent ?? '').length > 0;
	}

	const isTextarea = target.tagName === 'TEXTAREA';
	const isTextInput =
		target.tagName === 'INPUT' && TEXT_INPUT_TYPES.has((target as HTMLInputElement).type);
	if (!isTextarea && !isTextInput) {
		return false;
	}
	const input = target as HTMLInputElement | HTMLTextAreaElement;
	const { selectionStart, selectionEnd, value } = input;
	// A non-collapsed selection means the user is selecting text — never steal.
	if (selectionStart !== selectionEnd) {
		return true;
	}
	// number inputs report null selection; treat as "always defer" for caret keys.
	if (selectionStart == null) {
		return true;
	}
	if (key === 'ArrowLeft' || key === 'ArrowUp' || key === 'Home') {
		// Defer unless the caret is at the very start.
		return selectionStart > 0;
	}
	if (key === 'ArrowRight' || key === 'ArrowDown' || key === 'End') {
		// Defer unless the caret is at the very end.
		return selectionStart < value.length;
	}
	return false;
}

/**
 * Whether an item is disabled and therefore cannot receive DOM focus.
 * A `.focus()` call on such an element silently no-ops, so navigation must
 * skip these to avoid freezing on a disabled item (menus-4, navigation-5).
 */
function isItemDisabled(el: HTMLElement): boolean {
	return (
		el.getAttribute('aria-disabled') === 'true' ||
		(el as HTMLButtonElement).disabled === true ||
		el.hasAttribute('disabled')
	);
}

/**
 * Find the next enabled item index from `start`, moving by `step`, optionally
 * wrapping. Returns -1 when no enabled item exists in range. Skipping disabled
 * items here (rather than relying on the selector) keeps navigation from
 * stalling on an item whose `.focus()` silently no-ops.
 */
function findEnabledIndex(
	items: HTMLElement[],
	start: number,
	step: 1 | -1,
	shouldWrap: boolean
): number {
	const count = items.length;
	if (count === 0) {
		return -1;
	}
	let index = start;
	for (let i = 0; i < count; i++) {
		if (index < 0 || index >= count) {
			if (!shouldWrap) {
				return -1;
			}
			index = (index + count) % count;
		}
		const item = items[index];
		if (item && !isItemDisabled(item)) {
			return index;
		}
		index += step;
	}
	return -1;
}

/**
 * Set `tabindex` on an item, but only when it differs (avoids redundant DOM
 * writes, and is what keeps the repair MutationObserver from cascading). Uses
 * setAttribute so the value reflects even for elements (like `<button>`) whose
 * default tabIndex is already 0.
 */
function setTabIndex(el: HTMLElement, value: 0 | -1): void {
	if (el.getAttribute('tabindex') !== String(value)) {
		el.setAttribute('tabindex', String(value));
	}
}

/**
 * Hook for managing keyboard navigation within a linear list.
 *
 * Implements WAI-ARIA menu/listbox/toolbar pattern:
 * - ArrowDown/ArrowRight: Move to next item (wraps to first)
 * - ArrowUp/ArrowLeft: Move to previous item (wraps to last)
 * - Home: Move to first item
 * - End: Move to last item
 * - Escape: Custom callback (e.g., close menu)
 *
 * By default the hook only *moves* focus and leaves `tabindex` management to
 * the caller. Opt into {@link UseListFocusOptions.hasRovingTabIndex} for a hook
 * that owns a single tab stop (roving tabindex) across the items — stamping and
 * repairing it as items mount/unmount or toggle disabled — for toolbars,
 * segmented controls, tab strips, and similar composite widgets.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const list = useListFocus(() => ({ onEscape: () => layer.hide() }));
 * </script>
 *
 * <div {@attach list.attachList} role="menu" onkeydown={list.handleKeyDown}>
 *   {#each items as item}<div role="menuitem" tabindex={0}>{item}</div>{/each}
 * </div>
 * ```
 *
 * Roving-tabindex composite (e.g. a toolbar):
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const list = useListFocus(() => ({
 *     itemSelector: 'button, input, [tabindex]',
 *     orientation: 'horizontal',
 *     hasRovingTabIndex: true,
 *     hasCaretGuard: true
 *   }));
 * </script>
 *
 * <div
 *   {@attach list.attachList}
 *   role="toolbar"
 *   onkeydown={list.handleKeyDown}
 *   onfocusin={list.handleFocus}
 * >
 *   {@render children()}
 * </div>
 * ```
 */
export function useListFocus(options: () => UseListFocusOptions = () => ({})): UseListFocusReturn {
	// The one option read reactively: it decides whether the attachment installs
	// the tab-stop repair at all, so it is a `$derived` for the same reason
	// `useFocusTrap`'s `isActive` is — a derived notifies only when its *value*
	// changes, which is what a dependency list means.
	const hasRovingTabIndex = $derived(options().hasRovingTabIndex ?? false);

	let container: HTMLElement | null = null;

	/** Get all focusable items in the list. */
	function getItems(): HTMLElement[] {
		const listEl = container;
		if (!listEl) {
			return [];
		}
		const { itemSelector = '[role="menuitem"]', boundarySelector } = options();
		const matched = Array.from(listEl.querySelectorAll<HTMLElement>(itemSelector));
		// When a boundary is set, keep only items that belong to THIS list level —
		// i.e. whose nearest boundary ancestor is our own container. This excludes
		// items inside nested lists (e.g. inline submenu flyouts) that would
		// otherwise be swept in by querySelectorAll.
		if (!boundarySelector) {
			return matched;
		}
		return matched.filter((el) => el.closest(boundarySelector) === listEl);
	}

	/**
	 * Whether a key event belongs to this list level rather than a nested list.
	 * With a boundary set, an event that originated inside a nested boundary
	 * (e.g. a submenu flyout) has bubbled up to us and must be ignored so we
	 * don't double-handle navigation. Without a boundary, every event is ours.
	 */
	function ownsEvent(e: KeyboardEvent): boolean {
		const listEl = container;
		const { boundarySelector } = options();
		if (!listEl || !boundarySelector) {
			return true;
		}
		const target = e.target as HTMLElement | null;
		if (!target) {
			return true;
		}
		return target.closest(boundarySelector) === listEl;
	}

	/** Get the currently focused item index. */
	function getCurrentIndex(): number {
		const items = getItems();
		const active = document.activeElement;
		return items.findIndex((item) => item === active || item.contains(active));
	}

	// --- Roving tabindex ownership (opt-in via `hasRovingTabIndex`) -------------

	/**
	 * Stamp the roving tab stop: exactly one enabled item is tabbable (0), the
	 * rest are -1. Prefer keeping the currently-tabbable item if it is still
	 * enabled; otherwise promote the first enabled item (tab-stop repair).
	 */
	function syncTabStops(): void {
		const items = getItems();
		const enabled = items.filter((el) => !isItemDisabled(el));
		if (enabled.length === 0) {
			return;
		}
		const current = enabled.find((el) => el.getAttribute('tabindex') === '0');
		const tabbable = current ?? enabled[0];
		for (const el of items) {
			setTabIndex(el, el === tabbable ? 0 : -1);
		}
	}

	/**
	 * Upstream's `listRef`, plus the repair that upstream gets from a
	 * dependency-less layout effect. Reading `hasRovingTabIndex` is the
	 * attachment's only tracked read; the sync itself runs untracked so it does
	 * not subscribe to whatever the options getter happens to touch.
	 */
	const attachList: Attachment<HTMLElement> = (element) => {
		container = element;

		if (!hasRovingTabIndex) {
			return () => {
				container = null;
			};
		}

		untrack(syncTabStops);

		const observer = new MutationObserver(() => untrack(syncTabStops));
		observer.observe(element, { childList: true, subtree: true, attributes: true });

		return () => {
			observer.disconnect();
			container = null;
		};
	};

	/**
	 * Move focus to `items[index]`. When roving tabindex is enabled, also move
	 * the tab stop so `index` becomes the sole tabbable item.
	 */
	function focusIndex(items: HTMLElement[], index: number): void {
		const target = items[index];
		if (!target) {
			return;
		}
		if (hasRovingTabIndex) {
			for (const el of items) {
				setTabIndex(el, el === target ? 0 : -1);
			}
		}
		target.focus();
	}

	/** Focus an item by index, clamping to valid range. */
	function focusItem(index: number): void {
		const items = getItems();
		if (items.length === 0) {
			return;
		}
		const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
		focusIndex(items, clampedIndex);
	}

	/** Focus the first enabled item. Returns true when an item was focused. */
	function focusFirst(): boolean {
		const items = getItems();
		const index = findEnabledIndex(items, 0, 1, false);
		if (index !== -1) {
			focusIndex(items, index);
			return true;
		}
		return false;
	}

	/** Focus the last enabled item. Returns true when an item was focused. */
	function focusLast(): boolean {
		const items = getItems();
		const index = findEnabledIndex(items, items.length - 1, -1, false);
		if (index !== -1) {
			focusIndex(items, index);
			return true;
		}
		return false;
	}

	/**
	 * Keep the roving stop pointing at whatever ended up focused (e.g. a click
	 * or programmatic focus) so the next Tab behaves correctly. No-op unless
	 * roving tabindex is enabled.
	 */
	function handleFocus(): void {
		if (hasRovingTabIndex) {
			syncTabStops();
		}
	}

	/** Handle keyboard navigation. */
	function handleKeyDown(e: KeyboardEvent): void {
		const {
			wrap = true,
			onEscape,
			orientation = 'vertical',
			hasHomeEnd = true,
			isRtl,
			hasCaretGuard = false
		} = options();

		// Let browser/OS shortcut chords (Ctrl/Cmd/Alt + key) through untouched.
		if (e.ctrlKey || e.metaKey || e.altKey) {
			return;
		}

		// Ignore events that bubbled up from a nested list (e.g. a submenu
		// flyout, which renders inline inside this container). That level owns
		// and already handled them; re-handling here would move focus twice.
		if (!ownsEvent(e)) {
			return;
		}

		// Escape is handled regardless of orientation. Preserve the historical
		// behavior of always consuming Escape here (preventDefault) so consumers
		// that relied on it are unaffected.
		if (e.key === 'Escape') {
			e.preventDefault();
			onEscape?.();
			return;
		}

		const horizontal = orientation === 'horizontal' || orientation === 'both';
		const vertical = orientation === 'vertical' || orientation === 'both';

		// Resolve which keys advance vs retreat, honoring RTL for horizontal.
		// Direction is resolved lazily — `getComputedStyle` runs only when a
		// horizontal arrow key is actually pressed (SSR-safe, no layout thrash on
		// unrelated keys) — and an explicit `isRtl` always wins.
		const nextKeys: string[] = [];
		const prevKeys: string[] = [];
		if (horizontal) {
			const rtl =
				e.key === 'ArrowLeft' || e.key === 'ArrowRight'
					? (isRtl ?? isRtlElement(container))
					: false;
			nextKeys.push(rtl ? 'ArrowLeft' : 'ArrowRight');
			prevKeys.push(rtl ? 'ArrowRight' : 'ArrowLeft');
		}
		if (vertical) {
			nextKeys.push('ArrowDown');
			prevKeys.push('ArrowUp');
		}

		const isNext = nextKeys.includes(e.key);
		const isPrev = prevKeys.includes(e.key);
		const isHome = hasHomeEnd && e.key === 'Home';
		const isEnd = hasHomeEnd && e.key === 'End';

		if (!isNext && !isPrev && !isHome && !isEnd) {
			return;
		}

		// Never hijack a caret key from a nested text input mid-line. Check both
		// the event target and the actual focused element (events may bubble up
		// to the container).
		if (
			hasCaretGuard &&
			(shouldDeferToCaret(e.target, e.key) || shouldDeferToCaret(document.activeElement, e.key))
		) {
			return;
		}

		const currentIndex = getCurrentIndex();
		const items = getItems();

		if (isNext) {
			const from = currentIndex === -1 ? 0 : currentIndex + 1;
			const next = findEnabledIndex(items, from, 1, wrap);
			if (next !== -1) {
				focusIndex(items, next);
			}
		} else if (isPrev) {
			const from = currentIndex === -1 ? items.length - 1 : currentIndex - 1;
			const prev = findEnabledIndex(items, from, -1, wrap);
			if (prev !== -1) {
				focusIndex(items, prev);
			}
		} else if (isHome) {
			focusFirst();
		} else if (isEnd) {
			focusLast();
		}

		e.preventDefault();
	}

	return {
		attachList,
		handleKeyDown,
		handleFocus,
		focusItem,
		focusFirst,
		focusLast,
		ownsEvent,
		getItems
	};
}
