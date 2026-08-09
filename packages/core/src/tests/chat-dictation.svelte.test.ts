import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ChatDictationProbe from './fixtures/chat-dictation-probe.svelte';

/**
 * `useChatDictation.test.ts` ported case for case — 18 cases across its two
 * describes, `useSpeechRecognition` (10) and `useChatDictation` (8).
 *
 * `renderHook` becomes the probe fixture; `act()` needs no counterpart, because
 * every one of these state writes happens inside a handler the test calls
 * directly and a `$state` write is visible on the next read.
 *
 * The mock `SpeechRecognition` is upstream's, unchanged — it is plain DOM
 * scaffolding with no React in it. Running in real Chromium rather than jsdom
 * changes nothing here: `window.SpeechRecognition` is assigned the same way, and
 * the analyser path behind `getUserMedia` is caught and discarded on both.
 */

class MockSpeechRecognition {
	lang = '';
	continuous = false;
	interimResults = false;
	onstart: (() => void) | null = null;
	onend: (() => void) | null = null;
	onresult: ((event: unknown) => void) | null = null;
	onspeechstart: (() => void) | null = null;
	onspeechend: (() => void) | null = null;
	onerror: ((event: unknown) => void) | null = null;
	onnomatch: (() => void) | null = null;

	start = vi.fn(() => {
		this.onstart?.();
	});

	stop = vi.fn(() => {
		this.onend?.();
	});

	abort = vi.fn(() => {
		this.onend?.();
	});
}

let lastInstance: MockSpeechRecognition | null = null;

function MockSRConstructor() {
	const instance = new MockSpeechRecognition();
	lastInstance = instance;
	return instance;
}

let originalSR: unknown;

beforeEach(() => {
	lastInstance = null;
	originalSR = (window as unknown as Record<string, unknown>).SpeechRecognition;
	(window as unknown as Record<string, unknown>).SpeechRecognition = MockSRConstructor;
});

afterEach(() => {
	if (originalSR === undefined) {
		delete (window as unknown as Record<string, unknown>).SpeechRecognition;
	} else {
		(window as unknown as Record<string, unknown>).SpeechRecognition = originalSR;
	}
});

const finalResult = (transcript: string) => ({
	resultIndex: 0,
	results: { length: 1, 0: { isFinal: true, length: 1, 0: { transcript } } }
});

const interimResult = (transcript: string) => ({
	resultIndex: 0,
	results: { length: 1, 0: { isFinal: false, length: 1, 0: { transcript } } }
});

