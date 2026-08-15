import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';

/**
 * Ported from Astryx's `CodeBlock/CodeBlock.tsx`, where the styles are inline in
 * the component file rather than in a module of their own.
 *
 * The `--color-syntax-*` custom properties are read as bare `var()` strings
 * rather than through a token group: they are set by the *theme* (or by a
 * `<SyntaxTheme>` wrapper) rather than declared in `tokens.stylex.ts`, which is
 * exactly how upstream references them.
 */

const containerStyles = stylex.create({
	card: {
		borderRadius: radiusVars['--radius-element'],
		borderWidth: borderVars['--border-width'],
		borderStyle: 'solid',
		borderColor: colorVars['--color-border']
	},
	section: {
		borderRadius: 0,
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'transparent',
		// Transparent background so the block blends into the surface it's
		// embedded in (a card or panel) instead of painting its own muted layer,
		// which would compound with a muted parent into a darker grey. Override
		// the syntax-background var so both the root and the sticky header inherit
		// it. Consumers can still set an explicit background via xstyle.
		'--color-syntax-background': 'transparent'
	}
});

const dynamicStyles = stylex.create({
	width: (value: string) => ({
		width: value,
		minWidth: value === 'fit-content' ? 'min(100%, 400px)' : null,
		maxWidth: value === 'fit-content' ? '100%' : null
	}),
	// Width of the line-number column, sized to the widest number. `ch` is the
	// advance of "0" in the (monospace) code font, so N digits => N ch. Set on
	// <code>; `--_codeblock-gutter-width` is unregistered so it inherits (with its var()
	// substituted) down to the line divs that read it for their grid track.
	gutterWidth: (digits: number) => ({
		'--_codeblock-gutter-width': `${digits}ch`
	})
});

// Light reveal so the leading chevron eases into view instead of popping in.
// Growing the chevron's own footprint (width + inline margin) from zero slides
// the title into place instead of snapping it over, and clipping keeps the
// glyph from spilling while it's mid-reveal.
const chevronReveal = stylex.keyframes({
	from: {
		width: 0,
		marginInlineEnd: 0,
		opacity: 0
	},
	to: {
		width: '14px',
		marginInlineEnd: spacingVars['--spacing-1'],
		opacity: 1
	}
});

