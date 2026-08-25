import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { overlayPaddingReset } from '../../internal/padding.stylex.js';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	spacingVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `MobileNav/MobileNav.tsx` styles.
 *
 * The drawer is a native `<dialog>` promoted to the top layer by `showModal()`,
 * so the browser owns stacking, focus containment, scroll lock and `::backdrop`
 * — there is no `z-index` anywhere in here and no `<Layer>`, exactly as in
 * `Dialog` and `Lightbox`.
 *
 * Two things about the open state are load-bearing and easy to "tidy" wrongly:
 *
 * - `display` is toggled by the `isOpen` **prop**, not by `[open]`. Upstream's
 *   comment says why: a `:where([open])` rule loses to the atomic class the
 *   compiler emits, so the dialog would stay `display: none` while open.
 * - `close()` is delayed by the caller so the slide-out transition can play,
 *   which is why `open`/`backdropOpen`/`drawer*Open` are separate keys rather
 *   than folded into conditionals — the element stays `open` through the
 *   transition with the open styles already removed.
 *
 * `border: 'none'` on the dialog emits nothing (StyleX drops the shorthand); the
 * reset's universal `border-width: 0` is what actually removes the UA's 3px
 * `<dialog>` border. See port/todo.md → Phase 0.
 */
const styles = stylex.create({
	dialog: {
		// Reset native <dialog> defaults
		position: 'fixed',
		margin: 0,
		padding: 0,
		border: 'none',
		maxWidth: 'none',
		maxHeight: 'none',
		// Full viewport overlay — the dialog itself is the full-screen container
		inset: 0,
		width: '100vw',
		height: '100dvh',
		backgroundColor: 'transparent',
		// `clip`, not `hidden`. Both clip the off-screen drawer, but `hidden` makes
		// the dialog a SCROLL CONTAINER, and a scroll container in the top layer
		// whose subtree holds another scroller (the drawer's content area) does not
		// paint a @starting-style entry transition for its descendants in Chromium:
		// the transition ticks in the CSSOM while every painted frame shows the end
		// value, so the drawer appears fully open. `clip` clips without creating a
		// scroll container and the slide-in paints normally. The dialog never
		// scrolls anyway — its child is absolutely positioned — so nothing depended
		// on it being a scroll container.
		overflow: 'clip',
		overscrollBehavior: 'contain',
		// Prevent touch gestures (pull-to-refresh, background scroll) passing through
		touchAction: 'none',
		outline: 'none',
		// Native <dialog> uses display:none when closed.
		// Open state applied via isOpen prop to avoid :where([open]) specificity issues.
		display: 'none',
		// `display` participates in the transition with allow-discrete so it flips
		// to none only after the slide-out finishes. That also keeps the dialog
		// rendered until close() has actually run: an open modal dialog that isn't
		// rendered still blocks the whole document, and a browser that fails to
		// un-block it on close leaves the page inert with no error (#4290).
		// Deliberately not shortened under reduced motion: `display` is discrete, so
		// a long hold animates nothing — it is only the window the close has to land
		// inside. The visible transitions (the drawer's transform and the backdrop's
		// opacity) are the ones that respect the preference.
		transitionProperty: 'display',
		transitionDuration: durationVars['--duration-medium'],
		transitionBehavior: 'allow-discrete'
	},
	open: {
		display: 'flex'
	},
	// ::backdrop is provided by the browser's top layer
	backdrop: {
		'::backdrop': {
			backgroundColor: colorVars['--color-overlay'],
			backdropFilter: 'blur(2px)',
			opacity: 0,
			transitionProperty: 'opacity',
			transitionDuration: durationVars['--duration-medium'],
			transitionTimingFunction: easeVars['--ease-standard']
		},
		'@media (prefers-reduced-motion: reduce)': {
			'::backdrop': {
				transitionDuration: '0.01s'
			}
		}
	},
	backdropOpen: {
		'::backdrop': {
			// The ::backdrop only exists once showModal() has put the dialog in the
			// top layer, so its first rendered frame already has the open opacity.
			// Without a starting style there is no earlier value to transition from
			// and the scrim snaps in — @starting-style supplies that value.
			opacity: {
				default: 1,
				'@starting-style': 0
			}
		}
	},
	drawer: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		display: 'flex',
		flexDirection: 'column',
		backgroundColor: colorVars['--color-background-surface'],
		boxSizing: 'border-box',
		overflow: 'hidden',
		transitionProperty: 'transform',
		transitionDuration: durationVars['--duration-medium'],
		transitionTimingFunction: easeVars['--ease-standard'],
		outline: 'none',
		'@media (prefers-reduced-motion: reduce)': {
			transitionDuration: '0.01s'
		}
	},
	drawerStart: {
		insetInlineStart: 0,
		borderInlineEndWidth: borderVars['--border-width'],
		borderInlineEndStyle: 'solid',
		borderInlineEndColor: colorVars['--color-border'],
		transform: {
			default: 'translateX(-100%)',
			':is([dir="rtl"] *)': 'translateX(100%)'
		}
	},
	drawerStartOpen: {
		// The whole dialog is `display: none` while closed, so the drawer is not
		// rendered and the open transform is the only value it has ever had — a
		// transition needs a previous value to run from. @starting-style gives the
		// first rendered frame the off-screen transform, so the slide-in plays.
		transform: {
			default: 'translateX(0)',
			'@starting-style': {
				default: 'translateX(-100%)',
				':is([dir="rtl"] *)': 'translateX(100%)'
			}
		}
	},
	drawerEnd: {
		insetInlineEnd: 0,
		borderInlineStartWidth: borderVars['--border-width'],
		borderInlineStartStyle: 'solid',
		borderInlineStartColor: colorVars['--color-border'],
		transform: {
			default: 'translateX(100%)',
			':is([dir="rtl"] *)': 'translateX(-100%)'
		}
	},
	drawerEndOpen: {
		// See drawerStartOpen — same starting style, mirrored edge.
		transform: {
			default: 'translateX(0)',
			'@starting-style': {
				default: 'translateX(100%)',
				':is([dir="rtl"] *)': 'translateX(-100%)'
			}
		}
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: spacingVars['--spacing-12'],
		paddingInline: spacingVars['--spacing-2'],
		flexShrink: 0,
		borderBlockEndWidth: borderVars['--border-width'],
		borderBlockEndStyle: 'solid',
		borderBlockEndColor: colorVars['--color-border']
	},
	headerNoTitle: {
		justifyContent: 'flex-end'
	},
	headerText: {
		marginInlineStart: spacingVars['--spacing-1']
	},
	content: {
		flex: 1,
		overflowY: 'auto',
		overflowX: 'hidden',
		overscrollBehavior: 'contain',
		// Re-enable vertical touch scrolling inside the drawer content
		// (dialog root has touch-action: none to block pull-to-refresh)
		touchAction: 'pan-y',
		paddingInline: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-2']
	}
});

