/** NO-UPSTREAM: coverage beyond upstream — the header below says why. */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { sx } from '$lib/internal/sx.js';
import {
	inputStatusHoverShadowStyles,
	inputWrapperStyles
} from '$lib/components/field/input-styles.stylex.js';
import DateInput from '$lib/components/date-input/date-input.svelte';
import DateRangeInput from '$lib/components/date-range-input/date-range-input.svelte';
import DateTimeInput from '$lib/components/date-time-input/date-time-input.svelte';
import MultiSelector from '$lib/components/multi-selector/multi-selector.svelte';
import NumberInput from '$lib/components/number-input/number-input.svelte';
import Selector from '$lib/components/selector/selector.svelte';
import TextArea from '$lib/components/text-area/text-area.svelte';
import TextInput from '$lib/components/text-input/text-input.svelte';
import TimeInput from '$lib/components/time-input/time-input.svelte';
import Tokenizer from '$lib/components/tokenizer/tokenizer.svelte';
import Typeahead from '$lib/components/typeahead/typeahead.svelte';
import type { SearchSource } from '$lib/components/typeahead/types.js';

/**
 * **No upstream counterpart, and the bar for that is met here — but by a
 * different route than the other two files in this class, so it is spelled out.**
 *
 * Upstream has no case for this. Its own guard is written inline in the JSX:
 * `stylex.props(..., statusType && !isDisabled && hoverShadow[statusType], ...)`
 * sits three lines above the markup it styles, in the component file, where a
 * reviewer diffing `TextInput.tsx` reads it as part of the element.
 *
 * This port cannot write it there. StyleX may not be imported from a `.svelte`
 * file at all — the bundler plugin Babel-parses any module that imports it and
 * would read Svelte markup as JSX — so every one of those argument lists is
 * *relocated* into a `.stylex.ts` module behind an `attrs()` function whose
 * conditionals become re-typed boolean parameters. That relocation is forced by
 * the toolchain, it is where the guard was lost, and it has no upstream
 * analogue: there is no extracted module upstream for a transcription to drift
 * from, so no upstream case can exist for a ported suite to inherit.
 *
 * The compensating gate this repo built for exactly that relocation — the class
 * oracle — is **provably blind to it**. The oracle compiles our `stylex.create`
 * calls and diffs the emitted atomic classes against upstream's published ones;
 * it never evaluates an `attrs()` function, so the argument list is not part of
 * what it compares. That is not a theory: an agent inverted this guard in
 * `text-input.stylex.ts` and the oracle reported 0 mismatches and exit 0. A
 * rendered-DOM assertion is the only mechanism in the repo that can see it.
 *
 * ## What each case asserts
 *
 * Dropping `!isDisabled` puts the error hover ring back on a disabled control,
 * and it does so in **every** component here — including `Typeahead`, whose
 * `typeaheadWrapperAttrs` declares `inputWrapperStyles.disabled` *after* the
 * status entry. That was checked rather than assumed, and it contradicts the
 * mechanism written into `tokenizer.stylex.ts`'s comment ("styleq merges by key
 * last-wins wholesale"): styleq keys a conditional declaration separately from
 * an unconditional one, so `inputWrapperStyles.disabled`'s flat
 * `boxShadow: 'none'` only ever replaces the *default* key and never touches the
 * ring's `:hover:not(:focus-within)` one. Declaration order is therefore
 * irrelevant, and the guard is load-bearing at all thirteen sites, not just the
 * twelve where `disabled` happens to come first. (Verified by deleting the guard
 * from `typeahead.stylex.ts` alone: its case goes red.)
 *
 * Each case renders twice and asserts both directions. The enabled render is a
 * positive control: it proves the class the case is hunting for is the right
 * one and that the selector found the bordered wrapper, so a "lacks the ring"
 * assertion can never pass by looking at the wrong element.
 *
 * The wrapper is located by its **stable theme class** (`.astryx-text-input`),
 * which is published API that theme packages already compile against — not by a
 * StyleX hash, which would make the test a restatement of the implementation.
 *
 * Mutation-checked three ways: dropping the guard at all thirteen sites fails
 * all eighteen cases; inverting it at all thirteen fails all eighteen (through
 * the positive controls); and dropping it at *one* site alone — tried on
 * `tokenizer.stylex.ts`'s layer-placeholder site and on `typeahead.stylex.ts` —
 * fails exactly that site's case and nothing else. The last is the one that
 * matters: it says the cases are sensitive per call site rather than only in
 * aggregate, and that the two tokenizer wrappers really are told apart.
 */

