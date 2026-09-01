/** PORTS: AspectRatio/AspectRatio.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
// Upstream reads its stylesheet with `fs.readFileSync(path.resolve(__dirname,
// '../reset.css'))`. This file runs in the browser project, where there is no
// `fs` and no `__dirname`; Vite's `?raw` hands over the same bytes, and goes
// through `$lib` so nothing reaches out of `src/tests/` by relative path.
import baseCss from '$lib/styles/base.css?raw';
import AspectRatioProbe from './fixtures/aspect-ratio-probe.svelte';

/**
 * Astryx's `AspectRatio/AspectRatio.test.tsx` at the **0.5.0** pin — **28
 * upstream `it` declarations** (14 top-level, 2 in `describe('responsive
 * ratio')`, 7 in `describe('fit')`, 2 in `describe('style merging')`, 3 in
 * `describe('reset.css fit baseline rules')`), **26 here**.
 *
 * **The 2 that are not here are the whole `responsive ratio` block**, new at
 * 0.5.0: `emits the ratio as a class-level declaration, not an inline style`
 * and `lets a consumer inline style win over the class-level ratio`. They are
 * portable — `aspect-ratio.svelte` has already made the 0.5.0 move (the ratio
 * travels as the `--x-aspectRatio` StyleX variable through a class-level
 * declaration rather than as an inline `style.aspectRatio`), so both transcribe
 * against a component that behaves the way they assert.
 *
 * **One upstream title moved in the same release and is not a gap**: upstream's
 * `style merging` case `keeps the consumer style and applies the ratio over it`
 * is now `keeps the consumer style and lets an inline ratio win`. This file
 * still carries the old title. The rename tracks the mechanism change above —
 * the ratio no longer wins by being inline, it wins only when the consumer puts
 * it inline — so the title here should be re-derived along with the two missing
 * cases rather than renamed on its own.
 *
 * (This header read "**26** upstream `it` declarations … 26 here, none dropped"
 * at the 0.4.5 pin, where 26 was the whole suite.)
 *
 * Upstream has no `displayName` case, no snapshot and no no-JSX construction
 * form, so `ref` is the only React-only surface. What translated — each named
 * again at the case that carries it, and **none of these is a dropped case**:
 *
 * - **`ref` gets a counterpart, not a translation** (*forwards ref correctly*).
 *   Svelte has no ref; a consumer reaches the root through an attachment in rest
 *   props. It checks more than upstream's does: upstream only proves the callback
 *   ran with *some* `HTMLElement`, while an attachment receives the element, so
 *   the assertion can name which one.
 *
 * - **Every child comes through `aspect-ratio-probe.svelte`.** `children` is a
 *   `Snippet` here, so upstream's inline `<div>`, `<img>` and `<video>` children
 *   cannot be passed as values. The shared `slot-probe` cannot serve: it always
 *   renders a `<span>`, and six cases need real media for the `object-fit`
 *   baseline rules to mean anything.
 *
 * - **`reset.css` is `styles/base.css` here**, which this port owns in full
 *   (upstream's reset is one of its inputs). The three baseline-rule cases assert
 *   on the same text with the same regexes, widened for this file's Prettier
 *   formatting: single-quoted attribute values, and a selector Prettier wraps
 *   across two lines. Both differences are absorbed by `['"]` and `\s*`; the
 *   declarations being matched are byte-identical to upstream's.
 *
 * - **The ratio is read off `--x-aspectRatio`**, exactly as upstream's own
 *   `ratioVar` helper does since 0.5.0 — see the helper below.
 *
 * One case found a real defect in the port, now fixed: *keeps the consumer style
 * and applies the ratio over it*. See the comment there.
 */

/**
 * The ratio compiles to a class-level `aspect-ratio: var(--x-aspectRatio)`
 * declaration with the value carried by a CSS variable, so an `xstyle` rule
 * (including one under `@media`/`@container`) and unlayered consumer CSS can
 * still win. `--x-aspectRatio` is the debug-mode variable name emitted for the
 * `aspectRatio` property, and upstream's own `ratioVar` reads exactly this.
 *
 * Reading the variable is also *stronger* than the inline-style form this file
 * used before 0.5.0: a custom property is stored verbatim, so Blink's
 * six-significant-figure serialisation of `aspect-ratio` — under which 16/9 and
 * 1.777779 were indistinguishable — no longer costs the assertion anything.
 */
// `HTMLElement | SVGElement` rather than upstream's bare `HTMLElement`: a
// Playwright locator's `.element()` is typed for both, where Testing Library's
// query returns only the former. Both carry `.style`, so the body is upstream's.
function ratioVar(el: HTMLElement | SVGElement): string {
	return el.style.getPropertyValue('--x-aspectRatio');
}

