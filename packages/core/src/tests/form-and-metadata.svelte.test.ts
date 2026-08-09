import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import FieldStatus from '$lib/components/field-status/field-status.svelte';
import FormLayout from '$lib/components/form-layout/form-layout.svelte';
import DirectionReader from './fixtures/form-layout-direction.svelte';
import FormLayoutFields from './fixtures/form-layout-fields.svelte';
import FormLayoutNest from './fixtures/form-layout-nest.svelte';
import MetadataListHarness from './fixtures/metadata-list-harness.svelte';
import MetadataListI18n from './fixtures/metadata-list-i18n.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';
import { probe } from './fixtures/xstyle-probe.stylex.js';

/**
 * `FieldStatus`, `FormLayout` and `MetadataList` — three leaves that are all
 * about arrangement, ported together. All three upstream suites come across
 * bar the cases named below.
 *
 * `ref` forwarding becomes the attachment a consumer passes through the rest
 * props, as in the previous batches.
 *
 * Not ported, each for a stated reason:
 * - **`FormLayout`'s three snapshot cases.** A snapshot of *our* markup pins
 *   our own output against itself; the class oracle already diffs every class
 *   we emit against the ones upstream's compiled `dist/` carries, which is the
 *   stronger check and the one that would actually catch a divergence.
 * - **`FieldStatus`'s `displayName` case** — Svelte has no such surface.
 *
 * `FieldStatus` is upstream's 31 cases minus that one, so 30. Its announcement
 * block asserts against the `useAnnounce` live regions rather than the rendered
 * element: 0.2.0 moved the announcement off the element (a live region born
 * together with its content is not reliably announced), so the old
 * `role="alert"`/`aria-live` assertions became assertions that those attributes
 * are *absent*.
 */

// `useAnnounce`'s live regions are a document-level singleton that outlives a
// render, so each announcing case starts from a clean pair.
afterEach(() => {
	__resetLiveRegionsForTest();
});

function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}
function assertiveRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="assertive"]');
}

