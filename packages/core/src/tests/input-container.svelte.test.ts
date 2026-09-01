/** PORTS: hooks/useInputContainer.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './fixtures/input-container-fixture.svelte';

/**
 * Ported from Astryx's `hooks/useInputContainer.test.tsx` (6 cases at the 0.5.0
 * pin, all ported).
 *
 * Ours is `hooks/use-input-container.svelte.ts`. Upstream's `TestContainer`
 * render prop becomes the fixture next door, which describes the control rather
 * than rendering it through a callback — Svelte has no render prop that hands a
 * ref back out. Every assertion is upstream's, unchanged.
 *
 * `fireEvent.click` maps to `dispatchEvent(new MouseEvent('click', {bubbles:
 * true}))`, which is what `fireEvent.click` is and what this repo's other
 * container-click suites already use. A real Playwright click would additionally
 * move focus, which would make the `onFocus` assertions test the browser rather
 * than the hook.
 *
 * What the first two cases pin: `isPopupTrigger` must be checked *before*
 * `FOCUS_INPUT_TYPES`. Both controls are `type="text"`, which is in
 * `FOCUS_INPUT_TYPES` — so if the order were reversed they would focus and
 * never open their popup, and the focus fallback would mask the missing click
 * branch entirely.
 */

const clickChrome = (screen: { getByTestId: (id: string) => { element: () => Element } }) => {
	screen
		.getByTestId('chrome')
		.element()
		.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
};

describe('useInputContainer', () => {
	it('clicks (not focuses) a role="combobox" aria-haspopup="dialog" text input', async () => {
		const onFocus = vi.fn();
		const onControlClick = vi.fn();
		const screen = await render(Fixture, {
			props: {
				attrs: { type: 'text', role: 'combobox', 'aria-haspopup': 'dialog' },
				onControlFocus: onFocus,
				onControlClick
			}
		});

		// Click the non-interactive chrome so the container handler fires.
		clickChrome(screen);

		// A popup trigger must be activated via click, not merely focused —
		// otherwise DateInput's calendar would never open.
		expect(onControlClick).toHaveBeenCalledTimes(1);
		expect(onFocus).not.toHaveBeenCalled();
	});

	it('clicks a control that only advertises aria-haspopup (no combobox role)', async () => {
		const onFocus = vi.fn();
		const onControlClick = vi.fn();
		const screen = await render(Fixture, {
			props: {
				attrs: { type: 'text', 'aria-haspopup': 'menu' },
				onControlFocus: onFocus,
				onControlClick
			}
		});

		clickChrome(screen);

		expect(onControlClick).toHaveBeenCalledTimes(1);
		expect(onFocus).not.toHaveBeenCalled();
	});

	it('focuses (not clicks) a plain type="text" input', async () => {
		const onFocus = vi.fn();
		const onControlClick = vi.fn();
		const screen = await render(Fixture, {
			props: { attrs: { type: 'text' }, onControlFocus: onFocus, onControlClick }
		});

		clickChrome(screen);

		expect(onFocus).toHaveBeenCalledTimes(1);
		expect(onControlClick).not.toHaveBeenCalled();
	});

	it('focuses (not clicks) a plain type="number" input', async () => {
		const onFocus = vi.fn();
		const onControlClick = vi.fn();
		const screen = await render(Fixture, {
			props: { attrs: { type: 'number' }, onControlFocus: onFocus, onControlClick }
		});

		clickChrome(screen);

		expect(onFocus).toHaveBeenCalledTimes(1);
		expect(onControlClick).not.toHaveBeenCalled();
	});

	it('focuses (not clicks) a textarea', async () => {
		const onFocus = vi.fn();
		const onControlClick = vi.fn();
		const screen = await render(Fixture, {
			props: { element: 'textarea', onControlFocus: onFocus, onControlClick }
		});

		clickChrome(screen);

		expect(onFocus).toHaveBeenCalledTimes(1);
		expect(onControlClick).not.toHaveBeenCalled();
	});

	it('clicks (not focuses) a checkbox — unchanged behavior', async () => {
		const onFocus = vi.fn();
		const onControlClick = vi.fn();
		const screen = await render(Fixture, {
			props: { attrs: { type: 'checkbox' }, onControlFocus: onFocus, onControlClick }
		});

		clickChrome(screen);

		expect(onControlClick).toHaveBeenCalledTimes(1);
		expect(onFocus).not.toHaveBeenCalled();
	});
});
