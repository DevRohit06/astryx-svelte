import { untrack } from 'svelte';
import { useMediaQuery } from './use-media-query.svelte.js';
import { useTheme } from '../theme/use-theme.svelte.js';

/**
 * Smooths bursty streamed text into a steady character-by-character reveal,
 * ported from Astryx's `hooks/useStreamingText.ts`.
 *
 * Upstream returns a plain `string`, which cannot stay live across a Svelte
 * component's lifetime, so the two halves of the signature split the way the
 * rest of this port splits React hooks: the arguments come in as **getters**
 * (upstream reads them on every render) and the result comes back as an object
 * whose `current` is a `$state` read — the `useThemeMode` shape.
 *
 * Two translations are worth naming:
 *
 * - **The during-render comparisons become one `$effect.pre`.** Upstream
 *   compares `prevTargetLenRef` / `prevIsStreamingRef` in the render body,
 *   which has no Svelte counterpart (the `useMenuHover` problem). A pre-effect
 *   is the closest equivalent that keeps the timing: it does not run during
 *   SSR — where upstream's first render also makes no state change, because
 *   both refs are seeded to match — and on the client it runs before the DOM
 *   write, so a cleared or ended stream is reflected in the same paint React
 *   would reflect it in.
 * - **There is one `displayedLen`, not a state/ref pair.** Upstream keeps
 *   `displayedLenRef` alongside the state purely so the rAF loop can read the
 *   current value without re-subscribing. Svelte tracks dependencies during
 *   *synchronous* effect execution only, so a read inside the rAF callback is
 *   already untracked and the mirror has no job left. The `$effect.pre` read
 *   *is* synchronous, so that one is `untrack`ed explicitly.
 */

/**
 * Speed presets for streaming text reveal.
 * - `'natural'` — steady character-by-character reveal (~2 chars/frame)
 * - `'fast'` — faster reveal, scales with backlog (~4 chars/frame)
 * - `'instant'` — no animation, returns full text immediately
 */
export type StreamingTextSpeed = 'natural' | 'fast' | 'instant';

export interface UseStreamingTextOptions {
	/**
	 * Speed of text reveal.
	 * @default 'natural'
	 */
	speed?: StreamingTextSpeed;
}

export interface StreamingTextState {
	/** The text revealed so far. Equals the target text when not streaming. */
	readonly current: string;
}

// Fallback values when no Theme provider is present
const FALLBACK_TICK_MS = 50;
const FALLBACK_TICK_MS_FAST = 8;

/**
 * Parse a CSS duration string (e.g. "175ms", "0.15s") to milliseconds.
 * Returns null if unparseable.
 */
function parseDuration(value: string): number | null {
	const ms = value.match(/^([\d.]+)ms$/);
	if (ms) {
		return parseFloat(ms[1]);
	}
	const s = value.match(/^([\d.]+)s$/);
	if (s) {
		return parseFloat(s[1]) * 1000;
	}
	return null;
}

const CHARS_PER_TICK = {
	natural: 10,
	fast: 4,
	instant: Infinity
} as const;

/**
 * Smooths bursty streamed text into a steady character-by-character reveal.
 *
 * Returns an object whose `current` grows steadily toward `targetText`. When
 * `isStreaming` is false, `current` is the full `targetText` immediately. When
 * the user prefers reduced motion, the progressive reveal is skipped entirely
 * and `current` is the full `targetText`.
 *
 * The hook advances on word and syntax boundaries, avoiding slices inside
 * markdown markers like `**`, backticks, `[]()`, etc. This prevents visual
 * glitches when the output is rendered through a markdown parser.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const displayed = useStreamingText(() => rawText, () => isStreaming);
 * </script>
 *
 * <Markdown>{displayed.current}</Markdown>
 * ```
 *
 * @example
 * ```ts
 * const displayed = useStreamingText(
 *   () => rawText,
 *   () => isStreaming,
 *   () => ({ speed: 'fast' })
 * );
 * ```
 */
export function useStreamingText(
	targetText: () => string,
	isStreaming: () => boolean,
	options: () => UseStreamingTextOptions = () => ({})
): StreamingTextState {
	const speed = $derived(options().speed ?? 'natural');
	const charsPerTick = $derived(CHARS_PER_TICK[speed]);

	// Derive tick timing from Astryx motion tokens when available.
	// natural → --duration-fast-min (frame-level cadence from the theme)
	// fast → half that, floored at 4ms (roughly 2x speed)
	const { token } = useTheme();
	const tickMs = $derived.by(() => {
		if (speed === 'instant') {
			return 0;
		}
		const base = parseDuration(token('--duration-fast-min'));
		if (base == null) {
			return speed === 'fast' ? FALLBACK_TICK_MS_FAST : FALLBACK_TICK_MS;
		}
		// Scale: use ~1/10th of the theme's fast-min duration as the per-frame tick.
		// This maps a 130ms token to ~13ms tick (natural) or ~6.5ms tick (fast).
		const tick = speed === 'fast' ? base / 20 : base / 10;
		return Math.max(4, Math.round(tick));
	});

	let displayedLen = $state(0);
	let lastTick = 0;
	let rafId: number | null = null;

	// Seeded from the first call, as upstream seeds both refs during its first
	// render — so neither comparison fires on the initial pass.
	let prevTargetLen = untrack(() => targetText().length);
	let prevIsStreaming = untrack(() => isStreaming());

	$effect.pre(() => {
		const text = targetText();
		const streaming = isStreaming();

		untrack(() => {
			// Reset when target clears (new message)
			if (text.length !== prevTargetLen) {
				prevTargetLen = text.length;
				if (text.length === 0 && displayedLen !== 0) {
					displayedLen = 0;
				}
			}

			// Snap to full text when streaming ends
			if (streaming !== prevIsStreaming) {
				prevIsStreaming = streaming;
				if (!streaming && text.length > 0) {
					displayedLen = text.length;
				}
			}
		});
	});

	// Respect the user's reduced-motion preference — skip the progressive
	// reveal and snap straight to the full text. Uses the package's SSR-safe
	// useMediaQuery (use-media-query.svelte.ts) so the read stays in sync if the
	// preference changes mid-stream.
	const prefersReducedMotion = useMediaQuery(() => '(prefers-reduced-motion: reduce)');

	// Animation loop
	$effect(() => {
		if (!isStreaming() || speed === 'instant' || prefersReducedMotion.matches) {
			return;
		}

		// Read once per subscription, matching upstream's dependency list.
		const perTick = charsPerTick;
		const interval = tickMs;

		function tick(now: number): void {
			const elapsed = now - lastTick;
			if (elapsed >= interval) {
				lastTick = now;
				// Both reads run inside a rAF callback, outside any tracking
				// context, so neither joins this effect's dependencies.
				const target = targetText();
				const currentLen = displayedLen;

				if (currentLen < target.length) {
					displayedLen = Math.min(currentLen + perTick, target.length);
				}
			}

			rafId = requestAnimationFrame(tick);
		}

		rafId = requestAnimationFrame(tick);
		return () => {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
		};
	});

	return {
		get current(): string {
			const text = targetText();
			if (!isStreaming() || speed === 'instant' || prefersReducedMotion.matches) {
				return text;
			}
			return text.slice(0, displayedLen);
		}
	};
}
