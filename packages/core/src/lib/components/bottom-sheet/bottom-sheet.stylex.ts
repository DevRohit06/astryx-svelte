import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, durationVars, easeVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `BottomSheet/BottomSheet.tsx` styles.
 *
 * The dialog shell around the panel: the native `<dialog>` reset, the scrim on
 * its `::backdrop`, and the positioner that pins the sheet to the block end.
 * The sheet surface itself lives in `bottom-sheet-panel.stylex.ts`.
 */

const styles = stylex.create({
	dialog: {
		position: 'fixed',
		inset: 0,
		width: '100dvw',
		height: '100dvh',
		maxWidth: 'none',
		maxHeight: 'none',
		margin: 0,
		padding: 0,
		border: 'none',
		backgroundColor: 'transparent',
		overflow: 'visible',
		display: 'none',
		outline: 'none'
	},
	dialogOpen: {
		display: 'block'
	},
	dialogNonModal: {
		pointerEvents: 'none',
		zIndex: 1000,
		width: '100%',
		height: '100%'
	},
	scrim: {
		'::backdrop': {
			backgroundColor: colorVars['--color-overlay'],
			opacity: {
				default: 'var(--_sheet-scrim-opacity, 1)',
				'@starting-style': 0
			},
			transitionProperty: 'opacity, display',
			transitionDuration: durationVars['--duration-medium'],
			transitionTimingFunction: easeVars['--ease-standard'],
			transitionBehavior: 'allow-discrete',
			'@media (prefers-reduced-motion: reduce)': {
				transitionDuration: '0.01s'
			}
		}
	},
	positioner: {
		position: 'absolute',
		insetInline: 0,
		insetBlockEnd: 0,
		display: 'flex',
		justifyContent: 'center',
		pointerEvents: 'none'
	},
	positionerHidden: {
		display: 'none'
	},
	positionerTop: {
		zIndex: 1
	}
});

/** The native `<dialog>` shell. */
export function bottomSheetDialogAttrs(
	isOpen: boolean,
	isModal: boolean,
	hasScrim: boolean
): SvelteStyleAttrs {
	return sx(
		styles.dialog,
		isOpen && styles.dialogOpen,
		!isModal && styles.dialogNonModal,
		hasScrim && styles.scrim
	);
}

/** The block-end positioner the panel sits in. */
export function bottomSheetPositionerAttrs(isHidden: boolean, isTop: boolean): SvelteStyleAttrs {
	return sx(styles.positioner, isHidden && styles.positionerHidden, isTop && styles.positionerTop);
}
