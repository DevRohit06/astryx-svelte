/**
 * Key display/label tables and platform detection for Kbd, ported from
 * Astryx's `src/Kbd/Kbd.tsx`. Kept out of the `.svelte` file so the component
 * stays markup, and out of `kbd.stylex.ts` since none of it is styling.
 */

/**
 * Visual glyph per key name. `mod` is absent deliberately — it resolves at
 * render time from the detected platform.
 */
const KEY_DISPLAY: Record<string, string> = {
	ctrl: '⌃', // ⌃
	alt: '⌥', // ⌥
	shift: '⇧', // ⇧
	enter: '↵', // ↵
	backspace: '⌫', // ⌫
	escape: 'Esc',
	tab: '⇥', // ⇥
	up: '↑',
	down: '↓',
	left: '←',
	right: '→',
	plus: '+'
};

/**
 * Spoken labels for the same keys. The glyphs above are announced meaninglessly
 * by assistive tech, so the shortcut's accessible name is built from these
 * words instead.
 */
const KEY_LABEL: Record<string, string> = {
	ctrl: 'Control',
	alt: 'Alt',
	shift: 'Shift',
	enter: 'Enter',
	backspace: 'Backspace',
	escape: 'Escape',
	tab: 'Tab',
	up: 'Up arrow',
	down: 'Down arrow',
	left: 'Left arrow',
	right: 'Right arrow',
	plus: 'Plus'
};

/** Split a shortcut string such as `mod+shift+p` into normalised key names. */
export function parseKeys(keys: string): string[] {
	return keys.split('+').map((key) => key.trim().toLowerCase());
}

export function getKeyDisplay(key: string, isMac: boolean): string {
	if (key === 'mod') return isMac ? '⌘' : 'Ctrl';
	return KEY_DISPLAY[key] ?? key.toUpperCase();
}

export function getKeyLabel(key: string, isMac: boolean): string {
	if (key === 'mod') return isMac ? 'Command' : 'Control';
	return KEY_LABEL[key] ?? key.toUpperCase();
}

/**
 * Whether this is macOS or iOS, which decides what `mod` renders as.
 *
 * Prefers User-Agent Client Hints and falls back to `navigator.platform` —
 * deprecated, but still shipped everywhere and the only option in Safari and
 * Firefox.
 */
export function detectMac(): boolean {
	if (typeof navigator === 'undefined') return false;

	const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
	if (uaData && typeof uaData === 'object' && 'platform' in uaData) {
		return /mac/i.test(uaData.platform ?? '');
	}

	return /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? '');
}
