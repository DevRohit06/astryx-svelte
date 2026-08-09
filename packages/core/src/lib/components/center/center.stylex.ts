import * as stylex from '@stylexjs/stylex';
import { paddingBlockStyles, paddingInlineStyles } from '../../internal/padding.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { SizeValue, SpacingStep } from '../../internal/types.js';

/** Which axis (or axes) to centre on. */
export type CenterAxis = 'both' | 'horizontal' | 'vertical';

const styles = stylex.create({
	base: {
		display: 'flex'
	},
	inline: {
		display: 'inline-flex'
	},
	alignItemsCenter: {
		alignItems: 'center'
	},
	justifyContentCenter: {
		justifyContent: 'center'
	}
});

// Dynamic styles for sizing props. Unlike Stack and Grid, Center routes its
// dimensions through StyleX rather than a raw inline style — the compiler mints
// a class per property that reads a custom property, which `sx()` then hands to
// Svelte as `style="--x-width:…"`.
const dynamicStyles = stylex.create({
	sizing: (
		width: SizeValue | null,
		height: SizeValue | null,
		maxWidth: SizeValue | null,
		minHeight: SizeValue | null
	) => ({
		width,
		height,
		maxWidth,
		minHeight
	})
});

export interface CenterAttrsOptions {
	axis: CenterAxis;
	isInline: boolean;
	width?: SizeValue;
	height?: SizeValue;
	maxWidth?: SizeValue;
	minHeight?: SizeValue;
	/**
	 * Already resolved per axis by the component — `padding` sets both, and the
	 * per-axis prop wins on its own axis, exactly as `Stack` resolves them.
	 */
	paddingInline?: SpacingStep;
	paddingBlock?: SpacingStep;
}

export function centerAttrs(
	{
		axis,
		isInline,
		width,
		height,
		maxWidth,
		minHeight,
		paddingInline,
		paddingBlock
	}: CenterAttrsOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		isInline ? styles.inline : styles.base,
		(axis === 'both' || axis === 'vertical') && styles.alignItemsCenter,
		(axis === 'both' || axis === 'horizontal') && styles.justifyContentCenter,
		dynamicStyles.sizing(width ?? null, height ?? null, maxWidth ?? null, minHeight ?? null),
		// The padding groups are `Layout/padding.stylex`'s, shared with Stack, Card,
		// LayoutContent and LayoutPanel — upstream imports the same two here rather
		// than restating them, so no new class is minted for Center.
		paddingInline != null && paddingInlineStyles[paddingInline],
		paddingBlock != null && paddingBlockStyles[paddingBlock],
		xstyle
	);
}
