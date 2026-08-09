import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { isRtlElement } from './is-rtl-element.js';

/**
 * The WAI-ARIA tree keyboard model, ported from Astryx's `hooks/useTreeFocus.ts`.
 *
 * A tree is not a linear list, which is why it gets its own hook for the same
 * reason 2D grids get `useGridFocus`: ArrowUp/ArrowDown/Home/End roam linearly
 * over the *visible* treeitems, but ArrowLeft/ArrowRight carry tree semantics —
 * expand, collapse, descend to the first child, ascend to the parent. The hook
 * stays generic by reading the tree out of the DOM (`aria-level`,
 * `aria-expanded`, `data-tree-id`) with every reader overridable, and by taking
 * callbacks for the two things only the consumer can do: toggling expansion and
 * activating an item.
 *
 * The translations are the ones {@link import('./use-list-focus.svelte.js')}
 * documents: the ref becomes an attachment, the options come in as a getter read
 * at event time, and upstream's dependency-less layout effect — which repairs
 * the roving tab stop after every commit — becomes a `MutationObserver`, since
 * the treeitems belong to the consumer's template and nothing the hook can read
 * reports that a subtree expanded.
 *
 * The typeahead buffer stays a pair of module-local variables, as upstream's
 * `useRef` is: it is never rendered, so it is never reactive. That is the same
 * call `useTypeahead` makes.
 *
 * Horizontal arrows follow *visual* direction: under `dir="rtl"` ArrowLeft
 * descends (expand → first child) and ArrowRight ascends (parent → collapse).
 * Direction is auto-detected from the container via `isRtlElement`, read lazily
 * on keydown and only for the two horizontal arrows, exactly as `useListFocus`
 * and `useGridFocus` do it. There is no `isRtl` option to override it.
 */

/** Keys handled by the tree keyboard model (used to gate typeahead). */
const NAVIGATION_KEYS = new Set([
	'ArrowDown',
	'ArrowUp',
	'ArrowRight',
	'ArrowLeft',
	'Home',
	'End',
	'Enter',
	' '
]);

/** Default reset delay for the typeahead buffer. */
const DEFAULT_TYPEAHEAD_RESET_MS = 500;

/**
 * Configuration for tree focus behavior.
 *
 * The tree keyboard model differs from a linear list (useListFocus): while
 * ArrowUp/ArrowDown/Home/End roam linearly over the *visible* treeitems,
 * ArrowRight/ArrowLeft carry tree semantics (expand/collapse, move to
 * first-child / parent). The hook stays generic by taking callbacks for the
 * tree-specific bits (expansion toggling, activation) — mirroring how
 * useGridFocus takes `isCellFocusable` rather than hardcoding disabled logic.
 */
export interface UseTreeFocusOptions {
	/**
	 * Selector for treeitems within the tree. Matches ALL visible treeitems in
	 * DOM order (collapsed subtrees are not rendered, so they are naturally
	 * excluded). Disabled treeitems are still matched and then skipped via
	 * {@link UseTreeFocusOptions.isItemDisabled}.
	 * @default '[role="treeitem"]'
	 */
	itemSelector?: string;

	/**
	 * Predicate determining whether a treeitem matched by `itemSelector` is
	 * disabled and must be skipped during arrow/Home/End navigation. A `.focus()`
	 * on a disabled item silently no-ops, so navigation would otherwise stall.
	 *
	 * @default reads `data-tree-disabled` (present ⇒ disabled)
	 */
	isItemDisabled?: (item: HTMLElement) => boolean;

	/**
	 * Reads the nesting level (aria-level style, 1-based) of a treeitem. Used to
	 * resolve first-child (ArrowRight) and parent (ArrowLeft) targets from the
	 * flat visible-item list.
	 *
	 * @default reads the `aria-level` attribute (falling back to `1`)
	 */
	getLevel?: (item: HTMLElement) => number;

	/**
	 * Whether a treeitem is an expanded parent. Read DOM-side (aria-expanded)
	 * by default so it reflects the rendered tree without prop plumbing.
	 *
	 * @default `aria-expanded === 'true'`
	 */
	isExpanded?: (item: HTMLElement) => boolean;

	/**
	 * Whether a treeitem is a collapsed parent (has children but is closed).
	 *
	 * @default `aria-expanded === 'false'`
	 */
	isCollapsed?: (item: HTMLElement) => boolean;

	/**
	 * Resolve the stable id for a treeitem, passed to `onToggleExpand` /
	 * `onActivate`. Returns `undefined` when the element carries no id.
	 *
	 * @default reads the `data-tree-id` attribute
	 */
	getItemId?: (item: HTMLElement) => string | undefined;

