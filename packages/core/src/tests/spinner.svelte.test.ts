import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Spinner from '$lib/components/spinner/spinner.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';
import SpinnerMany from './fixtures/spinner-many.svelte';

/**
 * Ported from Astryx's `Spinner/Spinner.test.tsx`, all 24 `it` blocks (21 plain
 * plus three `it.each` tables) at the 0.5.0 pin, across its two describe blocks.
 * Nothing is dropped.
 *
 * The suite is a late addition: `Spinner` was one of the first components
 * ported, before the case-for-case discipline, and its `label` prop was missed
 * with it — the styles module had `wrapper` all along with nothing rendering it.
 * The prop is now restored and this suite pins it.
 *
 * `label={<span/>}` becomes the shared `slot-probe` (a snippet), and
 * `renders as an inline element (span)` reads the *unlabelled* root, which is
 * where upstream's `data-testid` lands too — with a label the testid moves to
 * the wrapper `<div>`, exactly as upstream routes it.
 *
 * `Spinner ring` is new at upstream 0.5.0, where the canvas ring became two SVG
 * `<circle>`s: the geometry is assertable from attributes now, and the colours
 * come off the cascade, so nothing reads a computed style to paint. Two of its
 * cases are **restated** rather than translated, each marked at the case, and
 * both for the same reason — upstream's environment is jsdom, which implements
 * no Web Animations, while this project's is real Chromium, which does.
 *
 * Runs in the **client** (real Chromium) project: the ring is real layout, and
 * `expect.element` retrying stands in for upstream's `waitFor`.
 */

/** sm/md/lg/xl, as `spinner.stylex.ts` defines them. */
const SIZES = {
	sm: { diameter: 10, border: 2 },
	md: { diameter: 14, border: 3 },
	lg: { diameter: 18, border: 3 },
	xl: { diameter: 28, border: 4 }
} as const;

/**
 * Upstream's `ring`/`circles` helpers read back through `screen.getByTestId`;
 * here `screen` is per-render, so they take the resolved root element instead.
 */
const ringOf = (root: Element): SVGSVGElement => root.querySelector('svg') as SVGSVGElement;

const circlesOf = (root: Element): { track: SVGCircleElement; arc: SVGCircleElement } => {
	const [track, arc] = [...ringOf(root).querySelectorAll('circle')];
	return { track, arc };
};

const dashOf = (el: SVGCircleElement): number[] =>
	(el.getAttribute('stroke-dasharray') ?? '').split(/[\s,]+/).map(Number);

