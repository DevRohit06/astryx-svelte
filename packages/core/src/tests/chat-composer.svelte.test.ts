import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { ChatComposerElevation } from '$lib/components/chat/chat-composer.svelte';
import ChatComposerInputSlotProbe from './fixtures/chat-composer-input-slot-probe.svelte';

/**
 * Ported from Astryx's `Chat/ChatComposer.test.tsx`, all **5** cases at v0.4.5
 * (2 in `ChatComposer elevation`, 3 in `ChatComposer input composition
 * contract`). Nothing is dropped and nothing is added.
 *
 * This is `ChatComposer.test.tsx` and only that. `ChatComposerInput.test.tsx`
 * is `chat-composer-input.svelte.test.ts`; `ChatComposerDrawer.test.tsx` is
 * `chat-composer-drawer.svelte.test.ts`.
 *
 * ## Project
 *
 * The **client** project (real Chromium). Case 4 and case 5 assert on focus —
 * `document.activeElement` after a click on the composer body — which needs a
 * real focus model, and cases 1 and 2 read a class off a StyleX-compiled
 * element.
 *
 * ## Translations (none of these is a dropped case)
 *
 * - Every `input` slot upstream writes as inline JSX is a `Snippet` here, so the
 *   three shapes are enumerated in `chat-composer-input-slot-probe.svelte`.
 *   Upstream's `CustomContextInput` becomes `chat-composer-context-input.svelte`;
 *   its `controlRef.current = {focus}` / `= null` becomes a call to this port's
 *   callback-shaped `inputControlRef`, which is what a `RefObject` written by the
 *   *child* translates to (see `chat-context.svelte.ts`). The contract the case
 *   is about — the shell drives a custom input through whatever it registered —
 *   is unchanged.
 * - `fireEvent.click(body)` becomes `body.dispatchEvent(new MouseEvent('click',
 *   {bubbles: true}))` rather than a pointer click. The body's centre is occupied
 *   by the input, so a real pointer there would hit a node the handler
 *   deliberately ignores; dispatching targets the body itself, which is exactly
 *   what `fireEvent.click(body)` does. Same translation
 *   `chat-composer-input.svelte.test.ts` documents for its focus-control case.
 * - `render` is awaited (`vitest-browser-svelte` v3 is async-only), so
 *   `renderBodyClass` is async too.
 */

/**
 * Upstream's `renderBodyClass` helper, unchanged in intent.
 *
 * The composer body — the elevated surface — is the div that wraps the input
 * area (`styles.body`). A custom `input` slot renders inside the inputArea div,
 * so the body is two ancestors up from the slot marker. Walking from a known
 * marker keeps this independent of StyleX's generated class names.
 */
async function renderBodyClass(elevation?: ChatComposerElevation): Promise<string> {
	const screen = await render(ChatComposerInputSlotProbe, {
		props: { input: 'marker', elevation }
	});
	const marker = screen.container.querySelector('[data-testid="composer-input-marker"]')!;
	const inputArea = marker.parentElement!;
	const body = inputArea.parentElement!;
	return body.className;
}

describe('ChatComposer elevation', () => {
	it('applies a distinct body class for each supported level', async () => {
		expect(await renderBodyClass('none')).not.toBe(await renderBodyClass('low'));
	});

	it("defaults to 'low' (preserves the raised look)", async () => {
		expect(await renderBodyClass(undefined)).toBe(await renderBodyClass('low'));
	});
});

describe('ChatComposer input composition contract', () => {
	it('exposes value/onChange/placeholder/isDisabled to a custom input via context', async () => {
		const screen = await render(ChatComposerInputSlotProbe, {
			props: {
				input: 'context',
				value: 'hello',
				placeholder: 'Say something',
				isDisabled: true
			}
		});

		const input = screen.container.querySelector(
			'[data-testid="custom-input"]'
		) as HTMLInputElement;
		expect(input.value).toBe('hello');
		expect(input.placeholder).toBe('Say something');
		expect(input.disabled).toBe(true);
	});

	it('focuses a custom input via its registered control on body click', async () => {
		const focusSpy = vi.fn();
		const screen = await render(ChatComposerInputSlotProbe, {
			props: { input: 'context', focusSpy }
		});

		const marker = screen.container.querySelector('[data-testid="custom-input"]') as HTMLElement;
		const body = marker.parentElement!.parentElement!;
		body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(focusSpy).toHaveBeenCalled();
	});

	it('falls back to focusing a bare textarea when no control is registered', async () => {
		const screen = await render(ChatComposerInputSlotProbe, {
			props: { input: 'textarea' }
		});

		const textarea = screen.container.querySelector(
			'[data-testid="bare-textarea"]'
		) as HTMLTextAreaElement;
		const body = textarea.parentElement!.parentElement!;
		body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(document.activeElement).toBe(textarea);
	});
});
