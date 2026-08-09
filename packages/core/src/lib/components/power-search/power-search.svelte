<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { IconName } from '../icon/icon-registry.js';
	import type { InputStatus } from '../field/types.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';
	import type { TokenizerOverflowBehavior } from '../tokenizer/tokenizer.svelte';
	import type {
		PartialFilter,
		PowerSearchChangeType,
		PowerSearchComponents,
		PowerSearchConfig,
		PowerSearchFilter
	} from './types.js';

	export type PowerSearchSize = 'sm' | 'md' | 'lg';

	export interface PowerSearchProps extends Omit<BaseProps<HTMLElement>, 'onChange'> {
		/** PowerSearch configuration defining available fields and operators. */
		config: PowerSearchConfig;
		/** Currently active filters. */
		filters: ReadonlyArray<PowerSearchFilter>;
		/** Called when filters change. */
		onChange: (
			filters: ReadonlyArray<PowerSearchFilter>,
			changeType: PowerSearchChangeType,
			index: number
		) => void;
		/** Accessible label. @default 'Search' */
		label?: string;
		/** Visually hide the label. @default true */
		isLabelHidden?: boolean;
		/** Placeholder text. @default 'Search…' */
		placeholder?: string;
		/** Auto-focus on mount. @default false */
		hasAutoFocus?: boolean;
		/** Show clear button. @default true */
		hasClear?: boolean;
		/** Whether the input is read-only. @default false */
		isReadOnly?: boolean;
		/** Whether the input is disabled. @default false */
		isDisabled?: boolean;
		/**
		 * Explains why the search is disabled. When set together with `isDisabled`,
		 * the search shows a tooltip with this text on hover and keyboard focus, and
		 * the input stays focusable (via `aria-disabled`) so the reason is
		 * discoverable by keyboard and assistive technology. Input stays blocked.
		 *
		 * Use this instead of wrapping a disabled PowerSearch in `Tooltip` — disabled
		 * controls don't emit the pointer events an external tooltip needs.
		 */
		disabledMessage?: string;
		/** Icon to display at the start of the input. */
		startIcon?: IconName | Snippet;
		/** Fires when focus enters the search input from outside. */
		onFocus?: (e: FocusEvent) => void;
		/** Fires when focus leaves the search input entirely. */
		onBlur?: (e: FocusEvent) => void;
		/** Validation status. */
		status?: InputStatus;
		/**
		 * How the status message is placed relative to the input.
		 * - `attached`: message overlaps directly below the input (bordered treatment)
		 * - `detached`: message floats below as a separate element with spacing
		 * @default 'attached'
		 */
		statusVariant?: FieldStatusVariant;
		/** Max width for dropdown menu. */
		menuWidth?: number;
		/** Max display length for filter token values. @default 40 */
		maxTokenLength?: number;
		/** Max items in operator dropdown. */
		maxOperatorMenuItems?: number;
		/** Label for the save button in edit popover. @default 'Apply' */
		popoverSaveButtonLabel?: string;
		/** Timezone ID for date formatting. */
		timezoneID?: string;
		/**
		 * Controls how tokens overflow when the container is too narrow.
		 * Forwarded to Tokenizer.
		 * @default 'none'
		 */
		tokenOverflowBehavior?: TokenizerOverflowBehavior;
		/**
		 * Content to display at the end of the input row.
		 * Useful for action buttons or other controls.
		 */
		endContent?: Snippet;
		/**
		 * Number of results matching the current filters.
		 * When a number, formatted as "N results". When a string, displayed as-is.
		 */
		resultCount?: number | string;
		/**
		 * Size of the search input.
		 * @default 'md'
		 */
		size?: PowerSearchSize;
		/**
		 * Per-type component overrides for token and editor rendering.
		 * Keys are operator value types (e.g. 'string', 'enum', 'date_absolute').
		 */
		components?: PowerSearchComponents;
	}

	// =============================================================================
	// State
	// =============================================================================

	type PopoverState =
		| { type: 'idle' }
		| {
				type: 'adding';
				partialFilter: PartialFilter;
		  }
		| {
				type: 'editing';
				filterIndex: number;
				partialFilter: PartialFilter;
		  };

	// =============================================================================
	// Icon mapping for typeahead entries
	// =============================================================================

	const OPERATOR_VALUE_TYPE_TO_ICON: Record<string, IconName> = {
		string: 'search',
		string_list: 'search',
		integer: 'search',
		float: 'search',
		date_absolute: 'calendar',
		date_range: 'calendar',
		date_relative: 'calendar',
		time: 'clock',
		enum: 'menu',
		enum_list: 'menu',
		entity_list: 'search',
		custom: 'search',
		empty: 'search',
		nested: 'search'
	};
