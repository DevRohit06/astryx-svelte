import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
// Upstream reads `padding.stylex.ts` with `node:fs` and `__dirname`; the browser
// project has neither, and Vite's `?raw` hands over the same bytes. The
// precedent is `aspect-ratio.svelte.test.ts` and `input-clear-button.svelte.test.ts`.
import paddingSource from '$lib/internal/padding.stylex.ts?raw';
import OverlayPaddingReset, {
	type OverlayName
} from './fixtures/overlay-padding-reset-fixture.svelte';

/**
 * Astryx's `Layout/overlayPaddingReset.test.tsx`, ported case for case —
 * **4 of upstream's 4 declarations**, in upstream's order and under its titles.
 * **Nothing is dropped and nothing is added.**
 *
 * **Counting note.** Two of the four declarations sit inside a `describe.each`
 * over upstream's five-entry `OVERLAYS` table, which is upstream's own
 * structure. So the *declaration* count — the contract, and what the
 * `(?:it|test)\s*\(` scan in `scripts/status.mjs` derives from upstream's file —
 * is 4 on both sides, while the runner reports `Tests 12 passed (12)`: 5
 * overlays × 2, plus the 2 standalone cases. Upstream's file runs 12 for the
 * same reason.
 *
 * ## What this suite found on its first run
 *
 * Six of the twelve failed, and the cause was three port defects, not a
 * translation problem: `MobileNav`, `Lightbox` and every `useLayer` surface
 * never applied `overlayPaddingReset`, so a padded ancestor's container
 * variables reached straight into them. The failures named the leaked value —
 * `--container-padding-inline-start: expected '40px' to be '0px'` and
 * `--layout-padding-outer-x: expected [ '', 'initial' ] to include '40px'`,
 * the 40px being the page `Section`'s `padding={10}`.
 *
 * Each was one missing argument in one call, against upstream's six application
 * sites — `Dialog.tsx` (×2), `BottomSheetPanel.tsx`, `MobileNav.tsx`,
 * `Lightbox.tsx` and `useLayer.tsx` (×2) — of which this port had three:
 *
 * | Ours, before | Upstream |
 * | --- | --- |
 * | `mobile-nav.stylex.ts` `mobileNavDialogAttrs` — `sx(styles.dialog, isOpen && styles.open, …)` | `stylex.props(styles.dialog, overlayPaddingReset.reset, isOpen && styles.open, …)` |
 * | `lightbox.stylex.ts` `lightboxDialogAttrs` — `sx(styles.dialog, xstyle)` | `stylex.props(styles.dialog, overlayPaddingReset.reset, xstyle)` |
 * | `layer.stylex.ts` `layerAttrs` — `sx(styles.base, isFixed && styles.fixed, offsetStyle, xstyle)` | `stylex.props(styles.base, overlayPaddingReset.reset, …)`, at both call sites |
 *
 * All three now apply it in upstream's position — immediately after the
 * element's own base style, so later styles still win — and all twelve pass. The
 * `useLayer` one was the widest: every layer surface (`Popover`, `DropdownMenu`,
 * `Tooltip`, `HoverCard`, `ContextMenu`, `SelectMenu`) hung on that single line.
 *
 * **Neither fidelity oracle could see it**, which is why the gap survived.
 * `overlayPaddingReset` is a static `stylex.create` that compiles to the right
 * atomic classes either way, and the emitted CSS is byte-identical whether or
 * not anything references it — what differed was the class list on the overlay's
 * root element, which only a rendered DOM shows.
 *
 * ## Why the assertions here are stronger than upstream's
 *
 * Upstream's header says it plainly: "jsdom does no layout, so these assert on
 * the custom properties themselves", and jsdom does not inherit custom
 * properties at all — so upstream's cases can only see the declaration the
 * overlay root makes for itself. The browser project runs real Chromium, where
 * inheritance is real: the page `Section`'s 40px genuinely reaches an overlay
 * root that has not stopped it.
 *
 * That difference is not uniform across the two per-overlay cases, and it is
 * worth being exact. *Zeroes the values descendants subtract* would catch a
 * missing reset under jsdom too — an undeclared property reads back `''`, which
 * is not `'0px'`. *Clears the values descendants add* would **not**: under jsdom
 * an undeclared property and one set to `initial` both land inside
 * `CLEARED_READBACK`, so the case is vacuous there and only bites in a browser,
 * where the alternative to `''` is the inherited `40px`. Both halves bit here.
 *
 * Two consequences for individual assertions, both restatements *upward*:
 *
 * - `CLEARED_READBACK` keeps upstream's `['', 'initial']` verbatim. Chromium
 *   resolves `initial` on a custom property to the guaranteed-invalid value and
 *   reports `''`; only jsdom echoes the keyword. Keeping both entries keeps the
 *   constant upstream's, and the browser exercises the meaningful half.
 * - The last case's `toBe('var(--spacing-10)')` becomes `toBe('40px')`. The
 *   computed value of a custom property is its specified value with every
 *   `var()` substituted, so Chromium reports the resolved length where jsdom
 *   echoes the reference. Upstream's own comment on that line — "(jsdom does not
 *   resolve the token reference to its 40px value.)" — names the value this
 *   asserts, and asserting it proves the token resolves as well as that the
 *   declaration landed.
 *
 * ## Upstream's stubs, and why two of them are gone
 *
 * `HTMLDialogElement.prototype.showModal`/`show`/`close` and `matchMedia` are
 * stubbed upstream because **jsdom implements neither**. Chromium implements
 * both, and faking them here would replace the thing under test: a stubbed
 * `showModal` only sets an `open` attribute, where the real one puts the element
 * in the top layer — which is the whole situation the reset exists for.
 * Upstream's `matchMedia` stub answers `matches: false` to every query; headless
 * Chromium at the project's default viewport answers the same to the queries
 * these five components ask, so the branch taken is upstream's either way.
 */

