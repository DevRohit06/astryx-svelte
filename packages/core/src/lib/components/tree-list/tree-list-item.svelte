<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { TreeListDensity, TreeListVariant } from './tree-list-types.js';

	/**
	 * Internal props — `TreeListItem` is not published (upstream's `index.ts`
	 * exports only `TreeList` and its types), so this interface stays private too.
	 * Every member is positional data `TreeList`'s recursion computes.
	 */
	export interface TreeListItemInternalProps {
		id: string;
		label: string | Snippet;
		description?: string;
		startContent?: Snippet;
		endContent?: Snippet;
		onClick?: (e: MouseEvent) => void;
		href?: string;
		target?: string;
		isDisabled?: boolean;
		isSelected?: boolean;
		hasChildren: boolean;
		nestedLevel: number;
		isLast: boolean;
		ancestorsIsLast: ReadonlyArray<boolean>;
		isExpanded: boolean;
		onToggle?: (id: string) => void;
		density: TreeListDensity;
		/**
		 * Guide-line visual treatment. `noGuides` suppresses the connector lines;
		 * indentation alone then conveys nesting.
		 */
		variant: TreeListVariant;
		/** Pre-rendered children subtree (rendered by the parent recursion). */
		renderedChildren?: Snippet;
		/** 1-based position of this item among its siblings (aria-posinset). */
		posInSet: number;
		/** Number of siblings at this level (aria-setsize). */
		setSize: number;
		/**
		 * Whether this treeitem is the initial roving-tabindex seed. Exactly one
		 * treeitem is seeded tabbable at mount; `useTreeFocus` (`hasRovingTabIndex`)
		 * then owns the tab stop dynamically.
		 */
		isTabbable: boolean;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { spacingVars } from '../../styles/tokens.stylex.js';
	import Icon from '../icon/icon.svelte';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import LinkElement from '../link/link-element.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import TreeListBranches from './tree-list-branches.svelte';
	import {
		treeItemBranchesAttrs,
		treeItemChevronButtonAttrs,
		treeItemChevronCollapsedStyle,
		treeItemChevronContainerAttrs,
		treeItemChevronExpandedStyle,
		treeItemChevronSvgStyle,
		treeItemChildGroupAttrs,
		treeItemContentAttrs,
		treeItemContentWrapperAttrs,
		treeItemDescriptionAttrs,
		treeItemEndContentAttrs,
		treeItemInvisibleAnchorAttrs,
		treeItemInvisibleButtonAttrs,
		treeItemLabelAttrs,
		treeItemRowWrapperAttrs,
		treeItemStartContentAttrs,
		treeItemWrapperAttrs
	} from './tree-list-item.stylex.js';

	let {
		id,
		label,
		description,
		startContent,
		endContent,
		onClick,
		href,
		target,
		isDisabled = false,
		isSelected = false,
		hasChildren,
		nestedLevel,
		isLast,
		ancestorsIsLast,
		isExpanded,
		onToggle,
		density,
		variant,
		renderedChildren,
		posInSet,
		setSize,
		isTabbable
	}: TreeListItemInternalProps = $props();

	const t = useTranslator();
	const labelId = $props.id();
	const descriptionId = `${labelId}-description`;
	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink());
	const isInteractive = $derived(onClick != null || href != null);
	const canToggle = $derived(hasChildren && onToggle != null);

	function handleToggle(e: MouseEvent): void {
		e.stopPropagation();
		onToggle?.(id);
	}

	function handleClick(e: MouseEvent): void {
		if (isDisabled) {
			return;
		}
		const el = e.target as HTMLElement;
		if (el.closest('button, a, input, select, textarea')) {
			return;
		}
		if (onClick != null) {
			onClick(e);
		} else if (canToggle) {
			onToggle?.(id);
		}
	}

	// Per-level indent distance. The per-level step is the public, themeable
	// `--tree-list-indent` lever (default `--spacing-4`, set on the tree-list
	// root). Leaves add a fixed chevron-column offset (chevron width + gap) so
	// their labels line up with sibling parents' labels; that offset is tied to
	// the chevron's own dimensions, not the indent step, so it does not scale
	// with the lever. Published as the private `--_tree-indent` and consumed by
	// `contentWrapper`'s stylesheet `margin-inline-start` (kept out of the inline
	// style so the theme layer can override it — see upstream #4308).
	const indentDistance = $derived(
		hasChildren
			? `calc(${nestedLevel} * var(--tree-list-indent))`
			: `calc(${nestedLevel} * var(--tree-list-indent) + ${spacingVars['--spacing-4']} + ${spacingVars['--spacing-2']})`
	);

	const theme = $derived(
		themeProps('tree-list-item', {
			density,
			selected: isSelected ? 'selected' : null,
			disabled: isDisabled ? 'disabled' : null
		})
	);

	const wrapperAttrs = treeItemWrapperAttrs();
	const childGroupAttrs = treeItemChildGroupAttrs();
	const branchesAttrs = treeItemBranchesAttrs();
	const rowWrapperAttrs = treeItemRowWrapperAttrs();
	const contentWrapperAttrs = $derived(
		treeItemContentWrapperAttrs(
			density,
			isInteractive || (hasChildren && onClick == null),
			isDisabled,
			isSelected
		)
	);
	const anchorAttrs = treeItemInvisibleAnchorAttrs();
	const buttonAttrs = treeItemInvisibleButtonAttrs();
	const contentAttrs = treeItemContentAttrs();
	const labelAttrs = treeItemLabelAttrs();
	const descriptionAttrs = $derived(treeItemDescriptionAttrs(density));
	const startAttrs = treeItemStartContentAttrs();
	const endAttrs = treeItemEndContentAttrs();
	const chevronContainerAttrs = treeItemChevronContainerAttrs();
	const chevronButtonAttrs = treeItemChevronButtonAttrs();
	const chevronXstyle = $derived([
		treeItemChevronSvgStyle,
		isExpanded ? treeItemChevronExpandedStyle : treeItemChevronCollapsedStyle
	]);

	// Stable theme target on the chevron, reflecting the open/closed state, so a
	// theme can restyle the toggle and each of its states without a fragile
	// `[data-tree-toggle]` selector. Both the interactive `<button>` and the inert
	// `<span>` branch carry it, as upstream's do.
	const chevronTheme = $derived(
		themeProps('tree-list-chevron', { state: isExpanded ? 'expanded' : 'collapsed' })
	);

	// The polymorphic link props for the invisible-anchor branch; custom
	// components also get a `to={href}` alias, as `Item`'s do.
	const anchorProps = $derived({
		href,
		...(linkResolved.isNative ? {} : { to: href }),
		target,
		'aria-disabled': isDisabled || undefined,
		'aria-labelledby': labelId,
		'aria-describedby': description != null ? descriptionId : undefined,
		// Roving tabindex lives on the treeitem row; inner action is not a
		// separate tab stop. Activation is forwarded from the row.
		tabindex: -1,
		class: anchorAttrs.class,
		style: anchorAttrs.style
	});