const noop = (): void => {};
const status = { type: 'error' } as const;

const searchSource: SearchSource = {
	search: () => [{ id: '1', label: 'Alice' }],
	bootstrap: () => [{ id: '1', label: 'Alice' }]
};

const options = [
	{ value: 'apple', label: 'Apple' },
	{ value: 'banana', label: 'Banana' }
];

/** The atomic classes the disabled variant contributes, including its `boxShadow: none`. */
const disabledClasses = sx(inputWrapperStyles.disabled).class.split(' ').filter(Boolean);

/**
 * The atomic classes that belong to the error hover ring **and to nothing else**.
 *
 * Both `inputStatusHoverShadowStyles.error` and `inputWrapperStyles.disabled`
 * declare `boxShadow: 'none'` for the unconditional case, and StyleX hashes a
 * declaration, not its source — so they share that class exactly. Looking for it
 * would report a ring on every disabled wrapper in the package. What identifies
 * the ring is its `:hover:not(:focus-within)` declaration, which nothing else in
 * these lists emits.
 */
const errorRingClasses = sx(inputStatusHoverShadowStyles.error)
	.class.split(' ')
	.filter((name) => name !== '' && !disabledClasses.includes(name));

function wrapperIn(container: HTMLElement, selector: string): HTMLElement {
	const el = container.querySelector(selector);
	if (!(el instanceof HTMLElement)) {
		throw new Error(`no bordered wrapper matching ${selector}`);
	}
	return el;
}

function hasErrorRing(el: HTMLElement): boolean {
	const classes = new Set((el.getAttribute('class') ?? '').split(/\s+/));
	return errorRingClasses.some((name) => classes.has(name));
}

interface Subject {
	/** Component name, for the case title. */
	name: string;
	/** The stable theme class the bordered surface carries. */
	selector: string;
	/** `status="error"`, interactive. */
	enabled: () => Promise<{ container: HTMLElement; unmount: () => Promise<void> }>;
	/** `status="error"`, plus whatever makes the control non-interactive. */
	suppressed: () => Promise<{ container: HTMLElement; unmount: () => Promise<void> }>;
}

