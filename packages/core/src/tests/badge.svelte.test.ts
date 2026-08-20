import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import Badge from '$lib/components/badge/badge.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Astryx's `Badge/Badge.test.tsx`, ported case for case — **8 upstream
 * declarations at v0.4.5**, all in `describe('Badge')`, **8 here, none
 * dropped**. Upstream's `Badge/` directory also holds `Badge.test-violations.tsx`,
 * which is an eslint-rule fixture rather than a suite and declares no cases.
 * There is no `displayName` case, no snapshot and no no-JSX construction form,
 * so `ref` is the only React-only surface and it gets a counterpart.
 *
 * What translated, each commented where it appears:
 *
 * - **`forwards ref` is a counterpart.** Svelte has no `ref`; a consumer reaches
 *   the root through an attachment travelling in the rest props, which `Badge`
 *   spreads onto its `<span>`. It checks more than upstream's does — upstream
 *   only proves a callback ran with *some* `HTMLSpanElement`, this receives the
 *   span itself — so the `instanceof` is upstream's, unchanged.
 *
 * - **`renders with icon` goes through `slot-probe.svelte`.** Upstream writes
 *   `icon={<span data-testid="icon">*</span>}` inline; `icon` is a `Snippet` here
 *   and a snippet can only be authored in a template, so the shared slot fixture
 *   is the smallest thing that can hand one to `Badge`. The rendered span, its
 *   `data-testid` and its `*` are upstream's.
 *
 * - **`label` is `string | Snippet`, not `ReactNode`** (`port/debts.md`, settled).
 *   Every upstream case passes a string, so nothing here is a translation of it;
 *   the note is here only so the difference is not mistaken for a gap.
 *
 * - **`rerender` maps straight across**, except that
 *   `vitest-browser-svelte`'s is async and *merges* props rather than replacing
 *   them. Both rerendering cases set `variant` and `label` together, so the
 *   merged result is upstream's replaced one.
 *
 * - **`getByText` carries `{exact: true}` where the badge's whole text is the
 *   label.** RTL's string queries are exact by default and vitest's are
 *   substring, so the option is what preserves upstream's semantics rather than
 *   loosening them. The icon case is the exception and says why at the case.
 *
 * Runs in the **client** project, with the rest of the component suites.
 */

describe('Badge', () => {
	it('renders with default variant', async () => {
		const screen = await render(Badge, { props: { label: 'Default' } });
		await expect.element(screen.getByText('Default', { exact: true })).toBeInTheDocument();
	});

	it('renders with semantic variants', async () => {
		const screen = await render(Badge, { props: { variant: 'success', label: 'Success' } });
		await expect.element(screen.getByText('Success', { exact: true })).toBeInTheDocument();

		await screen.rerender({ variant: 'error', label: 'Error' });
		await expect.element(screen.getByText('Error', { exact: true })).toBeInTheDocument();

		await screen.rerender({ variant: 'warning', label: 'Warning' });
		await expect.element(screen.getByText('Warning', { exact: true })).toBeInTheDocument();

		await screen.rerender({ variant: 'info', label: 'Info' });
		await expect.element(screen.getByText('Info', { exact: true })).toBeInTheDocument();
	});

	it('renders with non-semantic color variants', async () => {
		const colors = [
			'blue',
			'cyan',
			'green',
			'orange',
			'pink',
			'purple',
			'red',
			'teal',
			'yellow'
		] as const;

		const screen = await render(Badge, { props: { variant: colors[0], label: colors[0] } });
		await expect.element(screen.getByText(colors[0], { exact: true })).toBeInTheDocument();

		for (const color of colors.slice(1)) {
			await screen.rerender({ variant: color, label: color });
			await expect.element(screen.getByText(color, { exact: true })).toBeInTheDocument();
		}
	});

	it('applies astryx class name with non-semantic variant', async () => {
		const screen = await render(Badge, { props: { variant: 'purple', label: 'Tag' } });
		const root = screen.container.firstElementChild!;
		expect(root.className).toContain('astryx-badge');
		expect(root.className).toContain('purple');
	});

	it('renders with icon', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: Badge,
				slot: 'icon',
				text: '*',
				testid: 'icon',
				rest: { label: 'With Icon' }
			}
		});
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
		// No `{exact: true}` here, and the difference is not a loosening. RTL's
		// exact matcher compares a node's *immediate* text runs, so upstream's
		// `getByText('With Icon')` matches the badge even though the icon's `*`
		// precedes the label. Vitest's exact matcher compares the element's whole
		// normalized text — `*With Icon` — and would match nothing at all, which
		// is a different question, not a stricter one. The substring form asks
		// upstream's: does `With Icon` render inside the badge?
		await expect.element(screen.getByText('With Icon')).toBeInTheDocument();
	});

	it('forwards ref', async () => {
		// COUNTERPART to upstream's `ref`: an attachment in the rest props, which
		// `Badge` spreads onto its root `<span>`. It receives the element rather
		// than only proving a callback ran, so the `instanceof` is upstream's,
		// unchanged.
		let node: Element | undefined;

		await render(Badge, {
			props: {
				label: 'Test',
				[createAttachmentKey()]: (element: Element) => {
					node = element;
				}
			}
		});

		expect(node).toBeInstanceOf(HTMLSpanElement);
	});

	it('spreads additional props', async () => {
		const screen = await render(Badge, { props: { 'data-testid': 'custom-badge', label: 'Test' } });
		await expect.element(screen.getByTestId('custom-badge')).toBeInTheDocument();
	});

	it('renders astryx-* class names for theme targeting', async () => {
		const screen = await render(Badge, { props: { variant: 'success', label: 'Active' } });
		const root = screen.container.firstElementChild!;
		expect(root.className).toContain('astryx-badge');
		expect(root.className).toContain('success');
	});
});
