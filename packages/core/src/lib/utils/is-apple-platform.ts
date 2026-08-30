/**
 * Platform detection, ported from Astryx's `utils/isApplePlatform.ts`.
 *
 * The single platform test behind `useHotkeys` and `Kbd`. New at upstream
 * 0.5.1, which consolidated several scattered copies into this one.
 *
 * **Deliberately absent from `utils/index.ts`**, exactly as upstream leaves it:
 * their `src/index.ts` does `export * from './utils'`, so naming it on that
 * barrel would publish it as API. Import it by path, on the same standing as
 * `interaction-modality.ts` and `rtlMirrorAttrs`.
 */

/**
 * Detects whether the current platform is macOS/iOS.
 *
 * Prefers the User-Agent Client Hints API when it names a platform (modern
 * Chrome/Edge), and falls back to `navigator.platform` (deprecated but
 * universally supported) when it names none.
 */
export function isApplePlatform(): boolean {
	if (typeof navigator === 'undefined') {
		return false;
	}
	const uaData = 'userAgentData' in navigator ? navigator.userAgentData : null;
	if (uaData && typeof uaData === 'object' && 'platform' in uaData) {
		const uaPlatform = (uaData as { platform?: unknown }).platform;
		const named = typeof uaPlatform === 'string' ? uaPlatform.trim() : '';
		// A value that names nothing is no answer, not a negative one: builds
		// that rewrite their client-hints identity ship '', and 'Unknown' is the
		// spec's own sentinel for "cannot say". Both fall through rather than
		// reading as "not Apple".
		if (named !== '' && named.toLowerCase() !== 'unknown') {
			return /mac/i.test(named);
		}
	}
	return /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? '');
}
