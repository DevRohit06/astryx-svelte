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

/**
 * Which state a form treats as its default, so only the *exception* carries a
 * visible optional/required indicator.
 *
 * - `optional` — fields are optional unless a field opts into `isRequired`;
 *   only required fields show an indicator.
 * - `required` — fields are required unless a field opts into `isOptional`;
 *   only optional fields show an indicator.
 */
export type FormOptionality = 'optional' | 'required';

/**
 * The context value, an object rather than the bare direction it used to be.
 *
 * Upstream's context has always been `{direction}`; this port flattened it to
 * the direction alone, which made 0.4.5's additive `defaultOptionality` a
 * shape change here where it was a new key there. Matching upstream's shape
 * again is what keeps the next added key additive.
 */
export interface FormLayoutContextValue {
	direction: FormLayoutDirection;
	defaultOptionality?: FormOptionality;
}

/**
 * Published, because upstream publishes `FormLayoutContext` from
 * `FormLayout/index.ts` — `setFormLayoutContext`/`useFormLayout` are the Svelte
 * wrappers around it, not a replacement for it. Same shape as
 * `RadioListContext` and `SizeContext`.
 */
export const FormLayoutContext = new Context<() => FormLayoutContextValue>('astryx.formLayout');

export function setFormLayoutContext(get: () => FormLayoutContextValue): void {
	FormLayoutContext.set(get);
}

/**
 * Returns a getter for the enclosing layout's value, defaulting to
 * `{ direction: 'vertical' }` — upstream's context default, which is what a
 * field outside any `FormLayout` sees. `defaultOptionality` is absent there, so
 * a field outside a layout marks `isRequired` and `isOptional` independently.
 *
 * A getter rather than a value, for the reason `internal/contexts.svelte.ts`
 * sets out: context is read once at init, so a plain value would freeze
 * descendants at whatever the provider held on mount.
 */
export function useFormLayout(): () => FormLayoutContextValue {
	return FormLayoutContext.getOr(() => ({ direction: 'vertical' }));
}
