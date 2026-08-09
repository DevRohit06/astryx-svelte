<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus, InputStatusType } from '../field/types.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';
	import type { IconName } from '../icon/icon-registry.js';
	import type { SearchableItem, SearchSource } from '../typeahead/types.js';
	// `TokenizerSize` is published from `tokenizer.stylex.ts`, derived from the
	// size style keys — the arrangement `Typeahead`/`Selector` use.
	import type { TokenizerSize } from './tokenizer.stylex.js';

	// `TokenizerStatus`/`TokenizerStatusType` alias Field's `InputStatus`/
	// `InputStatusType`, as upstream re-exports them from `Tokenizer.tsx`.
	export type TokenizerStatus = InputStatus;
	export type TokenizerStatusType = InputStatusType;

	/** Change metadata for the `onChange` callback. */
	export type TokenizerChange<T extends SearchableItem> =
		| { item: T; type: 'add' }
		| { item: T; type: 'create' }
		| { item: T; type: 'remove' }
		| { type: 'reorder' };

	/**
	 * Controls overflow behavior when tokens exceed the available width.
	 * - `'none'`: All tokens wrap normally (default).
	 * - `'unfocusedInline'`: Shows a single line with "+ N more" when unfocused, expands inline on focus.
	 * - `'unfocusedLayer'`: Shows a single line with "+ N more" when unfocused, expands as an overlay on focus.
	 */
	export type TokenizerOverflowBehavior = 'none' | 'unfocusedInline' | 'unfocusedLayer';

	/**
	 * The imperative handle a `Tokenizer` exposes.
	 *
	 * Upstream reaches it through a `handleRef` prop and `useImperativeHandle`;
	 * Svelte's counterpart is the component instance itself, so these are
	 * instance exports and `bind:this` is the seam. There is therefore no
	 * `handleRef` prop — the type still describes exactly what upstream's does.
	 *
	 * @example
	 * ```svelte
	 * let tokenizer: TokenizerHandle;
	 * <Tokenizer bind:this={tokenizer} … />
	 * <button onclick={() => tokenizer.focus()}>Focus</button>
	 * ```
	 */
	export interface TokenizerHandle {
		/** Focus the typeahead input. */
		focus(): void;
		/** Blur the typeahead input. */
		blur(): void;
	}

	/**
	 * `onchange` is omitted so the component's own `onChange` is not shadowed by
	 * the native handler arriving through the rest spread — the hole `Typeahead`
	 * and `Selector` close for the same reason.
	 */
	export interface TokenizerProps<T extends SearchableItem> extends Omit<
		BaseProps<HTMLDivElement>,
		'onchange'
	> {
		/** Accessible label (required). */
		label: string;
		/**
		 * Visually hide the label.
		 * @default false
		 */
		isLabelHidden?: boolean;
		/** Helper text. */
		description?: string;
		/**
		 * Required field.
		 * @default false
		 */
		isRequired?: boolean;
		/**
		 * Optional field.
		 * @default false
		 */
		isOptional?: boolean;
		/** Validation status. */
		status?: InputStatus;
		/**
		 * How the status message is placed relative to the input.
		 * - `attached`: message overlaps directly below the input (bordered treatment)
		 * - `detached`: message floats below as a separate element with spacing
		 * @default 'attached'
		 */
		statusVariant?: FieldStatusVariant;
		/**
		 * Icon to display at the start of the input — a registry name, or a snippet
		 * for a custom icon. Upstream applies `size="sm" color="secondary"` to a
		 * registry icon; a snippet is authored by the caller, so set them yourself
		 * to match.
		 */
		startIcon?: IconName | Snippet;
		/**
		 * Width of the field. Numbers are treated as pixels, strings are used as-is
		 * (e.g. `'100%'`). Sizes the whole field (label, control, and status) so they
		 * stay aligned, unlike setting width via `xstyle`/`class`/`style`.
		 */
		width?: SizeValue;
		/** Label tooltip. */
		labelTooltip?: string;
		/** Search source providing items. */
		searchSource: SearchSource<T>;
		/** Currently selected items. */
		value: T[];
		/**
		 * The HTML name attribute for form submissions. When set, hidden inputs
		 * carry one entry per selected item's id under this name.
		 */
		htmlName?: string;
		/** Callback when selection changes. Includes change metadata. */
		onChange: (items: T[], change: TokenizerChange<T>) => void;
		/** Renderer for dropdown items. Default: `TypeaheadItem`. */
		renderItem?: Snippet<[T]>;
		/**
		 * Renderer for a selected token. Default: `Token` with label + remove.
		 * Upstream's `(item, onRemove) => ReactNode` render prop, which a
		 * parameterised `Snippet` translates directly.
		 */
		renderToken?: Snippet<[T, () => void]>;
		/** Max number of selections. */
		maxEntries?: number;
		/** Placeholder text (shown when no tokens selected). */
		placeholder?: string;
		/**
		 * Show results on focus before typing.
		 * @default false
		 */
		hasEntriesOnFocus?: boolean;
		/**
		 * Max dropdown items.
		 * @default 10
		 */
		maxMenuItems?: number;
		/**
		 * Text shown when no results found.
		 * @default 'No results found'
		 */
		emptySearchResultsText?: string;
		/**
		 * Whether the input is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Explains why the tokenizer is disabled. When set together with
		 * `isDisabled`, the tokenizer shows a tooltip with this text on hover and
		 * keyboard focus, and the input stays focusable (via `aria-disabled`) so the
		 * reason is discoverable by keyboard and assistive technology. Input stays
		 * blocked.
		 *
		 * Use this instead of wrapping a disabled tokenizer in `Tooltip` — disabled
		 * controls don't emit the pointer events an external tooltip needs.
		 */
		disabledMessage?: string;
		/**
		 * Show clear button (clears all tokens).
		 * @default false
		 */
		hasClear?: boolean;
		/**
		 * Content to display at the end of the input row.
		 * Useful for buttons, result counts, or other controls.
		 */
		endContent?: Snippet;
		/**
		 * Auto-focus on mount.
		 * @default false
		 */
		hasAutoFocus?: boolean;
		/**
		 * Input size.
		 * @default 'md'
		 */
		size?: TokenizerSize;
		/**
		 * Controls how tokens overflow when the container is too narrow.
		 * - `'none'`: Tokens wrap to multiple lines (default).
		 * - `'unfocusedInline'`: Single line with "+ N more" when unfocused; expands inline on focus.
		 * - `'unfocusedLayer'`: Single line with "+ N more" when unfocused; expands as overlay on focus.
		 * @default 'none'
		 */
		tokenOverflowBehavior?: TokenizerOverflowBehavior;
		/**
		 * Debounce delay in ms before triggering search after typing.
		 * Set to 0 for synchronous/local search sources that don't need debouncing.
		 * @default 150
		 */
		debounceMs?: number;
		/**
		 * Allow users to create new tokens from free-text input.
		 * When true, pressing Enter with text in the input commits the typed value
		 * as a new token — even if the search source returned no results.
		 * @default false
		 */
		hasCreate?: boolean;
		/** Query change callback. */
		onChangeQuery?: (query: string) => void;
		// `onfocusin`/`onfocusout` are upstream's `onFocus`/`onBlur` props. React's
		// synthetic pair *bubbles*, which the native `focus`/`blur` do not — the
		// correction `useListFocus`, `Toolbar` and `Typeahead` already record — so
		// they arrive under the bubbling DOM names, straight off `BaseProps`.
	}

	// Sentinel prefix for creatable items — used to distinguish
	// "Create: X" suggestions from real search results.
	const CREATABLE_ID_PREFIX = '__xds_create__';
