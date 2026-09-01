/** PORTS: Link/useLinkComponent.test.tsx */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { LinkComponentType } from '$lib/components/link/types.js';
import Probe from './fixtures/use-link-component-probe.svelte';
import Harness from './fixtures/use-link-component-harness.svelte';
import CustomLink from './fixtures/custom-link.svelte';
import AnotherLink from './fixtures/another-link.svelte';
import ToBasedRouterLink from './fixtures/to-based-router-link.svelte';
import SpyLink from './fixtures/spy-link.svelte';

/**
 * Ported from Astryx's `Link/useLinkComponent.test.tsx`, all 11 cases at the
 * 0.5.0 pin.
 *
 * Upstream's `useLinkComponent` returns a renderable component; ours follows the
 * `useSize` split and returns a *resolver* `(as?) => { component, isNative }`,
 * leaving the `to={href}` injection to the consumer. So the probe next door
 * renders the resolved component through `link-element.svelte` exactly as
 * `link.svelte` does — custom components get `to={href}`, the native `'a'` never
 * does — and the assertions read the resulting element, which is what upstream
 * checks all the same.
 *
 * The two `SpyLink` cases are the one restatement: upstream asserts on a `vi.fn`
 * with `toHaveBeenCalledWith({ href, to })`; Svelte cannot spy on a component's
 * props, so the spy anchor surfaces `href` and the injected `to` (as `data-to`)
 * and the assertion reads them off the DOM. Same question, different mechanism.
 */

// The locator's `.element()` is typed `HTMLElement | SVGElement`; these are all
// `<a>`, so narrow to `HTMLElement` for the jest-dom matchers.
const resolvedLink = (el: { getByTestId: (id: string) => { element: () => Element } }) =>
	el.getByTestId('resolved-link').element() as HTMLElement;

describe('useLinkComponent', () => {
	it('returns native <a> by default (no provider, no as)', async () => {
		const screen = await render(Probe);
		const link = resolvedLink(screen);
		expect(link.tagName).toBe('A');
		expect(link).toHaveAttribute('href', '/test');
		expect(link).not.toHaveAttribute('data-custom-link');
	});

	it('returns as prop when provided', async () => {
		const screen = await render(Probe, { props: { as: CustomLink as LinkComponentType } });
		const link = resolvedLink(screen);
		expect(link).toHaveAttribute('data-custom-link');
		expect(link).toHaveAttribute('href', '/test');
	});

	it('returns provider component when wrapped in LinkProvider', async () => {
		const screen = await render(Harness, {
			props: { component: CustomLink as LinkComponentType }
		});
		const link = resolvedLink(screen);
		expect(link).toHaveAttribute('data-custom-link');
	});

	it('as prop overrides provider', async () => {
		const screen = await render(Harness, {
			props: {
				component: AnotherLink as LinkComponentType,
				as: CustomLink as LinkComponentType
			}
		});
		const link = resolvedLink(screen);
		expect(link).toHaveAttribute('data-custom-link');
		expect(link).not.toHaveAttribute('data-another-link');
	});
});

describe('useLinkComponent — to prop', () => {
	// RESTATED: upstream spies with `vi.fn` and asserts `toHaveBeenCalledWith({
	// href: '/test', to: '/test' })`. The spy anchor instead reflects both, so the
	// injected `to === href` is read from the DOM.
	it('passes `to` equal to `href` for custom components via provider', async () => {
		const screen = await render(Harness, {
			props: { component: SpyLink as LinkComponentType }
		});
		const link = screen.container.querySelector('a')!;
		expect(link).toHaveAttribute('href', '/test');
		expect(link).toHaveAttribute('data-to', '/test');
	});

	// RESTATED: same reasoning as above, via the `as` prop rather than a provider.
	it('passes `to` equal to `href` for custom components via `as` prop', async () => {
		const screen = await render(Probe, { props: { as: SpyLink as LinkComponentType } });
		const link = screen.container.querySelector('a')!;
		expect(link).toHaveAttribute('href', '/test');
		expect(link).toHaveAttribute('data-to', '/test');
	});

	it('does NOT pass `to` for native <a> (no provider, no as)', async () => {
		const screen = await render(Probe);
		const link = resolvedLink(screen);
		expect(link).toHaveAttribute('href', '/test');
		expect(link).not.toHaveAttribute('to');
	});

	it('works with to-based router links (e.g. React Router)', async () => {
		const screen = await render(Harness, {
			props: { component: ToBasedRouterLink as LinkComponentType }
		});
		const link = resolvedLink(screen);
		expect(link).toHaveAttribute('data-router-link');
		expect(link).toHaveAttribute('data-to', '/test');
		expect(link).toHaveAttribute('href', '/test');
	});

	it('to-based router works with as prop override', async () => {
		const screen = await render(Probe, { props: { as: ToBasedRouterLink as LinkComponentType } });
		const link = resolvedLink(screen);
		expect(link).toHaveAttribute('data-router-link');
		expect(link).toHaveAttribute('data-to', '/test');
	});
});

describe('LinkProvider', () => {
	it('children can access the link component via the hook', async () => {
		const screen = await render(Harness, {
			props: { component: CustomLink as LinkComponentType }
		});
		const link = resolvedLink(screen);
		expect(link).toHaveAttribute('data-custom-link');
		expect(link).toHaveAttribute('href', '/test');
	});

	it('nested providers — inner overrides outer', async () => {
		const screen = await render(Harness, {
			props: {
				component: AnotherLink as LinkComponentType,
				innerComponent: CustomLink as LinkComponentType
			}
		});
		const link = resolvedLink(screen);
		expect(link).toHaveAttribute('data-custom-link');
		expect(link).not.toHaveAttribute('data-another-link');
	});
});
