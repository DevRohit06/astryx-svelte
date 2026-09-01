/** PORTS: Layer/useLayerDismissal.test.tsx */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { resetLayerStackForTests } from '$lib/components/layer/layer-stack.js';
import CloseRequestProbe from './fixtures/dismissal-close-request-probe.svelte';
import EditorLayer from './fixtures/dismissal-editor-layer.svelte';
import Empty from './fixtures/dismissal-empty.svelte';
import Layer from './fixtures/dismissal-layer.svelte';
import NestedFlatLayers from './fixtures/dismissal-nested-flat-layers.svelte';
import NestedLayers from './fixtures/dismissal-nested-layers.svelte';
import SiblingLayers from './fixtures/dismissal-sibling-layers.svelte';

/**
 * Ported from Astryx's `Layer/useLayerDismissal.test.tsx`, **20 of its 21**
 * cases at the 0.5.0 pin — in upstream's order, with upstream's titles and
 * assertions.
 *
 * Every case is "one Escape press, which layers reacted?" — the single question
 * the stack exists to answer.
 *
 * ## The one dropped case, named
 *
 * - **`keeps ordering under StrictMode, which mounts every effect twice`** — the
 *   construct has no counterpart. React's StrictMode deliberately mounts,
 *   unmounts and remounts every effect in development; Svelte has no such mode
 *   and never double-invokes an effect, so there is no way to write the setup
 *   the case describes. What it guards is that a layer's `seq` is keyed to its
 *   token rather than to the registration count, so a re-registration cannot
 *   promote it above the layers opened over it — and that invariant is covered
 *   here by the two `registration order` cases either side of it, which
 *   re-register a layer by flipping its `escapeBehavior` and assert it keeps its
 *   place. Nothing about the stack goes untested; only React's development
 *   harness does.
 *
 * ## Translations (each is a translation, NOT a dropped case)
 *
 * - **Upstream's local `Layer` and `FlatLayer` become fixtures.** Both wrap
 *   component *content*, which is a snippet here and cannot be authored in a
 *   `render()` props object, so each nesting shape upstream writes inline needs
 *   a fixture: `dismissal-layer.svelte`, `dismissal-nested-layers.svelte`,
 *   `dismissal-sibling-layers.svelte` (upstream's local `Siblings`),
 *   `dismissal-flat-layer.svelte`, `dismissal-nested-flat-layers.svelte`,
 *   `dismissal-editor-layer.svelte`. `containerRef` becomes `bind:this`.
 * - **`rerender` merges props rather than replacing the tree.** Upstream's three
 *   rerendering cases swap one element for another — a nested pair for the outer
 *   alone, one sibling for two, one `escapeBehavior` for the other. Each becomes
 *   a flag on the fixture (`hasInner`, `hasNewer`, `olderBehavior`) that the
 *   rerender flips, which mounts and unmounts exactly what upstream's swap did.
 * - **`fireEvent.keyDown` becomes a real `KeyboardEvent`.** This project runs
 *   headless Chromium, so the press is constructed and dispatched directly —
 *   the same bubbling, cancelable event Testing Library synthesises, on the same
 *   target. Upstream's two hand-built events are then just the same helper with
 *   `isComposing`, and its `Object.defineProperty` workaround for that flag is
 *   dropped: a real `KeyboardEvent` honours `isComposing` from its init dict,
 *   where jsdom's does not.
 * - **The close-request cases read the hook directly.** Upstream reaches
 *   `shouldDismissOnCloseRequest` through a rendered button, because it renders
 *   a component rather than calling `renderHook`; the probe-fixture substitute
 *   exposes the return object as an instance export, reached through
 *   `render(...).component`. The button is asserted about nowhere, so nothing
 *   travels with it. `fireEvent.compositionStart`/`compositionEnd`/`blur` become
 *   the corresponding real events dispatched on the field; the stack listens for
 *   all three in the **capture** phase, which reaches a non-bubbling `blur`
 *   exactly as it reaches the bubbling composition events.
 * - **`act()` disappears.** No assertion here reads rendered output, and a
 *   `$state` write flushes on its own.
 *
 * ## Why the client project
 *
 * The stack registers and unregisters on `$effect` teardown, which a `.svelte.ts`
 * compiled for `svelte/server` elides entirely, and every case turns on a real
 * `document` listener seeing a real event.
 *
 * `layerStack.ts` has no suite of its own upstream; this file is where it is
 * tested, as upstream's own header says. Its two sibling suites now have ported
 * counterparts of their own — `layer-dismissal-invariants.svelte.test.ts` and
 * `layer-dismissal-families.svelte.test.ts`, both case for case.
 */

afterEach(() => {
	resetLayerStackForTests();
});

/** Upstream's `fireEvent.keyDown(target, init)`, as a real dispatched event. */
function escapeEvent(init: KeyboardEventInit = {}): KeyboardEvent {
	return new KeyboardEvent('keydown', {
		key: 'Escape',
		bubbles: true,
		cancelable: true,
		...init
	});
}

