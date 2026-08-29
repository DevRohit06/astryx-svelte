import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import LayoutContent from '$lib/components/layout/layout-content.svelte';
import LayoutFooter from '$lib/components/layout/layout-footer.svelte';
import LayoutHeader from '$lib/components/layout/layout-header.svelte';
import LayoutPanel from '$lib/components/layout/layout-panel.svelte';
import DividerProvider from './fixtures/layout-divider-provider.svelte';
import LayoutShell from './fixtures/layout-shell.svelte';
import ResizablePanel from './fixtures/resizable-panel.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Ports `Layout/LayoutSlots.test.tsx` — the four slot primitives.
 *
 * **Upstream declares 34 `it`s at v0.4.5 (11 header, 6 footer, 7 content, 10
 * panel); all 34 are here. Nothing is dropped.**
 *
 * These cases lived inside `layout.svelte.test.ts` for several batches, under a
 * header that claimed to cover "all four upstream suites" while naming only
 * two. One file ports one suite, so they moved here whole rather than being
 * rewritten — `layout.svelte.test.ts` keeps `Layout.test.tsx` and
 * `__tests__/edgeCompensation.test.tsx` and nothing of this one.
 *
 * Five translations, none of them a dropped case:
 *
 * - **`ref` forwarding → an attachment passed through the rest props** (four
 *   cases, one per primitive). There is no `createRef` here; the counterpart
 *   checks strictly more than upstream's, because the attachment receives the
 *   element rather than only proving a callback ran. Upstream's two assertions
 *   — `toBeInstanceOf(HTMLDivElement)` and a `className` containing the
 *   primitive's class — are both kept, plus identity with the queried root.
 * - **`<LayoutDividerContext value={…}>` → `layout-divider-provider`**, which
 *   calls `setLayoutDividerContext`. Upstream can render a context provider
 *   inline; a Svelte context is set during a component's init, so a fixture is
 *   the smallest thing that can do it.
 * - **The `useResizable` `Harness` → `resizable-panel`**, the same harness one
 *   file over: a region at `defaultSize` and a `width` prop it must beat.
 * - **`className` → `class`, `style={{…}}` → a style string.** Svelte's prop
 *   names; the assertions are unchanged.
 * - **"renders children in an inner wrapper" is restated** — see the comment on
 *   the case. `slot-probe` wraps its text in a span of its own, so upstream's
 *   `getByText('Inner')` (which returns the padding-owning wrapper there)
 *   returns that span here and the wrapper is one level up. All three of
 *   upstream's assertions survive, applied to the wrapper.
 *
 * Every string `name` carries `exact: true`: Playwright matches a string `name`
 * as a case-insensitive substring, where Testing Library matches the whole
 * accessible name, so a verbatim port would assert less than upstream's does.
 */

// =============================================================================
// LayoutHeader
// =============================================================================

describe('LayoutHeader', () => {
	const slot = (text: string, rest: Record<string | symbol, unknown> = {}) => ({
		props: { component: LayoutHeader, slot: 'children', text, rest }
	});
	const find = (screen: { container: HTMLElement }) =>
		screen.container.querySelector('.astryx-layout-header') as HTMLElement;

	it('renders its children', async () => {
		const screen = await render(SlotProbe, slot('Page title'));
		await expect.element(screen.getByText('Page title', { exact: true })).toBeInTheDocument();
	});

	it('carries the astryx-layout-header class', async () => {
		const screen = await render(SlotProbe, slot('H'));
		expect(find(screen)).toBeInTheDocument();
	});

	it('exposes a landmark role and accessible name', async () => {
		const screen = await render(SlotProbe, slot('H', { role: 'banner', label: 'Site header' }));
		await expect
			.element(screen.getByRole('banner', { name: 'Site header', exact: true }))
			.toBeInTheDocument();
	});

	it('omits data-divider by default', async () => {
		const screen = await render(SlotProbe, slot('H'));
		expect(find(screen).hasAttribute('data-divider')).toBe(false);
	});

	it('reflects hasDivider as data-divider="true"', async () => {
		const screen = await render(SlotProbe, slot('H', { hasDivider: true }));
		expect(find(screen).getAttribute('data-divider')).toBe('true');
	});

	it('inherits the divider default from LayoutDividerContext', async () => {
		const screen = await render(DividerProvider, {
			props: { defaultHasDividers: true, component: LayoutHeader, text: 'H' }
		});
		expect(find(screen).getAttribute('data-divider')).toBe('true');
	});

	it('an explicit hasDivider={false} overrides an inherited true default', async () => {
		const screen = await render(DividerProvider, {
			props: {
				defaultHasDividers: true,
				component: LayoutHeader,
				text: 'H',
				rest: { hasDivider: false }
			}
		});
		expect(find(screen).hasAttribute('data-divider')).toBe(false);
	});

	it('applies a numeric height to the element style', async () => {
		const screen = await render(SlotProbe, slot('H', { height: 64 }));
		expect(find(screen).getAttribute('style') ?? '').toContain('64px');
	});

	// Counterpart to upstream's `forwards ref to the outer element`.
	it('hands the outer element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(SlotProbe, slot('H', { [createAttachmentKey()]: attached }));
		const el = attached.mock.calls[0][0] as HTMLElement;
		expect(el).toBeInstanceOf(HTMLDivElement);
		expect(el.className).toContain('astryx-layout-header');
		expect(el).toBe(find(screen));
	});

	// Upstream's `merges a caller className`.
	it('merges a caller class', async () => {
		const screen = await render(SlotProbe, slot('H', { class: 'hdr-custom' }));
		expect(find(screen).className).toContain('hdr-custom');
	});

	// Restated. Upstream's `getByText('Inner')` returns the padding-owning inner
	// wrapper, because React renders the text straight into it; `slot-probe`
	// wraps its text in a span, so the same query returns that span and the
	// wrapper is its parent. Upstream's three assertions are kept verbatim
	// against the wrapper.
	it('renders children in an inner wrapper (the padding owner), not on the root', async () => {
		const screen = await render(SlotProbe, slot('Inner'));
		const root = find(screen);
		const inner = (screen.getByText('Inner', { exact: true }).element() as HTMLElement)
			.parentElement;
		expect(inner).not.toBe(root);
		expect(inner?.parentElement).toBe(root);
		expect(root).toContainElement(inner);
	});
});

