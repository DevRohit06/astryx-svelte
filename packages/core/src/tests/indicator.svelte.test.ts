import { describe, expect, it } from 'vitest';
import { createRawSnippet, type Component } from 'svelte';
import { render } from 'vitest-browser-svelte';
import CheckIndicator from '$lib/components/indicator/check-indicator.svelte';
import CheckboxIndicator from '$lib/components/indicator/checkbox-indicator.svelte';
import RadioIndicator from '$lib/components/indicator/radio-indicator.svelte';
import type { CheckIndicatorProps } from '$lib/components/indicator/check-indicator.svelte';
import type { CheckboxIndicatorProps } from '$lib/components/indicator/checkbox-indicator.svelte';
import { getIndicator } from '$lib/components/indicator/indicator-registry.js';
import { defineTheme } from '$lib/theme/define-theme.js';
import BrandCheckbox from './fixtures/brand-checkbox-indicator.svelte';
import UseIndicatorProbe from './fixtures/use-indicator-probe.svelte';
import UseIndicatorThemeProbe from './fixtures/use-indicator-theme-probe.svelte';

/**
 * Astryx's `Indicator/Indicator.test.tsx` at the **0.5.0** pin, which declares **20**
 * `it`s — five of them inside `for` loops, so the 20 declarations run as 40
 * cases. **All 20 are here**, in upstream's order, under upstream's titles
 * except where a restatement made the title a lie (named below).
 *
 * A **client** file: every case renders, and three of them assert on classes a
 * real browser has to have applied.
 *
 * This port has no single `Indicator` component — upstream's `Indicator/`
 * directory is the unit, and its three components (`CheckIndicator`,
 * `CheckboxIndicator`, `RadioIndicator`) plus `useIndicator` are what this suite
 * covers, exactly as upstream's file does.
 *
 * ## Nothing dropped, and nothing added
 *
 * ## Restated — two cases
 *
 * **`draws the mark when checked and nothing when not`** keeps upstream's title
 * and its first three assertions; its `toBeEmptyDOMElement()` becomes "no
 * element children and no text". The matcher ignores comments but counts text
 * nodes, and Svelte 5's `mount()` leaves two empty ones as anchors beside the
 * `{#if}` block's comment — so it cannot pass for any Svelte mount, empty or
 * not. The replacement asserts what the matcher means.
 *
 * **`cannot reject a hyphenated a11y attribute — TS exempts those`** is here as
 * **`rejects a hyphenated a11y attribute — Svelte has no JSX exemption`**.
 * TypeScript's exemption from excess-property checking is for *JSX attribute
 * names*; there is no JSX here, so Svelte checks a literal `aria-label` against
 * the props type like any other object member and `IndicatorProps`' `Omit`
 * catches it. Keeping upstream's title over the opposite assertion would have
 * been the misleading choice. The `@ts-expect-error` pins the direction, so the
 * case fails the day the prop stops being rejected — which is upstream's own
 * reason for writing it. (Upstream's title is the only one changed in this
 * file.)
 *
 * ## Counterparts — same question, different mechanism
 *
 * - **`rejects role and tabIndex at compile time`** asserts against object
 *   literals annotated with the props types rather than against JSX elements.
 *   Same mechanism TypeScript uses either way (excess-property checking on a
 *   fresh object literal); Svelte just has no element expression to hang it on.
 *   `tabIndex` is `tabindex` here, because Svelte's attribute names are the
 *   HTML ones.
 * - **`treats 0 as content, not as empty`** passes a *snippet whose output is
 *   the character `0`*. Upstream's `children={0}` has no Svelte form —
 *   `children` is a `Snippet`, not a node — but the hazard it names survives
 *   the translation intact: content that looks empty is still content and must
 *   replace the mark. Upstream's two assertions are unchanged.
 * - **`useIndicator`'s two cases** read `render(...).component.current()` where
 *   upstream reads `renderHook(...).result.current`. There is no `renderHook`
 *   here; a probe fixture runs the hook at init and relays the result through an
 *   instance export, and the second case's `wrapper` is a fixture that nests the
 *   probe under a `<Theme>`. Both keep upstream's `toBe(...)` identity
 *   assertions.
 *
 * ## Two mechanical substitutions, applied throughout
 *
 * - `className` → `class`, which is the prop Svelte spreads onto an element.
 * - `document.querySelector` → `container.querySelector`. Upstream reaches for
 *   the document in four places; scoping to the render is the same query with
 *   one fewer way to pass on a leaked node.
 *
 * ## About the `#4893` block
 *
 * Upstream's bug was a `!= null` guard letting `children={isBusy && <Spinner/>}`
 * take the children branch with `false` in hand and delete the state mark. A
 * Svelte snippet has no falsy-but-present form, so `{#if children}` is the
 * correct guard here and `isRenderable` was never ported (see the note on
 * `IndicatorProps.children`). The 15 cases are ported anyway, values and titles
 * unchanged: a host *can* write `children={isBusy && spinner}` in JavaScript,
 * and the block is what stops the guard being tightened to `!== undefined`,
 * which would take the children branch on `false`/`null`/`''` and throw on
 * `{@render children()}`. Mutation-checked in exactly that form.
 */