function pressEscape(init: KeyboardEventInit = {}): KeyboardEvent {
	const event = escapeEvent(init);
	document.dispatchEvent(event);
	return event;
}

describe('useLayerDismissal', () => {
	it('dismisses only the top-most layer when both open in the same commit', async () => {
		// The regression: an inner and outer layer that mount together. Child
		// effects run before parent effects, so registration order reports the
		// inner layer as the OLDER one — nesting, not order, has to decide.
		const outer = vi.fn();
		const inner = vi.fn();

		await render(NestedLayers, { onOuterDismiss: outer, onInnerDismiss: inner });

		pressEscape();
		expect(inner).toHaveBeenCalledTimes(1);
		expect(outer).not.toHaveBeenCalled();
	});

	it('falls through to the outer layer once the inner one closes', async () => {
		const outer = vi.fn();
		const inner = vi.fn();
		const screen = await render(NestedLayers, {
			onOuterDismiss: outer,
			onInnerDismiss: inner
		});
		await screen.rerender({ hasInner: false });

		pressEscape();
		expect(outer).toHaveBeenCalledTimes(1);
		expect(inner).not.toHaveBeenCalled();
	});

	it('dismisses the later of two unrelated layers', async () => {
		const first = vi.fn();
		const second = vi.fn();
		const screen = await render(SiblingLayers, {
			onOlderDismiss: first,
			onNewerDismiss: second,
			hasNewer: false
		});
		await screen.rerender({ hasNewer: true });

		pressEscape();
		expect(second).toHaveBeenCalledTimes(1);
		expect(first).not.toHaveBeenCalled();
	});

	it('resolves nesting by DOM containment when the tree reports equal depth', async () => {
		// A bare focus trap renders nothing, so it cannot push a depth provider.
		// Containment is the only nesting signal those layers have.
		const outer = vi.fn();
		const inner = vi.fn();
		await render(NestedFlatLayers, { onOuterDismiss: outer, onInnerDismiss: inner });

		pressEscape();
		expect(inner).toHaveBeenCalledTimes(1);
		expect(outer).not.toHaveBeenCalled();
	});

	describe('escapeBehavior', () => {
		it("'close' consumes the press, so one Escape affects exactly one layer", async () => {
			// A hover tip inside a modal: the tip is on top, so it takes the press
			// and the modal stays open. A second Escape closes the modal.
			const modal = vi.fn();
			const tip = vi.fn();
			await render(NestedLayers, { onOuterDismiss: modal, onInnerDismiss: tip });

			pressEscape();
			expect(tip).toHaveBeenCalledTimes(1);
			expect(modal).not.toHaveBeenCalled();
		});

		it("'block' consumes the press without dismissing anything", async () => {
			const host = vi.fn();
			const required = vi.fn();
			await render(NestedLayers, {
				onOuterDismiss: host,
				onInnerDismiss: required,
				innerBehavior: 'block'
			});

			pressEscape();
			expect(required).not.toHaveBeenCalled();
			expect(host).not.toHaveBeenCalled();
		});
	});

	describe('registration order', () => {
		it('keeps a layer below the ones that opened after it when its escapeBehavior changes', async () => {
			// A Dialog whose `purpose` flips from required to info while it is open
			// re-registers with the stack. Re-registration must not reorder it above
			// a layer opened on top of it.
			const older = vi.fn();
			const newer = vi.fn();
			const screen = await render(SiblingLayers, {
				olderBehavior: 'block',
				onOlderDismiss: older,
				onNewerDismiss: newer
			});
			await screen.rerender({ olderBehavior: 'close' });

			pressEscape();
			expect(newer).toHaveBeenCalledTimes(1);
			expect(older).not.toHaveBeenCalled();
		});

		it('does not let a re-registered layer swallow a press meant for the layer above it', async () => {
			// The same flip the other way: info to required. A `block` layer that
			// jumped the queue would consume the press and nothing would close.
			const older = vi.fn();
			const newer = vi.fn();
			const screen = await render(SiblingLayers, {
				olderBehavior: 'close',
				onOlderDismiss: older,
				onNewerDismiss: newer
			});
			await screen.rerender({ olderBehavior: 'block' });

			pressEscape();
			expect(newer).toHaveBeenCalledTimes(1);
			expect(older).not.toHaveBeenCalled();
		});

		// Upstream's `keeps ordering under StrictMode, which mounts every effect
		// twice` is dropped — see the file header.
	});

	describe('presence', () => {
		it('skips a registered layer that is not on screen', async () => {
			// Hover layers stay registered for their lifetime because their open
			// state lags the DOM. An absent one must not claim the press — that is
			// exactly the bug where a HoverCard trigger ate Escapes while idle.
			const below = vi.fn();
			const absent = vi.fn();
			await render(NestedLayers, {
				onOuterDismiss: below,
				onInnerDismiss: absent,
				innerIsPresent: () => false
			});

			pressEscape();
			expect(absent).not.toHaveBeenCalled();
			expect(below).toHaveBeenCalledTimes(1);
		});

		it('lets a present layer claim the press over the one beneath', async () => {
			const below = vi.fn();
			const present = vi.fn();
			await render(NestedLayers, {
				onOuterDismiss: below,
				onInnerDismiss: present,
				innerIsPresent: () => true
			});

			pressEscape();
			expect(present).toHaveBeenCalledTimes(1);
			expect(below).not.toHaveBeenCalled();
		});
	});

	describe('opting out', () => {
		it('skips a disabled layer entirely, so the press reaches the one below', async () => {
			const below = vi.fn();
			const optedOut = vi.fn();
			await render(NestedLayers, {
				onOuterDismiss: below,
				onInnerDismiss: optedOut,
				innerIsEnabled: false
			});

			pressEscape();
			expect(optedOut).not.toHaveBeenCalled();
			expect(below).toHaveBeenCalledTimes(1);
		});

		it('does not register an inactive layer', async () => {
			const onDismiss = vi.fn();
			await render(Layer, { onDismiss, isActive: false });

			pressEscape();
			expect(onDismiss).not.toHaveBeenCalled();
		});
	});

	describe('deferring to content', () => {
		it('stands down when content already handled the press', async () => {
			// preventDefault from inside the layer — an editor claiming Escape for
			// its own find widget, for instance.
			const onDismiss = vi.fn();
			const screen = await render(EditorLayer, { onDismiss });

			screen.getByTestId('editor').element().dispatchEvent(escapeEvent());
			expect(onDismiss).not.toHaveBeenCalled();
		});

		it('ignores Escape that is cancelling an IME composition', async () => {
			const onDismiss = vi.fn();
			await render(Layer, { onDismiss });

			pressEscape({ isComposing: true });
			expect(onDismiss).not.toHaveBeenCalled();

			pressEscape({ keyCode: 229 });
			expect(onDismiss).not.toHaveBeenCalled();

			pressEscape();
			expect(onDismiss).toHaveBeenCalledTimes(1);
		});

		it('claims the composing Escape so the browser raises no close request', async () => {
			// Not dismissing is only half of it. An unclaimed Escape lets the browser
			// raise its own close request, which reaches the layer's `cancel` handler
			// and dismisses it on the same keypress — so the guard has to swallow the
			// press, not merely skip the dismissal.
			await render(Layer, { onDismiss: vi.fn() });

			const event = pressEscape({ isComposing: true });
			expect(event.defaultPrevented).toBe(true);
		});

		it('leaves a composing Escape alone when no layer is on screen', async () => {
			// With nothing to protect the press is not ours to take: an idle hover
			// layer in the tree must not suppress the page's own close watcher.
			await render(Layer, { onDismiss: vi.fn(), isPresent: () => false });

			const event = pressEscape({ isComposing: true });
			expect(event.defaultPrevented).toBe(false);
		});
	});

	describe('close requests the browser starts itself', () => {
		// The Android back gesture and the platform close watcher arrive as a
		// `cancel` with no keydown to read, so the keydown guard cannot see them.
		it('declines while an IME composition is running, and again once it ends', async () => {
			const screen = await render(CloseRequestProbe);
			const ask = () => screen.component.dismissal.shouldDismissOnCloseRequest();
			const field = screen.getByLabelText('composing field', { exact: true }).element();

			expect(ask()).toBe(true);

			field.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
			expect(ask()).toBe(false);

			field.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
			expect(ask()).toBe(true);
		});

		it('stops declining when focus leaves a field mid-composition', async () => {
			// A compositionend the stack never sees would otherwise leave the flag
			// stuck on, and every later back gesture would be swallowed.
			const screen = await render(CloseRequestProbe);
			const ask = () => screen.component.dismissal.shouldDismissOnCloseRequest();
			const field = screen.getByLabelText('composing field', { exact: true }).element();

			field.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
			expect(ask()).toBe(false);

			field.dispatchEvent(new FocusEvent('blur'));
			expect(ask()).toBe(true);
		});
	});

	it('leaves the event alone when no layer is open', async () => {
		// Nothing registered: the browser keeps its own Escape behavior (exiting
		// fullscreen, closing a native picker).
		await render(Empty);
		const event = pressEscape();
		expect(event.defaultPrevented).toBe(false);
	});

	it('claims the press it handles so the browser does not act too', async () => {
		// preventDefault is what stops the native close-watcher dismissing a second
		// layer behind the stack's back.
		await render(Layer, { onDismiss: vi.fn() });
		const event = pressEscape();
		expect(event.defaultPrevented).toBe(true);
	});
});
