import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
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

/**
 * The native `<dialog>` shell. `hasScrim` is what makes the dialog modal, so it
 * selects the scrim and the non-modal layering between them.
 *
 * Shared with `BottomSheetSwitcher`, which declares the same five style keys in
 * its own file upstream — identical properties, identical token references, and
 * so identical atomic classes. One module here rather than a byte-for-byte
 * duplicate: the emitted CSS is the same either way, and the oracles check the
 * output, not the file layout. `xstyle` is threaded because the switcher applies
 * a consumer override to the dialog itself, where a standalone sheet applies it
 * to the panel.
 */
export function bottomSheetDialogAttrs(
	isPresented: boolean,
	hasScrim: boolean,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.dialog,
		isPresented && styles.dialogOpen,
		hasScrim && styles.scrim,
		!hasScrim && styles.dialogNonModal,
		xstyle
	);
}

/** The block-end positioner the panel sits in. */
export function bottomSheetPositionerAttrs(isHidden: boolean, isTop: boolean): SvelteStyleAttrs {
	return sx(styles.positioner, isHidden && styles.positionerHidden, isTop && styles.positionerTop);
}
