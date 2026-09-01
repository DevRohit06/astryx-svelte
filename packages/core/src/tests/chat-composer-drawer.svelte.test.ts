/** PORTS: Chat/ChatComposerDrawer.test.tsx */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ChatComposerDrawer from '$lib/components/chat/chat-composer-drawer.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Ported from Astryx's `Chat/ChatComposerDrawer.test.tsx`, all **3** cases at
 * the 0.5.0 pin. Nothing is dropped and nothing is added.
 *
 * This is `ChatComposerDrawer.test.tsx` and only that. `ChatComposer.test.tsx`
 * is `chat-composer.svelte.test.ts`; `ChatComposerInput.test.tsx` is
 * `chat-composer-input.svelte.test.ts`.
 *
 * ## Project
 *
 * The **client** project (real Chromium). Case 2 renders the drawer collapsed,
 * where the content region is a `0fr` grid row with `opacity: 0` coming out of
 * the compiled StyleX sheet — the point of the case is that a *visually*
 * collapsed region is still in the document and still resolvable from
 * `aria-controls`, which needs the real sheet applied.
 *
 * ## Translations (neither is a dropped case)
 *
 * - `children` is a `Snippet`, so upstream's `<span>Drawer content</span>` is
 *   authored by `slot-probe.svelte` with `slot: 'children'` — the same fixture
 *   every "React passes an element as a prop" case here uses. It renders exactly
 *   upstream's span.
 * - `fireEvent.click(toggle)` becomes a native `element.click()`, as every other
 *   suite in this repo does: it dispatches a bubbling click whose `target` is the
 *   element itself.
 *
 * The toggle's accessible name comes from `@astryx.chatComposerDrawer.expand` /
 * `.collapse` — "Expand Attachments" / "Collapse Attachments" — so upstream's
 * `/Attachments/` matches in both states, as it does upstream.
 */

describe('ChatComposerDrawer', () => {
	it('links the toggle to the drawer content via aria-controls', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: ChatComposerDrawer,
				slot: 'children',
				text: 'Drawer content',
				rest: { count: 2, label: 'Attachments' }
			}
		});

		const toggle = screen.getByRole('button', { name: /Attachments/ }).element();
		const controlsId = toggle.getAttribute('aria-controls');
		// aria-controls must be present and point at the real content region.
		expect(controlsId).toBeTruthy();
		const region = document.getElementById(controlsId as string);
		expect(region).not.toBeNull();
		expect(region).toContainElement(
			screen.getByText('Drawer content', { exact: true }).element() as HTMLElement
		);
	});

	it('keeps aria-controls resolvable while collapsed (content stays mounted)', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: ChatComposerDrawer,
				slot: 'children',
				text: 'Drawer content',
				rest: { count: 2, label: 'Attachments', defaultIsCollapsed: true }
			}
		});

		const toggle = screen.getByRole('button', { name: /Attachments/ }).element();
		const controlsId = toggle.getAttribute('aria-controls');
		expect(controlsId).toBeTruthy();
		const region = document.getElementById(controlsId as string);
		expect(region).not.toBeNull();
		expect(region).toContainElement(
			screen.getByText('Drawer content', { exact: true }).element() as HTMLElement
		);
	});

	it('toggles aria-expanded when the toggle is activated', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: ChatComposerDrawer,
				slot: 'children',
				text: 'Drawer content',
				rest: { count: 2, label: 'Attachments' }
			}
		});

		const toggle = screen.getByRole('button', { name: /Attachments/ });
		await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');

		(toggle.element() as HTMLElement).click();
		await expect
			.element(screen.getByRole('button', { name: /Attachments/ }))
			.toHaveAttribute('aria-expanded', 'false');

		(screen.getByRole('button', { name: /Attachments/ }).element() as HTMLElement).click();
		await expect
			.element(screen.getByRole('button', { name: /Attachments/ }))
			.toHaveAttribute('aria-expanded', 'true');
	});
});
