import { untrack } from 'svelte';
import { usePopover, type UsePopoverReturn } from '../popover/use-popover.svelte.js';
import type { SearchableItem } from '../typeahead/types.js';
import type { ChatComposerToken, ChatComposerTrigger } from './chat-composer-input.svelte';

/**
 * Trigger menus (`@` mentions, `/` commands) inside a contentEditable, ported
 * from Astryx's `Chat/useTriggerMenu.tsx`.
 *
 * Detects trigger characters typed inside the editable, opens a popover
 * anchored at the caret with filtered items, handles keyboard navigation, and
 * inserts tokens or text on selection. It reuses `SearchSource` from
 * `Typeahead` for sync/async search with `cancel()` support and a debounce.
 *
 * **`renderMenu()` is gone; `<TriggerMenuLayer>` replaces it.** A Svelte hook
 * cannot return markup, so the render half becomes a component and the hook
 * hands it what the closure captured — the `popover`, the live `state`, the id
 * helpers and `selectItem`. The same split `useLayer`→`<Layer>`,
 * `usePopover`→`<PopoverLayer>` and `useLightbox`→`<LightboxLayer>` took.
 * **Neither the hook nor the component is public**: upstream's `Chat/index.ts`
 * exports no `useTriggerMenu`, so the companion invents no API either — unlike
 * `ImperativeDialogLayer`, which had to be published because its hook is.
 *
 * Two other translations:
 *
 * - **The `id` is passed in.** Upstream calls `useId()` for the listbox and
 *   lets `usePopover` mint its own; this port's `useLayer` requires an
 *   SSR-stable id from the caller, so `ChatComposerInput` passes `$props.id()`
 *   and both ids derive from it.
 * - **`state` is one `$state` object, not React's `setState(prev => …)`.**
 *   Every upstream updater is a partial merge onto the previous value, which is
 *   what assigning individual fields of a `$state` object already is.
 */

export interface TriggerMenuState {
	isActive: boolean;
	activeTrigger: ChatComposerTrigger | null;
	query: string;
	items: SearchableItem[];
	highlightedIndex: number;
	isLoading: boolean;
}

export interface UseTriggerMenuOptions {
	/**
	 * SSR-stable id prefix. Upstream mints one with `useId`; see `useLayer` for
	 * why this port cannot.
	 */
	id: string;
	/** Trigger definitions. Read live — upstream lists it in a dependency array. */
	triggers?: () => ChatComposerTrigger[] | undefined;
	/** The contentEditable element. Upstream passes a `RefObject`. */
	editableRef: () => HTMLDivElement | null;
	onInsertToken: (token: ChatComposerToken) => void;
	onInsertText: (text: string) => void;
	onEmitChange: () => void;
	/**
	 * Debounce delay in ms before triggering search after typing.
	 * @default 150
	 */
	debounceMs?: number;
}

export interface UseTriggerMenuReturn {
	readonly state: TriggerMenuState;
	/** Call on every input event to check for trigger activation. */
	handleInput: () => void;
	/** Call on keydown — returns true if the event was consumed. */
	handleKeyDown: (e: KeyboardEvent) => boolean;
	/** Reset/close the trigger menu. */
	reset: () => void;
	/**
	 * ARIA props to spread onto the editable element. When triggers are
	 * configured the element becomes a `combobox` (the only role that permits
	 * `aria-expanded`/`aria-haspopup`/`aria-controls`/`aria-activedescendant`);
	 * otherwise it stays a plain `textbox` and no combobox attributes are
	 * emitted.
	 */
	readonly ariaProps: {
		role: 'combobox' | 'textbox';
		'aria-expanded'?: boolean;
		'aria-controls'?: string;
		'aria-activedescendant'?: string;
		'aria-haspopup'?: 'listbox';
	};
	/** The listbox element id — `<TriggerMenuLayer>` stamps it. */
	readonly listboxId: string;
	/** The popover driving the layer. */
	readonly popover: UsePopoverReturn;
	/** DOM id for the option at a flat index. */
	getItemId: (index: number) => string;
	/** Commit a selection — the layer's click handler. */
	selectItem: (item: SearchableItem) => void;
	/** Move the highlight — the layer's hover handler. */
	setHighlightedIndex: (index: number) => void;
}

