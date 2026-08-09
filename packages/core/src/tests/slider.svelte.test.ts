import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Slider from '$lib/components/slider/slider.svelte';
import SliderForm from './fixtures/slider-form.svelte';

/**
 * Astryx's `Slider/Slider.test.tsx`, ported case for case — 32 upstream cases
 * (21 top-level, 8 `disabledMessage`, 3 `form participation`), 32 here. Nothing
 * dropped, nothing added. Upstream has no `displayName` case and no `ref` case,
 * so there is nothing here that is structurally unportable.
 *
 * Three environment differences, each noted again at the case that meets it:
 *
 * **Upstream's global `beforeEach` (`:19-48`) is dropped whole.** It shims
 * `showPopover`/`hidePopover` — jsdom implements neither — reflecting the open
 * state as an invented `popover-open` *attribute* the assertions then read, and
 * overrides `HTMLElement.prototype.matches` to answer `:popover-open` and
 * `:focus-visible`. Chromium gives all three for real: the open state is read
 * with `matches(':popover-open')`, and a thumb focused by Tab genuinely is
 * `:focus-visible`, which is the gate `useTooltip`'s `focusin` handler reads.
 * Same drop `dropdown-menu` and `checkbox-input` already recorded.
 *
 * **Real pointer input replaces `fireEvent.pointerDown` (cases 12, 17, 18, 19).**
 * Upstream dispatches a synthetic `PointerEvent` carrying `pointerId: 1`, which
 * jsdom is happy to accept; in Chromium `setPointerCapture(1)` throws
 * `NotFoundError` when no live pointer has that id. The interaction is therefore
 * delivered through vitest-browser's real pointer, which also exercises capture,
 * hit-testing and focus for real. The component's
 * `typeof target.setPointerCapture === 'function'` guard is upstream's and is
 * left exactly as it is — it is not what makes this work.
 *
 * **Upstream's `getBoundingClientRect` stubs (cases 12, 17, 18) are not carried
 * over, because upstream never reads them.** All three leave `valueDisplay` at
 * its `'tooltip'` default, so each thumb is wrapped in `Tooltip`'s
 * `display: contents` div (upstream renders that wrapper too) and
 * `slider.parentElement` is the wrapper, not the track container the stub was
 * meant for. The faked rect is installed on a node the component never measures,
 * and the three assertions pass for reasons unrelated to geometry: case 12 is a
 * disabled early-return, case 17 counts `onChangeEnd` calls, case 18 checks
 * focus. Nothing in the suite needs a faked rect, so none is installed; the
 * cases click the real track container at a real offset instead. `trackOf`
 * below is the helper that reaches the container upstream meant to reach.
 */

/** Every thumb, in document order — upstream's `getAllByRole('slider')`. */
function thumbsIn(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[role="slider"]'));
}

/** The single thumb — upstream's `getByRole('slider')`. */
function thumbIn(container: HTMLElement): HTMLElement {
	const [thumb] = thumbsIn(container);
	if (!thumb) {
		throw new Error('expected a slider thumb');
	}
	return thumb;
}

/**
 * Upstream's `getTrack()` — the pointer-handling track container.
 *
 * `getByRole('slider').parentElement` only lands on it when `valueDisplay` is
 * `"none"` (all eight `disabledMessage` cases); with the `'tooltip'` default the
 * literal parent is `Tooltip`'s `display: contents` wrapper. Climbing until the
 * ancestor holds the two decorative track divs as direct children finds the
 * container in both shapes, without depending on the stylesheet.
 */
function trackOf(thumb: HTMLElement): HTMLElement {
	let el: HTMLElement | null = thumb.parentElement;
	while (el != null && el.querySelector(':scope > [aria-hidden="true"]') == null) {
		el = el.parentElement;
	}
	if (el == null) {
		throw new Error('expected a slider track container');
	}
	return el;
}

