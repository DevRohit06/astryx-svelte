import type { ChatComposerInputHandle, ChatComposerToken } from './chat-composer-input.svelte';

/**
 * Paste-as-token behaviour for the composer, ported from Astryx's
 * `Chat/useChatPasteAsToken.ts`.
 *
 * Intercepts paste events and converts long text into a token chip instead of
 * inserting raw text into the contentEditable. Short pastes pass through
 * normally.
 *
 * A plain `.ts` module, not `.svelte.ts`: the hook owns no state and runs no
 * effect — upstream's `useCallback` exists only to keep an identity stable
 * across renders, which a closure created once already is. `inputRef` is a
 * **getter** (the handle does not exist until the input has mounted).
 *
 * `threshold` and `toToken` are read *inside* `onPaste` rather than destructured
 * at call time. Upstream lists both in `useCallback`'s dependency array, so a
 * caller that changes them gets the new value on the next paste; destructuring
 * would freeze whatever was passed when the hook was first called. Reading
 * through `options` costs nothing for the plain-value case and lets a caller
 * pass `get threshold() { … }` to track a reactive source.
 */

export interface UseChatPasteAsTokenOptions {
	/** The composer input's imperative handle. Upstream passes a `RefObject`. */
	inputRef: () => ChatComposerInputHandle | null;

	/**
	 * Character count threshold — pastes longer than this become tokens.
	 * @default 200
	 */
	threshold?: number;

	/**
	 * Convert pasted text into a token. Return the token to insert.
	 * @default Creates a neutral badge with a character count label.
	 */
	toToken?: (text: string) => ChatComposerToken;
}

export interface UseChatPasteAsTokenReturn {
	/**
	 * Pass as the `onPaste` prop on `ChatComposerInput`. Returns true when the
	 * paste was converted to a token.
	 */
	onPaste: (event: ClipboardEvent, text: string) => boolean;
}

function defaultToToken(text: string): ChatComposerToken {
	const lines = text.split('\n').length;
	const chars = text.length;
	const label = lines > 1 ? `${lines} lines, ${chars} chars` : `${chars} chars`;
	return {
		value: text,
		label,
		variant: 'neutral' as const
	};
}

export function useChatPasteAsToken(
	options: UseChatPasteAsTokenOptions
): UseChatPasteAsTokenReturn {
	function onPaste(_event: ClipboardEvent, text: string): boolean {
		const threshold = options.threshold ?? 200;

		if (text.length <= threshold) {
			return false;
		}

		const token = (options.toToken ?? defaultToToken)(text);
		options.inputRef()?.insertToken(token);
		return true;
	}

	return { onPaste };
}
