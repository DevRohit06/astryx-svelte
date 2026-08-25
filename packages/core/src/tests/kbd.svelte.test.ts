import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Kbd from '$lib/components/kbd/kbd.svelte';

/**
 * Astryx's `Kbd/Kbd.test.tsx` at the **0.5.0** pin, ported case for case.
 *
 * The count is the contract: upstream declares **16** `it` blocks at this pin,
 * and **16** are here. **Nothing is dropped.** The sixteenth arrived at 0.5.0
 * with the blank-`userAgentData.platform` guard, and it is a regression case
 * with teeth here: this port read a blank platform as "not Apple" rather than
 * falling through to `navigator.platform`, so `mod` rendered Ctrl on a Mac whose
 * build rewrites its client-hints identity. `kbd-keys.ts` and
 * `hooks/use-hotkeys.svelte.ts` both carried the defect and both are fixed. Upstream's suite carries no
 * `displayName` case, no snapshot, no `ref` case and no no-JSX construction
 * form, so none of this port's standing drops applies — every case is upstream's
 * title with upstream's assertions.
 *
 * Three things are restated, and none of them is a dropped case:
 *
 * - **The platform is spoofed rather than assumed.** Upstream's file header
 *   leans on its environment — "tests run in jsdom which reports a non-Mac
 *   platform, so `mod` resolves to Ctrl". Real Chromium reports the *host*
 *   machine, so that premise is made explicit here: every case starts on a
 *   spoofed non-Mac platform and the two Mac cases spoof `MacIntel` exactly
 *   where upstream does. The spoof also has to neutralise
 *   `navigator.userAgentData`, which jsdom does not implement and Chromium does:
 *   `detectMac` prefers User-Agent Client Hints over the deprecated
 *   `navigator.platform` upstream overrides, so without that the two Mac cases
 *   would report the machine and not the spoof. Upstream's `afterEach` restore
 *   is kept verbatim, with the client-hints shadow removed alongside it.
 * - **`container.firstChild` → `container.firstElementChild`.** Svelte's client
 *   renderer emits an anchor comment ahead of a component's markup, so
 *   `firstChild` is a `Comment` and carries no `className`. `firstElementChild`
 *   is the node upstream's `firstChild` denotes.
 * - **The platform lands after mount.** `useSyncExternalStore` with a `false`
 *   server snapshot becomes `$state(false)` plus an `$effect`, for the same
 *   hydration reason upstream gives, so the two Mac cases assert through
 *   `expect.element`, which retries until the effect has run. What is asserted
 *   is unchanged.
 */

const originalPlatform = navigator.platform;

/**
 * Upstream's `Object.defineProperty(navigator, 'platform', …)`, plus the
 * client-hints shadow the browser project needs — see the header.
 */
function spoofPlatform(platform: string): void {
	Object.defineProperty(navigator, 'userAgentData', {
		value: undefined,
		configurable: true
	});
	Object.defineProperty(navigator, 'platform', {
		value: platform,
		configurable: true
	});
}

