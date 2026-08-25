import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Ported from Astryx's `reset.test.ts` — **2 of its 3 cases at the 0.5.0 pin**.
 *
 * Unported: `reset.css accessibility invariants` → `gives disabled elements the
 * disabled cursor`, which 0.5.0 added. It is portable and would pass —
 * `styles/base.css` already carries the `:where(:disabled, [aria-disabled='true'])
 * { cursor: default; }` rule the case looks for — so this is coverage debt, not
 * a translation decision. (The header read "both cases" against a file that had
 * grown a third.)
 *
 * Upstream's reset is a plain stylesheet, so its tests assert on the source
 * text; this port's counterpart is `styles/base.css`, which it owns in full
 * (upstream's reset is one of its inputs, not the file itself), so the same
 * approach applies to the same text.
 *
 * The file is read relative to this module rather than `__dirname`, which does
 * not exist under ESM, and it reaches across into `src/lib` — tests live outside
 * `src/lib` here so `svelte-package` can never ship them, and a stylesheet has
 * no `$lib` import form to reach it by.
 */

const BASE_CSS = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'../lib/styles/base.css'
);

describe('base.css accessibility invariants', () => {
	let ruleBlocks: { selector: string; body: string }[];

	beforeAll(() => {
		const css = fs.readFileSync(BASE_CSS, 'utf-8');
		// Strip comments, then collect every innermost `selector { body }` block.
		// `[^{}]` keeps at-rule preludes (@media, @layer) out of the selector
		// capture, since their own `{` terminates any earlier match.
		const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
		ruleBlocks = [...stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
			selector: selector.trim(),
			body
		}));
	});

	it('parses rule blocks out of base.css', () => {
		// Guards the WCAG assertion below against silently passing if the block
		// parsing ever breaks.
		expect(ruleBlocks.length).toBeGreaterThan(20);
		expect(ruleBlocks.some(({ body }) => body.includes('box-sizing: border-box'))).toBe(true);
	});

	/**
	 * WCAG 2.4.7 (Focus Visible, Level AA): keyboard focus indicators must not be
	 * suppressed. `:focus-visible` only matches keyboard-style focus, so any
	 * `outline: none` on it removes the focus indicator for keyboard users — and a
	 * `@media (hover: none) and (pointer: coarse)` guard does not exempt keyboard
	 * users on coarse-pointer devices (iPad/phone with a Bluetooth keyboard,
	 * switch-control users).
	 */
	it('does not suppress :focus-visible outlines (WCAG 2.4.7)', () => {
		const suppressing = ruleBlocks
			.filter(({ selector }) => selector.includes(':focus-visible'))
			.filter(({ body }) => /outline(?:-style|-width)?\s*:\s*(?:none|0)/.test(body))
			.map(({ selector }) => selector);

		// Upstream asserts this per matching block with `expect.soft`, which makes
		// no assertion at all when nothing matches — and nothing does, now that the
		// coarse-pointer suppression is gone. That reads as a pass upstream and
		// fails here, because this package sets `expect.requireAssertions`. Naming
		// the offenders instead keeps the diagnosis (the failure message lists the
		// selector) while asserting unconditionally, so the case cannot go vacuous
		// if the last `:focus-visible` rule is ever deleted.
		expect(suppressing, 'these ":focus-visible" rules must keep the outline').toEqual([]);
	});
});