const disabledSubjects: Subject[] = [
	{
		name: 'TextInput',
		selector: '.astryx-text-input',
		enabled: () =>
			render(TextInput, { props: { label: 'Name', value: '', onChange: noop, status } }),
		suppressed: () =>
			render(TextInput, {
				props: { label: 'Name', value: '', onChange: noop, status, isDisabled: true }
			})
	},
	{
		name: 'TextArea',
		selector: '.astryx-textarea',
		enabled: () =>
			render(TextArea, { props: { label: 'Notes', value: '', onChange: noop, status } }),
		suppressed: () =>
			render(TextArea, {
				props: { label: 'Notes', value: '', onChange: noop, status, isDisabled: true }
			})
	},
	{
		name: 'NumberInput',
		selector: '.astryx-number-input',
		enabled: () =>
			render(NumberInput, { props: { label: 'Qty', value: null, onChange: noop, status } }),
		suppressed: () =>
			render(NumberInput, {
				props: { label: 'Qty', value: null, onChange: noop, status, isDisabled: true }
			})
	},
	{
		name: 'TimeInput',
		selector: '.astryx-time-input',
		enabled: () => render(TimeInput, { props: { label: 'Time', onChange: noop, status } }),
		suppressed: () =>
			render(TimeInput, { props: { label: 'Time', onChange: noop, status, isDisabled: true } })
	},
	{
		name: 'Selector',
		selector: '.astryx-selector',
		enabled: () => render(Selector, { props: { label: 'Fruit', options, status } }),
		suppressed: () =>
			render(Selector, { props: { label: 'Fruit', options, status, isDisabled: true } })
	},
	{
		name: 'MultiSelector',
		selector: '.astryx-multi-selector',
		enabled: () =>
			render(MultiSelector, {
				props: { label: 'Fruit', options, value: [], onChange: noop, status }
			}),
		suppressed: () =>
			render(MultiSelector, {
				props: { label: 'Fruit', options, value: [], onChange: noop, status, isDisabled: true }
			})
	},
	{
		name: 'Tokenizer',
		selector: '.astryx-tokenizer',
		enabled: () =>
			render(Tokenizer, {
				props: { label: 'Members', searchSource, value: [], onChange: noop, status }
			}),
		suppressed: () =>
			render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource,
					value: [],
					onChange: noop,
					status,
					isDisabled: true
				}
			})
	},
	{
		// The second of `tokenizer.stylex.ts`'s two guard sites: the in-flow
		// placeholder `unfocusedLayer` mode leaves behind while the real wrapper is
		// promoted into the top layer. It composes the same list separately, so it
		// can drift separately.
		name: 'Tokenizer (unfocusedLayer placeholder)',
		selector: '.astryx-tokenizer',
		enabled: () =>
			render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource,
					value: [],
					onChange: noop,
					status,
					tokenOverflowBehavior: 'unfocusedLayer' as const
				}
			}),
		suppressed: () =>
			render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource,
					value: [],
					onChange: noop,
					status,
					isDisabled: true,
					tokenOverflowBehavior: 'unfocusedLayer' as const
				}
			})
	},
	{
		name: 'DateInput',
		selector: '.astryx-date-input',
		enabled: () => render(DateInput, { props: { label: 'Date', onChange: noop, status } }),
		suppressed: () =>
			render(DateInput, { props: { label: 'Date', onChange: noop, status, isDisabled: true } })
	},
	{
		name: 'DateRangeInput',
		selector: '.astryx-date-range-input',
		enabled: () =>
			render(DateRangeInput, { props: { label: 'Range', value: null, onChange: noop, status } }),
		suppressed: () =>
			render(DateRangeInput, {
				props: { label: 'Range', value: null, onChange: noop, status, isDisabled: true }
			})
	},
	{
		name: 'DateTimeInput (date segment)',
		selector: '.astryx-date-time-input-date-segment',
		enabled: () => render(DateTimeInput, { props: { label: 'When', onChange: noop, status } }),
		suppressed: () =>
			render(DateTimeInput, { props: { label: 'When', onChange: noop, status, isDisabled: true } })
	},
	{
		name: 'DateTimeInput (time segment)',
		selector: '.astryx-date-time-input-time-segment',
		enabled: () => render(DateTimeInput, { props: { label: 'When', onChange: noop, status } }),
		suppressed: () =>
			render(DateTimeInput, { props: { label: 'When', onChange: noop, status, isDisabled: true } })
	},
	{
		name: 'Typeahead',
		selector: '.astryx-typeahead',
		enabled: () =>
			render(Typeahead, {
				props: { label: 'Fruit', searchSource, value: null, onChange: noop, status }
			}),
		suppressed: () =>
			render(Typeahead, {
				props: {
					label: 'Fruit',
					searchSource,
					value: null,
					onChange: noop,
					status,
					isDisabled: true
				}
			})
	}
];

/**
 * The three date components guard on `isEffectivelyDisabled`, which is
 * `isDisabled || isBusy` — so a suite keyed only on `isDisabled` would leave
 * half the predicate untested, and a regression that dropped the `isBusy` term
 * would pass every case above.
 */
