import { Context } from '../../internal/context.js';

/**
 * Ported from Astryx's `FormLayout/FormLayoutContext.ts`.
 *
 * Lets a field see which arrangement it is being laid out in and adapt — the
 * `horizontal-labels` case is the one that matters, since a field has to put
 * its label in the grid's first column rather than above itself.
 */

/**
 * Direction of form field arrangement.
 *
 * - `vertical` — fields stack top to bottom (default)
 * - `horizontal` — fields sit left to right in equal columns
 * - `horizontal-labels` — fields stack, with labels to the left of their inputs
 */
export type FormLayoutDirection = 'vertical' | 'horizontal' | 'horizontal-labels';

const formLayoutContext = new Context<() => FormLayoutDirection>('astryx.formLayout');

export function setFormLayoutContext(get: () => FormLayoutDirection): void {
	formLayoutContext.set(get);
}

/**
 * Returns a getter for the enclosing layout's direction, defaulting to
 * `vertical` — upstream's context default, which is what a field outside any
 * `FormLayout` sees.
 *
 * A getter rather than a value, for the reason `internal/contexts.svelte.ts`
 * sets out: context is read once at init, so a plain value would freeze
 * descendants at whatever the provider held on mount.
 */
export function useFormLayout(): () => FormLayoutDirection {
	return formLayoutContext.getOr(() => 'vertical');
}
