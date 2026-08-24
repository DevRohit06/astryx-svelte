import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/** Execution state of a single tool call. */
export type ChatToolCallStatus = 'pending' | 'running' | 'complete' | 'error';

/** Ported from the `styles` block in Astryx's `Chat/ChatToolCalls.tsx`. */
const styles = stylex.create({
	root: {
		display: 'flex',
		flexDirection: 'column',
		marginBlockStart: spacingVars['--spacing-2']
	},
	groupHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1-5'],
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		userSelect: 'none',
		minHeight: '24px',
		paddingBlock: spacingVars['--spacing-0-5']
	},
	groupIcon: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		width: '16px',
		height: '16px',
		color: colorVars['--color-text-secondary']
	},
	groupLabel: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontFamily: typographyVars['--font-family-body'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		color: colorVars['--color-text-secondary']
	},
	chevron: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		width: '14px',
		height: '14px',
		color: colorVars['--color-text-disabled']
	},
	// Rides on the chevron <Icon> (via `xstyle`), next to the rotation it
	// animates, so one element carries both the transform and the theme target.
	chevronTransition: {
		transition: {
			default: `transform ${durationVars['--duration-fast']} ${easeVars['--ease-standard']}`,
			'@media (prefers-reduced-motion: reduce)': 'none'
		}
	},
	chevronExpanded: {
		transform: 'rotate(180deg)'
	},
	groupContent: {
		display: 'grid',
		gridTemplateRows: '0fr',
		transition: {
			default: `grid-template-rows ${durationVars['--duration-medium']} ${easeVars['--ease-standard']}`,
			'@media (prefers-reduced-motion: reduce)': 'none'
		}
	},
	groupContentExpanded: {
		gridTemplateRows: '1fr'
	},
	groupContentInner: {
		overflow: 'hidden',
		minHeight: 0,
		// `list` (and, within it, each `callRowClickable` row) overhangs its own
		// content box by `--spacing-1` on each inline edge via a negative margin,
		// so its hover background can extend past the text column without
		// widening the layout — `list`'s own matching paddingInline absorbs the
		// row-level overhang, but `list`'s negative margin then overhangs *this*
		// element's box by the same amount, and this is the clip boundary the
		// grid height animation needs `overflow: hidden` for. Mirror the same
		// padding/negative-margin pair here so that overhang is absorbed too,
		// instead of clipped — matching the ungrouped single-call row, which has
		// no such wrapper to clip it.
		paddingInline: spacingVars['--spacing-1'],
		marginInline: `calc(-1 * ${spacingVars['--spacing-1']})`
	},
	list: {
		display: 'flex',
		flexDirection: 'column',
		paddingInline: spacingVars['--spacing-1'],
		marginInline: `calc(-1 * ${spacingVars['--spacing-1']})`
	},
	listIndented: {
		paddingInlineStart: 0
	},

	// Individual call row
	callRow: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1-5'],
		minHeight: '24px',
		paddingBlock: spacingVars['--spacing-0-5']
	},
	callRowClickable: {
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		borderRadius: radiusVars['--radius-element'],
		paddingInline: spacingVars['--spacing-1'],
		marginInline: `calc(-1 * ${spacingVars['--spacing-1']})`,
		'@media (hover: hover)': {
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				backgroundColor: colorVars['--color-overlay-hover']
			}
		}
	},
	callRowToggle: {
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	statusIcon: {
		position: 'relative',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		width: '16px',
		height: '16px',
		borderRadius: radiusVars['--radius-full']
	},
	statusIconCircle: {
		position: 'absolute',
		inset: 0,
		borderRadius: 'inherit',
		backgroundColor: 'currentColor',
		opacity: 0.15
	},
	statusIconInner: {
		position: 'relative',
		display: 'inline-flex'
	},
	callName: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontFamily: typographyVars['--font-family-code'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		color: colorVars['--color-text-secondary'],
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		flexShrink: 1,
		minWidth: '4ch'
	},
	callLabel: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontFamily: typographyVars['--font-family-body'],
		color: colorVars['--color-text-disabled'],
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		flexShrink: 10,
		minWidth: 0
	},
	callDuration: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontFamily: typographyVars['--font-family-body'],
		color: colorVars['--color-text-disabled'],
		whiteSpace: 'nowrap',
		flexShrink: 0
	},
	nodePill: {
		flexShrink: 0
	},
	stats: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontFamily: typographyVars['--font-family-body'],
		color: colorVars['--color-text-disabled'],
		flexShrink: 0
	},
	statsAdditions: {
		color: colorVars['--color-success']
	},
	statsDeletions: {
		color: colorVars['--color-error']
	},
	errorText: {
		color: colorVars['--color-error']
	},

	// Inline result detail
	callDetailChevron: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		width: '14px',
		height: '14px',
		color: colorVars['--color-text-disabled'],
		marginInlineStart: 'auto'
	},
	callDetailContent: {
		paddingInlineStart: `calc(16px + ${spacingVars['--spacing-1-5']})`,
		paddingBlockEnd: spacingVars['--spacing-2']
	},
	callCount: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-0-5'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontFamily: typographyVars['--font-family-body'],
		color: colorVars['--color-text-disabled'],
		flexShrink: 0
	},

	// Pile effect for grouped tool calls
	pileWrapper: {
		position: 'relative'
	},
	pileCard: {
		position: 'absolute',
		insetInline: 0,
		top: 0,
		height: '100%',
		borderRadius: radiusVars['--radius-element'],
		backgroundColor: colorVars['--color-background-muted'],
		opacity: 0.5
	},
	pileCard1: {
		transform: 'translateY(-3px) scale(0.985)',
		opacity: 0.3
	},
	pileCard2: {
		transform: 'translateY(-6px) scale(0.97)',
		opacity: 0.15
	},

	// Status colors
	colorPending: { color: colorVars['--color-text-disabled'] },
	colorRunning: { color: colorVars['--color-accent'] },
	colorComplete: { color: colorVars['--color-success'] },
	colorError: { color: colorVars['--color-error'] }
});

