import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTypeahead } from '$lib/hooks/use-typeahead.js';

/**
 * Astryx's `hooks/useTypeahead.test.tsx` at **v0.4.5**, all 16 cases, in
 * upstream's order and with its titles and assertions. None dropped: the file
 * has no `displayName` case, no non-JSX construction form and no snapshot, so
 * nothing in it is React-only.
 *
 * Named `use-typeahead` rather than the hook-suite convention of dropping the
 * `use-` prefix (`list-focus`, `overflow`, `hotkeys`): batch 6 landed the
 * `Typeahead` *component*, whose own suite is `typeahead.svelte.test.ts`, and
 * the two are unrelated — this hook is the type-to-select buffer `DropdownMenu`
 * and `NavHeadingMenu` use.
 *
 * ## Why this is a `.test.ts` and not a `.svelte.test.ts`
 *
 * It was the latter until this port of the 0.4.1 suite. `useTypeahead` takes a
 * keyboard event and returns a boolean: it reads `key`, `ctrlKey` and `metaKey`
 * off that event and touches no node, no window and no layout. That is the same
 * pure-module case as `compute-overflow` and `resolve`, whose headers already
 * name this file as one that follows the rule — it simply had not moved yet. In
 * the **server** project it runs anywhere, including where a browser cannot bind
 * a port; in the client project it spent a Chromium boot to test a modulo.
 *
 * The one thing node lacks is the `KeyboardEvent` constructor, so `key()` builds
 * a stand-in over node's real `Event` carrying exactly the fields the DOM spec
 * puts on a keyboard event that this hook can see. That is not a step down from
 * upstream: `@testing-library/react` runs under jsdom, so upstream's
 * `new KeyboardEvent(...)` is a JavaScript reimplementation too. It stops at
 * those fields deliberately — `getModifierState` and the rest are absent, so a
 * future `useTypeahead` that reaches for one fails loudly here rather than
 * quietly passing against a fake.
 *
 * No `renderHook` stand-in is needed either: the hook holds no reactive state
 * and never touches component context, so each case calls it where upstream
 * needs `result.current`. Upstream's inline
 * `new KeyboardEvent('keydown', {key, ctrlKey})` for the chorded cases becomes
 * `key(k, {ctrlKey: true})`; the assertions around it are untouched.
 *
 * Only `setTimeout`/`clearTimeout` are faked. The buffer reset is the hook's
 * sole timer and nothing else here reads the clock, so upstream's blanket
 * `vi.useFakeTimers()` is narrowed rather than copied.
 */

/**
 * Node has no `KeyboardEvent` global. This stand-in carries the key and the four
 * modifier flags and nothing more — see the file header for why that is the
 * whole of it.
 */
class KeyboardEventStandIn extends Event {
	readonly key: string;
	readonly altKey: boolean;
	readonly ctrlKey: boolean;
	readonly metaKey: boolean;
	readonly shiftKey: boolean;

	constructor(type: string, init: KeyboardEventInit = {}) {
		super(type);
		this.key = init.key ?? '';
		this.altKey = init.altKey ?? false;
		this.ctrlKey = init.ctrlKey ?? false;
		this.metaKey = init.metaKey ?? false;
		this.shiftKey = init.shiftKey ?? false;
	}
}

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

