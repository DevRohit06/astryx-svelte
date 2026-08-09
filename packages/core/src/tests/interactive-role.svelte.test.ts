import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type {
	InteractiveRole,
	UseInteractiveRoleOptions
} from '$lib/hooks/use-interactive-role.svelte.js';
import Probe from './fixtures/interactive-role-probe.svelte';
import Provider from './fixtures/interactive-role-provider.svelte';

/**
 * Ported from Astryx's `InteractiveRoleContext/InteractiveRoleContext.test.tsx`.
 *
 * Upstream uses `renderHook` with a `wrapper`; Svelte has no `renderHook`, so
 * the two fixtures next door play that part — a probe component that runs the
 * hooks and renders what they returned, and a provider that sets the context
 * around it. Every assertion is upstream's.
 *
 * Two of upstream's twenty-one cases do not survive the port, both React-specific
 * rather than behavioural: `displayName` for devtools (our `Context` keeps
 * its name private, and it is not a devtools surface in Svelte), and the
 * `createElement` no-JSX provider form (there is no second construction form to
 * check — a component is a component).
 */

const contextText = async (role: InteractiveRole | null) => {
	const screen = await render(Provider, { props: { role } });
	return screen.getByTestId('context').element().textContent;
};

const roleWith = async (options: UseInteractiveRoleOptions) => {
	const screen = await render(Probe, { props: { options } });
	return screen.getByTestId('role').element().textContent;
};

const roleWithProvider = async (
	role: InteractiveRole | null,
	options: UseInteractiveRoleOptions
) => {
	const screen = await render(Provider, { props: { role, options } });
	return screen.getByTestId('role').element().textContent;
};

describe('InteractiveRoleContext', () => {
	describe('context primitive', () => {
		it('defaults to null when read with no provider', async () => {
			const screen = await render(Probe);
			await expect.element(screen.getByTestId('context')).toHaveTextContent('null');
		});

		it('returns the provided role override', async () => {
			expect(await contextText('button')).toBe('button');
		});

		it('returns null when a provider explicitly supplies null', async () => {
			expect(await contextText(null)).toBe('null');
		});

		it.each(['link', 'button', 'inert'] as const)(
			'passes through the "%s" override verbatim',
			async (role) => {
				expect(await contextText(role)).toBe(role);
			}
		);

		it('resolves to the nearest provider when nested', async () => {
			const screen = await render(Provider, {
				props: { role: 'link', innerRole: 'button' }
			});
			await expect.element(screen.getByTestId('context')).toHaveTextContent('button');
		});
	});

	// useInteractiveRole is the real consumer of this context; these tests pin
	// down how the context signal participates in the role-resolution priority.
	describe('consumption via useInteractiveRole', () => {
		it('href alone resolves to "link"', async () => {
			expect(await roleWith({ href: '/somewhere' })).toBe('link');
		});

		it('onclick alone resolves to "button"', async () => {
			expect(await roleWith({ onclick: () => {} })).toBe('button');
		});

		it('nothing interactive resolves to "inert"', async () => {
			expect(await roleWith({})).toBe('inert');
		});

		it('context override is used when neither href nor onclick is set', async () => {
			expect(await roleWithProvider('button', {})).toBe('button');
		});

		it('href wins over a context override (navigation has top priority)', async () => {
			expect(await roleWithProvider('button', { href: '/x' })).toBe('link');
		});

		it('onclick wins over a context override', async () => {
			expect(await roleWithProvider('link', { onclick: () => {} })).toBe('button');
		});

		// NOTE — documents current behavior. The `isDisabled` JSDoc says a disabled
		// href "falls back to button", but the implementation only *skips* the link
		// branch when disabled — it does not force a button. With no onclick and no
		// context override, a disabled href therefore resolves to "inert", not
		// "button". (The doc-promised "button" fallback only holds when an onclick
		// or a context override is also present — see the two tests below.)
		it('a disabled href with nothing else resolves to "inert" (not "button" as the JSDoc implies)', async () => {
			expect(await roleWith({ href: '/x', isDisabled: true })).toBe('inert');
		});

		it('a disabled href with an onclick resolves to "button" via the onclick branch', async () => {
			expect(await roleWith({ href: '/x', isDisabled: true, onclick: () => {} })).toBe('button');
		});

		it('a disabled href with a context override falls through to that override', async () => {
			expect(await roleWithProvider('button', { href: '/x', isDisabled: true })).toBe('button');
		});

		it('an "inert" context override is honored when nothing else is interactive', async () => {
			expect(await roleWithProvider('inert', {})).toBe('inert');
		});

		it('a null onclick is treated as absent (falls through to inert)', async () => {
			expect(await roleWith({ onclick: null })).toBe('inert');
		});

		it('a null onclick still yields to a context override', async () => {
			expect(await roleWithProvider('button', { onclick: null })).toBe('button');
		});
	});
});
