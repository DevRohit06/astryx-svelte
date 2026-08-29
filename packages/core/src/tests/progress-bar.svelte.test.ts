import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import ProgressBar from '$lib/components/progress-bar/progress-bar.svelte';

/**
 * Ported from Astryx's `ProgressBar/ProgressBar.test.tsx` at the 0.5.0 pin.
 *
 * **Upstream 54 cases, 54 here.** No case is dropped; the count is the contract.
 * Re-derived at the 0.5.0 pin (the header last stated it at v0.4.5); upstream's
 * file has not moved since, so 54 is still what it declares.
 * The suite is a late addition — `ProgressBar` landed before the case-for-case
 * discipline, and `marks` is what finally brought it. Nine cases arrived with
 * 0.4.1's mark work (#4970/#4741): eight for the on-fill/on-track colour split
 * and its `data-placement`/`data-variant` reflection, one for the derived vars
 * the tick's `width`/`height` now read.
 *
 * Four translations, all following patterns earlier suites set:
 *
 * - **`forwards ref to outer container`** becomes an attachment travelling in
 *   the rest props, which `ProgressBar` spreads onto its root — Svelte has no
 *   `ref` (the `Button`/`AppShell` counterpart).
 * - **`rerender` maps straight across**; `vitest-browser-svelte`'s is async and
 *   merges props rather than replacing them.
 * - **Upstream's `beforeAll` preload of the lazy tooltip chunk is kept.** Our
 *   `{#await import(…)}` is the `lazy()` + `Suspense` counterpart, and the same
 *   reason applies: preloading makes the tooltip's `aria-describedby` attach on
 *   the next microtask instead of racing a cold module fetch. Note the barrel
 *   import in `setup-stylex.ts` does *not* pull this module in — it is reachable
 *   only through that dynamic import, which is the point of the split.
 * - **The two cases that compare two bars side by side unmount the first before
 *   rendering the second**, having captured its classes. Upstream keeps both
 *   `container`s live because Testing Library scopes each to its own; the
 *   `DropdownMenu` parity suite settled this shape here.
 *
 * Two assertions are **scoped tighter than upstream's**, not loosened. Upstream
 * greps the whole injected stylesheet for `translate(-50%, -50%)`; here
 * `setup-stylex.ts` injects the *repo-wide* sheet, so an unscoped grep would
 * pass on any other component's centring rule. Those cases therefore look for
 * the declaration on a rule targeting the mark's own atomic classes.
 */

// A labelled mark wraps the tick in a lazily-loaded tooltip. Preload that chunk
// once so the tooltip (and its aria-describedby) attaches on the microtask after
// first render, keeping these tests deterministic rather than racing the
// dynamic import.
beforeAll(async () => {
	await import('$lib/components/progress-bar/progress-bar-mark-tooltip.svelte');
});

const MARK = '.astryx-progressbar-mark';

/**
 * The StyleX atomic classes on an element, without the stable `astryx-*` theme
 * classes and the bare variant/placement tokens — so a comparison reflects the
 * resolved styles, not the reflected props. Upstream's helper.
 */
function styleClasses(el: HTMLElement): string {
	return Array.from(el.classList)
		.filter((c) => /^x[a-z0-9]+$/.test(c))
		.sort()
		.join(' ');
}

/** Every CSS rule the page has, however it was injected. Upstream's helper. */
function injectedCss(): string {
	let out = '';
	for (const sheet of Array.from(document.styleSheets)) {
		try {
			for (const rule of Array.from(sheet.cssRules)) {
				out += rule.cssText + '\n';
			}
		} catch {
			// ignore cross-origin sheets
		}
	}
	out += Array.from(document.querySelectorAll('style'))
		.map((s) => s.textContent || '')
		.join('\n');
	return out;
}

/** Whether any rule targeting one of `element`'s classes makes `declaration`. */
function hasDeclarationFor(element: Element, declaration: RegExp): boolean {
	const css = injectedCss();
	return Array.from(element.classList).some((cls) =>
		new RegExp(`\\.${cls}\\b[^{]*\\{[^}]*${declaration.source}`, 'i').test(css)
	);
}