/** Upstream's `<span data-testid="busy" />` — a real child, in snippet form. */
const busy = createRawSnippet(() => ({
	render: () => '<span data-testid="busy"></span>'
}));

/**
 * A snippet whose rendered output is the character `0` — the Svelte counterpart
 * of upstream's `children={0}`.
 */
const zero = createRawSnippet(() => ({ render: () => '<span>0</span>' }));

/**
 * Any of the three indicators, for the blocks upstream writes as a `cases`
 * array. `any` rather than a concrete props type: assignability for a component
 * is contravariant in its props, so the only type that accepts every one of
 * them is the one assignable to all of them.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyIndicator = Component<any>;

/**
 * Upstream's `render(<X {...p} />)`. The props are loose on purpose: the #4893
 * and #4918 blocks pass values the props type forbids, which is precisely what
 * they exist to test.
 */
function renderIndicator(component: AnyIndicator, props: Record<string, unknown>) {
	return render(component, { props });
}

describe('default indicators', () => {
	it('renders the checkbox theme target with state and size', async () => {
		const screen = await render(CheckboxIndicator, {
			props: { state: 'indeterminate', size: 'sm' }
		});

		const box = screen.container.querySelector('.astryx-checkbox');
		expect(box).toBeInTheDocument();
		expect(box).toHaveAttribute('data-checked', 'indeterminate');
		expect(box).toHaveAttribute('data-size', 'sm');
		// Decorative: the owning control keeps the role and accessible name.
		expect(box).toHaveAttribute('aria-hidden', 'true');
	});

	it('renders the radio dot only when checked, in both states', async () => {
		const screen = await render(RadioIndicator, { props: { state: 'unchecked' } });

		// The circle draws in the unchecked state — this is what lets a radio act
		// as a selection indicator where an icon would render nothing.
		expect(screen.container.querySelector('.astryx-radio')).toBeInTheDocument();
		expect(screen.container.querySelector('.astryx-radio-dot')).not.toBeInTheDocument();

		await screen.rerender({ state: 'checked' });
		expect(screen.container.querySelector('.astryx-radio-dot')).toBeInTheDocument();
		expect(screen.container.querySelector('.astryx-radio')).toHaveAttribute(
			'data-checked',
			'checked'
		);
	});

	it('renders children instead of the state mark', async () => {
		const screen = await render(CheckboxIndicator, {
			props: { state: 'checked', children: busy }
		});

		expect(screen.container.querySelector('[data-testid="busy"]')).toBeInTheDocument();
	});

	it('reflects the disabled state for theme targeting', async () => {
		const screen = await render(RadioIndicator, {
			props: { state: 'checked', isDisabled: true }
		});

		expect(screen.container.querySelector('.astryx-radio')).toHaveAttribute(
			'data-disabled',
			'disabled'
		);
	});
});

/**
 * CheckIndicator is the one indicator that draws nothing in a state, which is
 * what makes it the default selection mark — and what made its two escape
 * hatches (props and children) easy to get wrong. Both are pinned here.
 */
