/**
 * Append a layer's id to an element's `aria-describedby` and **keep it there**.
 *
 * `Tooltip` and `HoverCard` both describe a trigger they *found* rather than
 * rendered — the first element child of a `display: contents` wrapper, or an
 * external `anchor` element. Neither owns that element's attributes, so the
 * merge cannot be a one-shot write: the caller's template may rewrite
 * `aria-describedby` at any time (`Slider` recomposes its thumb's from
 * `description` and `status`), and Svelte's attribute write replaces the value
 * wholesale, dropping the id we appended.
 *
 * Upstream never has to think about this. Its layout effect is keyed on
 * `tooltip.ref`, whose identity churns on every render because `useLayer`
 * returns a bare object literal, so the effect tears down and re-runs constantly
 * — re-reading the freshly-committed attribute and re-appending. That accidental
 * churn is a repair pass, not just a re-find, and this is the deliberate
 * counterpart: a `MutationObserver` on the one attribute, which is the device
 * `watchFirstElementChild` already uses for `childList`.
 *
 * The `applied` comparison is what stops the observer looping on its own write.
 * It starts `undefined` rather than `null` so an element with no
 * `aria-describedby` at all is not mistaken for one already carrying the merge.
 *
 * There is no upstream module to mirror here — upstream inlines this body in two
 * layout effects — so, as with `first-element-child.svelte.ts`, one shared
 * internal is the honest shape rather than a copy per component.
 *
 * @param element the trigger being described
 * @param id the layer id to append
 * @returns teardown that restores the caller's *latest* value, not a stale one
 */
export function mergeDescribedBy(element: HTMLElement, id: string): () => void {
	/** The caller's own value, re-read whenever their template rewrites it. */
	let base = element.getAttribute('aria-describedby');
	/** The last value we wrote; `undefined` until the first one. */
	let applied: string | undefined;

	const apply = (): void => {
		const current = element.getAttribute('aria-describedby');
		if (applied !== undefined && current === applied) {
			// Our own write, echoed back through the observer.
			return;
		}
		base = current;
		applied = [base, id].filter(Boolean).join(' ');
		element.setAttribute('aria-describedby', applied);
	};

	apply();

	const observer = new MutationObserver(apply);
	observer.observe(element, { attributeFilter: ['aria-describedby'] });

	return () => {
		observer.disconnect();
		if (base) {
			element.setAttribute('aria-describedby', base);
		} else {
			element.removeAttribute('aria-describedby');
		}
	};
}
