import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { edgeCompSlot } from '../../internal/edge-compensation.stylex.js';
import type { SpacingStep } from '../../internal/types.js';
import type { ElementSize } from '../../internal/contexts.svelte.js';
import { sizeVars, spacingVars } from '../../styles/tokens.stylex.js';

/** Map `SpacingStep` values to `spacingVars` keys. */
const spacingStepToVar: Record<SpacingStep, keyof typeof spacingVars> = {
	0: '--spacing-0',
	0.5: '--spacing-0-5',
	1: '--spacing-1',
	1.5: '--spacing-1-5',
	2: '--spacing-2',
	3: '--spacing-3',
	4: '--spacing-4',
	5: '--spacing-5',
	6: '--spacing-6',
	8: '--spacing-8',
	10: '--spacing-10'
};

/**
 * Ported from Astryx's `Toolbar/Toolbar.tsx` styles.
 *
 * Every key stays an object in upstream's `dist/`: each call site merges a
 * dynamic `dynamicStyles.gap(...)`, so the compiler could not fold any of them
 * into a literal string. There are no inline call sites to compare.
 */
const styles = stylex.create({
	// Two-slot layout (no centerContent): flex row, space-between
	baseFlex: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	// Three-slot layout (with centerContent): CSS grid 1fr auto 1fr
	baseGrid: {
		display: 'grid',
		gridTemplateColumns: '1fr auto 1fr',
		alignItems: 'center'
	},
	vertical: {
		flexDirection: 'column',
		alignItems: 'stretch'
	},
	startSlot: {
		display: 'flex',
		alignItems: 'center'
	},
	centerSlot: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: 0,
		overflow: 'hidden'
	},
	endSlot: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	// When only startContent is present, let it fill
	startOnly: {
		flex: '1 1 0%'
	},
	// When only endContent, push to end
	endOnly: {
		marginInlineStart: 'auto'
	}
});

const sizeStyles = stylex.create({
	base: {
		minHeight: sizeVars['--size-element-sm']
	}
});

const dynamicStyles = stylex.create({
	gap: (gapValue: string) => ({
		gap: gapValue
	}),
	tabIndicatorBottom: (offset: string) => ({
		'--_tab-indicator-bottom': offset
	})
});

/**
 * Default block padding per toolbar size. Inline padding comes from the parent
 * container (`Card`, `Section`, `LayoutHeader`) through the `Section` theme
 * default — the toolbar only controls its vertical tightness.
 */
export const defaultBlockPaddingForSize: Record<ElementSize, SpacingStep> = {
	sm: 2,
	md: 2,
	lg: 2
};

const blockPaddingVarForSize: Record<ElementSize, string> = {
	sm: spacingVars['--spacing-2'],
	md: spacingVars['--spacing-2'],
	lg: spacingVars['--spacing-2']
};

/**
 * Edge-compensation inset per toolbar size — the container's inline padding
 * minus the toolbar's block padding, so edge-compensated items (ghost buttons,
 * tabs) end up evenly spaced.
 */
const edgeCompInsetForSize: Record<ElementSize, string> = {
	sm: `calc(var(--container-padding-inline-start, ${spacingVars['--spacing-4']}) - ${spacingVars['--spacing-2']})`,
	md: `calc(var(--container-padding-inline-start, ${spacingVars['--spacing-4']}) - ${spacingVars['--spacing-2']})`,
	lg: `calc(var(--container-padding-inline-start, ${spacingVars['--spacing-4']}) - ${spacingVars['--spacing-2']})`
};

/**
 * The gap value for a spacing step. Cast for the same reason upstream casts:
 * `spacingVars` is a `defineVars` map whose indexed access widens past `string`.
 */
function gapVarFor(gap: SpacingStep): string {
	return spacingVars[spacingStepToVar[gap]] as string;
}

/** The `role="toolbar"` element inside the `Section`. */
export function toolbarAttrs(
	hasCenterContent: boolean,
	orientation: 'horizontal' | 'vertical',
	size: ElementSize,
	gap: SpacingStep,
	hasBottomDivider: boolean
): SvelteStyleAttrs {
	return sx(
		hasCenterContent ? styles.baseGrid : styles.baseFlex,
		orientation === 'vertical' && styles.vertical,
		sizeStyles.base,
		dynamicStyles.gap(gapVarFor(gap)),
		// Only drop the tab indicator through the toolbar's block padding onto the
		// rail when a bottom divider is actually present. Without one, leave
		// `--_tab-indicator-bottom` unset so a nested `TabList`'s indicator keeps
		// its own default (hugging the tab) instead of floating into the padding.
		hasBottomDivider &&
			dynamicStyles.tabIndicatorBottom(`calc(-1 * (${blockPaddingVarForSize[size]} + 1px))`)
	);
}

/** The start slot. `isOnly` lets it fill when there is no end content. */
export function toolbarStartSlotAttrs(
	size: ElementSize,
	gap: SpacingStep,
	isOnly: boolean
): SvelteStyleAttrs {
	return sx(
		styles.startSlot,
		isOnly && styles.startOnly,
		edgeCompSlot.inset(edgeCompInsetForSize[size]),
		dynamicStyles.gap(gapVarFor(gap))
	);
}

/** The centre slot — only present in the three-slot grid layout. */
export function toolbarCenterSlotAttrs(gap: SpacingStep): SvelteStyleAttrs {
	return sx(styles.centerSlot, dynamicStyles.gap(gapVarFor(gap)));
}

/** The end slot. `isOnly` pushes it to the end when there is no start content. */
export function toolbarEndSlotAttrs(
	size: ElementSize,
	gap: SpacingStep,
	isOnly: boolean
): SvelteStyleAttrs {
	return sx(
		styles.endSlot,
		isOnly && styles.endOnly,
		edgeCompSlot.inset(edgeCompInsetForSize[size]),
		dynamicStyles.gap(gapVarFor(gap))
	);
}
