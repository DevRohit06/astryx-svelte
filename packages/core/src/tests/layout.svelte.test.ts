import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import Banner from '$lib/components/banner/banner.svelte';
import Button from '$lib/components/button/button.svelte';
import LayoutContent from '$lib/components/layout/layout-content.svelte';
import LayoutFooter from '$lib/components/layout/layout-footer.svelte';
import LayoutHeader from '$lib/components/layout/layout-header.svelte';
import LayoutPanel from '$lib/components/layout/layout-panel.svelte';
import { EDGE_COMP_ATTR } from '$lib/internal/edge-compensation.stylex.js';
import DividerProvider from './fixtures/layout-divider-provider.svelte';
import LayoutFixture from './fixtures/layout-fixture.svelte';
import LayoutShell from './fixtures/layout-shell.svelte';
import ResizablePanel from './fixtures/resizable-panel.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';
import TabListFixture from './fixtures/tab-list-fixture.svelte';
import ToolbarEdgeComp from './fixtures/toolbar-edge-comp-fixture.svelte';

/**
 * `Layout` and its four slot components, with all four upstream suites ported —
 * `Layout.test.tsx`, `LayoutSlots.test.tsx` and the `__tests__/` pair for
 * children-as-content and `contentWidth`.
 *
 * Two shapes recur. A slot is a **snippet**, so the cases that pass markup into
 * one go through a fixture — `layout-fixture` for bare `<div>`s, `layout-shell`
 * for the real slot components. And `ref` forwarding becomes the attachment a
 * consumer passes through the rest props, as in every batch since `Thumbnail`.
 *
 * `__tests__/edgeCompensation.test.tsx` is here in full — **all twelve of its
 * cases**. Seven of them (`Tab`, `TabList`, `Toolbar`, `Banner`, and the two
 * tooltip-marker cases) were parked when this file was written, on the grounds
 * that those components did not exist yet; all five now do, so the deferral is
 * retired rather than restated.
 *
 * Not ported, for a stated reason:
 * - **`Layout`'s `contentWidth` "applies max-width constraint to the middle
 *   row"** asserts only `middleRow.className` is truthy, which is true of every
 *   element StyleX touches. The case is restated to walk the same three parents
 *   and assert the *width* is actually on that row, which is what its title
 *   claims — the class oracle already proves the class itself is upstream's.
 */

const root = (screen: { container: HTMLElement }): HTMLElement =>
	screen.container.firstElementChild as HTMLElement;