const progressbarIn = (container: HTMLElement): HTMLElement =>
	container.querySelector('[role="progressbar"]') as HTMLElement;

describe('ProgressBar', () => {
	it('renders with default props', async () => {
		const screen = await render(ProgressBar, { props: { value: 50, label: 'Progress' } });
		const progressbar = screen.getByRole('progressbar');
		await expect.element(progressbar).toBeInTheDocument();
		await expect.element(progressbar).toHaveAttribute('aria-valuenow', '50');
		await expect.element(progressbar).toHaveAttribute('aria-valuemin', '0');
		await expect.element(progressbar).toHaveAttribute('aria-valuemax', '100');
	});

	it('uses role="progressbar" (not "meter") for determinate progress', async () => {
		// A determinate ProgressBar conveys task completion, so it must be a
		// progressbar (announced on update), not a meter (a static gauge).
		const screen = await render(ProgressBar, { props: { value: 50, label: 'Progress' } });
		await expect.element(screen.getByRole('progressbar')).toBeInTheDocument();
		expect(screen.container.querySelector('[role="meter"]')).toBeNull();
	});

	it('renders visible label by default', async () => {
		const screen = await render(ProgressBar, { props: { value: 50, label: 'Storage used' } });
		await expect.element(screen.getByText('Storage used', { exact: true })).toBeInTheDocument();
	});

	it('hides label visually when isLabelHidden is true', async () => {
		const screen = await render(ProgressBar, {
			props: { value: 50, label: 'Hidden label', isLabelHidden: true }
		});
		expect(screen.container.textContent).toContain('Hidden label');
		await expect.element(screen.getByRole('progressbar')).toHaveAttribute('aria-labelledby');
	});

	it('shows value label when hasValueLabel is true', async () => {
		const screen = await render(ProgressBar, {
			props: { value: 75, label: 'Upload', hasValueLabel: true }
		});
		await expect.element(screen.getByText('75%', { exact: true })).toBeInTheDocument();
	});

	it('uses custom formatValueLabel', async () => {
		const screen = await render(ProgressBar, {
			props: {
				value: 3,
				max: 5,
				label: 'Disk',
				hasValueLabel: true,
				formatValueLabel: (v: number, m: number) => `${v} GB / ${m} GB`
			}
		});
		await expect.element(screen.getByText('3 GB / 5 GB', { exact: true })).toBeInTheDocument();
		await expect
			.element(screen.getByRole('progressbar'))
			.toHaveAttribute('aria-valuetext', '3 GB / 5 GB');
	});

	it('sets aria-valuetext from formatValueLabel', async () => {
		const screen = await render(ProgressBar, { props: { value: 50, label: 'Progress' } });
		await expect.element(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '50%');
	});

	it('respects custom max', async () => {
		const screen = await render(ProgressBar, { props: { value: 3, max: 10, label: 'Steps' } });
		const progressbar = screen.getByRole('progressbar');
		await expect.element(progressbar).toHaveAttribute('aria-valuenow', '3');
		await expect.element(progressbar).toHaveAttribute('aria-valuemax', '10');
	});

	it('clamps value to [0, max]', async () => {
		const screen = await render(ProgressBar, { props: { value: 150, max: 100, label: 'Over' } });
		await expect.element(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

		await screen.rerender({ value: -10, max: 100, label: 'Under' });
		await expect.element(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
	});

	it('forwards ref to outer container', async () => {
		// Counterpart to upstream's `ref`: an attachment in the rest props, which
		// `ProgressBar` spreads onto its root element.
		let node: Element | undefined;
		const screen = await render(ProgressBar, {
			props: {
				value: 50,
				label: 'Test',
				[createAttachmentKey()]: (element: Element) => {
					node = element;
				}
			}
		});
		expect(node).toBeInstanceOf(HTMLDivElement);
		expect(node).toBe(screen.container.firstElementChild);
	});

	it('passes data-testid', async () => {
		const screen = await render(ProgressBar, {
			props: { value: 50, label: 'Test', 'data-testid': 'my-progress' }
		});
		await expect.element(screen.getByTestId('my-progress')).toBeInTheDocument();
	});

	it('renders with all variant options', async () => {
		const variants = ['accent', 'success', 'warning', 'error', 'neutral'] as const;
		for (const variant of variants) {
			const screen = await render(ProgressBar, { props: { value: 50, label: variant, variant } });
			await expect.element(screen.getByRole('progressbar')).toBeInTheDocument();
			screen.unmount();
		}
	});

	it('renders at fixed 8px track height', async () => {
		const screen = await render(ProgressBar, { props: { value: 50, label: 'Progress' } });
		await expect.element(screen.getByRole('progressbar')).toBeInTheDocument();
	});

	it('shows value label with hidden label', async () => {
		const screen = await render(ProgressBar, {
			props: { value: 60, label: 'Hidden', isLabelHidden: true, hasValueLabel: true }
		});
		await expect.element(screen.getByText('60%', { exact: true })).toBeInTheDocument();
		expect(screen.container.textContent).toContain('Hidden');
	});

	it('renders no visible value label when isLabelHidden without hasValueLabel', async () => {
		// Mirrors the intended "accessible label only" composition: the text label
		// is kept for assistive tech (visually hidden) while no extra visible value
		// label is surfaced.
		const screen = await render(ProgressBar, {
			props: { value: 42, label: 'Context usage', isLabelHidden: true }
		});
		expect(screen.container.textContent).not.toContain('42%');
		const label = screen.getByText('Context usage', { exact: true }).element();
		expect(label).toBeInTheDocument();
		await expect
			.element(screen.getByRole('progressbar'))
			.toHaveAttribute('aria-labelledby', label.id);
	});

	it('handles zero max gracefully', async () => {
		const screen = await render(ProgressBar, { props: { value: 0, max: 0, label: 'Empty' } });
		const progressbar = screen.getByRole('progressbar');
		await expect.element(progressbar).toHaveAttribute('aria-valuenow', '0');
		await expect.element(progressbar).toHaveAttribute('aria-valuemax', '0');
	});

	it('treats a NaN value as empty progress instead of leaking "NaN"', async () => {
		// e.g. an upstream `loaded / total * 100` where total is still 0.
		const screen = await render(ProgressBar, {
			props: { value: NaN, label: 'Upload', hasValueLabel: true }
		});
		const progressbar = progressbarIn(screen.container);
		expect(progressbar).toHaveAttribute('aria-valuenow', '0');
		expect(progressbar.getAttribute('aria-valuetext')).toBe('0%');
		expect(screen.container.textContent).not.toContain('NaN');
		// The fill width must be a real percentage, not "NaN%".
		const fill = progressbar.firstElementChild as HTMLElement;
		expect(fill.style.width).toBe('0%');
	});

	it('treats a NaN max as an empty range instead of leaking "NaN"', async () => {
		const screen = await render(ProgressBar, {
			props: { value: 5, max: NaN, label: 'Steps', hasValueLabel: true }
		});
		const progressbar = progressbarIn(screen.container);
		expect(progressbar).toHaveAttribute('aria-valuenow', '0');
		expect(progressbar).toHaveAttribute('aria-valuemax', '0');
		expect(screen.container.textContent).not.toContain('NaN');
	});

	it('does not render NaN in the value label when max is zero', async () => {
		const screen = await render(ProgressBar, {
			props: { value: 0, max: 0, label: 'Empty', hasValueLabel: true }
		});
		expect(screen.container.textContent).not.toMatch(/NaN|Infinity/);
		const progressbar = progressbarIn(screen.container);
		expect(progressbar.getAttribute('aria-valuetext') ?? '').not.toMatch(/NaN|Infinity/);
		await expect.element(screen.getByText('0%', { exact: true })).toBeInTheDocument();
	});

	// Disabled state
	describe('disabled state', () => {
		it('renders with isDisabled', async () => {
			const screen = await render(ProgressBar, {
				props: { value: 50, label: 'Canceled', isDisabled: true, hasValueLabel: true }
			});
			await expect.element(screen.getByRole('progressbar')).toBeInTheDocument();
			await expect.element(screen.getByText('50%', { exact: true })).toBeInTheDocument();
		});

		it('still renders label when disabled', async () => {
			const screen = await render(ProgressBar, {
				props: { value: 50, label: 'Canceled upload', isDisabled: true }
			});
			await expect
				.element(screen.getByText('Canceled upload', { exact: true }))
				.toBeInTheDocument();
		});
	});

	// Indeterminate mode
	describe('indeterminate mode', () => {
		it('renders with role="progressbar" when isIndeterminate', async () => {
			const screen = await render(ProgressBar, {
				props: { isIndeterminate: true, label: 'Loading' }
			});
			await expect.element(screen.getByRole('progressbar')).toBeInTheDocument();
		});

		it('does not set aria-valuenow/min/max when indeterminate', async () => {
			const screen = await render(ProgressBar, {
				props: { isIndeterminate: true, label: 'Loading' }
			});
			const progressbar = progressbarIn(screen.container);
			expect(progressbar).not.toHaveAttribute('aria-valuenow');
			expect(progressbar).not.toHaveAttribute('aria-valuemin');
			expect(progressbar).not.toHaveAttribute('aria-valuemax');
			expect(progressbar).not.toHaveAttribute('aria-valuetext');
		});

		it('still renders label when indeterminate', async () => {
			const screen = await render(ProgressBar, {
				props: { isIndeterminate: true, label: 'Processing' }
			});
			await expect.element(screen.getByText('Processing', { exact: true })).toBeInTheDocument();
		});

		it('hides value label when indeterminate even if hasValueLabel is true', async () => {
			const screen = await render(ProgressBar, {
				props: { isIndeterminate: true, label: 'Loading', value: 50, hasValueLabel: true }
			});
			expect(screen.container.textContent).not.toContain('50%');
		});

		it('is labelled via aria-labelledby when indeterminate', async () => {
			const screen = await render(ProgressBar, {
				props: { isIndeterminate: true, label: 'Loading data' }
			});
			await expect.element(screen.getByRole('progressbar')).toHaveAttribute('aria-labelledby');
		});

		it('renders with all variants in indeterminate mode', async () => {
			const variants = ['accent', 'success', 'warning', 'error', 'neutral'] as const;
			for (const variant of variants) {
				const screen = await render(ProgressBar, {
					props: { isIndeterminate: true, label: variant, variant }
				});
				await expect.element(screen.getByRole('progressbar')).toBeInTheDocument();
				screen.unmount();
			}
		});

		it('drives a direction-aware indeterminate slide (mirrored keyframe under RTL)', async () => {
			// StyleX injects the keyframes + the atomic rule that swaps the
			// animation-name under `[dir="rtl"]`. Scan the injected CSS so the RTL
			// branch can be asserted without driving a real animation.
			const screen = await render(ProgressBar, {
				props: { isIndeterminate: true, label: 'Loading' }
			});
			await expect.element(screen.getByRole('progressbar')).toBeInTheDocument();
			const css = injectedCss();
			// LTR keyframe slides physically left → right (−100% → 250%).
			expect(css).toMatch(/translateX\(-100%\)/);
			expect(css).toMatch(/translateX\(250%\)/);
			// RTL keyframe mirrors it (100% → −250%) so the bar travels along the
			// reading flow (inline-start → inline-end, i.e. right → left).
			expect(css).toMatch(/translateX\(100%\)/);
			expect(css).toMatch(/translateX\(-250%\)/);
			// The animation-name is swapped specifically under `[dir="rtl"]`.
			expect(css).toMatch(/:is\(\[dir="rtl"\][^)]*\)[^{]*\{\s*animation-name:/);
		});
	});

	// Target marks
	describe('target marks', () => {
		it('renders no mark elements when marks is omitted', async () => {
			const screen = await render(ProgressBar, { props: { value: 50, label: 'Progress' } });
			expect(screen.container.querySelectorAll(MARK)).toHaveLength(0);
		});

		it('renders no mark elements for an empty marks array', async () => {
			const screen = await render(ProgressBar, {
				props: { value: 50, label: 'Progress', marks: [] }
			});
			expect(screen.container.querySelectorAll(MARK)).toHaveLength(0);
		});

		it('renders a mark at the position matching its value', async () => {
			const screen = await render(ProgressBar, {
				props: { value: 40, label: 'Progress', marks: [{ value: 80, label: 'M' }] }
			});
			const marks = screen.container.querySelectorAll<HTMLElement>(MARK);
			expect(marks).toHaveLength(1);
			// value 80 of max 100 -> 80% along the track (RTL-safe logical property).
			expect(marks[0].style.insetInlineStart).toBe('80%');
		});

		it('positions marks relative to a custom max', async () => {
			const screen = await render(ProgressBar, {
				props: { value: 1, max: 5, label: 'Steps', marks: [{ value: 4, label: 'M' }] }
			});
			const marks = screen.container.querySelectorAll<HTMLElement>(MARK);
			// value 4 of max 5 -> 80%.
			expect(marks[0].style.insetInlineStart).toBe('80%');
		});

		it('keeps a mark past the current value visible', async () => {
			// A mark beyond the fill still renders — it layers above the fill.
			const screen = await render(ProgressBar, {
				props: { value: 20, label: 'Progress', marks: [{ value: 90, label: 'M' }] }
			});
			const marks = screen.container.querySelectorAll<HTMLElement>(MARK);
			expect(marks).toHaveLength(1);
			expect(marks[0].style.insetInlineStart).toBe('90%');
		});

		it('renders multiple marks', async () => {
			const screen = await render(ProgressBar, {
				props: {
					value: 50,
					label: 'Progress',
					marks: [
						{ value: 25, label: 'M' },
						{ value: 50, label: 'M' },
						{ value: 80, label: 'M' }
					]
				}
			});
			expect(screen.container.querySelectorAll(MARK)).toHaveLength(3);
		});

		it('clamps out-of-range mark positions to the track edges', async () => {
			const screen = await render(ProgressBar, {
				props: {
					value: 50,
					label: 'Progress',
					marks: [
						{ value: -10, label: 'M' },
						{ value: 150, label: 'M' }
					]
				}
			});
			const marks = screen.container.querySelectorAll<HTMLElement>(MARK);
			expect(marks).toHaveLength(2);
			expect(marks[0].style.insetInlineStart).toBe('0%');
			expect(marks[1].style.insetInlineStart).toBe('100%');
		});

		it('drops non-finite mark values', async () => {
			const screen = await render(ProgressBar, {
				props: {
					value: 50,
					label: 'Progress',
					marks: [
						{ value: NaN, label: 'M' },
						{ value: Infinity, label: 'M' },
						{ value: 60, label: 'M' }
					]
				}
			});
			const marks = screen.container.querySelectorAll<HTMLElement>(MARK);
			expect(marks).toHaveLength(1);
			expect(marks[0].style.insetInlineStart).toBe('60%');
		});

		it('does not render marks in indeterminate mode', async () => {
			const screen = await render(ProgressBar, {
				props: {
					isIndeterminate: true,
					label: 'Loading',
					marks: [{ value: 80, label: 'M' }]
				}
			});
			expect(screen.container.querySelectorAll(MARK)).toHaveLength(0);
		});

		// Mark colour follows what the mark sits on: inside the filled area it takes
		// the fill variant's on-colour, out on the bare track it takes the primary
		// text colour. The choice is reflected as `data-placement` (plus
		// `data-variant`, mirroring the fill) so themes can target it and tests can
		// assert it without reading atomic class names.
		it('marks the ticks inside the filled area as placed on the fill', async () => {
			const screen = await render(ProgressBar, {
				props: {
					value: 60,
					label: 'Progress',
					marks: [
						{ value: 25, label: 'Behind' },
						{ value: 90, label: 'Ahead' }
					]
				}
			});
			const marks = screen.container.querySelectorAll<HTMLElement>(MARK);
			expect(marks[0]).toHaveAttribute('data-placement', 'fill');
			expect(marks[1]).toHaveAttribute('data-placement', 'track');
			// Different placements resolve to different colour styles.
			expect(styleClasses(marks[0])).not.toBe(styleClasses(marks[1]));
		});

		it('treats a mark exactly at the current value as on the fill', async () => {
			const screen = await render(ProgressBar, {
				props: { value: 70, label: 'Progress', marks: [{ value: 70, label: 'Goal' }] }
			});
			expect(screen.container.querySelector(MARK)).toHaveAttribute('data-placement', 'fill');
		});

		it('places every mark on the track at zero progress', async () => {
			// With no fill drawn, even a mark at 0 sits on the bare track.
			const screen = await render(ProgressBar, {
				props: {
					value: 0,
					label: 'Progress',
					marks: [
						{ value: 0, label: 'Start' },
						{ value: 50, label: 'Goal' }
					]
				}
			});
			const marks = screen.container.querySelectorAll<HTMLElement>(MARK);
			expect(marks[0]).toHaveAttribute('data-placement', 'track');
			expect(marks[1]).toHaveAttribute('data-placement', 'track');
			expect(styleClasses(marks[0])).toBe(styleClasses(marks[1]));
		});

		it('mirrors the fill variant on marks so the on-color matches the bar', async () => {
			const screen = await render(ProgressBar, {
				props: {
					value: 80,
					variant: 'warning',
					label: 'Budget used',
					marks: [
						{ value: 50, label: 'Half' },
						{ value: 95, label: 'Cap' }
					]
				}
			});
			const marks = screen.container.querySelectorAll<HTMLElement>(MARK);
			expect(marks[0]).toHaveAttribute('data-variant', 'warning');
			expect(marks[0]).toHaveAttribute('data-placement', 'fill');
			expect(marks[1]).toHaveAttribute('data-variant', 'warning');
			expect(marks[1]).toHaveAttribute('data-placement', 'track');
		});

		it('uses the disabled variant for marks when the bar is disabled', async () => {
			const screen = await render(ProgressBar, {
				props: {
					value: 80,
					variant: 'error',
					isDisabled: true,
					label: 'Canceled',
					marks: [{ value: 50, label: 'Half' }]
				}
			});
			expect(screen.container.querySelector(MARK)).toHaveAttribute('data-variant', 'disabled');
		});

		it('keeps one plain foreground on both sides for neutral and disabled bars', async () => {
			// The neutral/disabled fill is the muted grey — it carries no semantic
			// weight and has no on-token, so a mark on it takes the same plain
			// foreground it would have out on the track.
			for (const props of [{ variant: 'neutral' } as const, { isDisabled: true } as const]) {
				const screen = await render(ProgressBar, {
					props: {
						value: 60,
						label: 'Progress',
						...props,
						marks: [
							{ value: 20, label: 'On fill' },
							{ value: 90, label: 'On track' }
						]
					}
				});
				const marks = screen.container.querySelectorAll<HTMLElement>(MARK);
				expect(marks[0]).toHaveAttribute('data-placement', 'fill');
				expect(marks[1]).toHaveAttribute('data-placement', 'track');
				expect(styleClasses(marks[0])).toBe(styleClasses(marks[1]));
				screen.unmount();
			}
		});

		it("dims a disabled bar's marks below a live one's", async () => {
			// A disabled bar is deliberately low-emphasis (its label and value text
			// drop to muted colours), so its marks step down to the secondary
			// foreground on both sides rather than shouting over the greyed-out bar.
			// A live neutral bar — same muted grey fill — keeps the full-contrast
			// primary foreground.
			const MARKS = [
				{ value: 20, label: 'On fill' },
				{ value: 90, label: 'On track' }
			];
			const liveScreen = await render(ProgressBar, {
				props: { value: 60, variant: 'neutral', label: 'A', marks: MARKS }
			});
			const live = Array.from(liveScreen.container.querySelectorAll<HTMLElement>(MARK)).map(
				styleClasses
			);
			liveScreen.unmount();

			const offScreen = await render(ProgressBar, {
				props: { value: 60, isDisabled: true, label: 'B', marks: MARKS }
			});
			const off = Array.from(offScreen.container.querySelectorAll<HTMLElement>(MARK)).map(
				styleClasses
			);

			expect(off[0]).not.toBe(live[0]);
			expect(off[1]).not.toBe(live[1]);
		});

		it('recolors marks per variant when they sit on the fill', async () => {
			// Two bars at the same progress with different variants give their
			// on-fill marks different colours (different atomic classes), while their
			// on-track marks stay the same foreground colour.
			const MARKS = [
				{ value: 20, label: 'On fill' },
				{ value: 90, label: 'On track' }
			];
			const accentScreen = await render(ProgressBar, {
				props: { value: 60, variant: 'accent', label: 'A', marks: MARKS }
			});
			const accent = Array.from(accentScreen.container.querySelectorAll<HTMLElement>(MARK)).map(
				styleClasses
			);
			accentScreen.unmount();

			const errorScreen = await render(ProgressBar, {
				props: { value: 60, variant: 'error', label: 'B', marks: MARKS }
			});
			const error = Array.from(errorScreen.container.querySelectorAll<HTMLElement>(MARK)).map(
				styleClasses
			);

			expect(accent[0]).not.toBe(error[0]);
			expect(accent[1]).toBe(error[1]);
		});

		it('renders every mark as a focusable trigger (label is required, never decorative)', async () => {
			const screen = await render(ProgressBar, {
				props: { value: 50, label: 'Progress', marks: [{ value: 80, label: 'Goal' }] }
			});
			const mark = screen.container.querySelector<HTMLElement>(MARK) as HTMLElement;
			// A mark always stands for something meaningful, so it is never
			// aria-hidden and is always keyboard-focusable to reveal its label.
			expect(mark).not.toHaveAttribute('aria-hidden');
			expect(mark).toHaveAttribute('tabindex', '0');
			// The name comes from the tooltip (aria-describedby), not a role/label on
			// the tick itself, so the progressbar's own subtree stays clean.
			expect(mark).not.toHaveAttribute('role');
			expect(mark).not.toHaveAttribute('aria-label');
		});

		it('reveals a labeled mark via a focusable Tooltip trigger', async () => {
			const screen = await render(ProgressBar, {
				props: { value: 50, label: 'Progress', marks: [{ value: 80, label: 'Goal' }] }
			});
			// Focusable so keyboard users can reveal the label; named via the
			// tooltip's aria-describedby rather than a labelled child of the bar.
			// The tooltip loads lazily, so re-query the live element and wait for it
			// to attach aria-describedby.
			const mark0 = screen.container.querySelector<HTMLElement>(MARK) as HTMLElement;
			expect(mark0).toHaveAttribute('tabindex', '0');
			expect(mark0).not.toHaveAttribute('aria-hidden');
			await vi.waitFor(() => {
				expect(screen.container.querySelector(MARK)).toHaveAttribute('aria-describedby');
			});
			const mark = screen.container.querySelector<HTMLElement>(MARK) as HTMLElement;
			const tip = document.getElementById(mark.getAttribute('aria-describedby') as string);
			expect(tip).toHaveTextContent('Goal');
		});

		it('keeps the progressbar element free of role="img"/aria-label children', async () => {
			// Marks are children of role="progressbar" (unchanged DOM), but a mark
			// uses a tooltip (aria-describedby) rather than a role="img"+aria-label
			// child, so nothing muddies what SRs announce for the bar.
			const screen = await render(ProgressBar, {
				props: { value: 50, label: 'Progress', marks: [{ value: 80, label: 'Goal' }] }
			});
			const progressbar = progressbarIn(screen.container);
			// Mark is a child of the progressbar (DOM unchanged from before `marks`).
			expect(progressbar.querySelector(MARK)).not.toBeNull();
			// But it is not a labelled graphic that pollutes the a11y subtree.
			expect(progressbar.querySelector('[role="img"]')).toBeNull();
			expect(progressbar.querySelector('[aria-label]')).toBeNull();
			expect(screen.container.querySelectorAll(MARK)).toHaveLength(1);
		});

		it('does not add mark info to the progressbar aria-valuetext', async () => {
			const screen = await render(ProgressBar, {
				props: { value: 50, label: 'Progress', marks: [{ value: 80, label: 'Goal' }] }
			});
			const progressbar = progressbarIn(screen.container);
			expect(progressbar.getAttribute('aria-valuetext')).toBe('50%');
		});

		it('renders marks as children of the progressbar (unchanged DOM)', async () => {
			// Marks stay children of role="progressbar", after the fill — the same
			// shape as before `marks`. The fill remains the first child.
			const screen = await render(ProgressBar, {
				props: { value: 50, label: 'Progress', marks: [{ value: 80, label: 'M' }] }
			});
			const progressbar = progressbarIn(screen.container);
			const fill = progressbar.firstElementChild as HTMLElement;
			expect(fill.style.width).toBe('50%');
			expect(fill.classList.contains('astryx-progressbar-mark')).toBe(false);
			const mark = screen.container.querySelector<HTMLElement>(MARK) as HTMLElement;
			expect(mark.closest('[role="progressbar"]')).toBe(progressbar);
			expect(screen.container.querySelectorAll(MARK)).toHaveLength(1);
		});

		it('does not clip marks in determinate mode (track carries no overflow:hidden)', async () => {
			// In determinate mode the track must NOT clip, so a themed taller mark
			// can overhang the bar. (Indeterminate mode re-adds the clip — covered
			// separately — but marks are suppressed there, so nothing overhangs.)
			const screen = await render(ProgressBar, {
				props: { value: 50, label: 'Progress', marks: [{ value: 80, label: 'M' }] }
			});
			const progressbar = progressbarIn(screen.container);
			// Sanity-check the bar still rendered with a StyleX class.
			expect(Array.from(progressbar.classList).find((c) => c.startsWith('x'))).toBeDefined();
			// StyleX atomic classes are unique per declaration, so "no rule targeting
			// one of the track's classes sets overflow:hidden" is exactly "the track
			// does not clip".
			expect(hasDeclarationFor(progressbar, /overflow:\s*hidden/)).toBe(false);
		});

		it('clips the track in indeterminate mode (the sliding fill must not escape)', async () => {
			// Regression: the indeterminate fill slides from translateX -100% to
			// 250%, deliberately overshooting the track, and relies on the track
			// clipping it to the visible window. Determinate mode drops the clip so
			// marks can overhang — indeterminate mode must keep it.
			const screen = await render(ProgressBar, {
				props: { isIndeterminate: true, label: 'Loading' }
			});
			const progressbar = progressbarIn(screen.container);
			expect(hasDeclarationFor(progressbar, /overflow:\s*hidden/)).toBe(true);
		});

		it('sizes the mark through the derived vars, so a theme override cannot lose the cascade', async () => {
			// width/height are declared as `var(--_progressbar-mark-*)` and nothing
			// else declares those vars, so the value a theme sets on the
			// `progressbar-mark` target lands even in a consumer whose StyleX is
			// unlayered and would otherwise outrank `@layer astryx-theme`.
			const screen = await render(ProgressBar, {
				props: { value: 50, label: 'Progress', marks: [{ value: 80, label: 'M' }] }
			});
			const mark = screen.container.querySelector<HTMLElement>(MARK) as HTMLElement;
			expect(hasDeclarationFor(mark, /width:\s*var\(--_progressbar-mark-width,\s*2px\)/)).toBe(
				true
			);
			expect(hasDeclarationFor(mark, /height:\s*var\(--_progressbar-mark-height,\s*8px\)/)).toBe(
				true
			);
		});

		it('renders the mark on the stable progressbar-mark target, centered for symmetric overhang', async () => {
			// The mark's width/height/color are directly overridable via the
			// `progressbar-mark` theme target. It is centred on the track
			// (translate -50%,-50%) so a themed taller tick overhangs the bar
			// symmetrically above and below without being clipped.
			const screen = await render(ProgressBar, {
				props: { value: 50, label: 'Progress', marks: [{ value: 80, label: 'M' }] }
			});
			const mark = screen.container.querySelector<HTMLElement>(MARK) as HTMLElement;
			expect(mark.className).toContain('astryx-progressbar-mark');
			// Scoped to the mark's own atomic classes: the injected sheet is
			// repo-wide, so upstream's unscoped grep would pass on any component's
			// centring rule.
			expect(hasDeclarationFor(mark, /transform:\s*translate\(-50%,\s*-50%\)/)).toBe(true);
			expect(screen.container.querySelectorAll(MARK)).toHaveLength(1);
		});
	});
});
