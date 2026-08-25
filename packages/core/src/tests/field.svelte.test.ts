import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAttachmentKey } from 'svelte/attachments';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import FieldLabel from '$lib/components/field/field-label.svelte';
import FieldLabelI18n from './fixtures/field-label-i18n.svelte';
import FieldLabelDescriptionClick from './fixtures/field-label-description-click.svelte';
import FieldHarness from './fixtures/field-harness.svelte';
import FormLayoutLiveDirection from './fixtures/form-layout-live-direction.svelte';
import IconSlotProbe from './fixtures/icon-slot-probe.svelte';

/**
 * Astryx's `Field/Field.test.tsx` (33 cases at the 0.5.0 pin) and
 * `Field/FieldLabel.test.tsx` (**17** at the 0.5.0 pin), ported together because the
 * second is entirely about markup the first renders through the former. **49 of
 * upstream's 50 here**, plus one addition named below; the one absence is
 * `Field.test.tsx`'s `forwards ref correctly`, explained under "Not ported".
 *
 * ## The count, re-derived from the tag (the previous header was wrong)
 *
 * This header used to read "`Field/FieldLabel.test.tsx` (10 cases)". That suite
 * has **17**, and seven were unported and unnamed:
 *
 * - `localizes the required indicator via the i18n provider` and `localizes the
 *   optional indicator via the i18n provider` (0.3.0's `@astryx.field.required`
 *   / `@astryx.field.optional` keys, which `field-label.svelte` already
 *   resolves), through `fixtures/field-label-i18n.svelte`.
 * - the whole five-case `description click forwarding` block, through
 *   `fixtures/field-label-description-click.svelte` (upstream's
 *   `renderWithControl`). `field-label.svelte:133-179` forwards those clicks via
 *   `useInputContainer`, so the block is a direct port.
 *
 * All seven passed on the first run.
 *
 * `field-harness.svelte` stands in for upstream's JSX: a case cannot author the
 * `<input id="…" />` child snippet, nor set the layout context above the
 * component under test, so both are props on the harness. Upstream's
 * `<FormLayoutContext value={{direction: 'horizontal-labels'}}>` wrapper is
 * `direction="horizontal-labels"` here, which the harness feeds to
 * `setFormLayoutContext`.
 *
 * `FieldLabel` is rendered directly wherever it takes no snippet. Its one
 * `labelIcon` case goes through `icon-slot-probe.svelte` rather than the shared
 * `slot-probe.svelte`: `labelIcon` is a `Snippet` here (this port has no
 * `renderIconSlot` — see port/todo.md), and the case's assertion is specifically
 * `querySelector('svg')`, which `slot-probe`'s `<span>` could not satisfy. The
 * probe renders upstream's `TestIcon` markup verbatim, so the assertion stands.
 *
 * Not ported:
 * - **`Field.test.tsx:128`, `forwards ref correctly`.** Svelte has no `ref`
 *   prop; a consumer reaches an element with `bind:this`, which is the
 *   consumer's own binding and nothing the component can be asked about. The
 *   neighbouring suites' counterpart — an attachment passed through rest props —
 *   is not available for `Field`, which would give it the root `<div>`. Left out
 *   rather than asserted asymmetrically.
 *
 *   **`FieldLabel.test.tsx:59` was in that same sentence and no longer is.** It
 *   was excluded because `FieldLabel` destructured a closed prop list with no
 *   rest spread, so an attachment had nothing to ride on; 0.1.9 made upstream
 *   forward `className`/`style`/`xstyle` and pass-throughs, this port followed,
 *   and the case now has the ordinary attachment counterpart.
 *
 * One case is an *addition*, named at the case: `follows a direction that
 * changes after mount`. Upstream cannot get that wrong — `use()` re-runs every
 * render — where ours is correct only because the context stores a getter, so
 * the case pins a property React supplies for free. The same reason the four
 * `MetadataList` SSR cases and the eight trigger re-wiring ones exist.
 *
 * Restated, each noted at the case:
 * - `renders Optional text with bullet separator` — vitest's `getByText` has no
 *   `selector` option, so the `aria-hidden` element is reached by query.
 * - the DOM-wide `document.querySelector('svg')` assertions are scoped to the
 *   render container, which is what RTL's freshly-cleaned `document` amounts to.
 *
 * The StyleX *debug* class assertions (`srOnly`, `dynamicStyles.width`,
 * `horizontalLabels`, `container`, `horizontalLabelAlign`) port unchanged: our
 * style groups carry upstream's key names verbatim, and only the module prefix
 * differs (`field.stylex__styles.container` for upstream's
 * `Field__styles.container`), which a `toContain` does not see. They do depend
 * on StyleX's `dev` flag, which `vite.config.ts` sets for everything but a
 * production build.
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

/** The `Field` root: the harness renders nothing above it. */
function fieldRoot(container: HTMLElement): HTMLElement {
	const el = container.firstElementChild;
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a field root element');
	}
	return el;
}

