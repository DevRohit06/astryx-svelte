/** PORTS: ButtonGroup/ButtonGroup.test.tsx */

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import ButtonGroupHarness from './fixtures/button-group-harness.svelte';

/**
 * Upstream's `ButtonGroup/ButtonGroup.test.tsx`, ported case for case.
 *
 * Upstream at v0.3.0 has **24** `it` declarations that expand to **28** cases
 * (four `it.each` over `['horizontal', 'vertical']`). **23 declarations / 26
 * cases** are here.
 *
 * (The previous header said "22 declarations … 26 cases … Twenty-four of them
 * are here", re-derived here by enumerating
 * `git show v0.3.0:packages/core/src/ButtonGroup/ButtonGroup.test.tsx`. It was
 * also silently short by upstream's nested `describe('elevation')` pair, which
 * arrived with 0.1.9's `elevation` prop; both are ported now and both passed on
 * the first run.)
 *
 * **The two `rounds a trailing DropdownMenu trigger, whose popover follows it
 * (%s)` cases are back.** They were dropped when `DropdownMenu` was unported,
 * with the note "the cases come back with `DropdownMenu`" — it has been ported
 * since, so they do. This matters more than the count: the dropped case is the
 * only one exercising a trailing member that emits **marker + popover** together,
 * and the marker is exactly what `IS_LAST_ITEM` changed to skip at 0.4.2
 * (`:not(:has(~ *:not([popover]):not(template)))`). The tooltip'd-`Button`
 * stand-in happens to have the same shape today; a `DropdownMenu`-specific
 * sibling order would slip past it.
 *
 * **Restated: `rounds only the last member (first/middle/last)`.** Its last
 * member is a `DropdownMenu`; a `Button` with a `tooltip` stands in, because
 * what the case needs from it is a trigger followed by its own `[popover]`
 * sibling and that is exactly what a tooltip'd `Button` renders. Every
 * assertion is upstream's.
 *
 * **Counterpart: `forwards ref to the root element`.** Svelte has no ref
 * objects and a component cannot expose its root through `bind:this`, so the
 * way a consumer reaches that element is an attachment travelling through the
 * rest props — the same counterpart `thumbnail.svelte.test.ts` uses, and it
 * checks more than upstream's does since it receives the element rather than
 * only proving a callback ran.
 *
 * `rerender` maps straight across: `vitest-browser-svelte`'s is async.
 *
 * ## Where the compiled CSS comes from
 *
 * Upstream's harness (its lines 246-294) runs the real StyleX babel plugin over
 * `Button.tsx` and reads the trailing-radius rule's *selector* out of the
 * emitted CSS, deliberately: a hand-copied predicate is a tautology, and
 * reverting `groupStyles` to `:last-child` has to go red.
 *
 * Ours keeps that property and shortens the path to it. jsdom applies no CSS,
 * so upstream had to compile the source itself; this project already compiles
 * `button.stylex.ts` with that same plugin — the `@stylexjs/unplugin` Vite
 * plugin configured in `vite.config.ts`, the same one the package builds with —
 * and serves the result at `/virtual:stylex.css`. So the rules are read from
 * *that*, through the browser's own CSSOM rather than a regex: `selectorText`
 * and the parsed declarations of every atomic rule the build emitted. It is the
 * CSS the component actually ships, and it still comes from the source rather
 * than from a string retyped in this file — change `IS_LAST_ITEM` and these go
 * red.
 *
 * The `beforeAll` fetch is also the standing requirement recorded in port/todo.md:
 * nothing in the browser project pulls the compiled stylesheet into the page.
 */

/** One atomic StyleX rule, read out of the emitted stylesheet. */
type CompiledRule = {
	/** Atomic class name, e.g. `xajhecq`. */
	className: string;
	/** Selector text after the class, e.g. `:first-child`. '' if unconditional. */
	condition: string;
	/** CSS property, e.g. `border-start-end-radius`. */
	property: string;
	/** CSS value, e.g. `var(--radius-element)`. */
	value: string;
	/** The full compiled selector, e.g. `.x1rmb4wm:not(:has(~ *:not([popover]):not(template)))`. */
	selector: string;
};

