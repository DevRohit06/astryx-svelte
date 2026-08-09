import type { PlaygroundConfig, PropEntry } from '$lib/generated/types.js';

/**
 * Turns a prop's **declared type** into the control the Properties tab renders
 * for it, and turns the resulting values back into Svelte source.
 *
 * Upstream's counterpart is `component-detail/parsePropType.ts`, and it works
 * from a different input: upstream parses the React type string an author wrote
 * in a `.doc.mjs`, while this port reads the type the compiler resolved out of
 * `packages/core/dist` (the props-page audit, TODO.md Phase 5). That is a
 * strictly better input for this job — a string-literal union arrives already
 * expanded, so `<select>` options are read off the type rather than hand-listed,
 * and a prop whose type upstream could only describe as `ReactNode` arrives here
 * as the `Snippet` it really is.
 *
 * No StyleX here, and none in the components that use it: CLAUDE.md forbids
 * importing StyleX from a `.svelte` file, and the docs shell styles itself with
 * plain scoped CSS.
 */

/** A `<select>` option: what the reader picks, and the value that produces. */
export interface EnumOption {
	label: string;
	value: string | number | boolean;
}

/**
 * What the row's right-hand cell renders.
 *
 * `none` is a real outcome, not a failure: an object, a generic or a
 * parameterised snippet has no honest one-cell editor, and upstream leaves those
 * rows read-only too.
 *
 * `callback` renders no control either — upstream's `InlineControl` falls
 * through to `null` for it. It is told apart from `none` for one reason: a
 * *required* handler has to be seeded with a no-op, or a component that would
 * render perfectly well is reported as missing a prop nothing could supply.
 */
export type PropControl =
	| { kind: 'enum'; options: EnumOption[]; allowEmpty: boolean }
	| { kind: 'boolean' }
	| { kind: 'string' }
	| { kind: 'number' }
	| { kind: 'snippet' }
	| { kind: 'callback' }
	| { kind: 'none' };

/** A prop row paired with the control derived from its type. */
export interface Knob {
	row: PropEntry;
	control: PropControl;
}

