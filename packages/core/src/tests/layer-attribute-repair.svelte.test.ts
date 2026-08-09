import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MutableTrigger from './fixtures/layer-mutable-trigger.svelte';

/**
 * Regression tests with **no upstream counterpart**, and none is possible: both
 * failures are artefacts of how Svelte writes DOM attributes, and React cannot
 * reproduce either.
 *
 * `Tooltip`/`HoverCard` describe a trigger they *found* rather than rendered, and
 * wire it by mutating two of its attributes imperatively — the CSS `anchor-name`
 * inside its inline `style` (`useLayer.attachTrigger`) and its
 * `aria-describedby` (`internal/described-by.ts`). The trigger belongs to the
 * caller's template, so both are contested:
 *
 * - Svelte applies a changed `style` **attribute** by assigning `cssText`, which
 *   replaces the whole declaration block and takes the anchor name with it.
 *   After that the popover's `position-anchor` names nothing, `position-area`
 *   computes to `none`, and it pins to the viewport corner — permanently, since
 *   nothing re-runs the attachment.
 * - Svelte's `aria-describedby` write replaces the value wholesale, dropping the
 *   appended tooltip id, so the tooltip silently stops describing its trigger.
 *
 * React is immune to the first (it writes style *objects* per-property) and to
 * the second (its layout effect is keyed on a ref whose identity churns every
 * render, so it re-merges after each commit — accidental, but a repair pass).
 * Both counterparts here are `MutationObserver`s, the device
 * `watchFirstElementChild` already uses for `childList`.
 *
 * Found by the idiom audit during the batch-4 (`Slider`) port, whose thumb has
 * exactly this shape: a Tooltip trigger with a changing position and an
 * `aria-describedby` recomposed from `description`/`status`.
 */

/** The anchor-name list on an element's inline style. */
function anchorNameOf(el: HTMLElement): string {
	return (el.style as unknown as Record<string, string>).anchorName ?? '';
}

describe('layer trigger attribute repair', () => {
	describe('anchor-name survives a style-attribute rewrite', () => {
		it('sets an anchor name on the trigger when wired', async () => {
			const screen = await render(MutableTrigger, { props: { left: '0px' } });
			const trigger = (await screen.getByRole('button').element()) as HTMLElement;

			expect(anchorNameOf(trigger)).toMatch(/--astryx/);
		});

		it('keeps the anchor name after the caller rewrites the style attribute', async () => {
			const screen = await render(MutableTrigger, { props: { left: '0px' } });
			const trigger = (await screen.getByRole('button').element()) as HTMLElement;
			const original = anchorNameOf(trigger);
			expect(original).toMatch(/--astryx/);

			// The whole-block `cssText` write. Without the repair the anchor name is
			// gone from here on, and never comes back.
			await screen.rerender({ left: '10px' });
			await expect.poll(() => anchorNameOf(trigger)).toBe(original);

			expect(trigger.style.left).toBe('10px');
		});

		it('keeps the anchor name across repeated rewrites', async () => {
			const screen = await render(MutableTrigger, { props: { left: '0px' } });
			const trigger = (await screen.getByRole('button').element()) as HTMLElement;
			const original = anchorNameOf(trigger);

			for (const left of ['1px', '2px', '3px']) {
				await screen.rerender({ left });
			}

			await expect.poll(() => anchorNameOf(trigger)).toBe(original);
		});
	});

	describe('aria-describedby survives a caller rewrite', () => {
		it('appends the tooltip id to the caller value', async () => {
			const screen = await render(MutableTrigger, { props: { describedBy: 'own-description' } });
			const trigger = (await screen.getByRole('button').element()) as HTMLElement;

			const describedBy = trigger.getAttribute('aria-describedby') ?? '';
			expect(describedBy.split(' ')[0]).toBe('own-description');
			expect(describedBy.split(' ').length).toBe(2);
		});

		it('re-appends the tooltip id after the caller changes its own value', async () => {
			const screen = await render(MutableTrigger, { props: { describedBy: 'own-description' } });
			const trigger = (await screen.getByRole('button').element()) as HTMLElement;
			const tooltipId = (trigger.getAttribute('aria-describedby') ?? '').split(' ')[1];
			expect(tooltipId).toBeTruthy();

			// The caller recomposes its own ids — `Slider` does this whenever
			// `description` or `status` changes. Without the repair the tooltip id is
			// dropped here and never returns.
			await screen.rerender({ describedBy: 'own-description other-description' });

			await expect
				.poll(() => trigger.getAttribute('aria-describedby'))
				.toBe(`own-description other-description ${tooltipId}`);
		});

		it('re-appends the tooltip id after the caller removes its own value', async () => {
			const screen = await render(MutableTrigger, { props: { describedBy: 'own-description' } });
			const trigger = (await screen.getByRole('button').element()) as HTMLElement;
			const tooltipId = (trigger.getAttribute('aria-describedby') ?? '').split(' ')[1];

			await screen.rerender({ describedBy: undefined });

			await expect.poll(() => trigger.getAttribute('aria-describedby')).toBe(tooltipId);
		});

		it('does not loop: the merged value settles rather than growing', async () => {
			const screen = await render(MutableTrigger, { props: { describedBy: 'own-description' } });
			const trigger = (await screen.getByRole('button').element()) as HTMLElement;

			await screen.rerender({ describedBy: 'other-description' });
			await expect
				.poll(() => (trigger.getAttribute('aria-describedby') ?? '').split(' ').length)
				.toBe(2);

			// Give the observer several more turns to misbehave if it were going to.
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect((trigger.getAttribute('aria-describedby') ?? '').split(' ').length).toBe(2);
		});
	});
});
