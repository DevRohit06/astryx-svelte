import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	radiusVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';
import type { ChatDensity, ChatMessageSender } from './chat-context.svelte.js';
import type { SizeValue } from '../../internal/types.js';

/** Ported from the `styles` block in Astryx's `Chat/ChatMessageBubble.tsx`. */
export type ChatMessageBubbleVariant = 'filled' | 'ghost';

/** Position within a multi-bubble group. */
export type ChatMessageBubbleGroup = 'first' | 'middle' | 'last';

const styles = stylex.create({
	content: {
		display: 'flex',
		flexDirection: 'column',
		maxWidth: 'max(80%, 280px)',
		// Bubbles are intentionally rounder than cards in the same view, so they
		// use the dedicated chat radius rather than coupling to --radius-page.
		borderRadius: radiusVars['--radius-chat'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		overflowWrap: 'break-word',
		wordBreak: 'break-word'
	},
	radiusCompact: {
		borderRadius: radiusVars['--radius-container']
	},
	paddingCompact: {
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-4']
	},
	paddingBalanced: {
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-4']
	},
	paddingSpacious: {
		paddingBlock: spacingVars['--spacing-4'],
		paddingInline: spacingVars['--spacing-5']
	},
	paddingBlockNone: {
		paddingBlock: 0
	},
	// Slot padding — matches bubble's paddingInline per density
	metadataPaddingCompact: {
		paddingInline: spacingVars['--spacing-4']
	},
	metadataPaddingBalanced: {
		paddingInline: spacingVars['--spacing-4']
	},
	metadataPaddingSpacious: {
		paddingInline: spacingVars['--spacing-5']
	},
	metadataReducedGap: {
		marginBlockStart: `calc(-1 * ${spacingVars['--spacing-1-5']})`
	},
	headerReducedGap: {
		marginBlockEnd: `calc(-1 * ${spacingVars['--spacing-1-5']})`
	},
	nameRow: {
		height: spacingVars['--spacing-5'],
		display: 'flex',
		alignItems: 'center'
	},
	alignEnd: {
		textAlign: 'end'
	},
	// Sender backgrounds — same default, but separate styles for theme overrides.
	// Themes can target sender via legacy classes (.user/.assistant) or the
	// reflected data-sender attribute under @scope.
	assistant: {
		backgroundColor: colorVars['--color-neutral'],
		color: colorVars['--color-text-primary']
	},
	user: {
		backgroundColor: colorVars['--color-neutral'],
		color: colorVars['--color-text-primary']
	},
	ghost: {
		backgroundColor: 'transparent',
		color: colorVars['--color-text-primary']
	},
	// Grouped bubble corners — assistant (inline-start side tight).
	// Logical radii so the tail follows reading direction: inline-start is the
	// left edge under LTR and the right edge under RTL (assistant tucks toward
	// the start of the line in both directions).
	groupFirstAssistant: {
		borderEndStartRadius: radiusVars['--radius-inner']
	},
	groupMiddleAssistant: {
		borderStartStartRadius: radiusVars['--radius-inner'],
		borderEndStartRadius: radiusVars['--radius-inner']
	},
	groupLastAssistant: {
		borderStartStartRadius: radiusVars['--radius-inner']
	},
	// Grouped bubble corners — user (inline-end side tight).
	// Logical radii: inline-end is the right edge under LTR and the left edge
	// under RTL (user tucks toward the end of the line in both directions).
	groupFirstUser: {
		borderEndEndRadius: radiusVars['--radius-inner']
	},
	groupMiddleUser: {
		borderStartEndRadius: radiusVars['--radius-inner'],
		borderEndEndRadius: radiusVars['--radius-inner']
	},
	groupLastUser: {
		borderStartEndRadius: radiusVars['--radius-inner']
	}
});

function paddingFor(density: ChatDensity) {
	return density === 'compact'
		? styles.paddingCompact
		: density === 'spacious'
			? styles.paddingSpacious
			: styles.paddingBalanced;
}

function metadataPaddingFor(density: ChatDensity) {
	return density === 'compact'
		? styles.metadataPaddingCompact
		: density === 'spacious'
			? styles.metadataPaddingSpacious
			: styles.metadataPaddingBalanced;
}

function groupFor(group: ChatMessageBubbleGroup | undefined, isUser: boolean) {
	return group === 'first'
		? isUser
			? styles.groupFirstUser
			: styles.groupFirstAssistant
		: group === 'middle'
			? isUser
				? styles.groupMiddleUser
				: styles.groupMiddleAssistant
			: group === 'last'
				? isUser
					? styles.groupLastUser
					: styles.groupLastAssistant
				: null;
}

// Dynamic styles for sizing props
const dynamicStyles = stylex.create({
	sizing: (width: SizeValue) => ({
		width,
		// An explicit width replaces the default cap — a full-column or
		// fixed-width bubble shouldn't also be clamped by max(80%, 280px).
		maxWidth: 'none'
	})
});

export function chatMessageBubbleContentAttrs(
	sender: ChatMessageSender,
	density: ChatDensity,
	variant: ChatMessageBubbleVariant,
	group: ChatMessageBubbleGroup | undefined,
	width: SizeValue | undefined,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	const isUser = sender === 'user';
	const senderStyle = variant === 'ghost' ? styles.ghost : isUser ? styles.user : styles.assistant;
	return sx(
		styles.content,
		density === 'compact' && styles.radiusCompact,
		senderStyle,
		paddingFor(density),
		variant === 'ghost' && styles.paddingBlockNone,
		groupFor(group, isUser),
		width != null && dynamicStyles.sizing(width),
		xstyle
	);
}

export function chatMessageBubbleNameAttrs(
	density: ChatDensity,
	isUser: boolean
): SvelteStyleAttrs {
	return sx(
		metadataPaddingFor(density),
		styles.nameRow,
		styles.headerReducedGap,
		isUser && styles.alignEnd
	);
}

export function chatMessageBubbleMetadataAttrs(
	density: ChatDensity,
	isUser: boolean
): SvelteStyleAttrs {
	return sx(metadataPaddingFor(density), styles.metadataReducedGap, isUser && styles.alignEnd);
}