const STRING_LITERAL = /^(['"])(.*)\1$/;
const NUMBER_LITERAL = /^-?\d+(\.\d+)?$/;
/** A bare `Snippet`, or one with type arguments (`Snippet<[T]>`). */
const SNIPPET = /^Snippet(<.*>)?$/;

/**
 * The three named types the generator still prints as an alias, rewritten to the
 * type they stand for so the rules below can see through them.
 *
 * Short because it does not have to carry the literal unions: `renderType` in
 * `scripts/lib/props-types.mjs` expands an alias that resolves to a union of
 * literals, so `SpacingStep` and `HeadingLevel` reach this file already spelled
 * out. What is left is the aliases that resolve to something else.
 *
 * Both rules are upstream's own, in `parsePropType`. `SizeValue` is declared
 * `number | string` and gets the pixel spinner, because that is the useful knob
 * and the string arm exists for `'100%'`. The icon aliases are string-literal
 * unions the component dispatches on with `typeof icon === 'string'`, so a text
 * control feeds them a registry name, which is exactly what they want.
 */
const TYPE_ALIASES = new Map([
	['SizeValue', 'number'],
	['IconName', 'string'],
	['IconType', 'string']
]);

/**
 * Split a union at the top level only, so a `|` inside parentheses, brackets,
 * braces, angle brackets or a string literal stays put. `(a: string | number)
 * => void` is one arm, not two.
 */
export function splitUnion(input: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let start = 0;
	let quote: string | null = null;

	for (let i = 0; i < input.length; i++) {
		const c = input[i];

		if (quote) {
			if (c === quote && input[i - 1] !== '\\') quote = null;
			continue;
		}
		if (c === "'" || c === '"' || c === '`') {
			quote = c;
			continue;
		}
		if (c === '(' || c === '[' || c === '{' || c === '<') depth++;
		else if (c === ')' || c === ']' || c === '}' || c === '>') depth--;
		else if (c === '|' && depth === 0) {
			parts.push(input.slice(start, i).trim());
			start = i + 1;
		}
	}

	parts.push(input.slice(start).trim());
	return parts.filter((part) => part.length > 0);
}

/** `'md'` → `md`; anything else unchanged. */
function unquote(value: string): string {
	const match = STRING_LITERAL.exec(value.trim());
	return match ? match[2] : value.trim();
}

/**
 * The control for a union whose `null` / `undefined` arms have already been
 * removed. Split out because a `Snippet` union re-enters it with the snippet
 * arms dropped.
 */
function controlForArms(arms: string[], allowEmpty: boolean): PropControl {
	if (arms.length === 0) return { kind: 'none' };

	// One arm, and it is a primitive. Aliases have already been expanded, so
	// `SizeValue` arrives here as `number`.
	if (arms.length === 1) {
		if (arms[0] === 'boolean') return { kind: 'boolean' };
		if (arms[0] === 'string') return { kind: 'string' };
		if (arms[0] === 'number') return { kind: 'number' };
	}

	// Upstream's rule: a union of only `string` and `number` is free text, so
	// `'64px'` and `64` are both reachable from one cell.
	if (arms.every((arm) => arm === 'string' || arm === 'number')) return { kind: 'string' };

	// A union of literals is a `<select>`. `boolean` counts as the two literals
	// it is, which is what makes `boolean | 'indeterminate'` a three-option
	// select rather than an unrepresentable mixture.
	const options: EnumOption[] = [];
	const add = (label: string, value: string | number | boolean) => {
		if (!options.some((option) => option.label === label)) options.push({ label, value });
	};
	let sawNonBoolean = false;

	for (const arm of arms) {
		if (arm === 'boolean') {
			add('true', true);
			add('false', false);
			continue;
		}
		if (arm === 'true' || arm === 'false') {
			add(arm, arm === 'true');
			continue;
		}
		const literal = STRING_LITERAL.exec(arm);
		if (literal) {
			sawNonBoolean = true;
			add(literal[2], literal[2]);
			continue;
		}
		if (NUMBER_LITERAL.test(arm)) {
			sawNonBoolean = true;
			add(arm, Number(arm));
			continue;
		}
		return { kind: 'none' };
	}

	// `true | false` spelled out is just a boolean, and a switch reads better
	// than a two-option select — upstream collapses it the same way.
	if (!sawNonBoolean) return options.length > 0 ? { kind: 'boolean' } : { kind: 'none' };
	if (options.length < 2) return { kind: 'none' };
	return { kind: 'enum', options, allowEmpty };
}

/**
 * The control a declared type earns.
 *
 * | declared type              | control                                  |
 * | -------------------------- | ---------------------------------------- |
 * | union of string literals   | `<select>` carrying the union's members  |
 * | `boolean`                  | `Switch`                                 |
 * | `string`                   | `TextInput`                              |
 * | `number`                   | `NumberInput`                            |
 * | `Snippet`                  | `TextInput`, wrapped into a snippet      |
 * | anything else              | none — the row stays read-only           |
 *
 * `null` and `undefined` arms are stripped first, because a nullable string is
 * still a string; they set `allowEmpty` on a select so "None" can be chosen.
 */
export function deriveControl(type: string | undefined): PropControl {
	const declared = (type ?? '').trim();
	if (!declared) return { kind: 'none' };

	// Aliases are expanded before the union is inspected, so `SpacingStep`
	// becomes eleven literal arms and `IconName | Snippet` becomes
	// `string | Snippet`.
	const arms = splitUnion(declared).flatMap((arm) => {
		const alias = TYPE_ALIASES.get(arm);
		return alias ? splitUnion(alias) : [arm];
	});

	const present = arms.filter((arm) => arm !== 'null' && arm !== 'undefined');
	const allowEmpty = present.length < arms.length;
	if (present.length === 0) return { kind: 'none' };

	// Every remaining arm is a function type. Upstream tests for `=>` on the
	// whole string before anything else; testing every arm is the same rule with
	// `(keyof T & string) | ((item: T) => string)` — half a callback — excluded,
	// since a no-op is not a safe seed for that half.
	if (present.every((arm) => arm.includes('=>'))) return { kind: 'callback' };

	const snippets = present.filter((arm) => SNIPPET.test(arm));
	if (snippets.length > 0) {
		// A parameterised `Snippet<[T]>` is this port's spelling of a React render
		// prop, and upstream gives a render prop no control either: the component
		// calls it per item with an argument, and static text is not an answer to
		// that.
		if (snippets.some((arm) => arm !== 'Snippet')) return { kind: 'none' };

		const rest = present.filter((arm) => !SNIPPET.test(arm));
		if (rest.length === 0) return { kind: 'snippet' };

		// `string | Snippet` and `IconName | Snippet` take the string branch: the
		// component accepts a plain string there and does something better with it
		// (a registry lookup) than a snippet of the same text would.
		const fallback = controlForArms(rest, allowEmpty);
		return fallback.kind === 'none' ? { kind: 'snippet' } : fallback;
	}

	return controlForArms(present, allowEmpty);
}

/** Pair every documented row with its control. Upstream's `pickPrimaryProps`. */
export function buildKnobs(rows: PropEntry[] | null): Knob[] {
	return (rows ?? []).map((row) => ({ row, control: deriveControl(row.type) }));
}

/**
 * Read a documented default (`"'secondary'"`, `'false'`, `'0'`) as the value its
 * control would hold. Upstream's `coerceDefault`.
 */
export function coerceDefault(raw: string | undefined, control: PropControl): unknown {
	if (raw == null) return undefined;
	const value = raw.trim();
	if (!value) return undefined;

	switch (control.kind) {
		case 'boolean':
			return value === 'true' ? true : value === 'false' ? false : undefined;
		case 'number': {
			const parsed = Number(unquote(value));
			return Number.isFinite(parsed) ? parsed : undefined;
		}
		case 'enum': {
			const stripped = unquote(value);
			return control.options.find((option) => option.label === stripped)?.value;
		}
		case 'string':
		case 'snippet':
			return unquote(value);
		default:
			return undefined;
	}
}

/**
 * A value for a **required** prop the reader has not set, so the preview has
 * something to render rather than a component that throws on a missing name.
 * Upstream's `getRequiredFallbackValue`, minus the branches for controls this
 * port does not derive.
 */
function requiredFallback(knob: Knob): unknown {
	switch (knob.control.kind) {
		case 'enum':
			return knob.control.options[0]?.value;
		case 'boolean':
			return false;
		case 'number':
			return 0;
		case 'string':
		case 'snippet':
			// Upstream seeds the prop's own name, which reads as a placeholder
			// (`label` shows "label") rather than inventing demo copy.
			return knob.row.name;
		case 'callback':
			// A no-op, as upstream seeds. Svelte would tolerate the prop being
			// absent — the component calls `onChange?.()` — but a required prop left
			// unset is reported as missing, and a preview that renders should not be
			// degraded over a handler nobody is listening to.
			return () => {};
		default:
			return undefined;
	}
}

/**
 * The knobs' starting values: `playground.defaults` first, then the documented
 * default, then a fallback for anything still required.
 *
 * A default upstream authored for a prop this port does not declare is dropped —
 * it would otherwise reach the component through the rest props and land on the
 * DOM as a stray attribute.
 */
export function buildInitialValues(
	knobs: Knob[],
	playground: PlaygroundConfig | null
): Record<string, unknown> {
	const values: Record<string, unknown> = {};
	const declared = new Set(knobs.map((knob) => knob.row.name));

	for (const [name, value] of Object.entries(playground?.defaults ?? {})) {
		if (declared.has(name)) values[name] = value;
	}

	for (const knob of knobs) {
		if (values[knob.row.name] !== undefined) continue;
		const documented = coerceDefault(knob.row.default, knob.control);
		if (documented !== undefined) values[knob.row.name] = documented;
		else if (knob.row.required) {
			const fallback = requiredFallback(knob);
			if (fallback !== undefined) values[knob.row.name] = fallback;
		}
	}

	return values;
}

/**
 * Required props the seeding could not fill — a generic `items`, a
 * `SearchSource`, a handler. Upstream's `getMissingRequiredProps`, and the same
 * use: the stage says which props it is short of instead of rendering a
 * component that throws.
 */
export function missingRequired(knobs: Knob[], values: Record<string, unknown>): string[] {
	return knobs
		.filter((knob) => knob.row.required === true && values[knob.row.name] === undefined)
		.map((knob) => knob.row.name);
}

// ---------------------------------------------------------------------------
// code generation
// ---------------------------------------------------------------------------

/** Attribute-safe text: the quote that delimits it, plus the two markup sigils. */
function escapeAttribute(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/** Text-node-safe: Svelte reads `{` as an expression and `<` as a tag. */
function escapeText(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/([{}])/g, '&#$1;');
}

/** `variant="primary"`, `padding={4}`, `isLoading`, `items={[…]}`. */
function attribute(name: string, value: unknown): string | null {
	if (typeof value === 'boolean') return value ? name : `${name}={false}`;
	if (typeof value === 'string') return `${name}="${escapeAttribute(value)}"`;
	if (typeof value === 'number') return `${name}={${value}}`;
	if (value === null) return `${name}={null}`;
	try {
		return `${name}={${JSON.stringify(value)}}`;
	} catch {
		return null;
	}
}

/** Two values are "the same default" for the purpose of omitting a prop. */
function sameValue(a: unknown, b: unknown): boolean {
	if (Object.is(a, b)) return true;
	if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
	try {
		return JSON.stringify(a) === JSON.stringify(b);
	} catch {
		return false;
	}
}

/**
 * The Svelte markup the current values imply — upstream's `generateCode`, which
 * emits JSX.
 *
 * Two things are this port's rather than upstream's. **Props left at their
 * documented default are omitted**, so the snippet is what a reader would
 * actually type rather than a dump of every knob. And a filled slot is emitted
 * as Svelte's own slot syntax: `children` as element content, any other snippet
 * prop as a `{#snippet name()}` block. Upstream has one spelling for both,
 * because in JSX a slot is just another prop.
 */
export function generateSvelteCode(
	name: string,
	knobs: Knob[],
	values: Record<string, unknown>
): string {
	const attributes: string[] = [];
	const snippets: Array<[string, string]> = [];
	let children: string | null = null;

	for (const knob of knobs) {
		const value = values[knob.row.name];
		if (value === undefined) continue;
		if (sameValue(value, coerceDefault(knob.row.default, knob.control))) continue;

		// The seeded no-op. It is not something the reader typed, but the prop is
		// required, so the snippet has to show that a handler goes here.
		if (knob.control.kind === 'callback') {
			attributes.push(`${knob.row.name}={() => {}}`);
			continue;
		}

		if (knob.control.kind === 'snippet') {
			const text = String(value);
			if (text === '') continue;
			if (knob.row.name === 'children') children = escapeText(text);
			else snippets.push([knob.row.name, escapeText(text)]);
			continue;
		}

		const rendered = attribute(knob.row.name, value);
		if (rendered != null) attributes.push(rendered);
	}

	const inline = attributes.length > 0 ? ` ${attributes.join(' ')}` : '';
	const body = [
		...snippets.map(([slot, text]) => `\t{#snippet ${slot}()}${text}{/snippet}`),
		...(children != null ? [`\t${children}`] : [])
	];

	// One line while it stays readable; upstream breaks on every prop, which
	// makes `<Badge label="Badge" />` three lines long.
	const openInline = `<${name}${inline}`;
	const isMultiline = attributes.length > 0 && openInline.length > 72;
	const open = isMultiline
		? `<${name}\n${attributes.map((attr) => `\t${attr}`).join('\n')}\n`
		: openInline;

	if (body.length === 0) return isMultiline ? `${open}/>` : `${open} />`;
	return `${open}>\n${body.join('\n')}\n</${name}>`;
}
