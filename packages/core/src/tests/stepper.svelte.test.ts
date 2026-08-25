import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import StepperProbe from './fixtures/stepper-probe.svelte';
import StepperGroupProbe from './fixtures/stepper-group-probe.svelte';

/**
 * Astryx's `Stepper/Stepper.test.tsx`, ported case for case.
 *
 * The file recount is the contract: upstream has **48** `it` cases at the
 * **0.5.0** pin — 29 in the top-level `Stepper` block, 4 in `keyboard
 * interaction`, 3 in `fragment-grouped steps`, 3 in `connector fill`, and 9 in
 * `connector fill motion`. **All 48 are ported here; none dropped.**
 *
 * Because `<Stepper>` takes its `Step` children as a snippet, every case renders
 * through `stepper-probe.svelte`, which describes the steps as an array and
 * forwards every stepper prop; see that file. `activeStep` is a plain prop
 * exactly as upstream's is, and the cases that advance the flow drive it with
 * `rerender`, upstream's `rerender`.
 *
 * Restated deliveries (each noted at its case), assertions unchanged in meaning:
 *
 * - **`exact: true` on every string `name`/text.** Playwright's locators
 *   substring-match a string where Testing Library matches the whole accessible
 *   name, so a verbatim transcription would be *weaker* than the case it ports.
 *   Regexes are substring on both sides and are left alone.
 * - **StyleX debug class names carry a different file prefix.** Upstream's are
 *   `Step__styles.<key>`; the module here is `step.stylex.ts`, so ours read
 *   `step.stylex__styles.<key>`. Every `[class*="…"]` selector matches on the
 *   key alone, which is identical on both sides; the one case that names the
 *   full prefix (`lets the current step keep its ring indicator`) is restated to
 *   the key. Same drop the `AspectRatio` port recorded.
 * - **Three titles drop React-only vocabulary** and are the only textual
 *   changes: `accepts a custom ReactNode as indicator` / `accepts a ReactNode as
 *   indicator` become "node", the `fragment-grouped steps` block becomes
 *   "snippet-grouped", and the `StrictMode` case is retitled to what it asserts
 *   here (see the last bullet). The cases themselves map one to one.
 * - **`within(el)` becomes locator chaining** (`screen.getByTestId(id).getByText(…)`),
 *   and `getAllByRole` becomes `screen.getByRole(…).elements()`.
 * - **`fillEasings` reads the computed pseudo-element instead of the sheet.**
 *   Upstream scans `document.styleSheets` for a `::before` rule owned by one of
 *   the segment's atomic classes. That scan is brittle here in three ways
 *   upstream cannot produce — the sheet is wrapped in `@layer`, a `CSSStyleRule`
 *   carries nested rules since CSS Nesting shipped, and a StyleX selector can be
 *   padded or scoped ahead of the class — and each fails silently, as an empty
 *   result that reads as a missing declaration. Chromium answers the question
 *   directly, so the case asks it: `getComputedStyle(seg, "::before")`. Stronger
 *   than upstream, not weaker — it proves the declaration *applies* rather than
 *   merely existing — and only available because this project runs a real
 *   browser where upstream runs jsdom.
 * - **The fragment-grouped pair uses a snippet.** Svelte has no fragment; a
 *   snippet is the construct that groups elements without emitting one, which is
 *   the property the three cases exist to pin. Svelte's block markers make the
 *   two arms' raw `innerHTML` differ by comment nodes with no counterpart in
 *   React's output, so the identity case compares the markup with comment nodes
 *   stripped — the elements and attributes, which is what upstream compares.
 * - **`StrictMode` has no counterpart.** React's double render exists to catch a
 *   render function that is not idempotent; Svelte has no such mode, and the
 *   `$derived` that tracks the previous step is idempotent for the same reason
 *   upstream's state update is. The case is kept and delivered as what it
 *   actually asserts: two successive single advances each animate their own
 *   span and stop the one behind it.
 */

/** Class names on `el`, StyleX debug + atomic only — theme reflections dropped. */
function stylexClasses(el: HTMLElement): string {
	return el.className
		.split(/\s+/)
		.filter((c) => c.includes('__styles.') || /^x[a-z0-9]+$/.test(c))
		.sort()
		.join(' ');
}

/** The element whose child `<svg>` the indicator renders, i.e. its wrapper. */
function indicatorOf(step: Element): HTMLElement {
	return step.querySelector('svg')?.parentElement as HTMLElement;
}