describe('CheckIndicator', () => {
	it('draws the mark when checked and nothing when not', async () => {
		const screen = await render(CheckIndicator, { props: { state: 'checked' } });

		const mark = screen.container.querySelector('.astryx-icon');
		expect(mark).toBeInTheDocument();
		expect(mark).toHaveAttribute('aria-hidden', 'true');

		await screen.rerender({ state: 'unchecked' });
		// No empty box beside an unchosen row — the reason a check is the default.
		//
		// RESTATED from upstream's `toBeEmptyDOMElement()`, which cannot pass for
		// ANY Svelte 5 mount: the matcher counts every non-comment child, and
		// `mount()` leaves two empty text nodes as anchors beside the `{#if}`
		// block's comment. All three serialise to `<!---->`, so the failure reads
		// as content that is not there. What upstream's matcher *means* is
		// "nothing rendered", and that is what these two assert.
		expect(screen.container.children).toHaveLength(0);
		expect(screen.container.textContent).toBe('');
	});

	it('renders children INSTEAD of the mark, in both states', async () => {
		// A host shows a pending Spinner through `children` in whatever state the
		// row is in, and an unchosen row is the common one. The unchecked case
		// used to render nothing at all.
		for (const state of ['checked', 'unchecked'] as const) {
			const screen = await render(CheckIndicator, { props: { state, children: busy } });

			expect(
				screen.container.querySelector('[data-testid="busy"]'),
				`state=${state}`
			).toBeInTheDocument();
			// The mark is replaced, not accompanied.
			expect(screen.container.querySelector('.astryx-icon')).not.toBeInTheDocument();
			await screen.unmount();
		}
	});

	it('forwards caller props and styling on both render paths', async () => {
		// Same contract whether or not children are present: a data-testid, an id
		// and an xstyle-driven class must survive either branch.
		const screen = await render(CheckIndicator, {
			props: { state: 'checked', 'data-testid': 'mark', id: 'pinned' }
		});

		expect(screen.container.querySelector('[data-testid="mark"]')).toHaveAttribute('id', 'pinned');

		await screen.rerender({
			state: 'checked',
			'data-testid': 'mark',
			id: 'pinned',
			class: 'host-target',
			children: busy
		});

		const withChildren = screen.container.querySelector('[data-testid="mark"]');
		expect(withChildren).toHaveAttribute('id', 'pinned');
		expect(withChildren).toHaveClass('host-target');
		expect(withChildren).toHaveAttribute('aria-hidden', 'true');
		expect(screen.container.querySelector('[data-testid="busy"]')).toBeInTheDocument();
	});
});

/**
 * The busy idiom a host actually writes is `children={isBusy && spinner}`,
 * which passes `false` when it is not busy. `false` is non-null and is not
 * caught by `??`, so both a `!= null` guard and a `children ?? mark` fallback
 * take the children path, render nothing in it, and delete the state mark
 * (#4893). Every indicator gets the same case, because all three had the bug.
 */
describe('falsy children never suppress the state mark (#4893)', () => {
	const cases = [
		{
			name: 'CheckIndicator',
			component: CheckIndicator as AnyIndicator,
			markSelector: '.astryx-icon'
		},
		{
			name: 'CheckboxIndicator',
			component: CheckboxIndicator as AnyIndicator,
			markSelector: 'svg'
		},
		{
			name: 'RadioIndicator',
			component: RadioIndicator as AnyIndicator,
			markSelector: '.astryx-radio-indicator-dot'
		}
	] as const;

	// Everything Svelte renders as nothing. `0` is deliberately absent: it is
	// handled by its own case below, because a snippet is the only shape
	// `children` takes here and a snippet is never falsy.
	const emptyValues = [
		['false — the `isBusy && …` idiom', false],
		['null', null],
		['undefined', undefined],
		['empty string', '']
	] as const;

	for (const { name, component, markSelector } of cases) {
		for (const [label, child] of emptyValues) {
			it(`${name} keeps its mark when children is ${label}`, async () => {
				const screen = await renderIndicator(component, {
					state: 'checked',
					children: child
				});

				expect(
					screen.container.querySelector(markSelector),
					`${name} lost its mark to a falsy child`
				).toBeInTheDocument();
			});
		}

		it(`${name} still lets real children replace the mark`, async () => {
			// The negative control: without this, "always render the mark" would
			// pass every case above and break the busy state instead.
			const screen = await renderIndicator(component, { state: 'checked', children: busy });

			expect(screen.container.querySelector('[data-testid="busy"]')).toBeInTheDocument();
			expect(screen.container.querySelector(markSelector)).not.toBeInTheDocument();
		});
	}

	it('treats 0 as content, not as empty', async () => {
		// A COUNTERPART to upstream's `children={0}`: `children` is a `Snippet`
		// here, so the falsy-looking content that must still replace the mark is a
		// snippet whose *output* is the character "0". Upstream's assertions are
		// unchanged.
		const screen = await render(CheckIndicator, {
			props: { state: 'checked', children: zero }
		});

		expect(screen.container.textContent).toBe('0');
		expect(screen.container.querySelector('.astryx-icon')).not.toBeInTheDocument();
	});
});

