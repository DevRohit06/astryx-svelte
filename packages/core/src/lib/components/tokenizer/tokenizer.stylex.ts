import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	inputStatusBorderStyles,
	inputStatusFocusWithinStyles,
	inputStatusHoverShadowStyles,
	inputWrapperStyles
} from '../field/input-styles.stylex.js';
import type { InputStatusType } from '../field/types.js';
import { colorVars, sizeVars, spacingVars, typeScaleVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Tokenizer/Tokenizer.tsx`, where the styles are inline in
 * the component file rather than in a module of their own. The five group names
 * (`styles`/`sizeStyles`/`endSectionSizeStyles`/`truncatedSizeStyles`/
 * `layerPlaceholderSizeStyles`) are upstream's, so none is renamed.
 */

const styles = stylex.create({
	wrapper: {
		position: 'relative',
		flexWrap: 'wrap',
		gap: spacingVars['--spacing-1'],
		cursor: {
			default: 'text',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		height: 'auto'
	},
	wrapperWithTokens: {
		// Override padding for border concentricity: token border-radius
		// (radius-1: 4px) sits concentric with wrapper border-radius
		// (radius-2: 8px) when inset = radius-2 - radius-1 - border
		// = 8 - 4 - 1 = 3px.
		paddingBlock: `calc(${spacingVars['--spacing-1']} - 1px)`,
		paddingInline: `calc(${spacingVars['--spacing-1']} - 1px)`,
		// Row gap must match paddingBlock so wrapped rows look evenly spaced.
		rowGap: `calc(${spacingVars['--spacing-1']} - 1px)`
	},
	startIconWithTokens: {
		// Restore the default 8px inline-start inset when tokens are present,
		// since wrapperWithTokens reduces padding to 3px for border concentricity.
		marginInlineStart: `calc(${spacingVars['--spacing-2']} - ${spacingVars['--spacing-1']} + 1px)`
	},
	token: {
		display: 'flex',
		flexShrink: 0
	},
	endSection: {
		position: 'absolute',
		// Match the field's inline padding (inputWrapperStyles.base uses
		// spacing-2) so end content (clear button, resultCount) lines up with
		// the text/start-icon inset instead of hugging the border at ~3px.
		insetInlineEnd: spacingVars['--spacing-2'],
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		flexShrink: 0
	},
	inputAtMax: {
		width: 0,
		minWidth: 0,
		flex: '0 0 0',
		padding: 0,
		opacity: 0,
		position: 'absolute'
	},
	inputCompact: {
		minWidth: '40px',
		flex: '1 1 40px',
		width: 0,
		// Restore normal text inset when input follows tokens, since the
		// wrapper padding is reduced for border concentricity.
		paddingInlineStart: `calc(${spacingVars['--spacing-2']} - ${spacingVars['--spacing-1']} + 1px)`
	},
	truncatedWrapper: {
		flexWrap: 'nowrap',
		overflow: 'hidden'
	},
	layerPopover: {
		// Top-layer popover: match the anchor width exactly so the expanded
		// tokenizer looks like an in-place expansion, overlapping the
		// placeholder from its top edge.
		width: 'anchor-size(width)'
	},
	overflowText: {
		flexShrink: 0,
		whiteSpace: 'nowrap',
		fontSize: typeScaleVars['--text-supporting-size'],
		color: colorVars['--color-text-secondary'],
		paddingInline: spacingVars['--spacing-1']
	}
});

const sizeStyles = stylex.create({
	sm: { minHeight: sizeVars['--size-element-sm'] },
	md: { minHeight: sizeVars['--size-element-md'] },
	lg: { minHeight: sizeVars['--size-element-lg'] }
});

const endSectionSizeStyles = stylex.create({
	sm: {
		top: `calc(${sizeVars['--size-element-sm']} / 2 - 1px)`,
		transform: 'translateY(-50%)'
	},
	md: {
		top: `calc(${sizeVars['--size-element-md']} / 2 - 1px)`,
		transform: 'translateY(-50%)'
	},
	lg: {
		top: `calc(${sizeVars['--size-element-lg']} / 2 - 1px)`,
		transform: 'translateY(-50%)'
	}
});

const truncatedSizeStyles = stylex.create({
	sm: { height: sizeVars['--size-element-sm'] },
	md: { height: sizeVars['--size-element-md'] },
	lg: { height: sizeVars['--size-element-lg'] }
});

const layerPlaceholderSizeStyles = stylex.create({
	sm: { height: sizeVars['--size-element-sm'] },
	md: { height: sizeVars['--size-element-md'] },
	lg: { height: sizeVars['--size-element-lg'] }
});

/** Published from `tokenizer.svelte`, derived from the size style keys. */
export type TokenizerSize = keyof typeof sizeStyles;

/**
 * The `role="group"` input wrapper — the bordered surface holding the tokens,
 * the typeahead input and the end section.
 */
export function tokenizerWrapperAttrs(
	size: TokenizerSize,
	statusType: InputStatusType | undefined,
	hasTokens: boolean,
	isTruncated: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		styles.wrapper,
		hasTokens && styles.wrapperWithTokens,
		isTruncated ? truncatedSizeStyles[size] : sizeStyles[size],
		isTruncated && styles.truncatedWrapper,
		isDisabled && inputWrapperStyles.disabled,
		statusType && inputStatusBorderStyles[statusType],
		// `!isDisabled` is upstream's guard (`Tokenizer.tsx:742`), and it is the only
		// thing that removes the ring — not belt-and-braces over the `disabled` style
		// above. styleq keys a *conditional* declaration separately from an
		// unconditional one, so `inputWrapperStyles.disabled`'s flat
		// `boxShadow: 'none'` replaces only the default `boxShadow` key and never
		// touches the ring's `:hover:not(:focus-within)` key. Declaration order is
		// therefore irrelevant here: without this guard a disabled tokenizer carrying
		// a status keeps a hover ring upstream removes, however the two are ordered.
		//
		// An earlier version of this comment claimed styleq merged the two under one
		// key, last-wins — which would have made the guard redundant wherever
		// `disabled` came second, and led to one of the thirteen sites being written
		// off as inert. `input-status-hover-guard.svelte.test.ts` disproves it by
		// deleting each guard individually; every one fails its own case.
		statusType && !isDisabled && inputStatusHoverShadowStyles[statusType],
		statusType && inputStatusFocusWithinStyles[statusType]
	);
}

/**
 * The in-flow placeholder that `unfocusedLayer` mode leaves behind while the
 * real wrapper is promoted into the top layer.
 */
export function tokenizerLayerPlaceholderAttrs(
	size: TokenizerSize,
	statusType: InputStatusType | undefined,
	hasTokens: boolean,
	isTruncated: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		styles.wrapper,
		hasTokens && styles.wrapperWithTokens,
		layerPlaceholderSizeStyles[size],
		isTruncated && styles.truncatedWrapper,
		isDisabled && inputWrapperStyles.disabled,
		statusType && inputStatusBorderStyles[statusType],
		// Same guard as the wrapper above, per upstream `Tokenizer.tsx:842`.
		statusType && !isDisabled && inputStatusHoverShadowStyles[statusType],
		statusType && inputStatusFocusWithinStyles[statusType]
	);
}

/** The span that restores the start icon's inset once tokens are present. */
export function tokenizerStartIconAttrs(hasTokens: boolean): SvelteStyleAttrs {
	return sx(hasTokens && styles.startIconWithTokens);
}

/** The absolutely positioned end section holding `endContent` and the clear button. */
export function tokenizerEndSectionAttrs(size: TokenizerSize): SvelteStyleAttrs {
	return sx(styles.endSection, endSectionSizeStyles[size]);
}

/** The `+N more` indicator inside a truncated token row. */
export function tokenizerOverflowTextAttrs(): SvelteStyleAttrs {
	return sx(styles.overflowText);
}

/** `xstyle` for a rendered token (and the `<span>` wrapping a custom one). */
export const tokenizerTokenStyle: StyleArg = styles.token;

/** The wrapper a custom `renderToken` result is placed in. */
export function tokenizerTokenAttrs(): SvelteStyleAttrs {
	return sx(styles.token);
}

/** `inputXStyle` for the input once `maxEntries` is reached or the row is truncated. */
export const tokenizerInputAtMaxStyle: StyleArg = styles.inputAtMax;

/** `inputXStyle` for the input when it follows tokens. */
export const tokenizerInputCompactStyle: StyleArg = styles.inputCompact;

/** `xstyle` for the `unfocusedLayer` popover container. */
export const tokenizerLayerPopoverStyle: StyleArg = styles.layerPopover;
