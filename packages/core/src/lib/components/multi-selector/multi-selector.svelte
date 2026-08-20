<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { IconName } from '../icon/icon-registry.js';
	import type { IndicatorPosition } from '../indicator/types.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';
	// `MultiSelectorSize` is published from `multi-selector.stylex.ts`, derived
	// from the size style keys — the arrangement `Selector`/`TextInput` use.
	// `MultiSelectorVariant` lives there too, because the trigger's attrs function
	// is what consumes it.
	import type { MultiSelectorSize, MultiSelectorVariant } from './multi-selector.stylex.js';
	import type {
		MultiSelectorOptionData,
		MultiSelectorOptionType,
		// Aliased locally only so the import and the re-export below do not name
		// the same binding twice in one module.
		MultiSelectorStatus as MultiSelectorStatusValue
	} from './types.js';

	// `MultiSelectorStatus` lives in `types.ts` on both sides; upstream re-exports
	// it from the component module, so this port does too.
	export type { MultiSelectorStatus } from './types.js';

	// Neither `MultiSelectorSize` nor `MultiSelectorVariant` is re-exported from
	// here — the barrel publishes the former straight from
	// `multi-selector.stylex.ts` (the arrangement `SelectorSize` uses) and
	// withholds the latter entirely, because upstream's `MultiSelector/index.ts`
	// does.

	/** The three status flavours a multi-selector can carry. */
	export type MultiSelectorStatusType = 'warning' | 'error' | 'success';

	/**
	 * `onchange` is omitted so the component's own `onChange` is not shadowed by
	 * the native handler arriving through the rest spread — the hole `Selector`
	 * and `NumberInput` close for the same reason. (Upstream omits React's
	 * `onChange` and `defaultValue`; the latter is not on Svelte's base type, so
	 * there is nothing to remove.)
	 */
	export interface MultiSelectorProps<
		T extends MultiSelectorOptionType = MultiSelectorOptionType
	> extends Omit<BaseProps, 'onchange'> {
		/** Label text for the multi-selector (always rendered for accessibility). */
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
		/** The currently selected values. */
		value: string[];
		/**
		 * The HTML name attribute for form submissions. When set, hidden inputs
		 * carry one entry per selected value under this name, matching how a
		 * native multi-select serializes.
		 */
		htmlName?: string;
		/** Callback when selection changes. */
		onChange: (value: string[]) => void;
		/** Async action on change. Fires after `onChange`. */
		changeAction?: (value: string[]) => void | Promise<void>;
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
		size?: MultiSelectorSize;
		/**
		 * Visual style of the selector trigger.
		 * - `input`: bordered input-style trigger for forms
		 * - `ghost`: borderless trigger matching ghost buttons, for toolbars
		 * @default 'input'
		 */
		variant?: MultiSelectorVariant;
		/** Status indicator for the selector. */
		status?: MultiSelectorStatusValue;
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
		 * Whether to show a clear button when values are selected.
		 * When clicked, resets the value to an empty array and returns focus to the trigger.
		 * @default false
		 */
		hasClear?: boolean;
		/**
		 * Whether to show a "Select all" checkbox.
		 * @default false
		 */
		hasSelectAll?: boolean;
		/**
		 * Label for the select-all checkbox.
		 * @default 'Select all'
		 */
		selectAllLabel?: string;
		/**
		 * Whether to show a search input.
		 * @default false
		 */
		hasSearch?: boolean;
		/**
		 * Placeholder text for the search input.
		 * @default 'Search...'
		 */
		searchPlaceholder?: string;
		/**
		 * How to display selected items in the trigger.
		 * - `'count'`: "3 selected"
		 * - `'labels'`: "Name, Email, +3"
		 * - `'badges'`: [Name] [Email] +2
		 * @default 'count'
		 */
		triggerDisplay?: 'count' | 'labels' | 'badges';
		/**
		 * Maximum number of badges to show before showing "+N".
		 * Only used when `triggerDisplay` is `'badges'`.
		 * @default 3
		 */
		maxBadges?: number;
		/**
		 * Custom renderer for options. Only called for selectable options (not
		 * dividers/sections or the select-all row). Upstream's `renderOption` render
		 * prop, which a `Snippet` translates directly.
		 */
		renderOption?: Snippet<[MultiSelectorOptionData]>;
		/**
		 * Which edge of the option row carries the checkbox.
		 *
		 * @default 'start'
		 */
		indicatorPosition?: IndicatorPosition;
		/**
		 * Whether the dropdown starts open on mount.
		 * Useful for showcases and previews.
		 * @default false
		 */
		isDefaultOpen?: boolean;
		/** Test ID for testing frameworks. */
		'data-testid'?: string;
	}

	// Sentinel value for the select-all item in keyboard navigation
	const SELECT_ALL_VALUE = '__xds_select_all__';

	/**
	 * One rendered row of the dropdown. Upstream's `renderOptions` returns an
	 * array of `ReactNode`s built in a loop; the Svelte counterpart returns the
	 * *data* that loop produced and lets the template render it — the same
	 * translation `Selector` and `CodeBlock`'s `renderLines` took.
	 */
	type MultiSelectorRenderEntry =
		| { kind: 'item'; key: string; item: MultiSelectorOptionData; flatIndex: number }
		| { kind: 'divider'; key: string }
		| {
				kind: 'section';
				key: string;
				title: string | undefined;
				items: { item: MultiSelectorOptionData; flatIndex: number }[];
		  }
		| { kind: 'empty'; key: string };

	/**
	 * One match predicate, used by the flat filter (count + keyboard nav) and the
	 * grouped renderer alike, so what is shown while searching stays in lockstep
	 * with the announced count. Upstream extracted it for the same reason.
	 */
	function optionMatchesQuery(option: MultiSelectorOptionData, query: string): boolean {
		if (!query) {
			return true;
		}
		return (option.label ?? option.value).toLowerCase().includes(query.toLowerCase());
	}

	function filterOptionsByQuery(
		items: MultiSelectorOptionData[],
		query: string
	): MultiSelectorOptionData[] {
		if (!query) {
			return items;
		}
		return items.filter((item) => optionMatchesQuery(item, query));
	}
