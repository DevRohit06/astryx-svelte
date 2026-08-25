import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { sx } from '$lib/internal/sx.js';
import { keyboardHintXstyle } from '$lib/hooks/keyboard-hint.stylex.js';
import KeyboardHintProbe from './fixtures/keyboard-hint-probe.svelte';
import KeyboardHintI18nFixture from './fixtures/keyboard-hint-i18n.svelte';

/**
 * Ported from Astryx's `hooks/useKeyboardHint.test.tsx` — **7 upstream cases at
 * the 0.5.0 pin (5 at v0.2.0 plus the two i18n cases 0.3.0 added), 7 here, none
 * dropped**.
 *
 * Upstream's `TestHint` becomes `keyboard-hint-probe.svelte`: the hook cannot
 * return markup here, so `hintElement` is `<KeyboardHintLayer {hint} />` and the
 * probe renders only that inside upstream's wrapping `<div>`. Both helpers below
 * are transcribed verbatim — our `Kbd` emits the same `.astryx-kbd` wrapper with
 * the spoken `aria-label` and one `<kbd>` per key.
 *
 * No environment stubs: upstream needs none either, nothing here calls
 * `showPopover`, and the client project is a real Chromium. The compiled StyleX
 * sheet is likewise not loaded — no case reads a computed value. Case 4 reads
 * the *inline* `style` attribute (which is where upstream's `style` render prop
 * lands, and why the offset stays a literal declaration rather than a StyleX
 * key), and case 5 reads the class list.
 *
 * **One deviation, in case 5.** Upstream asserts
 * `hint.className` contains `'useKeyboardHint__styles.hint'` — a StyleX
 * *dev-mode debug* class name derived from upstream's module path
 * (`useKeyboardHint.tsx`, `const styles`, key `hint`). Ours is authored in
 * `keyboard-hint.stylex.ts`, so that literal can never appear, and matching on
 * our own debug token would additionally pin the suite to `dev: true` in
 * `vite.config.ts`. The case's subject is that the hint's surface styles survive
 * `useLayer`'s reset (`layerAttrs` merges `styles.base`, whose padding is `0`,
 * *before* the caller's `xstyle`), so the counterpart asserts the atomic classes
 * themselves: every class the `hint` style object resolves to must be present on
 * the popover. That is what the debug name stands in for upstream, checked
 * directly and independently of the dev flag.
 */

/** Upstream's helper, verbatim. */
function getKeyLabels(container: HTMLElement): (string | null)[] {
	return Array.from(container.querySelectorAll('.astryx-kbd')).map((key) =>
		key.getAttribute('aria-label')
	);
}

/** Upstream's helper, verbatim. */
function getKeyText(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll('kbd')).map((key) => key.textContent ?? '');
}

function hintIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[popover="manual"]');
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a keyboard hint popover');
	}
	return el;
}

describe('useKeyboardHint', () => {
	it('renders horizontal arrow keys with Kbd', async () => {
		const { container } = await render(KeyboardHintProbe, {
			props: { orientation: 'horizontal' }
		});

		expect(getKeyLabels(container)).toEqual(['Left arrow', 'Right arrow']);
		expect(getKeyText(container)).toEqual(['←', '→']);
	});

	it('renders vertical arrow keys with Kbd', async () => {
		const { container } = await render(KeyboardHintProbe, {
			props: { orientation: 'vertical' }
		});

		expect(getKeyLabels(container)).toEqual(['Up arrow', 'Down arrow']);
		expect(getKeyText(container)).toEqual(['↑', '↓']);
	});

	it('renders all arrow keys for both-axis navigation', async () => {
		const { container } = await render(KeyboardHintProbe, {
			props: { orientation: 'both' }
		});

		expect(getKeyLabels(container)).toEqual([
			'Left arrow',
			'Right arrow',
			'Up arrow',
			'Down arrow'
		]);
		expect(getKeyText(container)).toEqual(['←', '→', '↑', '↓']);
	});

	it('positions the hint farther from the anchor', async () => {
		const { container } = await render(KeyboardHintProbe);
		const hint = hintIn(container);

		expect(hint.style.marginBlockStart).toBe('var(--spacing-2)');
	});

	// Counterpart, not a translation — see the deviation note in the file header.
	it('keeps the hint surface padding after useLayer reset styles', async () => {
		const { container } = await render(KeyboardHintProbe);
		const hint = hintIn(container);

		const hintClasses = sx(keyboardHintXstyle).class.split(' ').filter(Boolean);

		expect(hintClasses.length).toBeGreaterThan(0);
		expect([...hint.classList]).toEqual(expect.arrayContaining(hintClasses));
	});

	it('renders the "to navigate" label from the i18n catalog', async () => {
		const { container } = await render(KeyboardHintProbe);
		const hint = hintIn(container);

		expect(hint.textContent).toContain('to navigate');
	});

	it('localizes the "to navigate" label through the i18n catalog', async () => {
		const { container } = await render(KeyboardHintI18nFixture, {
			props: {
				locale: 'fr',
				overrides: { fr: { '@astryx.keyboardHint.toNavigate': 'pour naviguer' } }
			}
		});
		const hint = hintIn(container);

		expect(hint.textContent).toContain('pour naviguer');
		expect(hint.textContent).not.toContain('to navigate');
	});
});