describe('Spinner', () => {
	it('renders with default props', async () => {
		const screen = await render(Spinner, { props: { 'data-testid': 'spinner' } });
		await expect.element(screen.getByTestId('spinner')).toBeInTheDocument();
	});

	it('renders with size sm', async () => {
		const screen = await render(Spinner, { props: { size: 'sm', 'data-testid': 'spinner' } });
		await expect.element(screen.getByTestId('spinner')).toBeInTheDocument();
	});

	it('renders with size md', async () => {
		const screen = await render(Spinner, { props: { size: 'md', 'data-testid': 'spinner' } });
		await expect.element(screen.getByTestId('spinner')).toBeInTheDocument();
	});

	it('renders with size lg', async () => {
		const screen = await render(Spinner, { props: { size: 'lg', 'data-testid': 'spinner' } });
		await expect.element(screen.getByTestId('spinner')).toBeInTheDocument();
	});

	it('renders with shade default', async () => {
		const screen = await render(Spinner, {
			props: { shade: 'default', 'data-testid': 'spinner' }
		});
		await expect.element(screen.getByTestId('spinner')).toBeInTheDocument();
	});

	it('renders with shade onMedia', async () => {
		const screen = await render(Spinner, {
			props: { shade: 'onMedia', 'data-testid': 'spinner' }
		});
		await expect.element(screen.getByTestId('spinner')).toBeInTheDocument();
	});

	it('renders with shade inherit', async () => {
		const screen = await render(Spinner, {
			props: { shade: 'inherit', 'data-testid': 'spinner' }
		});
		const spinner = screen.getByTestId('spinner');
		await expect.element(spinner).toBeInTheDocument();
		await expect.element(spinner).toHaveAttribute('data-shade', 'inherit');
	});

	it('has role="status"', async () => {
		const screen = await render(Spinner, { props: { 'data-testid': 'spinner' } });
		await expect.element(screen.getByRole('status')).toBeInTheDocument();
	});

	it('has aria-label="Loading" by default', async () => {
		const screen = await render(Spinner, { props: { 'data-testid': 'spinner' } });
		await expect.element(screen.getByTestId('spinner')).toHaveAttribute('aria-label', 'Loading');
	});

	it('names the status element from the visible string label', async () => {
		const screen = await render(Spinner, {
			props: { label: 'Fetching data', 'data-testid': 'spinner' }
		});
		await expect.element(screen.getByRole('status')).toHaveAccessibleName('Fetching data');
	});

	it('does not duplicate a visible string label as aria-label', async () => {
		const screen = await render(Spinner, {
			props: { label: 'Fetching data', 'data-testid': 'spinner' }
		});
		const status = screen.getByRole('status');
		await expect.element(status).not.toHaveAttribute('aria-label');
		await expect.element(status).toHaveAttribute('aria-labelledby');
	});

	it('uses explicit aria-label over string label', async () => {
		const screen = await render(Spinner, {
			props: { label: 'Loading...', 'aria-label': 'Please wait', 'data-testid': 'spinner' }
		});
		await expect.element(screen.getByRole('status')).toHaveAttribute('aria-label', 'Please wait');
	});

	it('renders label content below the spinner', async () => {
		const screen = await render(Spinner, {
			props: { label: 'Loading...', 'data-testid': 'spinner' }
		});
		await expect.element(screen.getByText('Loading...', { exact: true })).toBeInTheDocument();
	});

	it('renders a snippet label', async () => {
		// Upstream's `renders ReactNode label` — rich content is a snippet here.
		const screen = await render(SlotProbe, {
			props: {
				component: Spinner,
				slot: 'label',
				text: 'Custom content',
				testid: 'custom-label',
				rest: { 'aria-label': 'Loading', 'data-testid': 'spinner' }
			}
		});
		await expect.element(screen.getByTestId('custom-label')).toBeInTheDocument();
	});

	it('defaults aria-label to "Loading" for a snippet label without explicit aria-label', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: Spinner,
				slot: 'label',
				text: 'Rich content',
				rest: { 'data-testid': 'spinner' }
			}
		});
		await expect.element(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
	});

	it('accepts data-testid', async () => {
		const screen = await render(Spinner, { props: { 'data-testid': 'my-spinner' } });
		await expect.element(screen.getByTestId('my-spinner')).toBeInTheDocument();
	});

	it('renders as an inline element (span)', async () => {
		const screen = await render(Spinner, { props: { 'data-testid': 'spinner' } });
		expect(screen.getByTestId('spinner').element().tagName.toLowerCase()).toBe('span');
	});
});

