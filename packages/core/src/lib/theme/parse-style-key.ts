/**
 * Ported from Astryx's `src/utils/parseStyleKey.ts`.
 *
 * Theme authors key component overrides by the visual state they target, and
 * this turns those keys into the class suffix that `themeProps()` will have put
 * on the element.
 *
 * @example
 * parseStyleKey('base')                       // ''
 * parseStyleKey('checked')                    // '.checked'
 * parseStyleKey('checked+disabled')           // '.checked.disabled'
 * parseStyleKey('variant:secondary')          // '.secondary'
 * parseStyleKey('level:1')                    // '.level-1'
 * parseStyleKey('variant:destructive+size:sm')// '.destructive.sm'
 */
export function parseStyleKey(key: string): string {
	if (key === 'base') return '';

	return key
		.split('+')
		.map((part) => {
			const [prop, value] = part.split(':');

			// Bare state name, e.g. 'checked', 'disabled', 'selected'.
			if (value === undefined) return `.${prop}`;

			// CSS classes can't start with a digit — prefix with the prop name so
			// `level:1` becomes `.level-1`.
			if (/^\d/.test(value)) return `.${prop}-${value}`;

			return `.${value}`;
		})
		.join('');
}
