import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import Icon from '$lib/components/icon/icon.svelte';
import { resetIcons } from '$lib/components/icon/icon-registry.js';
import IconNestedTheme from './fixtures/icon-nested-theme.svelte';
import TestIcon from './fixtures/test-icon.svelte';
import { probe } from './fixtures/xstyle-probe.stylex.js';

/**
 * Astryx's `Icon/Icon.test.tsx`, all 32 cases. `Icon` was ported in the first
 * batch and its suite never was; it lands now because 0.1.8's `label` and
 * 0.2.0's `xstyle`/`className`/`style` composition would otherwise be the only
 * untested props on a component every other one renders.
 *
 * `TestIcon` is `__tests__/TestIcon.tsx` as a Svelte component — a bare `<svg>`
 * that forwards every attribute, so the prop-forwarding cases exercise the same
 * thing they do upstream.
 *
 * Two cases are counterparts rather than translations, both for reasons the
 * earlier suites already settled:
 *
 * - **`forwards ref correctly`** becomes the attachment a consumer passes
 *   through the rest props. It checks more than upstream's does, because the
 *   attachment receives the element and the case asserts it is the `<svg>`.
 * - **the two `leaves default rendering unchanged` cases** compare one render
 *   against a second render of the same props, as upstream does. Upstream's
 *   note about `SVGAnimatedString` applies here too, so both read the `class`
 *   *attribute* rather than the property.
 *
 * 0.3.0's **nested-Theme scoping** case is the 32nd, and it renders through a
 * fixture rather than inline: `render()` takes one component, and the registry
 * values it needs are snippets, which only a template can author.
 *
 * The two `rem` sizing cases are restated in delivery, and the restatement is
 * the point: upstream runs in jsdom, which returns the authored `0.75rem`
 * verbatim, so its assertion never proves the value resolves. A real browser
 * resolves against the root font-size, so the expectation is converted through
 * `toPx` — the case still reads in `rem` while asserting what the cascade
 * actually produced.
 */

/** The rendered icon: the probe renders nothing above it. */
function iconIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[data-testid="icon"]');
	if (!(el instanceof HTMLElement || el instanceof SVGElement)) {
		throw new Error('expected an icon element');
	}
	return el as HTMLElement;
}