/**
 * `groupHeader`, `listIndented`, `errorText` and the three `pile*` styles have
 * no call site — upstream declares them and renders none of them. They stay
 * because `stylex.create` compiles every key it is given, and the class oracle
 * diffs this module's *whole* emitted output against upstream's; dropping the
 * dead ones would make the module stop matching.
 */

const STATUS_STYLES = {
	pending: styles.colorPending,
	running: styles.colorRunning,
	complete: styles.colorComplete,
	error: styles.colorError
} as const;

/** Passed to `Badge`'s `xstyle`, the way upstream passes `styles.nodePill`. */
export const chatToolCallNodePillStyle = styles.nodePill;

/**
 * Passed to the chevron `Icon`'s `xstyle`, the way upstream passes
 * `styles.chevronTransition` and `styles.chevronExpanded` at both chevrons
 * (#4838). The transition and the rotation it animates now ride the glyph
 * itself rather than the wrapper `<span>`, so a single element carries both.
 */
export const chatToolCallChevronTransitionStyle = styles.chevronTransition;
export const chatToolCallChevronExpandedStyle = styles.chevronExpanded;

export function chatToolCallsRootAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

export function chatToolCallRowAttrs(hasDetail: boolean): SvelteStyleAttrs {
	return sx(styles.callRow, hasDetail && styles.callRowClickable);
}

export function chatToolCallToggleRowAttrs(): SvelteStyleAttrs {
	return sx(styles.callRow, styles.callRowToggle);
}

export function chatToolCallStatusIconAttrs(status: ChatToolCallStatus): SvelteStyleAttrs {
	return sx(styles.statusIcon, STATUS_STYLES[status]);
}

export function chatToolCallStatusCircleAttrs(): SvelteStyleAttrs {
	return sx(styles.statusIconCircle);
}

export function chatToolCallStatusInnerAttrs(): SvelteStyleAttrs {
	return sx(styles.statusIconInner);
}

export function chatToolCallNameAttrs(): SvelteStyleAttrs {
	return sx(styles.callName);
}

export function chatToolCallLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.callLabel);
}

export function chatToolCallStatsAttrs(): SvelteStyleAttrs {
	return sx(styles.stats);
}

export function chatToolCallAdditionsAttrs(): SvelteStyleAttrs {
	return sx(styles.statsAdditions);
}

export function chatToolCallDeletionsAttrs(): SvelteStyleAttrs {
	return sx(styles.statsDeletions);
}

export function chatToolCallDurationAttrs(): SvelteStyleAttrs {
	return sx(styles.callDuration);
}

export function chatToolCallDetailChevronAttrs(): SvelteStyleAttrs {
	return sx(styles.callDetailChevron);
}

export function chatToolCallDetailContentAttrs(): SvelteStyleAttrs {
	return sx(styles.callDetailContent);
}

export function chatToolCallsGroupIconAttrs(): SvelteStyleAttrs {
	return sx(styles.groupIcon);
}

export function chatToolCallsGroupLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.groupLabel);
}

export function chatToolCallsCountAttrs(): SvelteStyleAttrs {
	return sx(styles.callCount);
}

export function chatToolCallsChevronAttrs(): SvelteStyleAttrs {
	return sx(styles.chevron);
}

export function chatToolCallsGroupContentAttrs(isExpanded: boolean): SvelteStyleAttrs {
	return sx(styles.groupContent, isExpanded && styles.groupContentExpanded);
}

export function chatToolCallsGroupContentInnerAttrs(): SvelteStyleAttrs {
	return sx(styles.groupContentInner);
}

export function chatToolCallsListAttrs(): SvelteStyleAttrs {
	return sx(styles.list);
}