describe('Spinner ring', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('draws the ring in SVG', async () => {
		const screen = await render(Spinner, { props: { 'data-testid': 'spinner' } });
		const root = screen.getByTestId('spinner').element();
		const svg = ringOf(root);
		expect(svg).not.toBeNull();
		expect(svg.querySelectorAll('circle')).toHaveLength(2);
		expect(root.querySelector('canvas')).toBeNull();
	});

	it.each(Object.entries(SIZES))(
		'sizes the %s ring from its size token',
		async (size, { diameter, border }) => {
			const screen = await render(Spinner, {
				props: { size: size as keyof typeof SIZES, 'data-testid': 'spinner' }
			});
			const root = screen.getByTestId('spinner').element();
			const frame = diameter + border * 2;
			expect(ringOf(root).getAttribute('viewBox')).toBe(`0 0 ${frame} ${frame}`);
			const { track, arc } = circlesOf(root);
			for (const c of [track, arc]) {
				expect(Number(c.getAttribute('cx'))).toBe(frame / 2);
				expect(Number(c.getAttribute('cy'))).toBe(frame / 2);
				expect(Number(c.getAttribute('r'))).toBe(diameter / 2);
				expect(Number(c.getAttribute('stroke-width'))).toBe(border);
			}
		}
	);

	// The canvas ring swept 135deg, not the 270deg its SPREAD comment claimed.
	it.each(Object.entries(SIZES))('sweeps 135 degrees at %s', async (size, { diameter }) => {
		const screen = await render(Spinner, {
			props: { size: size as keyof typeof SIZES, 'data-testid': 'spinner' }
		});
		const { track, arc } = circlesOf(screen.getByTestId('spinner').element());
		const [on, off] = dashOf(arc);
		expect(on + off).toBeCloseTo(Math.PI * diameter, 6);
		expect((on / (on + off)) * 360).toBeCloseTo(135, 6);
		expect(track.getAttribute('stroke-dasharray')).toBeNull();
	});

	it('starts the arc at twelve o’clock', async () => {
		const screen = await render(Spinner, { props: { 'data-testid': 'spinner' } });
		const frame = SIZES.md.diameter + SIZES.md.border * 2;
		expect(circlesOf(screen.getByTestId('spinner').element()).arc.getAttribute('transform')).toBe(
			`rotate(-90 ${frame / 2} ${frame / 2})`
		);
	});

	// The whole point of the SVG ring: the colours come off the cascade, so
	// nothing has to resolve them in JS. A read reaching the paint path again
	// fails here.
	it.each(['default', 'subtle', 'onMedia', 'inherit'] as const)(
		'reads no computed style to paint the %s shade',
		async (shade) => {
			const spy = vi.spyOn(window, 'getComputedStyle');
			const screen = await render(Spinner, { props: { shade, 'data-testid': 'spinner' } });
			// Snapshot before resolving the locator: the element lookup is the runner's,
			// and only what the *render* read is the component's doing.
			const duringRender = [...spy.mock.calls];
			const spinner = screen.getByTestId('spinner').element();
			const onSpinner = duringRender.filter(
				([el]) => el instanceof Element && spinner.contains(el)
			);
			expect(onSpinner).toEqual([]);
		}
	);

	it('schedules no frame where the Web Animations API is absent', async () => {
		// RESTATED: upstream asserts the precondition — `expect(SVGElement.prototype)
		// .not.toHaveProperty('getAnimations')` — which holds because its environment
		// is jsdom. Real Chromium implements the API, so the guarded branch is
		// unreachable until the inherited method is shadowed with `undefined` for the
		// duration of the render. The assertion is upstream's unchanged: with no
		// `getAnimations`, the ring schedules no frame.
		//
		// The pending-frame flag is module state shared by every spinner on the page,
		// so one real frame is awaited first: an earlier case in this file scheduled
		// a pin, and a flag still set from it would make "no frame was scheduled" true
		// for the wrong reason. jsdom has no frame loop and upstream has no such flag
		// to drain.
		await new Promise((resolve) => requestAnimationFrame(resolve));
		Object.defineProperty(SVGElement.prototype, 'getAnimations', {
			value: undefined,
			configurable: true,
			writable: true
		});
		const raf = vi.spyOn(window, 'requestAnimationFrame');
		try {
			const screen = await render(Spinner, { props: { 'data-testid': 'spinner' } });
			expect(ringOf(screen.getByTestId('spinner').element())).not.toBeNull();
			expect(raf).not.toHaveBeenCalled();
		} finally {
			// @ts-expect-error — dropping the shadow restores Chromium's real surface
			delete SVGElement.prototype.getAnimations;
		}
	});

	it('pins every ring to the timeline origin in a single frame', async () => {
		// RESTATED in how the five spinners are mounted: upstream renders them as one
		// React fragment, and one `render()` per spinner would flush five times, so
		// they go through a fixture that mounts all five in a single flush.
		// `getAnimations` is stubbed exactly as upstream stubs it — what is asserted
		// is that the rings are collected and pinned together, not that Chromium's own
		// animations exist.
		//
		// One real frame first, for the reason the case above states: the batch flag
		// is module state, and a pin left scheduled by an earlier case would make this
		// render join it instead of opening a frame of its own.
		await new Promise((resolve) => requestAnimationFrame(resolve));
		const animations: { startTime: number | null }[] = [];
		const getAnimations = vi.fn(() => {
			const a = { startTime: null as number | null };
			animations.push(a);
			return [a];
		});
		Object.defineProperty(SVGElement.prototype, 'getAnimations', {
			value: getAnimations,
			configurable: true,
			writable: true
		});
		const frames: FrameRequestCallback[] = [];
		const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
			frames.push(cb);
			return frames.length;
		});
		const computed = vi.spyOn(window, 'getComputedStyle');

		try {
			const screen = await render(SpinnerMany, { props: { count: 5 } });
			const duringRender = [...computed.mock.calls];
			// One frame for five spinners: the reads are batched, so no mount re-forces
			// what the previous mount invalidated.
			expect(raf).toHaveBeenCalledTimes(1);
			frames.forEach((cb) => cb(0));
			expect(animations).toHaveLength(5);
			expect(animations.every((a) => a.startTime === 0)).toBe(true);
			// The pin runs on the branch the other shade cases cannot reach, so the
			// no-read assertion is made here too.
			expect(
				duringRender.filter(([el]) => el instanceof Element && screen.container.contains(el))
			).toEqual([]);
		} finally {
			// @ts-expect-error — removing the stub restores Chromium's real surface
			delete SVGElement.prototype.getAnimations;
		}
	});
});
