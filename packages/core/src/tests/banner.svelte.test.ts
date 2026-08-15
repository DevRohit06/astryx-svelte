import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import Banner from '$lib/components/banner/banner.svelte';
import { registerIcons, resetIcons } from '$lib/components/icon/icon-registry.js';
import BannerFixture from './fixtures/banner-fixture.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';
import { customChevron, customInfo } from './fixtures/banner-registry-icons.svelte';

/**
 * Ported from Astryx's `Banner/Banner.test.tsx`, all **38** cases at v0.4.1.
 * Nothing is dropped.
 *
 * (At v0.3.0 this was 35. The three added here are #4166's "Status icon color
 * theming" block, which pins the `banner-icon` theme target to the element that
 * paints — the status `<Icon>` — and keeps it on the wrapper only when a custom
 * `icon` is passed. An earlier header said "all 33 cases": upstream had 35, and
 * the nested `describe('elevation')` pair that arrived with 0.1.9's `elevation`
 * prop had never been carried across.)
 *
 * Cases with `children` or `endContent` go through `banner-fixture.svelte`, and
 * the custom-icon case through the shared `slot-probe` — both slots are snippets
 * here, and a snippet can only be authored in a template. The two icon-registry
 * cases register snippets exported from `banner-registry-icons.svelte` for the
 * same reason.
 *
 * One case is a **counterpart** rather than a translation, commented where it
 * appears: `forwards ref`. Svelte has no `ref`; a consumer reaches the root
 * through an attachment travelling in the rest props, which `Banner` spreads onto
 * its root `<div>` — so that is what is asserted, and it checks more than
 * upstream's does, receiving the element rather than only proving a ref landed.
 *
 * Runs in the **client** (real Chromium) project: the dismiss and expand paths go
 * through `Button`, whose tooltip attaches on hover, and the toggle cases drive
 * real clicks.
 */