</script>

<script lang="ts" generics="T extends SearchableItem">
	import { useSize } from '../../internal/contexts.svelte.js';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import Field from '../field/field.svelte';
	import Icon from '../icon/icon.svelte';
	import InputClearButton from '../field/input-clear-button.svelte';
	import Layer from '../layer/layer.svelte';
	import { useLayer } from '../layer/use-layer.svelte.js';
	import OverflowList, { type OverflowItem } from '../overflow-list/overflow-list.svelte';
	import Token from '../token/token.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import BaseTypeahead from '../typeahead/base-typeahead.svelte';
	import { useAnnounce } from '../../hooks/use-announce.js';
	import {
		tokenizerEndSectionAttrs,
		tokenizerInputAtMaxStyle,
		tokenizerInputCompactStyle,
		tokenizerLayerPlaceholderAttrs,
		tokenizerLayerPopoverStyle,
		tokenizerOverflowTextAttrs,
		tokenizerStartIconAttrs,
		tokenizerTokenAttrs,
		tokenizerTokenStyle,
		tokenizerWrapperAttrs
	} from './tokenizer.stylex.js';

	/**
	 * Multi-select input with token chips and typeahead search.
	 *
	 * Composes `BaseTypeahead` for search and `Token` for selected items. Tokens
	 * render inline before the text input. Selecting an item adds a token and
	 * clears the query. Backspace on an empty input removes the last token.
	 *
	 * @example
	 * ```svelte
	 * <Tokenizer
	 *   label="Team members"
	 *   searchSource={userSource}
	 *   value={members}
	 *   onChange={(items, change) => {
	 *     members = items;
	 *     if (change.type === 'add') console.log('Added:', change.item.label);
	 *   }}
	 *   placeholder="Search people..."
	 * />
	 * ```
	 */
	const {
		label,
		isLabelHidden = false,
		description,
		isRequired = false,
		isOptional = false,
		status,
		statusVariant = 'attached',
		startIcon,
		labelTooltip,
		searchSource,
		value,
		onChange,
		renderItem,
		renderToken,
		maxEntries,
		placeholder,
		hasEntriesOnFocus,
		maxMenuItems,
		emptySearchResultsText,
		isDisabled = false,
		htmlName,
		disabledMessage,
		hasClear = false,
		endContent,
		hasAutoFocus,
		size: sizeProp,
		tokenOverflowBehavior = 'none',
		debounceMs,
		hasCreate = false,
		onChangeQuery,
		onfocusin: onFocusProp,
		onfocusout: onBlurProp,
		width,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId,
		...rest
	}: TokenizerProps<T> = $props();

	const t = useTranslator();
	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));

	// One base id with derived suffixes — the counterpart to upstream's three
	// `useId` calls, plus two the port needs: the layer's own id (upstream's
	// `useLayer` mints it internally; ours must be passed one) and the tooltip's.
	const uid = $props.id();
	const inputId = `${uid}-input`;
	const descriptionId = `${uid}-description`;
	const statusMessageId = `${uid}-status`;
	const layerId = `${uid}-layer`;
	const tooltipId = `${uid}-tooltip`;

	let inputEl = $state<HTMLInputElement | null>(null);
	let wrapperEl = $state<HTMLDivElement | null>(null);
	let layerContentEl = $state<HTMLDivElement | null>(null);

	// Disabled-reason tooltip. Disabled controls swallow pointer events, so the
	// tooltip listeners attach to the input wrapper and the typeahead input stays
	// perceivable via aria-disabled instead of the disabled attribute. Input is
	// blocked by the isDisabled guards in BaseTypeahead and handleWrapperClick.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipId,
		placement: 'above' as const,
		// The wrapper is not naturally focusable; focusin bubbles up from the
		// input, so always attach focus listeners.
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	/**
	 * Upstream's `useImperativeHandle(handleRef, …)`. Svelte's counterpart to an
	 * imperative handle is the component instance, so these are instance exports
	 * reached through `bind:this` rather than a `handleRef` prop.
	 */
	export function focus(): void {
		inputEl?.focus();
	}

	export function blur(): void {
		inputEl?.blur();
	}

	// Focus-within state for overflow truncation
	let isFocusedWithin = $state(false);
	const isTruncated = $derived(
		!isFocusedWithin && tokenOverflowBehavior !== 'none' && value.length > 0
	);

	// Layer for unfocusedLayer mode — promotes expanded content to the top layer
	// so it isn't clipped by ancestor overflow.
	const isLayerMode = $derived(tokenOverflowBehavior === 'unfocusedLayer');
	const layer = useLayer(() => ({ mode: 'context', id: layerId }));

	// Anchor the layer to the placeholder element. Upstream gates its `ref`
	// callback on `isLayerMode`; the placeholder only exists in layer mode here,
	// so the attachment is simply not applied outside it.
	const attachPlaceholder = layer.attachTrigger;

	/**
	 * For the layer variant, focus can be in either the placeholder or the
	 * popover content. Both are tracked to decide when focus has truly left.
	 */
	function isFocusInTokenizer(target: Node | null): boolean {
		if (!target) {
			return false;
		}
		if (wrapperEl?.contains(target)) {
			return true;
		}
		if (layerContentEl?.contains(target)) {
			return true;
		}
		// Also check the popover element itself (the layer wrapper)
		const popoverEl = document.getElementById(layer.id);
		if (popoverEl?.contains(target)) {
			return true;
		}
		return false;
	}

	function handleFocusCapture(e: FocusEvent): void {
		const comingFromOutside = !isFocusInTokenizer(e.relatedTarget as Node | null);
		isFocusedWithin = true;
		if (isLayerMode) {
			layer.show();
		}
		if (comingFromOutside) {
			onFocusProp?.(e as FocusEvent & { currentTarget: EventTarget & HTMLDivElement });
			// Redirect to the input so the user doesn't have to tab through
			// every token remove button.
			if (e.target !== inputEl) {
				inputEl?.focus();
			}
		}
	}

	function handleBlurCapture(e: FocusEvent): void {
		if (!isFocusInTokenizer(e.relatedTarget as Node | null)) {
			isFocusedWithin = false;
			onBlurProp?.(e as FocusEvent & { currentTarget: EventTarget & HTMLDivElement });
			if (isLayerMode) {
				layer.hide();
			}
		}
	}

	const isAtMax = $derived(maxEntries != null && value.length >= maxEntries);

	// Filter out already-selected items from search results
	const selectedIds = $derived(new Set(value.map((item) => item.id)));

	// Tokens appeared and disappeared silently before: Backspace on an empty input
	// removes the trailing token, and the per-token remove buttons gave no audible
	// feedback either.
	const announce = useAnnounce();

	/**
	 * Upstream's `useMemo(() => ({search, bootstrap}), [searchSource, selectedIds,
	 * hasCreate])`, whose identity therefore changes on every token add/remove, on
	 * a `searchSource` swap and on a `hasCreate` flip.
	 *
	 * The three keys are **read into locals in the derived's body, not left to the
	 * closures** — that is what gives this derived a dependency set at all. A
	 * `$derived({search: async () => …searchSource…})` only *constructs* the
	 * closures when it runs, reads no signal doing so, and is therefore computed
	 * once and never invalidated: a per-instance constant wearing a memo's
	 * clothes. `BaseTypeahead` keys a cleanup effect on `searchSource` precisely so
	 * that swapping the source drops the queued debounce, so a frozen identity
	 * leaves a search armed before a token was removed to fire afterwards and pop
	 * the dropdown open. Hoisting the reads also restores upstream's
	 * capture-at-memo-time semantics, where the closures see the `selectedIds` of
	 * the render that built them.
	 */
	const filteredSource = $derived.by<SearchSource<T>>(() => {
		const source = searchSource;
		const ids = selectedIds;
		const create = hasCreate;

		return {
			search: async (query: string) => {
				const results = await source.search(query);
				const filtered = results.filter((item) => !ids.has(item.id));

				// Append a "Create: X" synthetic item when hasCreate is true,
				// the user has typed something, and it doesn't exactly match an
				// existing result.
				if (create && query.trim()) {
					const trimmed = query.trim();
					const alreadyExists =
						ids.has(trimmed) ||
						filtered.some((item) => item.label.toLowerCase() === trimmed.toLowerCase());
					if (!alreadyExists) {
						const creatableItem = {
							id: `${CREATABLE_ID_PREFIX}${trimmed}`,
							label: `Create "${trimmed}"`,
							auxiliaryData: { __createdValue: trimmed }
						} as unknown as T;
						filtered.push(creatableItem);
					}
				}

				return filtered;
			},
			bootstrap: async () => {
				const results = await source.bootstrap();
				return results.filter((item) => !ids.has(item.id));
			}
		};
	});

	const emptySource: SearchSource<T> = {
		search: async () => [],
		bootstrap: async () => []
	};

	/** Handle adding an item — detect creatable synthetic items. */
	function handleAdd(item: T | null): void {
		if (!item) {
			return;
		}
		if (isAtMax) {
			return;
		}

		// Detect "Create: X" synthetic items from the creatable source
		if (hasCreate && typeof item.id === 'string' && item.id.startsWith(CREATABLE_ID_PREFIX)) {
			const createdValue = item.id.slice(CREATABLE_ID_PREFIX.length);
			if (selectedIds.has(createdValue)) {
				return;
			}
			const realItem = { id: createdValue, label: createdValue } as T;
			const newItems = [...value, realItem];
			onChange(newItems, { item: realItem, type: 'create' });
			announce(`Added ${createdValue}`);
			return;
		}

		if (selectedIds.has(item.id)) {
			return;
		}
		const newItems = [...value, item];
		onChange(newItems, { item, type: 'add' });
		announce(`Added ${item.label}`);
	}

	/**
	 * Handle removing an item. Single removal path: both Backspace on an empty
	 * input and the per-token remove buttons route through here, so the
	 * announcement covers both.
	 */
	function handleRemove(item: T): void {
		const newItems = value.filter((v) => v.id !== item.id);
		onChange(newItems, { item, type: 'remove' });
		announce(`Removed ${item.label}`);
		inputEl?.focus();
	}

	/** Handle clearing all items. */
	function handleClearAll(): void {
		if (value.length === 0) {
			return;
		}
		// Report the last item as removed (convention)
		const lastItem = value[value.length - 1];
		onChange([], { item: lastItem, type: 'remove' });
		inputEl?.focus();
	}

	/** Handle backspace on an empty input — remove the last token. */
	function handleKeyDown(e: KeyboardEvent): void {
		const target = e.currentTarget as HTMLInputElement;
		if (e.key === 'Backspace' && target.value === '' && value.length > 0) {
			e.preventDefault();
			handleRemove(value[value.length - 1]);
		}
	}

	/** Click the wrapper to focus the input. */
	function handleWrapperClick(): void {
		if (!isDisabled) {
			if (isLayerMode) {
				// The input always lives in the popover. Show it and focus.
				layer.show();
				isFocusedWithin = true;
				// The input is already mounted in the popover (not conditional),
				// so we can focus it directly.
				inputEl?.focus();
			} else {
				inputEl?.focus();
			}
		}
	}

	const ariaDescribedBy = $derived(
		[
			description ? descriptionId : null,
			status?.message ? statusMessageId : null,
			showsDisabledMessage ? disabledMessageTooltip.describedBy : null
		]
			.filter(Boolean)
			.join(' ') || undefined
	);

	// Captures the `<input>` `BaseTypeahead` renders — the counterpart to
	// upstream's `ref={inputRef}`, travelling through the rest props the base
	// spreads onto it.
	const captureInput = (el: Element): void => {
		inputEl = el as HTMLInputElement;
	};

	const inputXStyle = $derived(
		isAtMax || isTruncated
			? tokenizerInputAtMaxStyle
			: value.length > 0
				? tokenizerInputCompactStyle
				: undefined
	);

	// Self-authored position styles (`positioning="custom"` below): explicit
	// anchor() insets pin the expanded layer over the field itself. `left` is
	// physical, so this popover does not yet mirror in RTL — upstream's known
	// follow-up from #3389.
	const popoverOverrideStyle = 'top:anchor(top);left:anchor(start)';

	const theme = $derived(themeProps('tokenizer', { size, status: status?.type }));
	const wrapperAttrs = $derived(
		tokenizerWrapperAttrs(size, status?.type, value.length > 0, isTruncated, isDisabled)
	);
	const placeholderAttrs = $derived(
		tokenizerLayerPlaceholderAttrs(size, status?.type, value.length > 0, isTruncated, isDisabled)
	);
	const startIconAttrs = $derived(tokenizerStartIconAttrs(value.length > 0));
	const endSectionAttrs = $derived(tokenizerEndSectionAttrs(size));
	const overflowTextAttrs = tokenizerOverflowTextAttrs();
	const tokenAttrs = tokenizerTokenAttrs();