// =============================================================================
// Helpers
// =============================================================================

function getTextBeforeCursor(editable: HTMLDivElement): string | null {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) {
		return null;
	}

	const range = selection.getRangeAt(0);
	if (!range.collapsed) {
		return null;
	}
	if (!editable.contains(range.startContainer)) {
		return null;
	}

	const node = range.startContainer;
	if (node.nodeType === Node.TEXT_NODE) {
		return (node.textContent ?? '').slice(0, range.startOffset);
	}

	return null;
}

function findActiveTrigger(
	textBeforeCursor: string,
	triggers: ChatComposerTrigger[]
): { trigger: ChatComposerTrigger; query: string; triggerStart: number } | null {
	for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
		const char = textBeforeCursor[i];

		if (char === ' ' || char === '\n') {
			return null;
		}

		for (const trigger of triggers) {
			if (char === trigger.character) {
				const prevChar = i > 0 ? textBeforeCursor[i - 1] : null;
				if (prevChar === null || prevChar === ' ' || prevChar === '\n') {
					const query = textBeforeCursor.slice(i + 1);
					return { trigger, query, triggerStart: i };
				}
			}
		}
	}

	return null;
}

function deleteTriggerText(editable: HTMLDivElement, triggerStart: number): void {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) {
		return;
	}

	const range = selection.getRangeAt(0);
	const node = range.startContainer;
	if (node.nodeType !== Node.TEXT_NODE) {
		return;
	}

	const text = node.textContent ?? '';
	const cursorOffset = range.startOffset;

	const before = text.slice(0, triggerStart);
	const after = text.slice(cursorOffset);
	node.textContent = before + after;

	const newRange = document.createRange();
	newRange.setStart(node, triggerStart);
	newRange.collapse(true);
	selection.removeAllRanges();
	selection.addRange(newRange);
}

// =============================================================================
// Hook
// =============================================================================

