/**
 * The counterpart to React's `useOptimistic` + `useTransition` pair, which
 * fifteen of Astryx's form components use for their `*Action` props.
 *
 * This is **not** a port of an upstream module — `useOptimistic` is a React
 * built-in, and upstream publishes no hook of its own for it. That is why it
 * lives in `internal/` rather than `hooks/`: the latter mirrors upstream's
 * 19-hook barrel, and publishing this would invent public API upstream has no
 * name for. Consumers get the behaviour through the components' `changeAction`
 * props, exactly as they do upstream.
 *
 * ## What React's pair actually does
 *
 * `useOptimistic(value)` returns a value that reads through to `value`, except
 * while a transition started by `startTransition` is in flight — then it reads
 * whatever `setOptimisticValue` was called with. When the transition completes
 * the override is dropped and the value snaps back to the committed prop.
 *
 * Two things about that are easy to get wrong, and both are pinned by upstream's
 * own `Pagination` suite (`Pagination.test.tsx:600-735`), which is the most
 * thorough test of the pattern in the repo:
 *
 * - **The revert is not conditional on failure.** `planning/01` §6.3 describes
 *   it as "revert automatically if the promise rejects", which is the visible
 *   effect but not the mechanism. React reverts when the transition *ends*,
 *   whatever the outcome — a success looks like no revert only because the
 *   parent has meanwhile updated the committed prop to the same value. A
 *   revert-on-reject implementation would leave a rejected action's optimistic
 *   value on screen forever whenever the parent is uncontrolled.
 *
 * - **Overlapping actions interrupt rather than queue or drop.** Upstream's
 *   "interrupts an in-flight action on rapid next clicks" case clicks next
 *   twice before either settles and expects `1 → 2 → 3` with *two* calls, each
 *   derived from the optimistic value rather than the committed one. So there
 *   is deliberately no re-entry guard — the opposite of `Button`'s `clickAction`,
 *   which dedupes precisely because a submit must fire once. The override is
 *   last-write-wins and is dropped only when the *last* action settles, which is
 *   what the in-flight count below is for.
 *
 * ## Shape
 *
 * React can separate the optimistic value from the transition because
 * `startTransition` marks the boundary that triggers the revert. Svelte has no
 * transition concept, so the only thing that can know when to revert is
 * whatever owns the call — which is why this is one object with a `run` rather
 * than the tuple plus a separate transition. `planning/01` §6.3 proposed the
 * same shape.
 *
 * @example
 * ```ts
 * const optimistic = createOptimistic(() => value);
 * const isBusy = $derived(isLoading || optimistic.isPending);
 *
 * function handleChange(next: string, e: Event) {
 *   onChange?.(next, e);
 *   if (changeAction && !e.defaultPrevented) {
 *     optimistic.run(next, () => changeAction(next, e));
 *   }
 * }
 * ```
 */

export interface Optimistic<T> {
	/** The optimistic value while an action is in flight, else the committed one. */
	readonly current: T;
	/** Whether any action is still in flight. Upstream's `isBusy` half. */
	readonly isPending: boolean;
	/**
	 * Shows `next` immediately, runs `action`, and drops the override once every
	 * concurrent run has settled.
	 *
	 * Rejections are **not** swallowed: the override is still dropped, and the
	 * error propagates to the caller as it does out of React's transition, which
	 * is also what `Button`'s ported `clickAction` does.
	 */
	run(next: T, action: () => unknown): Promise<void>;
}

export function createOptimistic<T>(committed: () => T): Optimistic<T> {
	// Boxed so that `undefined` and `null` are legitimate optimistic values —
	// a bare `T | undefined` could not tell "no override" from "optimistically
	// undefined", which `Selector`'s clearable value needs.
	//
	// **`$state.raw`, not `$state`, and the difference is a real bug.** `$state`
	// deep-proxies a plain object, so `override.value` would hand back
	// `proxy(next)` rather than the very object the caller committed — and while
	// an action is in flight `optimistic.current !== next` by identity. Any
	// content that marks selection by reference (`option === value`, a `Set` or
	// `Map` keyed on the object) loses its selected state for the whole pending
	// window and then snaps back. React never shows this, because it stores the
	// value as given.
	//
	// `$state.raw` is exactly right rather than merely sufficient: the box is only
	// ever *replaced* wholesale, never mutated, so deep reactivity buys nothing
	// here and costs identity. Same shape as the `useTriggerMenu` deep-proxy bug
	// batch 16's idiom audit found.
	let override = $state.raw<{ value: T } | undefined>(undefined);
	let inFlight = $state(0);

	return {
		get current(): T {
			return override ? override.value : committed();
		},
		get isPending(): boolean {
			return inFlight > 0;
		},
		async run(next: T, action: () => unknown): Promise<void> {
			override = { value: next };
			inFlight += 1;
			try {
				// A synchronous action is awaited too, so it settles a microtask
				// later rather than never — upstream supports one (`Pagination`'s
				// "supports a synchronous changeAction"), and React's transition
				// completes immediately for it. No paint happens in between, so
				// there is no flash either way.
				await action();
			} finally {
				inFlight -= 1;
				// Only the last one settling reverts: an earlier action finishing
				// after a later one started must not drop the newer override.
				if (inFlight === 0) {
					override = undefined;
				}
			}
		}
	};
}