describe('Icon', () => {
	it('renders the icon component', async () => {
		const screen = await render(Icon, { props: { icon: TestIcon, 'data-testid': 'icon' } });
		expect(iconIn(screen.container)).toBeInTheDocument();
	});

	it('renders as an SVG element', async () => {
		const screen = await render(Icon, { props: { icon: TestIcon, 'data-testid': 'icon' } });
		expect(iconIn(screen.container).tagName.toLowerCase()).toBe('svg');
	});

	it('applies aria-hidden by default', async () => {
		const screen = await render(Icon, { props: { icon: TestIcon, 'data-testid': 'icon' } });
		expect(iconIn(screen.container)).toHaveAttribute('aria-hidden', 'true');
	});

	it('renders with different color variants', async () => {
		const screen = await render(Icon, {
			props: { icon: TestIcon, color: 'primary', 'data-testid': 'icon' }
		});
		expect(iconIn(screen.container)).toBeInTheDocument();

		for (const color of [
			'secondary',
			'accent',
			'success',
			'error',
			'warning',
			'inherit'
		] as const) {
			await screen.rerender({ icon: TestIcon, color, 'data-testid': 'icon' });
			expect(iconIn(screen.container)).toBeInTheDocument();
		}
	});

	it('renders with non-semantic color variants', async () => {
		const nonSemanticColors = [
			'blue',
			'red',
			'green',
			'gray',
			'cyan',
			'teal',
			'yellow',
			'orange',
			'pink',
			'purple'
		] as const;
		const screen = await render(Icon, {
			props: { icon: TestIcon, color: nonSemanticColors[0], 'data-testid': 'icon' }
		});
		expect(iconIn(screen.container)).toBeInTheDocument();

		for (const c of nonSemanticColors.slice(1)) {
			await screen.rerender({ icon: TestIcon, color: c, 'data-testid': 'icon' });
			expect(iconIn(screen.container)).toBeInTheDocument();
		}
	});

	it('renders with different size variants', async () => {
		const screen = await render(Icon, {
			props: { icon: TestIcon, size: 'xsm', 'data-testid': 'icon' }
		});
		expect(iconIn(screen.container)).toBeInTheDocument();

		for (const size of ['sm', 'md', 'lg'] as const) {
			await screen.rerender({ icon: TestIcon, size, 'data-testid': 'icon' });
			expect(iconIn(screen.container)).toBeInTheDocument();
		}
	});

	it('sizes component-mode icons in rem so they scale with root font-size', async () => {
		const sizes = { xsm: '0.75rem', sm: '1rem', md: '1.25rem', lg: '1.5rem' } as const;
		for (const [size, expected] of Object.entries(sizes)) {
			const screen = await render(Icon, {
				props: { icon: TestIcon, size: size as keyof typeof sizes, 'data-testid': 'icon' }
			});
			// A real browser resolves `rem` to `px`, so the expectation is converted
			// against the document's own root font-size rather than compared as a
			// string. Upstream's jsdom returns the authored value verbatim.
			expect(getComputedStyle(iconIn(screen.container)).width).toBe(toPx(expected));
			expect(getComputedStyle(iconIn(screen.container)).height).toBe(toPx(expected));
			screen.unmount();
		}
	});

	it('sizes registry (string-mode) icons in rem, including fontSize', async () => {
		const sizes = { xsm: '0.75rem', sm: '1rem', md: '1.25rem', lg: '1.5rem' } as const;
		for (const [size, expected] of Object.entries(sizes)) {
			const screen = await render(Icon, {
				props: { icon: 'check', size: size as keyof typeof sizes, 'data-testid': 'icon' }
			});
			const style = getComputedStyle(iconIn(screen.container));
			expect(style.width).toBe(toPx(expected));
			expect(style.height).toBe(toPx(expected));
			// fontSize is expressed in rem so 1em-based registry icons scale too.
			expect(style.fontSize).toBe(toPx(expected));
			screen.unmount();
		}
	});

	// Counterpart to upstream's `forwards ref correctly`: Svelte has no `ref`
	// prop, and the attachment a consumer passes through rest props reaches the
	// same element.
	it('hands the rendered svg to an attachment passed through rest props', async () => {
		let element: Element | null = null;
		await render(Icon, {
			props: {
				icon: TestIcon,
				[createAttachmentKey()]: (node: Element) => {
					element = node;
				}
			}
		});
		expect(element).toBeInstanceOf(SVGSVGElement);
	});

	it('passes additional SVG props', async () => {
		const screen = await render(Icon, {
			props: { icon: TestIcon, 'data-testid': 'icon', role: 'img', 'aria-label': 'Home' }
		});
		const icon = iconIn(screen.container);
		expect(icon).toHaveAttribute('role', 'img');
		expect(icon).toHaveAttribute('aria-label', 'Home');
	});

	it('uses default color and size when not specified', async () => {
		const screen = await render(Icon, { props: { icon: TestIcon, 'data-testid': 'icon' } });
		// The component should render without errors with defaults
		expect(iconIn(screen.container)).toBeInTheDocument();
	});

	it('applies aria-hidden by default in string (registry) mode', async () => {
		const screen = await render(Icon, { props: { icon: 'check', 'data-testid': 'icon' } });
		expect(iconIn(screen.container)).toHaveAttribute('aria-hidden', 'true');
	});

	it('resolves string-mode icons from the nearest Theme without leaking globally', async () => {
		// `<Theme>` still hands its icons to `registerIcons`, which is global, so
		// this case would otherwise leave `check` overridden for every case below
		// it. Upstream resets only on the way in, because its 0.3.0 `<Theme>` no
		// longer registers globally at all — see the report's `theme.svelte` note.
		resetIcons();
		const screen = await render(IconNestedTheme);

		await expect.element(screen.getByTestId('outer')).toHaveTextContent('outer-check');
		await expect.element(screen.getByTestId('inner')).toHaveTextContent('inner-check');
		resetIcons();
	});

	it('lets a string-mode icon be made meaningful by overriding aria-hidden', async () => {
		const screen = await render(Icon, {
			props: {
				icon: 'check',
				'data-testid': 'icon',
				role: 'img',
				'aria-label': 'Done',
				'aria-hidden': false
			}
		});
		const icon = iconIn(screen.container);
		expect(icon).toHaveAttribute('role', 'img');
		expect(icon).toHaveAttribute('aria-label', 'Done');
		expect(icon).toHaveAttribute('aria-hidden', 'false');
	});

	describe('label (accessible name)', () => {
		it('makes a component-mode icon meaningful: role="img" + aria-label, no aria-hidden', async () => {
			const screen = await render(Icon, {
				props: { icon: TestIcon, label: 'Completed', 'data-testid': 'icon' }
			});
			const icon = iconIn(screen.container);
			expect(icon).toHaveAttribute('role', 'img');
			expect(icon).toHaveAttribute('aria-label', 'Completed');
			expect(icon).not.toHaveAttribute('aria-hidden');
		});

		it('makes a string-mode (registry) icon meaningful: role="img" + aria-label, no aria-hidden', async () => {
			const screen = await render(Icon, {
				props: { icon: 'check', label: 'Completed', 'data-testid': 'icon' }
			});
			const icon = iconIn(screen.container);
			expect(icon).toHaveAttribute('role', 'img');
			expect(icon).toHaveAttribute('aria-label', 'Completed');
			expect(icon).not.toHaveAttribute('aria-hidden');
		});

		it('keeps the decorative default when label is omitted (component mode)', async () => {
			const screen = await render(Icon, { props: { icon: TestIcon, 'data-testid': 'icon' } });
			const icon = iconIn(screen.container);
			expect(icon).toHaveAttribute('aria-hidden', 'true');
			expect(icon).not.toHaveAttribute('role');
			expect(icon).not.toHaveAttribute('aria-label');
		});

		it('keeps the decorative default when label is omitted (string mode)', async () => {
			const screen = await render(Icon, { props: { icon: 'check', 'data-testid': 'icon' } });
			const icon = iconIn(screen.container);
			expect(icon).toHaveAttribute('aria-hidden', 'true');
			expect(icon).not.toHaveAttribute('role');
			expect(icon).not.toHaveAttribute('aria-label');
		});

		it('treats an empty string label as decorative (component mode)', async () => {
			const screen = await render(Icon, {
				props: { icon: TestIcon, label: '', 'data-testid': 'icon' }
			});
			const icon = iconIn(screen.container);
			expect(icon).toHaveAttribute('aria-hidden', 'true');
			expect(icon).not.toHaveAttribute('role');
			expect(icon).not.toHaveAttribute('aria-label');
		});

		it('treats an empty string label as decorative (string mode)', async () => {
			const screen = await render(Icon, {
				props: { icon: 'check', label: '', 'data-testid': 'icon' }
			});
			const icon = iconIn(screen.container);
			expect(icon).toHaveAttribute('aria-hidden', 'true');
			expect(icon).not.toHaveAttribute('role');
			expect(icon).not.toHaveAttribute('aria-label');
		});

		it('lets an explicit aria-hidden win over label (component mode)', async () => {
			const screen = await render(Icon, {
				props: { icon: TestIcon, label: 'Close', 'aria-hidden': true, 'data-testid': 'icon' }
			});
			expect(iconIn(screen.container)).toHaveAttribute('aria-hidden', 'true');
		});

		it('lets an explicit aria-hidden win over label (string mode)', async () => {
			const screen = await render(Icon, {
				props: { icon: 'check', label: 'Close', 'aria-hidden': true, 'data-testid': 'icon' }
			});
			expect(iconIn(screen.container)).toHaveAttribute('aria-hidden', 'true');
		});

		it('lets an explicit aria-label override the label-derived name (component mode)', async () => {
			const screen = await render(Icon, {
				props: {
					icon: TestIcon,
					label: 'Close',
					'aria-label': 'Dismiss',
					'data-testid': 'icon'
				}
			});
			expect(iconIn(screen.container)).toHaveAttribute('aria-label', 'Dismiss');
		});

		it('lets an explicit role override the label-derived role (string mode)', async () => {
			const screen = await render(Icon, {
				props: { icon: 'check', label: 'Close', role: 'presentation', 'data-testid': 'icon' }
			});
			expect(iconIn(screen.container)).toHaveAttribute('role', 'presentation');
		});
	});

	describe('styling prop handling', () => {
		it('composes a consumer class with the internal classes (string mode)', async () => {
			const screen = await render(Icon, {
				props: { icon: 'check', class: 'consumer-target', 'data-testid': 'icon' }
			});
			const icon = iconIn(screen.container);
			// Consumer class must survive alongside the stable astryx-icon class and
			// the StyleX classes.
			expect(icon).toHaveClass('consumer-target');
			expect(icon).toHaveClass('astryx-icon');
			// At least one StyleX-generated class is still present.
			expect(icon.getAttribute('class')!.split(' ').length).toBeGreaterThan(2);
		});

		it('forwards a consumer class in component (SVG) mode', async () => {
			const screen = await render(Icon, {
				props: { icon: TestIcon, class: 'consumer-target', 'data-testid': 'icon' }
			});
			const icon = iconIn(screen.container);
			expect(icon.getAttribute('class')).toContain('consumer-target');
			expect(icon.getAttribute('class')).toContain('astryx-icon');
		});

		it('merges a consumer style onto the rendered element (string mode)', async () => {
			const screen = await render(Icon, {
				props: { icon: 'check', style: 'opacity: 0.5', 'data-testid': 'icon' }
			});
			expect(iconIn(screen.container)).toHaveStyle({ opacity: '0.5' });
		});

		it('merges a consumer style onto the rendered element (component mode)', async () => {
			const screen = await render(Icon, {
				props: { icon: TestIcon, style: 'opacity: 0.5', 'data-testid': 'icon' }
			});
			expect(iconIn(screen.container)).toHaveStyle({ opacity: '0.5' });
		});

		it('applies xstyle to the rendered element (string mode)', async () => {
			const screen = await render(Icon, {
				props: { icon: 'check', xstyle: probe.novelMargin, 'data-testid': 'icon' }
			});
			const icon = iconIn(screen.container);
			// xstyle folds into stylex.props, so it contributes a StyleX class
			// alongside the base colour/size classes rather than clobbering them.
			expect(icon).toHaveClass('astryx-icon');
			expect(icon).toHaveStyle({ marginTop: '13px' });
		});

		it('applies xstyle to the rendered element (component mode)', async () => {
			const screen = await render(Icon, {
				props: { icon: TestIcon, xstyle: probe.novelMargin, 'data-testid': 'icon' }
			});
			const icon = iconIn(screen.container);
			expect(icon.getAttribute('class')).toContain('astryx-icon');
			expect(icon).toHaveStyle({ marginTop: '13px' });
		});

		it('leaves default rendering unchanged when no styling props are passed (string mode)', async () => {
			const a = await render(Icon, { props: { icon: 'check', size: 'sm', color: 'secondary' } });
			const icon = a.container.querySelector('.astryx-icon')!;
			const b = await render(Icon, { props: { icon: 'check', size: 'sm', color: 'secondary' } });
			const refIcon = b.container.querySelector('.astryx-icon')!;
			// Default output is identical to itself — the styling-prop handling adds
			// nothing (no extra class, no inline style) unless a prop is passed.
			expect(icon.getAttribute('class')).toBe(refIcon.getAttribute('class'));
			expect(icon.getAttribute('style')).toBe(refIcon.getAttribute('style'));
		});

		it('leaves default rendering unchanged when no styling props are passed (component mode)', async () => {
			const a = await render(Icon, { props: { icon: TestIcon, size: 'sm', color: 'secondary' } });
			const icon = a.container.querySelector('.astryx-icon')!;
			const b = await render(Icon, { props: { icon: TestIcon, size: 'sm', color: 'secondary' } });
			const refIcon = b.container.querySelector('.astryx-icon')!;
			// `SVGElement.className` is an `SVGAnimatedString`, so compare the class
			// attribute string rather than the property object — upstream's note.
			expect(icon.getAttribute('class')).toBe(refIcon.getAttribute('class'));
			expect(icon.getAttribute('style')).toBe(refIcon.getAttribute('style'));
		});
	});
});

/**
 * A real browser resolves `rem` against the root font-size; the authored values
 * are converted here rather than compared as strings, so the case still reads as
 * "0.75rem" while asserting what the cascade produced.
 */
function toPx(rem: string): string {
	const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
	return `${parseFloat(rem) * root}px`;
}
