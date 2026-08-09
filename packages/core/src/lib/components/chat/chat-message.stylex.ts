import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';
import type { ChatDensity, ChatMessageSender } from './chat-context.svelte.js';

/** Ported from the `styles` block in Astryx's `Chat/ChatMessage.tsx`. */
const styles = stylex.create({
	root: {
		display: 'flex',
		alignItems: 'flex-start',
		maxWidth: '100%'
	},
	rootGapCompact: {
		gap: spacingVars['--spacing-1-5']
	},
	rootGapBalanced: {
		gap: spacingVars['--spacing-2']
	},
	rootGapSpacious: {
		gap: spacingVars['--spacing-3']
	},
	rootAssistant: {
		flexDirection: 'row',
		justifyContent: 'flex-start'
	},
	rootUser: {
		flexDirection: 'row-reverse',
		justifyContent: 'flex-start'
	},
	rootSystem: {
		flexDirection: 'row',
		justifyContent: 'center'
	},
	avatarWrap: {
		flexShrink: 0,
		':has(~ * [data-chat-name])': {
			marginBlockStart: spacingVars['--spacing-5']
		}
	},
	contentColumn: {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
		minWidth: 0
	},
	contentColumnSystem: {
		maxWidth: '90%',
		alignItems: 'center'
	},
	contentColumnAssistant: {
		alignItems: 'flex-start'
	},
	contentColumnUser: {
		alignItems: 'flex-end'
	},
	name: {
		fontSize: typeScaleVars['--text-supporting-size'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		color: colorVars['--color-text-secondary'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		marginBlockEnd: spacingVars['--spacing-1']
	},
	childrenWrap: {
		display: 'flex',
		flexDirection: 'column',
		minWidth: 0,
		width: '100%'
	},
	childrenAssistant: {
		alignItems: 'flex-start'
	},
	childrenUser: {
		alignItems: 'flex-end'
	},
	childrenSystem: {
		alignItems: 'center'
	},
	childrenGapCompact: {
		gap: spacingVars['--spacing-0-5']
	},
	childrenGapBalanced: {
		gap: spacingVars['--spacing-1']
	},
	childrenGapSpacious: {
		gap: spacingVars['--spacing-1-5']
	}
});

export function chatMessageRootAttrs(
	sender: ChatMessageSender,
	density: ChatDensity,
	hasAvatar: boolean,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	const rootGap =
		density === 'compact'
			? styles.rootGapCompact
			: density === 'spacious'
				? styles.rootGapSpacious
				: styles.rootGapBalanced;
	const rootAlignment =
		sender === 'system'
			? styles.rootSystem
			: sender === 'user'
				? styles.rootUser
				: styles.rootAssistant;
	return sx(styles.root, rootAlignment, hasAvatar && rootGap, xstyle);
}

export function chatMessageAvatarWrapAttrs(): SvelteStyleAttrs {
	return sx(styles.avatarWrap);
}

export function chatMessageContentColumnAttrs(sender: ChatMessageSender): SvelteStyleAttrs {
	const columnAlignment =
		sender === 'system'
			? styles.contentColumnSystem
			: sender === 'user'
				? styles.contentColumnUser
				: styles.contentColumnAssistant;
	return sx(styles.contentColumn, columnAlignment);
}

export function chatMessageNameAttrs(): SvelteStyleAttrs {
	return sx(styles.name);
}

export function chatMessageChildrenAttrs(
	sender: ChatMessageSender,
	density: ChatDensity
): SvelteStyleAttrs {
	const childrenAlignment =
		sender === 'system'
			? styles.childrenSystem
			: sender === 'user'
				? styles.childrenUser
				: styles.childrenAssistant;
	const childrenGap =
		density === 'compact'
			? styles.childrenGapCompact
			: density === 'spacious'
				? styles.childrenGapSpacious
				: styles.childrenGapBalanced;
	return sx(styles.childrenWrap, childrenAlignment, childrenGap);
}