</script>

<script lang="ts">
	import Avatar from '../avatar/avatar.svelte';
	import Icon from '../icon/icon.svelte';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import Token from '../token/token.svelte';
	import Tokenizer from '../tokenizer/tokenizer.svelte';
	import TypeaheadItem from '../typeahead/typeahead-item.svelte';
	import { layerAnimations } from '../layer/layer-animations.stylex.js';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import { useAnnounce } from '../../hooks/use-announce.js';
	import { useSize } from '../../internal/contexts.svelte.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { formatFilterValue } from './format-filter-value.js';
	import PowerSearchEditPopover from './power-search-edit-popover.svelte';
	import PowerSearchTokenValue from './power-search-token-value.svelte';
	import { popoverLayerStyles, powerSearchResultCountAttrs } from './power-search.stylex.js';
	import { resolveOperatorLabel } from './resolve-operator-label.js';
	import type { PowerSearchAuxData, PowerSearchItem } from './types.js';
	import { useInternalConfig } from './use-internal-config.svelte.js';
	import { usePowerSearchSource } from './use-power-search-source.svelte.js';

	/**
	 * Structured filter bar where each token represents a filter (field + operator
	 * + value), ported from Astryx's `PowerSearch.tsx`.
	 *
	 * Users select a field from a typeahead dropdown, then configure the operator
	 * and value in an edit popover. Filters appear as tokens that can be clicked
	 * to edit or removed individually.
	 *
	 * @example
	 * ```svelte
	 * <script>
	 *   const config = {
	 *     name: 'MySearch',
	 *     fields: [
	 *       {
	 *         key: 'status',
	 *         label: 'Status',
	 *         operators: [
	 *           {
	 *             key: 'is',
	 *             label: 'is',
	 *             value: {
	 *               type: 'enum',
	 *               values: [
	 *                 { value: 'open', label: 'Open' },
	 *                 { value: 'closed', label: 'Closed' }
	 *               ]
	 *             }
	 *           }
	 *         ]
	 *       }
	 *     ]
	 *   };
	 *   let filters = $state([]);
	 * <\/script>
	 * <PowerSearch {config} {filters} onChange={(next) => (filters = next)} />
	 * ```
	 *
	 * Use `contentSearchFieldKey` to designate a field for free-text search. When
	 * set, unstructured text input is routed to that field.
	 *
	 * ## What changed from React
	 *
	 * - **`handleRef` + `useImperativeHandle` become instance exports.** Reach
	 *   `focusTypeahead()`/`blurTypeahead()` through `bind:this`, the shape
	 *   `Tokenizer`, `SideNav` and `Calendar` already use. `ref` is omitted, as
	 *   this port omits every `ref` prop.
	 * - **`popover.render(content, {…})` becomes `<PopoverLayer>`**, the
	 *   `useLayer`→`<Layer>` split the whole port uses. `usePopover` needs an `id`
	 *   here where upstream mints one inside `useLayer`, so it takes `$props.id()`.
	 * - **`key={popoverKey}` becomes `{#key popoverKey}`.** It is the *only*
	 *   mechanism resetting `PowerSearchEditPopover`'s seeded state between one
	 *   token and the next, and two upstream test cases exist to pin it —
	 *   including the same-index/different-filter variant an index-only key would
	 *   miss.
	 * - **`renderToken`/`renderItem` are snippets**, declared in this component so
	 *   they close over `filters`, `config` and the handlers exactly as upstream's
	 *   `useCallback`s do. No binder is needed: `Tokenizer` types them as
	 *   parameterised snippets already.
	 * - **The first-run latch survives.** Upstream's `hasMountedRef` stops the
	 *   result count present at mount from being announced unprompted; a `$effect`
	 *   fires on mount too, so the latch is load-bearing here as well.
	 *
	 * ## Two dead props, kept because upstream publishes them
	 *
	 * `menuWidth` and `maxOperatorMenuItems` are declared, documented and read by
	 * nothing — upstream never destructures either. They are part of the published
	 * type on both sides, so removing them would be a surface change.
	 */

	/* eslint-disable-next-line svelte/no-unused-props -- `menuWidth` and
	   `maxOperatorMenuItems` are declared, documented and read by nothing.
	   Upstream never destructures either, so removing them from the props type
	   would be a published-surface change; see the note above. */
	const {
		config: configProp,
		filters,
		onChange,
		label: labelFromProps,
		isLabelHidden = true,
		placeholder: placeholderFromProps,
		hasAutoFocus = false,
		hasClear = true,
		isReadOnly = false,
		isDisabled = false,
		disabledMessage,
		startIcon,
		onFocus,
		onBlur,
		status,
		statusVariant = 'attached',
		maxTokenLength = 40,
		popoverSaveButtonLabel: popoverSaveButtonLabelFromProps,
		timezoneID,
		tokenOverflowBehavior,
		endContent,
		resultCount,
		size: sizeProp,
		'data-testid': testId,
		xstyle,
		class: className,
		style: styleProp,
		components: componentOverrides
	}: PowerSearchProps = $props();

	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));
	const config = useInternalConfig(() => configProp);
	const searchSource = usePowerSearchSource(() => config);
	const t = useTranslator();
	const label = $derived(labelFromProps ?? t('@astryx.powersearch.label'));
	const placeholder = $derived(placeholderFromProps ?? t('@astryx.powersearch.placeholder'));
	const popoverSaveButtonLabel = $derived(
		popoverSaveButtonLabelFromProps ?? t('@astryx.powersearch.editor.apply')
	);

	const uid = $props.id();
	const popoverID = `${uid}-popover`;

	let tokenizer = $state<Tokenizer<PowerSearchItem> | null>(null);

	let popoverState = $state<PopoverState>({ type: 'idle' });

	// Layer for positioning the edit popover anchored to the tokenizer
	function handleLayerHide(): void {
		popoverState = { type: 'idle' };
	}

	const popover = usePopover(() => ({
		id: popoverID,
		onHide: handleLayerHide,
		hasLightDismiss: true,
		hasCloseButton: false,
		hasAutoFocus: false,
		// The popup's own listbox/menu content is the exposed semantics; focus
		// stays on the tokenizer input, so a modal dialog wrapper is incorrect.
		role: 'none'
	}));

	/**
	 * Wrapper that manages layer visibility and tokenizer focus alongside state.
	 *
	 * The animation frame is upstream's and stays, but not for the reason it first
	 * looks like. The synchronous `focus()` it appears to be racing —
	 * `base-typeahead.svelte`'s call right after `onChange` returns — happens in
	 * the same task, so a `tick()` microtask would land after it too. What the
	 * frame actually buys is **ordering against the child**: this callback is
	 * registered synchronously, before `PowerSearchEditPopover` exists, while the
	 * popover's own autofocus frame is registered later, during the flush that
	 * mounts it. Same-frame callbacks run in registration order, so `show()` and
	 * the tokenizer `blur()` always precede the value editor taking focus. A
	 * `tick()` rewrite would have to re-derive that.
	 *
	 * Both calls are unmount-safe: `tokenizer` is a `bind:this` target that Svelte
	 * nulls on destroy, and `layer.show()` is guarded by its own `popover` handle,
	 * which teardown clears. The frame is deliberately not cancelled, as
	 * upstream's is not.
	 */
	function setPopoverState(state: PopoverState): void {
		popoverState = state;
		if (state.type !== 'idle') {
			requestAnimationFrame(() => {
				popover.show();
				tokenizer?.blur();
			});
		} else {
			popover.hide();
			tokenizer?.focus();
		}
	}

	/** Upstream's `useImperativeHandle(handleRef, …)` — reach it via `bind:this`. */
	export function focusTypeahead(): void {
		tokenizer?.focus();
	}

	/** Upstream's `useImperativeHandle(handleRef, …)` — reach it via `bind:this`. */
	export function blurTypeahead(): void {
		tokenizer?.blur();
	}

	// Convert filters to tokenizer items
	const tokenizerValue = $derived.by<PowerSearchItem[]>(() =>
		filters.map((filter, index) => {
			const field = config.getField(filter.field);
			const operator = config.getOperator(filter.field, filter.operator);
			const resolvedOp = operator ? resolveOperatorLabel(operator, t) : '';
			const operatorLabel = resolvedOp ? `: ${resolvedOp}` : '';
			const valueStr = operator
				? formatFilterValue(config, operator.value, filter.value, maxTokenLength, t, timezoneID)
				: '';

			const displayLabel = valueStr
				? `${field?.label ?? filter.field}${operatorLabel} ${valueStr}`
				: `${field?.label ?? filter.field}${operatorLabel}`;

			return {
				id: `filter-${index}-${filter.field}-${filter.operator}`,
				label: displayLabel,
				auxiliaryData: {
					fieldKey: filter.field,
					operatorKey: filter.operator,
					filterValue: filter.value,
					filterIndex: index
				}
			};
		})
	);

	// Handle tokenizer onChange (field selected from typeahead)
	function handleTokenizerChange(
		_items: PowerSearchItem[],
		change: { item?: PowerSearchItem; type: string }
	): void {
		if (change.type === 'add' && change.item) {
			const auxData = change.item.auxiliaryData as PowerSearchAuxData | undefined;
			if (!auxData) {
				return;
			}

			const field = config.getField(auxData.fieldKey);
			if (!field) {
				return;
			}

			const operator = auxData.operatorKey
				? config.getOperator(auxData.fieldKey, auxData.operatorKey)
				: config.getDefaultOperator(auxData.fieldKey);

			// If the item already has a filter value (e.g. content search), add immediately
			if (auxData.filterValue && operator) {
				const newFilter: PowerSearchFilter = {
					field: auxData.fieldKey,
					operator: operator.key,
					value: auxData.filterValue
				};
				onChange([...filters, newFilter], 'add', filters.length);
				return;
			}

			// For "empty" type operators, add the filter immediately
			if (operator?.value.type === 'empty') {
				const newFilter: PowerSearchFilter = {
					field: auxData.fieldKey,
					operator: operator.key,
					value: { type: 'empty' }
				};
				onChange([...filters, newFilter], 'add', filters.length);
				return;
			}

			// Open the edit popover for the new filter
			setPopoverState({
				type: 'adding',
				partialFilter: {
					field: auxData.fieldKey,
					operator: operator?.key,
					value: undefined
				}
			});
		} else if (change.type === 'remove' && change.item) {
			const auxData = change.item.auxiliaryData as PowerSearchAuxData | undefined;
			if (auxData?.filterIndex != null) {
				const removedIndex = auxData.filterIndex;
				const newFilters = filters.filter((_, i) => i !== removedIndex);
				onChange(newFilters, 'remove', removedIndex);
			}
		}
	}

	// Handle clicking a token to edit
	function handleTokenClick(index: number): void {
		if (isReadOnly || isDisabled) {
			return;
		}

		const filter = filters[index];
		if (filter.isReadOnly) {
			return;
		}

		setPopoverState({
			type: 'editing',
			filterIndex: index,
			partialFilter: {
				field: filter.field,
				operator: filter.operator,
				value: filter.value
			}
		});
	}

	// Handle popover save
	function handlePopoverSave(savedFilter: PowerSearchFilter | null): void {
		if (popoverState.type === 'adding') {
			if (savedFilter) {
				onChange([...filters, savedFilter], 'add', filters.length);
			}
		} else if (popoverState.type === 'editing') {
			if (savedFilter) {
				const newFilters = [...filters];
				newFilters[popoverState.filterIndex] = savedFilter;
				onChange(newFilters, 'edit', popoverState.filterIndex);
			} else {
				// Delete
				const removedIndex = popoverState.filterIndex;
				const newFilters = filters.filter((_, i) => i !== removedIndex);
				onChange(newFilters, 'remove', removedIndex);
			}
		}
		setPopoverState({ type: 'idle' });
	}

	// Handle popover cancel
	function handlePopoverCancel(): void {
		setPopoverState({ type: 'idle' });
	}

	// The partial filter for the popover
	const popoverPartialFilter = $derived(
		popoverState.type !== 'idle' ? popoverState.partialFilter : null
	);

	// Resolve custom Editor override for the current popover filter
	const EditorOverride = $derived.by(() => {
		if (!popoverPartialFilter?.field || !popoverPartialFilter?.operator) {
			return undefined;
		}
		const op = config.getOperator(popoverPartialFilter.field, popoverPartialFilter.operator);
		return op ? componentOverrides?.[op.value.type]?.Editor : undefined;
	});

	const popoverMode = $derived<'create' | 'edit'>(
		popoverState.type === 'editing' ? 'edit' : 'create'
	);

	const popoverKey = $derived(
		popoverState.type === 'editing'
			? `edit-${popoverState.filterIndex}-${popoverState.partialFilter.field}`
			: popoverState.type === 'adding'
				? `add-${popoverState.partialFilter.field}`
				: ''
	);

	// Plain-text form of the result count, shared by the visible label and the
	// screen-reader announcement so the two never drift. The ICU plural handles
	// the number formatting + `result` vs `results` in one message so translators
	// can match the locale's plural rules.
	const resultCountText = $derived.by<string | null>(() => {
		if (resultCount == null) {
			return null;
		}
		if (typeof resultCount === 'number') {
			return t('@astryx.powersearch.resultCount', { count: resultCount });
		}
		return resultCount;
	});

	// Announce result-count changes to screen readers through a polite live
	// region, mirroring the way Typeahead announces its dropdown result count.
	// The count is otherwise only shown visually and stays silent to assistive
	// tech. Skip the first run so the count already present on mount isn't
	// announced unprompted — only user-driven changes are spoken.
	const announce = useAnnounce();
	let hasMounted = false;
	$effect(() => {
		const text = resultCountText;
		if (!hasMounted) {
			hasMounted = true;
			return;
		}
		if (text != null) {
			announce(text);
		}
	});
