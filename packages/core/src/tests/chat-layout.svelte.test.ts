import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ChatDictationButton from '$lib/components/chat/chat-dictation-button.svelte';
import ChatLayoutScrollButton from '$lib/components/chat/chat-layout-scroll-button.svelte';
import type { UseSpeechRecognitionReturn } from '$lib/components/chat/use-speech-recognition.svelte.js';
import ChatLayoutProbe from './fixtures/chat-layout-probe.svelte';

/**
 * The layout chrome: `ChatLayout.test.tsx`'s first two describes — `ChatLayout`
 * (8 cases) and `ChatLayout — self-scroll layout contract (#2573)` (3) — plus
 * `ChatLayoutScrollButton.test.tsx` (2) and `ChatDictationButton.test.tsx` (2):
 * **15 cases**, ported case for case. `ChatLayout`'s third describe, the
 * first-fill scroll positioning (2), lives in `chat-scroll.svelte.test.ts` with
 * the two hook suites it shares its stubs with — so `ChatLayout.test.tsx`'s 13
 * cases are covered 11 here and 2 there.
 *
 * (The previous header said "`ChatLayout`'s own describe (8 cases) … — 12
 * cases", which its own file contradicted: the self-scroll block was already
 * ported and uncounted, and the file has always run 15.)
 *
 * One counterpart rather than a translation: the empty-state case passes `{[]}`
 * upstream, and the port omits the prop — the same substitution
 * `chat-message.svelte.test.ts` documents for `ChatMessageList`.
 */

const dictation: UseSpeechRecognitionReturn = {
	isSupported: true,
	isListening: false,
	isSpeaking: false,
	volume: 0,
	bands: [0, 0, 0, 0, 0],
	rawBands: [0, 0, 0, 0, 0],
	interimTranscript: '',
	start: () => {},
	stop: () => {},
	abort: () => {},
	toggle: () => {}
};