describe('Layout', () => {
	describe('content / children resolution', () => {
		it('renders the content prop', async () => {
			const screen = await render(LayoutFixture, { props: { content: 'main body' } });
			await expect.element(screen.getByText('main body')).toBeInTheDocument();
		});

		it('renders children as a shorthand for the content slot', async () => {
			const screen = await render(LayoutFixture, { props: { child: 'child body' } });
			await expect.element(screen.getByText('child body')).toBeInTheDocument();
		});

		it('content wins when both content and children are provided', async () => {
			const screen = await render(LayoutFixture, {
				props: { content: 'from-content', child: 'from-children' }
			});
			await expect.element(screen.getByText('from-content')).toBeInTheDocument();
			expect(screen.container.textContent).not.toContain('from-children');
		});

		it('renders an empty shell without crashing when no slots are given', async () => {
			const screen = await render(LayoutFixture, { props: {} });
			expect(root(screen)).toBeInTheDocument();
		});
	});

	describe('slots', () => {
		it('renders all four surrounding slots plus content', async () => {
			const screen = await render(LayoutFixture, {
				props: {
					header: 'the-header',
					start: 'the-start',
					end: 'the-end',
					footer: 'the-footer',
					content: 'the-content'
				}
			});
			for (const text of ['the-header', 'the-start', 'the-end', 'the-footer', 'the-content']) {
				await expect.element(screen.getByText(text)).toBeInTheDocument();
			}
		});

		it('does not render an area wrapper for an omitted slot', async () => {
			const screen = await render(LayoutFixture, { props: { content: 'c', probeAreas: true } });
			// Only the content probe exists; header/start/end/footer probes absent.
			expect(screen.container.querySelector('[data-testid="c"]')?.textContent).toBe('content');
			for (const id of ['h', 's', 'e', 'f']) {
				expect(screen.container.querySelector(`[data-testid="${id}"]`)).toBeNull();
			}
		});
	});

	describe('LayoutAreaContext provisioning', () => {
		it('tags each slot with its area name', async () => {
			const screen = await render(LayoutFixture, {
				props: {
					header: 'h',
					start: 's',
					end: 'e',
					footer: 'f',
					content: 'c',
					probeAreas: true
				}
			});
			const areaOf = (id: string) =>
				screen.container.querySelector(`[data-testid="${id}"]`)?.textContent;
			expect(areaOf('h')).toBe('header');
			expect(areaOf('s')).toBe('start');
			expect(areaOf('e')).toBe('end');
			expect(areaOf('f')).toBe('footer');
			expect(areaOf('c')).toBe('content');
		});
	});

	describe('LayoutSlotsContext provisioning', () => {
		const readSlots = (screen: { container: HTMLElement }) =>
			JSON.parse(screen.container.querySelector('[data-testid="slots"]')?.textContent ?? '{}');

		it('reports which slots are filled to descendants', async () => {
			const screen = await render(LayoutFixture, {
				props: { header: 'h', start: 's', probeSlots: true }
			});
			expect(readSlots(screen)).toEqual({
				hasHeader: true,
				hasFooter: false,
				hasStart: true,
				hasEnd: false
			});
		});

		it('reports all-false when only content is present', async () => {
			const screen = await render(LayoutFixture, { props: { probeSlots: true } });
			expect(readSlots(screen)).toEqual({
				hasHeader: false,
				hasFooter: false,
				hasStart: false,
				hasEnd: false
			});
		});

		it('reports every slot filled', async () => {
			const screen = await render(LayoutFixture, {
				props: { header: 'h', footer: 'f', start: 's', end: 'e', probeSlots: true }
			});
			expect(readSlots(screen)).toEqual({
				hasHeader: true,
				hasFooter: true,
				hasStart: true,
				hasEnd: true
			});
		});
	});

	describe('theme props (class + data attributes)', () => {
		it('renders the astryx-layout class on the root', async () => {
			const screen = await render(LayoutFixture, { props: { content: 'x' } });
			expect(root(screen).className).toContain('astryx-layout');
		});

		it('defaults data-height to "fill"', async () => {
			const screen = await render(LayoutFixture, { props: { content: 'x' } });
			expect(root(screen).getAttribute('data-height')).toBe('fill');
		});

		it('reflects height="auto" as data-height', async () => {
			const screen = await render(LayoutFixture, { props: { content: 'x', height: 'auto' } });
			expect(root(screen).getAttribute('data-height')).toBe('auto');
		});
	});

	describe('defaultHasDividers → LayoutDividerContext', () => {
		it('makes headers default to having a divider', async () => {
			const screen = await render(LayoutShell, {
				props: { defaultHasDividers: true, header: 'H', content: 'c' }
			});
			expect(
				screen.container.querySelector('.astryx-layout-header')?.getAttribute('data-divider')
			).toBe('true');
		});

		it('makes footers default to having a divider', async () => {
			const screen = await render(LayoutShell, {
				props: { defaultHasDividers: true, footer: 'F', content: 'c' }
			});
			expect(screen.container.querySelector('.astryx-layout-footer[data-divider]')).not.toBeNull();
		});

		it('does not force dividers when defaultHasDividers is unset', async () => {
			const screen = await render(LayoutShell, { props: { header: 'H', content: 'c' } });
			expect(screen.container.querySelector('.astryx-layout-header[data-divider]')).toBeNull();
		});

		it('an explicit hasDivider={false} on a header overrides the context default', async () => {
			const screen = await render(LayoutShell, {
				props: { defaultHasDividers: true, header: 'H', headerHasDivider: false, content: 'c' }
			});
			expect(screen.container.querySelector('.astryx-layout-header[data-divider]')).toBeNull();
		});
	});

	describe('padding / contentWidth', () => {
		it('accepts a numeric padding step without crashing', async () => {
			const screen = await render(LayoutFixture, { props: { content: 'c', padding: 4 } });
			expect(root(screen)).toBeInTheDocument();
		});

		it('accepts padding={0} (full bleed) without crashing', async () => {
			const screen = await render(LayoutFixture, { props: { content: 'c', padding: 0 } });
			expect(root(screen)).toBeInTheDocument();
		});

		it('accepts a numeric contentWidth without crashing', async () => {
			const screen = await render(LayoutFixture, { props: { content: 'c', contentWidth: 640 } });
			expect(root(screen)).toBeInTheDocument();
		});

		it('accepts a string contentWidth without crashing', async () => {
			const screen = await render(LayoutFixture, { props: { content: 'c', contentWidth: '60ch' } });
			expect(root(screen)).toBeInTheDocument();
		});
	});

	describe('styling & attachments', () => {
		it('hands the root element to an attachment passed through rest props', async () => {
			const attached = vi.fn();
			const screen = await render(LayoutFixture, {
				props: { content: 'c', [createAttachmentKey()]: attached }
			});
			expect(attached).toHaveBeenCalledTimes(1);
			expect(attached.mock.calls[0][0]).toBe(root(screen));
			expect((attached.mock.calls[0][0] as HTMLElement).className).toContain('astryx-layout');
		});

		it('merges a caller class onto the root', async () => {
			const screen = await render(LayoutFixture, { props: { content: 'c', class: 'my-layout' } });
			expect(root(screen).className).toContain('my-layout');
			expect(root(screen).className).toContain('astryx-layout');
		});

		// Upstream asserts `style.outline === '1px solid red'`, which holds in jsdom;
		// a real browser parses the shorthand and hands back its own serialisation
		// (`red solid 1px`), the same canonicalisation the `Layer` suite records.
		// The longhands are the part the case is actually about.
		it('merges a caller inline style onto the root', async () => {
			const screen = await render(LayoutFixture, {
				props: { content: 'c', style: 'outline: 1px solid red' }
			});
			const { outlineWidth, outlineStyle, outlineColor } = root(screen).style;
			expect([outlineWidth, outlineStyle, outlineColor]).toEqual(['1px', 'solid', 'red']);
		});
	});
});