// =============================================================================
// LayoutFooter
// =============================================================================

describe('LayoutFooter', () => {
	const slot = (text: string, rest: Record<string | symbol, unknown> = {}) => ({
		props: { component: LayoutFooter, slot: 'children', text, rest }
	});
	const find = (screen: { container: HTMLElement }) =>
		screen.container.querySelector('.astryx-layout-footer') as HTMLElement;

	it('renders its children', async () => {
		const screen = await render(SlotProbe, slot('Actions'));
		await expect.element(screen.getByText('Actions', { exact: true })).toBeInTheDocument();
	});

	it('carries the astryx-layout-footer class', async () => {
		const screen = await render(SlotProbe, slot('F'));
		expect(find(screen)).toBeInTheDocument();
	});

	it('exposes a landmark role and accessible name', async () => {
		const screen = await render(
			SlotProbe,
			slot('F', { role: 'contentinfo', label: 'Page footer' })
		);
		await expect
			.element(screen.getByRole('contentinfo', { name: 'Page footer', exact: true }))
			.toBeInTheDocument();
	});

	it('omits data-divider by default and reflects hasDivider when set', async () => {
		const screen = await render(SlotProbe, slot('F'));
		expect(find(screen).hasAttribute('data-divider')).toBe(false);
		await screen.rerender({
			component: LayoutFooter,
			slot: 'children',
			text: 'F',
			rest: { hasDivider: true }
		});
		expect(find(screen).getAttribute('data-divider')).toBe('true');
	});

	it('inherits the divider default from context', async () => {
		const screen = await render(DividerProvider, {
			props: { defaultHasDividers: true, component: LayoutFooter, text: 'F' }
		});
		expect(find(screen).getAttribute('data-divider')).toBe('true');
	});

	// Counterpart to upstream's `forwards ref to the outer element`.
	it('hands the outer element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(SlotProbe, slot('F', { [createAttachmentKey()]: attached }));
		const el = attached.mock.calls[0][0] as HTMLElement;
		expect(el).toBeInstanceOf(HTMLDivElement);
		expect(el.className).toContain('astryx-layout-footer');
		expect(el).toBe(find(screen));
	});
});

// =============================================================================
// LayoutContent
// =============================================================================