describe('Field', () => {
	it('renders with label', async () => {
		const screen = await render(FieldHarness, {
			props: { label: 'Email', inputID: 'email-input', controlID: 'email-input' }
		});
		await expect.element(screen.getByLabelText('Email')).toBeInTheDocument();
	});

	it('renders description text', async () => {
		const screen = await render(FieldHarness, {
			props: {
				label: 'Email',
				inputID: 'email-input',
				description: "We'll never share your email",
				descriptionID: 'email-desc',
				controlID: 'email-input',
				controlDescribedBy: 'email-desc'
			}
		});
		await expect.element(screen.getByText("We'll never share your email")).toBeInTheDocument();
	});

	it('associates description with correct ID', async () => {
		const screen = await render(FieldHarness, {
			props: {
				label: 'Email',
				inputID: 'email-input',
				description: 'Description text',
				descriptionID: 'email-desc',
				controlID: 'email-input',
				controlDescribedBy: 'email-desc'
			}
		});
		const description = screen.getByText('Description text');
		await expect.element(description).toHaveAttribute('id', 'email-desc');
	});

	it('visually hides label when isLabelHidden is true', async () => {
		const screen = await render(FieldHarness, {
			props: {
				label: 'Search',
				isLabelHidden: true,
				inputID: 'search-input',
				controlID: 'search-input'
			}
		});
		const label = screen.getByText('Search');
		await expect.element(label).toBeInTheDocument();
		// Label should still be accessible
		await expect.element(screen.getByLabelText('Search')).toBeInTheDocument();
	});

	it('visually hides description when isLabelHidden is true', async () => {
		const screen = await render(FieldHarness, {
			props: {
				label: 'Search',
				isLabelHidden: true,
				description: 'Search for items',
				inputID: 'search-input',
				descriptionID: 'search-desc',
				controlID: 'search-input'
			}
		});
		// Description should still be in the DOM for screen readers
		const description = screen.getByText('Search for items');
		await expect.element(description).toBeInTheDocument();
		// But should have the visually-hidden styles applied
		expect(description.element().className).toContain('srOnly');
	});

	it('shows label visually by default', async () => {
		const screen = await render(FieldHarness, {
			props: { label: 'Email', inputID: 'email-input', controlID: 'email-input' }
		});
		const label = screen.getByText('Email');
		await expect.element(label).toBeVisible();
	});

	it('renders a single-control label as a <label> with htmlFor', async () => {
		const screen = await render(FieldHarness, {
			props: { label: 'Email', inputID: 'email-input', controlID: 'email-input' }
		});
		const labelEl = screen.getByText('Email').element();
		expect(labelEl.tagName).toBe('LABEL');
		expect(labelEl).toHaveAttribute('for', 'email-input');
	});

	it('renders a group label as a <span> (not <label>) with no htmlFor', async () => {
		const screen = await render(FieldHarness, {
			props: {
				label: 'Plan',
				inputID: 'plan-group',
				labelID: 'plan-label',
				isGroupLabel: true,
				groupLabelledBy: 'plan-label'
			}
		});
		const labelEl = screen.getByText('Plan').element();
		// A group's accessible-name element must not be a literal <label>.
		expect(labelEl.tagName).toBe('SPAN');
		expect(labelEl.closest('label')).toBeNull();
		expect(labelEl).not.toHaveAttribute('for');
		// labelID is applied to the label element and referenced by the group.
		expect(labelEl).toHaveAttribute('id', 'plan-label');
		const group = screen.getByRole('radiogroup', { name: 'Plan' }).element();
		expect(group.getAttribute('aria-labelledby')).toBe(labelEl.id);
	});

	// `forwards ref correctly` (Field.test.tsx:128) — see the file header.

	it('renders description without ID attribute when descriptionID is not provided', async () => {
		const screen = await render(FieldHarness, {
			props: {
				label: 'Email',
				inputID: 'email-input',
				description: 'Description text',
				controlID: 'email-input'
			}
		});
		const description = screen.getByText('Description text');
		await expect.element(description).toBeInTheDocument();
		await expect.element(description).toHaveAttribute('id', 'email-input-desc');
	});

	it('renders Optional text when isOptional is set', async () => {
		const screen = await render(FieldHarness, {
			props: { label: 'Name', inputID: 'name-input', isOptional: true, controlID: 'name-input' }
		});
		await expect.element(screen.getByText('Name')).toBeInTheDocument();
		await expect.element(screen.getByText(/Optional/)).toBeInTheDocument();
	});

	it('renders Required text when isRequired is set', async () => {
		const screen = await render(FieldHarness, {
			props: { label: 'Name', inputID: 'name-input', isRequired: true, controlID: 'name-input' }
		});
		await expect.element(screen.getByText('Name')).toBeInTheDocument();
		await expect.element(screen.getByText(/Required/)).toBeInTheDocument();
	});

	it('renders description and Optional text when both are set', async () => {
		const screen = await render(FieldHarness, {
			props: {
				label: 'Name',
				inputID: 'name-input',
				description: 'Enter your name',
				descriptionID: 'name-desc',
				isOptional: true,
				controlID: 'name-input',
				controlDescribedBy: 'name-desc'
			}
		});
		await expect.element(screen.getByText('Enter your name')).toBeInTheDocument();
		await expect.element(screen.getByText(/Optional/)).toBeInTheDocument();
	});

	it('renders description and Required text when both are set', async () => {
		const screen = await render(FieldHarness, {
			props: {
				label: 'Name',
				inputID: 'name-input',
				description: 'This field is mandatory',
				descriptionID: 'name-desc',
				isRequired: true,
				controlID: 'name-input',
				controlDescribedBy: 'name-desc'
			}
		});
		await expect.element(screen.getByText('This field is mandatory')).toBeInTheDocument();
		await expect.element(screen.getByText(/Required/)).toBeInTheDocument();
	});

	it('renders Optional text with bullet separator', async () => {
		const screen = await render(FieldHarness, {
			props: { label: 'Name', inputID: 'name-input', isOptional: true, controlID: 'name-input' }
		});
		await expect.element(screen.getByText('Name')).toBeInTheDocument();
		// Upstream: `getByText('∙', {selector: '[aria-hidden="true"]'})`. Vitest's
		// locators take no `selector` option, so the same element is reached by
		// query and its text asserted.
		const separator = screen.container.querySelector('[aria-hidden="true"]');
		// `toBe`, not upstream's `toContain`: the spaces around the bullet are the
		// only thing separating it from "Optional" (both sit inside one non-flex
		// span), and Svelte trims literal whitespace at an element's content edges
		// where JSX preserves it. `toContain` — and upstream's own whitespace-
		// normalising `getByText` — would pass against a jammed-up `∙Optional`.
		expect(separator?.textContent).toBe(' ∙ ');
		await expect.element(screen.getByText(/Optional/)).toBeInTheDocument();
	});

	it('renders tooltip info icon when labelTooltip is provided', async () => {
		const screen = await render(FieldHarness, {
			props: {
				label: 'Help',
				inputID: 'help-input',
				labelTooltip: 'Helpful info',
				controlID: 'help-input'
			}
		});
		// Info icon should be present
		expect(screen.container.querySelector('svg')).toBeInTheDocument();
	});

	it('does not render tooltip icon when labelTooltip is not provided', async () => {
		const screen = await render(FieldHarness, {
			props: { label: 'Name', inputID: 'name-input', controlID: 'name-input' }
		});
		expect(screen.container.querySelector('svg')).not.toBeInTheDocument();
	});

	// The status message is announced through the persistent useAnnounce live
	// regions rather than role/aria-live on the (conditionally mounted)
	// FieldStatus element itself — regions born with their content are not
	// reliably announced by assistive technology.
	it('announces error status assertively via the persistent live region', async () => {
		const screen = await render(FieldHarness, {
			props: {
				label: 'Email',
				inputID: 'email-input',
				status: { type: 'error', message: 'Invalid email' },
				controlID: 'email-input'
			}
		});
		expect(screen.getByText('Invalid email').element()).not.toHaveAttribute('role');
		await vi.waitFor(() => {
			expect(assertiveRegion()).toHaveTextContent('Invalid email');
		});
	});

	it('announces warning status politely via the persistent live region', async () => {
		const screen = await render(FieldHarness, {
			props: {
				label: 'Email',
				inputID: 'email-input',
				status: { type: 'warning', message: 'Check this' },
				controlID: 'email-input'
			}
		});
		expect(screen.getByText('Check this').element()).not.toHaveAttribute('aria-live');
		await vi.waitFor(() => {
			expect(politeRegion()).toHaveTextContent('Check this');
		});
	});

	// Regression: the status live region must NOT be born together with its
	// content. A message that appears after mount (the common validation flow)
	// has to land in the persistent announce region.
	it('announces a status message that appears after mount', async () => {
		const screen = await render(FieldHarness, {
			props: { label: 'Email', inputID: 'email-input', controlID: 'email-input' }
		});
		expect(assertiveRegion()).toBeNull();

		await screen.rerender({
			label: 'Email',
			inputID: 'email-input',
			status: { type: 'error', message: 'Email is required' },
			controlID: 'email-input'
		});
		await vi.waitFor(() => {
			expect(assertiveRegion()).toHaveTextContent('Email is required');
		});
	});

	it('auto-generates description ID as {inputID}-desc when descriptionID is not provided', async () => {
		const screen = await render(FieldHarness, {
			props: {
				label: 'Email',
				inputID: 'my-input',
				description: 'Help text',
				controlID: 'my-input'
			}
		});
		await expect.element(screen.getByText('Help text')).toHaveAttribute('id', 'my-input-desc');
	});

	it('auto-generates status message ID as {inputID}-status when messageID is not provided', async () => {
		const screen = await render(FieldHarness, {
			props: {
				label: 'Email',
				inputID: 'my-input',
				status: { type: 'error', message: 'Required' },
				controlID: 'my-input'
			}
		});
		await expect.element(screen.getByText('Required')).toHaveAttribute('id', 'my-input-status');
	});

	it('warns when isOptional and isRequired are both set', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await render(FieldHarness, {
			props: {
				label: 'Name',
				inputID: 'name-input',
				isOptional: true,
				isRequired: true,
				controlID: 'name-input'
			}
		});
		expect(warnSpy).toHaveBeenCalledWith(
			'Field: isOptional and isRequired are mutually exclusive. isOptional takes precedence.'
		);
		warnSpy.mockRestore();
	});

	// ─── width prop (#2755) ───────────────────────────────────────────────

	describe('width prop', () => {
		it('applies a string width to the outer field root', async () => {
			const screen = await render(FieldHarness, {
				props: {
					label: 'Name',
					inputID: 'name-input',
					width: '100%',
					'data-testid': 'field',
					controlID: 'name-input',
					controlTestID: 'control'
				}
			});
			const field = screen.getByTestId('field').element();
			// StyleX compiles the dynamic width to an inline CSS custom property.
			expect(field.getAttribute('style')).toContain('100%');
			expect(field.className).toContain('dynamicStyles.width');
		});

		it('applies a numeric width (treated as pixels)', async () => {
			const screen = await render(FieldHarness, {
				props: {
					label: 'Name',
					inputID: 'name-input',
					width: 240,
					'data-testid': 'field',
					controlID: 'name-input'
				}
			});
			const field = screen.getByTestId('field').element();
			expect(field.getAttribute('style')).toContain('240');
		});

		it('does not size the inner control element', async () => {
			const screen = await render(FieldHarness, {
				props: {
					label: 'Name',
					inputID: 'name-input',
					width: '100%',
					'data-testid': 'field',
					controlID: 'name-input',
					controlTestID: 'control'
				}
			});
			const control = screen.getByTestId('control').element();
			// The width var lives on the field root, not the control itself.
			expect(control.getAttribute('style') ?? '').not.toContain('100%');
		});

		it('omits width styling when the prop is not provided', async () => {
			const screen = await render(FieldHarness, {
				props: {
					label: 'Name',
					inputID: 'name-input',
					'data-testid': 'field',
					controlID: 'name-input'
				}
			});
			const field = screen.getByTestId('field').element();
			expect(field.className).not.toContain('dynamicStyles.width');
		});
	});

	// ─── Horizontal-labels context ────────────────────────────────────────

	describe('horizontal-labels layout', () => {
		/** Upstream's `horizontalLabelsWrapper`, as a harness prop. */
		const horizontalLabels = { direction: 'horizontal-labels' } as const;

		it('applies display:contents when in horizontal-labels context', async () => {
			const screen = await render(FieldHarness, {
				props: {
					...horizontalLabels,
					label: 'Name',
					inputID: 'name-input',
					controlID: 'name-input'
				}
			});
			const field = fieldRoot(screen.container);
			expect(field.className).toContain('horizontalLabels');
		});

		it('renders label and input as direct grid children via display:contents', async () => {
			const screen = await render(FieldHarness, {
				props: {
					...horizontalLabels,
					label: 'Name',
					inputID: 'name-input',
					'data-testid': 'field',
					controlID: 'name-input',
					controlTestID: 'name'
				}
			});
			const field = screen.getByTestId('field').element();
			// With display:contents, the field's children participate in the parent grid.
			// The field should contain: label alignment wrapper + input wrapper div
			const label = screen.getByText('Name').element();
			expect(label.tagName).toBe('LABEL');
			expect(field.contains(label)).toBe(true);
			expect(field.contains(screen.getByTestId('name').element())).toBe(true);
		});

		it('groups description with input in column 2', async () => {
			const screen = await render(FieldHarness, {
				props: {
					...horizontalLabels,
					label: 'Email',
					inputID: 'email-input',
					description: "We won't share it",
					descriptionID: 'email-desc',
					'data-testid': 'field',
					controlID: 'email-input',
					controlTestID: 'email'
				}
			});
			const descEl = screen.getByText("We won't share it").element();
			const inputEl = screen.getByTestId('email').element();
			// Both description and input should be inside the same wrapper div (column 2)
			expect(descEl.parentElement).toBe(inputEl.parentElement);
		});

		it('groups status message with input in column 2', async () => {
			const screen = await render(FieldHarness, {
				props: {
					...horizontalLabels,
					label: 'Email',
					inputID: 'email-input',
					status: { type: 'error', message: 'Required' },
					'data-testid': 'field',
					controlID: 'email-input',
					controlTestID: 'email'
				}
			});
			const statusEl = screen.getByText('Required').element();
			const inputEl = screen.getByTestId('email').element();
			// Both status and input should be inside the same wrapper div (column 2)
			expect(statusEl.parentElement).toBe(inputEl.parentElement);
		});

		it('does not apply display:contents in vertical context', async () => {
			const screen = await render(FieldHarness, {
				props: { label: 'Name', inputID: 'name-input', controlID: 'name-input' }
			});
			const field = fieldRoot(screen.container);
			expect(field.className).not.toContain('horizontalLabels');
			expect(field.className).toContain('container');
		});

		it('wraps label in alignment div with top padding', async () => {
			const screen = await render(FieldHarness, {
				props: {
					...horizontalLabels,
					label: 'Name',
					inputID: 'name-input',
					'data-testid': 'field',
					controlID: 'name-input'
				}
			});
			const field = screen.getByTestId('field').element();
			// First child should be the label alignment wrapper
			const labelWrapper = field.children[0] as HTMLElement;
			expect(labelWrapper.tagName).toBe('DIV');
			expect(labelWrapper.className).toContain('horizontalLabelAlign');
			// Label should be inside
			expect(labelWrapper.querySelector('label')).not.toBeNull();
		});

		// One case beyond upstream's 42, for the reason the four `MetadataList`
		// SSR cases exist: it pins a property React gives upstream for free.
		// `use(FormLayoutContext)` re-runs on every render, so a `direction` that
		// changes after mount is not a thing upstream can get wrong. Svelte reads
		// context once at init, so ours is only live because the context stores a
		// *getter* — swap it for the resolved value and every case above still
		// passes while a real `FormLayout` silently freezes its fields.
		it('follows a direction that changes after mount', async () => {
			const screen = await render(FormLayoutLiveDirection, {
				props: { direction: 'vertical' }
			});
			const field = screen.getByTestId('field').element();
			expect(field.className).toContain('container');
			expect(field.className).not.toContain('horizontalLabels');
			expect(field.getAttribute('data-layout')).toBeNull();

			await screen.rerender({ direction: 'horizontal-labels' });

			const swapped = screen.getByTestId('field').element();
			expect(swapped.className).toContain('horizontalLabels');
			expect(swapped.className).not.toContain('container');
			expect(swapped.getAttribute('data-layout')).toBe('horizontal-labels');
		});
	});
});

