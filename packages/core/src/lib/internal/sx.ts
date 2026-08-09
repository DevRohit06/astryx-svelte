import * as stylex from '@stylexjs/stylex';
import type { ClassValue } from 'svelte/elements';
import type { SizeValue } from './types.js';

/**
 * Adapter between StyleX's runtime merge and Svelte's attribute shape.
 *
 * `stylex.props()` resolves a list of compiled style objects into the winning
 * atomic class list, plus a set of CSS custom properties for dynamic styles.
 * React consumes that as `{className, style}` where `style` is an object; Svelte
 * needs `class` and a serialised `style` string.
 *
 * This module lives outside `.svelte` files deliberately: the StyleX bundler
 * plugin Babel-parses any module importing `@stylexjs/stylex`, and would read a
 * Svelte component's markup as JSX. Keeping StyleX in `.ts`/`.stylex.ts` modules
 * is what makes the whole integration work.
 */

/**
 * A compiled StyleX style object, or a falsy value from a conditional such as
 * `isDisabled && styles.disabled`. StyleX's own parameter type is opaque and
 * collapses to `never` outside its authoring context, so we describe the runtime
 * shape instead.
 */
export type StyleArg = Record<string, unknown> | ReadonlyArray<unknown> | false | null | undefined;

type StyleXPropsResult = { className?: string; style?: Record<string, string | number> };

export interface SvelteStyleAttrs {
	class: string;
	style?: string;
}

export function sx(...args: StyleArg[]): SvelteStyleAttrs {
	const { className, style } = (stylex.props as unknown as (...a: StyleArg[]) => StyleXPropsResult)(
		...args
	);
	const vars = style;

	const declarations = Object.entries(vars ?? {}).filter(([, v]) => v != null);

	return {
		class: className ?? '',
		style: declarations.length > 0 ? declarations.map(([k, v]) => `${k}:${v}`).join(';') : undefined
	};
}

/**
 * Joins class values, skipping empties. Accepts Svelte's `ClassValue`, so a
 * consumer's `class={{ active: true }}` or `class={['a', 'b']}` composes
 * correctly with our generated classes.
 */
export function cx(...parts: Array<ClassValue | null | undefined>): string {
	const out: string[] = [];

	const walk = (value: ClassValue | null | undefined): void => {
		if (!value) return;
		if (typeof value === 'string') out.push(value);
		else if (Array.isArray(value)) value.forEach(walk);
		else if (typeof value === 'object')
			for (const [key, active] of Object.entries(value)) if (active) out.push(key);
	};

	parts.forEach(walk);
	return out.join(' ');
}

/** Joins inline-style strings, returning undefined when nothing remains. */
export function mergeStyle(...parts: Array<string | false | null | undefined>): string | undefined {
	const merged = parts.filter(Boolean).join(';');
	return merged.length > 0 ? merged : undefined;
}

/** A `SizeValue` as a CSS length: numbers become pixels, strings pass through. */
export function toCssLength(value: SizeValue): string {
	return typeof value === 'number' ? `${value}px` : value;
}

/** The box dimensions `Stack` and `Grid` expose as props. */
export interface SizingProps {
	width?: SizeValue;
	height?: SizeValue;
	maxWidth?: SizeValue;
	minHeight?: SizeValue;
}

/**
 * Serialises caller-set box dimensions to an inline style.
 *
 * These stay inline rather than going through StyleX, matching upstream: they
 * are one-off dimensions the caller chose for this instance, so there is no
 * atomic class worth minting and nothing for a theme to override.
 */
export function sizingStyle({
	width,
	height,
	maxWidth,
	minHeight
}: SizingProps): string | undefined {
	const parts: string[] = [];

	if (width != null) parts.push(`width:${toCssLength(width)}`);
	if (height != null) parts.push(`height:${toCssLength(height)}`);
	if (maxWidth != null) parts.push(`max-width:${toCssLength(maxWidth)}`);
	if (minHeight != null) parts.push(`min-height:${toCssLength(minHeight)}`);

	return parts.length > 0 ? parts.join(';') : undefined;
}
