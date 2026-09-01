/** PORTS: Field/InputClearButton.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import InputClearButton from '$lib/components/field/input-clear-button.svelte';
import Icon from '$lib/components/icon/icon.svelte';
import { defineTheme } from '$lib/theme/define-theme.js';
import { generateThemeCss } from '$lib/theme/generate-theme-rules.js';
// Upstream reads the source with `fs` + `__dirname`; the browser project has
// neither, and Vite's `?raw` hands over the same bytes. The precedent is
// `aspect-ratio.svelte.test.ts`.
import clearButtonSource from '$lib/components/field/input-clear-button.stylex.ts?raw';

interface InjectedRule {
	selector: string;
	text: string;
	media: string | null;
}

/**
 * Every style rule the page carries, flattened out of any at-rule wrapper and
 * tagged with that wrapper's condition — so a `@media (pointer: coarse)` rule
 * stays distinguishable from the unconditional one. Upstream's helper. It reads
 * `document.styleSheets` there off StyleX's runtime injection and here off the
 * sheet the StyleX plugin compiled, which changes where the rules come from and
 * nothing about what they say.
 */
function injectedRules(): InjectedRule[] {
	const walk = (rules: CSSRuleList, condition: string | null): InjectedRule[] =>
		Array.from(rules).flatMap((rule): InjectedRule[] => {
			const { selectorText } = rule as CSSStyleRule;
			if (typeof selectorText === 'string') {
				return [{ selector: selectorText, text: rule.cssText, media: condition }];
			}
			// A grouping rule (@media, @keyframes, ...): descend, carrying the
			// innermost condition down.
			const nested = (rule as CSSGroupingRule).cssRules;
			if (nested == null) {
				return [];
			}
			const own = (rule as CSSMediaRule).media?.mediaText;
			return walk(nested, own != null && own !== '' ? own : condition);
		});

	return Array.from(document.styleSheets).flatMap((sheet) => {
		try {
			return walk(sheet.cssRules, null);
		} catch {
			// cross-origin sheet
			return [];
		}
	});
}

/**
 * Astryx's `Field/InputClearButton.test.tsx`, ported whole — **10 of upstream's
 * 10 at v0.5.0**, nothing dropped.
 *
 * The header has been false twice now, both times at a pin move. It read
 * "6 cases at v0.4.1" until 0.4.5 added the two `input-clear-button` target
 * cases, and "8 of 8 at v0.4.5" until 0.5.0 added the two coarse-pointer
 * hit-target cases below — and each time the port was missing the thing the
 * new cases cover (the `themeProps` literal then, the `::after` hit overlay
 * now) as well as the cases themselves.
 *
 * The suite is new at 0.4.x, and so is the reason for it: #4876 converged the
 * whole clearable-input family (`TextInput`, `NumberInput`, `TimeInput`, the
 * three date inputs, the selectors, `Tokenizer`, `FileInput`) on this one
 * primitive, which had each been drawing its own `<button>` and its own focus
 * ring. These cases pin the two things that convergence bought: one canonical
 * `astryx-input-clear-icon` theme target on the glyph, and an `iconClassName`
 * seam for the component-specific targets that shipped before it.
 *
 * One translation, already precedented in `calendar` / `selector` /
 * `multi-selector`: upstream's `generateThemeTestCSS` helper becomes this
 * port's `generateThemeCss`, which is the same job and shape — a flat
 * stylesheet string.
 *
 * `onClick` is `onclick` here, the lowercase spelling this port uses for a
 * handler forwarded to an element (the rule `Thumbnail` established); the
 * component's props type documents why.
 */
