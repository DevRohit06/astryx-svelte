/** PORTS: DateInput/DateInputTouch.test.tsx */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	toMonthIndex,
	monthIndexOf,
	fromMonthIndex,
	clampIndex,
	rowAtScrollOffset,
	scrollOffsetForRow,
	paneWindow,
	rowsIn,
	DEFAULT_MONTH_REACH
} from '$lib/components/date-input/month-geometry.js';

/**
 * Ports the executable half of upstream's `DateInput/DateInputTouch.test.tsx`
 * at the **0.5.2** pin.
 *
 * Upstream's suite is **136 `it(` cases**. This file carries **35** of them —
 * every case that needs no DOM, less one that needs a module this port does
 * not have yet:
 *
 * - `describe('monthGeometry')` and its three nested blocks — 4 + 5 + 2 + 3 =
 *   **14 cases**, the pure month arithmetic.
 * - `describe('DateInput — scroll CSS (definition-level)')` — **21 of its 22
 *   cases**. Upstream's own header explains why these read source text rather
 *   than a rendered tree: snapping, momentum and the scroll-driven falloff are
 *   CSS a browser resolves and jsdom does not implement at all, so the
 *   assertion is on the style DEFINITION, which at least fails loudly if
 *   someone deletes the property. That reasoning survives the port unchanged,
 *   and it is why these belong in the **server** project here even though they
 *   are about CSS.
 *
 *   The one dropped case is `sizes the closed field the same on both
 *   surfaces`, which asserts that `TouchDateField`'s `sizeStyles` block is
 *   byte-equal to `NativeDateField`'s. 0.5.1 added `NativeDateField` and the
 *   `nativePicker` prop that routes to it, and neither is ported yet; the case
 *   lands with the module it compares against.
 *
 * The remaining **101 cases are not ported**, and none of them is dropped on
 * merit — they are upstream's DOM coverage:
 *
 * | upstream describe                                        | cases |
 * | -------------------------------------------------------- | ----- |
 * | `DateInput — surface selection`                           |     9 |
 * | `DateInput — field parity`                                |    15 |
 * | `DateInput — calendar surface`                            |    29 |
 * | `DateInput — a rest position between two months`          |     6 |
 * | `DateInput — month/year wheels`                           |    23 |
 * | `DateInput — nested scrollers keep their own touch gesture`|    12 |
 * | `DateInput — a mouse can drag a wheel`                     |     6 |
 *
 * They belong in a `*.svelte.test.ts` client file, and porting them needs a
 * harness this file cannot supply: upstream stubs `matchMedia` per test to
 * choose the surface, shadows `HTMLElement.prototype.clientWidth` so the
 * virtualized scroller mounts panes at all, drives fake timers past
 * `SCROLL_QUIET_MS`, and polyfills `HTMLDialogElement`'s `showModal`/`close`
 * — every one of which means something different in the real Chromium the
 * client project runs. See `port/todo.md` for the follow-up.
 *
 * ## Two deliberate adaptations of the definition-level cases
 *
 * 1. **The file map.** Upstream keeps its styles inside the component files;
 *    this port keeps them in `<name>.stylex.ts`, because StyleX may not be
 *    imported from a `.svelte` file. So a case that reads `MonthScroller.tsx`
 *    reads `month-scroller.stylex.ts` here, and the two cases that assert on
 *    *markup* (`width="100%"`, the readonly field) read the `.svelte`.
 * 2. **`declarations()` drops a trailing comma rather than requiring one.**
 *    Upstream filters to lines ending in `,`; this repo's prettier is
 *    configured with **no trailing commas**, so that filter would match
 *    nothing at all and every parity assertion would degrade to
 *    `arrayContaining([])`. The replacement keeps the same crude shape —
 *    nested value objects still contribute their inner lines, harmlessly —
 *    and drops the structural brace lines the comma filter used to exclude.
 */

const dir = path.dirname(fileURLToPath(import.meta.url));
const COMPONENTS = path.join(dir, '..', 'lib', 'components');

const read = (file: string): string => readFileSync(path.join(COMPONENTS, file), 'utf8');

