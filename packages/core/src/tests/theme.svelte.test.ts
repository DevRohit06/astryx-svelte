/** PORTS: theme/Theme.test.tsx */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { defineTheme } from '$lib/theme/define-theme.js';
import ThemeProbe from './fixtures/theme-probe.svelte';
import NestedThemeProbe from './fixtures/theme-nested-probe.svelte';

/**
 * Ported from Astryx's `theme/Theme.test.tsx` — all 11 of its `it` cases at the
 * 0.5.0 pin, nothing dropped.
 *
 * Client (Chromium) project: every case reads or writes
 * `document.documentElement`, and the unmount cases depend on real effect
 * teardown.
 *
 * Two translations, neither a case. `(await render(...)).unmount()` stands in
 * for RTL's `unmount()`. And the root sync runs in an `$effect.pre`, so the
 * assertions that follow a render are awaited through `expect.poll` rather than
 * read straight after — React's layout effect has flushed by the time `render`
 * returns, a Svelte effect has not.
 */

const testTheme = defineTheme({
	name: 'test',
	tokens: {
		'--color-accent': ['#AA0000', '#FF5555']
	}
});

const altTheme = defineTheme({
	name: 'alt',
	tokens: {
		'--color-accent': ['#00AA00', '#55FF55']
	}
});

function rootAttr(name: string): string | null {
	return document.documentElement.getAttribute(name);
}

describe('Theme', () => {
	beforeEach(() => {
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.removeAttribute('data-astryx-theme');
	});

	afterEach(() => {
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.removeAttribute('data-astryx-theme');
	});

	it('renders children', async () => {
		const screen = await render(ThemeProbe, { theme: testTheme });
		await expect.element(screen.getByText('hello', { exact: true })).toBeInTheDocument();
	});

	it('sets data-astryx-theme on wrapper div', async () => {
		const { container } = await render(ThemeProbe, { theme: testTheme });
		expect(container.querySelector('[data-astryx-theme="test"]')).toBeTruthy();
	});

	// =========================================================================
	// Root detection — data-theme on <html>
	// =========================================================================

	it('syncs data-theme to <html> for root provider in dark mode', async () => {
		await render(ThemeProbe, { theme: testTheme, mode: 'dark' });
		await expect.poll(() => rootAttr('data-theme')).toBe('dark');
	});

	it('syncs data-theme to <html> for root provider in light mode', async () => {
		await render(ThemeProbe, { theme: testTheme, mode: 'light' });
		await expect.poll(() => rootAttr('data-theme')).toBe('light');
	});

	it('removes data-theme from <html> for root provider in system mode', async () => {
		document.documentElement.setAttribute('data-theme', 'dark');
		await render(ThemeProbe, { theme: testTheme, mode: 'system' });
		await expect.poll(() => document.documentElement.hasAttribute('data-theme')).toBe(false);
	});

	it('removes data-theme from <html> when root provider unmounts', async () => {
		const screen = await render(ThemeProbe, { theme: testTheme, mode: 'dark' });
		await expect.poll(() => rootAttr('data-theme')).toBe('dark');
		await screen.unmount();
		await expect.poll(() => document.documentElement.hasAttribute('data-theme')).toBe(false);
	});

	// =========================================================================
	// Root detection — data-astryx-theme on <html>
	// =========================================================================

	it('syncs data-astryx-theme to <html> for root provider', async () => {
		await render(ThemeProbe, { theme: testTheme, mode: 'light' });
		await expect.poll(() => rootAttr('data-astryx-theme')).toBe('test');
	});

	it('removes data-astryx-theme from <html> when root provider unmounts', async () => {
		const screen = await render(ThemeProbe, { theme: testTheme, mode: 'light' });
		await expect.poll(() => rootAttr('data-astryx-theme')).toBe('test');
		await screen.unmount();
		await expect.poll(() => document.documentElement.hasAttribute('data-astryx-theme')).toBe(false);
	});

	// =========================================================================
	// Nested themes — should NOT sync to <html>
	// =========================================================================

	it('does not let nested Theme override <html> data-astryx-theme', async () => {
		await render(NestedThemeProbe, {
			theme: testTheme,
			mode: 'dark',
			innerTheme: altTheme,
			innerMode: 'light'
		});
		// Root is "test" — nested "alt" must not override.
		await expect.poll(() => rootAttr('data-astryx-theme')).toBe('test');
	});

	it('does not let nested Theme override <html> data-theme', async () => {
		await render(NestedThemeProbe, {
			theme: testTheme,
			mode: 'dark',
			innerTheme: altTheme,
			innerMode: 'light'
		});
		// Root is dark — nested light must not override.
		await expect.poll(() => rootAttr('data-theme')).toBe('dark');
	});

	it('nested Theme still sets data-theme on its own wrapper div', async () => {
		const { container } = await render(NestedThemeProbe, {
			theme: testTheme,
			mode: 'dark',
			innerTheme: altTheme,
			innerMode: 'light'
		});
		const nestedWrapper = container.querySelector('[data-astryx-theme="alt"]');
		expect(nestedWrapper).toBeTruthy();
		expect(nestedWrapper?.getAttribute('data-theme')).toBe('light');
	});
});
