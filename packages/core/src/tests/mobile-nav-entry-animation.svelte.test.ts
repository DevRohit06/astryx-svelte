import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MobileNavProbe from './fixtures/mobile-nav-probe.svelte';
// Upstream reads the style source with `fs` + `__dirname`; the browser project
// has neither, and Vite's `?raw` hands over the same bytes. The precedent is
// `aspect-ratio.svelte.test.ts` and `input-clear-button.svelte.test.ts`.
import mobileNavStyleSource from '$lib/components/mobile-nav/mobile-nav.stylex.ts?raw';

/**
 * Ported from Astryx's `MobileNav/MobileNavEntryAnimation.test.tsx`, all **5**
 * test declarations at the 0.5.0 pin — 8 collected cases, because the last
 * three run twice through a `describe.each` over the two drawer edges. Nothing
 * is dropped.
 *
 * The drawer used to open with no animation at all while closing smoothly.
 *
 * The dialog is `display: none` until `isOpen`, so nothing inside it is
 * rendered while closed. The open `display` and the open `transform` are
 * committed in the same pass, which means the first frame the drawer is ever
 * rendered in already holds the open transform: a transition has no earlier
 * value to run from and the drawer simply appears. Closing looked fine because
 * both values exist by then — `display` stays in the transition with
 * `allow-discrete`, so the element is still rendered as the transform animates
 * out.
 *
 * `@starting-style` supplies that before-change style — the off-screen
 * transform for the drawer, transparent for the `::backdrop`.
 *
 * That alone is NOT enough, and the second half is the part that is easy to
 * undo by accident. The dialog used `overflow: hidden`, which makes it a SCROLL
 * CONTAINER. A scroll container in the top layer whose subtree holds another
 * scroller — here the drawer's own content area — does not paint a
 * `@starting-style` entry transition for its descendants in Chromium: the
 * transition ticks in the CSSOM (`getComputedStyle` interpolates perfectly)
 * while every painted frame shows the end value. Measuring the CSSOM says
 * "animating"; the screen says "snapped". `overflow: clip` clips the off-screen
 * drawer exactly as `hidden` did without creating a scroll container, and the
 * slide-in paints.
 *
 * ## Note on scope — and on why it is not weaker here
 *
 * Upstream's note says jsdom has no top layer, no transitions, no
 * `@starting-style` evaluation and no compositor, so none of this is observable
 * there; its five cases pin the three declarations the behaviour rests on
 * instead. This port runs in a real Chromium, which has all four — but the
 * failure mode is precisely one that *cannot* be observed from script: the
 * CSSOM interpolates correctly in both the broken and the fixed state, and only
 * painted frames tell them apart. So the declarations are still the thing to
 * assert, and these are upstream's assertions unchanged.
 *
 * ## Translations
 *
 * - Upstream reads its style definitions out of `MobileNav.tsx` with the
 *   TypeScript compiler API (`ts.createSourceFile`, then an AST visit for the
 *   `styles.<name>` property assignment). Here the styles live in
 *   `mobile-nav.stylex.ts` — StyleX may not be imported from a `.svelte` file —
 *   and the browser project has no `node:fs`. `?raw` supplies the same bytes,
 *   and `styleDefinition`/`property` below are a small brace-matching scanner
 *   standing in for the AST visit: pulling the TypeScript compiler into a
 *   browser bundle to read four property values is not a trade worth making.
 *   Comments are stripped first so a brace inside one cannot throw the match.
 * - The `::backdrop` case reads `document.styleSheets` off the compiled sheet
 *   `setup-stylex.ts` puts on the page, where upstream reads it off StyleX's
 *   runtime injection. That sheet is emitted with `useCSSLayers`, so its rules
 *   sit inside `@layer` blocks and the walk has to descend where upstream's
 *   single top-level pass did not — the rules it finds are the same rules.
 * - `render` is the probe fixture rather than inline JSX, and `data-testid`
 *   rides in through `navProps`; the drawer is open, so the testid engine can
 *   reach it. A *closed* drawer is `display: none`, which is why the sibling
 *   suites read closed drawers out of the container instead.
 */

/**
 * Every **distinct** `@starting-style` rule the page carries, as text —
 * flattened out of the `@layer` wrappers the compiled sheet nests them in.
 *
 * Distinct, because the compiled sheet is on a test page **twice**: Vite's dev
 * server injects it for the module graph `setup-stylex.ts` pulls in, and the
 * setup file then appends its own `<style>` so the sheet is complete no matter
 * which suite is running. Both carry the same rule, byte for byte, so upstream's
 * `toHaveLength(1)` would read 2 for a reason that is about the harness and not
 * about the styles. De-duplicating keeps the assertion the one upstream makes —
 * *exactly one such declaration exists* — rather than loosening it to
 * `toBeGreaterThan(0)`, which would still pass with a second, contradictory
 * starting style in the sheet.
 */
function startingStyleRules(): string[] {
	const walk = (rules: CSSRuleList): string[] =>
		Array.from(rules).flatMap((rule): string[] => {
			if (rule.cssText.startsWith('@starting-style')) {
				return [rule.cssText];
			}
			const nested = (rule as CSSGroupingRule).cssRules;
			return nested == null ? [] : walk(nested);
		});

	const all = Array.from(document.styleSheets).flatMap((sheet) => {
		try {
			return walk(sheet.cssRules);
		} catch {
			// cross-origin sheet
			return [];
		}
	});

	return Array.from(new Set(all));
}

