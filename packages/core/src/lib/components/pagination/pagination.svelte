<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';

	/**
	 * Extensible variant map for Pagination.
	 *
	 * Theme packages can add custom variants via TypeScript module augmentation:
	 *
	 * @example
	 * declare module '@astryx-svelte/core' {
	 *   interface PaginationVariantMap {
	 *     progress: true;
	 *   }
	 * }
	 */
	export interface PaginationVariantMap {
		pages: true;
		count: true;
		compact: true;
		dots: true;
		input: true;
		none: true;
	}

	/**
	 * Visual variant controlling what appears between prev/next buttons.
	 * Extensible via module augmentation of `PaginationVariantMap`.
	 */
	export type PaginationVariant = keyof PaginationVariantMap;

	/** Size of the pagination controls. */
	export type PaginationSize = 'sm' | 'md';

	/**
	 * `onchange` is omitted so the component's own `onChange` is not shadowed by
	 * the native handler arriving through the rest spread — the hole `NumberInput`
	 * and `Selector` close for the same reason. (Upstream omits React's `onChange`.)
	 */
	export interface PaginationProps extends Omit<BaseProps<HTMLElement>, 'onchange'> {
		// --- Core (required) ---
		/** Current page number (1-based). Page 1 is the first page. */
		page: number;
		/** Called when the page changes. */
		onChange: (page: number) => void;
		/**
		 * Async action on page change. Fires after `onChange`, and drives the
		 * optimistic page indicator while it is in flight.
		 */
		changeAction?: (page: number) => void | Promise<void>;

		// --- Data shape (provide one) ---
		/**
		 * Total number of items. Used to calculate page count.
		 * Takes precedence over `totalPages` if both provided.
		 */
		totalItems?: number;
		/** Total number of pages. Use when you know page count but not item count. */
		totalPages?: number;
		/**
		 * Whether more pages exist after the current one.
		 * Use for cursor-based pagination where total is unknown.
		 */
		hasMore?: boolean;

		// --- Page size ---
		/**
		 * Number of items per page.
		 * @default 10
		 */
		pageSize?: number;
		/** Available page size options. Shows a page size selector when provided. */
		pageSizeOptions?: number[];
		/** Called when the page size changes. */
		onPageSizeChange?: (pageSize: number) => void;

		// --- Display ---
		/**
		 * Visual variant controlling what appears between prev/next buttons.
		 * - `pages`: Page number buttons with ellipsis (default)
		 * - `count`: "X–Y of Z" text
		 * - `compact`: "Page X of Y" text
		 * - `dots`: Dot indicators
		 * - `input`: An editable number box rendering "Page [ n ] / N". The leading
		 *   noun is controlled by `pageLabel`. First/last double-chevron buttons
		 *   flank prev/next by default (see `hasFirstLast`).
		 * - `none`: Just prev/next buttons
		 * @default 'pages'
		 */
		variant?: PaginationVariant;
		/**
		 * The noun rendered before the editable box in the `input` variant, e.g.
		 * "Page" or "Row". Navigation is always page-based (via `onChange`); this
		 * only relabels the box.
		 * @default the localized "Page"
		 */
		pageLabel?: string;
		/**
		 * Whether to show first/last («/») double-chevron buttons flanking
		 * prev/next. Only applies to the `input` variant; other variants ignore it.
		 * The last button needs a known total — it is omitted when the page count
		 * is unknown (cursor/`hasMore` pagination).
		 * @default true
		 */
		hasFirstLast?: boolean;
		/**
		 * Number of pages the previous/next («‹ ›») buttons advance per click.
		 * Clamped to the valid page range, so a step that would overshoot lands on
		 * the first/last page. When greater than 1, the buttons' accessible names
		 * reflect the stride (e.g. "Go forward 5 pages"). Non-integer or values < 1
		 * fall back to 1.
		 * @default 1
		 */
		step?: number;
		/**
		 * Number of page buttons to show on each side of the current page.
		 * Only applies when `variant='pages'`.
		 * @default 1
		 */
		siblingCount?: number;
		/**
		 * Size of the pagination controls.
		 * @default 'md'
		 */
		size?: PaginationSize;

		// --- Behavior ---
		/**
		 * Whether the component is disabled.
		 * @default false
		 */
		isDisabled?: boolean;

		// --- Accessibility ---
		/**
		 * Accessible label for the navigation landmark.
		 * @default 'Pagination'
		 */
		label?: string;

		// --- Standard Astryx ---
		/** Test ID for automated testing. */
		'data-testid'?: string;
	}

	/**
	 * Generates the range of page numbers to display, including ellipsis markers.
	 * Returns an array of page numbers and `'...'` strings.
	 *
	 * Public API — upstream's `Pagination/index.ts` publishes it beside the
	 * component, so it is declared in this module's `<script module>` block and
	 * re-exported from the barrel, exactly as upstream declares it in
	 * `Pagination.tsx`.
	 *
	 * @example
	 * ```
	 * generatePageRange(5, 10, 1) → [1, '...', 4, 5, 6, '...', 10]
	 * generatePageRange(1, 10, 1) → [1, 2, 3, '...', 10]
	 * generatePageRange(1, 5, 1)  → [1, 2, 3, 4, 5]
	 * ```
	 */
	export function generatePageRange(
		currentPage: number,
		totalPages: number,
		siblingCount: number
	): (number | '...')[] {
		// Total page number slots (excluding ellipses):
		// first + last + current + 2*siblings = 3 + 2*siblings
		// With 2 potential ellipsis slots: 5 + 2*siblings
		const totalSlots = 5 + 2 * siblingCount;

		// If total pages fit within slots, show all pages
		if (totalPages <= totalSlots) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
		const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

		const showLeftEllipsis = leftSiblingIndex > 2;
		const showRightEllipsis = rightSiblingIndex < totalPages - 1;

		if (!showLeftEllipsis && showRightEllipsis) {
			// Near the start: show more pages on the left
			const leftRange = 3 + 2 * siblingCount;
			const pages: (number | '...')[] = Array.from({ length: leftRange }, (_, i) => i + 1);
			pages.push('...', totalPages);
			return pages;
		}

		if (showLeftEllipsis && !showRightEllipsis) {
			// Near the end: show more pages on the right
			const rightRange = 3 + 2 * siblingCount;
			const pages: (number | '...')[] = [1, '...'];
			for (let i = totalPages - rightRange + 1; i <= totalPages; i++) {
				pages.push(i);
			}
			return pages;
		}

		// In the middle: show ellipsis on both sides
		const pages: (number | '...')[] = [1, '...'];
		for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
			pages.push(i);
		}
		pages.push('...', totalPages);
		return pages;
	}
