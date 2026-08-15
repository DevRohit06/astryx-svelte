<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { IconName } from '../icon/icon-registry.js';
	import type { IndicatorPosition } from '../indicator/types.js';
	import type { LayerPlacement } from '../layer/use-layer.svelte.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';
	// `SelectorSize` is published from `selector.stylex.ts`, derived from the size
	// style keys — the arrangement `TextInput`/`NumberInput` use. `SelectorVariant`
	// lives there too, because the trigger's attrs function is what consumes it.
	import type { SelectorSize, SelectorVariant } from './selector.stylex.js';
	import type { SelectorOptionData, SelectorOptionType } from './types.js';

	// Neither `SelectorSize` nor `SelectorVariant` is re-exported from here — the
	// barrel publishes the former straight from `selector.stylex.ts` (the
	// arrangement `NumberInputSize` uses) and withholds the latter entirely,
	// because upstream's `Selector/index.ts` does.

	/** The three status flavours a selector can carry. */
	export type SelectorStatusType = 'warning' | 'error' | 'success';

	export interface SelectorStatus {
		/** The type of status to display. */
		type: SelectorStatusType;
		/** Optional message to display below the input. */
		message?: string;
	}

	/**
	 * `onchange` is omitted so the union arms below can redeclare `onChange`
	 * without the native handler shadowing it through the rest spread — the same
	 * hole `NumberInput` closes. (Upstream omits React's `onChange` and
	 * `defaultValue`; the latter is not on Svelte's base type, so there is nothing
	 * to remove.)
	 */
	interface SelectorPropsBase<T extends SelectorOptionType = SelectorOptionType> extends Omit<
		BaseProps,
		'onchange'
	> {
		/** Label text for the selector (always rendered for accessibility). */
		label: string;
		/**
		 * Whether to visually hide the label (still accessible to screen readers).
		 * @default false
		 */
		isLabelHidden?: boolean;
		/** Description text displayed between the label and selector. */
		description?: string;
		/**
		 * Whether the field is optional. Mutually exclusive with isRequired.
		 * @default false
		 */
		isOptional?: boolean;
		/**
		 * Whether the field is required. Mutually exclusive with isOptional.
		 * @default false
		 */
		isRequired?: boolean;
		/**
		 * Whether the selector is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Explains why the selector is disabled. When set together with
		 * `isDisabled`, the selector shows a tooltip with this text on hover and
		 * keyboard focus, and the trigger stays focusable (via `aria-disabled`)
		 * so the reason is discoverable by keyboard and assistive technology.
		 * Activation stays blocked.
		 *
		 * Use this instead of wrapping a disabled selector in `Tooltip` — disabled
		 * controls don't emit the pointer events an external tooltip needs.
		 */
		disabledMessage?: string;
		/**
		 * The options to display in the selector.
		 * Can be strings, objects, dividers, or sections.
		 */
		options: T[];

		// value, onChange, changeAction, and hasClear are in the discriminated union below

		/**
		 * Whether the selector is in a loading state.
		 * @default false
		 */
		isLoading?: boolean;
		/**
		 * Placeholder text when no value is selected.
		 * @default 'Select...'
		 */
		placeholder?: string;
		/**
		 * The size of the selector.
		 * @default 'md'
		 */
		size?: SelectorSize;
		/**
		 * Visual style of the selector trigger.
		 * - `input`: bordered input-style trigger for forms
		 * - `ghost`: borderless trigger matching ghost buttons, for toolbars
		 * @default 'input'
		 */
		variant?: SelectorVariant;
		/**
		 * Status indicator for the selector.
		 * When set, displays a colored border and status icon.
		 * If message is provided, displays a message box below the selector.
		 */
		status?: SelectorStatus;
		/**
		 * How the status message is placed relative to the input.
		 * - `attached`: message overlaps directly below the bordered input (input variant only)
		 * - `detached`: message floats below as a separate element with spacing
		 * - `tooltip`: message is exposed from the on-field status icon
		 * @default 'attached' for input selectors; 'detached' for ghost selectors
		 */
		statusVariant?: FieldStatusVariant;
		/**
		 * Width of the field. Numbers are treated as pixels, strings are used as-is
		 * (e.g. `'100%'`). Sizes the whole field (label, control, and status) so they
		 * stay aligned, unlike setting width via `xstyle`/`class`/`style`.
		 */
		width?: SizeValue;
		/** Tooltip text to display in an info icon at the end of the label. */
		labelTooltip?: string;
		/**
		 * Icon displayed at the start of the selector trigger — a registry name, or
		 * a snippet for a custom icon. Upstream applies `size="sm" color="secondary"`
		 * to a registry icon; a snippet is authored by the caller, so set them
		 * yourself to match.
		 */
		startIcon?: IconName | Snippet;
		/**
		 * Custom renderer for options. Only called for selectable options (not
		 * dividers/sections). Upstream's `renderOption` render prop, which a
		 * `Snippet` translates directly.
		 */
		renderOption?: Snippet<[SelectorOptionData]>;
		/**
		 * Which edge of the option row carries the selected mark. `start` reserves a
		 * mark column ahead of every label so they stay aligned, the way a native
		 * menu does; `end` is the house convention shared with Typeahead and
		 * CommandPalette.
		 *
		 * @default 'end'
		 */
		indicatorPosition?: IndicatorPosition;
		/**
		 * Whether to show a search input for filtering options.
		 * @default false
		 */
		hasSearch?: boolean;
		/**
		 * Placeholder text for the search input.
		 * @default 'Search...'
		 */
		searchPlaceholder?: string;
		/**
		 * Position placement relative to the trigger.
		 *
		 * Omit to use the selector's default selected-item overlay behavior: the
		 * selected item is positioned over the trigger and clamped to the viewport.
		 * Set a placement to opt into explicit layer positioning (for example,
		 * `placement="above"` for bottom-fixed toolbars).
		 */
		placement?: LayerPlacement;
		/**
		 * Whether the dropdown starts open on mount.
		 * Useful for showcases and previews.
		 * @default false
		 */
		isDefaultOpen?: boolean;
		/**
		 * The HTML name attribute for form submissions. When set, a hidden input
		 * carries the selected value under this name, matching how a native
		 * select serializes.
		 */
		htmlName?: string;
		/** Test ID for testing frameworks. */
		'data-testid'?: string;
	}

	/**
	 * Without `hasClear`, the selector always has a string value (or undefined for
	 * placeholder). With `hasClear`, the value can be `null` and `onChange`
	 * receives `null` on clear.
	 *
	 * A discriminated union rather than an interface — upstream's shape. The two
	 * constituent types stay unexported here because upstream exports only the
	 * union.
	 */
	type SelectorPropsNonClearable<T extends SelectorOptionType = SelectorOptionType> =
		SelectorPropsBase<T> & {
			hasClear?: false;
			value?: string;
			onChange?: (value: string) => void;
			changeAction?: (value: string) => void | Promise<void>;
		};

	type SelectorPropsClearable<T extends SelectorOptionType = SelectorOptionType> =
		SelectorPropsBase<T> & {
			/**
			 * Whether to show a clear button when a value is selected.
			 * When clicked, resets the value to `null` and returns focus to the trigger.
			 *
			 * When enabled, `value` and `onChange` widen to include `null`.
			 */
			hasClear: true;
			value: string | null;
			onChange?: (value: string | null) => void;
			changeAction?: (value: string | null) => void | Promise<void>;
		};

	export type SelectorProps<T extends SelectorOptionType = SelectorOptionType> =
		SelectorPropsNonClearable<T> | SelectorPropsClearable<T>;

	/**
	 * One match predicate, used by the flat filter (count + keyboard nav) and the
	 * grouped renderer alike, so what is shown while searching stays in lockstep
	 * with the announced count.
	 */
	function optionMatchesQuery(option: SelectorOptionData, query: string): boolean {
		if (!query) {
			return true;
		}
		return (option.label ?? option.value).toLowerCase().includes(query.toLowerCase());
	}

	/**
	 * Case-insensitive substring filter over the selectable options. Shared by the
	 * `filteredItems` derivation (rendering) and the search-change handler, which
	 * needs the count for the *next* query synchronously to announce it exactly
	 * once per keystroke rather than reacting to state in an effect.
	 */
	function filterOptionsByQuery(items: SelectorOptionData[], query: string): SelectorOptionData[] {
		if (!query) {
			return items;
		}
		return items.filter((item) => optionMatchesQuery(item, query));
	}

	/**
	 * One rendered row of the listbox. Upstream's `renderOptions` returns an array
	 * of `ReactNode`s built in a loop; the Svelte counterpart returns the *data*
	 * that loop produced and lets the template render it, which is the same
	 * translation `CodeBlock`'s `renderLines` took.
	 */
	type SelectorRenderEntry =
		| { kind: 'divider'; key: string }
		| {
				kind: 'section';
				key: string;
				title: string | undefined;
				items: { item: SelectorOptionData; flatIndex: number }[];
		  }
		| { kind: 'option'; key: string; item: SelectorOptionData; flatIndex: number };
