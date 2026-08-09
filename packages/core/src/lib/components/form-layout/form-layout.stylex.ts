import * as stylex from '@stylexjs/stylex';
import type { FormLayoutDirection } from './form-layout-context.svelte.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';

/** Below this, side-by-side labels have nowhere to go and the grid collapses. */
const HORIZONTAL_LABELS_COLLAPSE = '@media (max-width: 480px)';

const styles = stylex.create({
	base: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-4']
	},
	horizontal: {
		display: 'grid',
		gridAutoFlow: 'column',
		gridAutoColumns: '1fr'
	},
	horizontalLabels: {
		display: 'grid',
		gridTemplateColumns: 'auto 1fr',
		gap: `${spacingVars['--spacing-3']} ${spacingVars['--spacing-4']}`,
		alignItems: 'start',
		[HORIZONTAL_LABELS_COLLAPSE]: {
			display: 'flex',
			flexDirection: 'column',
			gap: spacingVars['--spacing-4']
		}
	}
});

export function formLayoutAttrs(
	direction: FormLayoutDirection,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.base,
		direction === 'horizontal' && styles.horizontal,
		direction === 'horizontal-labels' && styles.horizontalLabels,
		xstyle
	);
}