const TOUCH = 'date-input/touch-date-field.stylex.ts';
const TOUCH_MARKUP = 'date-input/touch-date-field.svelte';
const SCROLLER = 'date-input/month-scroller.stylex.ts';
const WHEEL = 'date-input/wheel.stylex.ts';
const TOKENS = 'date-input/tokens.stylex.ts';
const CALENDAR = 'calendar/calendar.stylex.ts';

/**
 * The declarations inside one named style object, comments stripped and
 * trailing commas removed.
 *
 * Crude on purpose — a nested value object contributes its own inner lines
 * too. Every caller looks for a specific property prefix, so the noise is
 * harmless, and a real parser here would be more machinery than the question
 * deserves.
 */
function declarations(source: string, object: string): string[] {
	const open = source.indexOf(`\t${object}: {`);
	expect(open).toBeGreaterThan(-1);
	const rest = source.slice(open);
	// The object's own closing brace is the first line at exactly one tab of
	// indent — nested value objects close deeper. Upstream can look for
	// `'\n  },'` because every one of its objects carries a trailing comma;
	// here the LAST key of a `stylex.create` block has none, so that search
	// would run past the end of the block and swallow the rest of the file.
	// (It did, before this: `dayDisabled` is the last key in two of the three
	// objects these cases read, and both parity checks were passing on a
	// haystack that included the module's exported functions.)
	const close = /\n\t\},?(\r?\n|$)/.exec(rest);
	const body = close == null ? rest : rest.slice(0, close.index);
	return body
		.replace(/\/\/.*$/gm, '')
		.split('\n')
		.map((line) => line.trim())
		.map((line) => (line.endsWith(',') ? line.slice(0, -1) : line))
		.filter((line) => line.length > 0 && !line.endsWith('{') && line !== '}');
}

/** The same, scoped to one `export const <group> = stylex.create({...})`. */
function declarationsIn(source: string, group: string, object: string): string[] {
	const at = source.indexOf(`export const ${group}`);
	expect(at).toBeGreaterThan(-1);
	return declarations(source.slice(at), object);
}

// ---------------------------------------------------------------------------
// Pure month arithmetic
// ---------------------------------------------------------------------------

/** An arbitrary pane size for the pure geometry tests. */
const PANE = 264;

describe('monthGeometry', () => {
	it('round-trips a month through its index', () => {
		for (const [year, month] of [
			[2026, 1],
			[2026, 12],
			[1976, 7],
			[2100, 2]
		] as const) {
			expect(fromMonthIndex(toMonthIndex(year, month))).toEqual({ year, month });
		}
	});

	it('orders months across a year boundary', () => {
		expect(toMonthIndex(2027, 1) - toMonthIndex(2026, 12)).toBe(1);
	});

	it('reads a month index off a PlainDate, ignoring the day', () => {
		expect(monthIndexOf({ year: 2026, month: 3, day: 1 })).toBe(
			monthIndexOf({ year: 2026, month: 3, day: 31 })
		);
	});

	it('clamps to the reachable range', () => {
		expect(clampIndex(5, 10, 20)).toBe(10);
		expect(clampIndex(25, 10, 20)).toBe(20);
		expect(clampIndex(15, 10, 20)).toBe(15);
	});

	describe('rowAtScrollOffset', () => {
		it('maps an exact offset to its row', () => {
			expect(rowAtScrollOffset(0, PANE, 100)).toBe(0);
			expect(rowAtScrollOffset(PANE * 7, PANE, 100)).toBe(7);
		});

		it('rounds to the nearest row mid-scroll', () => {
			expect(rowAtScrollOffset(PANE * 7 + 10, PANE, 100)).toBe(7);
			expect(rowAtScrollOffset(PANE * 7 - 10, PANE, 100)).toBe(7);
			expect(rowAtScrollOffset(PANE * 6.6, PANE, 100)).toBe(7);
		});

		it('never leaves the list', () => {
			expect(rowAtScrollOffset(-500, PANE, 100)).toBe(0);
			expect(rowAtScrollOffset(PANE * 1000, PANE, 100)).toBe(99);
		});

		it('is 0 before the pane size is known, rather than dividing by zero', () => {
			expect(rowAtScrollOffset(1234, 0, 100)).toBe(0);
		});

		it('reads RTL scrollLeft, which counts down from zero', () => {
			// The spec puts the inline start at 0 and runs negative from there, so
			// an unsigned read would pin an RTL calendar to month zero forever.
			expect(rowAtScrollOffset(-PANE * 7, PANE, 100, true)).toBe(7);
			expect(rowAtScrollOffset(-PANE * 7 - 10, PANE, 100, true)).toBe(7);
			expect(rowAtScrollOffset(0, PANE, 100, true)).toBe(0);
		});
	});

	describe('scrollOffsetForRow', () => {
		it('is the inverse of rowAtScrollOffset, in both directions', () => {
			for (const isRTL of [false, true]) {
				for (const row of [0, 1, 7, 99]) {
					const offset = scrollOffsetForRow(row, PANE, isRTL);
					expect(rowAtScrollOffset(offset, PANE, 100, isRTL)).toBe(row);
				}
			}
		});

		it('runs negative under RTL', () => {
			expect(scrollOffsetForRow(3, PANE, false)).toBe(PANE * 3);
			expect(scrollOffsetForRow(3, PANE, true)).toBe(-PANE * 3);
		});
	});

	describe('paneWindow', () => {
		it('mounts the overscan on both sides', () => {
			expect(paneWindow(50, 100, 3)).toEqual({ start: 47, end: 53 });
			expect(rowsIn(paneWindow(50, 100, 1))).toEqual([49, 50, 51]);
		});

		it('truncates at the ends of the list instead of going out of bounds', () => {
			expect(paneWindow(0, 100, 3)).toEqual({ start: 0, end: 3 });
			expect(paneWindow(99, 100, 3)).toEqual({ start: 96, end: 99 });
		});
	});

	it('reaches a century in each direction by default', () => {
		expect(DEFAULT_MONTH_REACH).toBe(600);
	});
});

