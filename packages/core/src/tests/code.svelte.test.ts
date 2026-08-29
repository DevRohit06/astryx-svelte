import { describe, expect, it, vi } from 'vitest';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import Code from '$lib/components/code/code.svelte';
import TextChildProbe from './fixtures/text-child-probe.svelte';

/**
 * Astryx's `Code/Code.test.tsx` at the **0.5.0** pin, ported case for case.
 *
 * The count is the contract: upstream declares **6** `it` blocks at this pin,
 * and **6** are here. **Nothing is dropped.** Upstream has no `displayName`
 * case, no snapshot and no no-JSX construction form.
 *
 * `port/debts.md` records `Code` under an upstream-lag entry ("`Spinner`, `Kbd`
 * and `Code` document less than their source ships"). That is about upstream's
 * `.doc.mjs` prose omitting `color`/`size`, not about behaviour — `Code.tsx`
 * ships both props and the four cases below are upstream's own. It is not a
 * reason to drop anything.
 *
 * Two things are restated, and neither is a dropped case:
 *
 * - **`forwards ref to the root element` is the attachment counterpart.** Svelte
 *   has no `ref` prop; `Code` rest-spreads onto its root `<code>`, so an
 *   attachment in the rest props reaches the element upstream's `ref` receives.
 *   It checks more than upstream's does, since it also pins *which* element.
 * - **`children` is a snippet**, so `text-child-probe.svelte` supplies it. The
 *   probe puts the text directly on the `<code>` rather than wrapping it in a
 *   `<span>` (which `slot-probe.svelte` would): every case here queries *by that
 *   text* and then asserts on the element it found, so a wrapper would make
 *   `getByText('code')` return the span and `tagName` read `SPAN`. With the bare
 *   text child, upstream's assertions carry over unchanged.
 */

/** `Code` behind the probe, holding `text`, with the case's own props. */
const code = (text: string, rest: Record<string | symbol, unknown> = {}) => ({
	component: Code,
	text,
	rest
});

describe('Code', () => {
	it('renders children inside a <code> element', async () => {
		const screen = await render(TextChildProbe, { props: code('const x = 1') });
		const el = screen.getByText('const x = 1', { exact: true });
		expect(el.element().tagName).toBe('CODE');
	});

	it('forwards ref to the root element', async () => {
		// The attachment counterpart to upstream's `ref` — see the header.
		const ref = vi.fn();
		const screen = await render(TextChildProbe, {
			props: code('code', { [createAttachmentKey()]: (node: Element) => ref(node) })
		});
		expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
		expect(ref).toHaveBeenCalledWith(screen.container.firstElementChild);
	});

	it('defaults color to primary', async () => {
		const screen = await render(TextChildProbe, { props: code('code') });
		expect(screen.getByText('code', { exact: true }).element()).toHaveClass(
			'astryx-code',
			'primary'
		);
	});

	it('applies the secondary color', async () => {
		const screen = await render(TextChildProbe, {
			props: code('code', { color: 'secondary' })
		});
		expect(screen.getByText('code', { exact: true }).element()).toHaveClass(
			'astryx-code',
			'secondary'
		);
	});

	it('applies the inherit color', async () => {
		const screen = await render(TextChildProbe, { props: code('code', { color: 'inherit' }) });
		expect(screen.getByText('code', { exact: true }).element()).toHaveClass(
			'astryx-code',
			'inherit'
		);
	});

	it('adds a size class when size="inherit" (font-size + line-height inherit)', async () => {
		const screen = await render(TextChildProbe, { props: code('code') });
		const defaultClass = screen.getByText('code', { exact: true }).element().getAttribute('class');

		await screen.rerender({ rest: { size: 'inherit' } });
		const inheritClass = screen.getByText('code', { exact: true }).element().getAttribute('class');

		// size="inherit" adds an extra StyleX class beyond the default rendering.
		expect(inheritClass).not.toEqual(defaultClass);
	});
});
