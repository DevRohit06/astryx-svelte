/** PORTS: SizeContext/SizeContext.test.tsx */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { ElementSize } from '$lib/internal/contexts.svelte.js';
import Probe from './fixtures/size-probe.svelte';
import Provider from './fixtures/size-provider.svelte';
import Siblings from './fixtures/size-siblings.svelte';

/**
 * Ported from Astryx's `SizeContext/SizeContext.test.tsx` at the 0.5.0 pin — its
 * 21 `it` blocks plus two three-row `it.each` tables run out to **27 collected
 * cases**, of which **25 are here** (see the two dropped below).
 *
 * Our implementation is `useSize` / `setSizeContext` / `SizeContext` in
 * `internal/contexts.svelte.ts`. Upstream's `renderHook` has no Svelte
 * counterpart — a hook must run during a component's init — so the two fixtures
 * next door play that part: a probe that runs `useSize()` and renders what it
 * resolved, and a self-nesting provider that stands in for `<SizeProvider>`.
 *
 * Two of upstream's 27 cases do not survive the port, both React-specific rather
 * than behavioural:
 *
 *   - `exposes a displayName for devtools` — Svelte has no `displayName`
 *     surface, and `Context` keeps its name private (`#private`), so
 *     there is nothing to assert against.
 *   - `works with createElement (no JSX) call form` — there is no second
 *     construction form in Svelte. A component is a component.
 *
 * Two are restated and one is a counterpart; each says so at its site.
 */

/** Resolved size rendered by the probe. `textContent` rather than `toHaveTextContent`
 *  so upstream's `toBe('')` for the empty-string case survives exactly. */
const resolved = (
	screen: { getByTestId: (id: string) => { element: () => Element } },
	id = 'probe'
) => screen.getByTestId(id).element().textContent;

