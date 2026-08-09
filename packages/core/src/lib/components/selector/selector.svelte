<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { IconName } from '../icon/icon-registry.js';
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
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { getInputARIA } from '../../utils/input-aria.js';
	import { useAnnounce } from '../../hooks/use-announce.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import Divider from '../divider/divider.svelte';
	import Field from '../field/field.svelte';
	import Icon from '../icon/icon.svelte';
	import { layerAnimations } from '../layer/layer-animations.stylex.js';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import Spinner from '../spinner/spinner.svelte';
	import TextInput from '../text-input/text-input.svelte';
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
		selectorClearButtonAttrs,
		selectorDividerStyle,
		selectorDropdownAttrs,
		selectorEmptyStateAttrs,
		selectorItemAttrs,
		selectorItemContentAttrs,
		selectorPopoverStyle,
		selectorSearchWrapperAttrs,
		selectorSectionDividerStyle,
		selectorStatusButtonAttrs,
		selectorTriggerAttrs,
		selectorTriggerContainerAttrs,
		selectorTriggerIconAttrs,
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

	let triggerEl = $state<HTMLButtonElement | null>(null);
	let searchWrapperEl = $state<HTMLDivElement | null>(null);
	let listboxEl = $state<HTMLDivElement | null>(null);

	/**
	 * Upstream holds a `ref` on the search field; our `TextInput` publishes no
	 * element ref (a Svelte component has none unless it exports one), so the
	 * `<input>` is reached through the padding wrapper it is the only input
	 * inside. Read at call time rather than cached, because the wrapper and the
	 * field mount together with the popover.
	 */
	function searchInputEl(): HTMLInputElement | null {
		return searchWrapperEl?.querySelector('input') ?? null;
	}

	const inputGroup = useInputGroup();

	let searchQuery = $state('');
	// A typed query shows TextInput's built-in clear (✕) button, which becomes
	// the next tab stop after the search input.
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

	function handleLayerHide(): void {
		searchQuery = '';
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
		role: 'none' as const
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
		triggerEl
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
		emit?.(null);
		if (emitAction) {
			void optimistic.run(undefined, () => emitAction(null));
		}
	}

	function selectValue(newValue: string): void {
		emit?.(newValue);
		if (emitAction) {
			void optimistic.run(newValue, () => emitAction(newValue));
		}
	}

	// Selector behavior (keyboard nav, typeahead, selection)
	const combobox = useCombobox(() => ({
		selectableItems: filteredItems,
		value: normalizedValue,
		isDisabled,
		isOpen: popover.isOpen,
		hasSearch,
		onOpen: () => {
			popover.show();
			if (hasSearch) {
				requestAnimationFrame(() => {
					searchInputEl()?.focus();
				});
			}
		},
		onClose: popover.hide,
		onSelect: selectValue,
		onClear: hasClear ? clearValue : undefined,
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
		// `getItemId` reads the whole combobox options bag (`filteredItems`,
		// `normalizedValue`, `isDisabled`, `hasSearch`), so an untracked read is
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

	const theme = $derived(themeProps('selector', { variant, size, status: status?.type ?? null }));
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
	const triggerIconAttrs = $derived(selectorTriggerIconAttrs(showStatusIcon, popover.isOpen));
	const clearAttrs = selectorClearButtonAttrs();
	const statusButtonAttrs = selectorStatusButtonAttrs();
	const dropdownAttrs = $derived(selectorDropdownAttrs(isPositioned));
	const searchWrapperAttrs = selectorSearchWrapperAttrs();
	const emptyStateAttrs = selectorEmptyStateAttrs();
	const layerXstyle = $derived([selectorPopoverStyle, layerAnimations[popoverPlacement]]);
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

<!--
	Upstream passes the icon *name* (`startIcon="search"`) and `TextInput` runs it
	through `renderIconSlot(icon, {size: 'sm', color: 'secondary'})`. Our
	`TextInput.startIcon` takes only a `Snippet`, so the caller spells out what
	that helper would have produced — the same element, the same two props.
-->
{#snippet searchMagnifier()}
	<Icon icon="search" size="sm" color="secondary" />
{/snippet}

{#snippet optionRow(item: SelectorOptionData, flatIndex: number)}
	{@const isHighlighted = flatIndex === combobox.highlightedIndex}
	{@const isSelected = item.value === normalizedValue}
	{@const attrs = selectorItemAttrs(size, isHighlighted, isSelected, item.disabled === true)}
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
		<span class={selectorItemContentAttrs().class} style={selectorItemContentAttrs().style}>
			{#if renderOption}{@render renderOption(item)}{:else}{@render defaultOption(item)}{/if}
		</span>
		{#if isSelected}
			<Icon icon="check" size="sm" color="accent" />
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
		<div role="presentation" class={emptyStateAttrs.class} style={emptyStateAttrs.style}>
			No results found
		</div>
	{:else}
		{#each renderEntries as entry (entry.key)}
			{#if entry.kind === 'divider'}
				<Divider xstyle={selectorDividerStyle} />
			{:else if entry.kind === 'section'}
				{#if entry.title}
					<Divider label={entry.title} xstyle={selectorSectionDividerStyle} />
				{/if}
				<div role="group" aria-label={entry.title}>
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
			aria-required={isRequired ? 'true' : undefined}
			aria-invalid={status?.type === 'error' ? 'true' : undefined}
			aria-busy={isBusy || undefined}
			disabled={isDisabled && !showsDisabledMessage}
			aria-disabled={showsDisabledMessage ? 'true' : undefined}
			onkeydown={combobox.onKeyDown}
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
			<button
				type="button"
				onclick={handleClear}
				aria-label={t('@astryx.selector.clearLabel', { label })}
				class={clearAttrs.class}
				style={clearAttrs.style}
			>
				<!--
					Stable theme target on the clear glyph itself, so a theme can restyle
					just this icon (colour, size, hover) via `defineTheme`. Same-element
					rules in `@layer astryx-theme` win over the icon's own base colour and
					size, which a button-level target could not reach.
				-->
				<Icon icon="close" size="sm" color="secondary" {...themeProps('selector-clear-icon')} />
			</button>
		{/if}
		<span class={triggerIconAttrs.class} style={triggerIconAttrs.style}>
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
						/>
					</button>
				{:else}
					<Icon
						icon={STATUS_ICON_MAP[status.type]}
						size="sm"
						color={STATUS_ICON_COLOR_MAP[status.type]}
					/>
				{/if}
			{:else}
				<!--
					As above, plus the chevron's open/closed state as `data-state`, so a
					theme can style the two independently.
				-->
				<Icon
					icon="chevronDown"
					size="sm"
					color="inherit"
					{...themeProps('selector-indicator-icon', {
						state: popover.isOpen ? 'expanded' : 'collapsed'
					})}
				/>
			{/if}
		</span>
	</div>

	<PopoverLayer
		{popover}
		placement={popoverPlacement}
		alignment="start"
		xstyle={layerXstyle}
		style={popoverOffsetStyle}
	>
		{#if hasSearch}
			<div>
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					bind:this={searchWrapperEl}
					class={searchWrapperAttrs.class}
					style={searchWrapperAttrs.style}
					onkeydown={(e) => {
						// The clear (✕) button lives inside the TextInput, after the input in
						// DOM order. When it is focused and the user tabs forward there is
						// nothing else in the popup, so dismiss it (Shift+Tab returns to the
						// input natively). Key events originating on the input are handled on
						// the input below; ignore them here so we don't double-dismiss.
						if (e.target === searchInputEl()) {
							return;
						}
						if (e.key === 'Tab' && !e.shiftKey) {
							combobox.onKeyDown(e);
						}
					}}
				>
					<!--
						The search field IS a TextInput: the leading magnifier is its
						`startIcon` and the trailing clear (✕) is its built-in `hasClear`
						(which resets the value and refocuses the input). We add no bespoke
						affordance chrome — the field just looks and behaves like every other
						Astryx input.

						When hasSearch is set, focus moves into this input on open, so it —
						not the trigger — must be the combobox that reports the highlighted
						option via aria-activedescendant (comboboxes-4). A bare searchbox
						left the highlight silent to screen readers. role + aria-* pass
						through to the underlying `<input>` via BaseProps.

						`width="100%"` fills the dropdown's width (minus the wrapper's inline
						padding) so the field is flush end-to-end rather than sized to its
						content.
					-->
					<TextInput
						id={searchId}
						label={t('@astryx.selector.searchOptions')}
						isLabelHidden
						startIcon={searchMagnifier}
						hasClear
						size="sm"
						width="100%"
						role="combobox"
						aria-expanded={popover.isOpen}
						aria-controls={listboxId}
						aria-autocomplete="list"
						aria-activedescendant={popover.isOpen && combobox.highlightedIndex >= 0
							? combobox.getItemId(combobox.highlightedIndex)
							: undefined}
						value={searchQuery}
						onChange={handleSearchChange}
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
				</div>
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