describe('FieldStatus', () => {
	const find = (screen: { container: HTMLElement }) =>
		screen.container.querySelector('.astryx-field-status')!;

	it('renders the message text', async () => {
		const screen = await render(FieldStatus, {
			props: { type: 'error', message: 'This field is required' }
		});
		await expect.element(screen.getByText('This field is required')).toBeInTheDocument();
	});

	it('renders the message inside a <div>', async () => {
		const screen = await render(FieldStatus, { props: { type: 'error', message: 'Boom' } });
		expect(find(screen).tagName).toBe('DIV');
	});

	describe('screen-reader announcements', () => {
		// The rendered element is NOT itself a live region: FieldStatus is
		// conditionally mounted by every caller, and live regions born together
		// with their content are not reliably announced. Announcements go through
		// the persistent useAnnounce singletons instead.
		it('does not carry role or aria-live on the rendered element', async () => {
			const screen = await render(FieldStatus, { props: { type: 'error', message: 'msg' } });
			expect(find(screen)).not.toHaveAttribute('role');
			expect(find(screen)).not.toHaveAttribute('aria-live');
		});

		// Errors are urgent — they interrupt via the assertive channel.
		it('announces error messages assertively, including on first mount', async () => {
			await render(FieldStatus, {
				props: { type: 'error', message: 'This field is required' }
			});
			await vi.waitFor(() => {
				expect(assertiveRegion()).toHaveTextContent('This field is required');
			});
			expect(politeRegion()).toHaveTextContent('');
		});

		it('announces warning messages politely', async () => {
			await render(FieldStatus, { props: { type: 'warning', message: 'Check this value' } });
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Check this value');
			});
			expect(assertiveRegion()).toHaveTextContent('');
		});

		it('announces success messages politely', async () => {
			await render(FieldStatus, { props: { type: 'success', message: 'Looks good' } });
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Looks good');
			});
		});

		it('announces message changes', async () => {
			const screen = await render(FieldStatus, { props: { type: 'error', message: 'First' } });
			await vi.waitFor(() => {
				expect(assertiveRegion()).toHaveTextContent('First');
			});
			await screen.rerender({ type: 'error', message: 'Second' });
			await vi.waitFor(() => {
				expect(assertiveRegion()).toHaveTextContent('Second');
			});
		});

		// Severity changes re-route the announcement to the matching channel.
		it('re-routes to the polite channel when type changes from error', async () => {
			const screen = await render(FieldStatus, { props: { type: 'error', message: 'msg' } });
			await vi.waitFor(() => {
				expect(assertiveRegion()).toHaveTextContent('msg');
			});
			await screen.rerender({ type: 'success', message: 'msg' });
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('msg');
			});
		});

		it('does not announce an empty message', async () => {
			await render(FieldStatus, { props: { type: 'error', message: '' } });
			// The live regions are created lazily on first announce; an empty
			// message must not trigger one.
			expect(assertiveRegion()).toBeNull();
			expect(politeRegion()).toBeNull();
		});

		// The visible message stays perceivable by assistive tech (it is the
		// aria-describedby target for the input).
		it('does not mark itself aria-hidden', async () => {
			const screen = await render(FieldStatus, { props: { type: 'error', message: 'msg' } });
			expect(find(screen)).not.toHaveAttribute('aria-hidden');
		});
	});

	describe('theme class + data attribute reflection', () => {
		it('renders the stable astryx-field-status class', async () => {
			const screen = await render(FieldStatus, { props: { type: 'error', message: 'msg' } });
			expect(find(screen)).toHaveClass('astryx-field-status');
		});

		it('reflects the type as a class token and data-type attribute', async () => {
			const screen = await render(FieldStatus, { props: { type: 'warning', message: 'msg' } });
			expect(find(screen)).toHaveClass('warning');
			expect(find(screen)).toHaveAttribute('data-type', 'warning');
		});

		it('reflects the variant as a class token and data-variant attribute', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', variant: 'detached' }
			});
			expect(find(screen)).toHaveClass('detached');
			expect(find(screen)).toHaveAttribute('data-variant', 'detached');
		});

		it('defaults data-variant to "attached"', async () => {
			const screen = await render(FieldStatus, { props: { type: 'error', message: 'msg' } });
			expect(find(screen)).toHaveAttribute('data-variant', 'attached');
			expect(find(screen)).toHaveClass('attached');
		});
	});

	describe('color styling per status type', () => {
		// Each status type maps to a distinct colour treatment, so the class list
		// must differ between them — a regression collapsing them onto one colour
		// is what this catches.
		it('applies distinct StyleX classes for each type', async () => {
			const screen = await render(FieldStatus, { props: { type: 'error', message: 'msg' } });
			const errorClass = find(screen).getAttribute('class');

			await screen.rerender({ type: 'warning', message: 'msg' });
			const warningClass = find(screen).getAttribute('class');

			await screen.rerender({ type: 'success', message: 'msg' });
			const successClass = find(screen).getAttribute('class');

			expect(errorClass).not.toEqual(warningClass);
			expect(warningClass).not.toEqual(successClass);
			expect(errorClass).not.toEqual(successClass);
		});

		it('applies distinct StyleX classes for each variant', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', variant: 'attached' }
			});
			const attachedClass = find(screen).getAttribute('class');

			await screen.rerender({ type: 'error', message: 'msg', variant: 'detached' });
			expect(find(screen).getAttribute('class')).not.toEqual(attachedClass);
		});
	});

	describe('prop forwarding', () => {
		it('hands the root element to an attachment passed through rest props', async () => {
			let element: Element | null = null;
			const screen = await render(FieldStatus, {
				props: {
					type: 'error',
					message: 'msg',
					[createAttachmentKey()]: (node: Element) => {
						element = node;
					}
				}
			});
			expect(element).toBe(find(screen));
		});

		it('applies the id attribute', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', id: 'email-error' }
			});
			expect(find(screen)).toHaveAttribute('id', 'email-error');
		});

		it('passes through arbitrary DOM props', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', 'data-custom': 'xyz' }
			});
			expect(find(screen)).toHaveAttribute('data-custom', 'xyz');
		});

		it('merges a consumer class with the stable class', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', class: 'my-status' }
			});
			expect(find(screen)).toHaveClass('my-status');
			expect(find(screen)).toHaveClass('astryx-field-status');
		});

		it('merges a consumer inline style', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', style: 'margin-top: 10px' }
			});
			expect(find(screen)).toHaveStyle({ marginTop: '10px' });
		});

		it('applies an xstyle as an extra class', async () => {
			const screen = await render(FieldStatus, { props: { type: 'error', message: 'msg' } });
			const withoutXstyle = find(screen).getAttribute('class');

			// xstyle values are compiled StyleX styles; passing one adds classes.
			await screen.rerender({ type: 'error', message: 'msg', xstyle: probe.novelMargin });
			expect(find(screen).getAttribute('class')).not.toEqual(withoutXstyle);
		});
	});

	describe('dynamic updates', () => {
		it('updates the rendered message on rerender', async () => {
			const screen = await render(FieldStatus, { props: { type: 'error', message: 'First' } });
			expect(find(screen)).toHaveTextContent('First');

			await screen.rerender({ type: 'error', message: 'Second' });
			expect(find(screen)).toHaveTextContent('Second');
		});

		// The element must never regain live-region semantics when the type
		// changes — announcements always flow through the persistent regions.
		it('keeps the element role-free when type changes from error', async () => {
			const screen = await render(FieldStatus, { props: { type: 'error', message: 'msg' } });
			expect(find(screen)).not.toHaveAttribute('role');

			await screen.rerender({ type: 'success', message: 'msg' });
			expect(find(screen)).not.toHaveAttribute('role');
			expect(find(screen)).not.toHaveAttribute('aria-live');
		});
	});

	// The detached message must convey status by more than color/position:
	// a leading status glyph precedes the message text (WCAG 1.4.1). The glyph
	// is decorative for AT (aria-hidden) because the message text already names
	// the status in words and it is announced via the live region.
	describe('detached leading status icon (use-of-color a11y)', () => {
		it('renders a leading status icon before the message for the detached variant', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'Something went wrong', variant: 'detached' }
			});
			const icon = find(screen).querySelector('[aria-hidden="true"]');
			const text = screen.getByText('Something went wrong').element();
			expect(icon).toBeInTheDocument();
			// Icon comes before the message text in document order.
			expect(icon!.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		});

		it('marks the status icon aria-hidden (visual redundancy, not a second announcement)', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'warning', message: 'Heads up', variant: 'detached' }
			});
			const icon = find(screen).querySelector('[aria-hidden="true"]');
			expect(icon).toBeInTheDocument();
			expect(icon).toHaveAttribute('aria-hidden', 'true');
		});

		it('renders a status icon for each status type in the detached variant', async () => {
			// Upstream mounts and unmounts one render per type; `rerender` walks the
			// same three states through a single mount, which is what the assertion
			// is about.
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', variant: 'detached' }
			});
			for (const type of ['error', 'warning', 'success'] as const) {
				await screen.rerender({ type, message: 'msg', variant: 'detached' });
				expect(find(screen).querySelector('[aria-hidden="true"]')).toBeInTheDocument();
			}
		});

		it('does not render a leading status icon for the attached variant', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', variant: 'attached' }
			});
			expect(find(screen).querySelector('[aria-hidden="true"]')).toBeNull();
		});
	});

	describe('edge cases', () => {
		it('renders an empty message without crashing', async () => {
			const screen = await render(FieldStatus, { props: { type: 'error', message: '' } });
			expect(find(screen)).toBeInTheDocument();
			expect(find(screen)).toHaveTextContent('');
		});

		it('renders message content verbatim, including whitespace-only strings', async () => {
			const screen = await render(FieldStatus, { props: { type: 'warning', message: '   ' } });
			expect(find(screen).textContent).toBe('   ');
		});
	});
});

