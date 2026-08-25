import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import EmptyState from '$lib/components/empty-state/empty-state.svelte';
import { defineTheme } from '$lib/theme/define-theme.js';
import { generateThemeRulesSplit } from '$lib/theme/generate-theme-rules.js';
import EmptyStateSlots from './fixtures/empty-state-slots.svelte';

/**
 * Astryx's `EmptyState/EmptyState.test.tsx` at the **0.5.0** pin, ported case for case.
 *
 * The count is the contract: upstream declares **20** `it` blocks at this pin —
 * 16 in `describe('EmptyState')` and 4 in the nested `describe('theming
 * targets')` — and **20** are here. **Nothing is dropped.** Upstream has no
 * `displayName` case and no snapshot, so neither of this port's standing drops
 * applies.
 *
 * The first sixteen lived in `nav-icon.svelte.test.ts` until now, a file carrying
 * three upstream suites at once and therefore able to state a count against
 * none of them. They move here whole. The four `theming targets` cases are new
 * at 0.4.x (#4942) and had no port at all; `renders all slots together` also
 * gets its two action assertions back, which the shared file had dropped
 * because `slot-probe.svelte` fills only one slot.
 *
 * **Two counterparts. Neither is a dropped case:**
 *
 * - `forwards ref` becomes the attachment a consumer passes through the rest
 *   props. Svelte has no `ref`; the attachment receives the element itself, so
 *   this checks more than upstream's `toBeInstanceOf(HTMLDivElement)`.
 * - `exposes the title and description as themeable defineTheme targets` calls
 *   `generateThemeRulesSplit` where upstream's local helper calls
 *   `generateThemeCSS`. Ours returns the prose and component blocks as arrays
 *   rather than as two pre-joined strings, so `generateThemeTestCss` below joins
 *   them — same helper shape, and both assertions are upstream's verbatim.
 */

/** Upstream's `generateThemeTestCSS`, over this port's split return type. */
function generateThemeTestCss(theme: Parameters<typeof generateThemeRulesSplit>[0]): string {
	const { prose, component } = generateThemeRulesSplit(theme);
	return [...prose, ...component].join('\n\n');
}

