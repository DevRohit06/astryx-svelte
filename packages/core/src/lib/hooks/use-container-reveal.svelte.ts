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
 * Two levers sit on top of the pointer, both still CSS-only. On the container:
 * `hoverDelay` (dwell before the reveal starts — the Tooltip / HoverCard intent
 * gate applied to a reveal) and `forceState` (pin the trigger state a caller
 * owns: a motion gate, a scroll, an open menu). On a single piece of content:
 * `forceVisibility`, which pins how THAT element looks. State belongs to the
 * container because one container feeds children whose looks are opposite;
 * appearance belongs to the element, where it is unambiguous. Neither lever can
 * hide content from a keyboard user — see ACCESSIBILITY.
 *
 * ACCESSIBILITY (WCAG 2.2 by construction):
 * - Revealed content is visually hidden at rest via position + opacity, so it
 *   stays in the accessibility tree and tab order — never `display: none`.
 * - Keyboard: revealed on `:focus-within`, so tabbing in shows it — with no
 *   dwell to wait through, and neither an inactive container nor a forced-hidden
 *   element can keep it dark.
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

export interface ContainerRevealOptions {
	/**
	 * Pin the container's trigger state instead of letting the pointer drive it.
	 * `'active'` reads as pointed-at and `'inactive'` as at rest; omit it — the
	 * default — to leave the container on hover and focus.
	 *
	 * State, not appearance: what each child then looks like is the child's own
	 * business (revealed content fades in on `'active'`, inverted content fades
	 * out). This is the lever for state a caller owns — a motion gate over a
	 * list, a scroll in progress, a row whose menu is open and must stay lit.
	 *
	 * `'inactive'` never overrides keyboard focus or a coarse pointer: the
	 * container still reveals on `:focus-within` and stays revealed on touch, so
	 * it cannot hide content from a keyboard or touch user.
	 */
	forceState?: 'active' | 'inactive';
	/**
	 * Hover-intent gate, in milliseconds: how long the pointer must rest on the
	 * container before the reveal starts. A pointer that passes through leaves
	 * nothing painted behind it, which is what keeps a list of rows quiet while
	 * the cursor sweeps across it.
	 *
	 * Mouse-only, like `Tooltip`'s and `HoverCard`'s `delay`: keyboard focus and
	 * touch reveal immediately. It survives `prefers-reduced-motion` — an intent
	 * gate is timing, not motion.
	 * @default 0
	 */
	hoverDelay?: number;
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
	/**
	 * Pin THIS element's appearance, whatever the container's state: `'shown'`
	 * keeps it visible, `'hidden'` keeps it out. Omit it — the default — to
	 * follow the container.
	 *
	 * Appearance, not state: it says how one element looks, so it is unambiguous
	 * where the container's `forceState` cannot be (a container feeds revealed
	 * and inverted children at once).
	 *
	 * `'hidden'` yields to focus — a forced-hidden element is still mounted and
	 * tabbable, so it reappears when focus lands inside it.
	 */
	forceVisibility?: 'shown' | 'hidden';
}

export interface UseContainerRevealReturn {
	/** Spread onto the container whose hover/focus-within drives the reveal. */
	getContainerProps: (options?: ContainerRevealOptions) => { class?: string; style?: string };
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
 *   const container = $derived(reveal.getContainerProps({ hoverDelay: 120 }));
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
		getContainerProps: (containerOptions: ContainerRevealOptions = {}) => {
			if (options().isEnabled === false) {
				return EMPTY;
			}
			const { forceState, hoverDelay = 0 } = containerOptions;
			return sx(
				styles.container,
				hoverDelay > 0 && styles.hoverDelay(`${hoverDelay}ms`),
				forceState === 'inactive' && styles.stateInactive,
				forceState === 'active' && styles.stateActive
			);
		},
		getContentRevealProps: (contentOptions: ContentRevealOptions = {}) => {
			if (options().isEnabled === false) {
				return EMPTY;
			}
			const {
				isRevealInverted = false,
				isLayoutPreserved = false,
				forceVisibility
			} = contentOptions;
			const style = isRevealInverted
				? isLayoutPreserved
					? styles.concealLayoutPreserved
					: styles.conceal
				: isLayoutPreserved
					? styles.revealLayoutPreserved
					: styles.reveal;
			return sx(
				style,
				forceVisibility === 'shown' && styles.contentShown,
				forceVisibility === 'hidden' &&
					(isLayoutPreserved ? styles.contentHiddenLayoutPreserved : styles.contentHidden)
			);
		}
	};
}
