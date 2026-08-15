import { useAnnounce } from './use-announce.js';

/**
 * Ported from Astryx's `hooks/useClipboard.ts`.
 *
 * Owns the copy-to-clipboard behavior shared by `CodeBlock` and `Timestamp` —
 * the clipboard write, the transient "copied" flag with its reset timer, and
 * the polite screen-reader announcement — so each call site is a thin control
 * over one implementation instead of re-deriving the timer/announce details
 * independently.
 */

/**
 * How long `isCopied` stays true after a successful copy before reverting.
 * Long enough for the copied confirmation (e.g. a copy → check icon flip) to
 * register without lingering.
 */
const DEFAULT_RESET_AFTER_MS = 2000;

/**
 * Options for {@link useClipboard}.
 */
export interface UseClipboardOptions {
	/**
	 * Message announced to a polite live region on a successful copy. Swapping a
	 * control's `aria-label` alone is not reliably announced by screen readers,
	 * so pass the localized confirmation (e.g. "Copied") to have it spoken.
	 * Omit to skip the announcement.
	 */
	announce?: string;
	/**
	 * Milliseconds `isCopied` stays true after a successful copy before it
	 * reverts to false.
	 * @default 2000
	 */
	resetAfterMs?: number;
}

/**
 * Return value of {@link useClipboard}.
 */
export interface UseClipboardReturn {
	/**
	 * Write `text` to the clipboard. On success, flips `isCopied` to true,
	 * announces the configured message, and (re)starts the reset timer;
	 * resolves `true`. A clipboard rejection is a silent no-op that leaves the
	 * copied state unchanged and resolves `false`.
	 */
	copy: (text: string) => Promise<boolean>;
	/**
	 * True for `resetAfterMs` after the most recent successful copy.
	 *
	 * A getter, not a plain boolean: upstream returns the value because React
	 * re-runs the hook body on every render, and here it has to stay live for a
	 * `$derived` to track. Same convention as `useThemeName` and `useIndicator`.
	 */
	readonly isCopied: boolean;
}

/**
 * Copy-to-clipboard behavior: the clipboard write, a transient `isCopied`
 * flag with its own reset timer, and an optional polite screen-reader
 * announcement — the block otherwise re-derived at every copy affordance.
 *
 * The behavior is a hook and the control (an icon button, a menu item, a value
 * chip) is a thin shell over it. Rapid re-copies restart the reset timer so the
 * confirmation always lasts the full duration, and the timer is cleaned up when
 * the consumer is destroyed.
 *
 * Options arrive as a getter, per this port's hook convention, so a call site
 * whose `announce` string comes from the translator stays current when the
 * locale changes.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const t = useTranslator();
 *   const clipboard = useClipboard(() => ({ announce: t('@astryx.codeBlock.copied') }));
 * </script>
 *
 * <IconButton
 *   label={clipboard.isCopied ? 'Copied' : 'Copy'}
 *   onclick={() => void clipboard.copy(text)}
 * />
 * ```
 */
export function useClipboard(options: () => UseClipboardOptions = () => ({})): UseClipboardReturn {
	const announce = useAnnounce();

	let isCopied = $state(false);
	let resetTimer: ReturnType<typeof setTimeout> | null = null;

	// Clear a pending "copied" reset when the consumer is destroyed. Upstream's
	// mount-once `useEffect` with an empty dependency list is `$effect` with no
	// tracked reads: the body runs once, and only the teardown does work.
	$effect(() => {
		return () => {
			if (resetTimer != null) {
				clearTimeout(resetTimer);
			}
		};
	});

	async function copy(text: string): Promise<boolean> {
		const { announce: announceMessage, resetAfterMs = DEFAULT_RESET_AFTER_MS } = options();

		try {
			await navigator.clipboard.writeText(text);
			isCopied = true;
			if (announceMessage) {
				announce(announceMessage);
			}
			// Restart the reset timer on every copy — otherwise a rapid re-copy
			// is reverted early by the previous copy's timer.
			if (resetTimer != null) {
				clearTimeout(resetTimer);
			}
			resetTimer = setTimeout(() => {
				resetTimer = null;
				isCopied = false;
			}, resetAfterMs);
			return true;
		} catch {
			// Clipboard failures leave the copied state unchanged.
			return false;
		}
	}

	return {
		copy,
		get isCopied(): boolean {
			return isCopied;
		}
	};
}
