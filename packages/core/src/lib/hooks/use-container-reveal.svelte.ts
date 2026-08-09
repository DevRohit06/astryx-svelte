import { onDestroy, untrack } from 'svelte';
import { sx } from '../internal/sx.js';
import { POOL, POOL_SIZE, type RevealSlot } from './container-reveal.pool.stylex.js';
import { useDevWarning } from './use-dev-warning.svelte.js';

/**
 * A headless hover/focus reveal primitive, ported from Astryx's
 * `hooks/useContainerReveal.ts`.
 *
 * Gives a container a scoped hover/focus-within trigger that reveals or
 * conceals content inside it, entirely in CSS — no hover state in JS, no update
 * on hover. The caller authors NO StyleX: the hook hands out a marker and the
 * matching reveal styles from a pre-compiled pool
 * (`container-reveal.pool.stylex.ts`, which explains why it is a pool).
 *
 * ACCESSIBILITY (WCAG 2.2 by construction):
 * - Revealed content is visually hidden at rest via position + opacity, so it
 *   stays in the accessibility tree and tab order — never `display: none`.
 * - Keyboard: revealed on `:focus-within`, so tabbing in shows it.
 * - Touch: always visible on coarse pointers; never gated behind hover.
 * - Concealed (inverted) content is a mouse-only visual swap: it ignores
 *   `:focus-within` (a keyboard user must never watch content vanish) and stays
 *   visible on touch and in the a11y tree.
 * - Motion: honors `prefers-reduced-motion`.
 *
 * **No render split.** The React→Svelte rule is that a hook returning a
 * `ReactNode` becomes a hook plus a layer component (`renderTooltip` →
 * `<TooltipLayer>`, `useInputStatusIcon` → `<InputStatusIcon>`). This one
 * returns *props objects*, not a node, so there is nothing to split: the two
 * getters come back as `{class, style}` — Svelte's attribute names for React's
 * `{className, style}` — and spread or compose straight onto an element.
 *
 * **`isEnabled` is read once, and that is upstream's semantics, not a
 * simplification.** Upstream claims the slot in a `useState` *initializer*, so a
 * later `isEnabled` flip never re-claims; the hook is inert or live for the
 * instance's lifetime. The options getter is therefore read `untrack`ed at
 * init — a `$derived` caller cannot accidentally subscribe the claim to
 * something that would want to change it.
 *
 * **The slot is released in `onDestroy`, not an `$effect` teardown**, and this
 * is the one deliberate divergence. Upstream releases in a `useEffect` cleanup,
 * which never runs on the server: `renderToString` runs the `useState`
 * initializer, claims a slot and drops it, so a server process leaks the whole
 * pool after `POOL_SIZE` renders and then hands every container the fallback
 * marker — recorded as an upstream bug rather than replicated. `onDestroy` is
 * the one lifecycle callback Svelte *does* run during SSR (at the end of the
 * render, after the markup is produced), so nested containers still get distinct
 * slots within a render and every slot is returned when it finishes. On the
 * client it is an ordinary unmount teardown, identical to upstream's.
 *
 * *When it finishes* is the load-bearing clause: a server render that **throws**
 * never reaches its `onDestroy` callbacks, which strands the slot and reopens
 * upstream's bug by a different route. `scheduleServerPoolReset` below is the
 * backstop, and explains itself.
 */

// Module-level free-list. Each mounted, enabled useContainerReveal claims a
// distinct pool slot so that any two CONCURRENTLY mounted containers — in
// particular a nested container inside another's revealed content — get
// different markers and cannot leak hover/focus into one another. Slots are
// returned on unmount. Sibling containers that would only ever collide when the
// pool is exhausted are harmless (a sibling is never an ancestor), so the pool
// only needs to cover the number of concurrently mounted containers, not
// instances over time.
const claimed: boolean[] = new Array(POOL_SIZE).fill(false);

interface Claim {
	/** Pool index to use. */
	index: number;
	/** True when the pool was full and this claim fell back to a shared slot. */
	isExhausted: boolean;
}

// Whether the free list is per-render scratch (server) or per-mount state
// (client). The established test in this package, and the one `useTheme` and
// `useThemeMode` use.
const isServer = typeof document === 'undefined';
let isPoolResetScheduled = false;