</script>

<script lang="ts" generics="T extends SelectorOptionType">
	import { untrack } from 'svelte';
	import { useSize } from '../../internal/contexts.svelte.js';
	import { stableClassName } from '../../internal/naming.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { getInputARIA } from '../../utils/input-aria.js';
	import { useAnnounce } from '../../hooks/use-announce.js';
	import { useTypeahead } from '../../hooks/use-typeahead.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import Divider from '../divider/divider.svelte';
	import Field from '../field/field.svelte';
	import InputClearButton from '../field/input-clear-button.svelte';
	import PanelSearchInput from '../field/panel-search-input.svelte';
	import Icon from '../icon/icon.svelte';
	import { useIndicator } from '../indicator/use-indicator.svelte.js';
	import { layerAnimations } from '../layer/layer-animations.stylex.js';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import Spinner from '../spinner/spinner.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { useInputGroup } from '../input-group/input-group-context.svelte.js';
	import SelectorOption from './selector-option.svelte';
	import { useCombobox } from './use-combobox.svelte.js';
	import { useSelectedItemOffset } from './use-selected-item-offset.svelte.js';
	import {
		getSelectableOptions,
		isDivider,
		isOptionData,
		isSection,
		normalizeOption
	} from './utils.js';
	import {
		selectorChevronXstyle,
		selectorDividerStyle,
		selectorDropdownAttrs,
		selectorEmptyStateAttrs,
		selectorItemAttrs,
		selectorItemContentAttrs,
		selectorItemMarkColumnAttrs,
		selectorPopoverOffset,
		selectorPopoverStyle,
		selectorSearchRowStyle,
		selectorSectionHeadingAttrs,
		selectorStatusButtonAttrs,
		selectorTriggerAttrs,
		selectorTriggerContainerAttrs,
		selectorTriggerIconStyle,
		selectorTriggerLabelAttrs
	} from './selector.stylex.js';

	/**
	 * A selector/dropdown for choosing from a list of options — the whole `Field`
	 * shell around a `role="combobox"` trigger, or, inside an `InputGroup`, a bare
	 * control that borrows the group's label and collapses its border into the row.
	 *
	 * The popup is a `Popover` with `role: 'none'`, so the inner `role="listbox"`
	 * is the exposed semantics and the trigger keeps DOM focus. Without an explicit
	 * `placement` the dropdown positions the *selected* item over the trigger
	 * (macOS-style) and clamps to the viewport.
	 *
	 * **Strictly controlled — `value` is deliberately not `$bindable()`**, unlike
	 * `TextInput`/`TextArea`/`Switch`. Upstream never writes it back, and a local
	 * commit breaks a controlled caller that does not commit: `Pagination` passes
	 * `value={String(pageSize)}` and its `onPageSizeChange` is optional, so a
	 * consumer who omits it would see the trigger stick on the newly-picked size
	 * forever while every range and dot kept computing from the old one. React's
	 * controlled input snaps back there; a `$bindable` override does not. Same
	 * reasoning as `NumberInput`.
	 *
	 * @example
	 * ```svelte
	 * <Selector
	 *   label="Fruit"
	 *   options={['Apple', 'Banana', 'Orange']}
	 *   value={fruit}
	 *   onChange={(v) => (fruit = v)}
	 *   placeholder="Select a fruit..."
	 * />
	 * ```
	 */
	const {
		label,
		isLabelHidden = false,
		description,
		isOptional = false,
		isRequired = false,
		isDisabled = false,
		disabledMessage,
		options,
		value,
		onChange,
		changeAction,
		isLoading = false,
		placeholder: placeholderFromProps,
		size: sizeProp,
		variant = 'input',
		status,
		statusVariant = 'attached',
		labelTooltip,
		startIcon,
		htmlName,
		renderOption,
		indicatorPosition = 'end',
		hasSearch = false,
		searchPlaceholder: searchPlaceholderFromProps,
		placement,
		isDefaultOpen = false,
		'data-testid': testId,
		width,
		xstyle,
		class: className,
		style: styleProp,
		hasClear: hasClearProp,
		...rest
	}: SelectorProps<T> = $props();

	// The union's arms differ only in whether `value`/`onChange` admit `null`, and
	// destructuring a union narrows a call to the *intersection* of the parameter
	// types — so the clearable arm's own `onChange(null)` would not typecheck. One
	// cast at the single point the arms meet, the seam `ListItem` documents.
	const emit = $derived(onChange as ((value: string | null) => void) | undefined);
	const emitAction = $derived(
		changeAction as ((value: string | null) => void | Promise<void>) | undefined
	);

	const t = useTranslator();
	const placeholder = $derived(placeholderFromProps ?? t('@astryx.selector.placeholder'));
	const searchPlaceholder = $derived(
		searchPlaceholderFromProps ?? t('@astryx.selector.searchPlaceholder')
	);
	const hasClear = $derived(hasClearProp === true);
	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));
	// A ghost trigger has no bordered surface for an `attached` message to hang
	// off, so it falls back to the detached box. An explicit `detached`/`tooltip`
	// passes through untouched.
	const effectiveStatusVariant = $derived(
		variant === 'ghost' && statusVariant === 'attached' ? 'detached' : statusVariant
	);

	// Normalize null to undefined for internal use (null is the clear sentinel)
	const normalizedValue = $derived(value === null ? undefined : value);

	// One base id with derived suffixes — the counterpart to upstream's six
	// `useId` calls, plus two more the port needs: the layer's own id (upstream's
	// `useLayer` mints it internally; ours must be passed in) and the tooltip's.
	// `aria-controls` deliberately points at `listboxId`, the real `role="listbox"`
	// div, rather than the layer wrapper — upstream's wiring, and the same
	// exception `TabMenu` makes to this port's aria-controls-at-`layer.id` rule.
	const uid = $props.id();
	const triggerId = `${uid}-trigger`;
	const listboxId = `${uid}-listbox`;
	const descriptionId = `${uid}-description`;
	const statusMessageId = `${uid}-status`;
	const inputLabelId = `${uid}-input-label`;
	const searchId = `${uid}-search`;
	const popoverId = `${uid}-popover`;
	const tooltipId = `${uid}-tooltip`;
	const statusTooltipId = `${uid}-status-tip`;

	// Measure from the same outer control `usePopover` anchors to; using the
	// shorter inner button makes every size's selected row land too low.
	let anchorEl = $state<HTMLDivElement | null>(null);
	let triggerEl = $state<HTMLButtonElement | null>(null);
	// `PanelSearchInput` publishes its `<input>` through a bindable `ref` — the
	// Svelte spelling of upstream's `searchRef`, which the selector focuses on
	// open and compares against a key event's target.
	let searchEl = $state<HTMLInputElement | null>(null);
	let listboxEl = $state<HTMLDivElement | null>(null);

	const inputGroup = useInputGroup();

	let searchQuery = $state('');
	// A typed query shows the search row's clear (✕) button, which becomes the
	// next tab stop after the search input.
	const hasQuery = $derived(searchQuery.length > 0);

	const optimistic = createOptimistic<string | undefined>(() => normalizedValue);
	const isBusy = $derived(isLoading || optimistic.current !== normalizedValue);

	// Disabled-reason tooltip. Disabled controls swallow pointer events, so the
	// tooltip listeners attach to the trigger container (which already exists)
	// and the trigger button stays perceivable via aria-disabled instead of the
	// disabled attribute. Activation is blocked by the isDisabled guards in
	// useCombobox (onTriggerClick / onKeyDown).
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipId,
		placement: 'above' as const,
		// The container div is not naturally focusable; focusin bubbles up from
		// the trigger button, so always attach focus listeners.
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	// The `tooltip` status variant renders no message box; the status is exposed
	// from a focusable button on the on-field icon instead.
	const statusTooltip = useTooltip(() => ({
		id: statusTooltipId,
		placement: 'above' as const,
		isEnabled: effectiveStatusVariant === 'tooltip' && !!status?.message
	}));

	const groupValue = $derived(inputGroup ? inputGroup() : null);
	const aria = $derived(
		getInputARIA(
			inputLabelId,
			[
				description ? descriptionId : null,
				// The status message element is rendered by `Field`, which is skipped
				// inside an `InputGroup` — only reference it when it actually exists.
				!inputGroup && effectiveStatusVariant !== 'tooltip' && status?.message
					? statusMessageId
					: null,
				effectiveStatusVariant === 'tooltip' && status?.message ? statusTooltip.describedBy : null,
				showsDisabledMessage ? disabledMessageTooltip.describedBy : null
			],
			groupValue ? { labelID: groupValue.labelID, describedByIDs: groupValue.describedByIDs } : null
		)
	);

	// Flatten options for keyboard navigation
	const selectableItems = $derived(getSelectableOptions(options));

	// Filter items by search query
	const filteredItems = $derived(filterOptionsByQuery(selectableItems, searchQuery));

	// Find selected item and its index for positioning
	const selectedItemIndex = $derived(
		selectableItems.findIndex((item) => item.value === optimistic.current)
	);
	const selectedItem = $derived(
		selectedItemIndex >= 0 ? selectableItems[selectedItemIndex] : undefined
	);

	// Announce match counts / "No results found" politely as the user types, so
	// screen-reader users hear how many options remain. Filtering was previously
	// silent (comboboxes-7). Mirrors BaseTypeahead, which announces from its
	// query-change callback (not a reactive effect) via the same useAnnounce hook.
	const announce = useAnnounce();

	/**
	 * Forward reference to the typeahead's `reset`, which is defined below (it
	 * needs the popover). Upstream's `resetTypeaheadRef`, and the same shape: a
	 * plain `let`, **deliberately not `$state`** — the hide/clear handlers only
	 * read it at call time, and making it reactive would have the assignment
	 * below re-trigger every derivation that read it.
	 *
	 * Closing and clearing must drop the pending buffer, or a stale prefix
	 * survives the reset window and poisons the next keystroke ("Dog" then "c"
	 * would search "dc").
	 */
	let resetTypeahead: () => void = () => {};

	function handleLayerHide(): void {
		searchQuery = '';
		resetTypeahead();
		// Clear any lingering result count when the popover closes so stale status
		// text does not linger in the a11y tree.
		announce('');
		triggerEl?.focus();
	}

	const popover = usePopover(() => ({
		id: popoverId,
		onHide: handleLayerHide,
		hasLightDismiss: true,
		hasCloseButton: false,
		hasAutoFocus: false,
		// The popup's own role="listbox" is the exposed semantics; the trigger
		// keeps DOM focus, so wrapping it in a modal dialog would misrepresent it.
		role: 'none' as const,
		// The theme target belongs on the SURFACE that paints the popup, which
		// `usePopover` owns — not on the scrolling list inside it.
		surfaceTarget: 'selector-popup'
	}));

	// Open dropdown on mount when isDefaultOpen is true. Read once at init, as
	// upstream's empty dependency list documents ("isDefaultOpen is not reactive").
	const showOnMount = untrack(() => isDefaultOpen);
	$effect(() => {
		if (showOnMount) {
			untrack(() => popover.show());
		}
	});

	/**
	 * Announce the filtered result count from the query-change handler (matching
	 * BaseTypeahead) rather than a reactive effect: computing the count for the
	 * next query here fires the announcement exactly once per keystroke and does
	 * not re-speak on unrelated re-renders.
	 */
	function handleSearchChange(nextQuery: string): void {
		searchQuery = nextQuery;
		if (nextQuery.length === 0) {
			// Emptying the query clears the region rather than announcing a count.
			announce('');
			return;
		}
		const count = filterOptionsByQuery(selectableItems, nextQuery).length;
		announce(count === 0 ? 'No results found' : `${count} result${count === 1 ? '' : 's'}`);
	}

	// Calculate offset to position selected item over trigger. Explicit
	// placement opts out of the selector-specific overlay behavior and uses the
	// standard layer positioning API instead.
	const shouldOverlaySelectedItem = $derived(placement == null && !hasSearch);
	const rawOffset = useSelectedItemOffset(() => ({
		isOpen: popover.isOpen && shouldOverlaySelectedItem,
		selectedItemIndex,
		listboxId,
		listboxEl,
		anchorEl
	}));

	const selectedItemOffset = $derived(shouldOverlaySelectedItem ? rawOffset.offset : 0);
	const isPositioned = $derived(shouldOverlaySelectedItem ? rawOffset.isPositioned : true);
	const popoverPlacement = $derived(placement ?? 'below');
	const popoverOffsetStyle = $derived(
		selectedItemOffset > 0 ? `margin-block-start:-${selectedItemOffset}px` : undefined
	);

	/**
	 * Clear the current value. Shared by the clear button and the keyboard
	 * Delete/Backspace path so clearing is reachable without a mouse.
	 */
	function clearValue(): void {
		resetTypeahead();
		emit?.(null);
		if (emitAction) {
			void optimistic.run(undefined, () => emitAction(null));
		}
	}

	/**
	 * Type-to-find appends to the query rather than replacing it: characters
	 * typed before focus reaches the search input must not be dropped.
	 */
	function appendSearchQuery(char: string): void {
		searchQuery += char;
	}

	function selectValue(newValue: string): void {
		emit?.(newValue);
		if (emitAction) {
			void optimistic.run(newValue, () => emitAction(newValue));
		}
	}

	// Selector behavior (keyboard nav, selection)
	const combobox = useCombobox(() => ({
		selectableItems: filteredItems,
		// The optimistic value, not the raw prop: with a pending changeAction the
		// prop still holds the old selection, so the popup would open with the
		// highlight on it and Delete/Backspace could clear a value the action has
		// already replaced.
		value: optimistic.current,
		isDisabled,
		isOpen: popover.isOpen,
		hasSearch,
		onOpen: () => {
			popover.show();
			if (hasSearch) {
				requestAnimationFrame(() => {
					const input = searchEl;
					if (input) {
						input.focus();
						// When typing seeded the query, place the caret after it so the
						// user keeps typing where they left off.
						input.setSelectionRange(input.value.length, input.value.length);
					}
				});
			}
		},
		onClose: popover.hide,
		onSelect: selectValue,
		onClear: hasClear ? clearValue : undefined,
		onSearchSeed: appendSearchQuery,
		listboxId
	}));

	/**
	 * Type-to-select, shared with the other collections (menus, listboxes).
	 * Open, it walks the highlight — `aria-activedescendant` announces each
	 * match. Closed, it commits the match like a native `<select>`, which changes
	 * the value without opening the popup or moving focus, so nothing else would
	 * prompt assistive tech to re-read the trigger: announce it explicitly.
	 */
	const typeahead = useTypeahead(() => ({
		getItemLabels: () => selectableItems.map((item) => item.label ?? item.value),
		isDisabled: (index: number) => selectableItems[index]?.disabled === true,
		// Cycle onward from the highlight when open, from the committed selection
		// when closed — the optimistic one, so a pending changeAction cannot strand
		// cycling on the first match. -1 means nothing is selected or highlighted,
		// which the hook reads as "search from the top".
		getCurrentIndex: () => (popover.isOpen ? combobox.highlightedIndex : selectedItemIndex),
		onMatch: (index: number) => {
			const item = selectableItems[index];
			if (popover.isOpen) {
				combobox.setHighlightedIndex(index);
			} else if (item.value !== optimistic.current) {
				selectValue(item.value);
				announce(item.label ?? item.value);
			}
		}
	}));
	resetTypeahead = typeahead.reset;

	function handleTriggerKeyDown(e: KeyboardEvent): void {
		// With hasSearch the query input owns typing, so type-to-select is off.
		if (!isDisabled && !hasSearch && typeahead.onKeyDown(e)) {
			e.preventDefault();
			return;
		}
		combobox.onKeyDown(e);
	}

	// Keep the highlighted option visible during keyboard navigation. The
	// listbox is a fixed-height scroll container, so without this the virtual
	// cursor walks off-screen once navigation passes the visible window.
	$effect(() => {
		const isOpen = popover.isOpen;
		const index = combobox.highlightedIndex;
		if (!isOpen || index < 0) {
			return;
		}
		// `getItemId` reads the whole combobox options bag (`filteredItems`, the
		// optimistic value, `isDisabled`, `hasSearch`), so an untracked read is
		// what keeps this effect's dependency set to upstream's two — otherwise
		// typing in a `hasSearch` selector would re-fire the scroll and yank a
		// wheel-scrolled listbox back to the highlighted row.
		const itemId = untrack(() => combobox.getItemId(index));
		document.getElementById(itemId)?.scrollIntoView?.({ block: 'nearest' });
	});

	function handleClear(e: MouseEvent): void {
		e.stopPropagation(); // Don't open dropdown
		clearValue();
	}

	/**
	 * The rows to render, walking `options` exactly as upstream's `renderOptions`
	 * loop does — including the `flatIndex` that item ids and the highlight are
	 * keyed on. A search query no longer flattens the list: each group keeps its
	 * header above whichever of its items match, and a group with no matches is
	 * hidden entirely. Typing used to drop every header, which is what 0.2.0
	 * fixed.
	 */
	const renderEntries = $derived.by((): SelectorRenderEntry[] => {
		const isSearching = hasSearch && Boolean(searchQuery);

		let flatIndex = 0;
		const entries: SelectorRenderEntry[] = [];

		for (let i = 0; i < options.length; i++) {
			const option = options[i];

			if (isDivider(option)) {
				// While searching, a standalone divider between groups would orphan
				// itself once its neighbours are filtered out, so skip it.
				if (isSearching) {
					continue;
				}
				entries.push({ kind: 'divider', key: `divider-${i}` });
			} else if (isSection(option)) {
				const items: { item: SelectorOptionData; flatIndex: number }[] = [];
				for (const opt of option.options) {
					const normalized = normalizeOption(opt);
					if (isSearching && !optionMatchesQuery(normalized, searchQuery)) {
						continue;
					}
					items.push({ item: normalized, flatIndex });
					flatIndex++;
				}
				// Hide a group entirely (header + wrapper) when none of its items match
				// the query, so no header is left standing over nothing.
				if (items.length === 0) {
					continue;
				}
				entries.push({ kind: 'section', key: `section-${i}`, title: option.title, items });
			} else if (isOptionData(option)) {
				const item = normalizeOption(option);
				if (isSearching && !optionMatchesQuery(item, searchQuery)) {
					continue;
				}
				entries.push({ kind: 'option', key: item.value, item, flatIndex });
				flatIndex++;
			}
		}

		return entries;
	});

	// Two tables, as upstream declares them, not one read twice. Their values
	// coincide today, so collapsing them renders identically — but they answer
	// different questions (*which icon* vs *which colour token*), and a future
	// upstream change to either would land silently on the wrong axis.
	const STATUS_ICON_MAP: Record<SelectorStatusType, IconName> = {
		warning: 'warning',
		error: 'error',
		success: 'success'
	};

	const STATUS_ICON_COLOR_MAP: Record<SelectorStatusType, 'warning' | 'error' | 'success'> = {
		warning: 'warning',
		error: 'error',
		success: 'success'
	};

	/** Accessible-name keys for the `tooltip` variant's focusable status button. */
	const STATUS_BUTTON_LABEL_KEY: Record<SelectorStatusType, string> = {
		warning: '@astryx.input.statusButton.warning',
		error: '@astryx.input.statusButton.error',
		success: '@astryx.input.statusButton.success'
	};

	// The detached message box renders its own leading status icon, so the
	// on-field icon would duplicate it — keep the chevron indicator instead.
	const showStatusIcon = $derived(status != null && effectiveStatusVariant !== 'detached');
	const showStatusTooltip = $derived(
		status != null && effectiveStatusVariant === 'tooltip' && !!status.message
	);

	/**
	 * The single-selection mark, resolved from the theme. A theme that maps
	 * `check` to another indicator (a radio, say) changes every selected-option
	 * mark in the app through this one lookup.
	 *
	 * Read through `$derived`, never frozen at init: `use-indicator.svelte.ts`
	 * returns a `current` getter precisely so a `<Theme>` swap re-resolves it.
	 */
	const mark = useIndicator('check');
	const SelectionMark = $derived(mark.current);

	const theme = $derived(
		themeProps('selector', {
			variant,
			size,
			status: status?.type ?? null,
			disabled: isDisabled ? 'disabled' : null
		})
	);
	const containerAttrs = $derived(
		selectorTriggerContainerAttrs(
			size,
			variant,
			status?.type,
			isDisabled,
			selectedItem != null,
			inputGroup != null,
			xstyle
		)
	);
	const triggerAttrs = selectorTriggerAttrs();
	const triggerLabelAttrs = selectorTriggerLabelAttrs();
	const chevronXstyle = $derived(selectorChevronXstyle(popover.isOpen));
	const statusButtonAttrs = selectorStatusButtonAttrs();
	// `dropdownHidden` rides `!isPositioned`, which the search branch can never
	// reach (`shouldOverlaySelectedItem` is false whenever `hasSearch` is set, so
	// `isPositioned` is forced true) — upstream's search branch leaves it off the
	// call site for the same reason.
	const dropdownAttrs = $derived(selectorDropdownAttrs(variant, isPositioned));
	const searchRowXstyle = $derived(variant !== 'ghost' && selectorSearchRowStyle);
	const emptyStateAttrs = selectorEmptyStateAttrs();
	const sectionHeadingAttrs = selectorSectionHeadingAttrs();
	const markColumnAttrs = selectorItemMarkColumnAttrs();
	// Upstream merges each of these with `mergeProps(themeProps(…),
	// stylex.props(…))`; here the target contributes only a class, so `cx` is the
	// whole of that merge.
	const searchTheme = themeProps('selector-search');
	const emptyStateTheme = themeProps('selector-empty-state');
	const sectionHeadingTheme = themeProps('selector-section-heading');
	const checkTheme = themeProps('selector-check');
	const layerXstyle = $derived([selectorPopoverStyle, layerAnimations[popoverPlacement]]);
	// The system's standard menu clearance, except in overlay mode: there the
	// measured negative margin owns the block geometry and the menu is meant to
	// sit on the trigger, not clear it.
	const popoverOffset = $derived(shouldOverlaySelectedItem ? undefined : selectorPopoverOffset);