</script>

<script lang="ts">
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useAnnounce } from '../../hooks/use-announce.js';
	import { useListFocus } from '../../hooks/use-list-focus.svelte.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { sizeVars } from '../../styles/tokens.stylex.js';
	import { rtlMirrorAttrs } from '../../utils/rtl.stylex.js';
	import Button from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';
	import NumberInput from '../number-input/number-input.svelte';
	import Selector from '../selector/selector.svelte';
	import Text from '../text/text.svelte';
	import {
		PAGE_SIZE_SELECTOR_WIDTH,
		paginationActivePageStyle,
		paginationControlsAttrs,
		paginationDotAttrs,
		paginationDotsContainerAttrs,
		paginationEllipsisAttrs,
		paginationInfoTextAttrs,
		paginationInputGroupAttrs,
		paginationInputLabelAttrs,
		paginationInputTotalAttrs,
		paginationPageSizeSelectorAttrs,
		paginationRootAttrs
	} from './pagination.stylex.js';

	/**
	 * Standalone pagination controls for navigating through pages of content.
	 *
	 * Supports multiple display variants: page numbers, count text, compact text,
	 * dot indicators, or minimal prev/next navigation. Works with known totals or
	 * cursor-based pagination.
	 *
	 * @example
	 * ```svelte
	 * <Pagination page={page} onChange={(p) => (page = p)} totalItems={200} pageSize={20} />
	 * ```
	 */
	const {
		page,
		onChange,
		changeAction,
		totalItems,
		totalPages: totalPagesProp,
		hasMore,
		pageSize: pageSizeProp = 10,
		pageSizeOptions,
		onPageSizeChange,
		variant = 'pages',
		pageLabel,
		hasFirstLast = true,
		step: stepProp = 1,
		siblingCount = 1,
		size = 'md',
		isDisabled = false,
		label: labelFromProps,
		'data-testid': testId,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: PaginationProps = $props();

	// Resolve system strings once per render. Prop overrides win.
	const t = useTranslator();
	const label = $derived(labelFromProps ?? t('@astryx.pagination.label'));
	const firstLabel = $derived(t('@astryx.pagination.first'));
	const lastLabel = $derived(t('@astryx.pagination.last'));

	const pageIndicatorsLabel = $derived(t('@astryx.pagination.pageIndicators'));
	const itemsPerPageLabel = $derived(t('@astryx.pagination.itemsPerPage'));
	const goToPageLabel = $derived(t('@astryx.pagination.goToPageInput'));
	const inputLabelText = $derived(pageLabel ?? t('@astryx.pagination.pageLabel'));

	// pageSize is typed as number, so 0, NaN, and negatives are valid at the
	// type level but yield Infinity/NaN page counts, and
	// Array.from({length: Infinity}) crashes the dots variant. Coerce to a
	// positive integer; non-finite values fall back to the default.
	const pageSize = $derived(
		Number.isFinite(pageSizeProp) ? Math.max(1, Math.floor(pageSizeProp)) : 10
	);

	// Prev/next stride. Same guard as pageSize: non-integer or < 1 falls back to
	// a single-page step so a bad value never freezes or reverses navigation.
	const step = $derived(Number.isInteger(stepProp) && stepProp >= 1 ? stepProp : 1);

	// The prev/next buttons advance `step` pages, so their accessible names must
	// reflect the stride: a plain "previous/next page" for the default single
	// step, or an explicit "back/forward N pages" so a screen reader never
	// announces a single-page move for a multi-page jump.
	const previousLabel = $derived(
		step > 1 ? t('@astryx.pagination.previousBy', { step }) : t('@astryx.pagination.previous')
	);
	const nextLabel = $derived(
		step > 1 ? t('@astryx.pagination.nextBy', { step }) : t('@astryx.pagination.next')
	);

	// Announce page changes politely (navigation-10). The controls carry no
	// live region, so page transitions were previously silent to screen readers.
	// Only user-driven changes go through handlePageChange, so initial mount is
	// never announced.
	const announce = useAnnounce();

	// Track the page optimistically so rapid prev/next clicks advance from the
	// in-flight target instead of stalling on the last committed page.
	const optimistic = createOptimistic(() => page);
	const optimisticPage = $derived(optimistic.current);

	// Roving-tabindex + arrow/Home/End keyboard nav for the dots variant, owned
	// by the shared useListFocus primitive (mirrors SegmentedControl). It stamps a
	// single tab stop across the dots and moves focus horizontally; selection
	// follows focus via handleDotsFocus so arrow keys move the active page.
	const dots = useListFocus(() => ({
		itemSelector: 'button',
		hasRovingTabIndex: true,
		wrap: true,
		orientation: 'horizontal' as const
	}));

	// Compute pagination state
	const computedTotalPages = $derived(
		totalPagesProp ?? (totalItems != null ? Math.ceil(totalItems / pageSize) : undefined)
	);

	const hasPrevious = $derived(optimisticPage > 1);
	const hasNext = $derived(
		computedTotalPages != null ? optimisticPage < computedTotalPages : (hasMore ?? false)
	);

	// Upstream's two `return null` early exits, which a Svelte component expresses
	// as a template guard rather than a return — the hooks above run either way on
	// both sides.
	const isEmpty = $derived(
		(totalItems != null && totalItems <= 0) ||
			(computedTotalPages != null && computedTotalPages <= 0)
	);

	// Interruptible: re-clicking before the action settles starts a fresh one with
	// the next optimistic page rather than being dropped, so there is no re-entry
	// guard.
	function handlePageChange(newPage: number): void {
		if (isDisabled) {
			return;
		}
		// Keep onChange urgent so controlled page state updates in the same commit
		// as the click; only the optimistic indicator and changeAction defer.
		onChange(newPage);
		announce(
			computedTotalPages != null
				? t('@astryx.pagination.pageOfTotal', { current: newPage, total: computedTotalPages })
				: t('@astryx.pagination.pageAnnounce', { current: newPage })
		);
		void optimistic.run(newPage, () => changeAction?.(newPage));
	}

	// Selection-follows-focus for the dots (APG radiogroup pattern): useListFocus
	// only *moves* focus, so when focus lands on a dot — via arrow/Home/End, or a
	// click that focuses it — we select that dot's page. `dots.handleFocus` keeps
	// the roving tab stop in sync. The current page is skipped so tabbing into the
	// group is a no-op.
	function handleDotsFocus(e: FocusEvent): void {
		dots.handleFocus(e);
		if (isDisabled) {
			return;
		}
		const focused = (e.target as HTMLElement | null)?.closest<HTMLElement>('button[data-page]');
		if (!focused) {
			return;
		}
		const nextPage = Number(focused.dataset.page);
		if (Number.isFinite(nextPage) && nextPage !== optimisticPage) {
			handlePageChange(nextPage);
		}
	}

	// Clamp a target page into the valid range. The lower bound is always 1; the
	// upper bound only exists when the page count is known (cursor/hasMore mode
	// leaves it open-ended).
	function clampPage(target: number): number {
		const lower = Math.max(target, 1);
		return computedTotalPages != null ? Math.min(lower, computedTotalPages) : lower;
	}

	function handlePrevious(): void {
		if (hasPrevious) {
			handlePageChange(clampPage(optimisticPage - step));
		}
	}

	function handleNext(): void {
		if (hasNext) {
			handlePageChange(clampPage(optimisticPage + step));
		}
	}

	function handleFirst(): void {
		if (hasPrevious) {
			handlePageChange(1);
		}
	}

	function handleLast(): void {
		if (hasNext && computedTotalPages != null) {
			handlePageChange(computedTotalPages);
		}
	}

	function handlePageSizeChange(value: string): void {
		const newSize = Number(value);
		onPageSizeChange?.(newSize);
		// Reset to page 1 when page size changes.
		handlePageChange(1);
	}

	// The value currently shown in the input box is the committed page number.
	const inputCommittedValue = $derived(optimisticPage);

	// NumberInput owns the typing/pending state and clamps to [min, max] with
	// integer-only semantics, so it only ever hands back a valid page here.
	// Navigation is page-based via onChange.
	function handleInputCommit(nextPage: number): void {
		if (isDisabled || nextPage === optimisticPage) {
			return;
		}
		handlePageChange(nextPage);
	}

	// Item range for count display
	const rangeStart = $derived((optimisticPage - 1) * pageSize + 1);
	const rangeEnd = $derived(
		totalItems != null ? Math.min(optimisticPage * pageSize, totalItems) : optimisticPage * pageSize
	);

	const buttonSize = $derived(size === 'sm' ? 'sm' : 'md');
	const isSm = $derived(size === 'sm');

	const pageRange = $derived(
		computedTotalPages != null
			? generatePageRange(optimisticPage, computedTotalPages, siblingCount)
			: []
	);

	// First/last buttons only exist in the input variant, and only when the page
	// count is known (they'd have no target otherwise).
	const showFirstLast = $derived(hasFirstLast && variant === 'input' && computedTotalPages != null);

	// The editable box needs a known page count to clamp against; in
	// cursor/hasMore mode (no total) there is no valid range, so the box is
	// disabled rather than accepting entries it can't resolve — matching the
	// convention that a typeable page box requires a known total.
	const isInputDisabled = $derived(isDisabled || computedTotalPages == null);

	const theme = $derived(themeProps('pagination', { variant, size }));
	const rootAttrs = $derived(paginationRootAttrs(xstyle));
	const controlsAttrs = paginationControlsAttrs();
	const infoTextAttrs = paginationInfoTextAttrs();
	const dotsContainerAttrs = paginationDotsContainerAttrs();
	const inputGroupAttrs = paginationInputGroupAttrs();
	const pageSizeSelectorAttrs = paginationPageSizeSelectorAttrs();
	// The RTL mirror lives on its own wrapper span, outside anything that could
	// set `transform` — the rule `rtl.stylex.ts`'s header records.
	const mirrorAttrs = rtlMirrorAttrs();
</script>

<!--
	Directional carets. Under RTL the "previous" control must point right and the
	"next" control left, and each caret gets that flip from the shared
	`rtlStyles.mirror` (a CSS `scaleX(-1)` keyed on an ancestor's `dir`) rather
	than from a JS direction read — so the server renders the final glyph and
	there is no hydration flash. The `aria-label`s stay semantic and are not
	flipped: "previous" still means previous.

	The mirror sits on a wrapper span rather than on the `<svg>`, which is where
	`rtl.stylex.ts` says it belongs — nothing else may own that element's
	`transform`.

	Named for their glyph now, not their role: with the flip in CSS the snippet
	called `chevronLeft` really does render `chevronLeft`, and upstream's
	`previousIcon`/`nextIcon` locals are gone for the same reason.
-->
{#snippet chevronLeftIcon()}
	<span class={mirrorAttrs.class} style={mirrorAttrs.style}>
		<Icon icon="chevronLeft" size={isSm ? 'sm' : 'md'} />
	</span>
{/snippet}

{#snippet chevronRightIcon()}
	<span class={mirrorAttrs.class} style={mirrorAttrs.style}>
		<Icon icon="chevronRight" size={isSm ? 'sm' : 'md'} />
	</span>
{/snippet}

{#snippet chevronsLeftIcon()}
	<span class={mirrorAttrs.class} style={mirrorAttrs.style}>
		<Icon icon="chevronsLeft" size={isSm ? 'sm' : 'md'} />
	</span>
{/snippet}

{#snippet chevronsRightIcon()}
	<span class={mirrorAttrs.class} style={mirrorAttrs.style}>
		<Icon icon="chevronsRight" size={isSm ? 'sm' : 'md'} />
	</span>
{/snippet}

{#snippet indicator()}
	{#if variant === 'pages'}
		{#if computedTotalPages != null}
			{#each pageRange as item, index (item === '...' ? `ellipsis-${pageRange[index - 1]}-${pageRange[index + 1]}` : item)}
				{#if item === '...'}
					{@const ellipsisAttrs = paginationEllipsisAttrs(isSm)}
					<span aria-hidden="true" class={ellipsisAttrs.class} style={ellipsisAttrs.style}>…</span>
				{:else}
					{@const isActive = item === optimisticPage}
					<Button
						label={t('@astryx.pagination.goToPage', { page: item })}
						aria-label={t('@astryx.pagination.goToPage', { page: item })}
						variant="ghost"
						size={buttonSize}
						onclick={() => handlePageChange(item)}
						{isDisabled}
						aria-current={isActive ? 'page' : undefined}
						xstyle={isActive && paginationActivePageStyle}
					>
						{item}
					</Button>
				{/if}
			{/each}
		{/if}
	{:else if variant === 'count'}
		{#if totalItems != null}
			<span class={infoTextAttrs.class} style={infoTextAttrs.style}>
				<Text type="body" size="sm" color="secondary">
					{t('@astryx.pagination.count', { from: rangeStart, to: rangeEnd, total: totalItems })}
				</Text>
			</span>
		{/if}
	{:else if variant === 'compact'}
		{#if computedTotalPages != null}
			<span class={infoTextAttrs.class} style={infoTextAttrs.style}>
				<Text type="body" size="sm" color="secondary">
					{t('@astryx.pagination.pageOfTotal', {
						current: optimisticPage,
						total: computedTotalPages
					})}
				</Text>
			</span>
		{/if}
	{:else if variant === 'dots'}
		{#if computedTotalPages != null}
			<!--
				`onfocusin`, not `onfocus`: upstream's React `onFocus` is the bubbling
				synthetic event, which the native `focus` is not — the correction
				`useListFocus` and `Toolbar` already record for their handlers.

				The handlers sit on the `role="group"` container rather than on each
				dot because that is what a roving tab stop needs: only one dot is
				focusable at a time, so the key and focus events are handled where they
				bubble to. Every dot inside is a real `<button>`.
			-->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				{@attach dots.attachList}
				class={dotsContainerAttrs.class}
				style={dotsContainerAttrs.style}
				role="group"
				aria-label={pageIndicatorsLabel}
				onkeydown={dots.handleKeyDown}
				onfocusin={handleDotsFocus}
			>
				{#each Array.from({ length: computedTotalPages }, (_, i) => i + 1) as dotPage (dotPage)}
					{@const isActive = dotPage === optimisticPage}
					{@const dotTheme = themeProps('pagination-dot', {
						active: isActive ? 'active' : null,
						size
					})}
					{@const dotAttrs = paginationDotAttrs(isSm, isActive, isDisabled)}
					<button
						type="button"
						data-page={dotPage}
						aria-label={t('@astryx.pagination.goToPage', { page: dotPage })}
						aria-current={isActive ? 'page' : undefined}
						{...dotTheme}
						class={cx(dotTheme.class, dotAttrs.class)}
						style={dotAttrs.style}
						tabindex={isActive ? 0 : -1}
						onclick={(e) => (e.currentTarget as HTMLButtonElement).focus()}
						disabled={isDisabled}
					></button>
				{/each}
			</div>
		{/if}
	{:else if variant === 'input'}
		<!--
			Label wording: "Page [ n ] / N". The leading noun comes from `pageLabel`;
			the trailing "/ N" total is omitted when unknown.
		-->
		{@const inputLabelTheme = themeProps('pagination-input-label', { size })}
		{@const inputLabelAttrs = paginationInputLabelAttrs(isSm)}
		{@const inputTotalTheme = themeProps('pagination-input-total', { size })}
		{@const inputTotalAttrs = paginationInputTotalAttrs(isSm)}
		<span class={inputGroupAttrs.class} style={inputGroupAttrs.style}>
			<span
				aria-hidden="true"
				{...inputLabelTheme}
				class={cx(inputLabelTheme.class, inputLabelAttrs.class)}
				style={inputLabelAttrs.style}
			>
				{inputLabelText}
			</span>
			<NumberInput
				label={goToPageLabel}
				isLabelHidden
				value={inputCommittedValue}
				onChange={handleInputCommit}
				min={1}
				max={computedTotalPages ?? undefined}
				isIntegerOnly
				{size}
				width={isSm ? sizeVars['--size-element-sm'] : sizeVars['--size-element-md']}
				isDisabled={isInputDisabled}
				data-testid={testId != null ? `${testId}-input` : undefined}
			/>
			{#if computedTotalPages != null}
				<span
					{...inputTotalTheme}
					class={cx(inputTotalTheme.class, inputTotalAttrs.class)}
					style={inputTotalAttrs.style}
				>
					{t('@astryx.pagination.ofTotalPages', { total: computedTotalPages })}
				</span>
			{/if}
		</span>
	{/if}
{/snippet}

{#if !isEmpty}
	<nav
		{...rest}
		{...theme}
		class={cx(theme.class, rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
		aria-label={label}
		data-testid={testId}
	>
		{#if pageSizeOptions != null && pageSizeOptions.length > 0}
			<div class={pageSizeSelectorAttrs.class} style={pageSizeSelectorAttrs.style}>
				<!--
					`width`, not `xstyle`: Selector's xstyle lands on the trigger box,
					while `width` sizes the whole field — which is what the removed
					wrapper did.
				-->
				<Selector
					label={itemsPerPageLabel}
					isLabelHidden
					options={pageSizeOptions.map((opt) => String(opt))}
					value={String(pageSize)}
					onChange={handlePageSizeChange}
					size={buttonSize}
					{isDisabled}
					width={PAGE_SIZE_SELECTOR_WIDTH}
				/>
			</div>
		{/if}
		<div class={controlsAttrs.class} style={controlsAttrs.style}>
			{#if showFirstLast}
				<Button
					label={firstLabel}
					tooltip={isDisabled || !hasPrevious ? undefined : firstLabel}
					variant="ghost"
					size={buttonSize}
					icon={chevronsLeftIcon}
					onclick={handleFirst}
					isDisabled={isDisabled || !hasPrevious}
					isIconOnly
				/>
			{/if}

			<Button
				label={previousLabel}
				tooltip={isDisabled || !hasPrevious ? undefined : previousLabel}
				variant="ghost"
				size={buttonSize}
				icon={chevronLeftIcon}
				onclick={handlePrevious}
				isDisabled={isDisabled || !hasPrevious}
				isIconOnly
			/>

			{@render indicator()}

			<Button
				label={nextLabel}
				tooltip={isDisabled || !hasNext ? undefined : nextLabel}
				variant="ghost"
				size={buttonSize}
				icon={chevronRightIcon}
				onclick={handleNext}
				isDisabled={isDisabled || !hasNext}
				isIconOnly
			/>

			{#if showFirstLast}
				<Button
					label={lastLabel}
					tooltip={isDisabled || !hasNext ? undefined : lastLabel}
					variant="ghost"
					size={buttonSize}
					icon={chevronsRightIcon}
					onclick={handleLast}
					isDisabled={isDisabled || !hasNext}
					isIconOnly
				/>
			{/if}
		</div>
	</nav>
{/if}
