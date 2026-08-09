import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/** Ported from the `styles` block in Astryx's `Chat/ChatSystemMessage.tsx`. */
const styles = stylex.create({
	root: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-1'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-supporting-size'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-secondary'],
		textAlign: 'center'
	},
	dividerWrap: {
		width: '100%'
	},
	// Icon
	icon: {
		display: 'inline-flex',
		alignItems: 'center',
		flexShrink: 0
	},
	// Content wrapper (to keep text + icon together)
	content: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1-5'],
		flexShrink: 0,
		whiteSpace: 'nowrap'
	}
});

export function chatSystemMessageRootAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

export function chatSystemMessageDividerWrapAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.dividerWrap, xstyle);
}

export function chatSystemMessageContentAttrs(): SvelteStyleAttrs {
	return sx(styles.content);
}

export function chatSystemMessageIconAttrs(): SvelteStyleAttrs {
	return sx(styles.icon);
}