describe('InputClearButton', () => {
	function getGlyph(container: HTMLElement): HTMLElement {
		const icon = container.querySelector('.astryx-icon');
		if (icon == null) {
			throw new Error('clear glyph not found');
		}
		return icon as HTMLElement;
	}

	it('renders a real button with the given accessible label', async () => {
		const screen = await render(InputClearButton, {
			props: { label: 'Clear', onclick: () => {} }
		});
		const button = screen.getByRole('button', { name: 'Clear', exact: true });
		await expect.element(button).toBeInTheDocument();
		expect(button.element().tagName).toBe('BUTTON');
	});

	it('fires onclick with the native event when pressed', async () => {
		const onclick = vi.fn();
		const screen = await render(InputClearButton, { props: { label: 'Clear', onclick } });
		await screen.getByRole('button', { name: 'Clear', exact: true }).click();
		expect(onclick).toHaveBeenCalledTimes(1);
		expect(onclick.mock.calls[0][0]).toBeInstanceOf(Object);
	});

	it('renders the astryx-input-clear-icon target on the glyph', async () => {
		// One canonical target on the icon element itself — so a theme restyles
		// the clear glyph across the whole input family from a single place.
		const screen = await render(InputClearButton, {
			props: { label: 'Clear', onclick: () => {} }
		});
		const glyph = getGlyph(screen.container);
		expect(glyph).toHaveClass('astryx-input-clear-icon');
		expect(glyph).toHaveClass('astryx-icon');
	});

	it('matches a standalone secondary/sm close icon aside from the target class', async () => {
		// The glyph is a secondary/sm close icon (matching the other field
		// affordances — chevrons, calendar toggles, status icons); aside from the
		// target class it is exactly that standalone Icon, so the default look is
		// defined once here rather than per input.
		const clear = await render(InputClearButton, {
			props: { label: 'Clear', onclick: () => {} }
		});
		const glyph = getGlyph(clear.container);

		const reference = await render(Icon, {
			props: { icon: 'close', size: 'sm', color: 'secondary' }
		});
		const refIcon = getGlyph(reference.container);

		const styleClasses = (el: HTMLElement) =>
			el.className
				.split(' ')
				.filter((c) => c !== 'astryx-input-clear-icon')
				.sort();

		expect(styleClasses(glyph)).toEqual(styleClasses(refIcon));
	});

	it('merges an extra iconClassName beside the canonical target', async () => {
		// Consumers that shipped a component-specific target before the family
		// converged pass it through here to keep emitting it for a deprecation
		// window.
		const screen = await render(InputClearButton, {
			props: {
				label: 'Clear',
				onclick: () => {},
				iconClassName: 'astryx-date-input-clear-icon'
			}
		});
		const glyph = getGlyph(screen.container);
		expect(glyph).toHaveClass('astryx-input-clear-icon');
		expect(glyph).toHaveClass('astryx-date-input-clear-icon');
	});

	it('exposes input-clear-icon so a theme reaches the glyph color, size, and hover', () => {
		const theme = defineTheme({
			name: 'input-clear-icon-test',
			components: {
				'input-clear-icon': {
					base: {
						width: '12px',
						height: '12px',
						fontSize: '12px',
						color: 'var(--color-icon-secondary)',
						':hover': { color: 'var(--color-icon-primary)' }
					}
				}
			}
		});
		const css = generateThemeCss(theme);
		expect(css).toContain('.astryx-input-clear-icon {');
		expect(css).toContain('width: 12px');
		expect(css).toContain('.astryx-input-clear-icon:hover');
		expect(css).toContain('color: var(--color-icon-primary)');
	});

	it('renders the astryx-input-clear-button target on the button wrapper', async () => {
		const screen = await render(InputClearButton, {
			props: { label: 'Clear', onclick: () => {} }
		});
		const button = screen.container.querySelector('button')!;
		expect(button).toHaveClass('astryx-input-clear-button');
	});

	it('grows the hit area to 24px on a coarse pointer only (WCAG 2.5.8 AA)', async () => {
		// The visual glyph stays 20px; an ::after overlay expands only the
		// tappable region, and only under a coarse pointer. Asserted against the
		// CSS the page carries, because neither a media query nor a
		// pseudo-element box is reachable from the rendered element.
		const screen = await render(InputClearButton, {
			props: { label: 'Clear', onclick: () => {} }
		});
		const button = screen.container.querySelector('button')!;
		const classes = new Set(button.className.split(' ').filter(Boolean));

		const css = injectedRules();
		const rulesForButton = css.filter(({ selector }) =>
			[...classes].some((c) => selector.includes(`.${c}`))
		);
		// Guards every assertion below against silently passing if the class
		// plumbing or the compiled sheet ever changes shape.
		expect(rulesForButton.length).toBeGreaterThan(0);

		const decl = (pattern: RegExp, inMedia?: string) =>
			rulesForButton.some(
				({ text, media }) =>
					pattern.test(text) && (inMedia == null ? media == null : (media ?? '').includes(inMedia))
			);

		// Fine pointer: hit area == the 20px visual glyph, no expansion.
		expect(decl(/--_input-clear-hit-inset\s*:\s*0px/)).toBe(true);
		// Coarse pointer: 20px + 2px on each side = 24x24, the AA floor.
		expect(decl(/--_input-clear-hit-inset\s*:\s*-2px/, 'pointer: coarse')).toBe(true);
		// ...and nothing wider than that, which would reach into the adornment
		// gap and the input's caret area. Scoped to the coarse block, because
		// that is the only place a wider value can appear.
		expect(decl(/--_input-clear-hit-inset\s*:\s*-(?:[3-9]|\d{2,})px/, 'pointer: coarse')).toBe(
			false
		);
		// The overlay exists only on touch. On a fine pointer a generated
		// ::after would cover the button and take hover away from the glyph
		// target, so `content` is gated the same way the inset is.
		expect(decl(/--_input-clear-hit-content\s*:\s*none/)).toBe(true);
		expect(decl(/--_input-clear-hit-content\s*:\s*""/, 'pointer: coarse')).toBe(true);
		// The overlay itself is what carries the expansion, and what is gated.
		expect(decl(/::after\s*\{[^}]*inset\s*:\s*var\(--_input-clear-hit-inset\)/)).toBe(true);
		expect(decl(/::after\s*\{[^}]*content\s*:\s*var\(--_input-clear-hit-content\)/)).toBe(true);
	});

	it('declares its own containing block for the hit overlay', () => {
		// The ::after overlay must resolve against this button. Button happens to
		// set `position: relative` on itself, so at runtime the overlay is
		// correctly placed either way — and StyleX compiles both declarations to
		// the same atomic class, so the rendered CSS cannot tell the two apart.
		// Assert on the source instead, so a future edit can't quietly leave the
		// overlay depending on another component's internal.
		const buttonStyle = clearButtonSource.match(/button:\s*\{[\s\S]*?\n\t\}/)?.[0];
		expect(buttonStyle).toBeDefined();
		expect(buttonStyle).toMatch(/position:\s*'relative'/);
	});

	it('exposes input-clear-button so a theme controls the button size and hover', () => {
		const theme = defineTheme({
			name: 'input-clear-button-test',
			components: {
				'input-clear-button': {
					base: {
						height: '28px',
						':hover': { backgroundImage: 'none' }
					}
				}
			}
		});
		const css = generateThemeCss(theme);
		expect(css).toContain('.astryx-input-clear-button {');
		expect(css).toContain('height: 28px');
		expect(css).toContain('.astryx-input-clear-button:hover');
		expect(css).toContain('background-image: none');
	});
});
