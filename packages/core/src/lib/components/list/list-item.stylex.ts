import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { borderVars, colorVars, spacingVars, typeScaleVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `List/ListItem.tsx` styles.
 *
 * The three `styles`/`embeddedStyles` keys survive into upstream's `dist/` as
 * objects because they reach `Item` inside an `xstyle` array beside conditionals;
 * every `markerStyles` key is applied at exactly one call site, so the compiler
 * folded each into a literal class string.
 */
const styles = stylex.create({
	withCounter: {
		counterIncrement: 'astryx-list'
	},
	withDivider: {
		borderBlockEndWidth: borderVars['--border-width'],
		borderBlockEndStyle: 'solid',
		borderBlockEndColor: colorVars['--color-border'],
		':last-child': {
			borderBlockEnd: 'none'
		}
	}
});

// Custom-rendered markers instead of native `list-style-type`; numbers come from
// a CSS counter, the same pattern upstream uses.
const MARKER_DOT_SIZE = 6;

const markerStyles = stylex.create({
	container: {
		alignSelf: 'baseline',
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		width: spacingVars['--spacing-4'],
		marginTop: `calc((1em * ${typeScaleVars['--text-body-leading']} - ${MARKER_DOT_SIZE}px) / 2)`
	},
	dot: {
		width: MARKER_DOT_SIZE,
		height: MARKER_DOT_SIZE,
		borderRadius: '50%',
		backgroundColor: colorVars['--color-text-primary']
	},
	circle: {
		width: MARKER_DOT_SIZE,
		height: MARKER_DOT_SIZE,
		borderRadius: '50%',
		borderWidth: 1,
		borderStyle: 'solid',
		borderColor: colorVars['--color-text-primary'],
		backgroundColor: 'transparent'
	},
	number: {
		alignSelf: 'baseline',
		flexShrink: 0,
		color: colorVars['--color-text-primary'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		width: spacingVars['--spacing-4'],
		'::before': {
			content: 'counter(astryx-list) "."'
		}
	}
});

const embeddedStyles = stylex.create({
	noRadius: {
		borderRadius: 0
	}
});

/** The `xstyle` array `ListItem` hands to `Item`. */
export function listItemXstyle(
	hasMarkers: boolean,
	hasDividers: boolean,
	xstyle: StyleArg
): StyleArg {
	return [
		hasMarkers && styles.withCounter,
		hasDividers && styles.withDivider,
		hasDividers && embeddedStyles.noRadius,
		xstyle
	];
}

/** The fixed-width slot holding a `disc`/`circle` marker. */
export function markerContainerAttrs(): SvelteStyleAttrs {
	return sx(markerStyles.container);
}

/** The filled `disc` bullet. */
export function markerDotAttrs(): SvelteStyleAttrs {
	return sx(markerStyles.dot);
}

/** The hollow `circle` bullet. */
export function markerCircleAttrs(): SvelteStyleAttrs {
	return sx(markerStyles.circle);
}

/** The `decimal` marker — an empty span whose `::before` reads the counter. */
export function markerNumberAttrs(): SvelteStyleAttrs {
	return sx(markerStyles.number);
}
