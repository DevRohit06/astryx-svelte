/**
 * Ported from Astryx's `utils/characters.ts`.
 *
 * `characterCount`, `firstCharacter` and `truncateCharacters` — replacements for
 * `.length` / `.charAt(0)` / `.slice(0, n)` that measure and cut user-visible
 * strings the way a person reads them, so an emoji, a flag or an accented letter
 * counts as one character rather than as its internal storage units.
 *
 * Consumed by `Avatar`, `TextArea`, `PowerSearch` and `Table`, each of which
 * carried its own copy of the segmenter before upstream extracted this at 0.4.5.
 */

/**
 * Reuse a single segmenter when the runtime supports `Intl.Segmenter`.
 * `grapheme` is the Intl granularity name for a user-perceived character.
 */
const characterSegmenter =
	typeof Intl.Segmenter === 'function'
		? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
		: null;

/**
 * Split a string into user-perceived characters. The code-point fallback keeps
 * surrogate pairs intact but may split joined emoji sequences and flag pairs on
 * runtimes without `Intl.Segmenter`.
 */
function splitCharacters(str: string): string[] {
	if (characterSegmenter) {
		return [...characterSegmenter.segment(str)].map((s) => s.segment);
	}
	return [...str];
}

/**
 * Number of characters in a string — the count a person would give, where one
 * emoji, flag, or accented letter is one character. Replacement for `.length` on
 * user-visible strings, which counts internal storage units instead.
 */
export function characterCount(str: string): number {
	if (str === '') {
		return 0;
	}
	return splitCharacters(str).length;
}

/**
 * The first character of a string, or `''` when empty. Replacement for
 * `.charAt(0)`, which can return half of an emoji. Reads only the first
 * character, so cost does not scale with the length of the string.
 */
export function firstCharacter(str: string): string {
	if (characterSegmenter) {
		const first = characterSegmenter.segment(str)[Symbol.iterator]().next();
		return first.done ? '' : first.value.segment;
	}
	const codePoint = str.codePointAt(0);
	return codePoint == null ? '' : String.fromCodePoint(codePoint);
}

/**
 * Truncate to at most `max` characters, ellipsis included: strings within `max`
 * characters pass through unchanged; longer strings are cut so the result —
 * content plus `ellipsis` — is exactly `max` characters (or just the ellipsis,
 * when `max` is smaller than the ellipsis itself). Replacement for
 * `str.slice(0, n) + '…'`, which can cut an emoji in half.
 *
 * @example
 * ```ts
 * truncateCharacters('abcdefghij', 5); // 'abcd…'
 * truncateCharacters('abcdefghij', 8, '...'); // 'abcde...'
 * ```
 */
export function truncateCharacters(str: string, max: number, ellipsis = '…'): string {
	const characters = splitCharacters(str);
	if (characters.length <= max) {
		return str;
	}
	const keep = Math.max(max - characterCount(ellipsis), 0);
	return characters.slice(0, keep).join('') + ellipsis;
}