describe('Kbd', () => {
	beforeEach(() => {
		// jsdom's implicit non-Mac platform, stated.
		spoofPlatform('Win32');
	});

	afterEach(() => {
		// Restore platform after any test that spoofs it — ensures no
		// test pollution even if an assertion fails mid-test.
		Object.defineProperty(navigator, 'platform', {
			value: originalPlatform,
			configurable: true
		});
		// Drop the own property so the real `userAgentData` getter is reachable again.
		Reflect.deleteProperty(navigator, 'userAgentData');
	});

	it('renders a single key', async () => {
		const screen = await render(Kbd, { props: { keys: 'k' } });
		const kbd = screen.getByText('K', { exact: true });
		expect(kbd.element().tagName).toBe('KBD');
	});

	it('renders multiple keys separated by +', async () => {
		const screen = await render(Kbd, { props: { keys: 'mod+k' } });
		// On a non-Mac platform, mod renders as "Ctrl"
		await expect.element(screen.getByText('Ctrl', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('K', { exact: true })).toBeInTheDocument();
	});

	it('renders mod as Ctrl on non-Mac platforms', async () => {
		const screen = await render(Kbd, { props: { keys: 'mod' } });
		await expect.element(screen.getByText('Ctrl', { exact: true })).toBeInTheDocument();
	});

	it('renders mod as ⌘ on Mac platforms', async () => {
		spoofPlatform('MacIntel');

		const screen = await render(Kbd, { props: { keys: 'mod' } });
		await expect.element(screen.getByText('⌘', { exact: true })).toBeInTheDocument(); // ⌘
	});

	it('reads a blank userAgentData.platform as unknown, not as non-Mac', async () => {
		// Builds that rewrite their client-hints identity expose the key with an
		// empty value; navigator.platform is the only surface left that answers.
		// Deliberately NOT `spoofPlatform`, which blanks `userAgentData` entirely —
		// the point of this case is that the key is present and empty.
		Object.defineProperty(navigator, 'userAgentData', {
			value: { platform: '' },
			configurable: true
		});
		Object.defineProperty(navigator, 'platform', {
			value: 'MacIntel',
			configurable: true
		});

		const screen = await render(Kbd, { props: { keys: 'mod' } });
		await expect.element(screen.getByText('⌘', { exact: true })).toBeInTheDocument();
	});

	it('maps modifier keys to symbols', async () => {
		const screen = await render(Kbd, { props: { keys: 'ctrl+alt+shift+k' } });
		await expect.element(screen.getByText('⌃', { exact: true })).toBeInTheDocument(); // ⌃
		await expect.element(screen.getByText('⌥', { exact: true })).toBeInTheDocument(); // ⌥
		await expect.element(screen.getByText('⇧', { exact: true })).toBeInTheDocument(); // ⇧
		await expect.element(screen.getByText('K', { exact: true })).toBeInTheDocument();
	});

	it('maps special keys', async () => {
		const screen = await render(Kbd, { props: { keys: 'enter' } });
		await expect.element(screen.getByText('↵', { exact: true })).toBeInTheDocument(); // ↵
	});

	it('renders escape as text', async () => {
		const screen = await render(Kbd, { props: { keys: 'escape' } });
		await expect.element(screen.getByText('Esc', { exact: true })).toBeInTheDocument();
	});

	it('exposes a spoken accessible name and hides the glyphs (obs-1)', async () => {
		const screen = await render(Kbd, { props: { keys: 'mod+shift+k' } });
		// The wrapper carries a screen-reader name built from spoken key labels
		// (a non-Mac platform, so mod → "Control").
		const img = screen.getByRole('img').element();
		expect(img).toHaveAttribute('aria-label', 'Control + Shift + K');
		// The visual glyph elements are hidden from assistive tech.
		const glyphs = img.querySelectorAll('kbd');
		glyphs.forEach((g) => expect(g).toHaveAttribute('aria-hidden', 'true'));
		expect(img).not.toHaveAttribute('aria-hidden');
	});

	it('uses "Command" in the accessible name for mod on Mac', async () => {
		spoofPlatform('MacIntel');
		const screen = await render(Kbd, { props: { keys: 'mod+k' } });
		await expect.element(screen.getByRole('img')).toHaveAttribute('aria-label', 'Command + K');
	});

	it('uppercases unknown keys', async () => {
		const screen = await render(Kbd, { props: { keys: 'f1' } });
		await expect.element(screen.getByText('F1', { exact: true })).toBeInTheDocument();
	});

	it('handles whitespace around keys', async () => {
		const screen = await render(Kbd, { props: { keys: 'mod + k' } });
		// On a non-Mac platform, mod renders as "Ctrl"
		await expect.element(screen.getByText('Ctrl', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('K', { exact: true })).toBeInTheDocument();
	});

	it('renders astryx-* class names for theme targeting', async () => {
		const { container } = await render(Kbd, { props: { keys: 'k' } });
		const wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper.className).toContain('astryx-kbd');
	});

	it('renders "plus" as a literal + key', async () => {
		const screen = await render(Kbd, { props: { keys: 'shift+plus' } });
		await expect.element(screen.getByText('⇧', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('+', { exact: true })).toBeInTheDocument();
	});

	it('keeps the computed role and aria-label when unrelated rest props are spread', async () => {
		const screen = await render(Kbd, {
			props: { keys: 'mod+k', 'data-testid': 'kbd', id: 'shortcut' }
		});
		const el = screen.getByTestId('kbd');
		// Pass-through attributes land on the wrapper...
		await expect.element(el).toHaveAttribute('id', 'shortcut');
		// ...without disturbing the computed accessibility contract.
		await expect.element(el).toHaveAttribute('role', 'img');
		await expect.element(el).toHaveAttribute('aria-label', 'Control + K');
	});

	it('computed role and aria-label win over consumer-passed overrides', async () => {
		// Contract props the component computes must not be clobbered by
		// pass-through attributes: {...rest} is spread before role/aria-label.
		const screen = await render(Kbd, {
			props: {
				keys: 'mod+k',
				role: 'presentation',
				'aria-label': 'custom',
				'data-testid': 'kbd'
			}
		});
		const el = screen.getByTestId('kbd');
		await expect.element(el).toHaveAttribute('role', 'img');
		await expect.element(el).toHaveAttribute('aria-label', 'Control + K');
	});
});