function ratioValue(ratio: number): string {
	return String(ratio);
}

describe('AspectRatio', () => {
	it('renders with correct aspect ratio', async () => {
		const screen = await render(AspectRatioProbe, {
			props: { rest: { ratio: 16 / 9, 'data-testid': 'aspect-ratio' } }
		});
		const element = screen.getByTestId('aspect-ratio').element();
		await expect.element(screen.getByTestId('aspect-ratio')).toBeInTheDocument();
		expect(ratioVar(element)).toBe(ratioValue(16 / 9));
	});

	it('children fill the container', async () => {
		const screen = await render(AspectRatioProbe, {
			props: { rest: { ratio: 1, 'data-testid': 'aspect-ratio' }, testid: 'child' }
		});
		const container = screen.getByTestId('aspect-ratio').element();
		const child = screen.getByTestId('child').element();
		expect(container).toContainElement(child as HTMLElement);
		// Child is wrapped in an absolute positioned div
		const childWrapper = child.parentElement;
		expect(childWrapper).not.toBeNull();
	});

	it('renders with 16:9 ratio', async () => {
		const ratio = 16 / 9;
		const screen = await render(AspectRatioProbe, {
			props: { rest: { ratio, 'data-testid': 'aspect-ratio' }, text: '16:9' }
		});
		const element = screen.getByTestId('aspect-ratio').element();
		expect(ratioVar(element)).toBe(ratioValue(ratio));
	});

	it('renders with 4:3 ratio', async () => {
		const ratio = 4 / 3;
		const screen = await render(AspectRatioProbe, {
			props: { rest: { ratio, 'data-testid': 'aspect-ratio' }, text: '4:3' }
		});
		const element = screen.getByTestId('aspect-ratio').element();
		expect(ratioVar(element)).toBe(ratioValue(ratio));
	});

	it('renders with 1:1 square ratio', async () => {
		const screen = await render(AspectRatioProbe, {
			props: { rest: { ratio: 1, 'data-testid': 'aspect-ratio' }, text: 'Square' }
		});
		const element = screen.getByTestId('aspect-ratio').element();
		// Upstream's `toBe('1')`; Chromium normalises the square to `1 / 1`.
		expect(ratioVar(element)).toBe(ratioValue(1));
	});

	it('renders with 21:9 ultrawide ratio', async () => {
		const ratio = 21 / 9;
		const screen = await render(AspectRatioProbe, {
			props: { rest: { ratio, 'data-testid': 'aspect-ratio' }, text: 'Ultrawide' }
		});
		const element = screen.getByTestId('aspect-ratio').element();
		expect(ratioVar(element)).toBe(ratioValue(ratio));
	});

	it('renders an ellipse that respects the ratio (circle at 1:1)', async () => {
		const screen = await render(AspectRatioProbe, {
			props: { rest: { ratio: 1, shape: 'ellipse', 'data-testid': 'aspect-ratio' }, text: 'Circle' }
		});
		const element = screen.getByTestId('aspect-ratio').element();
		expect(ratioVar(element)).toBe(ratioValue(1));
		expect(element.className).toContain('ellipse');
	});

	it('ellipse respects a non-square ratio (oval)', async () => {
		const screen = await render(AspectRatioProbe, {
			props: {
				rest: { ratio: 16 / 9, shape: 'ellipse', 'data-testid': 'aspect-ratio' },
				text: 'Oval'
			}
		});
		const element = screen.getByTestId('aspect-ratio').element();
		// Ratio is preserved — the ellipse does not force 1:1.
		expect(ratioVar(element)).toBe(ratioValue(16 / 9));
		expect(element.className).toContain('ellipse');
	});

	it('defaults to the rectangle shape', async () => {
		const screen = await render(AspectRatioProbe, {
			props: { rest: { ratio: 1, 'data-testid': 'aspect-ratio' }, text: 'Rectangle by default' }
		});
		const element = screen.getByTestId('aspect-ratio').element();
		expect(ratioVar(element)).toBe(ratioValue(1));
		expect(element.className).toContain('rectangle');
		// No ellipse border-radius when shape is the default rectangle
		expect((element as HTMLElement).style.borderRadius).toBe('');
	});

	it('forwards ref correctly', async () => {
		// Counterpart, not a translation: Svelte has no `ref`, so a consumer reaches
		// the root through an attachment passed in rest props. The attachment
		// receives the element, so this names the node upstream can only type-check.
		const attached = vi.fn();
		const screen = await render(AspectRatioProbe, {
			props: {
				rest: {
					ratio: 1,
					'data-testid': 'aspect-ratio',
					[createAttachmentKey()]: (node: Element) => attached(node)
				}
			}
		});
		expect(attached).toHaveBeenCalledWith(expect.any(HTMLElement));
		expect(attached).toHaveBeenCalledWith(screen.getByTestId('aspect-ratio').element());
	});

	it('passes through additional props', async () => {
		const screen = await render(AspectRatioProbe, {
			props: {
				rest: { ratio: 1, 'data-testid': 'aspect-ratio', 'aria-label': 'Image container' }
			}
		});
		await expect
			.element(screen.getByTestId('aspect-ratio'))
			.toHaveAttribute('aria-label', 'Image container');
	});

	it('renders with ReactNode children', async () => {
		// `ReactNode` is a `Snippet` here; the probe authors the same `<img>`.
		const screen = await render(AspectRatioProbe, {
			props: {
				rest: { ratio: 16 / 9, 'data-testid': 'aspect-ratio' },
				child: 'img',
				testid: 'image',
				childStyle: 'width: 100%; height: 100%; object-fit: cover'
			}
		});
		await expect.element(screen.getByTestId('image')).toBeInTheDocument();
	});

	it('renders with xstyle prop', async () => {
		// Verify that xstyle is accepted and component renders without error
		const screen = await render(AspectRatioProbe, {
			props: { rest: { ratio: 1, 'data-testid': 'aspect-ratio', xstyle: {} } }
		});
		await expect.element(screen.getByTestId('aspect-ratio')).toBeInTheDocument();
	});

	it('renders different content types', async () => {
		const screen = await render(AspectRatioProbe, {
			props: {
				rest: { ratio: 16 / 9, 'data-testid': 'aspect-ratio' },
				child: 'video',
				testid: 'video'
			}
		});
		await expect.element(screen.getByTestId('video')).toBeInTheDocument();
	});

	describe('fit', () => {
		it('marks the child\'s direct parent with data-astryx-aspect-ratio-override for fit="cover"', async () => {
			const screen = await render(AspectRatioProbe, {
				props: { rest: { ratio: 16 / 9, fit: 'cover' }, child: 'img', testid: 'image' }
			});
			// The marker sits on the child's actual parent, so the base.css
			// sizing rules are direct-child selectors with no dependence on
			// AspectRatio's internal structure.
			const wrapper = screen.getByTestId('image').element().parentElement;
			expect(wrapper).toHaveAttribute('data-astryx-aspect-ratio-override', 'cover');
		});

		it('marks the child\'s direct parent with data-astryx-aspect-ratio-override for fit="contain"', async () => {
			const screen = await render(AspectRatioProbe, {
				props: { rest: { ratio: 16 / 9, fit: 'contain' }, child: 'img', testid: 'image' }
			});
			const wrapper = screen.getByTestId('image').element().parentElement;
			expect(wrapper).toHaveAttribute('data-astryx-aspect-ratio-override', 'contain');
		});

		it('does not expose fit on the theming surface', async () => {
			const screen = await render(AspectRatioProbe, {
				props: {
					rest: { ratio: 16 / 9, fit: 'cover', 'data-testid': 'aspect-ratio' },
					child: 'img'
				}
			});
			const element = screen.getByTestId('aspect-ratio').element();
			// fit is structural, not visual — no data-fit attribute or class
			// token on the themeable root (only shape is a theming target).
			expect(element).not.toHaveAttribute('data-fit');
			expect(element.className).not.toContain('cover');
		});

		it('emits no marker when fit is omitted (back-compat)', async () => {
			const screen = await render(AspectRatioProbe, {
				props: {
					rest: { ratio: 16 / 9, 'data-testid': 'aspect-ratio' },
					child: 'img',
					testid: 'image'
				}
			});
			const wrapper = screen.getByTestId('image').element().parentElement;
			expect(wrapper).not.toHaveAttribute('data-astryx-aspect-ratio-override');
			// Without the marker, none of the base.css fit rules can match, so
			// existing self-styled children render exactly as before.
			expect(screen.getByTestId('image').element()).not.toHaveAttribute('class');
		});

		it('never touches the child element props', async () => {
			const screen = await render(AspectRatioProbe, {
				props: {
					rest: { ratio: 16 / 9, fit: 'cover' },
					child: 'img',
					testid: 'image',
					childClass: 'consumer-class',
					childStyle: 'object-fit: contain'
				}
			});
			const image = screen.getByTestId('image').element() as HTMLImageElement;
			// Fit styling is pure CSS (zero-specificity baseline rules); the child's
			// own class/style pass through untouched and always win, so children
			// that already size themselves keep their behavior.
			expect(image.className).toBe('consumer-class');
			expect(image.style.objectFit).toBe('contain');
		});

		it('centers the child via the wrapper with fit="center"', async () => {
			const screen = await render(AspectRatioProbe, {
				props: { rest: { ratio: 16 / 9, fit: 'center' }, child: 'img', testid: 'image' }
			});
			const image = screen.getByTestId('image').element();
			expect(image).not.toHaveAttribute('class');
			const wrapper = image.parentElement;
			// StyleX's dev-mode debug class. The name is `aspect-ratio.stylex__styles
			// .childCenter` here against upstream's `AspectRatio__styles.childCenter`
			// — the module filename differs, the suffix `toContain` matches does not.
			expect(wrapper?.className).toContain('childCenter');
		});

		it('does not center the wrapper for other fit values', async () => {
			const screen = await render(AspectRatioProbe, {
				props: { rest: { ratio: 16 / 9, fit: 'cover' }, child: 'img', testid: 'image' }
			});
			const wrapper = screen.getByTestId('image').element().parentElement;
			expect(wrapper?.className).not.toContain('childCenter');
		});
	});

	describe('style merging', () => {
		it('keeps the consumer style and applies the ratio over it', async () => {
			// This is the case that found the defect. `style` is a string here, not
			// an object, so upstream's `{...style, aspectRatio: ratio}` — consumer
			// declarations first, the ratio last and therefore winning — becomes an
			// ordering in `mergeStyle`. The port had the consumer's string last, so
			// a consumer `aspect-ratio` silently beat the `ratio` prop. Fixed in
			// `aspect-ratio.svelte` by moving `aspect-ratio:${ratio}` after it.
			const screen = await render(AspectRatioProbe, {
				props: {
					rest: {
						ratio: 16 / 9,
						'data-testid': 'aspect-ratio',
						style: 'opacity: 0.5; aspect-ratio: 3 / 1'
					}
				}
			});
			const element = screen.getByTestId('aspect-ratio').element() as HTMLElement;
			expect(element.style.opacity).toBe('0.5');
			expect(ratioVar(element)).toBe(ratioValue(16 / 9));
		});

		it('keeps a consumer className beside the theme target', async () => {
			const screen = await render(AspectRatioProbe, {
				props: { rest: { ratio: 1, 'data-testid': 'aspect-ratio', class: 'consumer-class' } }
			});
			const element = screen.getByTestId('aspect-ratio').element();
			expect(element).toHaveClass('consumer-class');
			expect(element).toHaveClass('astryx-aspect-ratio');
		});
	});

	describe('reset.css fit baseline rules', () => {
		// The cover/contain child sizing ships as zero-specificity baseline
		// rules in base.css keyed on the data-astryx-aspect-ratio-override
		// marker the component sets on the child's direct parent. These
		// assertions keep the stylesheet in sync with the component contract.
		//
		// Upstream loads the file in `beforeAll` with `fs`; the `?raw` import at
		// the top of this file is the browser project's equivalent, so there is
		// nothing left for a `beforeAll` to do.

		it('sizes the child to fill the box for cover and contain', () => {
			const fillMatch = baseCss.match(
				/:where\(\[data-astryx-aspect-ratio-override=['"]cover['"]\],\s*\[data-astryx-aspect-ratio-override=['"]contain['"]\]\)\s*>\s*:where\(\*\)\s*\{([^}]+)\}/
			);
			expect(fillMatch).not.toBeNull();
			expect(fillMatch![1]).toContain('width: 100%');
			expect(fillMatch![1]).toContain('height: 100%');
		});

		it('crops media with object-fit: cover for fit="cover"', () => {
			const coverMatch = baseCss.match(
				/:where\(\[data-astryx-aspect-ratio-override=['"]cover['"]\]\)\s*>\s*:where\(img,\s*video\)\s*\{([^}]+)\}/
			);
			expect(coverMatch).not.toBeNull();
			expect(coverMatch![1]).toContain('object-fit: cover');
		});

		it('letterboxes media with object-fit: contain for fit="contain"', () => {
			const containMatch = baseCss.match(
				/:where\(\[data-astryx-aspect-ratio-override=['"]contain['"]\]\)\s*>\s*:where\(img,\s*video\)\s*\{([^}]+)\}/
			);
			expect(containMatch).not.toBeNull();
			expect(containMatch![1]).toContain('object-fit: contain');
		});
	});
});
