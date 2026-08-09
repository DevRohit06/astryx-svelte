import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../internal/sx.js';

/**
 * The shared RTL mirror, ported from Astryx's `utils/rtlStyles.ts`.
 *
 * `mirror` flips its element on the horizontal axis only when an ancestor
 * carries `dir="rtl"`. Three details in it are load-bearing:
 *
 * - **`scaleX(-1)`, not `scale(-1, -1)`** — the vertical axis must survive.
 * - **Applied *outside* any state-driven rotation.** A disclosure chevron that
 *   rotates 90° when expanded has to compose with the mirror rather than fight
 *   it; putting the mirror on the same element as the rotation makes one
 *   overwrite the other, and the bug only shows in the expanded × RTL corner.
 * - **`:is([dir="rtl"] *)`, not `direction: rtl`.** The selector matches on an
 *   *ancestor's* `dir` attribute, which is what the DOM actually carries; a
 *   bare `direction: rtl` declaration on the element itself would not trigger
 *   it. Same convention the MobileNav drawer uses.
 *
 * `centerInline(blockOffset)` horizontally centres an absolutely-positioned,
 * auto-width element on the inline axis — correctly in **both** LTR and RTL —
 * with an optional block-axis offset folded into the same transform.
 *
 * It uses **physical `left: 50%` + `translateX(-50%)` on purpose.** Both halves
 * reference the same physical edge, so the pair is direction-symmetric and
 * centres identically whatever `dir` says. A *logical* `insetInlineStart: 50%`
 * anchor paired with a physical translate is the trap: under RTL the anchor
 * flips to the right edge while the translate still moves left, leaving the
 * element off-centre **by its own width** — centred in LTR, visibly broken in
 * RTL. This port had exactly that bug at three sites after batch 17a's
 * physical→logical sweep (Slider's thumb and tooltip, ResizeHandle's pill,
 * Popover's close button); two of them had since grown a hand-rolled
 * `':is([dir="rtl"] *)': 'translate(50%, …)'` compensation branch, which works
 * but diverges from upstream and has to be maintained per call site.
 *
 * So this is the one place physical `left` is correct, and the
 * `no-physical-properties` suppression lives here **once** rather than at each
 * call site — which is also why the rule now recognises the idiom and points
 * offenders here instead of suggesting a logical rename.
 *
 * `blockOffset` is any CSS length/percentage for `translateY` (pass `'0px'` for
 * none): `centerInline('100%')` sits the element one full height below its
 * anchor, `centerInline('-50%')` centres it on both axes.
 *
 * Named `rtl.stylex.ts` rather than `rtl-styles.ts` because every module the
 * StyleX plugin must compile carries the `.stylex.ts` suffix in this port.
 */
/**
 * Published under upstream's name and shape, because upstream publishes it:
 * `utils/index.ts` exports `rtlStyles`, so a consumer can compose
 * `rtlStyles.mirror` into their own `xstyle`. Keeping the object (rather than
 * exporting a bare `mirror`) means the call site reads identically on both
 * sides.
 */
export const rtlStyles = stylex.create({
	mirror: {
		transform: { default: null, ':is([dir="rtl"] *)': 'scaleX(-1)' }
	},
	centerInline: (blockOffset: string) => ({
		// eslint-disable-next-line astryx/no-physical-properties -- intentional: physical left+translateX(-50%) is direction-symmetric and the correct way to centre; a logical anchor would break RTL centring (see file header).
		left: '50%',
		transform: `translate(-50%, ${blockOffset})`
	})
});

/**
 * The mirror as Svelte `class`/`style` attributes, for the components in this
 * package that apply it directly to an element rather than forwarding it as
 * `xstyle`. Upstream reaches the same place with `stylex.props(rtlStyles.mirror)`
 * inline; here that call has to live in a `.stylex.ts` module, so it is this.
 */
export function rtlMirrorAttrs(): SvelteStyleAttrs {
	return sx(rtlStyles.mirror);
}
