import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/** Ported from the `styles` block in Astryx's `Chat/ChatPastedTextToken.tsx`. */
const styles = stylex.create({
	preview: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-2'],
		maxWidth: '480px'
	},
	previewText: {
		fontFamily: typographyVars['--font-family-code'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-primary'],
		whiteSpace: 'pre-wrap',
		wordBreak: 'break-word',
		maxHeight: '240px',
		overflowY: 'auto'
	},
	footer: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacingVars['--spacing-2']
	},
	meta: {
		fontSize: typeScaleVars['--text-supporting-size'],
		color: colorVars['--color-text-secondary']
	}
});

export function pastedTextPreviewAttrs(): SvelteStyleAttrs {
	return sx(styles.preview);
}

export function pastedTextPreviewTextAttrs(): SvelteStyleAttrs {
	return sx(styles.previewText);
}

export function pastedTextFooterAttrs(): SvelteStyleAttrs {
	return sx(styles.footer);
}

export function pastedTextMetaAttrs(): SvelteStyleAttrs {
	return sx(styles.meta);
}
