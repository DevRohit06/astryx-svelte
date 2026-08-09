import type { Snippet } from 'svelte';

/**
 * Ported from Astryx's `TreeList/TreeListTypes.ts`.
 *
 * `TreeList` is data-driven upstream too — the recursion walks an `items` array,
 * not `Children.toArray` — so nothing here needs the snippet translation
 * `OverflowList`/`Carousel` had to make. The three `ReactNode` members become
 * the port's leaf-slot shapes: `label` is `string | Snippet` (a plain string is
 * what every upstream call site passes), `startContent`/`endContent` are plain
 * `Snippet`s.
 */

/** Spacing density for tree list items. */
export type TreeListDensity = 'compact' | 'balanced' | 'spacious';

/**
 * Extensible variant map for `TreeList`.
 *
 * A theme package adds custom variants by augmenting this interface, as
 * upstream's does:
 *
 * ```ts
 * declare module '@astryx-svelte/core' {
 *   interface TreeListVariantMap {
 *     dotted: true;
 *   }
 * }
 * ```
 */
export interface TreeListVariantMap {
	lineGuides: true;
	noGuides: true;
}

/**
 * Visual treatment of the hierarchy guide (connector) lines. Extensible via
 * module augmentation of `TreeListVariantMap`.
 * - `lineGuides`: connector lines between parent and child rows (default)
 * - `noGuides`: no connector lines; indentation alone conveys nesting
 */
export type TreeListVariant = keyof TreeListVariantMap;

/** Recursive item configuration for `TreeList`. */
export interface TreeListItemData {
	/** Unique identifier for the item. Used as the `{#each}` key and for expansion tracking. */
	id: string;

	/** Primary text label for the item. */
	label: string | Snippet;

	/** Secondary description text below the label. */
	description?: string;

	/** Content rendered before the label (icon, avatar, checkbox). */
	startContent?: Snippet;

	/** Content rendered after the label (badge, action button). */
	endContent?: Snippet;

	/** Nested child items. When present, the item renders an expand/collapse toggle. */
	children?: TreeListItemData[];

	/** Click handler for the item. */
	onClick?: (e: MouseEvent) => void;

	/** URL for link items. Renders an invisible anchor element. */
	href?: string;

	/** Link target (e.g. `'_blank'`). Only used with `href`. */
	target?: string;

	/** Whether the item is disabled. */
	isDisabled?: boolean;

	/** Whether the item is currently selected. */
	isSelected?: boolean;

	/** Whether the item is initially expanded. Only meaningful for items with children. */
	isExpanded?: boolean;
}
