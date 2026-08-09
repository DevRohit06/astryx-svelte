import { describe, expect, it, vi } from 'vitest';
import { createOptimistic } from '$lib/internal/optimistic.svelte.js';

/**
 * `internal/optimistic.svelte.ts` — the counterpart to React's `useOptimistic` +
 * `useTransition`, which fifteen Astryx form components use for their `*Action`
 * props.
 *
 * **There is no upstream suite to port.** `useOptimistic` is a React built-in,
 * so Astryx tests it only through the components that use it. The contract these
 * cases assert is therefore lifted from the most thorough of those — upstream's
 * `Pagination.test.tsx:600-735`, whose `describe('changeAction')` block is
 * titled "interruptible, optimistic" and pins every property below. Each case
 * names the upstream case it stands in for. When `Pagination` itself lands,
 * those cases port on top of this rather than replacing it.
 *
 * A node-project suite: the module is pure state with no DOM in it. `$state`
 * read through a getter needs no effect root — only a subscriber would.
 */

describe('createOptimistic', () => {
	it('reads through to the committed value when idle', () => {
		let value = 'a';
		const optimistic = createOptimistic(() => value);

		expect(optimistic.current).toBe('a');
		expect(optimistic.isPending).toBe(false);

		// The getter re-reads its source rather than caching a snapshot, which is
		// the whole reason it takes a function.
		value = 'b';
		expect(optimistic.current).toBe('b');
	});

	// Upstream: 'shows the optimistic page while changeAction is pending' — the
	// committed prop stays put while the indicator reflects the target.
	it('shows the optimistic value while the action is pending', async () => {
		const value = 1;
		let resolveAction: (() => void) | undefined;
		const action = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					resolveAction = resolve;
				})
		);

		const optimistic = createOptimistic(() => value);
		const run = optimistic.run(2, action);

		expect(optimistic.current).toBe(2);
		expect(optimistic.isPending).toBe(true);
		expect(action).toHaveBeenCalledTimes(1);

		resolveAction?.();
		await run;

		// The committed value never moved, so the revert is observable here in a
		// way it would not be under a parent that had updated its prop.
		expect(optimistic.current).toBe(1);
		expect(optimistic.isPending).toBe(false);
	});

	// The property `planning/01` §6.3 gets wrong: React reverts when the
	// transition *ends*, not only when it rejects. A revert-on-reject
	// implementation passes every other case in this file and fails this one.
	it('reverts on success, not only on failure', async () => {
		const value = 'committed';
		const optimistic = createOptimistic(() => value);

		await optimistic.run('optimistic', async () => {});

		expect(optimistic.current).toBe('committed');
		expect(optimistic.isPending).toBe(false);
	});

	it('reverts when the action rejects, and propagates the error', async () => {
		const value = 'committed';
		const optimistic = createOptimistic(() => value);
		const boom = new Error('boom');

		// Not swallowed — the same choice `Button`'s ported `clickAction` makes,
		// and what React does out of a transition.
		await expect(
			optimistic.run('optimistic', async () => {
				throw boom;
			})
		).rejects.toBe(boom);

		expect(optimistic.current).toBe('committed');
		expect(optimistic.isPending).toBe(false);
	});

	// Upstream: 'interrupts an in-flight action on rapid next clicks' — two
	// clicks before either settles give 1 -> 2 -> 3 and *two* calls. There is
	// deliberately no re-entry guard; `Button` has one, and this must not.
	it('interrupts rather than dropping an overlapping run', async () => {
		const value = 1;
		const resolvers: Array<() => void> = [];
		const action = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					resolvers.push(resolve);
				})
		);

		const optimistic = createOptimistic(() => value);
		const first = optimistic.run(2, action);
		expect(optimistic.current).toBe(2);

		const second = optimistic.run(3, action);
		expect(optimistic.current).toBe(3);
		expect(action).toHaveBeenCalledTimes(2);

		// The *earlier* action settling must not drop the newer override — the
		// case that separates an in-flight count from a boolean flag.
		resolvers[0]();
		await first;
		expect(optimistic.current).toBe(3);
		expect(optimistic.isPending).toBe(true);

		resolvers[1]();
		await second;
		expect(optimistic.current).toBe(1);
		expect(optimistic.isPending).toBe(false);
	});

	// Upstream: 'supports a synchronous changeAction'.
	it('supports a synchronous action', async () => {
		const value = 2;
		const action = vi.fn((): void => {});
		const optimistic = createOptimistic(() => value);

		await optimistic.run(1, action);

		expect(action).toHaveBeenCalledTimes(1);
		expect(optimistic.current).toBe(2);
		expect(optimistic.isPending).toBe(false);
	});

	// `Selector` clears to `undefined`, so "no override" and "optimistically
	// undefined" have to be distinguishable — which is why the override is boxed.
	it('treats undefined as a legitimate optimistic value', async () => {
		const value: string | undefined = 'set';
		let resolveAction: (() => void) | undefined;
		const optimistic = createOptimistic<string | undefined>(() => value);

		const run = optimistic.run(
			undefined,
			() =>
				new Promise<void>((resolve) => {
					resolveAction = resolve;
				})
		);

		expect(optimistic.current).toBeUndefined();
		expect(optimistic.isPending).toBe(true);

		resolveAction?.();
		await run;
		expect(optimistic.current).toBe('set');
	});
});
