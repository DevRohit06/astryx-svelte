import { themeDataAttributeName } from '../internal/theme-props.js';

/** Escape a value for a double-quoted CSS attribute selector string. */
function escapeAttributeValue(value: string): string {
	let escaped = '';
	for (const char of value) {
		const codePoint = char.codePointAt(0) ?? 0;
		if (char === '"' || char === '\\' || codePoint < 0x20 || codePoint === 0x7f) {
			escaped += `\\${(codePoint === 0 ? 0xfffd : codePoint).toString(16)} `;
		} else {
			escaped += char;
		}
	}
	return escaped;
}

/**
 * Ported from Astryx's `src/utils/parseStyleKey.ts`.
 *
 * Parse a component style key into a CSS data-attribute selector suffix. Theme
 * authors key component overrides by the visual state they target, and this
 * turns those keys into the selector suffix matching what `themeProps()` put on
 * the element.
 *
 * - `prop:value` selects `[data-prop="value"]`.
 * - A bare state selects `[data-state="state"]`.
 * - `+` combines selectors on the same stable `astryx-*` target.
 *
 * Upstream 0.6.0 moved this off the bare prop/state classes it used to emit
 * (`.destructive`, `.sm`, `.level-1`). Keeping the axis name in the selector
 * prevents collisions between equal values on different props — Grid's
 * `align="center"` and `justify="center"` both compiled to `.center` before.
 * The classes themselves are still emitted by `themeProps`, deprecated through
 * the 0.7.0 removal window (#6126); nothing generated targets them.
 *
 * Two details the old implementation got wrong and this one does not: only the
 * **first** colon separates, so `variant:a:b` keeps `a:b` as the value rather
 * than dropping `:b`; and the digit-prefix rule is gone, because an attribute
 * value may start with a digit where a class may not.
 *
 * @example
 * parseStyleKey('base')                        // ''
 * parseStyleKey('checked')                     // '[data-checked="checked"]'
 * parseStyleKey('checked+disabled')            // '[data-checked="checked"][data-disabled="disabled"]'
 * parseStyleKey('variant:secondary')           // '[data-variant="secondary"]'
 * parseStyleKey('level:1')                     // '[data-level="1"]'
 * parseStyleKey('variant:destructive+size:sm') // '[data-variant="destructive"][data-size="sm"]'
 */
export function parseStyleKey(key: string): string {
	if (key === 'base') return '';

	return key
		.split('+')
		.map((part) => {
			// A bare state name sets prop === value, so `checked` targets
			// `[data-checked="checked"]` — which is what components reflect.
			const separator = part.indexOf(':');
			const prop = separator === -1 ? part : part.slice(0, separator);
			const value = separator === -1 ? part : part.slice(separator + 1);
			return `[${themeDataAttributeName(prop)}="${escapeAttributeValue(value)}"]`;
		})
		.join('');
}
