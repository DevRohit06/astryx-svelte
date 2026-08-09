import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { SpacingStep } from '../../internal/types.js';
import { spacingVars } from '../../styles/tokens.stylex.js';
import type { ChatDensity } from './chat-context.svelte.js';

/** Ported from the `styles` block in Astryx's `Chat/ChatMessageList.tsx`. */
const styles = stylex.create({
	root: {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
		minHeight: 0
	},
	inner: {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
		minHeight: 0
	},
	gapCompact: {
		gap: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-3']
	},
	gapBalanced: {
		gap: spacingVars['--spacing-4'],
		paddingBlock: spacingVars['--spacing-4'],
		paddingInline: spacingVars['--spacing-4']
	},
	gapSpacious: {
		gap: spacingVars['--spacing-6'],
		paddingBlock: spacingVars['--spacing-6'],
		paddingInline: spacingVars['--spacing-6']
	},
	spacer: {
		flex: 1,
		minHeight: 0
	},
	loadingTop: {
		display: 'flex',
		justifyContent: 'center',
		paddingBlock: spacingVars['--spacing-3']
	},
	emptyState: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1,
		minHeight: 0
	}
});

/** Upstream's `gapStyles` — the `gap` prop's per-step override. */
const gapStyles = stylex.create({
	0: {
		gap: spacingVars['--spacing-0']
	},
	0.5: {
		gap: spacingVars['--spacing-0-5']
	},
	1: {
		gap: spacingVars['--spacing-1']
	},
	1.5: {
		gap: spacingVars['--spacing-1-5']
	},
	2: {
		gap: spacingVars['--spacing-2']
	},
	3: {
		gap: spacingVars['--spacing-3']
	},
	4: {
		gap: spacingVars['--spacing-4']
	},
	5: {
		gap: spacingVars['--spacing-5']
	},
	6: {
		gap: spacingVars['--spacing-6']
	},
	8: {
		gap: spacingVars['--spacing-8']
	},
	10: {
		gap: spacingVars['--spacing-10']
	}
});

const densityGapStyles = {
	compact: styles.gapCompact,
	balanced: styles.gapBalanced,
	spacious: styles.gapSpacious
} as const;

export function chatMessageListRootAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

export function chatMessageListInnerAttrs(
	density: ChatDensity,
	gap: SpacingStep | undefined
): SvelteStyleAttrs {
	return sx(styles.inner, densityGapStyles[density], gap == null ? null : gapStyles[gap]);
}

export function chatMessageListSpacerAttrs(): SvelteStyleAttrs {
	return sx(styles.spacer);
}

export function chatMessageListLoadingTopAttrs(): SvelteStyleAttrs {
	return sx(styles.loadingTop);
}

export function chatMessageListEmptyStateAttrs(): SvelteStyleAttrs {
	return sx(styles.emptyState);
}