export function useTriggerMenu(options: UseTriggerMenuOptions): UseTriggerMenuReturn {
	const { id, triggers, editableRef, onInsertToken, onInsertText, onEmitChange } = options;

	const listboxId = `${id}-trigger-menu`;

	// Upstream holds all six fields in one `useState` object, and `handleInput`
	// compares `state.activeTrigger !== trigger` by *identity* against the caller's
	// own trigger object. A single `$state` object cannot reproduce that: `$state`
	// deep-proxies whatever is assigned into it, so `state.activeTrigger` would be
	// a proxy of `trigger` and never `===` it. The guard would always report "new
	// trigger", re-anchoring the open popover to the caret on every keystroke and
	// resetting the highlight mid-debounce. `$state.raw` stores the reference
	// as-is, which is also correct on the merits for both object-valued fields:
	// each is replaced wholesale, never mutated in place.
	let isActive = $state(false);
	let activeTrigger = $state.raw<ChatComposerTrigger | null>(null);
	let query = $state('');
	let items = $state.raw<SearchableItem[]>([]);
	let highlightedIndex = $state(0);
	let isLoading = $state(false);

	// Accessors over those runes. Reads stay reactive through the getters, and the
	// setters keep every `state.x = y` site — and the returned `TriggerMenuState`
	// shape consumers see — exactly as they were.
	const state: TriggerMenuState = {
		get isActive() {
			return isActive;
		},
		set isActive(value) {
			isActive = value;
		},
		get activeTrigger() {
			return activeTrigger;
		},
		set activeTrigger(value) {
			activeTrigger = value;
		},
		get query() {
			return query;
		},
		set query(value) {
			query = value;
		},
		get items() {
			return items;
		},
		set items(value) {
			items = value;
		},
		get highlightedIndex() {
			return highlightedIndex;
		},
		set highlightedIndex(value) {
			highlightedIndex = value;
		},
		get isLoading() {
			return isLoading;
		},
		set isLoading(value) {
			isLoading = value;
		}
	};

	let triggerStart = -1;
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let anchorSpan: HTMLSpanElement | null = null;
	// Upstream's `layer.ref` is a *ref callback*: calling it with a new element
	// strips this layer's anchor name off the previous one. An attachment puts
	// that in its cleanup instead, so an imperative caller has to hold the
	// cleanup and run it before re-attaching — which is what this is.
	let detachTrigger: (() => void) | null = null;

	function attachTriggerTo(element: HTMLElement): void {
		detachTrigger?.();
		detachTrigger = popover.attachTrigger(element) ?? null;
	}

	function removeAnchorSpan(): void {
		if (anchorSpan) {
			anchorSpan.remove();
			anchorSpan = null;
		}
	}

	const popover = usePopover(() => ({
		id: `${id}-trigger-popover`,
		onHide: () => {
			removeAnchorSpan();
			state.isActive = false;
			state.activeTrigger = null;
			state.query = '';
			state.items = [];
			state.highlightedIndex = 0;
			state.isLoading = false;
		},
		hasLightDismiss: true,
		hasCloseButton: false,
		hasAutoFocus: false,
		// The popup's own role="listbox" is the exposed semantics; focus stays in
		// the contenteditable composer, so a modal dialog wrapper is incorrect.
		role: 'none'
	}));

	// Cleanup on unmount
	$effect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
			removeAnchorSpan();
			detachTrigger?.();
		};
	});

	function reset(): void {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
			searchTimeout = null;
		}
		// Cancel any in-flight search on the active trigger's searchSource
		const trigger = state.activeTrigger;
		if (trigger?.searchSource) {
			trigger.searchSource.cancel?.();
		}
		removeAnchorSpan();
		popover.hide();
		triggerStart = -1;
	}

	// Anchor the popover to the cursor position (not the entire input). We
	// append a zero-size span to document.body positioned at the cursor rect —
	// outside the contentEditable to avoid splitting text nodes.
	function setAnchor(): void {
		const editable = editableRef();
		if (!editable) {
			return;
		}

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			attachTriggerTo(editable);
			return;
		}

		removeAnchorSpan();

		const range = selection.getRangeAt(0).cloneRange();
		range.collapse(true);

		// getBoundingClientRect is unavailable in some environments
		const rect =
			typeof range.getBoundingClientRect === 'function' ? range.getBoundingClientRect() : null;

		// Fall back to the editable when layout info is unavailable
		if (!rect || (rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.left === 0)) {
			attachTriggerTo(editable);
			return;
		}

		const span = document.createElement('span');
		span.setAttribute('aria-hidden', 'true');
		span.setAttribute('data-astryx-trigger-anchor', '');
		span.style.position = 'fixed';
		span.style.left = `${rect.left}px`;
		span.style.top = `${rect.top}px`;
		span.style.width = `${Math.max(rect.width, 1)}px`;
		span.style.height = `${rect.height}px`;
		span.style.pointerEvents = 'none';
		span.style.opacity = '0';
		document.body.appendChild(span);

		anchorSpan = span;
		attachTriggerTo(span);
	}

	function searchItems(trigger: ChatComposerTrigger, query: string): void {
		// Clear any pending debounce
		if (searchTimeout) {
			clearTimeout(searchTimeout);
			searchTimeout = null;
		}

		const doSearch = () => {
			if (trigger.searchSource) {
				// Use SearchSource — cancel previous, then search
				trigger.searchSource.cancel?.();
				state.isLoading = true;
				const result = trigger.searchSource.search(query);
				Promise.resolve(result).then(
					(items) => {
						state.items = items;
						state.highlightedIndex = items.length > 0 ? 0 : -1;
						state.isLoading = false;
					},
					() => {
						state.items = [];
						state.highlightedIndex = -1;
						state.isLoading = false;
					}
				);
			}
		};

		// Debounce async sources, immediate for sync. `debounceMs` is read here
		// rather than destructured at init: upstream lists it in `searchItems`'
		// dependency array, so a caller changing it takes effect on the next
		// search. The call site already passes it as a getter.
		const debounceMs = options.debounceMs ?? 150;

		if (trigger.searchSource) {
			// Check if search is likely sync (returns array, not promise)
			const testResult = trigger.searchSource.search('');
			const isAsync = testResult instanceof Promise;
			if (isAsync && debounceMs > 0) {
				state.isLoading = true;
				searchTimeout = setTimeout(doSearch, debounceMs);
			} else {
				doSearch();
			}
		}
	}

	function selectItem(item: SearchableItem): void {
		const trigger = state.activeTrigger;
		if (!trigger) {
			return;
		}

		const editable = editableRef();
		if (!editable) {
			return;
		}

		// Clean up anchor span before modifying DOM — if the span were inside the
		// editable it would split text nodes and break offsets. With the
		// body-appended approach this is just bookkeeping.
		removeAnchorSpan();

		deleteTriggerText(editable, triggerStart);

		const result = trigger.onSelect(item);
		if (typeof result === 'string') {
			onInsertText(result);
		} else {
			onInsertToken(result);
		}

		onEmitChange();
		reset();
	}

	function handleInput(): void {
		const list = triggers?.();
		if (!list || list.length === 0) {
			return;
		}

		const editable = editableRef();
		if (!editable) {
			return;
		}

		const textBefore = getTextBeforeCursor(editable);
		if (textBefore === null) {
			if (state.isActive) {
				reset();
			}
			return;
		}

		const found = findActiveTrigger(textBefore, list);
		if (!found) {
			if (state.isActive) {
				reset();
			}
			return;
		}

		const { trigger, query } = found;

		if (!state.isActive || state.activeTrigger !== trigger) {
			triggerStart = found.triggerStart;
			state.isActive = true;
			state.activeTrigger = trigger;
			state.query = query;
			state.highlightedIndex = 0;
			setAnchor();
			searchItems(trigger, query);
			popover.show();
		} else if (state.query !== query) {
			state.query = query;
			searchItems(trigger, query);
		}
	}

	function handleKeyDown(e: KeyboardEvent): boolean {
		if (!state.isActive || !popover.isOpen) {
			return false;
		}

		switch (e.key) {
			case 'ArrowDown': {
				e.preventDefault();
				state.highlightedIndex =
					state.highlightedIndex < state.items.length - 1 ? state.highlightedIndex + 1 : 0;
				return true;
			}
			case 'ArrowUp': {
				e.preventDefault();
				state.highlightedIndex =
					state.highlightedIndex > 0 ? state.highlightedIndex - 1 : state.items.length - 1;
				return true;
			}
			case 'Enter':
			case 'Tab': {
				if (state.highlightedIndex >= 0 && state.highlightedIndex < state.items.length) {
					e.preventDefault();
					selectItem(state.items[state.highlightedIndex]);
					return true;
				}
				return false;
			}
			case 'Escape': {
				e.preventDefault();
				reset();
				return true;
			}
			default:
				return false;
		}
	}

	function getItemId(index: number): string {
		return `${listboxId}-option-${index}`;
	}

	function setHighlightedIndex(index: number): void {
		state.highlightedIndex = index;
	}

	// Scroll highlighted item into view on keyboard navigation. `getItemId` is
	// untracked because it reads nothing reactive — the effect's dependencies
	// are the two state reads above it, as upstream's dependency array is.
	$effect(() => {
		if (!popover.isOpen || state.highlightedIndex < 0) {
			return;
		}
		const index = state.highlightedIndex;
		const el = document.getElementById(untrack(() => getItemId(index)));
		el?.scrollIntoView({ block: 'nearest' });
	});

	// ARIA props for the editable element. Combobox attributes
	// (aria-expanded/haspopup/controls/activedescendant) are only valid on
	// role="combobox", so we only switch to that role — and only emit those
	// attributes — when triggers are actually configured. With no triggers the
	// element stays a plain role="textbox".
	const ariaProps = $derived.by((): UseTriggerMenuReturn['ariaProps'] => {
		const hasTriggers = (triggers?.()?.length ?? 0) > 0;
		if (!hasTriggers) {
			return { role: 'textbox' };
		}
		if (state.isActive && popover.isOpen) {
			return {
				role: 'combobox',
				'aria-expanded': true,
				'aria-controls': listboxId,
				'aria-activedescendant':
					state.highlightedIndex >= 0 ? getItemId(state.highlightedIndex) : undefined,
				'aria-haspopup': 'listbox'
			};
		}
		return {
			role: 'combobox',
			'aria-expanded': false,
			'aria-haspopup': 'listbox'
		};
	});

	return {
		state,
		handleInput,
		handleKeyDown,
		reset,
		get ariaProps() {
			return ariaProps;
		},
		listboxId,
		popover,
		getItemId,
		selectItem,
		setHighlightedIndex
	};
}