describe('Layout children-as-content', () => {
	it('renders nested children in the content slot', async () => {
		const screen = await render(LayoutShell, { props: { content: 'Body' } });
		await expect.element(screen.getByTestId('body')).toBeInTheDocument();
	});

	it('renders bare children (no LayoutContent wrapper) too', async () => {
		const screen = await render(LayoutFixture, { props: { child: 'Bare' } });
		await expect.element(screen.getByText('Bare')).toBeInTheDocument();
	});

	it('lets an explicit content prop win over children', async () => {
		const screen = await render(LayoutFixture, { props: { content: 'Slot', child: 'Child' } });
		await expect.element(screen.getByText('Slot')).toBeInTheDocument();
		expect(screen.container.textContent).not.toContain('Child');
	});

	it('still supports the canonical slot-only API', async () => {
		const screen = await render(LayoutShell, { props: { content: 'Canonical' } });
		expect(screen.getByTestId('body').element().textContent).toBe('Canonical');
	});
});

describe('Layout contentWidth', () => {
	it('applies the width constraint to the middle row', async () => {
		const screen = await render(LayoutShell, { props: { contentWidth: 640, content: 'Body' } });
		// body span → LayoutContent → the stack item → the middle row.
		const middleRow = screen.getByTestId('body').element().parentElement!.parentElement!
			.parentElement!;
		expect(getComputedStyle(middleRow).maxWidth).toBe('640px');
	});

	it('does not crash when contentWidth is not set', async () => {
		const screen = await render(LayoutShell, { props: { content: 'Body' } });
		await expect.element(screen.getByTestId('body')).toBeInTheDocument();
	});

	describe('LayoutHeader', () => {
		it('always renders the contentWidth inner wrapper', async () => {
			const screen = await render(LayoutShell, { props: { header: 'Header', content: 'Body' } });
			const innerWrapper = screen.getByTestId('header-child').element().parentElement!;
			const headerDiv = innerWrapper.parentElement!;
			expect(headerDiv.className).toContain('astryx-layout-header');
			expect(innerWrapper).not.toBe(headerDiv);
		});

		it('keeps the divider on the outer element', async () => {
			const screen = await render(LayoutShell, {
				props: { contentWidth: 640, defaultHasDividers: true, header: 'Header', content: 'Body' }
			});
			const innerWrapper = screen.getByTestId('header-child').element().parentElement!;
			expect(innerWrapper.parentElement!).toHaveAttribute('data-divider');
			expect(innerWrapper).not.toHaveAttribute('data-divider');
		});
	});

	describe('LayoutFooter', () => {
		it('always renders the contentWidth inner wrapper', async () => {
			const screen = await render(LayoutShell, { props: { footer: 'Footer', content: 'Body' } });
			const innerWrapper = screen.getByTestId('footer-child').element().parentElement!;
			const footerDiv = innerWrapper.parentElement!;
			expect(footerDiv.className).toContain('astryx-layout-footer');
			expect(innerWrapper).not.toBe(footerDiv);
		});

		it('keeps the divider on the outer element', async () => {
			const screen = await render(LayoutShell, {
				props: { contentWidth: 640, defaultHasDividers: true, footer: 'Footer', content: 'Body' }
			});
			const innerWrapper = screen.getByTestId('footer-child').element().parentElement!;
			expect(innerWrapper.parentElement!).toHaveAttribute('data-divider');
			expect(innerWrapper).not.toHaveAttribute('data-divider');
		});
	});
});

