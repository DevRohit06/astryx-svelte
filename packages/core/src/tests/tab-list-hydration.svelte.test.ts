import { describe, expect, it, afterEach } from 'vitest';
import { hydrate, unmount } from 'svelte';
import Fixture from './fixtures/tab-list-hydration-fixture.svelte';

/**
 * Coverage **beyond upstream**, per the bar in CLAUDE.md: a Svelte-specific
 * hazard with no upstream analogue, which the ported suites structurally cannot
 * catch.
 *
 * React hydrates by re-running the render and diffing; Svelte hydrates by
 * *walking* the server's DOM against marker comments, so a structural
 * disagreement makes it abandon the walk and re-create the subtree from
 * scratch. `TabList.test.tsx` has no counterpart because React cannot fail this
 * way — and the 45 ported cases all `render()`, which is a fresh client mount.
 * Nothing in the suite had ever hydrated a component.
 *
 * The bug this was written for: on the docs site every `Tab` inside a
 * server-rendered `TabList` threw *"useTabListContext must be used within
 * TabList"* on the client. That error was a symptom — hydration failed first,
 * and Svelte's fallback re-created the tabs inside a `branch()` effect, outside
 * the component context `TabList` had established. So the assertion that
 * matters is not "context is found" but **"hydration was never abandoned"**.
 *
 * `mount()`ing and snapshotting the HTML would not reproduce it: client
 * rendering omits the hydration markers, so the walk never starts. The markup
 * has to come from a real SSR render, which is what `/__ssr-fixture` provides
 * (see `scripts/ssr-fixture-plugin.mjs`).
 */

/** Server-render a fixture through the Vite dev server's SSR module graph. */
async function serverRender(
	props: Record<string, unknown> = {},
	module = '/src/tests/fixtures/tab-list-hydration-fixture.svelte'
): Promise<string> {
	const query = new URLSearchParams({
		module,
		props: JSON.stringify(props)
	});
	const response = await fetch(`/__ssr-fixture?${query}`);
	const payload = await response.json();
	if (!response.ok) throw new Error(`SSR render failed: ${payload.error}`);
	return payload.body as string;
}

let cleanup: (() => void) | null = null;

afterEach(() => {
	cleanup?.();
	cleanup = null;
});

describe('TabList hydration', () => {
	it('hydrates server markup without re-creating the tabs', async () => {
		const body = await serverRender();

		const target = document.createElement('div');
		target.innerHTML = body;
		document.body.appendChild(target);

		// The server's own tab buttons, captured before hydration. If Svelte
		// abandons the walk it throws them away and builds new ones, so identity
		// is the sharpest available signal that the walk completed — sharper than
		// counting nodes, which a re-render would reproduce.
		const serverTabs = [...target.querySelectorAll('nav [role="tab"], nav button')];
		expect(serverTabs.length).toBeGreaterThanOrEqual(2);

		// Svelte reports a failed walk by logging and re-rendering rather than
		// rejecting, so console.error is captured as well as any throw.
		const errors: unknown[] = [];
		const consoleError = console.error;
		console.error = (...args: unknown[]) => {
			errors.push(args[0]);
		};

		let component: Record<string, unknown> | null = null;
		try {
			component = hydrate(Fixture, { target }) as Record<string, unknown>;
		} finally {
			console.error = consoleError;
		}

		cleanup = () => {
			if (component) unmount(component);
			target.remove();
		};

		const messages = errors.map((error) => String(error)).join('\n');
		expect(messages).not.toContain('useTabListContext');
		expect(messages).not.toContain('Failed to hydrate');

		// Same nodes, still in place: the walk adopted the server's DOM.
		const hydratedTabs = [...target.querySelectorAll('nav [role="tab"], nav button')];
		expect(hydratedTabs.slice(0, serverTabs.length)).toEqual(serverTabs);
	});

	it('hydrates the docs page shape — snippet, effect-written branch, nested strip', async () => {
		const PAGE = '/src/tests/fixtures/tab-list-hydration-page-fixture.svelte';
		const body = await serverRender({}, PAGE);

		const target = document.createElement('div');
		target.innerHTML = body;
		document.body.appendChild(target);

		const errors: unknown[] = [];
		const consoleError = console.error;
		console.error = (...args: unknown[]) => {
			errors.push(args[0]);
		};

		let component: Record<string, unknown> | null = null;
		try {
			const { default: PageFixture } =
				await import('./fixtures/tab-list-hydration-page-fixture.svelte');
			component = hydrate(PageFixture, { target }) as Record<string, unknown>;
		} finally {
			console.error = consoleError;
		}

		cleanup = () => {
			if (component) unmount(component);
			target.remove();
		};

		const messages = errors.map((error) => String(error)).join('\n');
		expect(messages).not.toContain('useTabListContext');
		expect(messages).not.toContain('Failed to hydrate');
	});

	it('keeps the selected tab the server chose', async () => {
		const body = await serverRender({ value: 'properties' });

		const target = document.createElement('div');
		target.innerHTML = body;
		document.body.appendChild(target);

		const component = hydrate(Fixture, {
			target,
			props: { value: 'properties' }
		}) as Record<string, unknown>;
		cleanup = () => {
			unmount(component);
			target.remove();
		};

		// Reads the selection through the DOM the *server* produced, so a silent
		// re-render that happened to land on the same markup would still pass —
		// this case is about the value surviving, which the case above is not.
		const selected = target.querySelector('[data-selected="selected"]');
		expect(selected?.textContent).toContain('Properties');
	});
});