const dynamicStyles = stylex.create({
	width: (w: number) => ({
		width: '100vw',
		maxWidth: `${w}px`
	})
});

/** The `<dialog>` root — reset, open state, and the animated `::backdrop`. */
export function mobileNavDialogAttrs(isOpen: boolean, xstyle: StyleArg): SvelteStyleAttrs {
	return sx(
		styles.dialog,
		// The overlay root is not inside any padded container, so the inherited
		// container padding vars are reset at its boundary.
		overlayPaddingReset.reset,
		isOpen && styles.open,
		styles.backdrop,
		isOpen && styles.backdropOpen,
		xstyle
	);
}

/** The sliding panel inside the dialog. `isStart` picks the edge it comes from. */
export function mobileNavDrawerAttrs(
	width: number,
	isStart: boolean,
	isOpen: boolean
): SvelteStyleAttrs {
	return sx(
		styles.drawer,
		dynamicStyles.width(width),
		isStart && styles.drawerStart,
		isStart && isOpen && styles.drawerStartOpen,
		!isStart && styles.drawerEnd,
		!isStart && isOpen && styles.drawerEndOpen
	);
}

/** Header row — content plus the close button. Right-aligns with no header. */
export function mobileNavHeaderAttrs(hasHeader: boolean): SvelteStyleAttrs {
	return sx(styles.header, !hasHeader && styles.headerNoTitle);
}

/**
 * The inset on a string header's `<Heading level={2}>`.
 *
 * Exported as the bare style rather than as attrs, because it is handed to the
 * `Heading` as `xstyle` — upstream's `<Heading level={2} xstyle={styles.headerText}>`
 * — instead of being applied to an element here.
 */
export const mobileNavHeaderTextStyle = styles.headerText;

/** The scrollable body below the header. */
export function mobileNavContentAttrs(): SvelteStyleAttrs {
	return sx(styles.content);
}