</script>

<script lang="ts" generics="T extends MultiSelectorOptionType">
	import { untrack } from 'svelte';
	import { useSize } from '../../internal/contexts.svelte.js';
	import { stableClassName } from '../../internal/naming.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { isImeKeyEvent } from '../../utils/ime.js';
	import { getInputARIA } from '../../utils/input-aria.js';
	import { useAnnounce } from '../../hooks/use-announce.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import Badge from '../badge/badge.svelte';
	import CheckboxInput from '../checkbox-input/checkbox-input.svelte';
	import Divider from '../divider/divider.svelte';
	import Field from '../field/field.svelte';
	import InputClearButton from '../field/input-clear-button.svelte';
	import PanelSearchInput from '../field/panel-search-input.svelte';
	import Icon from '../icon/icon.svelte';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import Spinner from '../spinner/spinner.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { useInputGroup } from '../input-group/input-group-context.svelte.js';
	import {
		getSelectableOptions,
		isDivider,
		isOptionData,
		isSection,
		normalizeOption
	} from '../selector/utils.js';
	import { useMultiCombobox } from './use-multi-combobox.svelte.js';
	import { useResolvedRequired } from '../../hooks/use-resolved-required.svelte.js';
	import {
		multiSelectorCheckboxDecorativeAttrs,
		multiSelectorChevronXstyle,
		multiSelectorDividerStyle,
		multiSelectorDropdownAttrs,
		multiSelectorEmptyStateAttrs,
		multiSelectorItemAttrs,
		multiSelectorItemLabelAttrs,
		multiSelectorPopoverOffset,
		multiSelectorPopoverStyle,
		multiSelectorSectionHeadingAttrs,
		multiSelectorStatusButtonAttrs,
		multiSelectorTriggerAttrs,
		multiSelectorTriggerBadgesAttrs,
		multiSelectorTriggerContainerAttrs,
		multiSelectorTriggerContentAttrs,
		multiSelectorTriggerIconStyle,
		multiSelectorTriggerOverflowAttrs,
		multiSelectorTriggerTextAttrs
	} from './multi-selector.stylex.js';

	/**
	 * A multi-select dropdown with checkboxes for choosing several items from a
	 * list of options — the whole `Field` shell around a `role="combobox"`
	 * trigger, or, inside an `InputGroup`, a bare control that borrows the group's
	 * label and collapses its border into the row.
	 *
	 * The popup is a `Popover` with `role: 'none'`, so the inner
	 * `role="listbox" aria-multiselectable` is the exposed semantics and the
	 * trigger keeps DOM focus. Toggling an option deliberately does *not* close
	 * the dropdown.
	 *
	 * **Strictly controlled — `value` is not `$bindable()`**, the rule `Selector`
	 * settled for the whole selector family: upstream never writes it back, and a
	 * local commit strands a controlled caller that does not commit.
	 *
	 * @example
	 * ```svelte
	 * <MultiSelector
	 *   label="Columns"
	 *   options={['Name', 'Email', 'Role', 'Status']}
	 *   value={selectedColumns}
	 *   onChange={(v) => (selectedColumns = v)}
	 *   hasSelectAll
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
		hasClear = false,
		hasSelectAll = false,
		selectAllLabel: selectAllLabelFromProps,
		hasSearch = false,
		searchPlaceholder: searchPlaceholderFromProps,
		triggerDisplay = 'count',
		maxBadges = 3,
		renderOption,
		indicatorPosition = 'start',
		isDefaultOpen = false,
		'data-testid': testId,
		htmlName,
		width,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: MultiSelectorProps<T> = $props();

	// Announce the effective required state (form default included) while the
	// native `required` stays bound to the explicit `isRequired`, so a layout
	// default never switches on browser validation.
	const isEffectivelyRequired = useResolvedRequired({
		isRequired: () => isRequired,
		isOptional: () => isOptional
	});

	const t = useTranslator();
	const placeholder = $derived(
		placeholderFromProps ?? t('@astryx.multiSelector.selectPlaceholder')
	);
	const selectAllLabel = $derived(selectAllLabelFromProps ?? t('@astryx.multiSelector.selectAll'));
	const searchPlaceholder = $derived(
		searchPlaceholderFromProps ?? t('@astryx.multiSelector.searchPlaceholder')
	);
	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));
	// A ghost trigger has no bordered surface for an `attached` message to hang
	// off, so it falls back to the detached box. An explicit `detached`/`tooltip`
	// passes through untouched.
	const effectiveStatusVariant = $derived(
		variant === 'ghost' && statusVariant === 'attached' ? 'detached' : statusVariant
	);

	// One base id with derived suffixes — the counterpart to upstream's six
	// `useId` calls, plus two the port needs: the layer's own id (upstream's
	// `useLayer` mints it internally; ours must be passed one) and the tooltip's.
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

	let triggerEl = $state<HTMLButtonElement | null>(null);
	// `PanelSearchInput` publishes its `<input>` through a bindable `ref` — the
	// Svelte spelling of upstream's `searchRef`.
	let searchEl = $state<HTMLInputElement | null>(null);

	const inputGroup = useInputGroup();

	let searchQuery = $state('');
	// A typed query shows the search row's clear (✕) button, which becomes the
	// next tab stop after the search input.
	const hasQuery = $derived(searchQuery.length > 0);

	// Snapshot of which values were selected when the dropdown opened. Held in
	// state (not a plain `let`) so `sortedItems` recomputes exactly once on open,
	// then stays frozen until the menu closes. `$state.raw` because the Set is
	// replaced wholesale and never mutated in place.
	let selectedAtOpen = $state.raw<Set<string> | null>(null);

	const optimistic = createOptimistic<string[]>(() => value);
	const optimisticValue = $derived(optimistic.current);
	const isBusy = $derived(isLoading || optimisticValue !== value);

	// Disabled-reason tooltip. Disabled controls swallow pointer events, so the
	// tooltip listeners attach to the trigger container (which already exists)
	// and the trigger button stays perceivable via aria-disabled instead of the
	// disabled attribute. Activation is blocked by the isDisabled guards in
	// useMultiCombobox (onTriggerClick / onKeyDown).
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

	// Announce selection-count changes politely (comboboxes-7 announce path).
	// Toggling options / select-all previously produced no audible feedback.
	const announce = useAnnounce();
	function announceSelection(nextValue: string[]): void {
		const items = selectableItems;
		const total = items.length;
		const selectableSet = new Set(items.map((item) => item.value));
		const selectedCount = nextValue.filter((v) => selectableSet.has(v)).length;
		if (selectedCount === 0) {
			announce('Selection cleared');
		} else if (total > 0 && selectedCount === total) {
			announce('All selected');
		} else {
			announce(`${selectedCount} of ${total} selected`);
		}
	}

	// Filter items by search query
	const filteredItems = $derived(filterOptionsByQuery(selectableItems, searchQuery));

	/**
	 * Announce the filtered result count from the query-change handler (matching
	 * `BaseTypeahead`) rather than a reactive effect: computing the count for the
	 * *next* query here fires the announcement exactly once per keystroke and does
	 * not re-speak on unrelated re-renders. Reuses the announce instance shared
	 * with the selection-count announcements above.
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

	// Single source of truth for item order. Both the hook (keyboard navigation)
	// and the render entries below consume this list — no independent sorting.
	// Selected-at-open items are placed first within each group/section, and the
	// same walk applies while searching so group structure survives filtering
	// (only matching items are kept; the query is empty in non-search mode).
	//
	// The searching branch used to be a separate, flat sort. That is what made a
	// searched list lose its group headers, and removing it is the other half of
	// 0.2.0's fix — the render walk below can only keep a section's header if the
	// items feeding it still arrive in section order.
	const sortedItems = $derived.by((): MultiSelectorOptionData[] => {
		const selectedSet = selectedAtOpen ?? new Set<string>();
		const result: MultiSelectorOptionData[] = [];
		let pendingFlat: MultiSelectorOptionData[] = [];

		const orderSelectedFirst = (items: MultiSelectorOptionData[]): MultiSelectorOptionData[] => {
			const selected = items.filter((item) => selectedSet.has(item.value));
			const unselected = items.filter((item) => !selectedSet.has(item.value));
			return [...selected, ...unselected];
		};

		const flushFlat = (): void => {
			if (pendingFlat.length === 0) {
				return;
			}
			result.push(...orderSelectedFirst(pendingFlat));
			pendingFlat = [];
		};

		for (const option of options) {
			if (isDivider(option)) {
				flushFlat();
			} else if (isSection(option)) {
				flushFlat();
				const sectionOptions = option.options
					.map((opt) => normalizeOption(opt))
					.filter((opt) => optionMatchesQuery(opt, searchQuery));
				result.push(...orderSelectedFirst(sectionOptions));
			} else if (isOptionData(option)) {
				const normalized = normalizeOption(option);
				if (optionMatchesQuery(normalized, searchQuery)) {
					pendingFlat.push(normalized);
				}
			}
		}
		flushFlat();

		if (hasSelectAll) {
			return [{ value: SELECT_ALL_VALUE, label: selectAllLabel }, ...result];
		}
		return result;
	});

	function handleLayerHide(): void {
		searchQuery = '';
		selectedAtOpen = null;
		// Clear any lingering result count when the popover closes, so stale status
		// text does not linger in the a11y tree. The live regions are a document-level
		// singleton, so a count left behind sits in the *shared* `role="status"` node
		// every other component speaks through — and the auto-clear is 2s away.
		// `Selector` already does this; this was the one place the two diverged.
		announce('');
		triggerEl?.focus();
	}

	const popover = usePopover(() => ({
		id: popoverId,
		hasLightDismiss: true,
		onHide: handleLayerHide,
		hasCloseButton: false,
		hasAutoFocus: false,
		// The popup's own role="listbox" is the exposed semantics; the trigger
		// keeps DOM focus, so wrapping it in a modal dialog would misrepresent it.
		role: 'none' as const,
		// The theme target belongs on the SURFACE that paints the popup, which
		// `usePopover` owns — not on the scrolling list inside it.
		surfaceTarget: 'multi-selector-popup'
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
	 * Clear all selected values. Shared by the clear button and the keyboard
	 * Delete/Backspace path so clearing is reachable without a mouse.
	 */
	function clearValues(): void {
		onChange([]);
		announceSelection([]);
		if (changeAction) {
			void optimistic.run([], () => changeAction([]));
		}
	}

	/** Whether there is at least one selected value (clearing is meaningful). */
	const hasValue = $derived(optimisticValue.length > 0);

	function handleClear(e: MouseEvent): void {
		e.stopPropagation(); // Don't open dropdown
		clearValues();
	}

	function handleToggle(itemValue: string): void {
		// The pre-toggle list is read into a plain local *before* `optimistic.run`
		// installs the override — the `ToggleButton` race, which reaches here too
		// because `run` awaits and a live `$derived` re-read would see the value it
		// just wrote.
		const current = optimisticValue;
		const newValue = current.includes(itemValue)
			? current.filter((v) => v !== itemValue)
			: [...current, itemValue];

		onChange(newValue);
		announceSelection(newValue);
		if (changeAction) {
			void optimistic.run(newValue, () => changeAction(newValue));
		}
	}

	// Select-all logic
	const enabledItems = $derived(filteredItems.filter((item) => !item.disabled));

	const allEnabledSelected = $derived(
		enabledItems.length > 0 && enabledItems.every((item) => optimisticValue.includes(item.value))
	);

	const someSelected = $derived(enabledItems.some((item) => optimisticValue.includes(item.value)));

	const selectAllState = $derived<boolean | 'indeterminate'>(
		allEnabledSelected ? true : someSelected ? 'indeterminate' : false
	);

	function handleSelectAll(): void {
		// Same pre-read as `handleToggle`: plain locals, captured before
		// `optimistic.run` installs the override.
		const current = optimisticValue;
		const enabled = enabledItems;
		const wasAllSelected = allEnabledSelected;
		let newValue: string[];
		if (wasAllSelected) {
			// Deselect all enabled items, keep disabled items that are selected
			const enabledValues = new Set(enabled.map((item) => item.value));
			newValue = current.filter((v) => !enabledValues.has(v));
		} else {
			// Select all enabled items
			const currentSet = new Set(current);
			newValue = [...current];
			for (const item of enabled) {
				if (!currentSet.has(item.value)) {
					newValue.push(item.value);
				}
			}
		}

		onChange(newValue);
		announceSelection(newValue);
		if (changeAction) {
			void optimistic.run(newValue, () => changeAction(newValue));
		}
	}

	/** Route toggle: select-all sentinel → `handleSelectAll`, everything else → `handleToggle`. */
	function handleNavigableToggle(itemValue: string): void {
		if (itemValue === SELECT_ALL_VALUE) {
			handleSelectAll();
		} else {
			handleToggle(itemValue);
		}
	}

	// Multi-select combobox behavior — index-based, matching useCombobox.
	// sortedItems is the single source of truth for item order.
	const combobox = useMultiCombobox(() => ({
		selectableItems: sortedItems,
		isDisabled,
		isOpen: popover.isOpen,
		hasSearch,
		onOpen: () => {
			// Snapshot which items are selected at open time — sort is frozen
			// until close.
			selectedAtOpen = new Set(optimisticValue);

			popover.show();
			if (hasSearch) {
				// Focus search after popover opens
				requestAnimationFrame(() => {
					searchEl?.focus();
				});
			}
		},
		onClose: popover.hide,
		onToggle: handleNavigableToggle,
		onClear: hasClear ? clearValues : undefined,
		hasValue,
		listboxId
	}));

	// Keep the highlighted option visible during keyboard navigation. The
	// listbox is a fixed-height scroll container, so without this the virtual
	// cursor walks off-screen once navigation passes the visible window.
	$effect(() => {
		const isOpen = popover.isOpen;
		const index = combobox.highlightedIndex;
		if (!isOpen || index < 0) {
			return;
		}
		// `getItemId` reads the whole options bag, so an untracked read is what
		// keeps this effect's dependency set to upstream's two — the correction
		// `Selector`'s identical effect records.
		const itemId = untrack(() => combobox.getItemId(index));
		document.getElementById(itemId)?.scrollIntoView?.({ block: 'nearest' });
	});

	// Build trigger display content
	const selectedLabels = $derived(
		optimisticValue.map((v) => {
			const item = selectableItems.find((i) => i.value === v);
			return item?.label ?? v;
		})
	);

	const labelsText = $derived.by(() => {
		const displayed = selectedLabels.slice(0, 3);
		const remaining = selectedLabels.length - displayed.length;
		return remaining > 0 ? `${displayed.join(', ')}, +${remaining}` : displayed.join(', ');
	});

	const displayedBadges = $derived(selectedLabels.slice(0, maxBadges));
	const remainingBadges = $derived(selectedLabels.length - displayedBadges.length);

	/**
	 * The rows to render, walking `options` exactly as upstream's `renderOptions`
	 * loop does — including the `cursor` that item ids and the highlight are keyed
	 * on. `sortedItems` supplies the items; the structural elements (dividers,
	 * section headers) come from the original `options` prop.
	 */
	const renderEntries = $derived.by((): MultiSelectorRenderEntry[] => {
		const entries: MultiSelectorRenderEntry[] = [];
		let cursor = 0;

		// Number of real items (excluding the select-all sentinel)
		const realItemCount = hasSelectAll ? sortedItems.length - 1 : sortedItems.length;

		// Show select-all only when there are real items to select. It reads as
		// the first row of the list, not a section of its own — no divider under
		// it (the checkbox column already lines it up with the options below), and
		// upstream's storybook names the divider we used to draw here as an a11y
		// failure: a `role="separator"` inside `role="listbox"`.
		if (hasSelectAll && realItemCount > 0) {
			entries.push({ kind: 'item', key: sortedItems[0].value, item: sortedItems[0], flatIndex: 0 });
			cursor = 1;
		} else if (hasSelectAll) {
			// Skip the select-all sentinel when there are no real items
			cursor = 1;
		}

		// Empty state — no real items to show
		if (realItemCount === 0) {
			entries.push({ kind: 'empty', key: 'empty' });
			return entries;
		}

		// Consume items from sortedItems in order, interleaving structural elements
		// (dividers, section headers) from the options prop. While searching, only
		// matching items are present in sortedItems, so a section consumes just its
		// matches and is skipped entirely when none match — no header left standing
		// over nothing, and the cursor stays aligned with the combobox indices.
		//
		// This used to bail out to a flat list as soon as a query existed, which is
		// what 0.2.0 fixed: typing dropped every group header, so a searched list
		// lost the structure an unsearched one had.
		const isSearching = Boolean(searchQuery);
		let pendingCount = 0;

		const flushPending = (): void => {
			for (let j = 0; j < pendingCount; j++) {
				entries.push({
					kind: 'item',
					key: sortedItems[cursor].value,
					item: sortedItems[cursor],
					flatIndex: cursor
				});
				cursor++;
			}
			pendingCount = 0;
		};

		for (let i = 0; i < options.length; i++) {
			const option = options[i];

			if (isDivider(option)) {
				flushPending();
				// A standalone divider between groups would orphan itself once its
				// neighbours are filtered out, so skip it while searching.
				if (!isSearching) {
					entries.push({ kind: 'divider', key: `divider-${i}` });
				}
			} else if (isSection(option)) {
				flushPending();
				const matchCount = isSearching
					? option.options.filter((opt) => optionMatchesQuery(normalizeOption(opt), searchQuery))
							.length
					: option.options.length;
				if (matchCount === 0) {
					continue;
				}
				const items: { item: MultiSelectorOptionData; flatIndex: number }[] = [];
				for (let j = 0; j < matchCount; j++) {
					items.push({ item: sortedItems[cursor], flatIndex: cursor });
					cursor++;
				}
				entries.push({ kind: 'section', key: `section-${i}`, title: option.title, items });
			} else if (isOptionData(option)) {
				if (!isSearching || optionMatchesQuery(normalizeOption(option), searchQuery)) {
					pendingCount++;
				}
			}
		}
		flushPending();

		return entries;
	});

	// Two tables, as upstream declares them, not one read twice. Their values
	// coincide today, so collapsing them renders identically — but they answer
	// different questions (*which icon* vs *which colour token*), and a future
	// upstream change to either would land silently on the wrong axis.
	const STATUS_ICON_MAP: Record<MultiSelectorStatusType, IconName> = {
		warning: 'warning',
		error: 'error',
		success: 'success'
	};

	const STATUS_ICON_COLOR_MAP: Record<MultiSelectorStatusType, 'warning' | 'error' | 'success'> = {
		warning: 'warning',
		error: 'error',
		success: 'success'
	};

	/** Accessible-name keys for the `tooltip` variant's focusable status button. */
	const STATUS_BUTTON_LABEL_KEY: Record<MultiSelectorStatusType, string> = {
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

	const theme = $derived(
		themeProps('multi-selector', {
			variant,
			size,
			status: status?.type ?? null,
			disabled: isDisabled ? 'disabled' : null
		})
	);
	// Upstream merges each of these with `mergeProps(themeProps(…),
	// stylex.props(…))`; where the target contributes only a class, `cx` is the
	// whole of that merge. `multi-selector-option` carries data attributes too, so
	// it is spread as well.
	const searchTheme = themeProps('multi-selector-search');
	const emptyStateTheme = themeProps('multi-selector-empty-state');
	const sectionHeadingTheme = themeProps('multi-selector-section-heading');
	const containerAttrs = $derived(
		multiSelectorTriggerContainerAttrs(
			size,
			variant,
			status?.type,
			isDisabled,
			optimisticValue.length === 0,
			inputGroup != null,
			xstyle
		)
	);
	const triggerAttrs = multiSelectorTriggerAttrs();
	const triggerContentAttrs = multiSelectorTriggerContentAttrs();
	const triggerTextAttrs = multiSelectorTriggerTextAttrs();
	const triggerBadgesAttrs = multiSelectorTriggerBadgesAttrs();
	const triggerOverflowAttrs = multiSelectorTriggerOverflowAttrs();
	const chevronXstyle = $derived(multiSelectorChevronXstyle(popover.isOpen));
	const statusButtonAttrs = multiSelectorStatusButtonAttrs();
	const dropdownAttrs = multiSelectorDropdownAttrs();
	const checkboxDecorativeAttrs = $derived(
		multiSelectorCheckboxDecorativeAttrs(indicatorPosition === 'end')
	);
	const emptyStateAttrs = multiSelectorEmptyStateAttrs();
	const sectionHeadingAttrs = multiSelectorSectionHeadingAttrs();
	const itemLabelAttrs = multiSelectorItemLabelAttrs();
	// Upstream's `xstyle: styles.popover` — no `layerAnimations` entry, which this
	// port used to append and upstream has never had.
	const layerXstyle = multiSelectorPopoverStyle;
</script>

{#snippet startIconSlot()}
	{#if typeof startIcon === 'string'}
		<Icon icon={startIcon} size="sm" color="secondary" />
	{:else if startIcon}
		{@render startIcon()}
	{/if}
{/snippet}

{#snippet triggerContent()}
	{#if optimisticValue.length === 0}
		<span class={triggerTextAttrs.class} style={triggerTextAttrs.style}>{placeholder}</span>
	{:else if triggerDisplay === 'count'}
		<span class={triggerTextAttrs.class} style={triggerTextAttrs.style}>
			{optimisticValue.length} selected
		</span>
	{:else if triggerDisplay === 'labels'}
		<span class={triggerTextAttrs.class} style={triggerTextAttrs.style}>{labelsText}</span>
	{:else}
		<span class={triggerBadgesAttrs.class} style={triggerBadgesAttrs.style}>
			<!--
				Keyed by position, not by label: upstream's `key={label}` tolerates the
				duplicate two options sharing a label would produce (React warns);
				Svelte throws on a duplicate key, so the index is the safe equivalent.
			-->
			{#each displayedBadges as badgeLabel, badgeIndex (badgeIndex)}
				<Badge label={badgeLabel} variant="neutral" />
			{/each}
			{#if remainingBadges > 0}
				<span class={triggerOverflowAttrs.class} style={triggerOverflowAttrs.style}>
					+{remainingBadges}
				</span>
			{/if}
		</span>
	{/if}
{/snippet}

{#snippet optionRow(item: MultiSelectorOptionData, flatIndex: number)}
	{@const isSelectAll = item.value === SELECT_ALL_VALUE}
	{@const isSelected = isSelectAll ? allEnabledSelected : optimisticValue.includes(item.value)}
	{@const checkboxValue = isSelectAll ? selectAllState : isSelected}
	{@const isPartiallySelected = isSelectAll && selectAllState === 'indeterminate'}
	{@const attrs = multiSelectorItemAttrs(
		size,
		isSelectAll,
		flatIndex === combobox.highlightedIndex,
		item.disabled === true
	)}
	{@const optionTheme = themeProps('multi-selector-option', {
		size,
		'select-all': isSelectAll ? 'select-all' : null,
		selected: isSelected ? 'selected' : null,
		disabled: item.disabled ? 'disabled' : null
	})}
	<!--
		A `role="option"` div with click + hover handlers, as upstream renders. The
		keyboard model is the combobox's — the trigger (or the search input) keeps
		DOM focus and drives toggling through `aria-activedescendant` — so the row
		itself is deliberately not a tab stop and has no key handler of its own.

		One target for every dropdown row, carrying the row's size and runtime state
		so a theme can express "selected option at large" or restyle just the Select
		All row (`.select-all`) without reaching for structural selectors.
		No `svelte-ignore` pair here, unlike `Selector`'s otherwise identical row: the
		`{...optionTheme}` spread below makes the element's attributes opaque to the
		a11y analysis, so it emits no warning to ignore and lint rejects a dead
		directive. Restore both if the spread ever goes.
	-->
	<div
		id={combobox.getItemId(flatIndex)}
		role="option"
		aria-selected={isSelected}
		aria-label={isPartiallySelected
			? t('@astryx.multiSelector.selectAllPartiallySelected', { label: selectAllLabel })
			: undefined}
		aria-disabled={item.disabled}
		onclick={() => {
			if (!item.disabled) {
				handleNavigableToggle(item.value);
			}
		}}
		onmouseenter={() => combobox.onItemMouseEnter(item, flatIndex)}
		{...optionTheme}
		class={cx(optionTheme.class, attrs.class)}
		style={attrs.style}
	>
		{#snippet checkbox()}
			<div inert class={checkboxDecorativeAttrs.class} style={checkboxDecorativeAttrs.style}>
				<CheckboxInput
					label=""
					isLabelHidden
					value={checkboxValue}
					onChange={() => {}}
					isDisabled={item.disabled}
					size={size === 'lg' ? 'md' : size}
				/>
			</div>
		{/snippet}
		{#if indicatorPosition === 'start'}{@render checkbox()}{/if}
		{#if renderOption && !isSelectAll}
			{@render renderOption(item)}
		{:else}
			<span class={itemLabelAttrs.class} style={itemLabelAttrs.style}>
				{item.label ?? item.value}
			</span>
		{/if}
		{#if indicatorPosition === 'end'}{@render checkbox()}{/if}
	</div>
{/snippet}

{#snippet listbox()}
	<div id={listboxId} role="listbox" aria-multiselectable="true" aria-labelledby={triggerId}>
		{#each renderEntries as entry (entry.key)}
			{#if entry.kind === 'item'}
				{@render optionRow(entry.item, entry.flatIndex)}
			{:else if entry.kind === 'divider'}
				<Divider xstyle={multiSelectorDividerStyle} />
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
				<!--
					role="presentation" keeps the message out of the listbox's
					accessibility tree (role="listbox" only permits option/group children);
					the no-results outcome is announced via the result-count live region
					instead.
				-->
				<div
					role="presentation"
					class={cx(emptyStateTheme.class, emptyStateAttrs.class)}
					style={emptyStateAttrs.style}
				>
					No results found
				</div>
			{/if}
		{/each}
	</div>
{/snippet}

{#snippet multiSelectorContent()}
	<!--
		The container is the click target and the tooltip/popover anchor. It is not
		focusable and carries no role: the `role="combobox"` button inside it is the
		control, and the click handler exists only to widen the hit area over the
		padding, spinner and chevron — every one of which sits inside the same
		trigger the button already exposes to keyboard users.
	-->
	<div
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
			{...rest}
			bind:this={triggerEl}
			id={triggerId}
			type="button"
			role={hasSearch ? undefined : 'combobox'}
			aria-haspopup="listbox"
			aria-expanded={popover.isOpen}
			aria-controls={listboxId}
			aria-activedescendant={!hasSearch && popover.isOpen && combobox.highlightedIndex >= 0
				? combobox.getItemId(combobox.highlightedIndex)
				: undefined}
			aria-describedby={aria.ariaDescribedBy}
			aria-labelledby={aria.ariaLabelledBy}
			aria-required={isEffectivelyRequired() ? 'true' : undefined}
			aria-invalid={status?.type === 'error' ? 'true' : undefined}
			aria-busy={isBusy || undefined}
			disabled={isDisabled && !showsDisabledMessage}
			aria-disabled={showsDisabledMessage ? 'true' : undefined}
			onkeydown={combobox.onKeyDown}
			tabindex={isDisabled && !showsDisabledMessage ? -1 : 0}
			class={triggerAttrs.class}
			style={triggerAttrs.style}
		>
			<span class={triggerContentAttrs.class} style={triggerContentAttrs.style}>
				{@render triggerContent()}
			</span>
		</button>
		{#if htmlName != null}
			{#each value as v, hiddenIndex (hiddenIndex)}
				<!--
					Disabled native controls are excluded from form submission; mirror
					that for the hidden carriers.
				-->
				<input type="hidden" name={htmlName} value={v} disabled={isDisabled} />
			{/each}
		{/if}
		{#if isBusy}
			<Spinner size="sm" />
		{/if}
		{#if hasClear && value.length > 0 && !isDisabled}
			<!--
				The shared clear affordance, so the multi-selector's ✕ behaves like every
				other input's. `iconClassName` keeps the component-specific
				`astryx-multi-selector-clear-icon` target emitting through its
				deprecation window, alongside the shared `astryx-input-clear-icon`.
			-->
			<InputClearButton
				label={t('@astryx.multiSelector.clearAll', { label })}
				onclick={handleClear}
				iconClassName={stableClassName('multi-selector-clear-icon')}
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
						xstyle={multiSelectorTriggerIconStyle}
					/>
				</button>
			{:else}
				<Icon
					icon={STATUS_ICON_MAP[status.type]}
					size="sm"
					color={STATUS_ICON_COLOR_MAP[status.type]}
					xstyle={multiSelectorTriggerIconStyle}
				/>
			{/if}
		{:else}
			<!--
				The rotation rides on the glyph, alongside the box and colour the wrapper
				used to provide, so one element carries the mark, its open/closed
				transform, and the `multi-selector-indicator-icon` theme target — plus
				its state as `data-state`, so a theme can style the two independently.
			-->
			<Icon
				icon="chevronDown"
				size="sm"
				color="secondary"
				xstyle={chevronXstyle}
				{...themeProps('multi-selector-indicator-icon', {
					state: popover.isOpen ? 'expanded' : 'collapsed'
				})}
			/>
		{/if}
	</div>

	<PopoverLayer
		{popover}
		placement="below"
		alignment="start"
		offset={multiSelectorPopoverOffset}
		xstyle={layerXstyle}
	>
		{#if hasSearch}
			<!--
				With a search row the panel splits: the header stays put while the
				options scroll under it, so the field does not slide out of reach in a
				long list. Without one the panel is a single scroll container, exactly as
				before.
			-->
			<div>
				<!--
					The search row is the panel's header: a magnifier, a borderless input,
					and the shared clear (✕) button. It deliberately does NOT render a
					bordered `TextInput` — the popup is already a bordered surface, and a
					field inside it drew a second box within that box.

					When hasSearch is set, focus moves into this input on open, so it — not
					the trigger — must be the combobox reporting the highlighted option via
					aria-activedescendant (comboboxes-4). `role` + `aria-*` pass through to
					the underlying `<input>`.
				-->
				<PanelSearchInput
					bind:ref={searchEl}
					id={searchId}
					label={t('@astryx.multiSelector.searchOptions')}
					clearLabel={t('@astryx.textInput.clearLabel', {
						label: t('@astryx.multiSelector.searchOptions')
					})}
					class={searchTheme.class}
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
						// An in-progress IME composition uses these same keys (Enter to
						// commit the candidate, Escape/Arrows to navigate the candidate
						// window); the composing keydown fires before compositionend, so
						// without this guard a Korean/Japanese/Chinese user committing a
						// syllable with Enter would instead toggle the highlighted option.
						// See utils/ime.ts.
						if (isImeKeyEvent(e)) {
							return;
						}
						// Arrow keys navigate options; Enter toggles; Escape closes.
						// Space and Home/End are left to the input (type a space / move
						// the caret) per the APG editable combobox; PageUp/PageDown are
						// the sanctioned substitute for jumping to the first/last option.
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
					row and the option list each hold their own inline padding, the line
					does not, so it reads as the panel's own edge.
				-->
				<Divider />
				<div class={dropdownAttrs.class} style={dropdownAttrs.style}>
					{@render listbox()}
				</div>
			</div>
		{:else}
			<div class={dropdownAttrs.class} style={dropdownAttrs.style}>
				{@render listbox()}
			</div>
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
	{@render multiSelectorContent()}
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
		{@render multiSelectorContent()}
	</Field>
{/if}
