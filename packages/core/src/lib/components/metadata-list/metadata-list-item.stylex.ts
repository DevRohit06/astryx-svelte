import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

const styles = stylex.create({
	// Label (dt), inline — side by side with its value.
	label: {
		color: colorVars['--color-text-secondary'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		margin: 0,
		padding: 0,
		minHeight: 24,
		wordBreak: 'break-word'
	},
	// Value (dd), inline.
	value: {
		color: colorVars['--color-text-primary'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		margin: 0,
		padding: 0,
		minHeight: 24,
		wordBreak: 'break-word'
	},
	// Stacked layout — the pair wrapped in a column.
	stackedWrapper: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5']
	},
	stackedLabel: {
		color: colorVars['--color-text-secondary'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		margin: 0,
		padding: 0
	},
	stackedValue: {
		color: colorVars['--color-text-primary'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		margin: 0,
		padding: 0,
		wordBreak: 'break-word'
	},
	iconWrapper: {
		display: 'inline-flex',
		alignItems: 'center',
		flexShrink: 0,
		color: colorVars['--color-text-secondary']
	}
});

export function metadataListItemLabelAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.label, xstyle);
}

export function metadataListItemValueAttrs(): SvelteStyleAttrs {
	return sx(styles.value);
}

export function metadataListItemStackedWrapperAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.stackedWrapper, xstyle);
}

export function metadataListItemStackedLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.stackedLabel);
}

export function metadataListItemStackedValueAttrs(): SvelteStyleAttrs {
	return sx(styles.stackedValue);
}

export function metadataListItemIconAttrs(): SvelteStyleAttrs {
	return sx(styles.iconWrapper);
}