describe('Banner', () => {
	afterEach(() => {
		resetIcons();
	});

	it('renders with title and status', async () => {
		const screen = await render(Banner, { props: { status: 'info', title: 'Test Banner' } });
		await expect.element(screen.getByText('Test Banner')).toBeInTheDocument();
	});

	it('renders info status with role="status"', async () => {
		const screen = await render(Banner, { props: { status: 'info', title: 'Info' } });
		await expect.element(screen.getByRole('status')).toBeInTheDocument();
	});

	it('renders warning status with role="alert"', async () => {
		const screen = await render(Banner, { props: { status: 'warning', title: 'Warning' } });
		await expect.element(screen.getByRole('alert')).toBeInTheDocument();
	});

	it('renders error status with role="alert"', async () => {
		const screen = await render(Banner, { props: { status: 'error', title: 'Error' } });
		await expect.element(screen.getByRole('alert')).toBeInTheDocument();
	});

	it('renders success status with role="status"', async () => {
		const screen = await render(Banner, { props: { status: 'success', title: 'Success' } });
		await expect.element(screen.getByRole('status')).toBeInTheDocument();
	});

	it('renders default icon per status with aria-hidden', async () => {
		const screen = await render(Banner, { props: { status: 'info', title: 'Info Banner' } });
		const iconWrapper = screen.container.querySelector('[aria-hidden="true"]');
		expect(iconWrapper).toBeInTheDocument();
		// Default icon should be an SVG
		expect(iconWrapper?.querySelector('svg')).toBeInTheDocument();
	});

	it('renders custom icon override', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: Banner,
				slot: 'icon',
				text: '★',
				testid: 'custom-icon',
				rest: { status: 'info', title: 'Custom Icon' }
			}
		});
		await expect.element(screen.getByTestId('custom-icon')).toBeInTheDocument();
	});

	it('renders description', async () => {
		const screen = await render(Banner, {
			props: { status: 'info', title: 'Title', description: 'This is a description' }
		});
		await expect.element(screen.getByText('This is a description')).toBeInTheDocument();
	});

	it('renders title and description as <div> (never <p>) for composition safety', async () => {
		const screen = await render(Banner, {
			props: { status: 'info', title: 'Title', description: 'Description' }
		});
		// Block content can be nested inside Banner text slots without tripping
		// the phrasing-content trap that <p> imposes, so neither slot is a <p>.
		expect(screen.container.querySelector('p')).toBeNull();
		expect(screen.getByText('Title', { exact: true }).element().tagName).toBe('DIV');
		expect(screen.getByText('Description', { exact: true }).element().tagName).toBe('DIV');
	});

	it('does not render description when not provided', async () => {
		const screen = await render(Banner, { props: { status: 'info', title: 'Title Only' } });
		// Title renders; no description text is present.
		await expect.element(screen.getByText('Title Only')).toBeInTheDocument();
		expect(screen.container.textContent).not.toContain('This is a description');
	});

	it('renders dismiss button when isDismissable', async () => {
		const screen = await render(Banner, {
			props: { status: 'info', title: 'Dismissable', isDismissable: true }
		});
		await expect.element(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
	});

	it('calls onDismiss when dismiss button is clicked', async () => {
		const onDismiss = vi.fn();
		const screen = await render(Banner, {
			props: { status: 'info', title: 'Dismissable', isDismissable: true, onDismiss }
		});
		await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it('hides banner on dismiss without onDismiss callback', async () => {
		const screen = await render(Banner, {
			props: {
				status: 'info',
				title: 'Self Dismissing',
				isDismissable: true,
				'data-testid': 'banner'
			}
		});
		expect(screen.container.querySelector('[data-testid="banner"]')).toBeInTheDocument();
		await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
		expect(screen.container.querySelector('[data-testid="banner"]')).not.toBeInTheDocument();
	});

	it('hides banner on dismiss and calls onDismiss', async () => {
		const onDismiss = vi.fn();
		const screen = await render(Banner, {
			props: {
				status: 'info',
				title: 'Dismissable',
				isDismissable: true,
				onDismiss,
				'data-testid': 'banner'
			}
		});
		await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
		expect(screen.container.querySelector('[data-testid="banner"]')).not.toBeInTheDocument();
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it('does not render dismiss button when isDismissable is false', async () => {
		const screen = await render(Banner, { props: { status: 'info', title: 'Not Dismissable' } });
		expect(screen.container.querySelector('[aria-label="Dismiss"]')).not.toBeInTheDocument();
	});

	it('renders endContent', async () => {
		const screen = await render(BannerFixture, {
			props: {
				props: { status: 'info', title: 'With Action' },
				endButtonTestid: 'end-btn'
			}
		});
		await expect.element(screen.getByTestId('end-btn')).toBeInTheDocument();
	});

	it('renders card container by default', async () => {
		const screen = await render(Banner, { props: { status: 'info', title: 'Card Container' } });
		expect(screen.container.firstElementChild).toBeInTheDocument();
	});

	it('renders section container', async () => {
		const screen = await render(Banner, {
			props: { status: 'info', title: 'Section Container', container: 'section' }
		});
		expect(screen.container.firstElementChild).toBeInTheDocument();
	});

	// =========================================================================
	// Collapsible content area
	// =========================================================================

	it('hides children by default (collapsed)', async () => {
		const screen = await render(BannerFixture, {
			props: {
				props: { status: 'info', title: 'Collapsible' },
				hasChildren: true,
				childTestid: 'child-content'
			}
		});
		expect(screen.container.querySelector('[data-testid="child-content"]')).not.toBeInTheDocument();
	});

	it('shows children when defaultIsExpanded is true', async () => {
		const screen = await render(BannerFixture, {
			props: {
				props: { status: 'info', title: 'Expanded', defaultIsExpanded: true },
				hasChildren: true,
				childTestid: 'child-content'
			}
		});
		await expect.element(screen.getByTestId('child-content')).toBeInTheDocument();
	});

	it('shows expand button when children are provided', async () => {
		const screen = await render(BannerFixture, {
			props: {
				props: { status: 'info', title: 'With Toggle' },
				hasChildren: true,
				childText: 'Content'
			}
		});
		await expect.element(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
	});

	it('does not show expand/collapse button when no children', async () => {
		const screen = await render(Banner, { props: { status: 'info', title: 'No Children' } });
		expect(screen.container.querySelector('[aria-label="Expand"]')).not.toBeInTheDocument();
		expect(screen.container.querySelector('[aria-label="Collapse"]')).not.toBeInTheDocument();
	});

	it('toggles children visibility on expand/collapse click', async () => {
		const screen = await render(BannerFixture, {
			props: {
				props: { status: 'info', title: 'Toggle Test' },
				hasChildren: true,
				childTestid: 'child-content'
			}
		});

		// Initially collapsed
		expect(screen.container.querySelector('[data-testid="child-content"]')).not.toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();

		// Click to expand
		await userEvent.click(screen.getByRole('button', { name: 'Expand' }));
		await expect.element(screen.getByTestId('child-content')).toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument();

		// Click to collapse
		await userEvent.click(screen.getByRole('button', { name: 'Collapse' }));
		expect(screen.container.querySelector('[data-testid="child-content"]')).not.toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
	});

	it('shows collapse button when defaultIsExpanded', async () => {
		const screen = await render(BannerFixture, {
			props: {
				props: { status: 'info', title: 'Expanded', defaultIsExpanded: true },
				hasChildren: true,
				childText: 'Content'
			}
		});
		await expect.element(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
	});

	it('renders expand button to the left of dismiss button', async () => {
		const screen = await render(BannerFixture, {
			props: {
				props: { status: 'info', title: 'Order Test', isDismissable: true },
				hasChildren: true,
				childText: 'Content'
			}
		});
		const buttons = screen.container.querySelectorAll('button');
		const buttonNames = Array.from(buttons).map(
			(b) => b.getAttribute('aria-label') || b.textContent
		);
		const expandIndex = buttonNames.indexOf('Expand');
		const dismissIndex = buttonNames.indexOf('Dismiss');
		expect(expandIndex).toBeLessThan(dismissIndex);
	});

	it('links the expand toggle to its content region via aria-controls', async () => {
		const screen = await render(BannerFixture, {
			props: {
				props: { status: 'info', title: 'Controls Test', defaultIsExpanded: true },
				hasChildren: true,
				childTestid: 'region-content',
				childText: 'Region content'
			}
		});

		const toggle = screen.getByRole('button', { name: 'Collapse' }).element();
		const controlsId = toggle.getAttribute('aria-controls');
		// aria-controls must be present and point at the real content region.
		expect(controlsId).toBeTruthy();
		const region = document.getElementById(controlsId as string);
		expect(region).not.toBeNull();
		expect(region).toContainElement(
			screen.container.querySelector<HTMLElement>('[data-testid="region-content"]')
		);
	});

	it('sets aria-controls only while the content region is mounted', async () => {
		const screen = await render(BannerFixture, {
			props: {
				props: { status: 'info', title: 'Controls Toggle' },
				hasChildren: true,
				childTestid: 'region-content',
				childText: 'Region content'
			}
		});

		// Collapsed: the region is unmounted, so no dangling aria-controls target.
		const collapsedToggle = screen.getByRole('button', { name: 'Expand' });
		await expect.element(collapsedToggle).not.toHaveAttribute('aria-controls');

		// Expanded: aria-controls resolves to the mounted region with the children.
		await userEvent.click(collapsedToggle);
		const expandedToggle = screen.getByRole('button', { name: 'Collapse' }).element();
		const controlsId = expandedToggle.getAttribute('aria-controls');
		expect(controlsId).toBeTruthy();
		const region = document.getElementById(controlsId as string);
		expect(region).not.toBeNull();
		expect(region).toContainElement(
			screen.container.querySelector<HTMLElement>('[data-testid="region-content"]')
		);
	});

	it('does not render content area when no children', async () => {
		const screen = await render(Banner, { props: { status: 'info', title: 'No Children' } });
		// Root should have only 1 child div: the header
		expect(screen.container.firstElementChild?.children).toHaveLength(1);
	});

	it('supports data-testid', async () => {
		const screen = await render(Banner, {
			props: { status: 'info', title: 'Test ID', 'data-testid': 'my-banner' }
		});
		await expect.element(screen.getByTestId('my-banner')).toBeInTheDocument();
	});

	it('renders each status type correctly', async () => {
		const statuses = ['info', 'warning', 'error', 'success'] as const;
		for (const status of statuses) {
			const screen = await render(Banner, {
				props: { status, title: `${status} banner` }
			});
			await expect.element(screen.getByText(`${status} banner`)).toBeInTheDocument();
			screen.unmount();
		}
	});

	it('forwards an attachment to the root element', async () => {
		// Upstream's `forwards ref`. Svelte has no `ref` — a consumer captures the
		// root through an attachment in the rest props, which `Banner` spreads onto
		// its root `<div>`.
		const attached = vi.fn();
		const screen = await render(Banner, {
			props: {
				status: 'info',
				title: 'Ref Test',
				[createAttachmentKey()]: (node: Element) => attached(node)
			}
		});
		expect(attached).toHaveBeenCalledWith(screen.container.firstElementChild);
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLDivElement);
	});

	// =========================================================================
	// Status icon color theming (#4166)
	// =========================================================================

	it("carries the 'banner-icon' theme target on the default status icon glyph", async () => {
		// Theme overrides for 'banner-icon' + 'status:X' compile to
		// '.astryx-banner-icon.<status>' (parseStyleKey). The target must sit on
		// the <Icon> span itself so those same-element rules in
		// @layer astryx-theme beat the Icon's own color variant.
		const statuses = ['info', 'warning', 'error', 'success'] as const;
		for (const status of statuses) {
			const screen = await render(Banner, {
				props: { status, title: `${status} banner` }
			});
			const glyph = screen.container.querySelector(`.astryx-icon.astryx-banner-icon.${status}`);
			expect(glyph).not.toBeNull();
			expect(glyph).toHaveAttribute('data-status', status);
			// Exactly one element carries the target — the layout wrapper no
			// longer does.
			expect(screen.container.querySelectorAll('.astryx-banner-icon')).toHaveLength(1);
			screen.unmount();
		}
	});

	it('keeps the color variant on the theme-target element (regression pin for #4166)', async () => {
		// Pre-fix, '.astryx-banner-icon.info' matched the layout wrapper while
		// the color variant (data-color="accent") sat on an inner span that a
		// theme override could never reach. Target and paint now share one
		// element.
		const screen = await render(Banner, { props: { status: 'info', title: 'Info' } });
		const target = screen.container.querySelector('.astryx-banner-icon.info');
		expect(target).toHaveAttribute('data-color', 'accent');
	});

	it("keeps the 'banner-icon' target on the wrapper for a custom icon node", async () => {
		// Core never injects props into consumer markup, so with a custom `icon`
		// the target stays on the (layout-only) wrapper and overrides reach the
		// node via inheritance. The node itself is untouched.
		const screen = await render(SlotProbe, {
			props: {
				component: Banner,
				slot: 'icon',
				text: 'i',
				testid: 'custom-glyph',
				rest: { status: 'info', title: 'Custom icon' }
			}
		});
		const targets = screen.container.querySelectorAll('.astryx-banner-icon');
		expect(targets).toHaveLength(1);
		expect(targets[0]?.tagName).toBe('DIV');
		expect(targets[0]).toHaveAttribute('aria-hidden', 'true');
		const custom = screen.container.querySelector('[data-testid="custom-glyph"]');
		expect(custom).not.toBeNull();
		expect(custom?.className).toBe('');
	});

	// =========================================================================
	// Icon registry integration
	// =========================================================================

	it('uses icons from the global registry when registered', async () => {
		registerIcons({ info: customInfo });
		const screen = await render(Banner, { props: { status: 'info', title: 'Registry Test' } });
		await expect.element(screen.getByTestId('custom-registry-icon')).toBeInTheDocument();
	});

	it('uses chevronDown from the registry for expand/collapse', async () => {
		registerIcons({ chevronDown: customChevron });
		const screen = await render(BannerFixture, {
			props: {
				props: { status: 'info', title: 'Chevron Test' },
				hasChildren: true,
				childText: 'Content'
			}
		});
		await expect.element(screen.getByTestId('custom-chevron')).toBeInTheDocument();
	});

	describe('elevation', () => {
		it('renders a distinct root class for each elevation level', async () => {
			const classFor = async (elevation: 'none' | 'low' | 'med' | 'high'): Promise<string> => {
				const screen = await render(Banner, {
					props: { status: 'info', title: 'Heads up', elevation }
				});
				return screen.container.firstElementChild!.className;
			};
			const classes = new Set([
				await classFor('none'),
				await classFor('low'),
				await classFor('med'),
				await classFor('high')
			]);
			expect(classes.size).toBe(4);
		});

		it('defaults to flat (elevation none)', async () => {
			const def = await render(Banner, { props: { status: 'info', title: 'Heads up' } });
			const none = await render(Banner, {
				props: { status: 'info', title: 'Heads up', elevation: 'none' }
			});
			expect(def.container.firstElementChild!.className).toBe(
				none.container.firstElementChild!.className
			);
		});
	});
});
