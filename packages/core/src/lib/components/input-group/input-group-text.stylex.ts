import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	borderVars,
	colorVars,
	radiusVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `InputGroup/InputGroupText.tsx`.
 *
 * A static text/icon addon that sits flush against a member control. It carries
 * a muted surface and the same border-collapsing margin as the group members —
 * but with a plain `:first-child`/`:last-child` pair for the radius corners,
 * since a text addon never owns the layer siblings that `group-styles`'
 * `IS_LAST_ITEM` selector accounts for.
 */
const styles = stylex.create({
	text: {
		display: 'flex',
		alignItems: 'center',
		paddingInline: spacingVars['--spacing-2'],
		backgroundColor: colorVars['--color-background-muted'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		color: colorVars['--color-text-secondary'],
		whiteSpace: 'nowrap',
		flexShrink: 0,
		borderWidth: borderVars['--border-width'],
		borderStyle: 'solid',
		borderColor: colorVars['--color-border-emphasized'],
		marginInlineStart: {
			default: `calc(-1 * ${borderVars['--border-width']})`,
			':first-child': 0
		},
		borderStartStartRadius: {
			default: 0,
			':first-child': radiusVars['--radius-element']
		},
		borderEndStartRadius: {
			default: 0,
			':first-child': radiusVars['--radius-element']
		},
		borderStartEndRadius: {
			default: 0,
			':last-child': radiusVars['--radius-element']
		},
		borderEndEndRadius: {
			default: 0,
			':last-child': radiusVars['--radius-element']
		}
	}
});

/** The addon box. */
export function inputGroupTextAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.text, xstyle);
}
