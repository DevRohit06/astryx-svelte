import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTypeahead } from '$lib/hooks/use-typeahead.js';

/**
 * Ported from Astryx's `hooks/useTypeahead.test.tsx`, all seven cases.
 *
 * Named `use-typeahead` rather than the hook-suite convention of dropping the
 * `use-` prefix (`list-focus`, `overflow`, `hotkeys`): batch 6 landed the
 * `Typeahead` *component*, whose own suite is `typeahead.svelte.test.ts`, and
 * the two are unrelated — this hook is the type-to-select buffer `DropdownMenu`
 * and `NavHeadingMenu` use.
 *
 * No `renderHook` stand-in is needed: the hook holds no reactive state and never
 * touches component context, so the test calls it where upstream needs
 * `result.current`. It still runs in the browser project because it constructs
 * `KeyboardEvent`s, which node has no global for.
 *
 * Only `setTimeout`/`clearTimeout` are faked — the buffer reset is the only
 * timer involved, and vitest's default set includes `queueMicrotask`, which
 * Svelte schedules on.
 */

const LABELS = ['Apple', 'Apricot', 'Banana', 'Cherry'] as const;
const NO_DISABLED: number[] = [];

function setup(opts?: { current?: number; disabledIndices?: number[] }) {
	const onMatch = vi.fn();
	const disabled = opts?.disabledIndices ?? NO_DISABLED;
	const api = useTypeahead(() => ({
		getItemLabels: () => LABELS,
		onMatch,
		getCurrentIndex: () => opts?.current ?? -1,
		isDisabled: (i: number) => disabled.includes(i)
	}));
	return { onMatch, api };
}

function key(k: string): KeyboardEvent {
	return new KeyboardEvent('keydown', { key: k });
}

describe('useTypeahead', () => {
	beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }));
	afterEach(() => vi.useRealTimers());

	it('matches the first item whose label starts with the typed character', () => {
		const { onMatch, api } = setup();
		const handled = api.onKeyDown(key('b'));
		expect(handled).toBe(true);
		expect(onMatch).toHaveBeenCalledWith(2); // Banana
	});

	it('accumulates the buffer to disambiguate (a → ap → apr)', () => {
		const { onMatch, api } = setup();
		api.onKeyDown(key('a')); // Apple (first "a")
		expect(onMatch).toHaveBeenLastCalledWith(0);
		api.onKeyDown(key('p')); // "ap" still Apple
		expect(onMatch).toHaveBeenLastCalledWith(0);
		api.onKeyDown(key('r')); // "apr" → Apricot
		expect(onMatch).toHaveBeenLastCalledWith(1);
	});

	it('cycles through same-letter matches on repeated presses', () => {
		// Start with nothing focused; repeated "a" walks Apple → Apricot → wrap.
		const onMatch = vi.fn();
		let current = -1;
		const api = useTypeahead(() => ({
			getItemLabels: () => LABELS,
			onMatch: (i: number) => {
				current = i;
				onMatch(i);
			},
			getCurrentIndex: () => current
		}));
		api.onKeyDown(key('a'));
		expect(onMatch).toHaveBeenLastCalledWith(0); // Apple (first match)
		api.onKeyDown(key('a'));
		expect(onMatch).toHaveBeenLastCalledWith(1); // advance to Apricot
		api.onKeyDown(key('a'));
		expect(onMatch).toHaveBeenLastCalledWith(0); // wrap back to Apple
	});

	it('resets the buffer after the timeout', () => {
		const { onMatch, api } = setup();
		api.onKeyDown(key('a')); // Apple
		api.onKeyDown(key('p')); // Apple ("ap")
		vi.advanceTimersByTime(800);
		api.onKeyDown(key('b')); // fresh buffer → Banana
		expect(onMatch).toHaveBeenLastCalledWith(2);
	});

	it('skips disabled items', () => {
		const { onMatch, api } = setup({ disabledIndices: [0] }); // Apple disabled
		api.onKeyDown(key('a'));
		expect(onMatch).toHaveBeenCalledWith(1); // Apricot
	});

	it('ignores control keys and modifier chords', () => {
		const { onMatch, api } = setup();
		expect(api.onKeyDown(key('ArrowDown'))).toBe(false);
		expect(api.onKeyDown(new KeyboardEvent('keydown', { key: 'a', metaKey: true }))).toBe(false);
		expect(onMatch).not.toHaveBeenCalled();
	});

	it('does not treat a bare Space as typeahead', () => {
		const { onMatch, api } = setup();
		expect(api.onKeyDown(key(' '))).toBe(false);
		expect(onMatch).not.toHaveBeenCalled();
	});
});