const styles = stylex.create({
	root: {
		position: 'relative',
		isolation: 'isolate',
		display: 'flex',
		flexDirection: 'column',
		margin: 0,
		backgroundColor: 'var(--color-syntax-background)',
		overflow: 'hidden'
	},
	headerRow: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingInline: spacingVars['--spacing-4'],
		backgroundColor: 'var(--color-syntax-background)',
		position: 'sticky',
		top: 0,
		zIndex: 1
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		flex: 1,
		minWidth: 0,
		// Reset default <button> appearance for the collapsible title control.
		padding: 0,
		border: 'none',
		backgroundColor: 'transparent',
		color: 'inherit',
		font: 'inherit',
		textAlign: 'start'
	},
	headerWithDivider: {
		paddingBlock: spacingVars['--spacing-2'],
		borderBottomWidth: borderVars['--border-width'],
		borderBottomStyle: 'solid',
		borderBottomColor: colorVars['--color-border']
	},
	headerCompact: {
		paddingBlock: spacingVars['--spacing-2']
	},
	headerTitle: {
		display: 'flex',
		alignItems: 'center',
		fontSize: typeScaleVars['--text-supporting-size'],
		fontFamily: typographyVars['--font-family-code'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		color: 'var(--color-syntax-comment)',
		margin: 0,
		lineHeight: typeScaleVars['--text-supporting-leading']
	},
	scrollContainer: {
		overflowX: 'auto',
		overflowY: 'auto'
	},
	codeWrapper: {
		display: 'flex',
		minWidth: 'fit-content'
	},
	codeWrapperCompact: {
		marginBlockStart: `calc(-1 * ${spacingVars['--spacing-2']})`
	},
	collapseGrid: {
		display: 'grid',
		gridTemplateRows: '1fr',
		transitionProperty: 'grid-template-rows',
		transitionDuration: durationVars['--duration-medium'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	collapseGridCollapsed: {
		gridTemplateRows: '0fr'
	},
	collapseInner: {
		overflow: 'hidden',
		minHeight: 0
	},
	collapseChevron: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		width: '14px',
		height: '14px',
		marginInlineEnd: spacingVars['--spacing-1'],
		overflow: 'hidden',
		color: 'var(--color-syntax-comment)',
		animationName: {
			default: chevronReveal,
			'@media (prefers-reduced-motion: reduce)': 'none'
		},
		animationDuration: durationVars['--duration-medium'],
		animationTimingFunction: easeVars['--ease-standard'],
		transitionProperty: 'transform',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	collapseChevronExpanded: {
		// Leading disclosure convention (matches TreeList/Table): the resting
		// chevronRight points right (>) when collapsed; rotate it down (v) when
		// expanded.
		transform: 'rotate(90deg)'
	},
	headerCollapsible: {
		cursor: 'pointer',
		userSelect: 'none'
		// Restore a keyboard-only focus ring with the standard token/offset so this
		// disclosure control matches the rest of the system (Collapsible, TabMenu);
		// otherwise it falls back to the inconsistent UA default outline.
	},
	code: {
		display: 'block',
		flex: 1,
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-4'],
		margin: 0,
		fontFamily: typographyVars['--font-family-code'],
		color: 'var(--color-syntax-variable)',
		tabSize: 2,
		whiteSpace: 'pre',
		wordBreak: 'normal',
		overflowWrap: 'normal'
	},
	codeWrapped: {
		whiteSpace: 'pre-wrap',
		wordBreak: 'break-all',
		overflowWrap: 'break-word'
	},
	// With line numbers on, the <code> element hosts the full-height divider
	// between the number gutter and the code. It spans the code's block padding
	// too (inset-block: 0), so the rule reaches the top and bottom edges the way
	// the old separate gutter column did. The numbers themselves are drawn per
	// line (see `lineNumbered`) — a separate column can't track wrap height.
	codeNumbered: {
		position: 'relative',
		'::after': {
			content: '""',
			position: 'absolute',
			insetBlock: 0,
			insetInlineStart: `calc(${spacingVars['--spacing-4']} + var(--_codeblock-gutter-width) + ${spacingVars['--spacing-3']})`,
			width: 0,
			borderInlineStartWidth: borderVars['--border-width'],
			borderInlineStartStyle: 'solid',
			borderInlineStartColor: colorVars['--color-border'],
			pointerEvents: 'none'
		}
	},
	line: {
		lineHeight: typeScaleVars['--text-code-leading']
	},
	// Per-line number gutter: a two-column grid ([number] [code]). The number is
	// a ::before generated from the data-line attribute. Because the number and
	// its code occupy one grid row, the row grows to fit wrapped code while the
	// number stays pinned to the row's first visual line (alignSelf: start) —
	// this is what keeps numbers aligned when isWrapped wraps a line.
	lineNumbered: {
		display: 'grid',
		gridTemplateColumns: 'var(--_codeblock-gutter-width) 1fr',
		columnGap: `calc(${spacingVars['--spacing-3']} + ${borderVars['--border-width']} + ${spacingVars['--spacing-4']})`,
		'::before': {
			content: 'attr(data-line)',
			gridColumn: '1',
			alignSelf: 'start',
			textAlign: 'end',
			color: 'var(--color-syntax-punctuation)',
			userSelect: 'none',
			fontFamily: typographyVars['--font-family-code']
		}
	},
	// In span mode the tokens are wrapped in this element so they form a single
	// grid item in column 2 (otherwise each token span would flow into its own
	// grid cell). minWidth:0 lets it shrink so long lines wrap within the track.
	lineContent: {
		minWidth: 0
	},
	lineChunk: {
		contentVisibility: 'auto'
	},
	lineHighlighted: {
		backgroundColor: colorVars['--color-accent-muted'],
		marginInline: `calc(-1 * ${spacingVars['--spacing-4']})`,
		paddingInline: spacingVars['--spacing-4']
	},
	sizeSm: {
		fontSize: typeScaleVars['--text-supporting-size']
	},
	sizeMd: {
		fontSize: typeScaleVars['--text-code-size']
	},
	copyButton: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: spacingVars['--spacing-1'],
		marginInlineEnd: `calc(-1 * ${spacingVars['--spacing-2']})`,
		border: 'none',
		borderRadius: radiusVars['--radius-inner'],
		backgroundColor: {
			default: 'transparent',
			'@media (hover: hover)': {
				':hover': colorVars['--color-overlay-hover']
			}
		},
		color: 'var(--color-syntax-comment)',
		cursor: 'pointer',
		lineHeight: 0
	},
	copyButtonAbsolute: {
		position: 'absolute',
		top: spacingVars['--spacing-2'],
		insetInlineEnd: spacingVars['--spacing-2']
	}
});

/**
 * Container variants and text sizes, as **module-private** aliases: upstream
 * inlines both unions in `CodeBlockProps` and publishes no named type for
 * either, unlike `Code`'s `CodeColor`/`CodeSize`. They exist only to keep the
 * attrs signatures below readable, and `code-block.svelte` inlines the same
 * literals in its props rather than importing them.
 */
type CodeBlockContainer = keyof typeof containerStyles;

type CodeBlockSize = 'sm' | 'md';

const sizeStyles = { sm: styles.sizeSm, md: styles.sizeMd } as const;

/** The `<pre>` root. */
export function codeBlockRootAttrs(
	width: string,
	container: CodeBlockContainer,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(styles.root, dynamicStyles.width(width), containerStyles[container], xstyle);
}

/** The sticky header row holding the title and (when there is a header) the copy button. */
export function codeBlockHeaderRowAttrs(hasLineNumbers: boolean): SvelteStyleAttrs {
	return sx(styles.headerRow, hasLineNumbers ? styles.headerWithDivider : styles.headerCompact);
}

/** The header's inner control — a `role="button"` disclosure when collapsible. */
export function codeBlockHeaderAttrs(canCollapse: boolean): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(styles.header, canCollapse && styles.headerCollapsible);
}