describe('FormLayout', () => {
	const child = (text: string) => ({
		component: FormLayout,
		slot: 'children',
		text,
		testid: 'child'
	});

	it('renders children', async () => {
		const screen = await render(SlotProbe, { props: child('content') });
		expect(screen.container.querySelector('[data-testid="child"]')).not.toBeNull();
	});

	it('renders a div element', async () => {
		const screen = await render(SlotProbe, {
			props: { ...child('content'), rest: { 'data-testid': 'layout' } }
		});
		expect(screen.container.querySelector('[data-testid="layout"]')!.tagName).toBe('DIV');
	});

	it('hands the root element to an attachment passed through rest props', async () => {
		let element: Element | null = null;
		const screen = await render(SlotProbe, {
			props: {
				...child('content'),
				rest: {
					[createAttachmentKey()]: (node: Element) => {
						element = node;
					}
				}
			}
		});
		expect(element).toBe(screen.container.querySelector('.astryx-form-layout'));
	});

	it('passes data-testid', async () => {
		const screen = await render(SlotProbe, {
			props: { ...child('content'), rest: { 'data-testid': 'my-form' } }
		});
		expect(screen.container.querySelector('[data-testid="my-form"]')).not.toBeNull();
	});

	it('passes through HTML attributes', async () => {
		const screen = await render(SlotProbe, {
			props: { ...child('content'), rest: { 'data-testid': 'layout', id: 'form-1', role: 'group' } }
		});
		const el = screen.container.querySelector('[data-testid="layout"]')!;
		expect(el).toHaveAttribute('id', 'form-1');
		expect(el).toHaveAttribute('role', 'group');
	});

	it('defaults to vertical direction', async () => {
		const screen = await render(FormLayoutNest, { props: { isNested: false } });
		expect(screen.container.querySelector('[data-testid="direction"]')!.textContent).toBe(
			'vertical'
		);
	});

	for (const direction of ['vertical', 'horizontal', 'horizontal-labels'] as const) {
		it(`provides ${direction} direction context to children`, async () => {
			const screen = await render(FormLayoutNest, { props: { inner: direction } });
			expect(screen.container.querySelector('[data-testid="direction"]')!.textContent).toBe(
				direction
			);
		});
	}

	it('provides default context when no direction is specified', async () => {
		const screen = await render(DirectionReader);
		// Outside any FormLayout the context default applies, which is upstream's
		// `createContext({direction: 'vertical'})`.
		expect(screen.container.querySelector('[data-testid="direction"]')!.textContent).toBe(
			'vertical'
		);
	});

	it('supports nesting — inner layout overrides context', async () => {
		const screen = await render(FormLayoutNest, {
			props: { outer: 'vertical', inner: 'horizontal' }
		});
		expect(screen.container.querySelector('[data-testid="direction"]')!.textContent).toBe(
			'horizontal'
		);
	});

	it('renders nested layouts with different elements', async () => {
		const screen = await render(FormLayoutNest, { props: { hasInputs: true } });
		for (const id of ['outer', 'inner', 'outer-child', 'inner-child-1', 'inner-child-2']) {
			expect(screen.container.querySelector(`[data-testid="${id}"]`)).not.toBeNull();
		}
	});

	// ─── Horizontal-labels with real Field children ─────────────────────────

	it('horizontal-labels renders Field children with display:contents', async () => {
		const screen = await render(FormLayoutFields, {
			props: {
				fields: [
					{ label: 'Name', inputID: 'name', inputTestID: 'name-input' },
					{ label: 'Email', inputID: 'email', inputTestID: 'email-input' }
				]
			}
		});

		const layout = screen.getByTestId('layout').element();

		// Labels should be accessible
		await expect.element(screen.getByLabelText('Name')).toBeInTheDocument();
		await expect.element(screen.getByLabelText('Email')).toBeInTheDocument();

		// The label and input wrapper should be direct grid-participating children
		// (via display:contents on the Field wrapper)
		const nameLabel = screen.getByText('Name').element();
		const emailLabel = screen.getByText('Email').element();
		expect(nameLabel.tagName).toBe('LABEL');
		expect(emailLabel.tagName).toBe('LABEL');

		// Both fields should be inside the layout
		expect(layout.contains(nameLabel)).toBe(true);
		expect(layout.contains(screen.getByTestId('name-input').element())).toBe(true);
		expect(layout.contains(emailLabel)).toBe(true);
		expect(layout.contains(screen.getByTestId('email-input').element())).toBe(true);
	});

	it('horizontal-labels with Field: label and input wrapper are siblings under display:contents', async () => {
		const screen = await render(FormLayoutFields, {
			props: {
				fields: [
					{
						label: 'Username',
						inputID: 'username',
						fieldTestID: 'username-field',
						inputTestID: 'username-input'
					}
				]
			}
		});

		const field = screen.getByTestId('username-field').element();
		// Field should have display:contents class
		expect(field.className).toContain('horizontalLabels');

		// Field's direct children should be: label alignment div + input wrapper div
		const fieldChildren = Array.from(field.children);
		expect(fieldChildren.length).toBe(2);
		// First child is the label alignment wrapper containing the <label>
		expect(fieldChildren[0].tagName).toBe('DIV');
		expect(fieldChildren[0].querySelector('label')).not.toBeNull();
		// Second child is the input wrapper div
		expect(fieldChildren[1].tagName).toBe('DIV');
		// The input should be inside the wrapper div (column 2)
		expect(fieldChildren[1].contains(screen.getByTestId('username-input').element())).toBe(true);
	});
});

describe('MetadataList', () => {
	const pairs: [string, string][] = [
		['Name', 'Alice'],
		['Role', 'Engineer']
	];

	it('renders a description list with items', async () => {
		const screen = await render(MetadataListHarness, { props: { items: pairs } });
		for (const text of ['Name', 'Alice', 'Role', 'Engineer']) {
			await expect.element(screen.getByText(text)).toBeInTheDocument();
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
		await expect.element(screen.getByText('Details')).toBeInTheDocument();
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
		await expect.element(screen.getByText('Show more')).toBeInTheDocument();
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

		await userEvent.click(screen.getByText('Show more'));
		await expect.element(screen.getByText('B')).toBeInTheDocument();
		await expect.element(screen.getByText('Show less')).toBeInTheDocument();

		await userEvent.click(screen.getByText('Show less'));
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

		await userEvent.click(screen.getByText('Afficher plus'));
		await expect.element(screen.getByText('Afficher moins')).toBeInTheDocument();
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
		await expect.element(screen.getByText('A')).toBeInTheDocument();
		await expect.element(screen.getByText('B')).toBeInTheDocument();
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
		await expect.element(screen.getByText('Status')).toBeInTheDocument();
		await expect.element(screen.getByText('Active')).toBeInTheDocument();
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
