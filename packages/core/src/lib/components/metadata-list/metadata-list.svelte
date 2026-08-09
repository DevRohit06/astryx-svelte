<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { MetadataListLabelConfig } from './metadata-list-context.svelte.js';
	import type { MetadataListColumns } from './metadata-list.stylex.js';

	export interface MetadataListProps extends Omit<BaseProps<HTMLDivElement>, 'title'> {
		/** The items — `MetadataListItem` components. */
		children: Snippet;
		/**
		 * - `single`: one column
		 * - `multi`: auto-fill columns to the available width
		 * - a number: that many columns
		 * @default 'single'
		 */
		columns?: MetadataListColumns;
		/**
		 * Where labels sit, and how wide the label column is. Defaults to
		 * `{ position: 'top' }` for multi-column layouts and
		 * `{ position: 'start' }` for single-column ones — side labels do not work
		 * well once items are in separate grid cells.
		 */
		label?: MetadataListLabelConfig;
		/**
		 * Show at most this many items, with a "Show more" / "Show less" toggle
		 * when there are more. Ignored in horizontal orientation.
		 */
		maxNumOfItems?: number;
		/**
		 * `horizontal` flows items in a wrapping row with labels stacked above
		 * their values, and ignores `columns`, `label` and `maxNumOfItems`.
		 * @default 'vertical'
		 */
		orientation?: 'vertical' | 'horizontal';
		/** A heading above the list. */
		title?: Snippet;
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { setMetadataListContext } from './metadata-list-context.svelte.js';
	import {
		metadataListGridAttrs,
		metadataListRootAttrs,
		metadataListTitleAttrs,
		metadataListToggleAttrs
	} from './metadata-list.stylex.js';

	/**
	 * A read-only labelled list for key/value metadata, as semantic
	 * `<dl>` / `<dt>` / `<dd>`.
	 *
	 * `maxNumOfItems` is where this differs from upstream *inside* while matching
	 * it outside: React counts and slices `children` directly, and Svelte content
	 * is one opaque snippet with nothing to count. Items register with the
	 * context during init instead — see `metadata-list-context.svelte.ts` for why
	 * that still puts the toggle in the server-rendered HTML.
	 *
	 * @example
	 * ```svelte
	 * <MetadataList columns="multi">
	 *   <MetadataListItem label="Name">MetadataList</MetadataListItem>
	 *   <MetadataListItem label="Status">Active</MetadataListItem>
	 * </MetadataList>
	 * ```
	 */
	const {
		children,
		columns = 'single',
		label,
		maxNumOfItems,
		orientation = 'vertical',
		title,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: MetadataListProps = $props();

	const LABEL_START: MetadataListLabelConfig = { position: 'start' };
	const LABEL_TOP: MetadataListLabelConfig = { position: 'top' };

	const contentId = $props.id();
	const t = useTranslator();

	let isShowAll = $state(false);
	let total = $state(0);

	const isMultiColumn = $derived(
		columns === 'multi' || (typeof columns === 'number' && columns > 1)
	);
	const labelConfig = $derived(label ?? (isMultiColumn ? LABEL_TOP : LABEL_START));
	const isHorizontal = $derived(orientation === 'horizontal');

	// Horizontal mode ignores maxNumOfItems, as upstream's does.
	const effectiveMax = $derived(isHorizontal ? undefined : maxNumOfItems);

	/**
	 * A function, not a `$derived`, and that is load-bearing rather than a style
	 * choice: `total` grows *while the items render*, and a derived is computed
	 * once per server render and then cached. Reading it from the first item —
	 * when `total` is 1 — would freeze it at `false` for the whole pass, so the
	 * cut and the toggle would both be missing from the server-rendered HTML and
	 * appear only after hydration. A call re-evaluates every time, which is what
	 * makes each item see the count as it stood when *it* rendered, and the
	 * toggle see the final one. Reading `$state` inside a template expression is
	 * tracked, so the client stays reactive either way.
	 */
	const exceedsMax = () => effectiveMax != null && total > effectiveMax;

	setMetadataListContext(() => ({
		labelConfig: isHorizontal ? LABEL_TOP : labelConfig,
		orientation,
		register: () => total++,
		isItemVisible: (index) => !exceedsMax() || isShowAll || index < effectiveMax!
	}));

	const root = $derived(metadataListRootAttrs(xstyle));
	const titleAttrs = metadataListTitleAttrs();
	const toggle = metadataListToggleAttrs();

	// The grid template for a fixed numeric column count, or for a custom label
	// width. Both are runtime values, so they resolve to a StyleX dynamic style
	// rather than an inline `style` object. The track shape depends on the label
	// position: stacked labels put a whole item in one cell, while side labels
	// split each item into a label track and a value track.
	const gridTemplateColumns = $derived.by((): string | null => {
		if (isHorizontal) return null;
		const isStacked = labelConfig.position === 'top';
		if (typeof columns === 'number' && columns > 1) {
			return isStacked ? `repeat(${columns}, 1fr)` : `repeat(${columns}, auto 1fr)`;
		}
		// A custom label width only applies to the label track of side labels.
		if (!isStacked && labelConfig.width != null) {
			const width =
				typeof labelConfig.width === 'number' ? `${labelConfig.width}px` : labelConfig.width;
			return `${width} 1fr`;
		}
		return null;
	});

	const grid = $derived(
		metadataListGridAttrs({
			columns,
			isStacked: labelConfig.position === 'top',
			isHorizontal,
			gridTemplateColumns
		})
	);

	const theme = $derived(themeProps('metadata-list', { columns: String(columns), orientation }));
</script>

<div
	{...theme}
	class={cx(theme.class, root.class, className)}
	style={mergeStyle(root.style, styleProp as string | undefined)}
	{...rest}
>
	{#if title}
		<div class={titleAttrs.class} style={titleAttrs.style}>{@render title()}</div>
	{/if}
	<dl id={contentId} class={grid.class} style={grid.style}>
		{@render children()}
	</dl>
	{#if exceedsMax()}
		<button
			type="button"
			aria-controls={contentId}
			aria-expanded={isShowAll}
			onclick={() => (isShowAll = !isShowAll)}
			class={toggle.class}
			style={toggle.style}
		>
			{isShowAll ? t('@astryx.metadataList.showLess') : t('@astryx.metadataList.showMore')}
		</button>
	{/if}
</div>