let COMPILED: CompiledRule[] = [];

/**
 * Flatten a stylesheet into atomic rules.
 *
 * `@layer` is how this build spells StyleX's priority buckets (`useCSSLayers`),
 * so those are descended into. `@media`-wrapped rules are skipped for upstream's
 * reason — they are irrelevant to the radius contract — and so is anything else
 * that is not a plain style rule.
 */
function collectRules(sheet: CSSStyleSheet): CompiledRule[] {
	const out: CompiledRule[] = [];

	const visit = (rules: CSSRuleList): void => {
		for (const rule of rules) {
			if (rule instanceof CSSLayerBlockRule) {
				visit(rule.cssRules);
				continue;
			}
			if (!(rule instanceof CSSStyleRule)) {
				continue;
			}
			// A selector list would make `className` below a lie about the rest of
			// the list, so each part is taken on its own.
			for (const part of rule.selectorText.split(',')) {
				const selector = part.trim();
				const parsed = /^\.([\w-]+)(.*)$/.exec(selector);
				if (!parsed) {
					continue;
				}
				const [, className, condition] = parsed;
				for (const property of rule.style) {
					out.push({
						className,
						condition,
						property,
						value: rule.style.getPropertyValue(property),
						selector
					});
				}
			}
		}
	};

	visit(sheet.cssRules);
	return out;
}

// The shared `setup-stylex.ts` already puts the sheet on the page; this block
// fetches its own copy because `collectRules` needs a handle on the
// `CSSStyleSheet` to walk, and the duplicate rules are byte-identical.
beforeAll(async () => {
	const style = document.createElement('style');
	style.textContent = await fetch('/virtual:stylex.css').then((res) => res.text());
	document.head.append(style);
	COMPILED = collectRules(style.sheet!);
});

/** The group element the harness rendered. */
function groupIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="group"]');
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a button group');
	}
	return el;
}