	/**
	 * Called to expand/collapse the treeitem with the given id (ArrowRight on a
	 * collapsed parent, ArrowLeft on an expanded parent, and Enter/Space on a
	 * parent that has no inner action).
	 */
	onToggleExpand?: (id: string) => void;

	/**
	 * Called when Enter/Space activates a treeitem. Return `true` if the
	 * activation was handled (e.g. an inner link/button was clicked); return
	 * `false`/`undefined` to let the hook fall back to toggling expansion for a
	 * parent. When omitted, the hook falls straight through to expansion
	 * toggling for parents.
	 *
	 * @param item The focused treeitem element.
	 * @param id The treeitem's id (per `getItemId`), if any.
	 */
	onActivate?: (item: HTMLElement, id: string | undefined) => boolean | undefined;

	/**
	 * Whether typeahead (jump to next item whose text starts with the typed
	 * characters) is enabled.
	 * @default true
	 */
	typeahead?: boolean;

	/** Reset delay for the typeahead buffer, in ms. @default 500 */
	typeaheadResetMs?: number;

	/**
	 * Notified whenever the hook moves focus to a treeitem, with its id (if any).
	 * TreeList uses this to move its single roving tab stop.
	 */
	onActiveChange?: (id: string | undefined) => void;

	/**
	 * Roving-tabindex ownership. When true, the hook manages a single tab stop
	 * across the visible treeitems: exactly one enabled treeitem carries
	 * `tabindex="0"` and the rest `tabindex="-1"`. The tab stop is repaired on
	 * mount and whenever items mount/unmount or toggle disabled, and moves with
	 * keyboard navigation. Attach the returned {@link UseTreeFocusReturn.handleFocus}
	 * to the container's `onfocusin` to keep the stop in sync after clicks or
	 * programmatic focus.
	 *
	 * On mount the hook preserves an existing `tabindex="0"` treeitem (so a
	 * consumer can seed the active item in its render); if none exists it
	 * promotes the first enabled treeitem.
	 *
	 * When false (the default), the hook only *moves* focus (`.focus()`) and
	 * never touches `tabindex` — the caller owns tab-stop management.
	 * @default false
	 */
	hasRovingTabIndex?: boolean;
}

/** Return type for useTreeFocus hook. */
export interface UseTreeFocusReturn {
	/**
	 * Attach to the tree container element (`role="tree"`) with
	 * `{@attach tree.attachTree}`. Upstream's `treeRef`.
	 */
	readonly attachTree: Attachment<HTMLElement>;

	/** Key down handler to attach to the tree container. */
	handleKeyDown: (event: KeyboardEvent) => void;

	/**
	 * Focus handler to attach to the container's `onfocusin`. Keeps the roving tab
	 * stop in sync when `hasRovingTabIndex` is enabled; a no-op otherwise, so it
	 * is always safe to attach.
	 */
	handleFocus: (event: FocusEvent) => void;

	/** Focus the first enabled visible treeitem. */
	focusFirst: () => void;

	/** Focus the last enabled visible treeitem. */
	focusLast: () => void;
}

/**
 * Set `tabindex` on a treeitem, but only when it differs (avoids redundant DOM
 * writes, and is what keeps the repair MutationObserver from cascading).
 */
function setTabIndex(el: HTMLElement, value: 0 | -1): void {
	if (el.getAttribute('tabindex') !== String(value)) {
		el.setAttribute('tabindex', String(value));
	}
}

/**
 * Hook for managing roving-tabindex focus + the WAI-ARIA tree keyboard model.
 *
 * - ArrowDown / ArrowUp: move to next/previous visible treeitem (skip disabled)
 * - ArrowRight: collapsed parent → expand; expanded parent → first child;
 *   leaf → no-op
 * - ArrowLeft: expanded parent → collapse; otherwise → move to parent treeitem
 * - Home / End: first / last visible treeitem
 * - Enter / Space: activate (`onActivate`), falling back to expansion toggle
 * - Printable characters: typeahead to the next matching treeitem
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const tree = useTreeFocus(() => ({
 *     onToggleExpand: (id) => toggle(id),
 *     hasRovingTabIndex: true
 *   }));
 * </script>
 *
 * <ul
 *   {@attach tree.attachTree}
 *   role="tree"
 *   onkeydown={tree.handleKeyDown}
 *   onfocusin={tree.handleFocus}
 * >
 *   {#each items as item}
 *     <li role="treeitem" tabindex={-1}>{item.label}</li>
 *   {/each}
 * </ul>
 * ```
 */
