/** PORTS: Layout/__tests__/contentWidth.test.tsx */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LayoutShell from './fixtures/layout-shell.svelte';

/**
 * Astryx's `Layout/__tests__/contentWidth.test.tsx`, ported case for case — **6
 * upstream `it` declarations at the 0.5.0 pin, 6 here**, in upstream's order, under
 * upstream's titles and inside upstream's three nested describes. Nothing
 * dropped, nothing added.
 *
 * The contract: `contentWidth` caps the middle row, and the header and footer
 * always render an inner wrapper to take that cap so the *outer* element — the
 * one carrying the divider — stays full bleed.
 *
 * A **client** project file: every case walks real DOM up from the slot's child.
 *
 * ## Translations, none of them a dropped case
 *
 * **Slots are snippets.** Upstream passes `<LayoutHeader>`/`<LayoutFooter>`/
 * `<LayoutContent>` as JSX props; here they are snippets, so `layout-shell`
 * holds the markup and each case selects the slots it needs by prop. The
 * `data-testid` spans inside it are upstream's, and the parent walks are
 * upstream's walks unchanged.
 *
 * ## One restated case
 *
 * **`applies max-width constraint to the middle row`.** Upstream walks three
 * parents to the middle row and then asserts only `middleRow.className` is
 * truthy — true of every element StyleX touches, and equally true with
 * `contentWidth` removed, so it does not test its own title. It is restated to
 * assert the cap actually landed on that row (`max-width: 640px`), which is what
 * the title claims; the class itself is already proven upstream's by
 * `scripts/compare-upstream-classes.mjs`. The value is in pixels, so reading it
 * back through `getComputedStyle` is safe in real Chromium.
 */

describe('Layout contentWidth', () => {
	describe('Layout', () => {
		it('applies max-width constraint to the middle row', async () => {
			const screen = await render(LayoutShell, { props: { contentWidth: 640, content: 'Body' } });
			const bodyEl = screen.getByTestId('body').element();
			const contentDiv = bodyEl.parentElement!;
			const stackItemDiv = contentDiv.parentElement!;
			const middleRow = stackItemDiv.parentElement!;
			expect(getComputedStyle(middleRow).maxWidth).toBe('640px');
		});

		it('does not crash when contentWidth is not set', async () => {
			const screen = await render(LayoutShell, { props: { content: 'Body' } });
			await expect.element(screen.getByTestId('body')).toBeInTheDocument();
		});
	});

	describe('LayoutHeader', () => {
		it('always renders contentWidth inner wrapper', async () => {
			const screen = await render(LayoutShell, { props: { header: 'Header', content: 'Body' } });
			const headerChild = screen.getByTestId('header-child').element();
			const innerWrapper = headerChild.parentElement!;
			const headerDiv = innerWrapper.parentElement!;
			expect(headerDiv.className).toContain('astryx-layout-header');
			expect(innerWrapper).not.toBe(headerDiv);
		});

		it('keeps divider on outer element', async () => {
			const screen = await render(LayoutShell, {
				props: { contentWidth: 640, defaultHasDividers: true, header: 'Header', content: 'Body' }
			});
			const headerChild = screen.getByTestId('header-child').element();
			const innerWrapper = headerChild.parentElement!;
			const headerDiv = innerWrapper.parentElement!;
			expect(headerDiv).toHaveAttribute('data-divider');
			expect(innerWrapper).not.toHaveAttribute('data-divider');
		});
	});

	describe('LayoutFooter', () => {
		it('always renders contentWidth inner wrapper', async () => {
			const screen = await render(LayoutShell, { props: { content: 'Body', footer: 'Footer' } });
			const footerChild = screen.getByTestId('footer-child').element();
			const innerWrapper = footerChild.parentElement!;
			const footerDiv = innerWrapper.parentElement!;
			expect(footerDiv.className).toContain('astryx-layout-footer');
			expect(innerWrapper).not.toBe(footerDiv);
		});

		it('keeps divider on outer element', async () => {
			const screen = await render(LayoutShell, {
				props: { contentWidth: 640, defaultHasDividers: true, content: 'Body', footer: 'Footer' }
			});
			const footerChild = screen.getByTestId('footer-child').element();
			const innerWrapper = footerChild.parentElement!;
			const footerDiv = innerWrapper.parentElement!;
			expect(footerDiv).toHaveAttribute('data-divider');
			expect(innerWrapper).not.toHaveAttribute('data-divider');
		});
	});
});