</script>

{#snippet renderToken(item: PowerSearchItem, onRemove: () => void)}
	{@const auxData = item.auxiliaryData}
	{@const filterIndex = auxData?.filterIndex ?? -1}
	{@const filter = filterIndex >= 0 ? filters[filterIndex] : undefined}
	{@const field = auxData ? config.getField(auxData.fieldKey) : undefined}
	{@const operator = auxData?.operatorKey
		? config.getOperator(auxData.fieldKey, auxData.operatorKey)
		: undefined}
	{@const canInteract = !isReadOnly && !isDisabled && !filter?.isReadOnly}
	{@const handleClick = canInteract ? () => handleTokenClick(filterIndex) : undefined}
	{@const handleRemove = canInteract ? onRemove : undefined}
	{@const TokenOverride = operator ? componentOverrides?.[operator.value.type]?.Token : undefined}

	{#if TokenOverride && filter && field && operator}
		<TokenOverride
			config={configProp}
			{filter}
			{field}
			{operator}
			maxLength={maxTokenLength}
			onClick={handleClick}
			onRemove={handleRemove}
			{isDisabled}
		/>
	{:else}
		{@const fieldLabel = field?.label ?? ''}
		{@const operatorLabel = operator ? resolveOperatorLabel(operator, t) : ''}
		{@const tokenLabel = `${fieldLabel}: ${operatorLabel}`.trim()}
		{@const adjustedMaxLength = Math.max(
			maxTokenLength - fieldLabel.length - operatorLabel.length,
			10
		)}
		{@const entity =
			filter?.value.type === 'entity_list' &&
			filter.value.value.length === 1 &&
			filter.value.value[0].photo
				? filter.value.value[0]
				: undefined}

		{#snippet valueContent()}
			{#if operator && filter}
				<PowerSearchTokenValue
					operatorValue={operator.value}
					filterValue={filter.value}
					maxLength={adjustedMaxLength}
				/>
			{/if}
		{/snippet}

		<!-- Show entity photo as token icon for single-entity filters -->
		{#snippet tokenIcon()}
			{#if entity}
				<Avatar src={entity.photo} name={entity.label} size={16} />
			{/if}
		{/snippet}

		<Token
			label={tokenLabel}
			{size}
			icon={entity ? tokenIcon : undefined}
			endContent={operator && filter ? valueContent : undefined}
			onclick={handleClick
				? (e: MouseEvent) => {
						e.stopPropagation();
						handleClick();
					}
				: undefined}
			onRemove={handleRemove}
			{isDisabled}
		/>
	{/if}
{/snippet}

{#snippet renderItem(item: PowerSearchItem)}
	{@const auxData = item.auxiliaryData}
	{#if !auxData}
		<TypeaheadItem {item} />
	{:else}
		{@const field = config.getField(auxData.fieldKey)}
		{@const operator = auxData.operatorKey
			? config.getOperator(auxData.fieldKey, auxData.operatorKey)
			: config.getDefaultOperator(auxData.fieldKey)}
		{@const iconName = OPERATOR_VALUE_TYPE_TO_ICON[operator?.value.type ?? ''] ?? 'search'}

		{#snippet fallbackIcon()}
			<Icon icon={iconName} size="sm" color="secondary" />
		{/snippet}

		<TypeaheadItem
			{item}
			icon={field?.icon ?? (field ? fallbackIcon : undefined)}
			description={field?.description}
		/>
	{/if}
{/snippet}

{#snippet combinedEndContent()}
	{#if resultCountText != null}
		<span {...powerSearchResultCountAttrs()}>{resultCountText}</span>
	{/if}
	{#if endContent}{@render endContent()}{/if}
{/snippet}

<div {...themeProps('power-search')} {@attach popover.attachTrigger}>
	<Tokenizer
		bind:this={tokenizer}
		{label}
		{isLabelHidden}
		{searchSource}
		value={tokenizerValue}
		onChange={handleTokenizerChange}
		{renderToken}
		{renderItem}
		placeholder={filters.length === 0 ? placeholder : ''}
		{hasAutoFocus}
		hasClear={hasClear && !isReadOnly}
		{startIcon}
		endContent={resultCountText != null || endContent ? combinedEndContent : undefined}
		{isDisabled}
		{disabledMessage}
		{size}
		{tokenOverflowBehavior}
		hasEntriesOnFocus
		debounceMs={0}
		{status}
		{statusVariant}
		onfocusin={onFocus}
		onfocusout={onBlur}
		{xstyle}
		class={className}
		style={styleProp}
		data-testid={testId}
	/>
</div>

<PopoverLayer
	{popover}
	placement="below"
	alignment="start"
	xstyle={[popoverLayerStyles.layer, layerAnimations.below]}
>
	{#if popoverPartialFilter}
		{#key popoverKey}
			{#if EditorOverride}
				<EditorOverride
					config={configProp}
					filter={popoverPartialFilter}
					mode={popoverMode}
					onSave={handlePopoverSave}
					onCancel={handlePopoverCancel}
					saveButtonLabel={popoverSaveButtonLabel}
					{isReadOnly}
				/>
			{:else}
				<PowerSearchEditPopover
					{config}
					filter={popoverPartialFilter}
					mode={popoverMode}
					onSave={handlePopoverSave}
					onCancel={handlePopoverCancel}
					saveButtonLabel={popoverSaveButtonLabel}
					{isReadOnly}
				/>
			{/if}
		{/key}
	{/if}
</PopoverLayer>
