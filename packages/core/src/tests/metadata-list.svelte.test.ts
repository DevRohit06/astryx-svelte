/** PORTS: MetadataList/MetadataList.test.tsx */

import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import MetadataListHarness from './fixtures/metadata-list-harness.svelte';
import MetadataListI18n from './fixtures/metadata-list-i18n.svelte';

/**
 * Astryx's `MetadataList/MetadataList.test.tsx`, covering `MetadataList` and
 * `MetadataListItem` — upstream keeps both in the one suite.
 *
 * These cases were written inside `form-and-metadata.svelte.test.ts`, which
 * carried three components' suites at once and duplicated a fourth file's
 * `FieldStatus` block outright. One file ports one upstream suite, so they moved
 * here whole rather than being rewritten; nothing was dropped or restated in the
 * move.
 *
 * `ref` forwarding becomes the attachment a consumer passes through the rest
 * props, as everywhere else in this tree.
 *
 * The **server** half is `metadata-list.test.ts`, which has no upstream
 * counterpart: React slices `children` before rendering anything, so upstream's
 * `maxNumOfItems` cut is server-side by construction, while ours counts items as
 * they render and has to prove the count is final in time.
 */

describe('MetadataList', () => {
	const pairs: [string, string][] = [
		['Name', 'Alice'],
		['Role', 'Engineer']
	];

	it('renders a description list with items', async () => {
		const screen = await render(MetadataListHarness, { props: { items: pairs } });
		for (const text of ['Name', 'Alice', 'Role', 'Engineer']) {
			await expect.element(screen.getByText(text, { exact: true })).toBeInTheDocument();
		}
	});

	it('renders a semantic dl element', async () => {
		const screen = await render(MetadataListHarness, { props: { items: [['Key', 'Value']] } });
		expect(screen.container.querySelector('dl')).not.toBeNull();
		expect(screen.container.querySelector('dt')).not.toBeNull();
		expect(screen.container.querySelector('dd')).not.toBeNull();
	});

	it('renders a title when provided', async () => {
		const screen = await render(MetadataListHarness, {
			props: { items: [['Key', 'Value']], hasTitle: true }
		});
		await expect.element(screen.getByText('Details', { exact: true })).toBeInTheDocument();
	});

	it('supports data-testid', async () => {
		const screen = await render(MetadataListHarness, {
			props: { items: [['Key', 'Value']], 'data-testid': 'my-list' }
		});
		expect(screen.container.querySelector('[data-testid="my-list"]')).not.toBeNull();
	});

	it('shows "Show more" button when items exceed maxNumOfItems', async () => {
		const screen = await render(MetadataListHarness, {
			props: {
				items: [
					['A', '1'],
					['B', '2'],
					['C', '3']
				],
				maxNumOfItems: 2
			}
		});
		await expect.element(screen.getByText('Show more', { exact: true })).toBeInTheDocument();
		// The third item is not rendered at all, as upstream's slice does.
		expect(screen.container.textContent).not.toContain('C');
	});

	it('toggles show more / show less', async () => {
		const screen = await render(MetadataListHarness, {
			props: {
				items: [
					['A', '1'],
					['B', '2']
				],
				maxNumOfItems: 1
			}
		});
		expect(screen.container.textContent).not.toContain('B');

		await userEvent.click(screen.getByText('Show more', { exact: true }));
		await expect.element(screen.getByText('B', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Show less', { exact: true })).toBeInTheDocument();

		await userEvent.click(screen.getByText('Show less', { exact: true }));
		expect(screen.container.textContent).not.toContain('B');
	});

	it('localizes the show more / show less labels through the i18n catalog', async () => {
		const screen = await render(MetadataListI18n, {
			props: {
				locale: 'fr',
				overrides: {
					fr: {
						'@astryx.metadataList.showMore': 'Afficher plus',
						'@astryx.metadataList.showLess': 'Afficher moins'
					}
				},
				items: [
					['A', '1'],
					['B', '2']
				],
				maxNumOfItems: 1
			}
		});

		await userEvent.click(screen.getByText('Afficher plus', { exact: true }));
		await expect.element(screen.getByText('Afficher moins', { exact: true })).toBeInTheDocument();
	});

	it('does not show toggle in horizontal mode even with maxNumOfItems', async () => {
		const screen = await render(MetadataListHarness, {
			props: {
				items: [
					['A', '1'],
					['B', '2']
				],
				orientation: 'horizontal',
				maxNumOfItems: 1
			}
		});
		expect(screen.container.textContent).not.toContain('Show more');
		await expect.element(screen.getByText('A', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('B', { exact: true })).toBeInTheDocument();
	});

	describe('numeric columns', () => {
		// A fixed column count is a runtime value, so it arrives as a StyleX
		// dynamic style: the template lands in the element's inline style (as the
		// generated custom property) rather than in a static class rule.
		const gridTemplateOf = (container: HTMLElement) =>
			container.querySelector('dl')?.getAttribute('style') ?? '';

		it('renders the requested number of columns with stacked labels', async () => {
			const screen = await render(MetadataListHarness, {
				props: { items: [['A', '1']], columns: 3 }
			});

			expect(gridTemplateOf(screen.container)).toContain('repeat(3, 1fr)');
		});

		it('renders label and value tracks per column with side labels', async () => {
			const screen = await render(MetadataListHarness, {
				props: { items: [['A', '1']], columns: 3, label: { position: 'start' } }
			});

			expect(gridTemplateOf(screen.container)).toContain('repeat(3, auto 1fr)');
		});

		it('leaves the grid to the static rule for columns="multi"', async () => {
			const screen = await render(MetadataListHarness, {
				props: { items: [['A', '1']], columns: 'multi' }
			});

			expect(gridTemplateOf(screen.container)).not.toContain('repeat(');
		});

		it('ignores numeric columns in horizontal orientation', async () => {
			const screen = await render(MetadataListHarness, {
				props: { items: [['A', '1']], columns: 3, orientation: 'horizontal' }
			});

			expect(gridTemplateOf(screen.container)).not.toContain('repeat(');
		});

		it('still applies a custom label width with side labels', async () => {
			const screen = await render(MetadataListHarness, {
				props: { items: [['A', '1']], label: { position: 'start', width: 120 } }
			});

			expect(gridTemplateOf(screen.container)).toContain('120px 1fr');
		});
	});
});

describe('MetadataListItem', () => {
	it('renders label and children', async () => {
		const screen = await render(MetadataListHarness, { props: { items: [['Status', 'Active']] } });
		await expect.element(screen.getByText('Status', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Active', { exact: true })).toBeInTheDocument();
	});

	it('renders an icon when provided', async () => {
		const screen = await render(MetadataListHarness, {
			props: { items: [['Info', 'Details']], iconOn: 'Info' }
		});
		expect(screen.container.querySelector('[data-testid="test-icon"]')).not.toBeNull();
	});

	it('renders in stacked mode when label position is top', async () => {
		const screen = await render(MetadataListHarness, {
			props: { items: [['Key', 'Value']], label: { position: 'top' } }
		});
		// Stacked mode wraps the dt and dd in a div; inline mode does not.
		const wrapper = screen.container.querySelector('.astryx-metadata-list-item')!;
		expect(wrapper.tagName).toBe('DIV');
		expect(wrapper.querySelector('dt')).not.toBeNull();
		expect(wrapper.querySelector('dd')).not.toBeNull();
	});
});