function key(k: string, modifiers: KeyboardEventInit = {}): KeyboardEvent {
	return new KeyboardEventStandIn('keydown', {
		key: k,
		...modifiers
	}) as unknown as KeyboardEvent;
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
		expect(api.onKeyDown(key('a', { metaKey: true }))).toBe(false);
		expect(onMatch).not.toHaveBeenCalled();
	});

	it('does not treat a bare Space as typeahead', () => {
		const { onMatch, api } = setup();
		expect(api.onKeyDown(key(' '))).toBe(false);
		expect(onMatch).not.toHaveBeenCalled();
	});

	it('extends a live buffer with a space', () => {
		const onMatch = vi.fn();
		const api = useTypeahead(() => ({
			getItemLabels: () => ['Newark', 'New York'],
			onMatch
		}));
		for (const k of 'new ') {
			api.onKeyDown(key(k));
		}
		api.onKeyDown(key('y'));
		// "new y" reaches New York; a space that ended the buffer instead would
		// leave "newy", which matches nothing.
		expect(onMatch).toHaveBeenLastCalledWith(1);
	});

	it('ignores a Space chorded with ctrl or meta even mid-buffer', () => {
		const onMatch = vi.fn();
		const api = useTypeahead(() => ({
			getItemLabels: () => ['Melon', 'New York'],
			onMatch
		}));
		expect(api.onKeyDown(key('n'))).toBe(true);
		expect(onMatch).toHaveBeenLastCalledWith(1);

		// A chord is not typing. Consuming it would append a raw space and leave
		// the buffer as "n ", poisoning every keystroke until the reset window.
		expect(api.onKeyDown(key(' ', { ctrlKey: true }))).toBe(false);
		expect(api.onKeyDown(key(' ', { metaKey: true }))).toBe(false);

		api.onKeyDown(key('e'));
		expect(onMatch).toHaveBeenCalledTimes(2);
		expect(onMatch).toHaveBeenLastCalledWith(1);
	});

	it('starts a fresh single-character search after the current item', () => {
		const { onMatch, api } = setup({ current: 0 }); // Apple is current
		api.onKeyDown(key('a'));
		// A single-character search begins at current + 1, so pressing the current
		// item's own initial advances instead of re-matching it into a dead key.
		expect(onMatch).toHaveBeenCalledWith(1); // Apricot
	});

	it('searches from the top when there is no current item', () => {
		// The last item also matches, so this distinguishes "from the top" from
		// wrapping backwards off -1 and hitting the bottom of the list first.
		const onMatch = vi.fn();
		const api = useTypeahead(() => ({
			getItemLabels: () => ['Apple', 'Berry', 'Avocado'],
			onMatch,
			getCurrentIndex: () => -1
		}));
		api.onKeyDown(key('a'));
		expect(onMatch).toHaveBeenCalledWith(0); // Apple, not Avocado
	});

	it('keeps the current item in range once the buffer is multi-character', () => {
		const { onMatch, api } = setup({ current: 0 });
		api.onKeyDown(key('a')); // single char: advances to Apricot
		expect(onMatch).toHaveBeenLastCalledWith(1);
		api.onKeyDown(key('p')); // "ap" refines, so Apple is a candidate again
		expect(onMatch).toHaveBeenLastCalledWith(0);
	});

	it('skips unmatchable label slots without shifting the reported index', () => {
		// Callers may pass null/empty entries to keep the index mapping 1:1 with
		// their own items — menus pass el.textContent, which can be null.
		const onMatch = vi.fn();
		const api = useTypeahead(() => ({
			getItemLabels: () => [null, '', '   ', undefined, 'Apple'],
			onMatch
		}));
		api.onKeyDown(key('a'));
		expect(onMatch).toHaveBeenCalledWith(4);
	});

	it('treats any negative or stale current index safely', () => {
		// A sentinel other than -1, and an index left over from a longer list:
		// neither may search backwards or report an index outside the list.
		const fromBelowZero = vi.fn();
		const below = useTypeahead(() => ({
			getItemLabels: () => LABELS,
			onMatch: fromBelowZero,
			getCurrentIndex: () => -5
		}));
		below.onKeyDown(key('a'));
		expect(fromBelowZero).toHaveBeenCalledWith(0); // Apple, from the top

		const fromStale = vi.fn();
		const stale = useTypeahead(() => ({
			getItemLabels: () => LABELS,
			onMatch: fromStale,
			getCurrentIndex: () => 7
		}));
		stale.onKeyDown(key('b'));
		expect(fromStale).toHaveBeenCalledWith(2); // Banana, in range
	});

	it('wraps onto the only item when the list has one entry', () => {
		// "Advance past the current item" is about cycling; with one item the
		// cycle is itself. The caller decides whether that is a no-op.
		const onMatch = vi.fn();
		const api = useTypeahead(() => ({
			getItemLabels: () => ['Apple'],
			onMatch,
			getCurrentIndex: () => 0
		}));
		expect(api.onKeyDown(key('a'))).toBe(true);
		expect(onMatch).toHaveBeenCalledWith(0);
	});

	it('matches characters composed with Option/Alt', () => {
		const onMatch = vi.fn();
		const api = useTypeahead(() => ({
			getItemLabels: () => ['Ångström', 'Berlin'],
			onMatch,
			getCurrentIndex: () => -1
		}));
		// Option+a on macOS emits a printable 'å' with altKey set. Excluding it
		// makes accented labels untypeable; real chords still carry ctrl/meta.
		const handled = api.onKeyDown(key('å', { altKey: true }));
		expect(handled).toBe(true);
		expect(onMatch).toHaveBeenCalledWith(0);
	});
});
