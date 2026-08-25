import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ListFixture from './fixtures/list-fixture.svelte';

/**
 * Astryx's `List/List.test.tsx` at the **0.5.0** pin, ported case for case —
 * **50 blocks producing 53 cases** (49 plain `it`s plus one four-row `it.each`),
 * and all 50 are here. (This header said "(52 cases)", which counted the
 * `it.each` short by one row.)
 *
 * Every case renders `<List>` with `<ListItem>` children, so all of them go
 * through `list-fixture.svelte`: upstream writes the items as JSX children with
 * inline `startContent`/`endContent`/`description` elements, and a Svelte
 * snippet can only be authored in a template. The fixture takes the same data
 * and rebuilds the markup.
 *
 * Nothing is dropped. Two cases read differently and are commented where they
 * appear:
 *
 * - **`accepts ReactNode as description`** becomes the snippet counterpart —
 *   `description` is `string | Snippet` here, so rich content arrives as a
 *   snippet rather than an element. The assertions are upstream's.
 * - **`accepts number as description (ReactNode)`** passes the number as the
 *   string `'42'`. React renders a numeric child directly; Svelte's
 *   `string | Snippet` has no number branch, and a caller writing
 *   `description={42}` would be a type error rather than a runtime one.
 */

describe('List', () => {
	// ===========================================================================
	// Basic rendering
	// ===========================================================================

	it('renders a list with items', async () => {
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Item 1' } }, { props: { label: 'Item 2' } }] }
		});
		await expect.element(screen.getByText('Item 1')).toBeInTheDocument();
		await expect.element(screen.getByText('Item 2')).toBeInTheDocument();
	});

	it('renders label and description', async () => {
		const screen = await render(ListFixture, {
			props: {
				items: [{ props: { label: 'Settings', description: 'Manage your preferences' } }]
			}
		});
		await expect.element(screen.getByText('Settings')).toBeInTheDocument();
		await expect.element(screen.getByText('Manage your preferences')).toBeInTheDocument();
	});

	it('supports data-testid on list', async () => {
		const screen = await render(ListFixture, {
			props: { list: { 'data-testid': 'my-list' }, items: [{ props: { label: 'Item' } }] }
		});
		await expect.element(screen.getByTestId('my-list')).toBeInTheDocument();
	});

	it('supports data-testid on list item', async () => {
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Item', 'data-testid': 'my-item' } }] }
		});
		await expect.element(screen.getByTestId('my-item')).toBeInTheDocument();
	});

	// ===========================================================================
	// Semantic HTML
	// ===========================================================================

	it('renders as <ul> by default', async () => {
		const screen = await render(ListFixture, { props: { items: [{ props: { label: 'Item' } }] } });
		expect(screen.container.querySelector('ul')).toBeInTheDocument();
		expect(screen.container.querySelector('ol')).not.toBeInTheDocument();
	});

	it('renders as <ol> when listStyle is decimal', async () => {
		const screen = await render(ListFixture, {
			props: {
				list: { listStyle: 'decimal' },
				items: [{ props: { label: 'First' } }, { props: { label: 'Second' } }]
			}
		});
		expect(screen.container.querySelector('ol')).toBeInTheDocument();
		expect(screen.container.querySelector('ul')).not.toBeInTheDocument();
	});

	it('applies custom counter start value', async () => {
		const screen = await render(ListFixture, {
			props: {
				list: { listStyle: 'decimal', start: 3 },
				items: [{ props: { label: 'Third' } }, { props: { label: 'Fourth' } }]
			}
		});
		const ol = screen.container.querySelector('ol')!;
		// The counter-reset style should include the start offset (start - 1 = 2)
		expect(ol.className).toContain('counterStart');
	});

	it('emits the start HTML attribute on <ol> when start is non-default', async () => {
		// Browsers and assistive tech read the start attribute directly; the CSS
		// counter alone is invisible to AT and copy-paste.
		const screen = await render(ListFixture, {
			props: { list: { listStyle: 'decimal', start: 5 }, items: [{ props: { label: 'Fifth' } }] }
		});
		const ol = screen.container.querySelector('ol')!;
		expect(ol.getAttribute('start')).toBe('5');
	});

	it('does not emit the start HTML attribute for the default (start=1)', async () => {
		const screen = await render(ListFixture, {
			props: { list: { listStyle: 'decimal' }, items: [{ props: { label: 'First' } }] }
		});
		const ol = screen.container.querySelector('ol')!;
		expect(ol.hasAttribute('start')).toBe(false);
	});

	it('renders as <ul> when listStyle is disc', async () => {
		const screen = await render(ListFixture, {
			props: { list: { listStyle: 'disc' }, items: [{ props: { label: 'Item' } }] }
		});
		expect(screen.container.querySelector('ul')).toBeInTheDocument();
	});

	it('renders as <ul> when listStyle is circle', async () => {
		const screen = await render(ListFixture, {
			props: { list: { listStyle: 'circle' }, items: [{ props: { label: 'Item' } }] }
		});
		expect(screen.container.querySelector('ul')).toBeInTheDocument();
	});

	// Upstream's `it.each([...])`, which replaced the three cases this port used to
	// carry here — one asserting `role="list"` for `none`, two asserting its
	// *absence* for `disc` and `decimal`. 0.2.0 emits the role unconditionally, so
	// those two inverted into this single parameterised case.
	it.each(['none', 'disc', 'circle', 'decimal'] as const)(
		'adds an explicit role="list" when listStyle is %s (Safari fix)',
		async (listStyle) => {
			// The base list style always sets list-style-type: none (markers are
			// custom-rendered by ListItem), so Safari/VoiceOver drops the implicit
			// list role for EVERY variant — the explicit role must always be there.
			const screen = await render(ListFixture, {
				props: {
					list: { listStyle },
					items: [{ props: { label: 'Item 1' } }, { props: { label: 'Item 2' } }]
				}
			});
			await expect.element(screen.getByRole('list')).toHaveAttribute('role', 'list');
			expect(screen.getByRole('listitem').elements()).toHaveLength(2);
		}
	);

	it('renders items as <li> elements', async () => {
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Item 1' } }, { props: { label: 'Item 2' } }] }
		});
		expect(screen.container.querySelectorAll('li')).toHaveLength(2);
	});

	// ===========================================================================
	// Header with aria-labelledby
	// ===========================================================================

	it('renders header and associates via aria-labelledby', async () => {
		const screen = await render(ListFixture, {
			props: { headerText: 'Team Members', items: [{ props: { label: 'Alice' } }] }
		});
		await expect.element(screen.getByText('Team Members')).toBeInTheDocument();
		const ul = screen.container.querySelector('ul');
		const headerId = ul?.getAttribute('aria-labelledby');
		expect(headerId).toBeTruthy();
		const headerEl = document.getElementById(headerId!);
		expect(headerEl).toBeInTheDocument();
		expect(headerEl?.textContent).toBe('Team Members');
	});

	it('does not render aria-labelledby when no header', async () => {
		const screen = await render(ListFixture, { props: { items: [{ props: { label: 'Item' } }] } });
		expect(screen.container.querySelector('ul')).not.toHaveAttribute('aria-labelledby');
	});

	it('wraps header and list in a column container', async () => {
		const screen = await render(ListFixture, {
			props: { headerText: 'Group', items: [{ props: { label: 'Item' } }] }
		});
		const header = screen.container.querySelector('span')!;
		const wrapper = header.parentElement?.parentElement;
		const ul = screen.container.querySelector('ul');
		expect(wrapper).toContainElement(header.parentElement);
		expect(wrapper).toContainElement(ul);
	});

	it('does not add a wrapper div when header is absent', async () => {
		const screen = await render(ListFixture, {
			props: { list: { 'data-testid': 'my-list' }, items: [{ props: { label: 'Item' } }] }
		});
		const ul = screen.container.querySelector('ul');
		expect(ul?.parentElement).toBe(screen.container);
	});

	// ===========================================================================
	// Density variants
	// ===========================================================================

	it('renders with compact density', async () => {
		const screen = await render(ListFixture, {
			props: { list: { density: 'compact' }, items: [{ props: { label: 'Item' } }] }
		});
		const item = screen.container.querySelector('li');
		expect(item).toBeInTheDocument();
		expect(item?.className).toContain('compact');
	});

	it('renders with balanced density (default)', async () => {
		const screen = await render(ListFixture, { props: { items: [{ props: { label: 'Item' } }] } });
		const item = screen.container.querySelector('li');
		expect(item).toBeInTheDocument();
		expect(item?.className).toContain('balanced');
		expect(item?.className).not.toContain('spacious');
	});

	it('renders with spacious density', async () => {
		const screen = await render(ListFixture, {
			props: { list: { density: 'spacious' }, items: [{ props: { label: 'Item' } }] }
		});
		const item = screen.container.querySelector('li');
		expect(item).toBeInTheDocument();
		expect(item?.className).toContain('spacious');
	});

	// ===========================================================================
	// Dividers
	// ===========================================================================

	it('renders dividers between items when hasDividers is true', async () => {
		const screen = await render(ListFixture, {
			props: {
				list: { hasDividers: true },
				items: [
					{ props: { label: 'Item 1' } },
					{ props: { label: 'Item 2' } },
					{ props: { label: 'Item 3' } }
				]
			}
		});
		// Dividers are rendered as borders on <li> elements, not separate DOM nodes
		expect(screen.container.querySelectorAll('li')).toHaveLength(3);
		expect(screen.container.querySelectorAll('hr')).toHaveLength(0);
	});

	it('does not add extra DOM elements for dividers', async () => {
		const screen = await render(ListFixture, {
			props: {
				list: { hasDividers: true },
				items: [{ props: { label: 'Item 1' } }, { props: { label: 'Item 2' } }]
			}
		});
		const list = screen.container.querySelector('ul');
		// Only <li> children — no <hr> or other divider elements. Svelte's `{#each}`
		// leaves comment anchors between them, which `children` does not see.
		const children = list?.children;
		expect(children).toHaveLength(2);
		expect(children?.[0]?.tagName).toBe('LI');
		expect(children?.[1]?.tagName).toBe('LI');
	});

	it('does not render dividers when hasDividers is false', async () => {
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Item 1' } }, { props: { label: 'Item 2' } }] }
		});
		expect(screen.container.querySelectorAll('hr')).toHaveLength(0);
	});

	// ===========================================================================
	// Interactive items — onClick (invisible button pattern)
	// ===========================================================================

	it('renders an invisible button when onClick is provided', async () => {
		const onclick = vi.fn();
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Clickable', onclick } }] }
		});
		const button = screen.container.querySelector('button');
		expect(button).toBeInTheDocument();
		expect(button?.textContent).toContain('Clickable');
	});

	it('fires onClick when invisible button is clicked', async () => {
		const onclick = vi.fn();
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Clickable', onclick } }] }
		});
		await userEvent.click(screen.getByRole('button'));
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('fires onClick when container area is clicked', async () => {
		const onclick = vi.fn();
		const screen = await render(ListFixture, {
			props: {
				items: [
					{
						props: { label: 'Clickable', onclick, 'data-testid': 'item' },
						start: { testid: 'start', text: '★' }
					}
				]
			}
		});
		// Click on startContent (non-interactive, should propagate)
		await userEvent.click(screen.getByTestId('start'));
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('does not fire item onClick when endContent interactive element is clicked', async () => {
		const itemClick = vi.fn();
		const buttonClick = vi.fn();
		const screen = await render(ListFixture, {
			props: {
				items: [
					{
						props: { label: 'Item', onclick: itemClick },
						endButton: { label: 'Action', onclick: buttonClick }
					}
				]
			}
		});
		await userEvent.click(screen.getByText('Action'));
		expect(buttonClick).toHaveBeenCalledTimes(1);
		expect(itemClick).not.toHaveBeenCalled();
	});

	it('invisible button is focusable via keyboard', async () => {
		const onclick = vi.fn();
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Focusable', onclick } }] }
		});
		await userEvent.tab();
		await expect.element(screen.getByRole('button')).toHaveFocus();
	});

	it('invisible button can be activated via keyboard', async () => {
		const onclick = vi.fn();
		await render(ListFixture, {
			props: { items: [{ props: { label: 'Pressable', onclick } }] }
		});
		await userEvent.tab();
		await userEvent.keyboard('{Enter}');
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('does not render nested buttons — only one invisible button', async () => {
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Item', onclick: () => {} } }] }
		});
		// Should be exactly 1 invisible button (no nesting)
		expect(screen.container.querySelectorAll('li button')).toHaveLength(1);
	});

	// ===========================================================================
	// Interactive items — href (invisible anchor pattern)
	// ===========================================================================

	it('renders an invisible anchor when href is provided', async () => {
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Link', href: '/docs' } }] }
		});
		const anchor = screen.container.querySelector('a');
		expect(anchor).toBeInTheDocument();
		expect(anchor).toHaveAttribute('href', '/docs');
		expect(anchor?.textContent).toContain('Link');
	});

	it('sets target on anchor when provided', async () => {
		const screen = await render(ListFixture, {
			props: {
				items: [{ props: { label: 'External', href: 'https://example.com', target: '_blank' } }]
			}
		});
		const anchor = screen.container.querySelector('a');
		expect(anchor).toHaveAttribute('target', '_blank');
		expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('does not render button or anchor for static items', async () => {
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Static' } }] }
		});
		expect(screen.container.querySelector('button')).not.toBeInTheDocument();
		expect(screen.container.querySelector('a')).not.toBeInTheDocument();
	});

	// ===========================================================================
	// Disabled state
	// ===========================================================================

	it('applies aria-disabled when isDisabled', async () => {
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Disabled', isDisabled: true } }] }
		});
		expect(screen.container.querySelector('.astryx-item')).toHaveAttribute('aria-disabled', 'true');
	});

	it('disables the invisible button when isDisabled', async () => {
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Disabled', onclick: () => {}, isDisabled: true } }] }
		});
		expect(screen.container.querySelector('button')).toBeDisabled();
	});

	it('does not fire onClick when disabled item is clicked', async () => {
		const onclick = vi.fn();
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Disabled', onclick, isDisabled: true } }] }
		});
		// pointerEvents: none prevents click, but let's verify the handler guards
		const li = screen.container.querySelector('li');
		// Manually dispatch click (bypassing pointer-events)
		li?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(onclick).not.toHaveBeenCalled();
	});

	// ===========================================================================
	// Selected state
	// ===========================================================================

	it('conveys selection via aria-current when isSelected', async () => {
		// aria-selected is not permitted on an li (role listitem, axe:
		// aria-allowed-attr), so selection is exposed via aria-current — valid on
		// any element — so screen-reader users are still told which item is chosen.
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Selected', isSelected: true, onclick: () => {} } }] }
		});
		const item = screen.container.querySelector('.astryx-item');
		expect(item).not.toHaveAttribute('aria-selected');
		expect(item).toHaveAttribute('aria-current', 'true');
	});

	it('applies neither aria-selected nor aria-current when not selected', async () => {
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Not Selected' } }] }
		});
		const li = screen.container.querySelector('li');
		expect(li).not.toHaveAttribute('aria-selected');
		expect(li).not.toHaveAttribute('aria-current');
	});

	// ===========================================================================
	// startContent and endContent
	// ===========================================================================

	it('renders startContent before label', async () => {
		const screen = await render(ListFixture, {
			props: {
				items: [{ props: { label: 'With Icon' }, start: { testid: 'icon', text: '★' } }]
			}
		});
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
	});

	it('renders endContent after label', async () => {
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'With Badge' }, end: { testid: 'badge', text: '3' } }] }
		});
		await expect.element(screen.getByTestId('badge')).toBeInTheDocument();
	});

	it('startContent and endContent are siblings to invisible button', async () => {
		const screen = await render(ListFixture, {
			props: {
				items: [
					{
						props: { label: 'Item', onclick: () => {} },
						start: { testid: 'start', text: '★' },
						end: { testid: 'end', text: '→' }
					}
				]
			}
		});
		const button = screen.container.querySelector('button');
		const li = screen.container.querySelector('li');
		// startContent and endContent should be children of li, not inside button
		expect(li?.querySelector('[data-testid="start"]')).toBeInTheDocument();
		expect(li?.querySelector('[data-testid="end"]')).toBeInTheDocument();
		expect(button?.querySelector('[data-testid="start"]')).not.toBeInTheDocument();
		expect(button?.querySelector('[data-testid="end"]')).not.toBeInTheDocument();
	});

	// ===========================================================================
	// Border radius
	// ===========================================================================

	it('applies content radius by default', async () => {
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Item', 'data-testid': 'item', isSelected: true } }] }
		});
		await expect.element(screen.getByTestId('item')).toBeInTheDocument();
	});

	it('removes radius when hasDividers is true', async () => {
		const screen = await render(ListFixture, {
			props: {
				list: { hasDividers: true },
				items: [{ props: { label: 'Item', 'data-testid': 'item', isSelected: true } }]
			}
		});
		await expect.element(screen.getByTestId('item')).toBeInTheDocument();
	});

	// ===========================================================================
	// List markers
	// ===========================================================================

	it('renders list markers for disc style', async () => {
		const screen = await render(ListFixture, {
			props: {
				list: { listStyle: 'disc' },
				items: [{ props: { label: 'Bullet item', 'data-testid': 'item' } }]
			}
		});
		const item = screen.container.querySelector('[data-testid="item"]')!;
		// Custom marker rendered as a span (dot marker container)
		const markerContainer = item.querySelector(':scope > span:first-child');
		expect(markerContainer).toBeInTheDocument();
		// The dot itself is a nested span
		expect(markerContainer?.querySelector('span')).toBeInTheDocument();
	});

	it('renders list markers for decimal style', async () => {
		const screen = await render(ListFixture, {
			props: {
				list: { listStyle: 'decimal' },
				items: [{ props: { label: 'Numbered item', 'data-testid': 'item' } }]
			}
		});
		const item = screen.container.querySelector('[data-testid="item"]')!;
		// Number marker uses CSS counter via ::before pseudo-element
		expect(item.querySelector(':scope > span:first-child')).toBeInTheDocument();
	});

	it('does not render markers when listStyle is none', async () => {
		const withMarkers = await render(ListFixture, {
			props: {
				list: { listStyle: 'disc' },
				items: [{ props: { label: 'With marker', 'data-testid': 'with-marker' } }]
			}
		});
		const withMarker = withMarkers.container.querySelector('[data-testid="with-marker"]')!;
		const markerCount = withMarker.children.length;

		const plain = await render(ListFixture, {
			props: {
				list: { listStyle: 'none' },
				items: [{ props: { label: 'Plain item', 'data-testid': 'no-marker' } }]
			}
		});
		const noMarker = plain.container.querySelector('[data-testid="no-marker"]')!;
		// Without markers, the item should have fewer direct children
		// (no marker container element)
		expect(noMarker.children.length).toBeLessThan(markerCount);
	});

	// ===========================================================================
	// Description rendering
	// ===========================================================================

	it('does not render description when not provided', async () => {
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Label Only' } }] }
		});
		// Should have the label span only (plus possibly wrapper spans)
		await expect.element(screen.getByText('Label Only')).toBeInTheDocument();
		expect(screen.container.textContent).not.toContain('undefined');
	});

	// ===========================================================================
	// Snippet description (upstream: ReactNode)
	// ===========================================================================

	it('accepts a snippet as description', async () => {
		// Upstream's `accepts ReactNode as description`. `description` is
		// `string | Snippet` here, so the rich content arrives as a snippet.
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Item' }, richDescription: true }] }
		});
		await expect.element(screen.getByText('Rich')).toBeInTheDocument();
		await expect.element(screen.getByText('description')).toBeInTheDocument();
	});

	it('still accepts string description', async () => {
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Item', description: 'Simple text' } }] }
		});
		await expect.element(screen.getByText('Simple text')).toBeInTheDocument();
	});

	it('accepts a stringified number as description', async () => {
		// Upstream's `accepts number as description (ReactNode)`. React renders a
		// numeric child directly; `string | Snippet` has no number branch, so the
		// caller stringifies — `description={42}` is a type error, not a runtime one.
		const screen = await render(ListFixture, {
			props: { items: [{ props: { label: 'Count', description: '42' } }] }
		});
		await expect.element(screen.getByText('42')).toBeInTheDocument();
	});
});
