import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../internal/sx.js';
import { focusVars } from '../styles/tokens.stylex.js';

/**
 * The shared keyboard focus outline, ported from Astryx's
 * `utils/focusOutline.stylex.ts`.
 *
 * Centralizes the standard Astryx focus outline, shown only for keyboard focus.
 * Every focusable surface drew the same 2px accent ring already; writing it per
 * component meant dozens of identical definitions to keep in step, and they did
 * not stay in step — offsets drifted and one ring was a border-width thick.
 *
 * Every ring in core is drawn from here, with one exception recorded in
 * `Switch`: its condition is a component-scoped ancestor marker, which cannot be
 * shared without leaking focus state between components. A component may still
 * override the OFFSET (a ring that must sit inset, or clear of a field border);
 * width, style and color are not restated anywhere.
 *
 * Every value comes from the `--focus-outline-*` tokens, which is how a theme
 * restyles the ring: one override reaches every component at once. The
 * `:focus-visible` condition is not themeable and stays here, so a theme can
 * change what the ring looks like but cannot show it to pointer users.
 *
 * Named `focus-outline.stylex.ts` rather than upstream's `focusOutline.stylex.ts`
 * because this port's modules are kebab-case; the `.stylex.ts` suffix is what
 * marks it for the StyleX plugin, exactly as in `rtl.stylex.ts`.
 */

const FOCUS_OUTLINE_WIDTH = focusVars['--focus-outline-width'];
const FOCUS_OUTLINE_STYLE = focusVars['--focus-outline-style'];
const FOCUS_OUTLINE_COLOR = focusVars['--focus-outline-color'];

const FOCUS_OUTLINE_OFFSET = focusVars['--focus-outline-offset'];

/**
 * The ring as a single `outline` value, for reading it at runtime — an
 * assertion, or an element styled imperatively.
 *
 * NOT usable inside another file's `stylex.create`: StyleX resolves imported
 * `defineVars` and nothing else, so a component whose condition
 * {@link focusOutlineStyles} cannot express (`Switch`, whose ring keys off a
 * component-scoped ancestor marker) has to compose the `focusVars` tokens
 * itself.
 */
export const FOCUS_OUTLINE = `${FOCUS_OUTLINE_WIDTH} ${FOCUS_OUTLINE_STYLE} ${FOCUS_OUTLINE_COLOR}`;

/**
 * Written as longhands rather than the `outline` shorthand.
 *
 * A shorthand resets every longhand it covers, so `outline: 2px solid accent`
 * would clobber a later `outlineColor` no matter the order — which is how
 * destructive buttons silently lost their red ring. With longhands, a variant
 * can re-color the ring and inherit width, style and offset.
 */
const focusOutlineLonghands = {
	outlineWidth: FOCUS_OUTLINE_WIDTH,
	outlineStyle: FOCUS_OUTLINE_STYLE,
	outlineColor: FOCUS_OUTLINE_COLOR
} as const;

/**
 * The standard focus ring as plain CSS values, for the one case that has to
 * apply it imperatively: a control whose focusable input is visually hidden and
 * whose ring must land on a *themeable indicator* beside it (see
 * `useIndicatorFocusRing`). Everything else should use the styles above.
 *
 * Longhands, not the `outline` shorthand, for the same reason the styles are:
 * a shorthand resets every longhand it covers, so a caller could not re-color
 * the ring without restating its width and style. Split, each part is
 * independently overridable — and every part stays a var, so a theme's
 * `--focus-outline-*` overrides still flow through.
 *
 * Keys are camelCase to match `HTMLElement.style`, so this spreads straight
 * onto an element:
 *
 * ```ts
 * Object.assign(el.style, FOCUS_OUTLINE_PARTS);        // draw
 * Object.assign(el.style, FOCUS_OUTLINE_PARTS_NONE);   // clear
 * ```
 */
export const FOCUS_OUTLINE_PARTS = {
	outlineWidth: FOCUS_OUTLINE_WIDTH,
	outlineStyle: FOCUS_OUTLINE_STYLE,
	outlineColor: FOCUS_OUTLINE_COLOR,
	outlineOffset: FOCUS_OUTLINE_OFFSET
} as const;

/** Clears {@link FOCUS_OUTLINE_PARTS}, one key per part so nothing lingers. */
export const FOCUS_OUTLINE_PARTS_NONE = {
	outlineWidth: '',
	outlineStyle: '',
	outlineColor: '',
	outlineOffset: ''
} as const;

export const focusOutlineStyles = stylex.create({
	focusVisible: {
		outlineWidth: {
			default: '0',
			':focus-visible': focusOutlineLonghands.outlineWidth
		},
		outlineStyle: {
			default: 'none',
			':focus-visible': focusOutlineLonghands.outlineStyle
		},
		outlineColor: {
			default: null,
			':focus-visible': focusOutlineLonghands.outlineColor
		},
		outlineOffset: { default: '0', ':focus-visible': FOCUS_OUTLINE_OFFSET }
	},
	focusWithin: {
		outlineWidth: {
			default: '0',
			':has(:focus-visible)': focusOutlineLonghands.outlineWidth
		},
		outlineStyle: {
			default: 'none',
			':has(:focus-visible)': focusOutlineLonghands.outlineStyle
		},
		outlineColor: {
			default: null,
			':has(:focus-visible)': focusOutlineLonghands.outlineColor
		},
		outlineOffset: { default: '0', ':has(:focus-visible)': FOCUS_OUTLINE_OFFSET }
	},
	publishFocusVisibleVars: {
		'--_focus-outline': {
			default: 'none',
			':focus-visible': FOCUS_OUTLINE
		},
		'--_focus-outline-offset': {
			default: '0',
			':focus-visible': FOCUS_OUTLINE_OFFSET
		}
	},
	focusWithinOrPublished: {
		outline: {
			default: 'var(--_focus-outline, none)',
			':has(:focus-visible)': FOCUS_OUTLINE
		},
		outlineOffset: {
			default: 'var(--_focus-outline-offset, 0)',
			':has(:focus-visible)': FOCUS_OUTLINE_OFFSET
		}
	}
});

function makeFocusOutlineProps(style: StyleArg) {
	return (...styles: StyleArg[]): SvelteStyleAttrs =>
		// Caller styles LAST, so a component can deliberately re-color its ring —
		// destructive buttons ring in error red, not accent. StyleX is last-wins,
		// and reversing this to protect the ring silently ate that override.
		//
		// The hazard in this direction is the opposite one: a caller whose base
		// style carries `outline: 'none'` wipes the ring out entirely (TreeList
		// did, and shipped a focusable row with no visible focus). Two things
		// guard it — this file states the rule, and the ring is written as
		// LONGHANDS, so an override has to name `outlineStyle`/`outlineWidth`
		// explicitly rather than erasing them through the `outline` shorthand.
		sx(style, ...styles);
}

/**
 * Upstream returns `stylex.props()` here, i.e. React's `{className, style}`.
 * Ours returns Svelte's `{class, style}` through the same `sx()` adapter every
 * other module in this package uses — the same symbol doing the same job in the
 * shape this framework consumes.
 */
export const focusOutlineProps = {
	focusVisible: makeFocusOutlineProps(focusOutlineStyles.focusVisible),
	focusWithin: makeFocusOutlineProps(focusOutlineStyles.focusWithin),
	publishFocusVisibleVars: makeFocusOutlineProps(focusOutlineStyles.publishFocusVisibleVars),
	focusWithinOrPublished: makeFocusOutlineProps(focusOutlineStyles.focusWithinOrPublished)
} as const;
