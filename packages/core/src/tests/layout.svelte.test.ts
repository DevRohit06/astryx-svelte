import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import Banner from '$lib/components/banner/banner.svelte';
import Button from '$lib/components/button/button.svelte';
import { EDGE_COMP_ATTR } from '$lib/internal/edge-compensation.stylex.js';
import LayoutFixture from './fixtures/layout-fixture.svelte';
import LayoutShell from './fixtures/layout-shell.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';
import TabListFixture from './fixtures/tab-list-fixture.svelte';
import ToolbarEdgeComp from './fixtures/toolbar-edge-comp-fixture.svelte';

/**
 * `Layout` itself, covering `Layout.test.tsx` and
 * `Layout/__tests__/edgeCompensation.test.tsx`.
 *
 * `Layout.test.tsx` declares 24 `it`s at v0.4.5 and all 24 are here;
 * `__tests__/edgeCompensation.test.tsx` declares 12 and all 12 are here. Seven
 * of the latter (`Tab`, `TabList`, `Toolbar`, `Banner`, and the two
 * tooltip-marker cases) were parked when this file was written, on the grounds
 * that those components did not exist yet; all of them now do, so the deferral
 * is retired rather than restated.
 *
 * Two shapes recur. A slot is a **snippet**, so the cases that pass markup into
 * one go through a fixture — `layout-fixture` for bare `<div>`s, `layout-shell`
 * for the real slot components. And `ref` forwarding becomes the attachment a
 * consumer passes through the rest props, as in every batch since `Thumbnail`.
 *
 * **Three upstream suites are not this file's, and one file ports one suite:**
 * - `Layout/__tests__/contentWidth.test.tsx` → `layout-content-width.svelte.test.ts`
 * - `Layout/__tests__/childrenAsContent.test.tsx` →
 *   `layout-children-as-content.svelte.test.ts`
 * - `Layout/LayoutSlots.test.tsx` → `layout-slots.svelte.test.ts`
 *
 * All three moved out of here whole, so no case was lost in any of the splits.
 * The four slot primitives' own describes — `LayoutHeader`, `LayoutFooter`,
 * `LayoutContent`, `LayoutPanel` — went with the third and are not duplicated
 * here; what is left of them in this file is the handful of `Layout.test.tsx`
 * cases that drive a slot component *through* a `Layout`, which is what those
 * cases are about.
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

describe('edge compensation', () => {
	it('applies the edge comp attribute to a ghost button', async () => {
		const screen = await render(Button, { props: { label: 'Action', variant: 'ghost' } });
		expect(screen.getByRole('button', { name: 'Action', exact: true }).element()).toHaveAttribute(
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
		expect(screen.getByRole('button', { name: 'Settings', exact: true }).element()).toHaveAttribute(
			EDGE_COMP_ATTR
		);
	});

	for (const variant of ['primary', 'secondary', 'destructive'] as const) {
		it(`does not apply the edge comp attribute to the ${variant} variant`, async () => {
			const screen = await render(Button, { props: { label: variant, variant } });
			expect(
				screen.getByRole('button', { name: variant, exact: true }).element()
			).not.toHaveAttribute(EDGE_COMP_ATTR);
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
			expect(screen.getByRole('button', { name: 'Tab 1', exact: true }).element()).toHaveAttribute(
				EDGE_COMP_ATTR
			);
		});

		it('applies the edge comp attribute to the TabList wrapper', async () => {
			const screen = await render(TabListFixture, strip);
			expect(
				screen.getByRole('navigation', { name: 'Tabs', exact: true }).element()
			).toHaveAttribute(EDGE_COMP_ATTR);
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
			expect(screen.getByRole('button', { name: 'Cut', exact: true }).element()).toHaveAttribute(
				EDGE_COMP_ATTR
			);
			expect(screen.getByRole('button', { name: 'Paste', exact: true }).element()).toHaveAttribute(
				EDGE_COMP_ATTR
			);
		});

		it('does not add the edge comp attribute to non-ghost buttons in a toolbar', async () => {
			const screen = await render(ToolbarEdgeComp, {
				props: { label: 'Actions', end: { props: { label: 'Save', variant: 'primary' } } }
			});
			expect(
				screen.getByRole('button', { name: 'Save', exact: true }).element()
			).not.toHaveAttribute(EDGE_COMP_ATTR);
		});
	});

	describe('Banner container compensation', () => {
		it('renders a dismissable banner with a ghost dismiss button', async () => {
			const screen = await render(Banner, {
				props: { status: 'info', title: 'Test', isDismissable: true }
			});
			expect(
				screen.getByRole('button', { name: 'Dismiss', exact: true }).element()
			).toHaveAttribute(EDGE_COMP_ATTR);
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
			const button = screen
				.getByRole('button', { name: 'Close', exact: true })
				.element() as HTMLElement;
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
			const button = screen
				.getByRole('button', { name: 'Close', exact: true })
				.element() as HTMLElement;
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
