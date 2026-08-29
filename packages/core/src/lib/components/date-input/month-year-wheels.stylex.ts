import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';
import { dateInputTouchGeometry } from './tokens.stylex.js';

/**
 * Ported from Astryx's `DateInput/MonthYearWheels.tsx`, where the one style is
 * inline in the component file.
 *
 * The pair occupies exactly the same box as the month scroller, so opening the
 * wheels never changes the picker's height — which is the whole reason the
 * block size is the shared pane geometry rather than anything local.
 */

const styles = stylex.create({
	wheels: {
		display: 'flex',
		blockSize: dateInputTouchGeometry.paneBlockSize,
		gap: spacingVars['--spacing-2']
	}
});

/** The row holding the month wheel and the year wheel. */
export function monthYearWheelsAttrs(): SvelteStyleAttrs {
	return sx(styles.wheels);
}