</script>

{#snippet startIconSlot()}
	{#if typeof startIcon === 'string'}
		<Icon icon={startIcon} size="sm" color="secondary" />
	{:else if startIcon}
		{@render startIcon()}
	{/if}
{/snippet}

{#snippet tokenSlot(item: T)}
	{#if renderToken}
		<span class={tokenAttrs.class} style={tokenAttrs.style}>
			{@render renderToken(item, () => handleRemove(item))}
		</span>
	{:else}
		<Token
			label={item.label}
			{size}
			onRemove={isDisabled ? undefined : () => handleRemove(item)}
			{isDisabled}
			xstyle={tokenizerTokenStyle}
		/>
	{/if}
{/snippet}

{#snippet overflowIndicator(items: OverflowItem<T>[])}
	<span class={overflowTextAttrs.class} style={overflowTextAttrs.style}>
		+{items.length} more
	</span>
{/snippet}

{#snippet hiddenInputs()}
	{#if htmlName != null}
		<!--
			Keyed by position: upstream's `key={item.id}` tolerates a duplicate id
			(React warns), where Svelte throws.
		-->
		{#each value as item, hiddenIndex (hiddenIndex)}
			<!--
				Disabled native controls are excluded from form submission; mirror
				that for the hidden carriers.
			-->
			<input type="hidden" name={htmlName} value={item.id} disabled={isDisabled} />
		{/each}
	{/if}
{/snippet}

{#snippet wrapperContent()}
	<!--
		The wrapper is the click target and the dropdown anchor. It carries
		`role="group"` with the field's label, as upstream's does, and the click
		handler exists only to widen the hit area over the padding and the tokens.
	-->
	<div
		bind:this={wrapperEl}
		{@attach disabledMessageTooltip.attachTrigger}
		role="group"
		aria-label={label}
		onclick={handleWrapperClick}
		onfocusin={handleFocusCapture}
		onfocusout={handleBlurCapture}
		data-testid={testId}
		{...theme}
		class={cx(theme.class, wrapperAttrs.class)}
		style={wrapperAttrs.style}
	>
		{#if startIcon}
			<span class={startIconAttrs.class} style={startIconAttrs.style}>
				{@render startIconSlot()}
			</span>
		{/if}
		{#if isTruncated}
			<OverflowList
				gap={1}
				behavior="observeParent"
				items={value}
				item={tokenSlot}
				overflowRenderer={overflowIndicator}
			/>
		{:else}
			{#each value as item, tokenIndex (tokenIndex)}
				{@render tokenSlot(item)}
			{/each}
		{/if}
		<BaseTypeahead
			{@attach captureInput}
			searchSource={isAtMax ? emptySource : filteredSource}
			value={null}
			onChange={handleAdd}
			{renderItem}
			placeholder={value.length === 0 ? placeholder : ''}
			hasEntriesOnFocus={isAtMax ? false : hasEntriesOnFocus}
			{maxMenuItems}
			{emptySearchResultsText}
			{isDisabled}
			isFocusableDisabled={showsDisabledMessage}
			{hasAutoFocus}
			{inputId}
			{ariaDescribedBy}
			{onChangeQuery}
			{debounceMs}
			onKeyDown={handleKeyDown}
			anchorEl={wrapperEl}
			{size}
			{inputXStyle}
		/>
		{@render hiddenInputs()}
		{#if endContent || (hasClear && value.length > 0 && !isDisabled)}
			<div class={endSectionAttrs.class} style={endSectionAttrs.style}>
				{#if endContent}{@render endContent()}{/if}
				{#if hasClear && value.length > 0 && !isDisabled}
					<InputClearButton
						label={t('@astryx.tokenizer.clearAll')}
						onclick={(e) => {
							e.stopPropagation();
							handleClearAll();
						}}
					/>
				{/if}
			</div>
		{/if}
	</div>
{/snippet}

{#snippet tokenizerContent()}
	{#if isLayerMode}
		<div
			{@attach attachPlaceholder}
			onclick={handleWrapperClick}
			{...theme}
			class={cx(theme.class, placeholderAttrs.class)}
			style={placeholderAttrs.style}
		>
			{#if isTruncated}
				{#if startIcon}{@render startIconSlot()}{/if}
				<OverflowList
					gap={1}
					behavior="observeParent"
					items={value}
					item={tokenSlot}
					overflowRenderer={overflowIndicator}
				/>
			{/if}
		</div>
		<Layer
			{layer}
			positioning="custom"
			xstyle={tokenizerLayerPopoverStyle}
			style={popoverOverrideStyle}
		>
			<div bind:this={layerContentEl} onfocusin={handleFocusCapture} onfocusout={handleBlurCapture}>
				{@render wrapperContent()}
			</div>
		</Layer>
	{:else}
		{@render wrapperContent()}
	{/if}
{/snippet}

<Field
	{...rest}
	{label}
	{isLabelHidden}
	{description}
	inputID={inputId}
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
	{statusVariant}
	{labelTooltip}
	{width}
	{xstyle}
	class={className}
	style={styleProp}
>
	{@render tokenizerContent()}
	{#if showsDisabledMessage && disabledMessage}
		<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
	{/if}
</Field>