// ---------------------------------------------------------------------------
// Styles a DOM cannot resolve — assert the definition, not the effect
// ---------------------------------------------------------------------------

describe('DateInput — scroll CSS (definition-level)', () => {
	it('pages the month scroller one whole pane at a time, horizontally', () => {
		const source = read(SCROLLER);
		expect(source).toContain("scrollSnapType: 'x mandatory'");
		expect(source).toContain("scrollSnapAlign: 'start'");
		// pan-x is what splits the gesture by axis: horizontal pans stay with the
		// calendar, vertical ones reach the sheet as swipe-to-dismiss. Without it
		// the two would fight again, the way they did when this scrolled down.
		expect(source).toContain("touchAction: 'pan-x'");
		// The pane and the scrollport must come from the same expression, or a
		// pane stops being exactly one screen and every snap offset drifts.
		expect(source.match(/blockSize: dateInputTouchGeometry\.paneBlockSize/g)).toHaveLength(2);
	});

	it('positions panes with logical properties, so RTL mirrors', () => {
		const source = read(SCROLLER);
		// Scoped to the style objects: `scrollTo({left})` is the DOM API and is
		// supposed to say left — it is the CSS that must stay logical, because
		// physical `left` would lay the months out identically in both directions
		// while the scroll math mirrored, and the two would disagree under RTL.
		// (The DOM call lives in `month-scroller.svelte` here, so it is outside
		// this file entirely; the slice is kept anyway, so the case still fires
		// if a physical property is ever added below the style objects.)
		const styles = source
			.slice(
				source.indexOf('const styles = stylex.create('),
				source.indexOf('export function monthScrollerAttrs')
			)
			// Comments explain the rule ("insetInlineStart, not left") and would
			// otherwise trip it.
			.replace(/\/\/.*$/gm, '');
		expect(styles).toContain('insetInlineStart');
		expect(styles).not.toMatch(/\bleft:/);
		expect(styles).not.toMatch(/\bright:/);
	});

	/**
	 * Adjacent days take the desktop calendar's exact treatment, and the point
	 * of reading BOTH files is that "exact" stays true if the desktop's changes.
	 *
	 * Calendar splits the treatment across two style objects — `dayCellTheme`
	 * carries the colour, `dayCellStyles` the opacity — so copying it by eye
	 * gets you one half and not the other.
	 */
	it('mutes adjacent days exactly as the desktop calendar does', () => {
		// The desktop's two halves, read out of its own source rather than
		// restated here — so the check follows the desktop if its treatment
		// moves, instead of freezing today's values into this file.
		const desktop = read(CALENDAR);
		const structural = declarationsIn(desktop, 'dayCellStyles', 'dayOutside');
		const theme = declarationsIn(desktop, 'dayCellTheme', 'dayOutside');
		// Both halves must have found something, or the parity check below is
		// `arrayContaining([])` and passes on anything at all.
		expect(structural.length).toBeGreaterThan(0);
		expect(theme.length).toBeGreaterThan(0);

		// And the touch pane carries all of it, in its one object.
		const touch = declarations(read(SCROLLER), 'dayOutside');
		expect(touch).toEqual(expect.arrayContaining([...structural, ...theme]));
	});

	/**
	 * Disabled days follow the desktop too, and this is the half that actually
	 * answered "the disabled dates and the adjacent ones look the same".
	 *
	 * The desktop FADES a disabled day rather than recolouring it: `opacity:
	 * 0.3` over whatever colour the day already had.
	 */
	it('fades disabled days as the desktop does, rather than recolouring them', () => {
		const desktop = read(CALENDAR);
		const theme = declarationsIn(desktop, 'dayCellTheme', 'dayDisabled');
		const touch = declarations(read(SCROLLER), 'dayDisabled');

		// Whatever opacity the desktop fades to, this pane fades to the same one.
		const fade = theme.find((d) => d.startsWith('opacity:'));
		expect(fade).toBeDefined();
		expect(touch).toContain(fade);

		// And no colour of its own: a colour would override the secondary one a
		// spilled day carries, collapsing "disabled" and "disabled and adjacent"
		// into a single shade.
		expect(touch.some((d) => d.startsWith('color:'))).toBe(false);
		// Parity, not a rule of this pane's own — if the desktop ever starts
		// recolouring a disabled day, this fires and says to follow it.
		expect(theme.some((d) => d.startsWith('color:'))).toBe(false);
	});

	/**
	 * Order matters as much as the values: `dayDisabled` is applied AFTER
	 * `dayOutside`, so a spilled day beyond min/max paints disabled rather than
	 * merely outside. Reversed, an unselectable date would look more available
	 * than the selectable ones beside it.
	 *
	 * The application site is `monthDayAttrs` in the same module here, where
	 * upstream's is the JSX call site.
	 */
	it('lets disabled win over outside on a spilled day past min/max', () => {
		const applied = read(SCROLLER);
		const outside = applied.indexOf('isOutside && styles.dayOutside');
		const disabled = applied.indexOf('isDisabled && styles.dayDisabled');
		expect(outside).toBeGreaterThan(-1);
		expect(outside).toBeLessThan(disabled);
	});

	it('keeps the month scroller and the wheels on border-box', () => {
		// Load-bearing: clientWidth is the pane size, the snap offsets and the
		// virtualization all at once.
		expect(read(SCROLLER)).toContain("boxSizing: 'border-box'");
		expect(read(WHEEL)).toContain("boxSizing: 'border-box'");
	});

	it('sizes the wheel row tighter than a day cell, with larger text', () => {
		// Scroll-first rows: closer together than day cells and closer to the
		// text they hold, the way a platform picker packs them.
		expect(read(TOKENS)).toContain("wheelItemSize: '28px'");
		expect(read(WHEEL)).toContain("fontSize: typeScaleVars['--text-large-size']");
	});

	it('centers wheel rows and pads both ends so either extreme can reach the band', () => {
		const source = read(WHEEL);
		expect(source).toContain("scrollSnapType: 'y mandatory'");
		expect(source).toContain("scrollSnapAlign: 'center'");
		expect(source).toContain('paddingBlock: dateInputTouchGeometry.wheelEdgePadding');
	});

	it('guards the scroll-driven falloff behind @supports', () => {
		const source = read(WHEEL);
		// Without the guard, a browser that does not understand animation-timeline
		// runs these keyframes once on the document timeline instead.
		expect(source).toContain("'@supports (animation-timeline: view())'");
		expect(source).toContain("animationTimeline: 'view(y)'");
		expect(source).toContain("'@media (prefers-reduced-motion: reduce)'");
	});

	it('keeps the falloff off the snap area itself', () => {
		// A transform moves the snap area, and the wheel then settles a few
		// pixels off the row it is showing.
		const source = read(WHEEL);
		const itemInner = source.slice(source.indexOf('itemInner: {'));
		expect(itemInner).toContain("animationTimeline: 'view(y)'");
		const item = source.slice(source.indexOf('\titem: {'), source.indexOf('itemInner: {'));
		expect(item).not.toContain('animationTimeline');
		expect(item).not.toContain("overflow: 'hidden'");
	});

	it('insets the sheet content equally on every edge', () => {
		const source = read(TOUCH);
		// One inset, and the header/footer must not add their own on top of it —
		// that is what put the title and Done 4px off the day grid's line.
		expect(source).toContain("paddingInline: spacingVars['--spacing-4']");
		expect(source).toContain("paddingBlockEnd: spacingVars['--spacing-4']");
		// The block-start is the documented exception: the grab handle floats out
		// of flow, so the content wrapper owes it the height it occupies.
		expect(source).toContain("paddingBlockStart: spacingVars['--spacing-6']");
		const header = source.slice(source.indexOf('\theader: {'), source.indexOf('\ttitle: {'));
		expect(header).not.toContain('paddingInline');
		const footer = source.slice(source.indexOf('\tfooter: {'), source.indexOf('\tsheetBody: {'));
		expect(footer).not.toContain('paddingInline');
	});

	it('floors the month arrows too — Button tops out at 36px', () => {
		const source = read(TOUCH);
		const arrow = source.slice(
			source.indexOf('\tmonthArrow: {'),
			source.indexOf('\tmonthArrowIcon: {')
		);
		expect(arrow).toContain(
			"minBlockSize: { default: null, '@media (pointer: coarse)': TOUCH_TARGET }"
		);
		expect(arrow).toContain(
			"minInlineSize: { default: null, '@media (pointer: coarse)': TOUCH_TARGET }"
		);
	});

	/**
	 * A bare inline wrapper puts the glyph on the text baseline, a few px above
	 * the button's optical centre. Core's Calendar carries the same rule on its
	 * own nav icons.
	 */
	it('keeps the mirrored arrow glyph centred', () => {
		const source = read(TOUCH);
		const icon = source.slice(source.indexOf('\tmonthArrowIcon: {'));
		expect(icon.slice(0, icon.indexOf('}'))).toContain("display: 'inline-flex'");
	});

	/**
	 * The wheels are a layer that fades in and out on top; the calendar under
	 * them is covered and uncovered, and never seen to move.
	 *
	 * What this pins is that split: the layer above gets opacity and a
	 * background, the layer beneath gets visibility and nothing else.
	 */
	it('fades the wheels in and out over a calendar that does not animate', () => {
		const source = read(TOUCH);
		const overlay = declarations(source, 'panelOverlay');
		const beneath = declarations(source, 'panelBeneath');

		// The layer fades, both directions — the transition is on the shown
		// state, so entering and leaving it both animate.
		expect(overlay).toContain("transitionProperty: 'opacity, visibility'");
		expect(overlay).toContain('transitionDuration: SWAP_DURATION');
		expect(declarations(source, 'panelOverlayHidden')).toContain('opacity: 0');

		// And it is opaque while it does, in the token the sheet paints itself
		// with, so the fade is uniform across the band and the text alike.
		expect(overlay).toContain("backgroundColor: colorVars['--color-background-surface']");

		// The layer beneath moves nothing that can be SEEN moving: visibility
		// only, no opacity, so it is covered and uncovered rather than faded.
		expect(beneath).toContain("transitionProperty: 'visibility'");
		expect(beneath.some((d) => d.startsWith('opacity'))).toBe(false);
		expect(declarations(source, 'panelBeneathHidden').some((d) => d.startsWith('opacity'))).toBe(
			false
		);

		// Two of each, and never the same one twice: the calendar panel and the
		// calendar's footer actions are beneath, the wheels and their Done above.
		const count = (name: string): number =>
			source.match(new RegExp(`styles\\.${name},`, 'g'))?.length ?? 0;
		expect(count('panelBeneath')).toBe(2);
		expect(count('panelOverlay')).toBe(2);
	});

	/**
	 * The layer paints as a unit, which is what makes "opaque" mean "covers".
	 *
	 * Backgrounds and text paint in separate phases, so without a stacking
	 * context a later sibling's background lands UNDER an earlier sibling's
	 * text — the plate went in opaque and the calendar's day numbers showed
	 * straight through it.
	 */
	it('paints the layer as a unit, so the plate really covers', () => {
		expect(declarations(read(TOUCH), 'panelOverlay')).toContain("isolation: 'isolate'");
	});

	/**
	 * The weekday row and the header arrows are the one part of the calendar
	 * the layer cannot cover — the plate starts below the header. They fade on
	 * the layer's own timing rather than clearing instantly.
	 */
	it('fades the uncovered chrome on the same timing as the layer', () => {
		const source = read(TOUCH);
		for (const name of ['weekdays', 'monthArrows']) {
			expect(declarations(source, name)).toContain('transitionDuration: SWAP_DURATION');
			expect(declarations(source, `${name}Hidden`)).toContain('opacity: 0');
		}
	});

	/**
	 * The footer action spans the sheet. A full-width primary is the shape a
	 * phone form ends with, and it puts the target under the thumb wherever the
	 * hand is. Read from the markup, which is where the props live.
	 */
	it('spans the footer with its action', () => {
		const source = read(TOUCH_MARKUP);
		// One per surface: Save on the calendar, Done on the wheels.
		expect(source.match(/width="100%"/g)).toHaveLength(2);
	});

	/**
	 * The selection band has to be visible enough that fading it reads as a
	 * fade. `--color-background-muted` (4.7% alpha) put the whole plate 17 units
	 * of colour from the sheet behind it; `--color-neutral` (10%) doubles that
	 * to 36 and is still quiet enough to sit under text.
	 */
	it('gives the wheel band enough contrast for its fade to read', () => {
		const source = read(WHEEL);
		const band = source.slice(
			source.indexOf('\tband: {'),
			source.indexOf('});', source.indexOf('\tband: {'))
		);
		expect(band).toContain("backgroundColor: colorVars['--color-neutral']");
	});

	/**
	 * `--ease-standard` is `cubic-bezier(0.24, 1, 0.4, 1)`: right for something
	 * travelling a distance, wrong for a fade. The title chevron is the
	 * exception and keeps the token: it rotates, and rotation is travel.
	 */
	it('fades linearly, and eases only the thing that travels', () => {
		const source = read(TOUCH);
		const styles = source.slice(source.indexOf('const styles = stylex.create('));
		const chevron = styles.slice(
			styles.indexOf('\ttitleChevron: {'),
			styles.indexOf('\ttitleChevronOpen: {')
		);
		expect(chevron).toContain("transitionProperty: 'transform'");
		expect(chevron).toContain("transitionTimingFunction: easeVars['--ease-standard']");
		// The chevron is the only eased transition; every fade is linear.
		expect(styles.match(/transitionTimingFunction: easeVars\['--ease-standard'\]/g)).toHaveLength(
			1
		);
		expect(styles.match(/transitionTimingFunction: 'linear'/g)).toHaveLength(4);
	});

	/**
	 * Everything in the swap runs for the same time, so it reads as one change
	 * rather than several — the chevron included. A token rather than a literal,
	 * so a consumer's motion scale carries.
	 */
	it('runs the whole swap on one duration', () => {
		const source = read(TOUCH);
		const styles = source.slice(source.indexOf('const styles = stylex.create('));
		// The arrows, Reset, the weekday row, the layer beneath, the layer above,
		// and the chevron.
		expect(styles.match(/transitionDuration: SWAP_DURATION/g)).toHaveLength(6);
		// And no leftover hand-rolled timing beside them.
		expect(styles).not.toContain('PANEL_FADE_MS');
		expect(source).toContain("const SWAP_DURATION = durationVars['--duration-fast']");
	});

	it('keeps the virtual keyboard down on the touch field', () => {
		// Svelte's lowercase attribute names, for React's `readOnly` /
		// `inputMode="none"`. readonly alone still opens the keyboard on some
		// Android browsers, which is why both are here.
		const source = read(TOUCH_MARKUP);
		expect(source).toContain('readonly');
		expect(source).toContain('inputmode="none"');
	});
});