const busySubjects: Subject[] = [
	{
		name: 'DateInput',
		selector: '.astryx-date-input',
		enabled: () => render(DateInput, { props: { label: 'Date', onChange: noop, status } }),
		suppressed: () =>
			render(DateInput, { props: { label: 'Date', onChange: noop, status, isLoading: true } })
	},
	{
		name: 'DateRangeInput',
		selector: '.astryx-date-range-input',
		enabled: () =>
			render(DateRangeInput, { props: { label: 'Range', value: null, onChange: noop, status } }),
		suppressed: () =>
			render(DateRangeInput, {
				props: { label: 'Range', value: null, onChange: noop, status, isLoading: true }
			})
	},
	{
		name: 'DateTimeInput (date segment)',
		selector: '.astryx-date-time-input-date-segment',
		enabled: () => render(DateTimeInput, { props: { label: 'When', onChange: noop, status } }),
		suppressed: () =>
			render(DateTimeInput, { props: { label: 'When', onChange: noop, status, isLoading: true } })
	},
	{
		name: 'DateTimeInput (time segment)',
		selector: '.astryx-date-time-input-time-segment',
		enabled: () => render(DateTimeInput, { props: { label: 'When', onChange: noop, status } }),
		suppressed: () =>
			render(DateTimeInput, { props: { label: 'When', onChange: noop, status, isLoading: true } })
	}
];

async function assertRingSuppressed(subject: Subject): Promise<void> {
	const enabled = await subject.enabled();
	// Positive control — see the header.
	expect(hasErrorRing(wrapperIn(enabled.container, subject.selector))).toBe(true);
	await enabled.unmount();

	const suppressed = await subject.suppressed();
	expect(hasErrorRing(wrapperIn(suppressed.container, subject.selector))).toBe(false);
	await suppressed.unmount();
}

describe('input status hover ring — isDisabled', () => {
	for (const subject of disabledSubjects) {
		it(`${subject.name} drops the status hover ring while disabled`, async () => {
			await assertRingSuppressed(subject);
		});
	}
});

describe('input status hover ring — isBusy (isEffectivelyDisabled)', () => {
	for (const subject of busySubjects) {
		it(`${subject.name} drops the status hover ring while busy`, async () => {
			await assertRingSuppressed(subject);
		});
	}
});

describe('input status hover ring — declaration order', () => {
	/**
	 * The independent check behind the header's correction, and the reason
	 * `Typeahead` sits in the ordinary list above rather than in an exception of
	 * its own.
	 *
	 * `Typeahead` is the one component that declares `inputWrapperStyles.disabled`
	 * **after** the status entry. If styleq really did resolve the whole
	 * `boxShadow` property by a single last-wins key, the disabled variant's flat
	 * `boxShadow: 'none'` would suppress the ring from there on its own and the
	 * guard would be decorative. It does not: the ring's
	 * `:hover:not(:focus-within)` declaration is a *separate* key that
	 * `inputWrapperStyles.disabled` never writes, so nothing about where `disabled`
	 * sits can remove it.
	 *
	 * Which means a disabled `Typeahead` carries the disabled variant in full and
	 * still has no ring — the two facts together, and only together, say that the
	 * `!isDisabled` term is what removed it.
	 */
	it('suppresses the ring by the guard, not by where the disabled variant sits', async () => {
		const screen = await render(Typeahead, {
			props: { label: 'Fruit', searchSource, value: null, onChange: noop, status, isDisabled: true }
		});
		const wrapper = wrapperIn(screen.container, '.astryx-typeahead');
		const classes = new Set((wrapper.getAttribute('class') ?? '').split(/\s+/));

		expect(disabledClasses.filter((name) => !classes.has(name))).toEqual([]);
		expect(hasErrorRing(wrapper)).toBe(false);
	});
});