describe('ChatLayout', () => {
	it('renders children in the message area', async () => {
		const screen = await render(ChatLayoutProbe, { props: { text: 'Hello message' } });
		await expect.element(screen.getByText('Hello message', { exact: true })).toBeInTheDocument();
	});

	it('renders composer in dock', async () => {
		const screen = await render(ChatLayoutProbe, { props: { text: 'msg' } });
		expect(screen.container.querySelector('[data-testid="composer"]')).not.toBeNull();
	});

	it('renders empty state when children is empty', async () => {
		const screen = await render(ChatLayoutProbe, {
			props: { emptyStateText: 'No messages yet' }
		});
		await expect.element(screen.getByText('No messages yet', { exact: true })).toBeInTheDocument();
	});

	it('prefers children over empty state when both present', async () => {
		const screen = await render(ChatLayoutProbe, {
			props: { text: 'A message', emptyStateText: 'No messages yet' }
		});
		await expect.element(screen.getByText('A message', { exact: true })).toBeInTheDocument();
		expect(screen.container.textContent).not.toContain('No messages yet');
	});

	// -------------------------------------------------------------------------
	// Self-scroll layout contract (#2573), upstream 0.3.0.
	//
	// With `minHeight: 100%` on the message area the in-flow sticky dock added
	// its full height on top, so the root always overflowed by exactly the dock
	// height — a phantom scrollbar. The fix makes the root a flex column whose
	// message area grows instead.
	//
	// Upstream notes that jsdom has no layout, so its versions assert the
	// class-level CSS *intent* and the real geometry was checked by hand in a
	// browser. This project's client project IS a real browser, so these read
	// the computed values directly — a strictly stronger assertion than the
	// original, and the reason the `minHeight` guard below actually bites.
	// -------------------------------------------------------------------------

	it('root is a flex column so the dock height is part of the 100%', async () => {
		const screen = await render(ChatLayoutProbe, {
			props: { text: 'msg', rest: { 'data-testid': 'layout' } }
		});
		const root = screen.container.querySelector('[data-testid="layout"]') as HTMLElement;
		const computed = getComputedStyle(root);
		expect(computed.display).toBe('flex');
		expect(computed.flexDirection).toBe('column');
	});

	it('message area flexes to fill leftover space instead of minHeight: 100%', async () => {
		const screen = await render(ChatLayoutProbe, {
			props: { text: 'msg', rest: { 'data-testid': 'layout' } }
		});
		const root = screen.container.querySelector('[data-testid="layout"]') as HTMLElement;
		const messageArea = root.firstElementChild as HTMLElement;
		const computed = getComputedStyle(messageArea);
		expect(computed.flexGrow).toBe('1');
		expect(computed.flexShrink).toBe('0');
		// `minHeight: 100%` is the phantom-scrollbar bug — it must not come back.
		// A real browser resolves the percentage against the parent, so compare
		// against the root's own height rather than the literal string jsdom keeps.
		expect(computed.minHeight).not.toBe(getComputedStyle(root).height);
	});

	it('dock is sticky in self-scroll mode and fixed with an external scrollRef', async () => {
		const screen = await render(ChatLayoutProbe, {
			props: { text: 'msg', rest: { 'data-testid': 'layout' } }
		});
		const root = screen.container.querySelector('[data-testid="layout"]') as HTMLElement;
		expect(getComputedStyle(root.lastElementChild as HTMLElement).position).toBe('sticky');

		await screen.rerender({
			text: 'msg',
			externalScroller: true,
			rest: { 'data-testid': 'layout' }
		});
		const external = screen.container.querySelector('[data-testid="layout"]') as HTMLElement;
		expect(getComputedStyle(external.lastElementChild as HTMLElement).position).toBe('fixed');
	});

	it('applies density attribute to root element', async () => {
		const screen = await render(ChatLayoutProbe, {
			props: { text: 'msg', density: 'compact', rest: { 'data-testid': 'layout' } }
		});
		const root = screen.container.querySelector('[data-testid="layout"]');
		expect(root?.className).toContain('compact');

		await screen.rerender({
			text: 'msg',
			density: 'spacious',
			rest: { 'data-testid': 'layout' }
		});
		expect(root?.className).toContain('spacious');
	});

	it('defaults density to balanced', async () => {
		const screen = await render(ChatLayoutProbe, {
			props: { text: 'msg', rest: { 'data-testid': 'layout' } }
		});
		const root = screen.container.querySelector('[data-testid="layout"]');
		expect(root?.className).toContain('balanced');
	});

	it('renders custom scrollButton slot', async () => {
		const screen = await render(ChatLayoutProbe, {
			props: { text: 'msg', scrollButton: 'custom' }
		});
		await expect.element(screen.getByRole('button', { name: /Scroll down/ })).toBeInTheDocument();
	});

	it('hides scrollButton when null', async () => {
		const screen = await render(ChatLayoutProbe, {
			props: { text: 'msg', scrollButton: 'none' }
		});
		// The probe's own "Add" button is outside the layout, so scope the query to it.
		const layout = screen.container.querySelector('[class*="astryx-chat-layout"]');
		expect(layout?.querySelector('button')).toBeNull();
	});
});

describe('ChatLayoutScrollButton', () => {
	it('renders a scroll button', async () => {
		const screen = await render(ChatLayoutScrollButton, {
			props: { isVisible: true, onClick: () => {}, 'data-testid': 'scroll' }
		});
		expect(screen.container.querySelector('[data-testid="scroll"]')).not.toBeNull();
	});

	it('forwards rest props (data-*, aria-*, id) to the root element', async () => {
		const screen = await render(ChatLayoutScrollButton, {
			props: {
				isVisible: true,
				onClick: () => {},
				'data-testid': 'scroll',
				'data-custom': 'x',
				id: 'scroll-1'
			}
		});
		const root = screen.container.querySelector('[data-testid="scroll"]');
		expect(root?.getAttribute('data-custom')).toBe('x');
		expect(root?.getAttribute('id')).toBe('scroll-1');
	});
});

describe('ChatDictationButton', () => {
	it('renders a dictation button', async () => {
		const screen = await render(ChatDictationButton, {
			props: { dictation, 'data-testid': 'dictation' }
		});
		expect(screen.container.querySelector('[data-testid="dictation"]')).not.toBeNull();
	});

	it('forwards rest props (data-*, aria-*, id) to the root element', async () => {
		const screen = await render(ChatDictationButton, {
			props: { dictation, 'data-testid': 'dictation', 'data-custom': 'x', id: 'dictate-1' }
		});
		const root = screen.container.querySelector('[data-testid="dictation"]');
		expect(root?.getAttribute('data-custom')).toBe('x');
		expect(root?.getAttribute('id')).toBe('dictate-1');
	});
});