/**
 * An indicator is decorative BY CONTRACT: the owning control supplies the role
 * and the accessible name, so an indicator that is also announced says the same
 * thing twice (#4918).
 *
 * The contract is held in two places, because neither covers the whole thing:
 *
 *   - `IndicatorProps` omits the a11y props, which makes `role`, `tabindex` and
 *     — unlike upstream — `aria-hidden`/`aria-label` compile errors. Svelte has
 *     no JSX, so TypeScript's exemption for hyphenated JSX attribute names does
 *     not apply and the `Omit` catches every literal. A SPREAD still gets
 *     through, here as there, which is the third case below.
 *   - So each component emits its own `aria-hidden` AFTER `{...rest}`, which is
 *     what actually keeps a caller from un-hiding it. Nothing is stripped.
 */
describe('the decorative contract (#4918)', () => {
	it('rejects `role` and `tabIndex` at compile time', () => {
		// A COUNTERPART to upstream's two rejected JSX elements: the same
		// excess-property check, on an object literal annotated with the props
		// type, because Svelte has no element expression to annotate. `tabIndex`
		// is `tabindex` here — Svelte's prop names are the HTML attribute names.
		//
		// The element is unconditionally aria-hidden, so a tab stop on it is a
		// focusable node in a hidden subtree (axe `aria-hidden-focus`).

		// @ts-expect-error — the owning control holds the role.
		const withRole: CheckIndicatorProps = { state: 'checked', role: 'checkbox' };
		// @ts-expect-error — the owning control holds the focus.
		const withTabIndex: CheckboxIndicatorProps = { state: 'checked', tabindex: 0 };
		const rejected = [withRole, withTabIndex];

		expect(rejected).toHaveLength(2);
	});

	it('rejects a hyphenated a11y attribute — Svelte has no JSX exemption', () => {
		// RESTATED from upstream's `cannot reject a hyphenated a11y attribute — TS
		// exempts those`, and the inversion IS the finding. TypeScript exempts JSX
		// *attribute names* that are not valid JS identifiers from
		// excess-property checking; a Svelte component's props are an ordinary
		// object literal, which has no such exemption, so the `Omit` rejects this
		// too. Runtime order still settles it regardless — see the two loops
		// below — but the type reaches further here than it does upstream.

		// @ts-expect-error — the owning control holds the accessible name.
		const rejected: CheckIndicatorProps = { state: 'checked', 'aria-label': 'inert' };

		expect(rejected).toBeTruthy();
	});

	it('cannot reject a SPREAD either — which is the ordinary host idiom', () => {
		// No `@ts-expect-error`, deliberately, and this half is upstream's
		// unchanged. A spread bypasses excess-property checking for every member,
		// so even `role` and `tabindex` — the two the type catches as literals —
		// get through this way.
		//
		// Left alone on purpose. Nothing in the repo spreads a hostile object at an
		// indicator, `aria-hidden` is settled by attribute order regardless, and a
		// forwarded `role`/`aria-label` is inert inside a hidden subtree. Guarding
		// it at runtime would cost a module to defend a case no call site reaches.
		const hostile = { role: 'checkbox', tabindex: 0 };
		const accepted: CheckIndicatorProps = { state: 'checked', ...hostile };

		expect(accepted).toBeTruthy();
	});

	const cases = [
		{
			name: 'CheckIndicator (glyph path)',
			component: CheckIndicator as AnyIndicator,
			extra: {} as Record<string, unknown>
		},
		{
			// Upstream passes `<b />`; any real child takes the same branch.
			name: 'CheckIndicator (children path)',
			component: CheckIndicator as AnyIndicator,
			extra: { children: busy } as Record<string, unknown>
		},
		{
			name: 'CheckboxIndicator',
			component: CheckboxIndicator as AnyIndicator,
			extra: {} as Record<string, unknown>
		},
		{
			name: 'RadioIndicator',
			component: RadioIndicator as AnyIndicator,
			extra: {} as Record<string, unknown>
		}
	];

	for (const { name, component, extra } of cases) {
		it(`${name} stays aria-hidden even when a caller passes false`, async () => {
			const screen = await renderIndicator(component, {
				state: 'checked',
				...extra,
				'aria-hidden': 'false'
			});

			expect(screen.container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
		});

		it(`${name} still forwards ordinary props`, async () => {
			// The negative control: order must not turn into "drop everything".
			const screen = await renderIndicator(component, {
				state: 'checked',
				...extra,
				'data-testid': 'ind',
				id: 'pinned',
				dir: 'rtl'
			});
			const el = screen.container.firstElementChild;

			expect(el).toHaveAttribute('data-testid', 'ind');
			expect(el).toHaveAttribute('id', 'pinned');
			expect(el).toHaveAttribute('dir', 'rtl');
		});
	}
});

describe('useIndicator', () => {
	it('returns the built-in indicator without a theme override', async () => {
		const screen = await render(UseIndicatorProbe, { props: { name: 'checkbox' } });

		expect(screen.component.current()).toBe(CheckboxIndicator);
	});

	it('resolves an indicator component from the nearest theme', async () => {
		const theme = defineTheme({
			name: 'brand-indicators',
			indicators: { checkbox: BrandCheckbox }
		});

		const screen = await render(UseIndicatorThemeProbe, {
			props: { theme, name: 'checkbox' }
		});

		expect(screen.component.current()).toBe(BrandCheckbox);
		// Unmapped indicators keep the built-in.
		expect(getIndicator('radio', theme)).toBe(RadioIndicator);
	});
});

/**
 * A theme target is public API. Renaming one to follow the
 * `<component>-kebab` convention (`checkbox` → `checkbox-indicator`) would
 * silently break every theme styling the old name — the CSS still compiles, it
 * just stops matching. So both names are emitted for a deprecation window, and
 * these tests pin that promise from both ends: the new name exists, and the
 * old one has not quietly disappeared.
 */
describe('renamed theme targets stay non-breaking', () => {
	const cases = [
		{
			name: 'CheckboxIndicator',
			component: CheckboxIndicator as AnyIndicator,
			current: 'astryx-checkbox-indicator',
			legacy: 'astryx-checkbox'
		},
		{
			name: 'RadioIndicator',
			component: RadioIndicator as AnyIndicator,
			current: 'astryx-radio-indicator',
			legacy: 'astryx-radio'
		}
	] as const;

	for (const { name, component, current, legacy } of cases) {
		it(`${name} emits both the current and the legacy target`, async () => {
			const screen = await renderIndicator(component, { state: 'checked' });
			const el = screen.container.querySelector(`.${current}`);
			expect(el, `${name} should render ${current}`).toBeInTheDocument();
			expect(el, `${name} must keep emitting ${legacy}`).toHaveClass(legacy);
		});
	}

	it('keeps the legacy dot target on the radio mark', async () => {
		const screen = await render(RadioIndicator, { props: { state: 'checked' } });
		const dot = screen.container.querySelector('.astryx-radio-indicator-dot');
		expect(dot).toBeInTheDocument();
		expect(dot).toHaveClass('astryx-radio-dot');
	});

	it('puts both names on ONE element, so either selector wins equally', async () => {
		// If the legacy class were moved to a wrapper instead, an old theme's
		// rules would land on a different box than a new theme's — same-element
		// is what makes the two names interchangeable.
		const screen = await render(CheckboxIndicator, { props: { state: 'unchecked' } });
		expect(screen.container.querySelectorAll('.astryx-checkbox')).toHaveLength(1);
		expect(screen.container.querySelector('.astryx-checkbox')).toBe(
			screen.container.querySelector('.astryx-checkbox-indicator')
		);
	});
});
