import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import OverlayFixture from './fixtures/overlay-fixture.svelte';
import UseOverlayProbe from './fixtures/use-overlay-probe.svelte';

/**
 * `Overlay`, `OverlayScrim` and `useOverlay`, with upstream's suite ported.
 *
 * The interesting property of this component is how little of it is JavaScript:
 * every `showOn` mode is a `when.ancestor(…, overlayScope)` rule, so hover and
 * focus reveal with no listener at all. The only state is the touch tap-toggle,
 * which exists because a device reporting `(hover: none)` has no `:hover`.
 *
 * Two upstream cases have counterparts rather than translations:
 * - **`exposes containerRef, containerProps, element and renderOverlay`.** A
 *   Svelte hook cannot return markup, so `element` and `renderOverlay` are both
 *   `<OverlayScrim {...overlay.scrimProps}>`; what the shape case can check is
 *   `attachContainer`, `containerProps` and `scrimProps`.
 * - **`ref` forwarding**, which is `bind:this` on the element a consumer owns.
 *
 * Not ported, with reasons:
 * - **The two `memoization` cases.** They assert `renderOverlay` keeps its
 *   identity across a re-render with the same options and loses it when they
 *   change — a question about `useCallback`, and there is no callback here to
 *   have an identity. What they exist to protect (a stale scrim configuration)
 *   is covered by the `isOpen` cases, which read the *rendered* result.
 * - **`returns element=null when no content is provided` / `returns a scrim
 *   element when content is provided`.** Upstream's `content` option only
 *   pre-renders `element` from itself, so with `element` gone the option has no
 *   job and is absent — see `use-overlay.svelte.ts`.
 */

const scrimOf = (screen: { container: HTMLElement }): HTMLElement => {
	const el = screen.container.querySelector<HTMLElement>('[data-position]');
	if (!el) throw new Error('scrim element not found');
	return el;
};

const rootOf = (screen: { container: HTMLElement }): HTMLElement =>
	screen.container.firstElementChild as HTMLElement;

/**
 * Force `matchMedia('(hover: none)')` to report a given value, so the touch and
 * pointer branches are both reachable. Upstream stubs the same call for the
 * same reason — a real browser reports the machine, not the case.
 */
function mockHoverNone(matches: boolean): () => void {
	const original = window.matchMedia;
	window.matchMedia = ((query: string) => ({
		matches: query.includes('hover: none') ? matches : false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	})) as typeof window.matchMedia;
	return () => {
		window.matchMedia = original;
	};
}