describe('LayoutContent', () => {
	const slot = (text: string, rest: Record<string | symbol, unknown> = {}) => ({
		props: { component: LayoutContent, slot: 'children', text, rest }
	});
	const find = (screen: { container: HTMLElement }) =>
		screen.container.querySelector('.astryx-layout-content') as HTMLElement;

	it('renders its children', async () => {
		const screen = await render(SlotProbe, slot('Body'));
		await expect.element(screen.getByText('Body', { exact: true })).toBeInTheDocument();
	});

	it('carries the astryx-layout-content class', async () => {
		const screen = await render(SlotProbe, slot('C'));
		expect(find(screen)).toBeInTheDocument();
	});

	it('exposes the main landmark role with an accessible name', async () => {
		const screen = await render(SlotProbe, slot('C', { role: 'main', label: 'Main content' }));
		await expect
			.element(screen.getByRole('main', { name: 'Main content', exact: true }))
			.toBeInTheDocument();
	});

	// Counterpart to upstream's `forwards ref to the element`.
	it('hands the element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(SlotProbe, slot('C', { [createAttachmentKey()]: attached }));
		const el = attached.mock.calls[0][0] as HTMLElement;
		expect(el).toBeInstanceOf(HTMLDivElement);
		expect(el.className).toContain('astryx-layout-content');
		expect(el).toBe(find(screen));
	});

	// Upstream's `merges caller className and inline style`.
	it('merges a caller class and inline style', async () => {
		const screen = await render(
			SlotProbe,
			slot('C', { class: 'body-custom', style: 'color: rgb(1, 2, 3)' })
		);
		expect(find(screen).className).toContain('body-custom');
		expect(find(screen).style.color).toBe('rgb(1, 2, 3)');
	});

	it('renders correctly as the content slot of a Layout (reads slot context)', async () => {
		const screen = await render(LayoutShell, {
			props: { header: 'H', content: 'Main', contentRole: 'main' }
		});
		await expect.element(screen.getByRole('main')).toHaveTextContent('Main');
	});

	it('accepts padding={0} (full bleed) and a numeric padding without crashing', async () => {
		const screen = await render(SlotProbe, slot('C', { padding: 0 }));
		expect(find(screen)).toBeInTheDocument();
		await screen.rerender({
			component: LayoutContent,
			slot: 'children',
			text: 'C',
			rest: { padding: 6 }
		});
		expect(find(screen)).toBeInTheDocument();
	});
});

// =============================================================================
// LayoutPanel
// =============================================================================

describe('LayoutPanel', () => {
	const slot = (text: string, rest: Record<string | symbol, unknown> = {}) => ({
		props: { component: LayoutPanel, slot: 'children', text, rest }
	});
	const find = (screen: { container: HTMLElement }) =>
		screen.container.querySelector('.astryx-layout-panel') as HTMLElement;

	it('renders its children', async () => {
		const screen = await render(SlotProbe, slot('Nav'));
		await expect.element(screen.getByText('Nav', { exact: true })).toBeInTheDocument();
	});

	it('carries the astryx-layout-panel class', async () => {
		const screen = await render(SlotProbe, slot('P'));
		expect(find(screen)).toBeInTheDocument();
	});

	it('exposes a navigation landmark with an accessible name', async () => {
		const screen = await render(SlotProbe, slot('P', { role: 'navigation', label: 'Primary' }));
		await expect
			.element(screen.getByRole('navigation', { name: 'Primary', exact: true }))
			.toBeInTheDocument();
	});

	it('applies a numeric width to the element style', async () => {
		const screen = await render(SlotProbe, slot('P', { width: 240 }));
		expect(find(screen).getAttribute('style') ?? '').toContain('240px');
	});

	it('applies a string width to the element style', async () => {
		const screen = await render(SlotProbe, slot('P', { width: '18rem' }));
		expect(find(screen).getAttribute('style') ?? '').toContain('18rem');
	});

	it('resizable._size overrides the width prop', async () => {
		const screen = await render(ResizablePanel, { props: { defaultSize: 300, width: 100 } });
		const style = find(screen).getAttribute('style') ?? '';
		expect(style).toContain('300px');
		expect(style).not.toContain('100px');
	});

	// Counterpart to upstream's `forwards ref to the element`.
	it('hands the element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(SlotProbe, slot('P', { [createAttachmentKey()]: attached }));
		const el = attached.mock.calls[0][0] as HTMLElement;
		expect(el).toBeInstanceOf(HTMLDivElement);
		expect(el.className).toContain('astryx-layout-panel');
		expect(el).toBe(find(screen));
	});

	it('renders as a start-slot panel inside a Layout without crashing', async () => {
		const screen = await render(LayoutShell, {
			props: {
				start: 'Sidebar',
				content: 'Main',
				panelHasDivider: true,
				panelRole: 'navigation',
				panelLabel: 'Side'
			}
		});
		await expect
			.element(screen.getByRole('navigation', { name: 'Side', exact: true }))
			.toHaveTextContent('Sidebar');
	});

	it('renders as an end-slot panel inside a Layout without crashing', async () => {
		const screen = await render(LayoutShell, {
			props: {
				end: 'Details',
				content: 'Main',
				panelHasDivider: true,
				panelRole: 'complementary',
				panelLabel: 'Inspector'
			}
		});
		await expect
			.element(screen.getByRole('complementary', { name: 'Inspector', exact: true }))
			.toHaveTextContent('Details');
	});

	// Upstream's `merges a caller className`.
	it('merges a caller class', async () => {
		const screen = await render(SlotProbe, slot('P', { class: 'panel-custom' }));
		expect(find(screen).className).toContain('panel-custom');
	});
});
