import { expect } from 'vitest';
import { focusOutlineProps } from '$lib/utils/focus-outline.stylex.js';

/**
 * Upstream's `expectSharedFocusRing`, shared here rather than redeclared per
 * suite because three suites assert it.
 *
 * `focusOutlineProps.focusVisible()` is this port's `stylex.props(...)` adapter,
 * so its `class` is the same atomic class list upstream splits off
 * `stylex.props(focusOutlineStyles.focusVisible).className`. The assertion is
 * that the element carries every one of them — a real check, not a tautology:
 * an element wired with a bare `sx(...)` instead of the focus-visible composer
 * carries none of them.
 */
export function expectSharedFocusRing(el: Element): void {
	const expected = (focusOutlineProps.focusVisible().class ?? '').split(' ').filter(Boolean);
	expect(expected.length).toBeGreaterThan(0);
	const classes = el.className.split(' ');
	for (const c of expected) {
		expect(classes).toContain(c);
	}
}

/**
 * The negative of `expectSharedFocusRing`. Upstream's, and load-bearing in the
 * split-action case: a row holding two independent tab stops must not be ringed
 * itself, or focusing either one paints a second outline around the whole row.
 */
export function expectNoSharedFocusRing(el: Element): void {
	const expected = (focusOutlineProps.focusVisible().class ?? '').split(' ').filter(Boolean);
	expect(expected.length).toBeGreaterThan(0);
	const classes = el.className.split(' ');
	for (const c of expected) {
		expect(classes).not.toContain(c);
	}
}