describe('Overlay', () => {
	describe('rendering & structure', () => {
		it('renders the base children', async () => {
			const screen = await render(OverlayFixture, { props: { base: 'hero' } });
			await expect.element(screen.getByTestId('base')).toHaveTextContent('hero');
		});

		it('renders the overlay content inside the scrim', async () => {
			const screen = await render(OverlayFixture, {
				props: { content: 'Quick view', isContentButton: true }
			});
			const button = screen.getByRole('button', { name: 'Quick view' });
			await expect.element(button).toBeInTheDocument();
			expect(scrimOf(screen).contains(button.element())).toBe(true);
		});

		it('renders a root div carrying the astryx-overlay class', async () => {
			const screen = await render(OverlayFixture, { props: {} });
			expect(rootOf(screen).tagName).toBe('DIV');
			expect(rootOf(screen).className).toContain('astryx-overlay');
		});

		it('places the scrim after the base children in DOM order', async () => {
			const screen = await render(OverlayFixture, { props: {} });
			const base = screen.getByTestId('base').element();
			const scrim = scrimOf(screen);
			expect(base.compareDocumentPosition(scrim) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
			expect(rootOf(screen).contains(scrim)).toBe(true);
		});

		it('applies the astryx-overlay-scrim class to the scrim', async () => {
			const screen = await render(OverlayFixture, { props: {} });
			expect(scrimOf(screen).className).toContain('astryx-overlay-scrim');
		});
	});

	describe('position', () => {
		it('defaults data-position to "fill"', async () => {
			const screen = await render(OverlayFixture, { props: {} });
			expect(scrimOf(screen).getAttribute('data-position')).toBe('fill');
		});

		for (const position of ['fill', 'bottom', 'top'] as const) {
			it(`reflects position="${position}" as data-position`, async () => {
				const screen = await render(OverlayFixture, { props: { position } });
				expect(scrimOf(screen).getAttribute('data-position')).toBe(position);
			});
		}
	});

	describe('scrim mode → media theme inversion', () => {
		it('dark scrim (default) wraps content in a dark MediaTheme', async () => {
			const screen = await render(OverlayFixture, { props: {} });
			expect(screen.container.querySelector('[data-astryx-media="dark"]')).not.toBeNull();
		});

		it('light scrim wraps content in a light MediaTheme', async () => {
			const screen = await render(OverlayFixture, { props: { scrim: 'light' } });
			expect(screen.container.querySelector('[data-astryx-media="light"]')).not.toBeNull();
			expect(screen.container.querySelector('[data-astryx-media="dark"]')).toBeNull();
		});

		it('scrim={false} renders no MediaTheme wrapper', async () => {
			const screen = await render(OverlayFixture, { props: { scrim: false } });
			expect(screen.container.querySelector('[data-astryx-media]')).toBeNull();
		});
	});

	describe('controlled visibility (isOpen)', () => {
		it('marks the scrim inert when isOpen is false', async () => {
			const screen = await render(OverlayFixture, { props: { isOpen: false } });
			expect(scrimOf(screen).hasAttribute('inert')).toBe(true);
		});

		it('does not mark the scrim inert when isOpen is true', async () => {
			const screen = await render(OverlayFixture, { props: { isOpen: true } });
			expect(scrimOf(screen).hasAttribute('inert')).toBe(false);
		});

		it('is never inert in uncontrolled (CSS-driven) mode', async () => {
			const screen = await render(OverlayFixture, { props: { showOn: 'hover' } });
			expect(scrimOf(screen).hasAttribute('inert')).toBe(false);
		});

		it('toggles inert when the isOpen prop flips', async () => {
			const screen = await render(OverlayFixture, { props: { isOpen: false } });
			expect(scrimOf(screen).hasAttribute('inert')).toBe(true);
			await screen.rerender({ isOpen: true });
			expect(scrimOf(screen).hasAttribute('inert')).toBe(false);
		});
	});

	describe('styling', () => {
		it('merges a caller class onto the root', async () => {
			const screen = await render(OverlayFixture, { props: { class: 'custom-cls' } });
			expect(rootOf(screen).className).toContain('custom-cls');
			expect(rootOf(screen).className).toContain('astryx-overlay');
		});

		it('merges a caller inline style onto the root', async () => {
			const screen = await render(OverlayFixture, { props: { style: 'opacity: 0.5' } });
			expect(rootOf(screen).style.opacity).toBe('0.5');
		});
	});
});

describe('useOverlay', () => {
	describe('return shape', () => {
		it('exposes attachContainer, containerProps and scrimProps', async () => {
			const screen = await render(UseOverlayProbe, { props: {} });
			const { overlay } = screen.component;
			expect(typeof overlay.attachContainer).toBe('function');
			expect(overlay.containerProps).toBeDefined();
			expect(overlay.scrimProps).toBeDefined();
		});

		it('attachContainer hands the hook the container element', async () => {
			const screen = await render(UseOverlayProbe, { props: {} });
			expect(screen.component.overlay.container).toBe(
				screen.container.querySelector('[data-testid="container"]')
			);
		});

		it('containerProps.class is a non-empty marker string', async () => {
			const screen = await render(UseOverlayProbe, { props: {} });
			const { class: className } = screen.component.overlay.containerProps;
			expect(typeof className).toBe('string');
			expect(className.length).toBeGreaterThan(0);
		});

		it('an on-demand OverlayScrim renders content the hook never saw', async () => {
			const screen = await render(UseOverlayProbe, {
				props: { options: { showOn: 'hover' }, renderScrim: true }
			});
			await expect.element(screen.getByText('on demand')).toBeInTheDocument();
			expect(scrimOf(screen)).not.toBeNull();
		});
	});

	describe('pointer (non-touch) device', () => {
		let restore: () => void;
		beforeEach(() => {
			restore = mockHoverNone(false);
		});
		afterEach(() => restore());

		it('does not attach touch toggle handlers in hover mode', async () => {
			const screen = await render(UseOverlayProbe, { props: { options: { showOn: 'hover' } } });
			const { containerProps } = screen.component.overlay;
			expect(containerProps.onclick).toBeUndefined();
			expect(containerProps.onmouseup).toBeUndefined();
		});
	});

	describe('touch device', () => {
		let restore: () => void;
		beforeEach(() => {
			restore = mockHoverNone(true);
		});
		afterEach(() => restore());

		it('attaches tap-to-toggle handlers in hover mode', async () => {
			const screen = await render(UseOverlayProbe, { props: { options: { showOn: 'hover' } } });
			const { containerProps } = screen.component.overlay;
			expect(typeof containerProps.onclick).toBe('function');
			expect(typeof containerProps.onmouseup).toBe('function');
		});

		it('does NOT attach toggle handlers when showOn="always" (no toggle needed)', async () => {
			const screen = await render(UseOverlayProbe, { props: { options: { showOn: 'always' } } });
			expect(screen.component.overlay.containerProps.onclick).toBeUndefined();
			expect(screen.component.overlay.containerProps.onmouseup).toBeUndefined();
		});

		it('does NOT attach toggle handlers when showOn="focus"', async () => {
			const screen = await render(UseOverlayProbe, { props: { options: { showOn: 'focus' } } });
			expect(screen.component.overlay.containerProps.onclick).toBeUndefined();
		});

		it('a consumer prop isOpen overrides the touch toggle (scrim reflects it)', async () => {
			const screen = await render(OverlayFixture, { props: { showOn: 'hover', isOpen: false } });
			expect(scrimOf(screen).hasAttribute('inert')).toBe(true);
		});
	});
});
