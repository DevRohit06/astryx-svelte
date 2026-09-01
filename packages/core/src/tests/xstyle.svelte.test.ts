/** NO-UPSTREAM: coverage beyond upstream — the header below says why. */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Badge from '$lib/components/badge/badge.svelte';
import { probe } from './fixtures/xstyle-probe.stylex.js';

/**
 * `xstyle` — the repo-wide StyleX override prop, wired into every component's
 * root `sx()` call as its final argument.
 *
 * There is no upstream suite for this: `xstyle` is `stylex.props`' last argument
 * in React, and its behaviour is StyleX's, not a component's. What is worth
 * pinning is the port's own decision — that `xstyle` threads *into* the same
 * `sx()` call as the component's styles rather than being appended as a separate
 * class list. Those differ exactly on a property collision: threaded, StyleX's
 * atomic dedup keeps only the last writer, so an overriding `xstyle` *swaps* the
 * component's class; appended, both classes survive and CSS source order — not
 * argument order — decides the winner. The two cases below tell them apart
 * without hard-coding any atomic hash.
 *
 * `Badge` is the probe: a single-root leaf whose `base` sets `paddingInline`.
 */

/** Atomic StyleX classes only — `x…`, excluding dev debug names (`a.b`) and theme classes (`astryx-…`). */
function atomics(el: Element): string[] {
	return Array.from(el.classList).filter((c) => /^x[a-z0-9]+$/.test(c));
}

describe('xstyle', () => {
	it('swaps the component class when it overrides a property the component sets', async () => {
		const plain = (await render(Badge, { props: { label: 'A' } }))
			.getByText('A', { exact: true })
			.element();
		const base = atomics(plain);

		const overridden = (
			await render(Badge, { props: { label: 'B', xstyle: probe.overridePadding } })
		)
			.getByText('B', { exact: true })
			.element();
		const withOverride = atomics(overridden);

		// Same count — the padding class was replaced, not added. An append would
		// leave both `paddingInline` classes and make this `base.length + 1`.
		expect(withOverride.length).toBe(base.length);
		// And the swap is real: exactly one class left, one arrived.
		const removed = base.filter((c) => !withOverride.includes(c));
		const added = withOverride.filter((c) => !base.includes(c));
		expect(removed).toHaveLength(1);
		expect(added).toHaveLength(1);
	});

	it('adds a class when it sets a property the component does not', async () => {
		const plain = (await render(Badge, { props: { label: 'C' } }))
			.getByText('C', { exact: true })
			.element();
		const base = atomics(plain);

		const extended = (await render(Badge, { props: { label: 'D', xstyle: probe.novelMargin } }))
			.getByText('D', { exact: true })
			.element();

		// A non-colliding override adds exactly one class — nothing to dedup.
		expect(atomics(extended).length).toBe(base.length + 1);
	});
});