describe('FieldLabel', () => {
	it('renders label text', async () => {
		const screen = await render(FieldLabel, {
			props: { label: 'Email', inputID: 'email-input' }
		});
		await expect.element(screen.getByText('Email')).toBeInTheDocument();
	});

	it('associates label with input via htmlFor', async () => {
		const screen = await render(FieldLabel, {
			props: { label: 'Email', inputID: 'email-input' }
		});
		const label = screen.getByText('Email').element().closest('label');
		expect(label).toHaveAttribute('for', 'email-input');
	});

	it('renders Optional text when isOptional is true', async () => {
		const screen = await render(FieldLabel, {
			props: { label: 'Name', inputID: 'name-input', isOptional: true }
		});
		await expect.element(screen.getByText(/Optional/)).toBeInTheDocument();
	});

	it('renders Required text when isRequired is true', async () => {
		const screen = await render(FieldLabel, {
			props: { label: 'Name', inputID: 'name-input', isRequired: true }
		});
		await expect.element(screen.getByText(/Required/)).toBeInTheDocument();
	});

	it('localizes the required indicator via the i18n provider', async () => {
		const screen = await render(FieldLabelI18n, {
			props: {
				locale: 'fr',
				overrides: { fr: { '@astryx.field.required': 'Obligatoire' } },
				label: 'Nom',
				inputID: 'name-input',
				isRequired: true
			}
		});
		await expect.element(screen.getByText(/Obligatoire/)).toBeInTheDocument();
		expect(screen.getByText(/Required/).query()).toBeNull();
	});

	it('localizes the optional indicator via the i18n provider', async () => {
		const screen = await render(FieldLabelI18n, {
			props: {
				locale: 'fr',
				overrides: { fr: { '@astryx.field.optional': 'Facultatif' } },
				label: 'Nom',
				inputID: 'name-input',
				isOptional: true
			}
		});
		await expect.element(screen.getByText(/Facultatif/)).toBeInTheDocument();
		expect(screen.getByText(/Optional/).query()).toBeNull();
	});

	it('shows Optional when both isOptional and isRequired are true', async () => {
		const screen = await render(FieldLabel, {
			props: { label: 'Name', inputID: 'name-input', isOptional: true, isRequired: true }
		});
		await expect.element(screen.getByText(/Optional/)).toBeInTheDocument();
		expect(screen.getByText(/Required/).query()).toBeNull();
	});

	it('renders labelIcon when provided', async () => {
		const screen = await render(IconSlotProbe, {
			props: {
				component: FieldLabel,
				slot: 'labelIcon',
				rest: { label: 'Starred', inputID: 'starred-input' }
			}
		});
		const svg = screen.container.querySelector('svg');
		expect(svg).toBeInTheDocument();
	});

	it('forwards an attachment to the label element', async () => {
		// Upstream's `forwards ref correctly` (FieldLabel.test.tsx:59). This case
		// could not exist until 0.1.9: `FieldLabel` used to destructure a closed
		// prop list with no rest spread, so there was nothing to pass an attachment
		// through. It forwards now, so the counterpart the neighbouring suites use
		// is available here too.
		const attached = vi.fn();
		const screen = await render(FieldLabel, {
			props: {
				label: 'Ref Test',
				inputID: 'ref-input',
				[createAttachmentKey()]: (node: Element) => attached(node)
			}
		});
		expect(attached).toHaveBeenCalledWith(screen.container.firstElementChild);
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLLabelElement);
	});

	it('renders tooltip info icon when labelTooltip prop is provided', async () => {
		const screen = await render(FieldLabel, {
			props: {
				label: 'Help',
				inputID: 'help-input',
				labelTooltip: 'This is helpful information'
			}
		});
		// Two SVGs: the info icon is wrapped in tooltip
		const svgs = screen.container.querySelectorAll('svg');
		expect(svgs.length).toBeGreaterThan(0);
	});

	it('does not render extra icon when labelTooltip is not provided', async () => {
		const screen = await render(FieldLabel, {
			props: { label: 'Name', inputID: 'name-input' }
		});
		// No SVGs should be present when no icons are provided
		expect(screen.container.querySelector('svg')).not.toBeInTheDocument();
	});

	it('renders labelTooltip with Optional indicator together', async () => {
		const screen = await render(FieldLabel, {
			props: {
				label: 'Field',
				inputID: 'field-input',
				isOptional: true,
				labelTooltip: 'Help text'
			}
		});
		await expect.element(screen.getByText(/Optional/)).toBeInTheDocument();
		// Info icon should be present
		expect(screen.container.querySelector('svg')).toBeInTheDocument();
	});

	describe('description click forwarding', () => {
		// Upstream's `renderWithControl`: a real control with the target id so
		// click-forwarding has something to hit, alongside the label whose
		// description forwards clicks. The two elements are a fragment upstream and
		// `fixtures/field-label-description-click.svelte` here.
		async function renderWithControl(props: {
			isGroupLabel?: boolean;
			controlType?: string;
			hasLink?: boolean;
			onLinkClick?: () => void;
		}): Promise<{ screen: Awaited<ReturnType<typeof render>>; onClick: ReturnType<typeof vi.fn> }> {
			const onClick = vi.fn();
			const screen = await render(FieldLabelDescriptionClick, {
				props: { ...props, onControlClick: onClick }
			});
			return { screen, onClick };
		}

		it('forwards a description click to a click-activatable control (checkbox)', async () => {
			const { screen, onClick } = await renderWithControl({ controlType: 'checkbox' });
			await userEvent.click(screen.getByText("We'll email you"));
			expect(onClick).toHaveBeenCalledTimes(1);
		});

		it('focuses (does not click) a text input on description click', async () => {
			const { screen, onClick } = await renderWithControl({ controlType: 'text' });
			await userEvent.click(screen.getByText("We'll email you"));
			// Text inputs focus rather than click — matching native label behavior,
			// so no synthetic click fires but the control receives focus.
			expect(onClick).not.toHaveBeenCalled();
			expect(document.getElementById('ctrl')).toHaveFocus();
		});

		it('does NOT forward description clicks for a group label', async () => {
			const { screen, onClick } = await renderWithControl({ isGroupLabel: true });
			await userEvent.click(screen.getByText("We'll email you"));
			expect(onClick).not.toHaveBeenCalled();
		});

		it('does NOT hijack clicks on interactive content inside the description', async () => {
			const linkClick = vi.fn();
			const { screen, onClick } = await renderWithControl({
				hasLink: true,
				onLinkClick: linkClick
			});
			await userEvent.click(screen.getByRole('link', { name: 'terms' }));
			// The nested link handles its own click; the control is not toggled.
			expect(linkClick).toHaveBeenCalledTimes(1);
			expect(onClick).not.toHaveBeenCalled();
		});

		it('keeps the description a sibling of the label (not nested inside it)', async () => {
			const { screen } = await renderWithControl({});
			const description = screen.getByText("We'll email you").element();
			// The description must not live inside the <label> — nesting it there
			// would fold it into the control's accessible name.
			expect(description.closest('label')).toBeNull();
		});
	});
});