/**
 * Drops the whole free list once the current server render has unwound.
 *
 * `onDestroy` returns a slot when a render **finishes**; a render that
 * **throws** never reaches it. The strand is permanent and compounding: after
 * `POOL_SIZE` failed renders every container in every later request claims the
 * exhausted fallback marker, which is a marker collision between nested
 * containers *and* a hydration mismatch, since the client hydrates against its
 * own untouched pool and numbers the same containers 0, 1, 2. Six 500s and the
 * process is quietly wrong for everything after them.
 *
 * A microtask is exactly the end-of-render boundary on the server: `render()`
 * runs to completion or throws inside a single task, and the queue does not
 * drain until that stack has unwound — so no reset can land in the middle of a
 * render. Nothing on the server outlives the render that made it, so resetting
 * the whole list is sound rather than merely convenient, and it collects slots
 * stranded by any cause, not only a throw. Armed once per batch, so a page with
 * six containers queues one reset rather than six.
 *
 * Not on the client, where the pool is exactly the long-lived state it looks
 * like: containers stay mounted across countless microtasks and `onDestroy` is
 * a real unmount teardown.
 *
 * The boundary is the *synchronous* render. Under Svelte's async SSR a
 * component body can resume in a later microtask turn, and a reset armed by an
 * outer container could then land before a nested one claims — handing both the
 * same marker. Nothing in this package awaits, and the synchronous `render()`
 * path throws on any async work at all, so the exposure is a consumer awaiting
 * *between* two nested reveal containers. Left as a documented edge rather than
 * guarded: every construction that closes it needs a render-boundary signal
 * Svelte does not expose to a hook.
 */
function scheduleServerPoolReset(): void {
	if (!isServer || isPoolResetScheduled) {
		return;
	}
	isPoolResetScheduled = true;
	queueMicrotask(() => {
		isPoolResetScheduled = false;
		claimed.fill(false);
	});
}

function claimSlot(): Claim {
	scheduleServerPoolReset();

	for (let i = 0; i < POOL_SIZE; i++) {
		if (!claimed[i]) {
			claimed[i] = true;
			return { index: i, isExhausted: false };
		}
	}
	// Exhausted: fall back to slot 0. Safe for siblings (a sibling is never an
	// ancestor); only nesting deeper than POOL_SIZE could reintroduce a leak.
	// Surfaced via useDevWarning so the pool can be grown.
	return { index: 0, isExhausted: true };
}

function releaseSlot(index: number, isExhausted: boolean): void {
	// A fallback claim never owned the slot exclusively; leave it as-is.
	if (!isExhausted) {
		claimed[index] = false;
	}
}

export interface UseContainerRevealOptions {
	/**
	 * When false the hook is inert: no marker is applied and content getters
	 * return no styles, so content is always shown. Lets a component gate on its
	 * own prop (e.g. `revealOn === 'hover'`).
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
	// Claim a slot for this container's lifetime. Read once, untracked — see the
	// module header for why a later `isEnabled` flip is not meant to re-claim.
	const claim = untrack(() => options().isEnabled ?? true) ? claimSlot() : null;

	onDestroy(() => {
		if (claim != null) {
			releaseSlot(claim.index, claim.isExhausted);
		}
	});

	useDevWarning(
		'useContainerReveal',
		`More than ${POOL_SIZE} reveal containers are mounted at once; nested ` +
			`containers beyond the pool may share a marker. Add markers to ` +
			`container-reveal.pool.stylex.ts and raise POOL_SIZE.`,
		() => claim?.isExhausted ?? false
	);

	if (claim == null) {
		return {
			getContainerProps: () => EMPTY,
			getContentRevealProps: () => EMPTY
		};
	}

	const slot: RevealSlot = POOL[claim.index];

	return {
		getContainerProps: () => sx(slot.marker),
		getContentRevealProps: (contentOptions: ContentRevealOptions = {}) => {
			const { isRevealInverted = false, isLayoutPreserved = false } = contentOptions;
			const style = isRevealInverted
				? isLayoutPreserved
					? slot.concealLayoutPreserved
					: slot.conceal
				: isLayoutPreserved
					? slot.revealLayoutPreserved
					: slot.reveal;
			return sx(style);
		}
	};
}