describe('EmptyState', () => {
	it('renders with title', async () => {
		const screen = await render(EmptyState, { props: { title: 'No results found' } });
		await expect.element(screen.getByText('No results found')).toBeInTheDocument();
	});

	it('renders title as h3 by default', async () => {
		const screen = await render(EmptyState, { props: { title: 'No data' } });
		const heading = screen.getByRole('heading', { name: 'No data', exact: true });
		await expect.element(heading).toBeInTheDocument();
		expect(heading.element().tagName).toBe('H3');
	});

	it('renders custom heading level', async () => {
		const screen = await render(EmptyState, { props: { title: 'No data', headingLevel: 2 } });
		const heading = screen.getByRole('heading', { name: 'No data', exact: true });
		expect(heading.element().tagName).toBe('H2');
	});

	it('renders all heading levels', async () => {
		const levels = [1, 2, 3, 4, 5, 6] as const;
		for (const level of levels) {
			const screen = await render(EmptyState, {
				props: { title: `Level ${level}`, headingLevel: level }
			});
			const heading = screen.getByRole('heading', { name: `Level ${level}`, exact: true });
			expect(heading.element().tagName).toBe(`H${level}`);
			await screen.unmount();
		}
	});

	it('renders with description', async () => {
		const screen = await render(EmptyState, {
			props: { title: 'No results', description: 'Try adjusting your search.' }
		});
		const description = screen.getByText('Try adjusting your search.');
		await expect.element(description).toBeInTheDocument();
		// Description renders as <div> (never <p>) so block content composes safely.
		expect(description.element().tagName).toBe('DIV');
	});

	it('does not render description when not provided', async () => {
		const screen = await render(EmptyState, { props: { title: 'No results' } });
		// `.elements()` is the locator counterpart to React Testing Library's
		// `queryBy*` — no match is an empty list rather than a throw.
		expect(screen.getByText('Try adjusting your search.').elements()).toHaveLength(0);
	});

	it('renders with icon', async () => {
		const screen = await render(EmptyStateSlots, {
			props: { title: 'No results', iconText: '\u{1F4ED}', iconTestid: 'empty-icon' }
		});
		await expect.element(screen.getByTestId('empty-icon')).toBeInTheDocument();
	});

	it('marks icon as decorative with aria-hidden', async () => {
		const screen = await render(EmptyStateSlots, {
			props: { title: 'No results', iconText: '\u{1F4ED}', iconTestid: 'empty-icon' }
		});
		const iconWrapper = screen.getByTestId('empty-icon').element().parentElement;
		expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
	});

	it('does not render icon wrapper when icon is not provided', async () => {
		const screen = await render(EmptyState, { props: { title: 'No results' } });
		expect(screen.container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
	});

	it('renders with actions', async () => {
		const screen = await render(EmptyStateSlots, {
			props: { title: 'No results', actionLabels: ['Retry'], actionTestid: 'action-btn' }
		});
		await expect.element(screen.getByTestId('action-btn')).toBeInTheDocument();
	});

	it('does not render actions wrapper when actions is not provided', async () => {
		const screen = await render(EmptyState, { props: { title: 'No results' } });
		// Container div + text group div, but no actions wrapper
		const divs = screen.container.querySelectorAll('div');
		expect(divs).toHaveLength(2); // container + text group
	});

	it('has role="status" on the container', async () => {
		const screen = await render(EmptyState, { props: { title: 'No results' } });
		await expect.element(screen.getByRole('status')).toBeInTheDocument();
	});

	it('renders compact variant', async () => {
		const screen = await render(EmptyState, { props: { title: 'No results', isCompact: true } });
		await expect.element(screen.getByRole('status')).toBeInTheDocument();
		await expect.element(screen.getByText('No results')).toBeInTheDocument();
	});

	it('hands the root element to an attachment passed through rest props', async () => {
		// Counterpart to upstream's `forwards ref`: Svelte has no `ref`, so a
		// consumer captures the root through an attachment in the rest props,
		// which `EmptyState` spreads onto its root <div>.
		const attached = vi.fn();
		const screen = await render(EmptyState, {
			props: { title: 'No results', [createAttachmentKey()]: attached }
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(screen.container.firstElementChild);
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLDivElement);
	});

	it('spreads data-testid', async () => {
		const screen = await render(EmptyState, {
			props: { title: 'No results', 'data-testid': 'empty-state' }
		});
		await expect.element(screen.getByTestId('empty-state')).toBeInTheDocument();
	});

	it('renders all slots together', async () => {
		const screen = await render(EmptyStateSlots, {
			props: {
				iconText: '\u{1F50D}',
				iconTestid: 'icon',
				title: 'No results found',
				description: 'Try a different search term.',
				actionLabels: ['Clear filters', 'Go back'],
				'data-testid': 'full-empty-state'
			}
		});
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
		await expect.element(screen.getByText('No results found')).toBeInTheDocument();
		await expect.element(screen.getByText('Try a different search term.')).toBeInTheDocument();
		await expect.element(screen.getByText('Clear filters')).toBeInTheDocument();
		await expect.element(screen.getByText('Go back')).toBeInTheDocument();
	});

	describe('theming targets', () => {
		it('puts astryx-empty-state-title on the title heading', async () => {
			const screen = await render(EmptyState, { props: { title: 'No results' } });
			const heading = screen.getByRole('heading', { name: 'No results', exact: true });
			await expect.element(heading).toHaveClass('astryx-empty-state-title');
		});

		it('puts astryx-empty-state-description on the description', async () => {
			const screen = await render(EmptyState, {
				props: { title: 'No results', description: 'Try another search.' }
			});
			const description = screen.getByText('Try another search.');
			await expect.element(description).toHaveClass('astryx-empty-state-description');
		});

		it('reflects the compact variant on the title and description targets', async () => {
			const screen = await render(EmptyState, {
				props: { title: 'No results', description: 'Try another search.', isCompact: true }
			});
			await expect
				.element(screen.getByRole('heading', { name: 'No results', exact: true }))
				.toHaveAttribute('data-variant', 'compact');
			await expect
				.element(screen.getByText('Try another search.'))
				.toHaveAttribute('data-variant', 'compact');
		});

		it('exposes the title and description as themeable defineTheme targets', () => {
			// A browser test page can no more resolve which @layer wins than jsdom
			// can, so this asserts the targets are reachable by a theme through the
			// sanctioned defineTheme channel — replacing the structural
			// `> div:has(> :is(h1..h6))` heading-detection selectors a consumer
			// would otherwise need to restyle the title and description.
			const theme = defineTheme({
				name: 'empty-state-target-test',
				components: {
					'empty-state-title': {
						base: { fontSize: 'var(--text-large-size)' }
					},
					'empty-state-description': {
						base: { color: 'var(--color-text-secondary)' }
					}
				}
			});
			const css = generateThemeTestCss(theme);
			expect(css).toContain('.astryx-empty-state-title');
			expect(css).toContain('.astryx-empty-state-description');
		});
	});
});
