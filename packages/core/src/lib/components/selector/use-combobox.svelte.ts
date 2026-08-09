import type { SelectorOptionData } from './types.js';

/**
 * Ported from the second half of Astryx's `Selector/hooks.ts`.
 *
 * A pure keyboard/selection state machine, so the translation is mechanical:
 * `useState` → `$state`, the typeahead timer ref → a plain `let` (nothing reads
 * it reactively), and every `useCallback` dependency array → a read through the
 * options getter at call time. The returned handlers are plain functions, which
 * is what upstream's memoised identities amount to once there is no reconciler
 * to keep them stable for.
 *
 * `React.KeyboardEvent` becomes the native `KeyboardEvent`; the three properties
 * the switch reads (`key`, `ctrlKey`, `metaKey`) and `preventDefault()` are the
 * same on both.
 */

/**
 * Options for `useCombobox`. Module-private, as upstream declares it — its
 * `Selector/index.ts` publishes the two hook *functions* and neither type.
 */
interface UseComboboxOptions {
	/** The flattened, filtered list the keyboard model walks. */
	selectableItems: SelectorOptionData[];
	/** The currently selected value, if any. */
	value?: string;
	/** @default false */
	isDisabled?: boolean;
	/** Whether the popup is open. */
	isOpen: boolean;
	/**
	 * Whether a search input owns text entry. Turns off type-to-select and the
	 * Space-selects shortcut, both of which would eat characters.
	 * @default false
	 */
	hasSearch?: boolean;
	/** Open the popup. */
	onOpen: () => void;
	/** Close the popup. */
	onClose: () => void;
	/** Commit a selection. */
	onSelect?: (value: string) => void;
	/**
	 * Clear the current value. When provided, pressing Delete or Backspace on the
	 * closed trigger clears the selection — a keyboard equivalent of the clear
	 * button, so clearing is not mouse-only. No-op when the popup is open (arrow
	 * navigation owns those keys there) or when there is no value.
	 */
	onClear?: () => void;
	/** The listbox's id — item ids are derived from it. */
	listboxId: string;
}

/** Return value of `useCombobox`. Module-private, and named as upstream names it. */
interface UseComboboxResult {
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
	/** Select an option, honouring its disabled state. */
	onItemSelect: (item: SelectorOptionData) => void;
	/** Move the highlight to a hovered option. */
	onItemMouseEnter: (item: SelectorOptionData, index: number) => void;
}

/**
 * Handles keyboard navigation, typeahead search, and selection for
 * combobox/listbox patterns.
 */
export function useCombobox(options: () => UseComboboxOptions): UseComboboxResult {
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

	function findSelectedIndex(): number {
		const { selectableItems, value } = options();
		return selectableItems.findIndex((item) => item.value === value);
	}

	function closeAndReset(): void {
		highlightedIndex = -1;
		options().onClose();
	}

	function selectItem(item: SelectorOptionData): void {
		if (item.disabled) {
			return;
		}
		options().onSelect?.(item.value);
		closeAndReset();
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
				const selectedIndex = findSelectedIndex();
				highlightedIndex = selectedIndex >= 0 ? selectedIndex : 0;
			}
		}
	}

	function onItemMouseEnter(item: SelectorOptionData, index: number): void {
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
				if (hasSearch) {
					break;
				}
			// falls through
			case 'Enter':
				e.preventDefault();
				if (isOpen && highlightedIndex >= 0) {
					const item = selectableItems[highlightedIndex];
					if (item && !item.disabled) {
						selectItem(item);
					}
				} else if (!isOpen) {
					o.onOpen();
					if (!hasSearch) {
						const selectedIndex = findSelectedIndex();
						highlightedIndex = selectedIndex >= 0 ? selectedIndex : 0;
					}
				}
				break;

			case 'Escape':
				if (isOpen) {
					e.preventDefault();
					closeAndReset();
				}
				break;

			case 'Tab':
				if (isOpen) {
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
				// Keyboard equivalent of the clear button (comboboxes-2): clear the
				// value from the closed trigger so clearing is not mouse-only. When
				// hasSearch is active these keys must edit the search text instead,
				// and when the popup is open arrow navigation owns interaction, so
				// only handle the closed non-search case with a clearable value.
				if (!hasSearch && !isOpen && o.onClear != null && o.value != null) {
					e.preventDefault();
					o.onClear();
				}
				break;

			default:
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
		onItemSelect: selectItem,
		onItemMouseEnter
	};
}