describe('useSpeechRecognition', () => {
	const renderHook = (options?: Record<string, unknown>) =>
		render(ChatDictationProbe, { props: { which: 'speech', options } });

	it('reports isSupported as false when SpeechRecognition is unavailable', async () => {
		delete (window as unknown as Record<string, unknown>).SpeechRecognition;
		delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

		const screen = await renderHook();
		expect(screen.component.api.isSupported).toBe(false);
		expect(screen.component.api.isListening).toBe(false);
	});

	it('reports isSupported as true when SpeechRecognition is available', async () => {
		const screen = await renderHook();
		expect(screen.component.api.isSupported).toBe(true);
	});

	it('starts and sets isListening', async () => {
		const screen = await renderHook();

		screen.component.api.start();

		expect(screen.component.api.isListening).toBe(true);
		expect(lastInstance?.start).toHaveBeenCalled();
	});

	it('stops and clears isListening', async () => {
		const screen = await renderHook();

		screen.component.api.start();
		expect(screen.component.api.isListening).toBe(true);

		screen.component.api.stop();
		expect(screen.component.api.isListening).toBe(false);
	});

	it('toggle starts when not listening and stops when listening', async () => {
		const screen = await renderHook();

		// Toggle on
		screen.component.api.toggle();
		expect(screen.component.api.isListening).toBe(true);

		// Toggle off
		screen.component.api.toggle();
		expect(screen.component.api.isListening).toBe(false);
	});

	it('abort immediately stops recognition', async () => {
		const screen = await renderHook();

		screen.component.api.start();
		expect(screen.component.api.isListening).toBe(true);

		screen.component.api.abort();
		expect(screen.component.api.isListening).toBe(false);
		expect(lastInstance?.abort).toHaveBeenCalled();
	});

	it('calls onStart and onEnd callbacks', async () => {
		const onStart = vi.fn();
		const onEnd = vi.fn();

		const screen = await renderHook({ onStart, onEnd });

		screen.component.api.start();
		expect(onStart).toHaveBeenCalledOnce();

		screen.component.api.stop();
		expect(onEnd).toHaveBeenCalledOnce();
	});

	it('handles result events with final transcript', async () => {
		const onResult = vi.fn();
		const onTranscript = vi.fn();

		const screen = await renderHook({ onResult, onTranscript });

		screen.component.api.start();

		// Simulate a final result
		lastInstance?.onresult?.(finalResult('hello world'));

		expect(onResult).toHaveBeenCalledWith('hello world');
		expect(onTranscript).toHaveBeenCalledWith('hello world', true);
	});

	it('handles interim results and updates interimTranscript', async () => {
		const onTranscript = vi.fn();

		const screen = await renderHook({ onTranscript });

		screen.component.api.start();

		// Simulate an interim result
		lastInstance?.onresult?.(interimResult('hel'));

		expect(screen.component.api.interimTranscript).toBe('hel');
		expect(onTranscript).toHaveBeenCalledWith('hel', false);
	});

	it('cleans up recognition on unmount', async () => {
		const screen = await renderHook();

		screen.component.api.start();

		const instance = lastInstance;
		screen.unmount();

		expect(instance?.abort).toHaveBeenCalled();
	});
});

describe('useChatDictation', () => {
	const renderHook = (options?: Record<string, unknown>) =>
		render(ChatDictationProbe, { props: { which: 'dictation', options } });

	it('reports isSupported from speech recognition', async () => {
		const screen = await renderHook();
		expect(screen.component.api.isSupported).toBe(true);
	});

	it('includes volume, bands, rawBands in return', async () => {
		const screen = await renderHook();
		const api = screen.component.api as { volume: number; bands: number[]; rawBands: number[] };
		expect(api.volume).toBe(0);
		expect(api.bands).toEqual([0, 0, 0, 0, 0]);
		expect(api.rawBands).toEqual([0, 0, 0, 0, 0]);
	});

	it('starts and sets isListening', async () => {
		const screen = await renderHook();

		screen.component.api.start();

		expect(screen.component.api.isListening).toBe(true);
	});

	it('stops and clears isListening', async () => {
		const screen = await renderHook();

		screen.component.api.start();
		expect(screen.component.api.isListening).toBe(true);

		screen.component.api.stop();
		expect(screen.component.api.isListening).toBe(false);
	});

	it('toggle starts and stops', async () => {
		const screen = await renderHook();

		screen.component.api.toggle();
		expect(screen.component.api.isListening).toBe(true);

		screen.component.api.toggle();
		expect(screen.component.api.isListening).toBe(false);
	});

	it('forwards onStart and onEnd callbacks', async () => {
		const onStart = vi.fn();
		const onEnd = vi.fn();

		const screen = await renderHook({ onStart, onEnd });

		screen.component.api.start();
		expect(onStart).toHaveBeenCalledOnce();

		screen.component.api.stop();
		expect(onEnd).toHaveBeenCalledOnce();
	});

	it('handles final transcript via onResult', async () => {
		const onResult = vi.fn();

		const screen = await renderHook({ onResult });

		screen.component.api.start();

		lastInstance?.onresult?.(finalResult('hello world'));

		expect(onResult).toHaveBeenCalledWith('hello world');
	});

	it('abort immediately stops recognition', async () => {
		const screen = await renderHook();

		screen.component.api.start();

		screen.component.api.abort();

		expect(screen.component.api.isListening).toBe(false);
		expect(lastInstance?.abort).toHaveBeenCalled();
	});
});
