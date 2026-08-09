import { expect, vi } from 'vitest';

/**
 * Wait until a `Tooltip`/`HoverCard` trigger has actually been wired.
 *
 * Both components find their trigger rather than rendering it: the element sits
 * inside a `display: contents` wrapper and is wired by `watchFirstElementChild`,
 * which runs in an `$effect` keyed on the wrapper's `bind:this`. Showing the
 * layer is a *different* effect. So "the layer mounted" and "the layer showed"
 * are both true strictly before the trigger has any listeners on it.
 *
 * That gap is a real hazard for a test, and a permanent one rather than a slow
 * one: a `mouseenter`/`mouseleave` dispatched into an unwired element is dropped
 * on the floor, and no amount of retrying the *assertion* afterwards brings it
 * back. The symptom is a `vi.waitFor` that burns its full budget and fails —
 * which is exactly the shape the hover-intent flakes had, and why they always
 * passed in isolation: with one file on the machine, the wiring effect always
 * won the race.
 *
 * `wire()` merges `aria-describedby` onto the element as part of the same
 * teardown-returning call that attaches the listeners, so the attribute is a
 * precise, already-asserted-on signal that wiring is complete — see the
 * `gives the tooltip layer role="tooltip" linked from the trigger` case, which
 * asserts exactly this linkage as behaviour.
 */
export async function whenWired(element: Element): Promise<void> {
	await vi.waitFor(() => {
		expect(element).toHaveAttribute('aria-describedby');
	});
}