</script>

{#snippet labelAndDescription()}
	<!--
		Stable theme target on the label, reflecting the row's `selected` state so a
		theme can (e.g.) bold just the selected item's label via `defineTheme`.
	-->
	{@const labelTheme = themeProps('tree-list-item-label', {
		selected: isSelected ? 'selected' : null
	})}
	<span
		id={labelId}
		{...labelTheme}
		class={cx(labelTheme.class, labelAttrs.class)}
		style={labelAttrs.style}
	>
		{#if typeof label === 'function'}{@render label()}{:else}{label}{/if}
	</span>
	{#if description != null}
		<span id={descriptionId} class={descriptionAttrs.class} style={descriptionAttrs.style}>
			{description}
		</span>
	{/if}
{/snippet}

<!--
	Both wrappers are gone (#4838). `Icon` renders the glyph's span itself —
	carrying the pre-existing `astryx-icon` target — so the rotation rides that
	same element, and the RTL mirror is spelled out inside each state's
	`transform` rather than nested on an outer span. One element, one transform,
	one theme target.

	`sm` is the nearest size to the 16px chevron column; `chevronSvgStyle`
	re-pins the exact box, because the column is spacing-token-sized rather than
	rem-sized. The button/container owns the colour, so the glyph inherits it.
-->
{#snippet chevronGlyph()}
	<Icon icon="chevronRight" size="sm" color="inherit" xstyle={chevronXstyle} />
{/snippet}

<li
	role="treeitem"
	aria-expanded={hasChildren ? isExpanded : undefined}
	aria-selected={isSelected || undefined}
	aria-disabled={isDisabled || undefined}
	aria-level={nestedLevel + 1}
	aria-posinset={posInSet}
	aria-setsize={setSize}
	tabindex={isDisabled ? -1 : isTabbable ? 0 : -1}
	data-tree-id={id}
	data-tree-level={nestedLevel + 1}
	data-tree-disabled={isDisabled || undefined}
	class={wrapperAttrs.class}
	style={wrapperAttrs.style}
>
	{#if variant !== 'noGuides'}
		<div class={branchesAttrs.class} style={branchesAttrs.style}>
			<TreeListBranches {ancestorsIsLast} {isLast} {nestedLevel} />
		</div>
	{/if}
	<div class={rowWrapperAttrs.class} style={rowWrapperAttrs.style}>
		<!--
			The row's click is a convenience path only: keyboard activation runs
			through the `<li role="treeitem">`'s roving tab stop and `useTreeFocus`,
			and every actual action (link, button, chevron toggle) is a real focusable
			control inside. That is why no key handler is needed here.
		-->
		<div
			{...theme}
			class="{theme.class} {contentWrapperAttrs.class}"
			style={mergeStyle(contentWrapperAttrs.style, `--_tree-indent:${indentDistance}`)}
			onclick={onClick != null || canToggle ? handleClick : undefined}
		>
			{#if hasChildren}
				{#if canToggle}
					<!--
						Real toggle button whenever expand/collapse is supported, so the row
						can be expanded from the keyboard even when the item has no
						onClick/href (row-level onClick is the only click path in that case,
						but there is no focusable element to receive Enter/Space). The row's
						handleClick ignores clicks originating inside a <button>, so this
						never double-toggles.
					-->
					<button
						type="button"
						aria-expanded={isExpanded}
						aria-label={t('@astryx.treeList.toggleChildren')}
						data-tree-toggle=""
						disabled={isDisabled}
						tabindex={-1}
						onclick={handleToggle}
						{...chevronTheme}
						class={cx(chevronTheme.class, chevronButtonAttrs.class)}
						style={chevronButtonAttrs.style}
					>
						{@render chevronGlyph()}
					</button>
				{:else}
					<!-- Non-interactive chevron only when toggling is not wired up at all -->
					<span
						{...chevronTheme}
						class={cx(chevronTheme.class, chevronContainerAttrs.class)}
						style={chevronContainerAttrs.style}
					>
						{@render chevronGlyph()}
					</span>
				{/if}
			{/if}
			{#if startContent != null}
				<span class={startAttrs.class} style={startAttrs.style}>{@render startContent()}</span>
			{/if}
			{#if href != null}
				<LinkElement component={linkResolved.component} props={anchorProps}>
					{@render labelAndDescription()}
				</LinkElement>
			{:else if onClick != null}
				<button
					type="button"
					onclick={onClick}
					disabled={isDisabled}
					aria-labelledby={labelId}
					aria-describedby={description != null ? descriptionId : undefined}
					tabindex={-1}
					class={buttonAttrs.class}
					style={buttonAttrs.style}
				>
					{@render labelAndDescription()}
				</button>
			{:else}
				<span class={contentAttrs.class} style={contentAttrs.style}>
					{@render labelAndDescription()}
				</span>
			{/if}
			{#if endContent != null}
				<span class={endAttrs.class} style={endAttrs.style}>{@render endContent()}</span>
			{/if}
		</div>
	</div>
	{#if isExpanded && renderedChildren != null}
		<ul role="group" class={childGroupAttrs.class} style={childGroupAttrs.style}>
			{@render renderedChildren()}
		</ul>
	{/if}
</li>