describe('MobileNav scrim fades in', () => {
	it('gives the ::backdrop a transparent starting style', async () => {
		const screen = await render(MobileNavProbe, {
			props: {
				navProps: { isOpen: true, onOpenChange: () => {}, 'data-testid': 'mobile-nav' },
				text: 'Nav content'
			}
		});

		const classes = Array.from(screen.getByTestId('mobile-nav').element().classList);
		// Without this the scrim is opaque in the frame the dialog enters the top
		// layer, so it has nothing to fade from and snaps in behind the drawer.
		const startingStyleForThisDialog = startingStyleRules().filter(
			(rule) => rule.includes('::backdrop') && classes.some((cls) => rule.includes(`.${cls}`))
		);

		expect(startingStyleForThisDialog).toHaveLength(1);
		expect(startingStyleForThisDialog[0]).toMatch(/opacity:\s*0/);
	});
});

// =============================================================================
// Drawer slide-in — asserted on the style definition
// =============================================================================

/** The style module's source with comments removed. See the header. */
function stripComments(input: string): string {
	let out = '';
	let quote: string | null = null;
	for (let i = 0; i < input.length; i += 1) {
		const ch = input[i];
		if (quote !== null) {
			out += ch;
			if (ch === '\\') {
				out += input[i + 1] ?? '';
				i += 1;
			} else if (ch === quote) {
				quote = null;
			}
			continue;
		}
		if (ch === "'" || ch === '"' || ch === '`') {
			quote = ch;
			out += ch;
			continue;
		}
		if (ch === '/' && input[i + 1] === '/') {
			while (i < input.length && input[i] !== '\n') {
				i += 1;
			}
			out += '\n';
			continue;
		}
		if (ch === '/' && input[i + 1] === '*') {
			i += 2;
			while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) {
				i += 1;
			}
			i += 1;
			continue;
		}
		out += ch;
	}
	return out;
}

const SOURCE = stripComments(mobileNavStyleSource);

/**
 * The source text a value spans, starting at `start` and ending at the first
 * `,` or newline that is not inside a nested brace, bracket, paren or string.
 */
function readValue(text: string, start: number): string {
	let depth = 0;
	let quote: string | null = null;
	for (let i = start; i < text.length; i += 1) {
		const ch = text[i];
		if (quote !== null) {
			if (ch === '\\') {
				i += 1;
			} else if (ch === quote) {
				quote = null;
			}
			continue;
		}
		if (ch === "'" || ch === '"' || ch === '`') {
			quote = ch;
		} else if (ch === '{' || ch === '[' || ch === '(') {
			depth += 1;
		} else if (ch === '}' || ch === ']' || ch === ')') {
			if (depth === 0) {
				return text.slice(start, i).trim();
			}
			depth -= 1;
		} else if ((ch === ',' || ch === '\n') && depth === 0) {
			return text.slice(start, i).trim();
		}
	}
	return text.slice(start).trim();
}

/**
 * The object literal a `styles.<name>` key is defined with, e.g. the value of
 * `drawerStartOpen` inside the module's `stylex.create({…})` call.
 */
function styleDefinition(name: string): string {
	const match = new RegExp(`(?:^|\\n)\\t${name}:\\s*\\{`).exec(SOURCE);
	if (match === null) {
		throw new Error(`No style named "${name}" in mobile-nav.stylex.ts`);
	}
	return readValue(SOURCE, SOURCE.indexOf('{', match.index));
}

/** The value of one property of a style definition, as source text. */
function property(style: string, key: string): string {
	const match = new RegExp(`\\n\\t\\t'?${key}'?:\\s*`).exec(style);
	if (match === null) {
		throw new Error(`No "${key}" in ${style.slice(0, 40)}…`);
	}
	return readValue(style, match.index + match[0].length);
}

describe('MobileNav dialog does not become a scroll container', () => {
	it('clips the off-screen drawer with `clip`, not `hidden`', () => {
		// This is the half of the fix with no visible declaration of its own
		// purpose: `hidden` looks like a pure clipping choice and clips exactly as
		// well, so it is an easy "harmless tidy-up" to make. It is not harmless —
		// it makes the dialog a scroll container, and the entry animation then
		// ticks in the CSSOM without ever painting. See the file header.
		expect(property(styleDefinition('dialog'), 'overflow')).toBe("'clip'");
	});
});

describe.each([
	{
		name: 'drawerStartOpen',
		offscreen: 'translateX(-100%)',
		offscreenRtl: 'translateX(100%)'
	},
	{
		name: 'drawerEndOpen',
		offscreen: 'translateX(100%)',
		offscreenRtl: 'translateX(-100%)'
	}
])('MobileNav drawer slides in ($name)', ({ name, offscreen, offscreenRtl }) => {
	it('opens to the on-screen transform', () => {
		expect(property(styleDefinition(name), 'transform')).toContain('translateX(0)');
	});

	it('starts off-screen so the open transform has something to run from', () => {
		const transform = property(styleDefinition(name), 'transform');

		// The whole point: the first rendered frame needs the closed transform.
		// Drop this and the drawer is simply there, fully open, on frame one —
		// while the close still animates, which is what made the bug look like a
		// missing entry animation rather than a missing starting style.
		expect(transform).toContain('@starting-style');
		expect(transform).toContain(offscreen);
		// Mirrored, like the closed styles it has to match: sliding in from the
		// wrong edge in RTL is as broken as not sliding at all.
		expect(transform).toContain(offscreenRtl);
	});

	it('starts from the same edge the closed style parks it at', () => {
		const closed = property(styleDefinition(name.replace('Open', '')), 'transform');

		expect(closed).toContain(offscreen);
		expect(closed).toContain(offscreenRtl);
	});
});