describe('SizeContext', () => {
	describe('context identity', () => {
		it('defaults to null when read outside any provider', async () => {
			const screen = await render(Probe);
			// No provider + no prop + no explicit default → the 'md' fallback.
			expect(resolved(screen)).toBe('md');
		});

		// DROPPED — `exposes a displayName for devtools`. See the file header.

		// COUNTERPART for upstream's `SizeProvider is the context Provider itself`,
		// which asserts `SizeProvider === SizeContext.Provider`. `setSizeContext` is
		// this port's provider stand-in and there is no `.Provider` property to
		// compare against, so the same question is asked behaviourally: a write
		// through the *exported context object* and a write through `setSizeContext`
		// land on one channel — the one `useSize` reads. If the two were different
		// contexts, the `raw` half would resolve to 'md'.
		it('SizeProvider is the context Provider itself', async () => {
			const viaContext = await render(Provider, { props: { value: 'lg', raw: true } });
			expect(resolved(viaContext)).toBe('lg');
			// Queries are scoped to `baseElement` (the body), so the first render has
			// to go before the second, or `probe` matches twice.
			await viaContext.unmount();

			const viaSetter = await render(Provider, { props: { value: 'lg', raw: false } });
			expect(resolved(viaSetter)).toBe('lg');
		});
	});

	describe('useSize — resolution priority', () => {
		it('returns the default "md" with no prop and no provider', async () => {
			const screen = await render(Probe);
			expect(resolved(screen)).toBe('md');
		});

		it('honors an explicit defaultSize when neither prop nor context is set', async () => {
			const screen = await render(Probe, { props: { fallback: 'lg' } });
			expect(resolved(screen)).toBe('lg');
		});

		it('returns the explicit size prop when provided', async () => {
			const screen = await render(Probe, { props: { size: 'sm' } });
			expect(resolved(screen)).toBe('sm');
		});

		it('prop wins over the explicit default', async () => {
			const screen = await render(Probe, { props: { size: 'sm', fallback: 'lg' } });
			expect(resolved(screen)).toBe('sm');
		});

		it('inherits the size from an enclosing provider when no prop is passed', async () => {
			const screen = await render(Provider, { props: { value: 'lg' } });
			expect(resolved(screen)).toBe('lg');
		});

		it('prop wins over the inherited provider size', async () => {
			const screen = await render(Provider, { props: { value: 'lg', size: 'sm' } });
			expect(resolved(screen)).toBe('sm');
		});

		it('inherited context wins over the explicit default fallback', async () => {
			const screen = await render(Provider, { props: { value: 'lg', fallback: 'sm' } });
			expect(resolved(screen)).toBe('lg');
		});

		it('falls back to default when the provider value is explicitly null', async () => {
			const screen = await render(Provider, { props: { value: null, fallback: 'sm' } });
			expect(resolved(screen)).toBe('sm');
		});

		it('falls back to "md" when provider is null and no default is given', async () => {
			const screen = await render(Provider, { props: { value: null } });
			expect(resolved(screen)).toBe('md');
		});
	});

	describe('useSize — every standard ElementSize resolves', () => {
		const sizes: ElementSize[] = ['sm', 'md', 'lg'];

		it.each(sizes)('resolves explicit prop "%s"', async (size) => {
			const screen = await render(Probe, { props: { size } });
			expect(resolved(screen)).toBe(size);
		});

		it.each(sizes)('resolves inherited provider "%s"', async (size) => {
			const screen = await render(Provider, { props: { value: size } });
			expect(resolved(screen)).toBe(size);
		});
	});

	describe('useSize — nested providers', () => {
		it('resolves to the nearest provider', async () => {
			const screen = await render(Provider, { props: { value: 'sm', innerValue: 'lg' } });
			expect(resolved(screen)).toBe('lg');
		});

		it('a prop still overrides the nearest provider', async () => {
			const screen = await render(Provider, {
				props: { value: 'sm', innerValue: 'lg', size: 'md' }
			});
			expect(resolved(screen)).toBe('md');
		});
	});

	describe('useSize — generic (non-ElementSize) values', () => {
		// RESTATED (types only). Upstream's `useSize` is generic over
		// `<T extends string = ElementSize>`; ours is fixed to `ElementSize`, so
		// there is no type parameter to instantiate. The runtime question the case
		// asks — that an arbitrary string prop wins over an arbitrary string default
		// — is unchanged, and the probe widens its prop types to let it run.
		it('supports a custom string union via the type parameter', async () => {
			const screen = await render(Probe, {
				props: { size: 'compact', fallback: 'comfortable' }
			});
			expect(resolved(screen)).toBe('compact');
		});

		// RESTATED for the same reason as the case above.
		it('returns the custom default when no prop is given', async () => {
			const screen = await render(Probe, { props: { fallback: 'comfortable' } });
			expect(resolved(screen)).toBe('comfortable');
		});

		it('empty-string prop is a real value and does NOT fall through to default', async () => {
			// '' ?? x === '' because nullish coalescing only catches null/undefined.
			const screen = await render(Probe, { props: { size: '', fallback: 'lg' } });
			expect(resolved(screen)).toBe('');
		});
	});

	describe('integration — components consuming the cascade', () => {
		it('a child with no size prop reads the container size', async () => {
			const screen = await render(Provider, { props: { value: 'lg' } });
			await expect.element(screen.getByTestId('probe')).toHaveTextContent('lg');
		});

		it('sibling children resolve independently against the same provider', async () => {
			const screen = await render(Siblings, { props: { value: 'lg' } });
			await expect.element(screen.getByTestId('a')).toHaveTextContent('lg');
			await expect.element(screen.getByTestId('b')).toHaveTextContent('sm');
		});

		// The case this whole suite exists for. A context storing a *value* instead
		// of a getter passes every static case above and fails only here, because
		// Svelte reads context once at init and the descendant would stay frozen at
		// 'sm'. Upstream's `rerender` maps straight across.
		it('re-renders with the new size when the provider value changes', async () => {
			const screen = await render(Provider, { props: { value: 'sm' } });
			await expect.element(screen.getByTestId('probe')).toHaveTextContent('sm');

			await screen.rerender({ value: 'lg' });
			await expect.element(screen.getByTestId('probe')).toHaveTextContent('lg');
		});

		// DROPPED — `works with createElement (no JSX) call form`. See the file header.
	});
});
