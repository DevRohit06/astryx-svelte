import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';
import type { ChatMessageSender } from './chat-context.svelte.js';

/** Ported from the `styles` block in Astryx's `Chat/ChatMessageMetadata.tsx`. */
export type ChatMessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

const pulseKeyframes = stylex.keyframes({
	'0%, 100%': { opacity: 1 },
	'50%': { opacity: 0.5 }
});

const styles = stylex.create({
	meta: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		marginBlockStart: spacingVars['--spacing-1'],
		fontSize: typeScaleVars['--text-supporting-size'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary']
	},
	metaUser: {
		flexDirection: 'row-reverse'
	},
	metaAssistant: {
		flexDirection: 'row'
	},
	statusRow: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	statusError: {
		color: colorVars['--color-error']
	},
	statusPulse: {
		animationName: pulseKeyframes,
		animationDuration: '1.5s',
		animationTimingFunction: 'ease-in-out',
		animationIterationCount: 'infinite',
		'@media (prefers-reduced-motion: reduce)': {
			animationName: 'none'
		}
	}
});

export function chatMessageMetadataAttrs(
	sender: ChatMessageSender,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(styles.meta, sender === 'user' ? styles.metaUser : styles.metaAssistant, xstyle);
}

export function chatMessageStatusRowAttrs(status: ChatMessageStatus): SvelteStyleAttrs {
	return sx(
		styles.statusRow,
		status === 'error' && styles.statusError,
		status === 'sending' && styles.statusPulse
	);
}