export function useTreeFocus(options: () => UseTreeFocusOptions = () => ({})): UseTreeFocusReturn {
	// The one option read reactively: it decides whether the attachment installs
	// the tab-stop repair at all.
	const hasRovingTabIndex = $derived(options().hasRovingTabIndex ?? false);

	let container: HTMLElement | null = null;

	// Upstream's `typeaheadRef` — mutable, never rendered, so never reactive.
	let typeaheadBuffer = '';
	let typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

	/** Visible treeitems in DOM order (collapsed subtrees are not rendered). */
	function getItems(): HTMLElement[] {
		if (container == null) {
			return [];
		}
		const { itemSelector = '[role="treeitem"]' } = options();
		return Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
	}

	function itemDisabled(el: HTMLElement): boolean {
		const { isItemDisabled } = options();
		return isItemDisabled
			? isItemDisabled(el)
			: el.dataset.treeDisabled != null || el.getAttribute('aria-disabled') === 'true';
	}

	function levelOf(el: HTMLElement): number {
		const { getLevel } = options();
		return getLevel ? getLevel(el) : Number(el.getAttribute('aria-level') ?? '1');
	}

	function expandedOf(el: HTMLElement): boolean {
		const { isExpanded } = options();
		return isExpanded ? isExpanded(el) : el.getAttribute('aria-expanded') === 'true';
	}

	function collapsedOf(el: HTMLElement): boolean {
		const { isCollapsed } = options();
		return isCollapsed ? isCollapsed(el) : el.getAttribute('aria-expanded') === 'false';
	}

	function idOf(el: HTMLElement): string | undefined {
		const { getItemId } = options();
		return getItemId ? getItemId(el) : el.dataset.treeId;
	}

	// --- Roving tabindex ownership (opt-in via `hasRovingTabIndex`) -------------

	/**
	 * Make `target` the sole tabbable treeitem: 0 on it, -1 on every other
	 * visible treeitem.
	 */
	function moveTabStop(items: HTMLElement[], target: HTMLElement): void {
		for (const el of items) {
			setTabIndex(el, el === target ? 0 : -1);
		}
	}

	/**
	 * Repair the roving tab stop: exactly one enabled treeitem is tabbable (0),
	 * the rest are -1. Prefer an existing `tabindex="0"` treeitem (so a consumer
	 * can seed the active item in its render); otherwise promote the first
	 * enabled treeitem.
	 */
	function syncTabStops(): void {
		const items = getItems();
		const enabled = items.filter((el) => !itemDisabled(el));
		if (enabled.length === 0) {
			return;
		}
		const current = enabled.find((el) => el.getAttribute('tabindex') === '0');
		moveTabStop(items, current ?? enabled[0]);
	}

	/**
	 * Upstream's `treeRef`, plus the repair that upstream gets from a
	 * dependency-less layout effect.
	 */
	const attachTree: Attachment<HTMLElement> = (element) => {
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

	/** Move focus to a treeitem and notify the active-change listener. */
	function focusItem(el: HTMLElement | undefined): void {
		if (el == null) {
			return;
		}
		if (hasRovingTabIndex) {
			moveTabStop(getItems(), el);
		}
		options().onActiveChange?.(idOf(el));
		el.focus();
	}

	/**
	 * Focus the first enabled treeitem from `start`, moving by `dir`. No wrap —
	 * a tree's linear roam clamps at the ends.
	 */
	function focusEnabledFrom(items: HTMLElement[], start: number, dir: 1 | -1): void {
		for (let i = start; i >= 0 && i < items.length; i += dir) {
			const candidate = items[i];
			if (candidate != null && !itemDisabled(candidate)) {
				focusItem(candidate);
				return;
			}
		}
	}

	function focusFirst(): void {
		focusEnabledFrom(getItems(), 0, 1);
	}

	function focusLast(): void {
		const items = getItems();
		focusEnabledFrom(items, items.length - 1, -1);
	}

	function runTypeahead(e: KeyboardEvent, items: HTMLElement[], currentIndex: number): void {
		const { typeaheadResetMs = DEFAULT_TYPEAHEAD_RESET_MS } = options();

		if (typeaheadTimer != null) {
			clearTimeout(typeaheadTimer);
		}
		typeaheadBuffer += e.key.toLowerCase();
		typeaheadTimer = setTimeout(() => {
			typeaheadBuffer = '';
		}, typeaheadResetMs);

		const query = typeaheadBuffer;
		const start = currentIndex < 0 ? 0 : currentIndex;
		const ordered = [...items.slice(start + 1), ...items.slice(0, start + 1)];
		const match = ordered.find(
			(item) =>
				!itemDisabled(item) && (item.textContent ?? '').trim().toLowerCase().startsWith(query)
		);
		if (match != null) {
			e.preventDefault();
			focusItem(match);
		}
	}

	function handleKeyDown(e: KeyboardEvent): void {
		const { typeahead = true, onToggleExpand, onActivate } = options();

		const items = getItems();
		if (items.length === 0) {
			return;
		}

		const active = document.activeElement;
		// Resolve the treeitem that owns focus: the nearest treeitem ancestor of
		// the active element (never an outer treeitem that merely contains it).
		const activeItem = active instanceof Element ? active.closest('[role="treeitem"]') : null;
		const currentIndex = items.findIndex((item) => item === activeItem);
		const current = currentIndex >= 0 ? items[currentIndex] : undefined;

		// Typeahead: printable single characters jump to the next matching item.
		if (
			typeahead &&
			e.key.length === 1 &&
			!e.ctrlKey &&
			!e.metaKey &&
			!e.altKey &&
			NAVIGATION_KEYS.has(e.key) === false
		) {
			runTypeahead(e, items, currentIndex);
			return;
		}

		if (!NAVIGATION_KEYS.has(e.key)) {
			return;
		}

		// Under RTL, swap the horizontal arrows to a logical key so the
		// expand/collapse case bodies (written LTR-first) stay unchanged.
		// Resolved lazily — `isRtlElement` runs `getComputedStyle`, so it is
		// reached only when a horizontal arrow is actually pressed, never on
		// ArrowUp/Down/Home/End/Enter/typeahead. Same shape `useListFocus` and
		// `useGridFocus` already use.
		let key = e.key;
		if (key === 'ArrowLeft' || key === 'ArrowRight') {
			const rtl = isRtlElement(container);
			if (rtl) {
				key = key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
			}
		}

		switch (key) {
			case 'ArrowDown': {
				e.preventDefault();
				focusEnabledFrom(items, currentIndex < 0 ? 0 : currentIndex + 1, 1);
				break;
			}
			case 'ArrowUp': {
				e.preventDefault();
				focusEnabledFrom(items, currentIndex < 0 ? items.length - 1 : currentIndex - 1, -1);
				break;
			}
			case 'ArrowRight': {
				if (current == null) {
					break;
				}
				e.preventDefault();
				if (collapsedOf(current)) {
					// Collapsed parent → expand.
					const id = idOf(current);
					if (id != null) {
						onToggleExpand?.(id);
					}
				} else if (expandedOf(current)) {
					// Expanded parent → move to first child.
					const next = items[currentIndex + 1];
					if (next != null && levelOf(next) > levelOf(current)) {
						focusItem(next);
					}
				}
				// Leaf → no-op.
				break;
			}
			case 'ArrowLeft': {
				if (current == null) {
					break;
				}
				e.preventDefault();
				if (expandedOf(current)) {
					// Expanded parent → collapse.
					const id = idOf(current);
					if (id != null) {
						onToggleExpand?.(id);
					}
				} else {
					// Otherwise → move to parent treeitem (nearest shallower item
					// scanning upward in visible order).
					const currentLevel = levelOf(current);
					for (let i = currentIndex - 1; i >= 0; i--) {
						const candidate = items[i];
						if (candidate != null && levelOf(candidate) < currentLevel) {
							focusItem(candidate);
							break;
						}
					}
				}
				break;
			}
			case 'Home': {
				e.preventDefault();
				focusEnabledFrom(items, 0, 1);
				break;
			}
			case 'End': {
				e.preventDefault();
				focusEnabledFrom(items, items.length - 1, -1);
				break;
			}
			case 'Enter':
			case ' ': {
				if (current == null || itemDisabled(current)) {
					break;
				}
				e.preventDefault();
				const id = idOf(current);
				// Activate the item: prefer the consumer's onActivate (e.g. click an
				// inner link/button). Fall back to toggling expansion for a parent
				// without its own action.
				const handled = onActivate ? onActivate(current, id) === true : false;
				if (!handled && current.getAttribute('aria-expanded') != null) {
					if (id != null) {
						onToggleExpand?.(id);
					}
				}
				break;
			}
			default:
				break;
		}
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

	return {
		attachTree,
		handleKeyDown,
		handleFocus,
		focusFirst,
		focusLast
	};
}
