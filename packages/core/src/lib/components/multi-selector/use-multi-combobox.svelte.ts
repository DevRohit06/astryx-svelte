import type { MultiSelectorOptionData } from './types.js';

/**
 * Ported from Astryx's `MultiSelector/hooks.ts`.
 *
 * A pure keyboard state machine, so the translation is the mechanical one
 * `useCombobox` already took: `useState` → `$state`, the typeahead timer ref → a
 * plain `let` (nothing reads it reactively), and every `useCallback` dependency
 * array → a read through the options getter at call time. `React.KeyboardEvent`
 * becomes the native `KeyboardEvent`; the four members the switch touches
 * (`key`, `ctrlKey`, `metaKey`, `preventDefault()`) are the same on both.
 *
 * The one behavioural difference from `useCombobox` is upstream's: toggling does
 * **not** close the popup, and there is no `value` to seed the highlight from —
 * opening always highlights index 0.
 */

/**
 * Options for `useMultiCombobox`. Module-private, as upstream declares it — its
 * `MultiSelector/index.ts` publishes the hook *function* and neither type, the
 * same standing `useCombobox`'s pair has.
 */
interface UseMultiComboboxOptions {
	/**
	 * The flattened list the keyboard model walks, in the same order as the
	 * rendered DOM — including the select-all sentinel when it is present.
	 */
	selectableItems: MultiSelectorOptionData[];
	/** @default false */
	isDisabled?: boolean;
	/** Whether the popup is open. */
	isOpen: boolean;
	/**
	 * Whether a search input owns text entry. Turns off type-to-select and the
	 * Space-toggles shortcut, both of which would eat characters.
	 * @default false
	 */
	hasSearch?: boolean;
	/** Open the popup. */
	onOpen: () => void;
	/** Close the popup. */
	onClose: () => void;
	/** Toggle the item at the highlighted index. */
	onToggle: (itemValue: string) => void;
	/**
	 * Clear all selected values. When provided, pressing Delete or Backspace on
	 * the closed trigger clears the selection — a keyboard equivalent of the
	 * clear button (comboboxes-2). No-op when the popup is open or search is on.
	 */
	onClear?: () => void;
	/**
	 * Whether at least one value is selected (i.e. there is something to clear).
	 * The Delete/Backspace clear path is skipped when false.
	 * @default false
	 */
	hasValue?: boolean;
	/** The listbox's id — item ids are derived from it. */
	listboxId: string;
}

/** Return value of `useMultiCombobox`. Module-private, and named as upstream names it. */
interface UseMultiComboboxResult {
	/** Index of the virtually focused option, or `-1`. */
	readonly highlightedIndex: number;
	/** Move the virtual cursor. */
	setHighlightedIndex: (index: number) => void;
	/** The DOM id of the option at `index` — the `aria-activedescendant` target. */
	getItemId: (index: number) => string;
	/** Click handler for the trigger. */
	onTriggerClick: () => void;
	/** Keydown handler for the trigger (and, filtered, for the search input). */
	onKeyDown: (e: KeyboardEvent) => void;
	/** Move the highlight to a hovered option. */
	onItemMouseEnter: (item: MultiSelectorOptionData, index: number) => void;
}

/**
 * Handles keyboard navigation and toggle logic for a multi-select combobox.
 * Works like `useCombobox` (index-based) but toggling does NOT close the popup.
 *
 * The caller must ensure `selectableItems` is in the same order as the rendered
 * DOM.
 */