/** The tooltip layer, present (but closed) whenever a reason renders. */
function tooltipIn(container: HTMLElement): HTMLElement | null {
	const el = container.querySelector('[role="tooltip"]');
	return el instanceof HTMLElement ? el : null;
}

/**
 * Playwright's `locator.click` options reach the provider verbatim, but vitest
 * types `UserEventClickOptions` as an empty interface, so the one option these
 * cases need — a click offset, standing in for upstream's `clientX`/`clientY` —
 * has to be asserted through.
 */
interface ClickAtOptions {
	position: { x: number; y: number };
}

function clickAt(element: Element, x: number, y: number): Promise<void> {
	return userEvent.click(element, { position: { x, y } } as ClickAtOptions);
}

describe('Slider', () => {
	// --- Aria labels ---

	it('single thumb takes its accessible name from the label', async () => {
		const screen = await render(Slider, { props: { label: 'Volume', value: 50 } });
		await expect.element(screen.getByRole('slider')).toHaveAccessibleName('Volume');
	});

	it('range thumbs have individual names composing with the group label', async () => {
		const screen = await render(Slider, {
			props: { label: 'Price range', value: [20, 80] as [number, number] }
		});
		const sliders = screen.getByRole('slider').elements();
		expect(sliders[0]).toHaveAccessibleName('Minimum value');
		expect(sliders[1]).toHaveAccessibleName('Maximum value');
	});

	it('sets aria-valuetext with formatValue', async () => {
		const screen = await render(Slider, {
			props: { label: 'Temperature', value: 72, formatValue: (v: number) => `${v}°F` }
		});
		const slider = thumbIn(screen.container);
		expect(slider).toHaveAttribute('aria-valuetext', '72°F');
	});

	it('uses custom min and max', async () => {
		const screen = await render(Slider, {
			props: { label: 'Temperature', value: 72, min: 60, max: 90 }
		});
		const slider = thumbIn(screen.container);
		expect(slider).toHaveAttribute('aria-valuemin', '60');
		expect(slider).toHaveAttribute('aria-valuemax', '90');
		expect(slider).toHaveAttribute('aria-valuenow', '72');
	});

	it('range mode sets correct aria values on both thumbs', async () => {
		const screen = await render(Slider, {
			props: { label: 'Range', value: [25, 75] as [number, number], min: 0, max: 100 }
		});
		const sliders = thumbsIn(screen.container);
		expect(sliders[0]).toHaveAttribute('aria-valuenow', '25');
		expect(sliders[1]).toHaveAttribute('aria-valuenow', '75');
		// Per the APG multi-thumb pattern, each thumb's bounds are constrained by
		// its sibling: the lower thumb can't exceed the upper thumb's value and
		// the upper thumb can't go below the lower thumb's value.
		expect(sliders[0]).toHaveAttribute('aria-valuemin', '0');
		expect(sliders[0]).toHaveAttribute('aria-valuemax', '75');
		expect(sliders[1]).toHaveAttribute('aria-valuemin', '25');
		expect(sliders[1]).toHaveAttribute('aria-valuemax', '100');
	});

	it('sets aria-orientation for vertical', async () => {
		const screen = await render(Slider, {
			props: { label: 'Volume', value: 50, orientation: 'vertical' }
		});
		const slider = thumbIn(screen.container);
		expect(slider).toHaveAttribute('aria-orientation', 'vertical');
	});

	it('sets aria-invalid when status type is error', async () => {
		const screen = await render(Slider, {
			props: { label: 'Volume', value: 50, status: { type: 'error', message: 'Value too high' } }
		});
		const slider = thumbIn(screen.container);
		expect(slider).toHaveAttribute('aria-invalid', 'true');
	});

	it('associates description via aria-describedby', async () => {
		const screen = await render(Slider, {
			props: { label: 'Volume', value: 50, description: 'Adjust the volume level' }
		});
		const slider = thumbIn(screen.container);
		const describedby = slider.getAttribute('aria-describedby');
		expect(describedby).toBeTruthy();
		const descEl = document.getElementById(describedby!.split(' ')[0]);
		expect(descEl).toHaveTextContent('Adjust the volume level');
	});

	it('associates status message via aria-describedby', async () => {
		const screen = await render(Slider, {
			props: {
				label: 'Volume',
				value: 50,
				description: 'Adjust the volume level',
				status: { type: 'error', message: 'Too loud' }
			}
		});
		const slider = thumbIn(screen.container);
		const describedby = slider.getAttribute('aria-describedby');
		expect(describedby).toBeTruthy();
		// Should have at least two IDs (description + status message)
		const ids = describedby!.split(' ');
		expect(ids.length).toBeGreaterThanOrEqual(2);
	});

	it('decorative track elements have aria-hidden', async () => {
		const screen = await render(Slider, { props: { label: 'Volume', value: 50 } });
		const ariaHidden = screen.container.querySelectorAll('[aria-hidden="true"]');
		expect(ariaHidden.length).toBeGreaterThanOrEqual(2);
	});

	// --- Disabled guards ---

	it('disables thumbs when isDisabled is true', async () => {
		const screen = await render(Slider, {
			props: { label: 'Volume', value: 50, isDisabled: true }
		});
		const slider = thumbIn(screen.container);
		expect(slider).toHaveAttribute('aria-disabled', 'true');
		expect(slider).toHaveAttribute('tabindex', '-1');
	});

	it('does not fire onChange on pointer down when disabled', async () => {
		const handleChange = vi.fn();
		const screen = await render(Slider, {
			props: {
				label: 'Volume',
				value: 50,
				min: 0,
				max: 100,
				onChange: handleChange,
				isDisabled: true
			}
		});
		const slider = thumbIn(screen.container);
		const trackContainer = trackOf(slider);

		// Real pointer input, and no faked rect — see the file header for both.
		// Upstream's `clientX: 100, clientY: 10` becomes an offset into the real
		// track container, which the disabled guard returns before ever measuring.
		await clickAt(trackContainer, 100, 10);

		expect(handleChange).not.toHaveBeenCalled();
	});

	it('does not fire onChange on keyboard when disabled', async () => {
		const handleChange = vi.fn();
		const screen = await render(Slider, {
			props: { label: 'Volume', value: 50, onChange: handleChange, isDisabled: true }
		});
		const slider = thumbIn(screen.container);
		slider.focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(handleChange).not.toHaveBeenCalled();
	});

	// --- onChangeEnd on keyboard ---

	it('fires onChangeEnd on keyboard ArrowRight', async () => {
		const handleChange = vi.fn();
		const handleChangeEnd = vi.fn();
		const screen = await render(Slider, {
			props: {
				label: 'Volume',
				value: 50,
				step: 5,
				onChange: handleChange,
				onChangeEnd: handleChangeEnd
			}
		});
		const slider = thumbIn(screen.container);
		// Upstream's `act(() => slider.focus())` needs no `act`: a `$state` write
		// flushes on its own.
		slider.focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(handleChange).toHaveBeenCalledWith(55);
		expect(handleChangeEnd).toHaveBeenCalledWith(55);
	});

	it('fires onChangeEnd on keyboard Home/End with correct value', async () => {
		const handleChangeEnd = vi.fn();
		const screen = await render(Slider, {
			props: {
				label: 'Volume',
				value: 50,
				min: 0,
				max: 100,
				onChange: vi.fn(),
				onChangeEnd: handleChangeEnd
			}
		});
		const slider = thumbIn(screen.container);
		slider.focus();
		await userEvent.keyboard('{Home}');
		expect(handleChangeEnd).toHaveBeenCalledWith(0);
	});

	it('fires onChangeEnd with correct value for range mode on keyboard', async () => {
		const handleChangeEnd = vi.fn();
		const screen = await render(Slider, {
			props: {
				label: 'Range',
				value: [20, 80] as [number, number],
				min: 0,
				max: 100,
				step: 5,
				onChange: vi.fn(),
				onChangeEnd: handleChangeEnd
			}
		});
		const sliders = thumbsIn(screen.container);
		sliders[0].focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(handleChangeEnd).toHaveBeenCalledWith([25, 80]);
	});

	// --- Pointer handling ---

	it('fires onChangeEnd on pointer up after pointer down', async () => {
		const handleChange = vi.fn();
		const handleChangeEnd = vi.fn();
		const screen = await render(Slider, {
			props: {
				label: 'Volume',
				value: 50,
				min: 0,
				max: 100,
				onChange: handleChange,
				onChangeEnd: handleChangeEnd
			}
		});
		const slider = thumbIn(screen.container);
		const trackContainer = trackOf(slider);

		// A real click is upstream's `pointerDown` + `pointerUp` pair, delivered by
		// the browser — which also exercises the pointer capture the synthetic
		// `pointerId: 1` could not (see the file header).
		await clickAt(trackContainer, 100, 10);

		expect(handleChangeEnd).toHaveBeenCalledTimes(1);
	});

	it('focuses closest thumb on track click', async () => {
		const screen = await render(Slider, {
			props: { label: 'Volume', value: 50, min: 0, max: 100, onChange: vi.fn() }
		});
		const slider = thumbIn(screen.container);
		const trackContainer = trackOf(slider);

		await clickAt(trackContainer, 100, 10);

		expect(document.activeElement).toBe(slider);
	});

	// --- Mark label click snapping ---

	it('clicking a mark label snaps to that mark value, not pointer position', async () => {
		const handleChange = vi.fn();
		const screen = await render(Slider, {
			props: {
				label: 'Volume',
				value: 50,
				min: 0,
				max: 100,
				onChange: handleChange,
				marks: [{ value: 100, label: '100' }]
			}
		});
		const markLabel = screen.container.querySelector('[data-testid="slider-mark-label"]')!;

		// Simulate a click on the left edge of the "100" label — pointer X would
		// map to ~99 if calculated from position, but should snap to 100.
		// Upstream's `clientX: 1` is an absolute viewport coordinate that happens
		// to be the label's left edge only because its rect was never stubbed;
		// here it is the same left edge, expressed as an offset into the label.
		await clickAt(markLabel, 1, 5);

		expect(handleChange).toHaveBeenCalledWith(100);
	});

	// --- Boundary clamping ---

	it('clamps value at max boundary', async () => {
		const handleChange = vi.fn();
		const screen = await render(Slider, {
			props: { label: 'Volume', value: 99, min: 0, max: 100, step: 5, onChange: handleChange }
		});
		const slider = thumbIn(screen.container);
		slider.focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(handleChange).toHaveBeenCalledWith(100);
	});

	it('clamps value at min boundary', async () => {
		const handleChange = vi.fn();
		const screen = await render(Slider, {
			props: { label: 'Volume', value: 1, min: 0, max: 100, step: 5, onChange: handleChange }
		});
		const slider = thumbIn(screen.container);
		slider.focus();
		await userEvent.keyboard('{ArrowLeft}');
		expect(handleChange).toHaveBeenCalledWith(0);
	});

	describe('disabledMessage', () => {
		// Upstream's `h = {hidden: true}` (a closed popover is invisible to jsdom's
		// a11y tree) has no counterpart: these cases reach the layer through the
		// container, since a closed popover is genuinely `display: none` here.
		//
		// Every case passes `valueDisplay="none"`, so there is exactly one tooltip
		// in the tree and `getByRole('slider').parentElement` genuinely is the
		// track container.

		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await render(Slider, {
				props: {
					label: 'Volume',
					value: 50,
					valueDisplay: 'none',
					isDisabled: true,
					disabledMessage: 'Volume is locked while sharing your screen'
				}
			});
			const tooltip = tooltipIn(screen.container)!;
			expect(tooltip).toHaveTextContent('Volume is locked while sharing your screen');
			const track = trackOf(thumbIn(screen.container));
			// Dispatched at the track, exactly as upstream's `fireEvent.mouseEnter`
			// is — the real open state is then read off the real popover.
			track.dispatchEvent(new MouseEvent('mouseenter'));
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
			track.dispatchEvent(new MouseEvent('mouseleave'));
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(false);
			});
		});

		it('shows the reason tooltip on keyboard focus', async () => {
			const screen = await render(Slider, {
				props: {
					label: 'Volume',
					value: 50,
					valueDisplay: 'none',
					isDisabled: true,
					disabledMessage: 'Volume is locked while sharing your screen'
				}
			});
			const tooltip = tooltipIn(screen.container)!;
			await userEvent.tab();
			expect(thumbIn(screen.container)).toHaveFocus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(Slider, {
				props: {
					label: 'Volume',
					value: 50,
					valueDisplay: 'none',
					disabledMessage: 'Volume is locked while sharing your screen'
				}
			});
			expect(tooltipIn(screen.container)).toBeNull();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(Slider, {
				props: { label: 'Volume', value: 50, valueDisplay: 'none', isDisabled: true }
			});
			expect(tooltipIn(screen.container)).toBeNull();
		});

		it('keeps the thumb focusable via aria-disabled when a reason is provided', async () => {
			const screen = await render(Slider, {
				props: {
					label: 'Volume',
					value: 50,
					valueDisplay: 'none',
					isDisabled: true,
					disabledMessage: 'Volume is locked while sharing your screen'
				}
			});
			const thumb = thumbIn(screen.container);
			expect(thumb).toHaveAttribute('aria-disabled', 'true');
			expect(thumb).toHaveAttribute('tabindex', '0');
		});

		it('links the reason tooltip via aria-describedby', async () => {
			const screen = await render(Slider, {
				props: {
					label: 'Volume',
					value: 50,
					valueDisplay: 'none',
					isDisabled: true,
					disabledMessage: 'Volume is locked while sharing your screen'
				}
			});
			const thumb = thumbIn(screen.container);
			const tooltip = tooltipIn(screen.container)!;
			expect(thumb.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks value changes while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(Slider, {
				props: {
					label: 'Volume',
					value: 50,
					valueDisplay: 'none',
					onChange,
					isDisabled: true,
					disabledMessage: 'Volume is locked while sharing your screen'
				}
			});
			const thumb = thumbIn(screen.container);
			thumb.focus();
			await userEvent.keyboard('{ArrowRight}');
			expect(onChange).not.toHaveBeenCalled();
		});

		it('remains non-focusable when disabled without a reason', async () => {
			const screen = await render(Slider, {
				props: { label: 'Volume', value: 50, valueDisplay: 'none', isDisabled: true }
			});
			expect(thumbIn(screen.container)).toHaveAttribute('tabindex', '-1');
		});
	});

	describe('form participation', () => {
		it('submits the value under htmlName', async () => {
			const screen = await render(SliderForm, {
				props: { slider: { label: 'Volume', htmlName: 'volume', value: 50 } }
			});
			const data = new FormData(screen.container.querySelector('form')!);
			expect(data.get('volume')).toBe('50');
		});

		it('submits both range values under the same name', async () => {
			const screen = await render(SliderForm, {
				props: {
					slider: { label: 'Price', htmlName: 'price', value: [20, 80] as [number, number] }
				}
			});
			const data = new FormData(screen.container.querySelector('form')!);
			expect(data.getAll('price')).toEqual(['20', '80']);
		});

		it('is excluded from form data when disabled', async () => {
			const screen = await render(SliderForm, {
				props: {
					slider: { label: 'Volume', htmlName: 'volume', value: 50, isDisabled: true }
				}
			});
			expect([...new FormData(screen.container.querySelector('form')!).keys()]).toEqual([]);
		});
	});
});
