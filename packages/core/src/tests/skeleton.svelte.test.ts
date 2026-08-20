import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Skeleton from '$lib/components/skeleton/skeleton.svelte';
import { forcedColorsCssIn } from './forced-colors.js';

/**
 * Astryx's `Skeleton/Skeleton.test.tsx` at **v0.4.5**, ported case for case.
 *
 * The count is the contract: upstream declares **4** `it` blocks at this pin —
 * 3 in `describe('Skeleton')` and 1 in `describe('forced colors (WCAG
 * 1.4.11)')` — and **4** are here. **Nothing is dropped.** `Skeleton` renders
 * no children and takes no snippet, so no fixture is needed; upstream's suite
 * has no `displayName` case, no `ref` case and no snapshot, so none of this
 * port's standing drops applies.
 *
 * **One counterpart, which is not a dropped case:** the forced-colors case
 * scans through `forced-colors.ts`'s `forcedColorsCssIn(root)` rather than
 * upstream's document-wide `getForcedColorsRules()`. The scan has to be scoped
 * here because `setup-stylex.ts` puts the *whole* compiled sheet on every test
 * page — a global substring match would pass on some other component's
 * `graytext` rule and keep passing after Skeleton's own was deleted. Both
 * assertions are upstream's verbatim; only their scope is narrowed, which makes
 * them stricter. See `forced-colors.ts` for the full reasoning.
 */

describe('Skeleton', () => {
	it('renders a placeholder element', async () => {
		const screen = await render(Skeleton, {
			props: { width: 200, height: 20, 'data-testid': 'sk' }
		});
		await expect.element(screen.getByTestId('sk')).toBeInTheDocument();
	});

	it('is hidden from assistive tech by default (complex-20)', async () => {
		const screen = await render(Skeleton, {
			props: { width: 200, height: 20, 'data-testid': 'sk' }
		});
		await expect.element(screen.getByTestId('sk')).toHaveAttribute('aria-hidden', 'true');
	});

	it('allows the aria-hidden default to be overridden', async () => {
		const screen = await render(Skeleton, {
			props: { width: 200, height: 20, 'data-testid': 'sk', 'aria-hidden': false }
		});
		// Consumer opt-out: not hidden when explicitly set false.
		await expect.element(screen.getByTestId('sk')).toHaveAttribute('aria-hidden', 'false');
	});
});

// Neither jsdom nor a Chromium test page can emulate forced-colors rendering,
// so these assert that the compiled output includes the forced-colors rules;
// visual behavior needs manual verification under Windows High Contrast.
describe('forced colors (WCAG 1.4.11)', () => {
	it('compiles forced-colors overrides so the placeholder stays visible under Windows High Contrast', async () => {
		const screen = await render(Skeleton, {
			props: { width: 200, height: 20, 'data-testid': 'sk' }
		});
		const css = forcedColorsCssIn(screen.container);
		// The painted fill is stripped to Canvas (invisible); GrayText is a
		// system color, so it survives forcing.
		expect(css).toContain('background-color: graytext;');
		// The resting 0.25 opacity is lifted so the static placeholder reads.
		expect(css).toContain('opacity: 1;');
	});
});
