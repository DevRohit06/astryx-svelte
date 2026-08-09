import * as stylex from '@stylexjs/stylex';
import { container, type SpacingToken } from '../../internal/container.stylex.js';
import {
	containerPaddingBlockEndVarStyles,
	containerPaddingBlockStartVarStyles,
	containerPaddingInlineVarStyles,
	paddingStyles,
	spacingStepToToken
} from '../../internal/padding.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { Elevation, SizeValue, SpacingStep } from '../../internal/types.js';
import { borderVars, colorVars, radiusVars, shadowVars } from '../../styles/tokens.stylex.js';

/**
 * Background variant.
 *
 * Only `default` draws a visible border. Its width is subtracted from the
 * padding, so the total inset — border plus padding — equals the padding token
 * rather than exceeding it. That keeps content geometry on the spacing scale
 * and identical to the borderless variants.
 */
export type CardVariant =
	| 'default'
	| 'transparent'
	| 'muted'
	| 'blue'
	| 'cyan'
	| 'gray'
	| 'green'
	| 'orange'
	| 'pink'
	| 'purple'
	| 'red'
	| 'teal'
	| 'yellow';

const styles = stylex.create({
	card: {
		'--_card-radius': radiusVars['--radius-container'],
		borderRadius: 'var(--_card-radius)',
		overflow: 'clip',
		// Resting elevation is set via `--_card-elevation` (see `elevationStyles`).
		// The shadow list also reads `--_card-ring` so composing surfaces — e.g.
		// SelectableCard's inset selection ring — can layer their own shadow
		// alongside elevation instead of clobbering the single `box-shadow`
		// property. Unset vars fall back to a transparent no-op shadow.
		boxShadow: 'var(--_card-ring, 0 0 transparent), var(--_card-elevation, 0 0 transparent)'
	},
	// The border is drawn *inside* the padding — its width comes off each side —
	// so the total inset equals the padding token instead of exceeding it.
	withBorder: {
		borderWidth: borderVars['--border-width'],
		borderStyle: 'solid',
		// 0.2.0 moved this from `--color-border-emphasized` to the subtle
		// `--color-border`, so a bordered card's frame matches the dividers next
		// to it instead of out-weighing them.
		borderColor: colorVars['--color-border'],
		paddingInlineStart: `calc(var(--container-padding-inline-start) - ${borderVars['--border-width']})`,
		paddingInlineEnd: `calc(var(--container-padding-inline-end) - ${borderVars['--border-width']})`,
		paddingBlockStart: `calc(var(--container-padding-block-start) - ${borderVars['--border-width']})`,
		paddingBlockEnd: `calc(var(--container-padding-block-end) - ${borderVars['--border-width']})`
	},
	// A fixed-height card scrolls its content; `overflow: auto` also clips to the
	// border radius.
	scrollable: {
		overflow: 'auto'
	}
});

/**
 * Resting elevation, new in 0.1.9.
 *
 * Each tier sets the `--_card-elevation` **variable** rather than `box-shadow`
 * directly, so it composes with `--_card-ring` in the shadow list on `card` — a
 * selection ring and a resting elevation coexist without either overwriting the
 * other. `none` is a *transparent no-op shadow*, not the CSS literal `none`,
 * which would be invalid inside a comma-separated shadow list.
 */
const elevationStyles = stylex.create({
	none: { '--_card-elevation': '0 0 transparent' },
	low: { '--_card-elevation': shadowVars['--shadow-low'] },
	med: { '--_card-elevation': shadowVars['--shadow-med'] },
	high: { '--_card-elevation': shadowVars['--shadow-high'] }
});

const variantStyles = stylex.create({
	default: {
		backgroundColor: colorVars['--color-background-card']
	},
	transparent: {
		backgroundColor: 'transparent'
	},
	muted: {
		backgroundColor: colorVars['--color-background-muted']
	},
	blue: {
		backgroundColor: colorVars['--color-background-blue']
	},
	cyan: {
		backgroundColor: colorVars['--color-background-cyan']
	},
	gray: {
		backgroundColor: colorVars['--color-background-gray']
	},
	green: {
		backgroundColor: colorVars['--color-background-green']
	},
	orange: {
		backgroundColor: colorVars['--color-background-orange']
	},
	pink: {
		backgroundColor: colorVars['--color-background-pink']
	},
	purple: {
		backgroundColor: colorVars['--color-background-purple']
	},
	red: {
		backgroundColor: colorVars['--color-background-red']
	},
	teal: {
		backgroundColor: colorVars['--color-background-teal']
	},
	yellow: {
		backgroundColor: colorVars['--color-background-yellow']
	}
});

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

export interface CardAttrsOptions {
	variant: CardVariant;
	elevation: Elevation;
	padding?: SpacingStep;
	width?: SizeValue;
	height?: SizeValue;
	maxWidth?: SizeValue;
	minHeight?: SizeValue;
}

export function cardAttrs(
	{ variant, elevation, padding, width, height, maxWidth, minHeight }: CardAttrsOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	// Scroll only when the card has a real fixed height.
	const hasFixedHeight = height != null && height !== 'auto';

	// With no explicit padding the card cascades from the theme's `--astryx-card-*`
	// tokens instead of pinning a spacing value.
	const useThemeDefault = padding == null;
	const effectivePadding = padding ?? 4;
	const paddingToken: SpacingToken = spacingStepToToken[effectivePadding];

	return sx(
		styles.card,
		variantStyles[variant],
		elevationStyles[elevation],
		hasFixedHeight && styles.scrollable,
		dynamicStyles.sizing(width ?? null, height ?? null, maxWidth ?? null, minHeight ?? null),
		...container(
			useThemeDefault
				? { useThemeDefault: 'card' }
				: {
						paddingInnerX: paddingToken,
						paddingInnerY: paddingToken,
						paddingOuterX: paddingToken,
						paddingOuterY: paddingToken
					}
		),
		!useThemeDefault && effectivePadding !== 4 && paddingStyles[effectivePadding],
		!useThemeDefault && effectivePadding !== 4 && containerPaddingInlineVarStyles[effectivePadding],
		!useThemeDefault &&
			effectivePadding !== 4 &&
			containerPaddingBlockStartVarStyles[effectivePadding],
		!useThemeDefault &&
			effectivePadding !== 4 &&
			containerPaddingBlockEndVarStyles[effectivePadding],
		// After the container padding, so the border-inset calc wins — it reads
		// the --container-padding-* vars set above.
		variant === 'default' && styles.withBorder,
		xstyle
	);
}
