import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	sizeVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Pagination/Pagination.tsx`, where the one style group is
 * declared inline in the component file under the name `styles`, so ours needs
 * no rename.
 *
 * `styles.disabled` is **dead upstream** — declared and never applied (the
 * disabled treatment is each `Button`'s own `isDisabled`, plus `styles.dotDisabled`
 * on the dots) — so `dist/` folds it away and neither oracle mode has a
 * counterpart to diff it against. Ported for parity anyway, the standing
 * `selector.stylex.ts`'s `itemCheckmark` and `tab-menu.stylex.ts`'s already have.
 */

const styles = stylex.create({
	root: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacingVars['--spacing-4']
	},
	controls: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	ellipsis: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: sizeVars['--size-element-md'],
		height: sizeVars['--size-element-md'],
		color: colorVars['--color-text-secondary'],
		fontSize: typeScaleVars['--text-label-size'],
		userSelect: 'none'
	},
	ellipsisSm: {
		minWidth: sizeVars['--size-element-sm'],
		height: sizeVars['--size-element-sm'],
		fontSize: typeScaleVars['--text-supporting-size']
	},
	infoText: {
		display: 'flex',
		alignItems: 'center',
		whiteSpace: 'nowrap'
	},
	dotsContainer: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	dot: {
		width: spacingVars['--spacing-2'],
		height: spacingVars['--spacing-2'],
		borderWidth: 0,
		borderStyle: 'none',
		padding: 0,
		borderRadius: '50%',
		backgroundColor: colorVars['--color-neutral'],
		cursor: 'pointer',
		transitionProperty: 'background-color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		outline: {
			default: 'none',
			':focus-visible': `2px solid ${colorVars['--color-accent']}`
		},
		outlineOffset: {
			default: '0',
			':focus-visible': '2px'
		}
	},
	dotSm: {
		width: spacingVars['--spacing-1-5'],
		height: spacingVars['--spacing-1-5']
	},
	dotActive: {
		backgroundColor: colorVars['--color-accent']
	},
	dotDisabled: {
		cursor: 'not-allowed',
		opacity: 0.5
	},
	activePage: {
		backgroundColor: colorVars['--color-neutral'],
		fontWeight: fontWeightVars['--font-weight-medium']
	},
	inputGroup: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		whiteSpace: 'nowrap'
	},
	inputLabel: {
		color: colorVars['--color-text-secondary'],
		fontSize: typeScaleVars['--text-label-size'],
		userSelect: 'none'
	},
	inputLabelSm: {
		fontSize: typeScaleVars['--text-supporting-size']
	},
	inputTotal: {
		color: colorVars['--color-text-secondary'],
		fontSize: typeScaleVars['--text-label-size'],
		userSelect: 'none'
	},
	inputTotalSm: {
		fontSize: typeScaleVars['--text-supporting-size']
	},
	pageSizeSelector: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2']
	},
	pageSizeSelectorControl: {
		width: 80
	},
	disabled: {
		opacity: 0.5,
		pointerEvents: 'none' as const
	}
});

/** The `<nav>` landmark. `xstyle` threaded last so it overrides. */
export function paginationRootAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

/** The prev / indicator / next row. */
export function paginationControlsAttrs(): SvelteStyleAttrs {
	return sx(styles.controls);
}

/** The `…` between page-number buttons. */
export function paginationEllipsisAttrs(isSm: boolean): SvelteStyleAttrs {
	return sx(styles.ellipsis, isSm && styles.ellipsisSm);
}

/** The `count` / `compact` text wrapper. */
export function paginationInfoTextAttrs(): SvelteStyleAttrs {
	return sx(styles.infoText);
}

/** The `role="group"` holding the dot indicators. */
export function paginationDotsContainerAttrs(): SvelteStyleAttrs {
	return sx(styles.dotsContainer);
}

/** A single dot indicator. */
export function paginationDotAttrs(
	isSm: boolean,
	isActive: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		styles.dot,
		isSm && styles.dotSm,
		isActive && styles.dotActive,
		isDisabled && styles.dotDisabled
	);
}

/** `xstyle` for the current page's `Button`. */
export const paginationActivePageStyle: StyleArg = styles.activePage;

/** The `input` variant's `Page [ n ] / N` row. */
export function paginationInputGroupAttrs(): SvelteStyleAttrs {
	return sx(styles.inputGroup);
}

/** The leading noun before the `input` variant's editable box. */
export function paginationInputLabelAttrs(isSm: boolean): SvelteStyleAttrs {
	return sx(styles.inputLabel, isSm && styles.inputLabelSm);
}

/**
 * The trailing `/ N` after the `input` variant's editable box.
 *
 * Declared identically to `inputLabel` upstream, so the compiler hashes both to
 * the same atomic classes and `dist/` carries one string for the pair — the two
 * are kept apart here anyway because upstream keeps them apart, and because
 * they carry different `themeProps` targets.
 */
export function paginationInputTotalAttrs(isSm: boolean): SvelteStyleAttrs {
	return sx(styles.inputTotal, isSm && styles.inputTotalSm);
}

/** The page-size `Selector`'s outer row. */
export function paginationPageSizeSelectorAttrs(): SvelteStyleAttrs {
	return sx(styles.pageSizeSelector);
}

/** The fixed-width box the page-size `Selector` sits in. */
export function paginationPageSizeSelectorControlAttrs(): SvelteStyleAttrs {
	return sx(styles.pageSizeSelectorControl);
}
