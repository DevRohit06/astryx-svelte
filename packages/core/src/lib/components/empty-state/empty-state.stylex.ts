import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

const styles = stylex.create({
	container: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		textAlign: 'center',
		gap: spacingVars['--spacing-4'],
		paddingBlock: spacingVars['--spacing-8'],
		paddingInline: spacingVars['--spacing-6']
	},
	containerCompact: {
		gap: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-4'],
		paddingInline: spacingVars['--spacing-4']
	},
	title: {
		margin: 0,
		fontFamily: 'inherit',
		fontSize: typeScaleVars['--text-large-size'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		lineHeight: typeScaleVars['--text-large-leading'],
		color: colorVars['--color-text-primary']
	},
	// Only the size moves in the compact variant — the title's weight and colour
	// are the same, so a level change stays a semantic change and not a visual one.
	titleCompact: {
		fontSize: typeScaleVars['--text-label-size']
	},
	description: {
		margin: 0,
		fontFamily: 'inherit',
		fontSize: typeScaleVars['--text-body-size'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		lineHeight: typeScaleVars['--text-body-leading'],
		color: colorVars['--color-text-secondary']
	},
	descriptionCompact: {
		fontSize: typeScaleVars['--text-supporting-size']
	},
	textGroup: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		maxWidth: '360px'
	},
	actions: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		marginTop: spacingVars['--spacing-1']
	},
	actionsCompact: {
		flexDirection: 'column'
	}
});

export function emptyStateContainerAttrs(isCompact: boolean, xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.container, isCompact && styles.containerCompact, xstyle);
}

export function emptyStateTitleAttrs(isCompact: boolean): SvelteStyleAttrs {
	return sx(styles.title, isCompact && styles.titleCompact);
}

export function emptyStateDescriptionAttrs(isCompact: boolean): SvelteStyleAttrs {
	return sx(styles.description, isCompact && styles.descriptionCompact);
}

export function emptyStateTextGroupAttrs(): SvelteStyleAttrs {
	return sx(styles.textGroup);
}

export function emptyStateActionsAttrs(isCompact: boolean): SvelteStyleAttrs {
	return sx(styles.actions, isCompact && styles.actionsCompact);
}
