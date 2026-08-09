import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { POOL_SIZE } from '$lib/hooks/container-reveal.pool.stylex.js';
import Probe from './fixtures/container-reveal-probe.svelte';
import ManyProbe from './fixtures/container-reveal-many-probe.svelte';
import ThrowingProbe from './fixtures/container-reveal-throwing-probe.svelte';
import NestedThrowProbe from './fixtures/container-reveal-nested-throw-probe.svelte';

/**
 * **No upstream counterpart, and the bar for that is met here.**
 *
 * `useContainerReveal` hands each mounted container a distinct pool slot and
 * returns it on teardown. Upstream returns it from a `useEffect` cleanup, which
 * never runs on the server — `renderToString` runs the `useState` initializer,
 * claims a slot and drops it — so a React server process leaks the whole pool
 * after `POOL_SIZE` renders and then hands every container the fallback marker.
 * That is an upstream bug, documented rather than replicated, and this port
 * releases in `onDestroy` instead: the one lifecycle callback Svelte runs during
 * SSR, at the end of the render.
 *
 * It matters here more than it does upstream, because the marker class is part
 * of the server markup: a server that has exhausted its pool emits `m0` for
 * every container while the freshly-loaded client emits `m0`, `m1`, `m2` — a
 * hydration mismatch on the class attribute, and a real hover leak between
 * nested containers on the pages served before the client corrects it.
 *
 * The client suite structurally cannot see this: it never runs the server
 * renderer. Hence a node-project file, the placement `batch-5-server-markup.ts`
 * already uses.
 *
 * Mutation-checked: replacing `onDestroy(...)` in `use-container-reveal.svelte.ts`
 * with an `$effect(() => () => releaseSlot(...))` fails the first case on the
 * second render (`m1` where `m0` is expected) and the second case outright.
 *
 * ## The second describe: renders that throw
 *
 * `onDestroy` returns a slot when a render *finishes*. A render that **throws**
 * unwinds past it, so the slot is stranded permanently — and compounding, since
 * the process is long-lived: `POOL_SIZE` failed requests exhaust the free list
 * and every container in every later request then claims the exhausted fallback
 * marker. That is upstream's bug arriving by a second route, with the same two
 * consequences: nested containers sharing a marker (a real hover leak), and a
 * hydration mismatch, because the freshly-loaded client hydrates against its own
 * untouched pool and numbers the same containers `m0, m1, m2`.
 *
 * `scheduleServerPoolReset` in `use-container-reveal.svelte.ts` is the backstop —
 * a server-only `queueMicrotask` that drops the whole free list once the current
 * render has unwound. These cases are its coverage, and they are as
 * environment-bound as the ones above: only the server renderer can strand a slot
 * this way, because only there is a claim scoped to a render rather than a mount.
 *
 * Mutation-checked: deleting the `scheduleServerPoolReset()` call from
 * `claimSlot` fails all three.
 *
 * The reset's *other* half — that it is server-**only** — needs no case here, and
 * deliberately gets none: dropping the `!isServer` term fails
 * `container-reveal.svelte.test.ts`'s ported *gives two concurrently mounted
 * containers DISTINCT marker classes*, because `await render(...)` between the
 * two mounts is a microtask boundary and a client-side reset would hand the
 * second container the first one's slot. Mutation-checked there rather than
 * duplicated here.
 */

/** Every container marker in a server-rendered body, in document order. */
function markers(body: string): string[] {
	return [...body.matchAll(/data-marker="([^"]*)"/g)].map((match) => match[1]);
}

describe('useContainerReveal — SSR', () => {
	it('returns its slot at the end of each server render', () => {
		const first = markers(render(Probe).body);
		const second = markers(render(Probe).body);
		const third = markers(render(Probe).body);

		expect(first).toHaveLength(1);
		expect(first[0]).toBeTruthy();
		// Same slot every time: a leaked one would walk m0 → m1 → m2.
		expect(second).toEqual(first);
		expect(third).toEqual(first);
	});

	it('still gives concurrent containers distinct markers within one render', () => {
		// The release must happen *after* the markup is produced, not per component,
		// or nested containers in the same page would share a marker on the server.
		//
		// This case is also the guard on the *other* side of
		// `scheduleServerPoolReset`, which the second describe below covers: the
		// reset drops the whole free list, so it must never land mid-render. A
		// microtask cannot, because `render()` runs to completion inside one task
		// and the queue does not drain until that stack unwinds — but if it were
		// ever moved to a timer, or if `render()` gained an `await`, this is the
		// case that goes red, with every container reporting `m0`.
		const rendered = markers(render(ManyProbe, { props: { count: POOL_SIZE } }).body);

		expect(rendered).toHaveLength(POOL_SIZE);
		expect(new Set(rendered).size).toBe(POOL_SIZE);
	});

	it('hands the next render the same markers, in the same order', () => {
		const first = markers(render(ManyProbe, { props: { count: POOL_SIZE } }).body);
		const second = markers(render(ManyProbe, { props: { count: POOL_SIZE } }).body);

		// This is the hydration contract: a client that starts with an empty
		// free-list must reproduce the server's assignment exactly.
		expect(second).toEqual(first);
	});
});

describe('useContainerReveal — SSR pool recovery after a failed render', () => {
	// Deliberately first, and self-validating on the way in: it is the only case
	// here that needs a *pristine* pool to compare against, and a pool that has
	// really leaked can never be restored — so once a regression has run any other
	// case in this file, no baseline taken afterwards means anything.
	it('hands the next healthy render the same markers a pristine one would get', async () => {
		const pristine = markers(render(ManyProbe, { props: { count: 3 } }).body);
		expect(new Set(pristine).size).toBe(3);

		for (let i = 0; i < POOL_SIZE; i++) {
			expect(() => render(ThrowingProbe).body).toThrow();
			await Promise.resolve();
		}

		const afterFailures = markers(render(ManyProbe, { props: { count: 3 } }).body);

		// `m0, m1, m2` — not `m0, m0, m0`. This is the half that hydration cares
		// about: the client numbers these three containers from a full pool, so a
		// server whose pool never recovered emits markup the client cannot match.
		expect(afterFailures).toEqual(pristine);
	});

	it('reclaims slots stranded by renders that threw', async () => {
		// `POOL_SIZE` failures is the whole pool. Without the reset each one keeps
		// its slot for the life of the process, so by the last iteration the free
		// list is empty and nothing after it can claim anything.
		for (let i = 0; i < POOL_SIZE; i++) {
			expect(() => render(ThrowingProbe).body).toThrow();
			// The reset is queued during the claim and runs once the throwing render
			// has unwound — which is exactly this microtask boundary.
			await Promise.resolve();
		}

		const rendered = markers(render(ManyProbe, { props: { count: POOL_SIZE } }).body);

		expect(rendered).toHaveLength(POOL_SIZE);
		// Still POOL_SIZE *distinct* markers. A leaked pool hands every container
		// the exhausted fallback, so this collapses to a set of one.
		expect(new Set(rendered).size).toBe(POOL_SIZE);
	});

	it('reclaims the ancestor slot too when a nested container throws', async () => {
		const pristine = markers(render(ManyProbe, { props: { count: POOL_SIZE } }).body);

		// One failed request, two stranded slots: the throw unwinds past the
		// ancestor's `onDestroy` as well as the nested container's.
		expect(() => render(NestedThrowProbe).body).toThrow();
		await Promise.resolve();

		const afterFailure = markers(render(ManyProbe, { props: { count: POOL_SIZE } }).body);

		expect(afterFailure).toEqual(pristine);
		expect(new Set(afterFailure).size).toBe(POOL_SIZE);
	});
});
