import { sx } from '../internal/sx.js';
import { styles } from './container-reveal.stylex.js';

/**
 * A headless hover/focus reveal primitive, ported from Astryx's
 * `hooks/useContainerReveal.ts`.
 *
 * Gives a container a scoped hover/focus-within trigger that reveals (or
 * conceals) content inside it, entirely in CSS — no hover state in JS, no
 * re-render on hover. The caller authors NO StyleX: the hook hands out the
 * container style and the matching content styles.
 *
 * Scoping is by inheritance: the container publishes its reveal state as
 * custom properties on itself and the content reads them, so a nested container
 * shadows its ancestor's state for its own subtree. See
 * `container-reveal.stylex.ts` for why that replaced a marker pool at upstream
 * 0.4.0, and what the pool was working around.
 *
 * Two behavioural consequences of that change, both upstream's (#4955):
 * a list longer than six rows no longer exhausts a fixed pool and warns, and
 * `isEnabled` takes effect **after mount** — it is read on every call rather
 * than deciding a one-time slot claim.
 *
 * ACCESSIBILITY (WCAG 2.2 by construction):
 * - Revealed content is visually hidden at rest via position + opacity, so it
 *   stays in the accessibility tree and tab order — never `display: none`.
 * - Keyboard: revealed on `:focus-within`, so tabbing in shows it.
 * - Touch: always visible on coarse pointers; never gated behind hover.
 * - Concealed (inverted) content is a mouse-only visual swap: it ignores
 *   `:focus-within` (a keyboard user must never watch content vanish) and stays
 *   visible on touch and in the a11y tree.
 * - Motion: honours `prefers-reduced-motion`.
 */

export interface UseContainerRevealOptions {
	/**
	 * When false the hook is inert: the container gets no styles and content
	 * getters return no styles, so content is always shown. Read on every call,
	 * so a component can flip it with its own prop (e.g. `revealOn === 'hover'`).
	 * @default true
	 */
	isEnabled?: boolean;
}

export interface ContentRevealOptions {
	/**
	 * Conceal-on-hover instead of reveal-on-hover: content is visible at rest
	 * and fades out while the container is hovered. Mouse-only and visual —
	 * stays in the a11y tree, ignores focus-within, stays visible on touch.
	 * @default false
	 */
	isRevealInverted?: boolean;
	/**
	 * Reserve the content's layout box while hidden (opacity-only) instead of
	 * collapsing it, to avoid layout shift when it appears.
	 * @default false
	 */
	isLayoutPreserved?: boolean;
}

export interface UseContainerRevealReturn {
	/** Spread onto the container whose hover/focus-within drives the reveal. */
	getContainerProps: () => { class?: string; style?: string };
	/** Spread onto each revealed / concealed child. */
	getContentRevealProps: (options?: ContentRevealOptions) => { class?: string; style?: string };
}

const EMPTY = Object.freeze({});

/**
 * Scoped, CSS-only hover/focus reveal for content inside a container.
 *
 * Options arrive as a getter, per this port's hook convention. Upstream reads
 * `isEnabled` on every render; here the getters read it on every call, which is
 * the same thing — and is why the returned functions are plain closures rather
 * than a memoised object. Upstream's `useMemo` exists to keep the returned
 * object's identity stable across re-renders that do not happen here.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const reveal = useContainerReveal(() => ({ isEnabled: revealOn === 'hover' }));
 *   const container = $derived(reveal.getContainerProps());
 *   const actions = $derived(reveal.getContentRevealProps());
 * </script>
 *
 * <div class={cx(row.class, container.class)}>
 *   {label}
 *   <span class={cx(actionStyles.class, actions.class)}>{@render children()}</span>
 * </div>
 * ```
 */
export function useContainerReveal(
	options: () => UseContainerRevealOptions = () => ({})
): UseContainerRevealReturn {
	return {
		getContainerProps: () => {
			if (options().isEnabled === false) {
				return EMPTY;
			}
			return sx(styles.container);
		},
		getContentRevealProps: (contentOptions: ContentRevealOptions = {}) => {
			if (options().isEnabled === false) {
				return EMPTY;
			}
			const { isRevealInverted = false, isLayoutPreserved = false } = contentOptions;
			const style = isRevealInverted
				? isLayoutPreserved
					? styles.concealLayoutPreserved
					: styles.conceal
				: isLayoutPreserved
					? styles.revealLayoutPreserved
					: styles.reveal;
			return sx(style);
		}
	};
}