</script>

{#snippet startIconSlot()}
	{#if typeof startIcon === 'string'}
		<Icon icon={startIcon} size="sm" color="secondary" />
	{:else if startIcon}
		{@render startIcon()}
	{/if}
{/snippet}

{#snippet defaultOption(item: SelectorOptionData)}
	<SelectorOption icon={item.icon} label={item.label ?? item.value} />
{/snippet}

{#snippet optionRow(item: SelectorOptionData, flatIndex: number)}
	{@const isHighlighted = flatIndex === combobox.highlightedIndex}
	{@const isSelected = item.value === normalizedValue}
	{@const attrs = selectorItemAttrs(size, isHighlighted, isSelected, item.disabled === true)}
	{@const contentAttrs = selectorItemContentAttrs()}
	<!--
		A `role="option"` div with click + hover handlers, as upstream renders. The
		keyboard model is the combobox's — the trigger (or the search input) keeps
		DOM focus and drives selection through `aria-activedescendant` — so the row
		itself is deliberately not a tab stop and has no key handler of its own.
	-->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		id={combobox.getItemId(flatIndex)}
		role="option"
		aria-selected={isSelected}
		aria-disabled={item.disabled}
		onclick={() => combobox.onItemSelect(item)}
		onmouseenter={() => combobox.onItemMouseEnter(item, flatIndex)}
		class={attrs.class}
		style={attrs.style}
	>
		{#snippet mark()}
			<!--
				Rendered UNCONDITIONALLY, with the state passed down: the default check
				draws nothing when unchecked, but a theme that replaces the `check`
				indicator with a radio needs the unselected state to draw its empty
				circle. An `{#if isSelected}` would make that impossible.

				`selector-check` stays the stable target for the mark's position in the
				row; the indicator owns what the mark looks like.
			-->
			<span class={markColumnAttrs.class} style={markColumnAttrs.style}>
				<SelectionMark
					state={isSelected ? 'checked' : 'unchecked'}
					size="sm"
					isDisabled={item.disabled ?? false}
					{...checkTheme}
				/>
			</span>
		{/snippet}
		{#snippet optionContent()}
			<span class={contentAttrs.class} style={contentAttrs.style}>
				{#if renderOption}{@render renderOption(item)}{:else}{@render defaultOption(item)}{/if}
			</span>
		{/snippet}
		{#if indicatorPosition === 'start'}
			{@render mark()}
			{@render optionContent()}
		{:else}
			{@render optionContent()}
			{@render mark()}
		{/if}
	</div>
{/snippet}

{#snippet options_()}
	{#if hasSearch && searchQuery && filteredItems.length === 0}
		<!--
			role="presentation" keeps the message out of the listbox's accessibility
			tree (role="listbox" only permits option/group children); the no-results
			outcome is announced via the result-count live region instead.
		-->
		<div
			role="presentation"
			class={cx(emptyStateTheme.class, emptyStateAttrs.class)}
			style={emptyStateAttrs.style}
		>
			No results found
		</div>
	{:else}
		{#each renderEntries as entry (entry.key)}
			{#if entry.kind === 'divider'}
				<Divider xstyle={selectorDividerStyle} />
			{:else if entry.kind === 'section'}
				<div role="group" aria-label={entry.title}>
					{#if entry.title}
						<!--
							The heading lives INSIDE the group and is aria-hidden: the group
							already carries the title as its accessible name, so exposing the
							text again would announce it twice. This also keeps
							role="listbox"'s children to option/group only — the labelled
							`Divider` this replaces sat in the listbox as a stray
							role="separator".
						-->
						<div
							aria-hidden="true"
							class={cx(sectionHeadingTheme.class, sectionHeadingAttrs.class)}
							style={sectionHeadingAttrs.style}
						>
							{entry.title}
						</div>
					{/if}
					{#each entry.items as member (member.item.value)}
						{@render optionRow(member.item, member.flatIndex)}
					{/each}
				</div>
			{:else}
				{@render optionRow(entry.item, entry.flatIndex)}
			{/if}
		{/each}
	{/if}
{/snippet}

{#snippet listbox()}
	<div
		bind:this={listboxEl}
		id={listboxId}
		role="listbox"
		aria-labelledby={triggerId}
		class={dropdownAttrs.class}
		style={dropdownAttrs.style}
	>
		{@render options_()}
	</div>
{/snippet}

{#snippet selectorContent()}
	<!--
		The container is the click target and the tooltip/popover anchor. It is not
		focusable and carries no role: the `role="combobox"` button inside it is the
		control, and the click handler exists only to widen the hit area over the
		padding, spinner and chevron — every one of which sits inside the same
		trigger the button already exposes to keyboard users.
	-->
	<div
		bind:this={anchorEl}
		{@attach popover.attachTrigger}
		{@attach disabledMessageTooltip.attachTrigger}
		onclick={combobox.onTriggerClick}
		data-testid={testId}
		{...theme}
		class={cx(theme.class, containerAttrs.class, className)}
		style={mergeStyle(containerAttrs.style, styleProp as string | undefined)}
	>
		{#if startIcon}{@render startIconSlot()}{/if}
		{#if inputGroup}
			<VisuallyHidden id={inputLabelId}>{label}</VisuallyHidden>
		{/if}
		<button
			bind:this={triggerEl}
			id={triggerId}
			type="button"
			role={hasSearch ? undefined : 'combobox'}
			{...rest}
			aria-haspopup="listbox"
			aria-expanded={popover.isOpen}
			aria-controls={listboxId}
			aria-activedescendant={!hasSearch && popover.isOpen && combobox.highlightedIndex >= 0
				? combobox.getItemId(combobox.highlightedIndex)
				: undefined}
			aria-describedby={aria.ariaDescribedBy}
			aria-labelledby={aria.ariaLabelledBy}
			aria-required={isRequired ? 'true' : undefined}
			aria-invalid={status?.type === 'error' ? 'true' : undefined}
			aria-busy={isBusy || undefined}
			disabled={isDisabled && !showsDisabledMessage}
			aria-disabled={showsDisabledMessage ? 'true' : undefined}
			onkeydown={handleTriggerKeyDown}
			tabindex={isDisabled && !showsDisabledMessage ? -1 : 0}
			class={triggerAttrs.class}
			style={triggerAttrs.style}
		>
			<span class={triggerLabelAttrs.class} style={triggerLabelAttrs.style}>
				{selectedItem?.label ?? placeholder}
			</span>
		</button>
		{#if htmlName != null}
			<!--
				Disabled native controls are excluded from form submission; mirror that
				for the hidden carrier.
			-->
			<input type="hidden" name={htmlName} value={value ?? ''} disabled={isDisabled} />
		{/if}
		{#if isBusy}
			<Spinner size="sm" />
		{/if}
		{#if hasClear && value != null && !isDisabled}
			<!--
				The shared clear affordance, so the selector's ✕ behaves like every other
				input's. `iconClassName` keeps the component-specific
				`astryx-selector-clear-icon` target emitting through its deprecation
				window, alongside the shared `astryx-input-clear-icon`.
			-->
			<InputClearButton
				label={t('@astryx.selector.clearLabel', { label })}
				onclick={handleClear}
				iconClassName={stableClassName('selector-clear-icon')}
			/>
		{/if}
		<!--
			No wrapper span: Icon's own span already provides the 16px box (`sm`) and
			the icon colour, so the status glyph and the chevron are each directly
			targetable instead of sharing one untargetable parent — and the two
			affordances stop sharing a node.
		-->
		{#if showStatusIcon && status}
			{#if showStatusTooltip}
				<!--
					The `tooltip` variant's affordance: a real focusable button so the
					status is reachable by keyboard and pointer alike. `stopPropagation`
					keeps a click off the container's open-the-dropdown handler.
				-->
				<button
					{@attach statusTooltip.attachTrigger}
					type="button"
					aria-label={t(STATUS_BUTTON_LABEL_KEY[status.type])}
					aria-describedby={statusTooltip.describedBy}
					onclick={(e) => e.stopPropagation()}
					class={statusButtonAttrs.class}
					style={statusButtonAttrs.style}
				>
					<Icon
						icon={STATUS_ICON_MAP[status.type]}
						size="sm"
						color={STATUS_ICON_COLOR_MAP[status.type]}
						xstyle={selectorTriggerIconStyle}
					/>
				</button>
			{:else}
				<Icon
					icon={STATUS_ICON_MAP[status.type]}
					size="sm"
					color={STATUS_ICON_COLOR_MAP[status.type]}
					xstyle={selectorTriggerIconStyle}
				/>
			{/if}
		{:else}
			<!--
				The rotation rides on the glyph, alongside the box and colour the wrapper
				used to provide, so one element carries the mark, its open/closed
				transform, and the `selector-indicator-icon` theme target — plus its
				state as `data-state`, so a theme can style the two independently.
			-->
			<Icon
				icon="chevronDown"
				size="sm"
				color="secondary"
				xstyle={chevronXstyle}
				{...themeProps('selector-indicator-icon', {
					state: popover.isOpen ? 'expanded' : 'collapsed'
				})}
			/>
		{/if}
	</div>

	<PopoverLayer
		{popover}
		placement={popoverPlacement}
		alignment="start"
		offset={popoverOffset}
		xstyle={layerXstyle}
		style={popoverOffsetStyle}
	>
		{#if hasSearch}
			<div>
				<!--
					The search row is the panel's header: a magnifier, a borderless input,
					and the shared clear (✕) button. It deliberately does NOT render a
					bordered `TextInput` — the popup is already a bordered surface, and a
					field inside it drew a second box within that box.

					When hasSearch is set, focus moves into this input on open, so it — not
					the trigger — must be the combobox that reports the highlighted option
					via aria-activedescendant (comboboxes-4). A bare searchbox left the
					highlight silent to screen readers. `role` + `aria-*` pass through to
					the underlying `<input>`.
				-->
				<PanelSearchInput
					bind:ref={searchEl}
					id={searchId}
					label={t('@astryx.selector.searchOptions')}
					clearLabel={t('@astryx.textInput.clearLabel', {
						label: t('@astryx.selector.searchOptions')
					})}
					class={searchTheme.class}
					xstyle={searchRowXstyle}
					role="combobox"
					aria-expanded={popover.isOpen}
					aria-controls={listboxId}
					aria-autocomplete="list"
					aria-activedescendant={popover.isOpen && combobox.highlightedIndex >= 0
						? combobox.getItemId(combobox.highlightedIndex)
						: undefined}
					value={searchQuery}
					onValueChange={handleSearchChange}
					onContainerKeyDown={(e) => {
						// The clear (✕) button lives inside the row, after the input in DOM
						// order. When it is focused and the user tabs forward there is
						// nothing else in the popup, so dismiss it (Shift+Tab returns to the
						// input natively). Key events originating on the input are handled on
						// the input below; ignore them here so we don't double-dismiss.
						if (e.target === searchEl) {
							return;
						}
						if (e.key === 'Tab' && !e.shiftKey) {
							combobox.onKeyDown(e);
						}
					}}
					onkeydown={(e) => {
						// Arrow keys navigate options; Enter selects; Escape closes.
						// Home/End are left to the input for caret movement (APG editable
						// combobox); PageUp/PageDown are the sanctioned substitute for
						// jumping to the first/last option.
						if (
							e.key === 'ArrowDown' ||
							e.key === 'ArrowUp' ||
							e.key === 'PageUp' ||
							e.key === 'PageDown' ||
							e.key === 'Enter' ||
							e.key === 'Escape'
						) {
							combobox.onKeyDown(e);
							return;
						}
						// Tab: when a query is showing the clear (✕) button, forward-tab
						// moves focus to it (keeping the popup open) so the affordance is
						// keyboard-reachable. Every other Tab dismisses the popup as usual.
						if (e.key === 'Tab' && (e.shiftKey || !hasQuery)) {
							combobox.onKeyDown(e);
						}
					}}
					placeholder={searchPlaceholder}
				/>
				<!--
					Separates the header from the options and spans the panel: the search
					row and the listbox each hold their own inline padding, the line does
					not, so it reads as the panel's own edge.
				-->
				<Divider />
				{@render listbox()}
			</div>
		{:else}
			{@render listbox()}
		{/if}
	</PopoverLayer>

	{#if showStatusTooltip}
		<TooltipLayer tooltip={statusTooltip}>{status?.message ?? ''}</TooltipLayer>
	{/if}

	{#if showsDisabledMessage && disabledMessage}
		<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
	{/if}
{/snippet}

{#if inputGroup}
	{@render selectorContent()}
{:else}
	<Field
		{label}
		{isLabelHidden}
		{description}
		inputID={triggerId}
		descriptionID={description ? descriptionId : undefined}
		{isOptional}
		{isRequired}
		{isDisabled}
		status={status
			? {
					type: status.type,
					message: status.message,
					messageID: status.message ? statusMessageId : undefined
				}
			: undefined}
		statusVariant={effectiveStatusVariant}
		{labelTooltip}
		{width}
	>
		{@render selectorContent()}
	</Field>
{/if}
