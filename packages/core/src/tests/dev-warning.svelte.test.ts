/** PORTS: hooks/useDevWarning.test.tsx */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Probe from './fixtures/dev-warning-probe.svelte';

/**
 * Upstream's `hooks/useDevWarning.test.tsx`, ported case for case — all 3.
 *
 * The hook warns from an effect, so it needs a real component lifecycle and
 * lives in the browser project; `renderHook` becomes the probe fixture and
 * `rerender` maps straight across (`vitest-browser-svelte`'s is async).
 *
 * Upstream's first case re-renders three times to prove the once-per-mount
 * latch. A Svelte `$effect` only re-runs when a tracked read changes, so the
 * repeats also prove the latch survives the *reruns that do happen* — the
 * condition getter is read each time.
 */

afterEach(() => {
	vi.restoreAllMocks();
});

describe('useDevWarning', () => {
	it('warns once, in the standardized format, when the condition is true', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const screen = await render(Probe, { props: { condition: true } });
		await screen.rerender({ condition: true });
		await screen.rerender({ condition: true });
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn).toHaveBeenCalledWith('TestComponent: boom');
	});

	it('does not warn when the condition is false', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await render(Probe, { props: { condition: false } });
		expect(warn).not.toHaveBeenCalled();
	});

	it('warns after the condition flips from false to true', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const screen = await render(Probe, { props: { condition: false } });
		expect(warn).not.toHaveBeenCalled();
		await screen.rerender({ condition: true });
		expect(warn).toHaveBeenCalledTimes(1);
	});
});