describe('LayoutHeader', () => {
	const slot = (text: string, rest: Record<string | symbol, unknown> = {}) => ({
		props: { component: LayoutHeader, slot: 'children', text, rest }
	});
	const find = (screen: { container: HTMLElement }) =>
		screen.container.querySelector('.astryx-layout-header') as HTMLElement;

	it('renders its children', async () => {
		const screen = await render(SlotProbe, slot('Page title'));
		await expect.element(screen.getByText('Page title')).toBeInTheDocument();
	});

	it('carries the astryx-layout-header class', async () => {
		const screen = await render(SlotProbe, slot('H'));
		expect(find(screen)).not.toBeNull();
	});

	it('exposes a landmark role and accessible name', async () => {
		const screen = await render(SlotProbe, slot('H', { role: 'banner', label: 'Site header' }));
		await expect.element(screen.getByRole('banner', { name: 'Site header' })).toBeInTheDocument();
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

	it('hands the outer element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(SlotProbe, slot('H', { [createAttachmentKey()]: attached }));
		expect(attached.mock.calls[0][0]).toBe(find(screen));
	});

	it('merges a caller class', async () => {
		const screen = await render(SlotProbe, slot('H', { class: 'hdr-custom' }));
		expect(find(screen).className).toContain('hdr-custom');
	});

	// Upstream asserts the text node's parent *is* the root; here the fixture
	// wraps the text in a span of its own, so what is checked is the same fact
	// one level down — the children live inside the padding-owning inner
	// wrapper, which is not the divider-owning root.
	it('renders children in an inner wrapper (the padding owner), not on the root', async () => {
		const screen = await render(SlotProbe, slot('Inner'));
		const root = find(screen);
		const inner = root.firstElementChild as HTMLElement;
		expect(inner).not.toBe(root);
		expect(inner.textContent).toBe('Inner');
		expect(root.children).toHaveLength(1);
	});
});

describe('LayoutFooter', () => {
	const slot = (text: string, rest: Record<string | symbol, unknown> = {}) => ({
		props: { component: LayoutFooter, slot: 'children', text, rest }
	});
	const find = (screen: { container: HTMLElement }) =>
		screen.container.querySelector('.astryx-layout-footer') as HTMLElement;

	it('renders its children', async () => {
		const screen = await render(SlotProbe, slot('Actions'));
		await expect.element(screen.getByText('Actions')).toBeInTheDocument();
	});

	it('carries the astryx-layout-footer class', async () => {
		const screen = await render(SlotProbe, slot('F'));
		expect(find(screen)).not.toBeNull();
	});

	it('exposes a landmark role and accessible name', async () => {
		const screen = await render(
			SlotProbe,
			slot('F', { role: 'contentinfo', label: 'Page footer' })
		);
		await expect
			.element(screen.getByRole('contentinfo', { name: 'Page footer' }))
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

	it('hands the outer element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(SlotProbe, slot('F', { [createAttachmentKey()]: attached }));
		expect(attached.mock.calls[0][0]).toBe(find(screen));
	});
});

describe('LayoutContent', () => {
	const slot = (text: string, rest: Record<string | symbol, unknown> = {}) => ({
		props: { component: LayoutContent, slot: 'children', text, rest }
	});
	const find = (screen: { container: HTMLElement }) =>
		screen.container.querySelector('.astryx-layout-content') as HTMLElement;

	it('renders its children', async () => {
		const screen = await render(SlotProbe, slot('Body'));
		await expect.element(screen.getByText('Body')).toBeInTheDocument();
	});

	it('carries the astryx-layout-content class', async () => {
		const screen = await render(SlotProbe, slot('C'));
		expect(find(screen)).not.toBeNull();
	});

	it('exposes the main landmark role with an accessible name', async () => {
		const screen = await render(SlotProbe, slot('C', { role: 'main', label: 'Main content' }));
		await expect.element(screen.getByRole('main', { name: 'Main content' })).toBeInTheDocument();
	});

	it('hands the element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(SlotProbe, slot('C', { [createAttachmentKey()]: attached }));
		expect(attached.mock.calls[0][0]).toBe(find(screen));
	});

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
		expect(find(screen)).not.toBeNull();
		await screen.rerender({
			component: LayoutContent,
			slot: 'children',
			text: 'C',
			rest: { padding: 6 }
		});
		expect(find(screen)).not.toBeNull();
	});
});

