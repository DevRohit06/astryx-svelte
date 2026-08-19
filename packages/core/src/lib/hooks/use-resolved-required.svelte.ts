import { useFormLayout } from '../components/form-layout/form-layout-context.svelte.js';

/**
 * Ported from Astryx's `hooks/useResolvedRequired.ts`.
 *
 * Resolves a field's effective *required* state for `aria-required`, honouring a
 * surrounding `FormLayout`'s `defaultOptionality`.
 *
 * Under `defaultOptionality="required"` a field is required unless it opts out
 * with `isOptional`. The visible indicator is suppressed for the unmarked
 * majority, so those fields must still expose `aria-required` — otherwise a
 * sighted user reads them as required (form-wide default, no indicator) while a
 * screen reader hears "not required". This closes that mismatch.
 *
 * Semantics only: this drives `aria-required`, never the native `required`
 * attribute, so a layout-level default cannot silently switch on browser
 * validation bubbles. `isOptional` takes precedence, matching `FieldLabel`.
 *
 * Takes and returns getters rather than values. Upstream re-runs on every
 * render, so reading `isRequired` once at init would freeze a field whose
 * required state changes — the failure `internal/contexts.svelte.ts` describes
 * for context, in the same shape.
 */
export function useResolvedRequired(params: {
	isRequired?: () => boolean;
	isOptional?: () => boolean;
}): () => boolean {
	const formLayout = useFormLayout();
	return () => {
		const isRequired = params.isRequired?.() ?? false;
		const isOptional = params.isOptional?.() ?? false;
		return !isOptional && (isRequired || formLayout().defaultOptionality === 'required');
	};
}
