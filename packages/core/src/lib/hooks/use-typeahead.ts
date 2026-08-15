/**
 * First-character ("type-ahead") search for a collection, ported from Astryx's
 * `hooks/useTypeahead.ts`.
 *
 * Buffers printable keystrokes, resets after `resetMs` of inactivity, matches
 * items whose label starts with the buffer, and cycles from the current index —
 * so pressing "s" repeatedly walks through the "s" items instead of sticking on
 * the first, which is the APG behaviour. Space is reserved for activation and
 * only counts as typeahead once a buffer is already open.
 *
 * It is additive and collection-agnostic: it never moves focus itself, so the
 * caller wires `onMatch` to its own focus or selection (`useListFocus`'s
 * `focusItem`, say).
 *
 * There is no React left once `useCallback` goes — two refs and a pure matching
 * loop — so this is a transcription in a plain `.ts`, and nothing requires it to
 * be called during component init. The options come in as a getter for the same
 * reason every hook in this batch does: read at *event* time, they are always
 * the current ones without a dependency list.
 */

export interface UseTypeaheadOptions {
	/**
	 * Returns the current, in-DOM-order list of item labels to match against.
	 * An entry may be `null`/empty to mark a non-matchable slot (its index is
	 * preserved so it maps 1:1 to the caller's items).
	 */
	getItemLabels: () => ReadonlyArray<string | null | undefined>;

	/**
	 * Called with the index of the matched item so the caller can focus/select
	 * it (e.g. `useListFocus`'s `focusItem`).
	 */
	onMatch: (index: number) => void;

	/**
	 * The index to start searching from — typically the currently focused item,
	 * so repeated presses of the same letter cycle through matches. Defaults to
	 * -1 (search from the top).
	 */
	getCurrentIndex?: () => number;

	/**
	 * Milliseconds of inactivity after which the typed buffer resets.
	 * @default 750
	 */
	resetMs?: number;

	/**
	 * Whether an index should be skipped (e.g. disabled items).
	 */
	isDisabled?: (index: number) => boolean;
}

export interface UseTypeaheadReturn {
	/**
	 * Keydown handler. Call it (or let it fall through) from the collection's
	 * own key handler. Returns `true` when it handled a printable character (so
	 * the caller can `preventDefault`/stop further handling), `false` otherwise.
	 */
	onKeyDown: (event: KeyboardEvent) => boolean;
	/** Clear the pending buffer (e.g. on close). */
	reset: () => void;
}

/**
 * Whether a key event represents a single printable character (a type-to-focus
 * candidate) rather than a control/navigation key or a shortcut chord.
 */
function isPrintableCharacter(event: KeyboardEvent): boolean {
	return (
		event.key.length === 1 &&
		// Alt alone is not excluded: Option+letter on macOS composes a printable
		// character (Option+a → "å"), and dropping those makes accented labels
		// untypeable. Real chords still carry ctrl or meta — including AltGr,
		// which sets ctrlKey on Windows and Linux.
		!event.ctrlKey &&
		!event.metaKey &&
		// A lone space is used for activation in menus, not typeahead-from-empty.
		event.key !== ' '
	);
}

/**
 * @example
 * ```svelte
 * <script lang="ts">
 *   const list = useListFocus(…);
 *   const typeahead = useTypeahead(() => ({
 *     getItemLabels: () => list.getItems().map((el) => el.textContent),
 *     onMatch: list.focusItem,
 *     getCurrentIndex: () => list.getItems().findIndex((el) => el === document.activeElement)
 *   }));
 *   const onkeydown = (e: KeyboardEvent) => {
 *     if (!typeahead.onKeyDown(e)) list.handleKeyDown(e);
 *   };
 * </script>
 * ```
 */
export function useTypeahead(options: () => UseTypeaheadOptions): UseTypeaheadReturn {
	// Upstream's two refs — mutable, never rendered, so never reactive.
	let buffer = '';
	let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

	function reset(): void {
		buffer = '';
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
	}

	function scheduleReset(resetMs: number): void {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			buffer = '';
			timeout = undefined;
		}, resetMs);
	}

	function onKeyDown(event: KeyboardEvent): boolean {
		const { getItemLabels, onMatch, getCurrentIndex, resetMs = 750, isDisabled } = options();

		// A bare Space with no active buffer is not typeahead (menus activate on
		// Space); once the user is mid-typing, Space extends the query. Chorded
		// with ctrl or meta it is neither — that is an OS or IME shortcut, and
		// consuming it would append a raw space that poisons the whole buffer.
		const isSpaceMidType =
			event.key === ' ' && !event.ctrlKey && !event.metaKey && buffer.length > 0;
		if (!isPrintableCharacter(event) && !isSpaceMidType) {
			return false;
		}

		const labels = getItemLabels();
		if (labels.length === 0) {
			return false;
		}

		// Pressing the SAME single character repeatedly cycles to the next match
		// rather than filtering deeper (APG behavior).
		const char = event.key.toLowerCase();
		const isRepeatSameChar = buffer.length > 0 && buffer.split('').every((c) => c === char);
		const nextBuffer = isRepeatSameChar ? char : buffer + char;
		buffer = nextBuffer;
		scheduleReset(resetMs);

		const current = getCurrentIndex?.() ?? -1;
		const count = labels.length;
		const hasCurrent = current >= 0;
		const start = hasCurrent ? current : 0;
		// A single-character search starts AFTER the current item, so pressing a
		// letter walks to the next item beginning with it instead of re-matching
		// the one already selected (native <select> and APG getIndexByLetter).
		// Once the buffer is longer it is refining a match, so the current item
		// stays in range. With nothing current there is nothing to advance past.
		const offset = hasCurrent && nextBuffer.length === 1 ? 1 : 0;

		for (let i = 0; i < count; i++) {
			const index = (start + offset + i + count) % count;
			if (isDisabled?.(index)) {
				continue;
			}
			const label = labels[index];
			if (label != null && label.trim().toLowerCase().startsWith(nextBuffer)) {
				onMatch(index);
				return true;
			}
		}
		return true;
	}

	return { onKeyDown, reset };
}