describe('LayoutPanel', () => {
	const slot = (text: string, rest: Record<string | symbol, unknown> = {}) => ({
		props: { component: LayoutPanel, slot: 'children', text, rest }
	});
	const find = (screen: { container: HTMLElement }) =>
		screen.container.querySelector('.astryx-layout-panel') as HTMLElement;

	it('renders its children', async () => {
		const screen = await render(SlotProbe, slot('Nav'));
		await expect.element(screen.getByText('Nav')).toBeInTheDocument();
	});

	it('carries the astryx-layout-panel class', async () => {
		const screen = await render(SlotProbe, slot('P'));
		expect(find(screen)).not.toBeNull();
	});

	it('exposes a navigation landmark with an accessible name', async () => {
		const screen = await render(SlotProbe, slot('P', { role: 'navigation', label: 'Primary' }));
		await expect.element(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
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

	it('hands the element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(SlotProbe, slot('P', { [createAttachmentKey()]: attached }));
		expect(attached.mock.calls[0][0]).toBe(find(screen));
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
			.element(screen.getByRole('navigation', { name: 'Side' }))
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
			.element(screen.getByRole('complementary', { name: 'Inspector' }))
			.toHaveTextContent('Details');
	});

	it('merges a caller class', async () => {
		const screen = await render(SlotProbe, slot('P', { class: 'panel-custom' }));
		expect(find(screen).className).toContain('panel-custom');
	});
});

describe('edge compensation', () => {
	it('applies the edge comp attribute to a ghost button', async () => {
		const screen = await render(Button, { props: { label: 'Action', variant: 'ghost' } });
		expect(screen.getByRole('button', { name: 'Action' }).element()).toHaveAttribute(
			EDGE_COMP_ATTR
		);
	});

	it('applies the edge comp attribute to a ghost icon-only button', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: Button,
				slot: 'icon',
				text: 'gear',
				rest: { label: 'Settings', variant: 'ghost', isIconOnly: true }
			}
		});
		expect(screen.getByRole('button', { name: 'Settings' }).element()).toHaveAttribute(
			EDGE_COMP_ATTR
		);
	});

	for (const variant of ['primary', 'secondary', 'destructive'] as const) {
		it(`does not apply the edge comp attribute to the ${variant} variant`, async () => {
			const screen = await render(Button, { props: { label: variant, variant } });
			expect(screen.getByRole('button', { name: variant }).element()).not.toHaveAttribute(
				EDGE_COMP_ATTR
			);
		});
	}

	describe('Tab data attribute', () => {
		// Upstream writes the strip as JSX children; here the tabs are a data spec
		// through `tab-list-fixture`, since `Tab`'s slots are `Snippet`s.
		const strip = {
			props: {
				tabList: { value: '', onChange: () => {}, 'aria-label': 'Tabs' },
				tabs: [{ props: { value: 'tab1', label: 'Tab 1' } }]
			}
		};

		it('applies the edge comp attribute to a tab', async () => {
			const screen = await render(TabListFixture, strip);
			expect(screen.getByRole('button', { name: 'Tab 1' }).element()).toHaveAttribute(
				EDGE_COMP_ATTR
			);
		});

		it('applies the edge comp attribute to the TabList wrapper', async () => {
			const screen = await render(TabListFixture, strip);
			expect(screen.getByRole('navigation', { name: 'Tabs' }).element()).toHaveAttribute(
				EDGE_COMP_ATTR
			);
		});
	});

	describe('Toolbar container compensation', () => {
		it('renders ghost buttons inside toolbar slots', async () => {
			const screen = await render(ToolbarEdgeComp, {
				props: {
					label: 'Actions',
					start: { props: { label: 'Cut', variant: 'ghost' } },
					end: { props: { label: 'Paste', variant: 'ghost' } }
				}
			});
			expect(screen.getByRole('button', { name: 'Cut' }).element()).toHaveAttribute(EDGE_COMP_ATTR);
			expect(screen.getByRole('button', { name: 'Paste' }).element()).toHaveAttribute(
				EDGE_COMP_ATTR
			);
		});

		it('does not add the edge comp attribute to non-ghost buttons in a toolbar', async () => {
			const screen = await render(ToolbarEdgeComp, {
				props: { label: 'Actions', end: { props: { label: 'Save', variant: 'primary' } } }
			});
			expect(screen.getByRole('button', { name: 'Save' }).element()).not.toHaveAttribute(
				EDGE_COMP_ATTR
			);
		});
	});

	describe('Banner container compensation', () => {
		it('renders a dismissable banner with a ghost dismiss button', async () => {
			const screen = await render(Banner, {
				props: { status: 'info', title: 'Test', isDismissable: true }
			});
			expect(screen.getByRole('button', { name: 'Dismiss' }).element()).toHaveAttribute(
				EDGE_COMP_ATTR
			);
		});
	});

	// The container's compensation selector is a direct-child combinator:
	//   :has(> [data-astryx-edge-comp]:last-child)
	// so an edge-comp marker only counts when it sits on a *direct* child of the
	// slot. Attaching a tooltip must not bury the marker one level deeper — the
	// Button uses the tooltip hook (no wrapper element) so the marker stays on the
	// button itself (#2578).
	describe('Tooltip attachment preserves marker discoverability', () => {
		// Resolve the toolbar slot (the flex wrapper that carries the negative
		// margin) — it is the direct child of the [role="toolbar"] row.
		const findSlot = (button: HTMLElement, toolbar: HTMLElement): HTMLElement => {
			let node = button;
			while (node.parentElement && node.parentElement !== toolbar) {
				node = node.parentElement;
			}
			return node;
		};

		it('keeps the marker on a direct child of the slot without a tooltip', async () => {
			const screen = await render(ToolbarEdgeComp, {
				props: {
					label: 'Actions',
					end: {
						props: { label: 'Close', variant: 'ghost', isIconOnly: true },
						iconGlyph: 'x'
					}
				}
			});
			const button = screen.getByRole('button', { name: 'Close' }).element() as HTMLElement;
			const toolbar = screen.container.querySelector('[role="toolbar"]') as HTMLElement;
			const slot = findSlot(button, toolbar);
			const directMarked = slot.querySelector(`:scope > [${EDGE_COMP_ATTR}]`);
			expect(directMarked).not.toBeNull();
		});

		it('keeps the marker on a direct child of the slot when tooltip is set', async () => {
			const screen = await render(ToolbarEdgeComp, {
				props: {
					label: 'Actions',
					end: {
						props: {
							label: 'Close',
							variant: 'ghost',
							isIconOnly: true,
							tooltip: 'Close panel'
						},
						iconGlyph: 'x'
					}
				}
			});
			const button = screen.getByRole('button', { name: 'Close' }).element() as HTMLElement;
			const toolbar = screen.container.querySelector('[role="toolbar"]') as HTMLElement;
			const slot = findSlot(button, toolbar);
			// The tooltip is attached via the hook (no wrapper element), so the
			// marker stays on the button — a direct child of the container's slot —
			// and the container's direct-child `:has(> [marker]:last-child)` selector
			// still matches.
			const directMarked = slot.querySelector(`:scope > [${EDGE_COMP_ATTR}]`);
			expect(directMarked).not.toBeNull();
		});
	});
});