export function useMultiCombobox(options: () => UseMultiComboboxOptions): UseMultiComboboxResult {
	let highlightedIndex = $state(-1);
	let typeahead = $state('');
	let typeaheadTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

	function getItemId(index: number): string {
		return `${options().listboxId}-item-${index}`;
	}

	function getEnabledIndices(): number[] {
		return options()
			.selectableItems.map((item, i) => (!item.disabled ? i : -1))
			.filter((i) => i >= 0);
	}

	function closeAndReset(): void {
		highlightedIndex = -1;
		options().onClose();
	}

	function onTriggerClick(): void {
		const o = options();
		if (o.isDisabled ?? false) {
			return;
		}
		if (o.isOpen) {
			closeAndReset();
		} else {
			o.onOpen();
			if (!(o.hasSearch ?? false)) {
				highlightedIndex = 0;
			}
		}
	}

	function onItemMouseEnter(item: MultiSelectorOptionData, index: number): void {
		if (!item.disabled) {
			highlightedIndex = index;
		}
	}

	function onKeyDown(e: KeyboardEvent): void {
		const o = options();
		const hasSearch = o.hasSearch ?? false;
		const isOpen = o.isOpen;
		const selectableItems = o.selectableItems;

		if (o.isDisabled ?? false) {
			return;
		}

		const enabledIndices = getEnabledIndices();

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				if (!isOpen) {
					o.onOpen();
					highlightedIndex = 0;
				} else {
					const currentEnabledPos = enabledIndices.indexOf(highlightedIndex);
					const nextPos = Math.min(currentEnabledPos + 1, enabledIndices.length - 1);
					highlightedIndex = enabledIndices[nextPos] ?? highlightedIndex;
				}
				break;

			case 'ArrowUp':
				e.preventDefault();
				if (!isOpen) {
					o.onOpen();
					highlightedIndex = selectableItems.length - 1;
				} else {
					const currentEnabledPos = enabledIndices.indexOf(highlightedIndex);
					const prevPos = Math.max(currentEnabledPos - 1, 0);
					highlightedIndex = enabledIndices[prevPos] ?? highlightedIndex;
				}
				break;

			case ' ':
				// Don't intercept Space when the search input is focused.
				if (hasSearch) {
					break;
				}
			// falls through
			case 'Enter':
				e.preventDefault();
				if (isOpen && highlightedIndex >= 0) {
					const item = selectableItems[highlightedIndex];
					if (item && !item.disabled) {
						o.onToggle(item.value);
					}
				} else if (!isOpen) {
					o.onOpen();
					if (!hasSearch) {
						highlightedIndex = 0;
					}
				}
				break;

			case 'Tab':
				if (isOpen) {
					closeAndReset();
				}
				break;

			case 'Escape':
				if (isOpen) {
					e.preventDefault();
					closeAndReset();
				}
				break;

			case 'Home':
				e.preventDefault();
				if (isOpen && enabledIndices.length > 0) {
					highlightedIndex = enabledIndices[0];
				}
				break;

			case 'End':
				e.preventDefault();
				if (isOpen && enabledIndices.length > 0) {
					highlightedIndex = enabledIndices[enabledIndices.length - 1];
				}
				break;

			// PageUp/PageDown mirror Home/End. In search mode Home/End stay on the
			// input for caret movement (APG editable combobox), so these are the
			// sanctioned substitute for jumping to the first/last option.
			case 'PageUp':
				e.preventDefault();
				if (isOpen && enabledIndices.length > 0) {
					highlightedIndex = enabledIndices[0];
				}
				break;

			case 'PageDown':
				e.preventDefault();
				if (isOpen && enabledIndices.length > 0) {
					highlightedIndex = enabledIndices[enabledIndices.length - 1];
				}
				break;

			case 'Delete':
			case 'Backspace':
				// Keyboard equivalent of the clear button (comboboxes-2): clear all
				// selected values from the closed trigger so clearing is not
				// mouse-only. Skipped in search mode (the keys edit the query) and
				// while the popup is open (arrow navigation owns interaction).
				if (!hasSearch && !isOpen && o.onClear != null && (o.hasValue ?? false)) {
					e.preventDefault();
					o.onClear();
				}
				break;

			default:
				// Typeahead only when search is not present
				if (!hasSearch && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
					const newTypeahead = typeahead + e.key.toLowerCase();
					typeahead = newTypeahead;

					if (typeaheadTimeout) {
						clearTimeout(typeaheadTimeout);
					}
					typeaheadTimeout = setTimeout(() => {
						typeahead = '';
					}, 500);

					const matchIndex = selectableItems.findIndex(
						(item) => !item.disabled && item.label?.toLowerCase().startsWith(newTypeahead)
					);
					if (matchIndex >= 0) {
						if (!isOpen) {
							o.onOpen();
						}
						highlightedIndex = matchIndex;
					}
				}
				break;
		}
	}

	return {
		get highlightedIndex() {
			return highlightedIndex;
		},
		setHighlightedIndex: (index: number) => {
			highlightedIndex = index;
		},
		getItemId,
		onTriggerClick,
		onKeyDown,
		onItemMouseEnter
	};
}
