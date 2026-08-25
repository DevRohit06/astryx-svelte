import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DialogHeader from '$lib/components/dialog/dialog-header.svelte';
import DialogHeaderContentProbe from './fixtures/dialog-header-content-probe.svelte';
import DialogHeaderDividerProbe from './fixtures/dialog-header-divider-probe.svelte';

/**
 * Ported from Astryx's `Dialog/DialogHeader.test.tsx`, all 17 cases at the 0.5.0 pin.
 *
 * The **client** project (real Chromium): the title autofocuses through an
 * effect, and `auto-focuses the title when mounted` reads `document.activeElement`
 * — a real focus system, which jsdom does not provide.
 *
 * ## Counterparts and query shifts
 *
 * - **`startContent`/`endContent`** are React `ReactNode` props upstream and
 *   Svelte `Snippet`s here, so the "renders …Content" cases pass snippets through
 *   `dialog-header-content-probe`, rendering the same `<button>` markup upstream
 *   writes inline. Same assertions.
 * - **The four divider cases** wrap `DialogHeader` in `LayoutDividerContext` — our
 *   port carries that context verbatim — via `dialog-header-divider-probe`. They
 *   compare the root header's `className` between two renders exactly as upstream.
 * - Absence checks (`queryByText`, `queryByRole`) become `container` reads, as the
 *   earlier client suites resolve hidden/absent nodes; every assertion is
 *   upstream's.
 *
 * No React-only case (no `ref`, no `displayName`) appears in this suite, so
 * nothing is dropped.
 */

const noop = (): void => {};

const rootOf = (container: HTMLElement): HTMLElement => {
	const el = container.firstElementChild;
	if (!(el instanceof HTMLElement)) throw new Error('expected a header root element');
	return el;
};

describe('DialogHeader', () => {
	it('renders the title', async () => {
		const screen = await render(DialogHeader, { props: { title: 'My Dialog Title' } });
		await expect
			.element(screen.getByRole('heading', { level: 2, name: 'My Dialog Title', exact: true }))
			.toBeInTheDocument();
	});

	it('renders the title as an h2 element', async () => {
		const screen = await render(DialogHeader, { props: { title: 'Title' } });
		const heading = screen.getByRole('heading', { level: 2 }).element();
		expect(heading.tagName).toBe('H2');
	});

	it('title has tabIndex=-1 for programmatic focus', async () => {
		const screen = await render(DialogHeader, { props: { title: 'Title' } });
		await expect
			.element(screen.getByRole('heading', { level: 2 }))
			.toHaveAttribute('tabindex', '-1');
	});

	it('auto-focuses the title when mounted', async () => {
		const screen = await render(DialogHeader, { props: { title: 'Title' } });
		const heading = screen.getByRole('heading', { level: 2 }).element();
		expect(document.activeElement).toBe(heading);
	});

	it('renders subtitle when provided', async () => {
		const screen = await render(DialogHeader, {
			props: { title: 'Title', subtitle: 'This is a subtitle' }
		});
		await expect.element(screen.getByText('This is a subtitle')).toBeInTheDocument();
	});

	it('does not render subtitle when not provided', async () => {
		const screen = await render(DialogHeader, { props: { title: 'Title' } });
		expect(screen.container.textContent).not.toContain('This is a subtitle');
	});

	it('renders close button when onOpenChange is provided', async () => {
		const screen = await render(DialogHeader, { props: { title: 'Title', onOpenChange: noop } });
		await expect.element(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
	});

	it('does not render close button when onOpenChange is not provided', async () => {
		const screen = await render(DialogHeader, { props: { title: 'Title' } });
		expect(screen.container.querySelector('button')).toBeNull();
	});

	it('calls onOpenChange(false) when close button is clicked', async () => {
		const handleHide = vi.fn();
		const screen = await render(DialogHeader, {
			props: { title: 'Title', onOpenChange: handleHide }
		});
		await screen.getByRole('button', { name: /close/i }).click();
		expect(handleHide).toHaveBeenCalledTimes(1);
		expect(handleHide).toHaveBeenCalledWith(false);
	});

	it('renders without divider by default (no context)', async () => {
		// Without context, hasDivider defaults to false — same classes as explicit hasDivider={false}.
		const noCtx = await render(DialogHeaderDividerProbe, { props: { title: 'No ctx' } });
		const explicitFalse = await render(DialogHeaderDividerProbe, {
			props: { title: 'Explicit false', hasDivider: false }
		});
		expect(rootOf(noCtx.container).className).toBe(rootOf(explicitFalse.container).className);
	});

	it('renders with divider when context defaultHasDividers is true', async () => {
		// With context true and no explicit prop, should match explicit hasDivider={true}.
		const ctxTrue = await render(DialogHeaderDividerProbe, {
			props: { title: 'Ctx true', contextValue: true }
		});
		const explicitTrue = await render(DialogHeaderDividerProbe, {
			props: { title: 'Explicit true', hasDivider: true }
		});
		expect(rootOf(ctxTrue.container).className).toBe(rootOf(explicitTrue.container).className);
	});

	it('explicit hasDivider={false} overrides context defaultHasDividers=true', async () => {
		const overridden = await render(DialogHeaderDividerProbe, {
			props: { title: 'Overridden', contextValue: true, hasDivider: false }
		});
		const noDivider = await render(DialogHeaderDividerProbe, {
			props: { title: 'No divider', hasDivider: false }
		});
		expect(rootOf(overridden.container).className).toBe(rootOf(noDivider.container).className);
	});

	it('explicit hasDivider={true} shows divider without context', async () => {
		// Explicit true should differ from default (no context = false).
		const withDiv = await render(DialogHeaderDividerProbe, {
			props: { title: 'With div', hasDivider: true }
		});
		const withoutDiv = await render(DialogHeaderDividerProbe, {
			props: { title: 'Without div', hasDivider: false }
		});
		expect(rootOf(withDiv.container).className).not.toBe(rootOf(withoutDiv.container).className);
	});

	it('renders additional endContent', async () => {
		const screen = await render(DialogHeaderContentProbe, {
			props: { title: 'Title', endLabel: 'Custom Action' }
		});
		await expect
			.element(screen.getByRole('button', { name: 'Custom Action', exact: true }))
			.toBeInTheDocument();
	});

	it('renders endContent alongside close button', async () => {
		const screen = await render(DialogHeaderContentProbe, {
			props: { title: 'Title', onOpenChange: noop, endLabel: 'Custom Action' }
		});
		await expect
			.element(screen.getByRole('button', { name: 'Custom Action', exact: true }))
			.toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
	});

	it('renders startContent before the title', async () => {
		const screen = await render(DialogHeaderContentProbe, {
			props: { title: 'Title', startLabel: 'Back' }
		});
		await expect
			.element(screen.getByRole('button', { name: 'Back', exact: true }))
			.toBeInTheDocument();
	});

	it('renders startContent and endContent together', async () => {
		const screen = await render(DialogHeaderContentProbe, {
			props: { title: 'Title', startLabel: 'Back', endLabel: 'Save', onOpenChange: noop }
		});
		await expect
			.element(screen.getByRole('button', { name: 'Back', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Save', exact: true }))
			.toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
	});
});