/** The title/language text. */
export function codeBlockHeaderTitleAttrs(): SvelteStyleAttrs {
	return sx(styles.headerTitle);
}

/** The disclosure chevron, rotated when collapsed. */
export function codeBlockCollapseChevronAttrs(isCollapsed: boolean): SvelteStyleAttrs {
	return sx(styles.collapseChevron, !isCollapsed && styles.collapseChevronExpanded);
}

/** The `grid-template-rows` animation host for the collapsible region. */
export function codeBlockCollapseGridAttrs(isCollapsed: boolean): SvelteStyleAttrs {
	return sx(styles.collapseGrid, isCollapsed && styles.collapseGridCollapsed);
}

/** The overflow-clipping child the collapse grid animates. */
export function codeBlockCollapseInnerAttrs(): SvelteStyleAttrs {
	return sx(styles.collapseInner);
}

/** The scrollable, focusable `role="group"` container. */
export function codeBlockScrollContainerAttrs(): SvelteStyleAttrs {
	return sx(styles.scrollContainer);
}

/** The flex row between the scroll container and `<code>`. */
export function codeBlockCodeWrapperAttrs(isCompact: boolean): SvelteStyleAttrs {
	return sx(styles.codeWrapper, isCompact && styles.codeWrapperCompact);
}

/** The `<code>` element. */
export function codeBlockCodeAttrs(
	size: CodeBlockSize,
	isWrapped: boolean,
	hasLineNumbers: boolean,
	maxDigits: number
): SvelteStyleAttrs {
	return sx(
		styles.code,
		sizeStyles[size],
		isWrapped && styles.codeWrapped,
		hasLineNumbers && styles.codeNumbered,
		hasLineNumbers && dynamicStyles.gutterWidth(maxDigits)
	);
}

/** A `content-visibility: auto` chunk wrapper, used once the block exceeds 100 lines. */
export function codeBlockLineChunkAttrs(): SvelteStyleAttrs {
	return sx(styles.lineChunk);
}

/** One line row. */
export function codeBlockLineAttrs(
	hasLineNumbers: boolean,
	isHighlighted: boolean
): SvelteStyleAttrs {
	return sx(
		styles.line,
		hasLineNumbers && styles.lineNumbered,
		isHighlighted && styles.lineHighlighted
	);
}

/** The span-mode wrapper that keeps a line's tokens in one grid cell. */
export function codeBlockLineContentAttrs(): SvelteStyleAttrs {
	return sx(styles.lineContent);
}

/** The copy button; absolutely positioned when there is no header to sit in. */
export function codeBlockCopyButtonAttrs(isAbsolute: boolean): SvelteStyleAttrs {
	return sx(styles.copyButton, isAbsolute && styles.copyButtonAbsolute);
}