/**
 * Values descendants SUBTRACT (bleed margins). The overlay root has no padding
 * of its own to escape, so these must read a literal zero.
 */
const SUBTRACTED = [
	'--container-padding-inline-start',
	'--container-padding-inline-end',
	'--container-padding-block-start',
	'--container-padding-block-end'
];

/**
 * Values descendants ADD. These must be guaranteed-invalid (`initial`) rather
 * than zero, so readers fall through to their own default instead of losing
 * their padding — a computed empty string is what `initial` looks like here.
 */
const CLEARED = [
	'--layout-padding-outer-x',
	'--layout-padding-outer-y',
	'--layout-padding-inner-x',
	'--layout-padding-inner-y',
	'--_section-padding-propagated'
];

/** What a cleared custom property reads back as. See the assertion below. */
const CLEARED_READBACK = ['', 'initial'];

/**
 * Each overlay, rendered open inside a page `Section` that leaks 40px.
 *
 * Upstream's `render` thunk is the fixture's `which` prop, since each overlay's
 * children/content is a `Snippet` here and a snippet can only be authored in a
 * template. Upstream's `root` query becomes a selector because
 * `getComputedStyle` needs the raw node: `screen.getByRole('dialog')` is
 * `dialog[open]` — an open native `<dialog>` is exactly what exposes that role,
 * and all three of those overlays render one — while `.astryx-bottom-sheet` and
 * `[popover]` are upstream's own selectors, unchanged.
 */
interface Overlay {
	name: string;
	which: OverlayName;
	root: string;
}

const OVERLAYS: Overlay[] = [
	{ name: 'Dialog', which: 'Dialog', root: 'dialog[open]' },
	{ name: 'BottomSheet', which: 'BottomSheet', root: '.astryx-bottom-sheet' },
	{ name: 'MobileNav', which: 'MobileNav', root: 'dialog[open]' },
	{ name: 'Lightbox', which: 'Lightbox', root: 'dialog[open]' },
	{ name: 'Popover (useLayer surface)', which: 'Popover', root: '[popover]' }
];

/**
 * Mount the fixture and hand back the overlay root.
 *
 * The wait has no upstream counterpart and is not a translation of `act()`:
 * every one of these overlays opens itself from an effect, and `showModal()` /
 * `showPopover()` are real here, so the node exists a microtask after mount
 * rather than synchronously as it does under jsdom's stub.
 */
async function mount(which: OverlayName, root: string): Promise<HTMLElement> {
	await render(OverlayPaddingReset, { props: { which } });
	return await vi.waitFor(() => {
		const el = document.querySelector<HTMLElement>(root);
		if (!el) throw new Error(`overlay root not found: ${root}`);
		return el;
	});
}

describe('overlayPaddingReset', () => {
	describe.each(OVERLAYS)('$name', ({ which, root }) => {
		it('zeroes the values descendants subtract', async () => {
			const computed = getComputedStyle(await mount(which, root));
			for (const name of SUBTRACTED) {
				expect(computed.getPropertyValue(name), name).toBe('0px');
			}
		});

		it('clears the values descendants add, so they fall to their default', async () => {
			const computed = getComputedStyle(await mount(which, root));
			for (const name of CLEARED) {
				// A browser resolves `initial` on a custom property to the
				// guaranteed-invalid value and reports '' here; jsdom does not
				// implement that and echoes the keyword. Either proves the
				// declaration landed — and neither is the leaked '40px'.
				expect(CLEARED_READBACK, name).toContain(computed.getPropertyValue(name));
			}
		});
	});

	it('does not clear the public theme token', () => {
		// The reset clears the PRIVATE propagation var only. The public
		// `--astryx-section-padding` is theme surface, set once at the theme root,
		// so it has to keep reaching inside every overlay — clearing it would
		// blank a theme's section padding in every dialog. That is the whole
		// reason the two names were split, and it is the mistake a later
		// "simplification" would most plausibly make.
		//
		// Upstream adds that jsdom does not inherit custom properties, so the
		// cascade cannot show this and it asserts where the decision is made
		// instead. That reason does not hold here — Chromium does inherit — but
		// the assertion is kept as upstream wrote it, because what it pins is the
		// *declaration*, and a cascade check would pass just as well against a
		// theme token that no theme happened to set in this test page.
		const reset = paddingSource.slice(paddingSource.indexOf('export const overlayPaddingReset'));
		expect(reset).toContain("'--_section-padding-propagated': 'initial'");
		expect(reset).not.toContain('--astryx-section-padding');
	});

	it("stops an ancestor Section's propagated padding at the boundary", async () => {
		// The page Section propagates 40px. Without the reset it would reach the
		// Section inside the overlay, which would pad itself 40px instead of the
		// theme default — the second half of #5208.
		const dialog = await mount('Dialog', 'dialog[open]');
		expect(CLEARED_READBACK).toContain(
			getComputedStyle(dialog).getPropertyValue('--_section-padding-propagated')
		);
		// ...while the page Section outside the overlay still propagates it.
		// RESTATED: upstream asserts the literal `'var(--spacing-10)'` because
		// jsdom does not substitute. Chromium computes a custom property's value
		// with every `var()` resolved, so the assertion is the 40px upstream's own
		// comment names — the same declaration, checked one step further along.
		const pageSection = document.querySelector<HTMLElement>('.astryx-section');
		expect(
			getComputedStyle(pageSection as HTMLElement).getPropertyValue('--_section-padding-propagated')
		).toBe('40px');
	});
});
