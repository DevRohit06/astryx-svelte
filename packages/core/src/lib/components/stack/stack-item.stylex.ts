import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';

/**
 * "Resets" the min-width and min-height of the flex item so it behaves
 * predictably.
 *
 * Flex items have an implicit min size of `auto`, meaning they never shrink
 * below their contents. This reset lets an item be constrained by its flex
 * parent, and become scrollable if it has to.
 */
const minSizeResetStyles = stylex.create({
	reset: {
		minHeight: 0,
		minWidth: 0
	}
});

const crossAlignSelfStyles = stylex.create({
	center: {
		alignSelf: 'center'
	},
	end: {
		alignSelf: 'flex-end'
	},
	start: {
		alignSelf: 'flex-start'
	},
	stretch: {
		alignSelf: 'stretch'
	}
});

/** Overrides the cross-alignment the parent stack set, for this item alone. */
export type StackItemCrossAlignSelf = keyof typeof crossAlignSelfStyles;

const sizeStyles = stylex.create({
	/**
	 * Fill the remaining space inside the stack, split evenly with any other
	 * `fill` items.
	 */
	fill: {
		flexGrow: 1
	},
	/** Neither grow nor shrink; use the item's intrinsic size. */
	static: {
		flexGrow: 0,
		flexShrink: 0
	}
});

/** How the item takes up space in the stack. */
export type StackItemSize = keyof typeof sizeStyles;

const overflowStyles = stylex.create({
	scrollable: {
		overflow: 'auto'
	}
});

export interface StackItemOptions {
	/** Overrides the stack's cross-alignment for this item alone. */
	crossAlignSelf?: StackItemCrossAlignSelf;
	/** @default 'static' */
	size?: StackItemSize;
}

/**
 * The flex-item styles for a stack child, as a list to spread into `sx()` —
 * upstream's `stackItem()` verbatim. See `stack()` for why the list form exists.
 */
export function stackItem({ crossAlignSelf, size }: StackItemOptions = {}) {
	return [
		minSizeResetStyles.reset,
		sizeStyles[size ?? 'static'],
		crossAlignSelf != null && crossAlignSelfStyles[crossAlignSelf]
	] as const;
}

export interface StackItemAttrsOptions extends StackItemOptions {
	isScrollable?: boolean;
}

/** The finished `class`/`style` pair for a `<StackItem>`. */
export function stackItemAttrs(
	{ crossAlignSelf, size, isScrollable }: StackItemAttrsOptions = {},
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		...stackItem({ crossAlignSelf, size }),
		isScrollable && overflowStyles.scrollable,
		xstyle
	);
}