describe('Stepper', () => {
	it('renders an ordered list of steps (not a nav landmark)', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 0,
				steps: [
					{ step: 0, label: 'Step 1' },
					{ step: 1, label: 'Step 2' },
					{ step: 2, label: 'Step 3' }
				]
			}
		});

		// A stepper is a sequence/progress list, not a navigation landmark.
		await expect.element(screen.getByRole('navigation')).not.toBeInTheDocument();
		const list = screen.getByRole('list', { name: 'Progress', exact: true }).element();
		expect(list.tagName).toBe('OL');
		await expect.element(screen.getByText('Step 1', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Step 2', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Step 3', { exact: true })).toBeInTheDocument();
	});

	it('renders step numbers', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 0,
				steps: [
					{ step: 0, label: 'First', indicator: 'number' },
					{ step: 1, label: 'Second', indicator: 'number' }
				]
			}
		});

		await expect.element(screen.getByText('1', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('2', { exact: true })).toBeInTheDocument();
	});

	it('marks the active step with aria-current', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 1,
				steps: [
					{ step: 0, label: 'Step 1', 'data-testid': 'step-0' },
					{ step: 1, label: 'Step 2', 'data-testid': 'step-1' },
					{ step: 2, label: 'Step 3', 'data-testid': 'step-2' }
				]
			}
		});

		await expect.element(screen.getByTestId('step-0')).not.toHaveAttribute('aria-current');
		await expect.element(screen.getByTestId('step-1')).toHaveAttribute('aria-current', 'step');
		await expect.element(screen.getByTestId('step-2')).not.toHaveAttribute('aria-current');
	});

	it('renders descriptions when provided', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 0,
				steps: [
					{ step: 0, label: 'Account', description: 'Create your account' },
					{ step: 1, label: 'Profile' }
				]
			}
		});

		await expect
			.element(screen.getByText('Create your account', { exact: true }))
			.toBeInTheDocument();
	});

	it('supports custom accessible label', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 0,
				label: 'Checkout progress',
				steps: [
					{ step: 0, label: 'Cart' },
					{ step: 1, label: 'Payment' }
				]
			}
		});

		await expect
			.element(screen.getByRole('list', { name: 'Checkout progress', exact: true }))
			.toBeInTheDocument();
	});

	it('supports vertical orientation', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 0,
				orientation: 'vertical',
				steps: [
					{ step: 0, label: 'Step 1' },
					{ step: 1, label: 'Step 2' }
				]
			}
		});

		await expect.element(screen.getByRole('list')).toHaveAttribute('data-orientation', 'vertical');
	});

	it('calls onStepClick when a completed step is clicked', async () => {
		const handleClick = vi.fn();
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 2,
				onStepClick: handleClick,
				steps: [
					{ step: 0, label: 'Step 1' },
					{ step: 1, label: 'Step 2' },
					{ step: 2, label: 'Step 3' }
				]
			}
		});

		await userEvent.click(
			screen.getByRole('button', { name: 'Go to step 1: Step 1, completed', exact: true })
		);
		expect(handleClick).toHaveBeenCalledWith(0);
	});

	it('calls onStepClick when the active step is clicked', async () => {
		const handleClick = vi.fn();
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 1,
				onStepClick: handleClick,
				steps: [
					{ step: 0, label: 'Step 1' },
					{ step: 1, label: 'Step 2' },
					{ step: 2, label: 'Step 3' }
				]
			}
		});

		await userEvent.click(
			screen.getByRole('button', { name: 'Go to step 2: Step 2', exact: true })
		);
		expect(handleClick).toHaveBeenCalledWith(1);
	});

	it('renders buttons for upcoming steps in non-linear mode', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 0,
				onStepClick: () => {},
				steps: [
					{ step: 0, label: 'Step 1' },
					{ step: 1, label: 'Step 2' }
				]
			}
		});

		await expect
			.element(screen.getByRole('button', { name: 'Go to step 1: Step 1', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Go to step 2: Step 2', exact: true }))
			.toBeInTheDocument();
	});

	it('calls onStepClick when an upcoming step is clicked', async () => {
		const handleClick = vi.fn();
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 0,
				onStepClick: handleClick,
				steps: [
					{ step: 0, label: 'Step 1' },
					{ step: 1, label: 'Step 2' },
					{ step: 2, label: 'Step 3' }
				]
			}
		});

		await userEvent.click(
			screen.getByRole('button', { name: 'Go to step 3: Step 3', exact: true })
		);
		expect(handleClick).toHaveBeenCalledWith(2);
	});

	it('does not render buttons for disabled steps', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 2,
				onStepClick: () => {},
				steps: [
					{ step: 0, label: 'Step 1', isDisabled: true },
					{ step: 1, label: 'Step 2' },
					{ step: 2, label: 'Step 3' }
				]
			}
		});

		await expect
			.element(screen.getByRole('button', { name: /Go to step 1: Step 1/ }))
			.not.toBeInTheDocument();
	});

	it('does not render buttons when onStepClick is not provided', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 2,
				steps: [
					{ step: 0, label: 'Step 1' },
					{ step: 1, label: 'Step 2' },
					{ step: 2, label: 'Step 3' }
				]
			}
		});

		expect(screen.getByRole('button').elements()).toHaveLength(0);
	});

	it('applies a semantic color status (color only) via data attribute', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 1,
				steps: [
					{ step: 0, label: 'Step 1', 'data-testid': 'step-0' },
					{ step: 1, label: 'Step 2', status: 'error', 'data-testid': 'step-1' }
				]
			}
		});

		await expect.element(screen.getByTestId('step-1')).toHaveAttribute('data-status', 'error');
		// status is color-only — it must not change progress semantics.
		await expect.element(screen.getByTestId('step-1')).toHaveAttribute('aria-current', 'step');
	});

	it('reflects each global semantic status on the data attribute', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 0,
				steps: [
					{ step: 0, label: 'A', status: 'accent', 'data-testid': 's-accent' },
					{ step: 1, label: 'B', status: 'success', 'data-testid': 's-success' },
					{ step: 2, label: 'C', status: 'warning', 'data-testid': 's-warning' },
					{ step: 3, label: 'D', status: 'error', 'data-testid': 's-error' }
				]
			}
		});

		await expect.element(screen.getByTestId('s-accent')).toHaveAttribute('data-status', 'accent');
		await expect.element(screen.getByTestId('s-success')).toHaveAttribute('data-status', 'success');
		await expect.element(screen.getByTestId('s-warning')).toHaveAttribute('data-status', 'warning');
		await expect.element(screen.getByTestId('s-error')).toHaveAttribute('data-status', 'error');
	});

	it('keeps the progress bar progress-colored regardless of status, recoloring only the indicator', async () => {
		// Baseline: a completed step with no status.
		const baseline = await render(StepperProbe, {
			props: { activeStep: 1, steps: [{ step: 0, label: 'A', 'data-testid': 'base' }] }
		});
		const baseStep = baseline.getByTestId('base').element();
		const baseBar = baseStep.querySelector('.astryx-step-bar') as HTMLElement;
		const baseIndicator = indicatorOf(baseStep);

		// Same completed step, now with a semantic status.
		const themed = await render(StepperProbe, {
			props: {
				activeStep: 1,
				steps: [{ step: 0, label: 'A', status: 'error', 'data-testid': 'themed' }]
			}
		});
		const themedStep = themed.getByTestId('themed').element();
		const themedBar = themedStep.querySelector('.astryx-step-bar') as HTMLElement;
		const themedIndicator = indicatorOf(themedStep);

		// Bar coloring must be identical — status must NOT recolor the bar
		// (always --color-accent when filled / --color-border when incomplete).
		expect(themedBar.className).toBe(baseBar.className);

		// The indicator, however, must pick up the status color.
		expect(themedIndicator.className).not.toBe(baseIndicator.className);
	});

	it('keeps an incomplete step bar border-colored regardless of status', async () => {
		// Baseline: a not-started step with no status.
		const baseline = await render(StepperProbe, {
			props: {
				activeStep: 0,
				steps: [
					{ step: 0, label: 'A', 'data-testid': 'base-active' },
					{ step: 1, label: 'B', 'data-testid': 'base' }
				]
			}
		});
		const baseBar = baseline
			.getByTestId('base')
			.element()
			.querySelector('.astryx-step-bar') as HTMLElement;

		// Same not-started step, now with a semantic status.
		const themed = await render(StepperProbe, {
			props: {
				activeStep: 0,
				steps: [
					{ step: 0, label: 'A', 'data-testid': 'themed-active' },
					{ step: 1, label: 'B', status: 'warning', 'data-testid': 'themed' }
				]
			}
		});
		const themedBar = themed
			.getByTestId('themed')
			.element()
			.querySelector('.astryx-step-bar') as HTMLElement;

		// Incomplete bar stays border-colored — status must not recolor it.
		expect(themedBar.className).toBe(baseBar.className);
	});

	it('does not set a status data attribute when status is unset', async () => {
		const screen = await render(StepperProbe, {
			props: { activeStep: 0, steps: [{ step: 0, label: 'Step 1', 'data-testid': 'step-0' }] }
		});

		await expect.element(screen.getByTestId('step-0')).not.toHaveAttribute('data-status');
	});

	it('handles zero active step correctly', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 0,
				steps: [
					{ step: 0, label: 'Step 1', 'data-testid': 'step-0' },
					{ step: 1, label: 'Step 2', 'data-testid': 'step-1' }
				]
			}
		});

		await expect.element(screen.getByTestId('step-0')).toHaveAttribute('aria-current', 'step');
		await expect.element(screen.getByTestId('step-1')).not.toHaveAttribute('aria-current');
	});

	it('renders each step as a list item', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 0,
				steps: [
					{ step: 0, label: 'Step 1' },
					{ step: 1, label: 'Step 2' },
					{ step: 2, label: 'Step 3' }
				]
			}
		});

		const items = screen.getByRole('listitem').elements();
		expect(items).toHaveLength(3);
		expect(items[0].tagName).toBe('LI');
	});

	it('accepts a custom node as indicator', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 0,
				steps: [{ step: 0, label: 'Step 1', indicator: 'custom-star' }]
			}
		});

		await expect.element(screen.getByTestId('custom-icon')).toBeInTheDocument();
		await expect.element(screen.getByText('★', { exact: true })).toBeInTheDocument();
	});

	it('accepts a node as indicator', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 1,
				steps: [{ step: 1, label: 'Payment', indicator: 'custom-pay' }]
			}
		});

		await expect.element(screen.getByTestId('pay-icon')).toBeInTheDocument();
	});

	it('renders a distinct indicator glyph per status on non-current steps', async () => {
		// All steps completed (activeStep past them) so none is the current step.
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 4,
				steps: [
					{ step: 0, label: 'A', status: 'success', 'data-testid': 's-success' },
					{ step: 1, label: 'B', status: 'warning', 'data-testid': 's-warning' },
					{ step: 2, label: 'C', status: 'error', 'data-testid': 's-error' },
					{ step: 3, label: 'D', 'data-testid': 's-plain' }
				]
			}
		});

		const indicatorClass = (testid: string) =>
			indicatorOf(screen.getByTestId(testid).element()).className;

		// Each status renders an svg indicator (no number badge)...
		expect(screen.getByTestId('s-success').element().querySelector('svg')).toBeTruthy();
		expect(screen.getByTestId('s-warning').element().querySelector('svg')).toBeTruthy();
		expect(screen.getByTestId('s-error').element().querySelector('svg')).toBeTruthy();

		// ...and each status tints the indicator differently from the others and
		// from the plain completed (accent) step.
		const classes = new Set([
			indicatorClass('s-success'),
			indicatorClass('s-warning'),
			indicatorClass('s-error'),
			indicatorClass('s-plain')
		]);
		expect(classes.size).toBe(4);
	});

	it('lets the current step keep its ring indicator regardless of status', async () => {
		// The current-step ring's painted color is driven by the StyleX
		// `iconInProgress` class (accent), never a status color — the ring replaces
		// any status glyph. The `astryx-step-indicator` theme target reflects
		// `status` as a data attribute so a theme can still reach it, which is
		// orthogonal to the painted color, so assert the StyleX color class here.
		const plain = await render(StepperProbe, {
			props: { activeStep: 0, steps: [{ step: 0, label: 'A', 'data-testid': 'plain' }] }
		});
		const plainIndicator = stylexClasses(indicatorOf(plain.getByTestId('plain').element()));

		// The same current step, now with status="success": the painted ring must
		// be unchanged (the current-step ring replaces any status glyph).
		const themed = await render(StepperProbe, {
			props: {
				activeStep: 0,
				steps: [{ step: 0, label: 'A', status: 'success', 'data-testid': 'themed' }]
			}
		});
		const themedIndicator = stylexClasses(indicatorOf(themed.getByTestId('themed').element()));

		expect(themedIndicator).toBe(plainIndicator);
		// And it is the in-progress (accent) color, not a status color.
		expect(plainIndicator).toContain('iconInProgress');
	});

	it('replaces the number badge with a status glyph on not-started steps', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 0,
				steps: [
					{ step: 0, label: 'A', 'data-testid': 'current' },
					{ step: 1, label: 'B', status: 'error', 'data-testid': 'future' }
				]
			}
		});
		const future = screen.getByTestId('future').element();
		// The not-started step would normally show its number ("2"); with a status
		// glyph it shows an icon instead.
		expect(future.textContent).not.toContain('2');
		expect(future.querySelector('svg')).toBeTruthy();
	});

	it('exposes progress/status as visually hidden text (indicators are aria-hidden)', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 2,
				steps: [
					{ step: 0, label: 'Account', 'data-testid': 'done' },
					{ step: 1, label: 'Payment', status: 'error', 'data-testid': 'failed' },
					{ step: 2, label: 'Review', 'data-testid': 'current' },
					{ step: 3, label: 'Confirm', 'data-testid': 'upcoming' }
				]
			}
		});

		// Completed step announces "completed"; error status wins over completion.
		await expect
			.element(screen.getByTestId('done').getByText('completed', { exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByTestId('failed').getByText('error', { exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByTestId('failed').getByText('completed', { exact: true }))
			.not.toBeInTheDocument();
		// Current step is announced via aria-current, not hidden text; upcoming
		// steps stay silent.
		await expect
			.element(screen.getByTestId('current').getByText('completed', { exact: true }))
			.not.toBeInTheDocument();
		await expect
			.element(screen.getByTestId('upcoming').getByText(/completed|error|warning/))
			.not.toBeInTheDocument();
	});

	it('exposes warning and success statuses as visually hidden text', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 2,
				steps: [
					{ step: 0, label: 'Build', status: 'warning', 'data-testid': 'warned' },
					{ step: 1, label: 'Deploy', status: 'success', 'data-testid': 'passed' }
				]
			}
		});

		await expect
			.element(screen.getByTestId('warned').getByText('warning', { exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByTestId('passed').getByText('completed', { exact: true }))
			.toBeInTheDocument();
	});

	it('composes status into the accessible name of clickable steps', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 2,
				onStepClick: () => {},
				steps: [
					{ step: 0, label: 'Account' },
					{ step: 1, label: 'Payment', status: 'error' },
					{ step: 2, label: 'Review' }
				]
			}
		});

		await expect
			.element(
				screen.getByRole('button', { name: 'Go to step 1: Account, completed', exact: true })
			)
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Go to step 2: Payment, error', exact: true }))
			.toBeInTheDocument();
		// The current step gets no status suffix (aria-current covers it).
		await expect
			.element(screen.getByRole('button', { name: 'Go to step 3: Review', exact: true }))
			.toBeInTheDocument();
	});

	it('exposes hidden status text in the on-track layout too', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 1,
				indicatorPosition: 'on-track',
				steps: [
					{ step: 0, label: 'Account', 'data-testid': 'ot-done' },
					{ step: 1, label: 'Payment', 'data-testid': 'ot-current' }
				]
			}
		});

		await expect
			.element(screen.getByTestId('ot-done').getByText('completed', { exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByTestId('ot-current').getByText('completed', { exact: true }))
			.not.toBeInTheDocument();
	});

	// A vertical on-track step's content slot renders outside the row that draws
	// the connector, so without its own segment the track breaks open around any
	// step carrying content. A test cannot measure the line, so assert the
	// wiring: the slot carries a segment, and it hides on the last step like the
	// row's trailing one does.
	it('continues the on-track connector past a step content slot', async () => {
		const screen = await render(StepperProbe, {
			props: {
				activeStep: 1,
				orientation: 'vertical',
				indicatorPosition: 'on-track',
				steps: [
					{ step: 0, label: 'Account', 'data-testid': 'ot-plain' },
					{ step: 1, label: 'Payment', 'data-testid': 'ot-content', content: 'Pay now' }
				]
			}
		});

		expect(
			screen
				.getByTestId('ot-content')
				.element()
				.querySelector('[class*="otContentSegV"][class*="otSegHiddenIfLast"]')
		).toBeInTheDocument();
		// A step without content has no slot, so no extra segment.
		expect(
			screen.getByTestId('ot-plain').element().querySelector('[class*="otContentSegV"]')
		).not.toBeInTheDocument();
	});

	describe('keyboard interaction', () => {
		it('activates a step with Enter', async () => {
			const handleClick = vi.fn();
			const screen = await render(StepperProbe, {
				props: {
					activeStep: 2,
					onStepClick: handleClick,
					steps: [
						{ step: 0, label: 'Step 1' },
						{ step: 1, label: 'Step 2' },
						{ step: 2, label: 'Step 3' }
					]
				}
			});

			await userEvent.tab();
			await expect
				.element(
					screen.getByRole('button', { name: 'Go to step 1: Step 1, completed', exact: true })
				)
				.toHaveFocus();
			await userEvent.keyboard('{Enter}');
			expect(handleClick).toHaveBeenCalledWith(0);
		});

		it('activates a step with Space', async () => {
			const handleClick = vi.fn();
			await render(StepperProbe, {
				props: {
					activeStep: 2,
					onStepClick: handleClick,
					steps: [
						{ step: 0, label: 'Step 1' },
						{ step: 1, label: 'Step 2' },
						{ step: 2, label: 'Step 3' }
					]
				}
			});

			await userEvent.tab();
			await userEvent.keyboard(' ');
			expect(handleClick).toHaveBeenCalledWith(0);
		});

		it('tabs through steps in document order, skipping disabled ones', async () => {
			const screen = await render(StepperProbe, {
				props: {
					activeStep: 3,
					onStepClick: () => {},
					steps: [
						{ step: 0, label: 'One' },
						{ step: 1, label: 'Two', isDisabled: true },
						{ step: 2, label: 'Three' }
					]
				}
			});

			await userEvent.tab();
			await expect
				.element(screen.getByRole('button', { name: 'Go to step 1: One, completed', exact: true }))
				.toHaveFocus();
			// The disabled step renders no button, so Tab lands on step 3 next.
			await userEvent.tab();
			await expect
				.element(
					screen.getByRole('button', { name: 'Go to step 3: Three, completed', exact: true })
				)
				.toHaveFocus();
		});

		it('supports keyboard activation in the on-track layout', async () => {
			const handleClick = vi.fn();
			await render(StepperProbe, {
				props: {
					activeStep: 2,
					indicatorPosition: 'on-track',
					onStepClick: handleClick,
					steps: [
						{ step: 0, label: 'Cart' },
						{ step: 1, label: 'Shipping' },
						{ step: 2, label: 'Payment' }
					]
				}
			});

			await userEvent.tab();
			await userEvent.keyboard('{Enter}');
			expect(handleClick).toHaveBeenCalledWith(0);
		});
	});

	describe('snippet-grouped steps', () => {
		/** Markup with Svelte's block anchor comments removed. */
		const elementHtml = (container: HTMLElement): string => {
			const clone = container.cloneNode(true) as HTMLElement;
			const walker = document.createTreeWalker(clone, NodeFilter.SHOW_COMMENT);
			const comments: Comment[] = [];
			while (walker.nextNode()) {
				comments.push(walker.currentNode as Comment);
			}
			for (const comment of comments) {
				comment.remove();
			}
			return clone.innerHTML;
		};

		it('renders on-track steps identically whether they are flat or grouped in a snippet', async () => {
			const flat = await render(StepperGroupProbe, {
				props: { activeStep: 1, indicatorPosition: 'on-track' }
			});
			const flatHtml = elementHtml(flat.container);
			flat.unmount();

			const grouped = await render(StepperGroupProbe, {
				props: { activeStep: 1, indicatorPosition: 'on-track', grouped: true }
			});
			expect(elementHtml(grouped.container)).toBe(flatHtml);
		});

		// The connector's end segments are hidden by CSS keyed to the step's own
		// <li> position — assert the wiring: every step carries the same
		// hide-if-first/hide-if-last classes, so no step is singled out by
		// counting children.
		it('gives every grouped step the same structural connector classes', async () => {
			const screen = await render(StepperGroupProbe, {
				props: { activeStep: 1, indicatorPosition: 'on-track', grouped: true }
			});

			const items = screen.getByRole('listitem').elements();
			expect(items).toHaveLength(3);
			for (const item of items) {
				expect(item.querySelector('[class*="otSegHiddenIfFirst"]')).toBeInTheDocument();
				expect(item.querySelector('[class*="otSegHiddenIfLast"]')).toBeInTheDocument();
			}
		});

		it('keeps every grouped step keyboard-activatable', async () => {
			const handleClick = vi.fn();
			const screen = await render(StepperGroupProbe, {
				props: {
					activeStep: 2,
					indicatorPosition: 'on-track',
					grouped: true,
					onStepClick: handleClick
				}
			});

			(
				screen
					.getByRole('button', { name: 'Go to step 2: Shipping, completed', exact: true })
					.element() as HTMLElement
			).focus();
			await userEvent.keyboard('{Enter}');
			expect(handleClick).toHaveBeenCalledWith(1);
		});
	});

	// The connector fill animates a ::before scaled along the track axis, whose
	// motion a test neither renders nor times — so assert the wiring the
	// animation hangs off: every connector carries the shared track style (the
	// element that owns the fill layer and its transition), and the fill/empty
	// pair it gets is the one for its axis, since the wrong axis would scale the
	// line's thickness away instead of its length.
	describe('connector fill', () => {
		const barEl =
			(screen: { getByTestId: (id: string) => { element: () => Element } }) => (testId: string) =>
				screen
					.getByTestId(testId)
					.element()
					.querySelector('[class*="connectorTrack"]') as HTMLElement | null;

		it('scales the separated bar along the inline axis when horizontal', async () => {
			const screen = await render(StepperProbe, {
				props: {
					activeStep: 1,
					orientation: 'horizontal',
					steps: [
						{ step: 0, label: 'A', 'data-testid': 'a' },
						{ step: 1, label: 'B', 'data-testid': 'b' },
						{ step: 2, label: 'C', 'data-testid': 'c' }
					]
				}
			});
			const bar = barEl(screen);

			// Reached steps are filled, upcoming ones empty — both on the H pair.
			expect(bar('a')?.className).toContain('connectorFillH');
			expect(bar('b')?.className).toContain('connectorFillH');
			expect(bar('c')?.className).toContain('connectorEmptyH');
			expect(bar('c')?.className).not.toContain('connectorEmptyV');
		});

		it('scales the separated bar along the block axis when vertical', async () => {
			const screen = await render(StepperProbe, {
				props: {
					activeStep: 1,
					orientation: 'vertical',
					steps: [
						{ step: 0, label: 'A', 'data-testid': 'a' },
						{ step: 1, label: 'B', 'data-testid': 'b' },
						{ step: 2, label: 'C', 'data-testid': 'c' }
					]
				}
			});
			const bar = barEl(screen);

			expect(bar('a')?.className).toContain('connectorFillV');
			expect(bar('c')?.className).toContain('connectorEmptyV');
			expect(bar('c')?.className).not.toContain('connectorEmptyH');
		});

		it('gives every on-track segment the track style and its axis pair', async () => {
			const screen = await render(StepperProbe, {
				props: {
					activeStep: 1,
					indicatorPosition: 'on-track',
					steps: [
						{ step: 0, label: 'A', 'data-testid': 'a' },
						{ step: 1, label: 'B', 'data-testid': 'b' },
						{ step: 2, label: 'C', 'data-testid': 'c' }
					]
				}
			});

			// A step draws the segments flanking its own indicator, so each carries
			// the track style; none may fall back to the vertical axis pair here.
			for (const id of ['a', 'b', 'c']) {
				const segs = Array.from(
					screen.getByTestId(id).element().querySelectorAll('[class*="connectorTrack"]')
				);
				expect(segs).toHaveLength(2);
				for (const seg of segs) {
					expect(seg.className).toMatch(/connector(Fill|Empty)H/);
					expect(seg.className).not.toMatch(/connector(Fill|Empty)V/);
				}
			}
			// Progress splits at the current step: the segment arriving at it is
			// filled, the one leaving it is not.
			const current = Array.from(
				screen.getByTestId('b').element().querySelectorAll('[class*="connectorTrack"]')
			);
			expect(current[0].className).toContain('connectorFillH');
			expect(current[1].className).toContain('connectorEmptyH');
		});
	});

	// One change animates the connector: advancing a single step. Nothing here
	// runs a transition, so what is asserted is the schedule one would run on.
	// Every segment's slice is expressed in one unit — the node-to-node span —
	// so a slice reads as `{start, length}` in spans, a segment that lands at
	// once reads as a pair of zeros, and a span stitched from several segments
	// is contiguous when its slices abut in track order.
	describe('connector fill motion', () => {
		const separatedSteps = [
			{ step: 0, label: 'A', 'data-testid': 'a' },
			{ step: 1, label: 'B', 'data-testid': 'b' },
			{ step: 2, label: 'C', 'data-testid': 'c' },
			{ step: 3, label: 'D', 'data-testid': 'd' },
			{ step: 4, label: 'E', 'data-testid': 'e' }
		];

		const separated = (activeStep: number) => ({
			props: { activeStep, orientation: 'horizontal' as const, steps: separatedSteps }
		});

		// StyleX routes dynamic values through hashed custom properties, whose
		// names are not readable by hand. Recover the mapping from the one change
		// that animates — the only one where the two carry different values. The
		// probe mounts alongside whatever the calling test rendered, so it needs a
		// test id of its own to be found.
		let cachedVarNames: { duration: string; delay: string } | null = null;
		const timingVarNames = async (): Promise<{ duration: string; delay: string }> => {
			if (cachedVarNames) {
				return cachedVarNames;
			}
			const steps = [
				{ step: 0, label: 'A' },
				{ step: 1, label: 'B', 'data-testid': 'timing-probe' }
			];
			const probe = await render(StepperProbe, { props: { activeStep: 0, steps } });
			await probe.rerender({ activeStep: 1, steps });
			const el = probe
				.getByTestId('timing-probe')
				.element()
				.querySelector('[class*="connectorTiming"]') as HTMLElement;
			const found: Record<string, string> = {};
			for (const name of Array.from(el.style)) {
				const value = el.style.getPropertyValue(name).trim();
				if (value === 'var(--duration-medium)') {
					found.duration = name;
				} else if (value === '0s') {
					found.delay = name;
				}
			}
			probe.unmount();
			cachedVarNames = found as { duration: string; delay: string };
			return cachedVarNames;
		};

		/**
		 * A slice as a multiple of one span: `0s` is none of a span, a bare span
		 * expression is all of one, and `calc(<span> * n)` is n of them.
		 */
		const spans = (value: string): number => {
			if (value === '0s') {
				return 0;
			}
			const scaled = value.match(/\* ([\d.]+)\)$/);
			return scaled ? Number(scaled[1]) : 1;
		};

		/** Every connector in track order, as `{start, length}` in spans. */
		const schedule = async (el: Element) => {
			const names = await timingVarNames();
			return Array.from(el.querySelectorAll<HTMLElement>('[class*="connectorTiming"]')).map(
				(seg) => ({
					start: spans(seg.style.getPropertyValue(names.delay).trim()),
					length: spans(seg.style.getPropertyValue(names.duration).trim())
				})
			);
		};

		/** Nothing in this subtree moves over time. */
		const isInstant = async (el: Element) =>
			(await schedule(el)).every((slice) => slice.start === 0 && slice.length === 0);

		/** The span expression itself, which carries the fill's duration. */
		const spanExpression = async (el: Element) => {
			const names = await timingVarNames();
			const raw = (el.querySelector('[class*="connectorTiming"]') as HTMLElement).style
				.getPropertyValue(names.duration)
				.trim();
			return raw.replace(/^calc\((.*) \* [\d.]+\)$/, '$1');
		};

		/**
		 * The timing functions the fills in this subtree run on.
		 *
		 * Upstream reads this out of the injected stylesheet, scanning
		 * `sheet.cssRules` for a rule whose selector is one of the segment's atomic
		 * classes followed by `::before`. That scan is possible here but brittle in
		 * three ways upstream's environment cannot produce — this package compiles
		 * with `useCSSLayers`, so every rule sits inside a `CSSLayerBlockRule`; a
		 * `CSSStyleRule` carries nested rules of its own since CSS Nesting shipped;
		 * and a StyleX selector can be padded or scoped ahead of the class. Each of
		 * those fails *silently*, as an empty result indistinguishable from a
		 * missing declaration.
		 *
		 * A real browser answers the question directly instead: the computed style
		 * of the fill pseudo-element. That is a stronger assertion than upstream's,
		 * not a weaker one — it proves the declaration actually *applies* to the
		 * fill rather than merely existing somewhere in the sheet — and it is only
		 * available because this project runs Chromium where upstream runs jsdom,
		 * which computes nothing.
		 */
		const fillEasings = (el: Element): string[] => {
			const found = new Set<string>();
			for (const seg of Array.from(el.querySelectorAll<HTMLElement>('[class*="connectorTrack"]'))) {
				found.add(getComputedStyle(seg, '::before').transitionTimingFunction.trim());
			}
			return [...found];
		};

		it('animates the one span a single forward step crosses', async () => {
			const screen = await render(StepperProbe, separated(0));
			await screen.rerender(separated(1).props);

			// The bar arriving at the new step fills across the whole span.
			expect(await schedule(screen.getByTestId('b').element())).toEqual([{ start: 0, length: 1 }]);
			// Every other bar is untouched, so it is handed no timing that a later
			// change could inherit as a stale delay.
			for (const id of ['a', 'c', 'd', 'e']) {
				expect(await isInstant(screen.getByTestId(id).element())).toBe(true);
			}
		});

		it('fills that span over the medium duration', async () => {
			// A fill crossing a whole segment is a spatial change, not a
			// micro-interaction, so it sits above the fast band.
			const screen = await render(StepperProbe, separated(0));
			await screen.rerender(separated(1).props);

			expect(await spanExpression(screen.getByTestId('b').element())).toBe(
				'var(--duration-medium)'
			);
		});

		it('fills linearly so a stitched span reads as one front', async () => {
			// An on-track span is drawn by two segments, three where a content slot
			// splits it. A curve applied per segment restarts its deceleration at
			// every seam, and the seam becomes the most visible part of the result.
			const screen = await render(StepperProbe, separated(0));

			expect(fillEasings(screen.container)).toEqual(['linear']);
		});

		it('lands a forward jump of more than one step at once', async () => {
			// A jump is a navigation rather than a progression: sweeping a front
			// across the crossed segments makes the user sit out a journey they
			// asked to skip.
			const screen = await render(StepperProbe, separated(0));
			await screen.rerender(separated(3).props);

			for (const id of ['a', 'b', 'c', 'd', 'e']) {
				expect(await isInstant(screen.getByTestId(id).element())).toBe(true);
			}
		});

		it('lands a backward change at once, one step or several', async () => {
			// Retracting is the same arithmetic as filling, but it ends on a
			// shrinking stub of accent rather than a nearly-full bar, and a remnant
			// still on the track reads as unfinished however briefly it is there.
			for (const to of [2, 0]) {
				const view = await render(StepperProbe, separated(3));
				await view.rerender(separated(to).props);
				for (const id of ['a', 'b', 'c', 'd', 'e']) {
					expect(await isInstant(view.getByTestId(id).element())).toBe(true);
				}
				view.unmount();
			}
		});

		it('leaves every segment instant on mount', async () => {
			// A stepper opening mid-flow has no previous step to have travelled
			// from, so its completed segments must paint filled at once rather than
			// replaying the history that would have produced them.
			const screen = await render(StepperProbe, separated(3));

			for (const id of ['a', 'b', 'c', 'd', 'e']) {
				expect(await isInstant(screen.getByTestId(id).element())).toBe(true);
			}
		});

		const onTrackSteps = [
			{ step: 0, label: 'A', 'data-testid': 'a' },
			{ step: 1, label: 'B', 'data-testid': 'b' },
			{ step: 2, label: 'C', 'data-testid': 'c' }
		];

		const onTrack = (activeStep: number) => ({
			props: {
				activeStep,
				orientation: 'horizontal' as const,
				indicatorPosition: 'on-track' as const,
				steps: onTrackSteps
			}
		});

		it('runs the leaving half of an on-track span before the arriving half', async () => {
			const screen = await render(StepperProbe, onTrack(0));
			await screen.rerender(onTrack(1).props);

			// The span is drawn by two steps. Left alone both halves flip together
			// and the gap between two nodes reads as two dashes converging on the
			// space between them; split, the one leaving the near node runs first
			// and the pair reads as one stretch of track filling.
			const [aCap, aRail] = await schedule(screen.getByTestId('a').element());
			const [bCap, bRail] = await schedule(screen.getByTestId('b').element());
			expect(aRail).toEqual({ start: 0, length: 0.5 });
			expect(bCap).toEqual({ start: 0.5, length: 0.5 });
			// The segments either side of the span are not part of it.
			expect(aCap).toEqual({ start: 0, length: 0 });
			expect(bRail).toEqual({ start: 0, length: 0 });
			expect(await isInstant(screen.getByTestId('c').element())).toBe(true);
		});

		const verticalWithContentSteps = [
			{ step: 0, label: 'A', 'data-testid': 'a' },
			{ step: 1, label: 'B', 'data-testid': 'b', content: 'Do it' },
			{ step: 2, label: 'C', 'data-testid': 'c' }
		];

		const verticalWithContent = (activeStep: number) => ({
			props: {
				activeStep,
				orientation: 'vertical' as const,
				indicatorPosition: 'on-track' as const,
				steps: verticalWithContentSteps
			}
		});

		it('threads a content slot segment into its span between rail and cap', async () => {
			const screen = await render(StepperProbe, verticalWithContent(1));
			await screen.rerender(verticalWithContent(2).props);

			// A vertical step with content draws a third segment down the side of
			// the slot, so the span leaving it is stitched from three pieces and all
			// three have to fall in track order. The rail and cap are unequal
			// lengths, so the slices are unequal too.
			const [bCap, bRail, bContent] = await schedule(screen.getByTestId('b').element());
			const [cCap] = await schedule(screen.getByTestId('c').element());
			expect(bRail).toEqual({ start: 0, length: 0.175 });
			expect(bContent).toEqual({ start: 0.175, length: 0.525 });
			expect(cCap).toEqual({ start: 0.7, length: 0.3 });
			// The span arriving at this step belongs to the previous change.
			expect(bCap).toEqual({ start: 0, length: 0 });
			expect(await isInstant(screen.getByTestId('a').element())).toBe(true);
		});

		it('tracks the previous step correctly across successive advances', async () => {
			// Upstream renders this under `StrictMode`, whose double invocation
			// exists to catch a render that is not idempotent. Svelte has no such
			// mode; the `$derived` that tracks the previous step is idempotent for
			// the same reason upstream's state update is (a second evaluation for an
			// unchanged `activeStep` changes nothing). What the case actually
			// asserts survives unchanged: a second step measures from step 1, not
			// from the original mount, so the next span animates and the one behind
			// it stops.
			const screen = await render(StepperProbe, separated(0));
			await screen.rerender(separated(1).props);
			expect(await schedule(screen.getByTestId('b').element())).toEqual([{ start: 0, length: 1 }]);

			await screen.rerender(separated(2).props);
			expect(await schedule(screen.getByTestId('c').element())).toEqual([{ start: 0, length: 1 }]);
			expect(await isInstant(screen.getByTestId('b').element())).toBe(true);
		});
	});
});