describe('ButtonGroup', () => {
	it('renders a group with aria-label', async () => {
		const screen = await render(ButtonGroupHarness, {
			props: {
				label: 'Actions',
				members: [{ label: 'Copy' }, { label: 'Cut' }, { label: 'Paste' }]
			}
		});

		const group = screen.getByRole('group');
		await expect.element(group).toBeInTheDocument();
		await expect.element(group).toHaveAttribute('aria-label', 'Actions');
	});

	it('renders all child buttons', async () => {
		const screen = await render(ButtonGroupHarness, {
			props: {
				label: 'Actions',
				members: [{ label: 'Copy' }, { label: 'Cut' }, { label: 'Paste' }]
			}
		});

		await expect
			.element(screen.getByRole('button', { name: 'Copy', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Cut', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Paste', exact: true }))
			.toBeInTheDocument();
	});

	it('works with IconButton children', async () => {
		const screen = await render(ButtonGroupHarness, {
			props: {
				label: 'Text formatting',
				members: [
					{ kind: 'icon-button', label: 'Bold', icon: 'B', iconTestId: 'bold-icon' },
					{ kind: 'icon-button', label: 'Italic', icon: 'I', iconTestId: 'italic-icon' }
				]
			}
		});

		await expect
			.element(screen.getByRole('button', { name: 'Bold', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Italic', exact: true }))
			.toBeInTheDocument();
	});

	it('applies data-testid', async () => {
		const screen = await render(ButtonGroupHarness, {
			props: { label: 'Actions', 'data-testid': 'my-group', members: [{ label: 'Copy' }] }
		});

		await expect.element(screen.getByTestId('my-group')).toBeInTheDocument();
	});

	// Counterpart to upstream's `forwards ref to the root element`; see the file
	// header. An attachment through the rest props is how a consumer reaches the
	// root here, and it receives the element rather than only proving a call.
	it('hands the root element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(ButtonGroupHarness, {
			props: {
				label: 'Actions',
				members: [{ label: 'Copy' }],
				[createAttachmentKey()]: attached
			}
		});

		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(groupIn(screen.container));
	});

	it('reflects orientation via data-orientation, not aria-orientation', async () => {
		// aria-orientation is not a valid ARIA attribute on role="group"; the
		// orientation is exposed through data-orientation instead.
		const screen = await render(ButtonGroupHarness, {
			props: { label: 'Actions', members: [{ label: 'Copy' }] }
		});

		let group = screen.getByRole('group');
		await expect.element(group).not.toHaveAttribute('aria-orientation');
		await expect.element(group).toHaveAttribute('data-orientation', 'horizontal');

		await screen.rerender({
			label: 'Actions',
			orientation: 'vertical',
			members: [{ label: 'Copy' }]
		});

		group = screen.getByRole('group');
		await expect.element(group).not.toHaveAttribute('aria-orientation');
		await expect.element(group).toHaveAttribute('data-orientation', 'vertical');
	});

	it('renders with vertical orientation', async () => {
		const screen = await render(ButtonGroupHarness, {
			props: {
				label: 'Actions',
				orientation: 'vertical',
				members: [{ label: 'Copy' }, { label: 'Cut' }]
			}
		});

		await expect.element(screen.getByRole('group')).toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Copy', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Cut', exact: true }))
			.toBeInTheDocument();
	});

	it('renders with different sizes', async () => {
		const screen = await render(ButtonGroupHarness, {
			props: { label: 'Actions', size: 'sm', members: [{ label: 'Copy' }] }
		});
		await expect
			.element(screen.getByRole('button', { name: 'Copy', exact: true }))
			.toBeInTheDocument();

		await screen.rerender({ label: 'Actions', size: 'lg', members: [{ label: 'Copy' }] });
		await expect
			.element(screen.getByRole('button', { name: 'Copy', exact: true }))
			.toBeInTheDocument();
	});

	it('disables all buttons when isDisabled is true', async () => {
		const screen = await render(ButtonGroupHarness, {
			props: {
				label: 'Actions',
				isDisabled: true,
				members: [{ label: 'Copy' }, { label: 'Cut' }]
			}
		});

		await expect.element(screen.getByRole('group')).toHaveAttribute('aria-disabled', 'true');
		await expect.element(screen.getByRole('button', { name: 'Copy', exact: true })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Cut', exact: true })).toBeDisabled();
	});

	it('does not set aria-disabled when not disabled', async () => {
		const screen = await render(ButtonGroupHarness, {
			props: { label: 'Actions', members: [{ label: 'Copy' }] }
		});

		await expect.element(screen.getByRole('group')).not.toHaveAttribute('aria-disabled');
	});

	it('renders a single button without errors', async () => {
		const screen = await render(ButtonGroupHarness, {
			props: { label: 'Actions', members: [{ label: 'Copy' }] }
		});

		await expect
			.element(screen.getByRole('button', { name: 'Copy', exact: true }))
			.toBeInTheDocument();
	});

	it('renders mixed Button and IconButton children', async () => {
		const screen = await render(ButtonGroupHarness, {
			props: {
				label: 'Edit actions',
				members: [{ label: 'Edit' }, { kind: 'icon-button', label: 'More options', icon: '▼' }]
			}
		});

		await expect
			.element(screen.getByRole('button', { name: 'Edit', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'More options', exact: true }))
			.toBeInTheDocument();
	});

	// ===========================================================================
	// Trailing radius (issue #2508)
	//
	// The trailing end cap cannot be keyed off `:last-child`: members render
	// invisible layer infrastructure AFTER their button (tooltip'd Button,
	// DropdownMenu), and useLayer renders a marker plus the layer inline when the
	// host is safe, so they steal the slot. See IS_LAST_ITEM in
	// button.stylex.ts.
	// ===========================================================================
	describe('trailing radius (#2508)', () => {
		/** The group members, in DOM order (excludes invisible layer siblings). */
		const items = (group: HTMLElement): Element[] =>
			Array.from(group.querySelectorAll(':scope > *:not([popover]):not(template)'));

		/** A rounded (non-zero) corner is exactly this value in the compiled CSS. */
		const ROUNDED = 'var(--radius-element)';

		/** The two corners on the group's trailing edge — pure geometry. */
		const TRAILING_CORNERS = {
			horizontal: ['border-end-end-radius', 'border-start-end-radius'],
			vertical: ['border-end-end-radius', 'border-end-start-radius']
		} as const;

		/** The two corners on the group's leading edge — pure geometry. */
		const LEADING_CORNERS = {
			horizontal: ['border-end-start-radius', 'border-start-start-radius'],
			vertical: ['border-start-end-radius', 'border-start-start-radius']
		} as const;

		type Orientation = keyof typeof TRAILING_CORNERS;

		/**
		 * The compiled rules that ROUND `corners` and are actually applied to `el`
		 * (its class list carries them). StyleX emits the `default: 0` class and the
		 * conditional class on every member, so this returns the same rules for any
		 * member of the group — which rule *wins* is decided by the selector, and
		 * that is what the cases below assert against the DOM.
		 */
		const roundingRules = (el: Element, corners: ReadonlyArray<string>): CompiledRule[] =>
			COMPILED.filter(
				(rule) =>
					corners.includes(rule.property) &&
					rule.value === ROUNDED &&
					el.classList.contains(rule.className)
			);

		/** The compiled selectors that round `el`'s trailing corners. */
		const trailingRoundingSelectors = (el: Element, orientation: Orientation): string[] => {
			const rules = roundingRules(el, TRAILING_CORNERS[orientation]);
			// Guard against a vacuous pass: both trailing corners must be accounted
			// for, or the assertions below would be quantifying over an empty set.
			expect(rules.map((rule) => rule.property).sort()).toEqual([...TRAILING_CORNERS[orientation]]);
			return rules.map((rule) => rule.selector);
		};

		/** Does the compiled CSS actually round `el`'s trailing corners? */
		const hasRoundedTrailingCorners = (
			el: Element,
			orientation: Orientation = 'horizontal'
		): boolean =>
			trailingRoundingSelectors(el, orientation).every((selector) => el.matches(selector));

		// -- The compiled CSS contract --------------------------------------------

		it.each(['horizontal', 'vertical'] as const)(
			'keys the trailing radius off layer-skipping, not :last-child (%s)',
			async (orientation) => {
				const screen = await render(ButtonGroupHarness, {
					props: { label: 'Actions', orientation, members: [{ label: 'Save' }] }
				});

				const save = screen.getByRole('button', { name: 'Save', exact: true }).element();
				const selectors = trailingRoundingSelectors(save, orientation);

				for (const selector of selectors) {
					// `:last-child` is the bug: an inline layer element steals the slot.
					expect(selector).not.toContain(':last-child');
					// `[popover]` and `template` must survive compilation *verbatim*.
					// StyleX only statically evaluates a selector key from a same-file
					// const; a `defineConsts` import compiles to a mangled selector like
					// `[x13pbwiz]` that matches nothing in the DOM.
					expect(selector).toContain('[popover]');
					expect(selector).toContain('template');
				}
			}
		);

		it.each(['horizontal', 'vertical'] as const)(
			'still rounds the leading corners off :first-child (%s)',
			async (orientation) => {
				const screen = await render(ButtonGroupHarness, {
					props: {
						label: 'Actions',
						orientation,
						members: [{ label: 'Save' }, { label: 'More', tooltip: 'More options' }]
					}
				});

				const save = screen.getByRole('button', { name: 'Save', exact: true }).element();
				const more = screen.getByRole('button', { name: 'More', exact: true }).element();
				const rules = roundingRules(save, LEADING_CORNERS[orientation]);

				expect(rules.map((rule) => rule.property).sort()).toEqual([
					...LEADING_CORNERS[orientation]
				]);
				for (const { condition, selector } of rules) {
					// The leading edge is genuinely safe on :first-child — a member's
					// button always precedes its own layer.
					expect(condition).toBe(':first-child');
					expect(save.matches(selector)).toBe(true);
					expect(more.matches(selector)).toBe(false);
				}
			}
		);

		// -- The compiled CSS, matched against the real DOM ------------------------

		it.each(['horizontal', 'vertical'] as const)(
			'rounds a tooltip’d trailing Button, whose layer follows it in the DOM (%s)',
			async (orientation) => {
				const screen = await render(ButtonGroupHarness, {
					props: {
						label: 'Actions',
						orientation,
						members: [{ label: 'Save' }, { label: 'More', tooltip: 'More options' }]
					}
				});

				const group = groupIn(screen.container);
				const save = screen.getByRole('button', { name: 'Save', exact: true }).element();
				const more = screen.getByRole('button', { name: 'More', exact: true }).element();

				// Precondition: the tooltip layer really is an inline DOM sibling that
				// follows the button — this is exactly what broke `:last-child`.
				expect(more).not.toBe(group.lastElementChild);
				expect(items(group).at(-1)).toBe(more);

				expect(hasRoundedTrailingCorners(more, orientation)).toBe(true);
				expect(hasRoundedTrailingCorners(save, orientation)).toBe(false);
			}
		);

		it.each(['horizontal', 'vertical'] as const)(
			'rounds a trailing DropdownMenu trigger, whose popover follows it (%s)',
			async (orientation) => {
				const screen = await render(ButtonGroupHarness, {
					props: {
						label: 'Approve action',
						orientation,
						members: [
							{ label: 'Allow once', variant: 'primary' as const },
							{
								kind: 'dropdown-menu' as const,
								label: 'Allow options',
								variant: 'primary' as const,
								items: ['Always allow']
							}
						]
					}
				});

				const group = groupIn(screen.container);
				const allow = screen.getByRole('button', { name: 'Allow once', exact: true }).element();
				const trigger = screen
					.getByRole('button', { name: 'Allow options', exact: true })
					.element();

				// The popover surface is an inline sibling after the trigger.
				expect(trigger).not.toBe(group.lastElementChild);
				expect(items(group).at(-1)).toBe(trigger);

				expect(hasRoundedTrailingCorners(trigger, orientation)).toBe(true);
				expect(hasRoundedTrailingCorners(allow, orientation)).toBe(false);
			}
		);

		it('rounds a trailing link (<a>) member with a tooltip', async () => {
			const screen = await render(ButtonGroupHarness, {
				props: {
					label: 'Actions',
					members: [
						{ label: 'Save' },
						{ label: 'Docs', href: 'https://example.com', tooltip: 'Open docs' }
					]
				}
			});

			const group = groupIn(screen.container);
			const link = screen.getByRole('link', { name: 'Docs', exact: true }).element();

			expect(link.tagName).toBe('A');
			expect(link).not.toBe(group.lastElementChild);
			expect(items(group).at(-1)).toBe(link);

			expect(hasRoundedTrailingCorners(link)).toBe(true);
		});

		// Restated: upstream's last member is a `DropdownMenu`, which is not ported.
		// A tooltip'd `Button` stands in — a trigger followed by its own `[popover]`
		// sibling, which is all the case asks of it. Every assertion is upstream's.
		it('rounds only the last member (first/middle/last)', async () => {
			const screen = await render(ButtonGroupHarness, {
				props: {
					label: 'Actions',
					members: [
						{ label: 'First' },
						{ label: 'Middle', tooltip: 'Middle tip' },
						{ label: 'Last', tooltip: 'An option' }
					]
				}
			});

			const group = groupIn(screen.container);
			const [first, middle, last] = items(group);

			// `.trim()` is the one departure: `Button` renders a visually hidden live
			// region for its loading state, which contributes an empty text node.
			expect([first, middle, last].map((el) => el.textContent?.trim())).toEqual([
				'First',
				'Middle',
				'Last'
			]);

			// Middle has a tooltip layer after it, but a *marked* sibling follows too,
			// so it must NOT take the trailing radius.
			expect(hasRoundedTrailingCorners(first)).toBe(false);
			expect(hasRoundedTrailingCorners(middle)).toBe(false);
			expect(hasRoundedTrailingCorners(last)).toBe(true);
		});

		it('rounds both edges of a lone tooltip’d member', async () => {
			const screen = await render(ButtonGroupHarness, {
				props: {
					label: 'Actions',
					members: [{ label: 'Only', tooltip: 'The only one' }]
				}
			});

			const only = screen.getByRole('button', { name: 'Only', exact: true }).element();

			// Leading edge is unaffected: a member's button always precedes its layer.
			expect(only.matches(':first-child')).toBe(true);
			expect(hasRoundedTrailingCorners(only)).toBe(true);
		});

		// -- Members the group does not recognise ---------------------------------
		//
		// The trailing predicate must stay CONSERVATIVE: a sibling the group does
		// not understand is still a member. Otherwise the button BEFORE it wrongly
		// takes the trailing radius and renders as a rounded notch mid-group —
		// worse than the bug being fixed, because it is silent and visual.

		it('does not round the preceding button when a Tooltip-wrapped member follows', async () => {
			const screen = await render(ButtonGroupHarness, {
				props: {
					label: 'Actions',
					members: [
						{ label: 'Save' },
						{ kind: 'tooltip-wrapped', label: 'More', content: 'Rich tip' }
					]
				}
			});

			const save = screen.getByRole('button', { name: 'Save', exact: true }).element();

			// Tooltip wraps element children in a `display: contents` <div>, so the
			// inner Button is a DESCENDANT of the wrapper, not a DOM sibling of Save.
			expect(hasRoundedTrailingCorners(save)).toBe(false);
		});

		it('does not round the preceding button when a HoverCard-wrapped member follows', async () => {
			const screen = await render(ButtonGroupHarness, {
				props: {
					label: 'Actions',
					members: [
						{ label: 'Save' },
						{ kind: 'hover-card-wrapped', label: 'More', content: 'Preview' }
					]
				}
			});

			const save = screen.getByRole('button', { name: 'Save', exact: true }).element();

			// Button has no `hoverCard` prop, so wrapping is the ONLY way to put a
			// HoverCard on a group button — this composition has no alternative.
			expect(hasRoundedTrailingCorners(save)).toBe(false);
		});

		it('does not round the preceding button when a raw <button> follows', async () => {
			const screen = await render(ButtonGroupHarness, {
				props: {
					label: 'Actions',
					members: [{ label: 'Save' }, { kind: 'raw', label: 'Custom' }]
				}
			});

			const save = screen.getByRole('button', { name: 'Save', exact: true }).element();

			expect(hasRoundedTrailingCorners(save)).toBe(false);
		});
	});

	describe('elevation', () => {
		it('renders a distinct class on the group for each elevation level', async () => {
			const classFor = async (elevation: 'none' | 'low' | 'med' | 'high'): Promise<string> => {
				const screen = await render(ButtonGroupHarness, {
					props: { label: 'Actions', elevation, members: [{ label: 'One' }, { label: 'Two' }] }
				});
				return screen.container.querySelector('[role="group"]')!.className;
			};
			const classes = new Set([
				await classFor('none'),
				await classFor('low'),
				await classFor('med'),
				await classFor('high')
			]);
			expect(classes.size).toBe(4);
		});

		it('defaults to flat (elevation none)', async () => {
			const def = await render(ButtonGroupHarness, {
				props: { label: 'Actions', members: [{ label: 'One' }] }
			});
			const none = await render(ButtonGroupHarness, {
				props: { label: 'Actions', elevation: 'none', members: [{ label: 'One' }] }
			});
			expect(def.container.querySelector('[role="group"]')!.className).toBe(
				none.container.querySelector('[role="group"]')!.className
			);
		});
	});
});
