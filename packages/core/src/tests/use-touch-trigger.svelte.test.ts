import { describe, expect, it } from 'vitest';
import { isActionTrigger } from '$lib/components/layer/use-touch-trigger.svelte.js';

/**
 * Ported from Astryx's `Layer/useTouchTrigger.test.ts`, which declares **5**
 * cases at the **0.5.0** pin. **All five are here and nothing is dropped.**
 *
 * The tap-versus-suppress decision rests entirely on this predicate, and it is
 * the part a new element type silently falls through. The per-component tests
 * (`tooltip.svelte.test.ts`, `hover-card.svelte.test.ts`) cover the gestures it
 * feeds.
 *
 * Upstream's file is a plain `.test.ts` against jsdom. Here it is a
 * `.svelte.test.ts` — the **client** project — for one reason: the server
 * project is a bare node environment with no `document`, and every case builds
 * its subject with `document.createElement`. Nothing in the file renders a
 * component; the browser is only there to supply the DOM upstream's jsdom
 * supplied. Reading `isActionTrigger` out of a `.svelte.ts` module costs
 * nothing — it is a plain function, and the module's runes are all inside
 * `useTouchTrigger`.
 *
 * That swap also makes one case stronger than upstream's rather than weaker.
 * Upstream reads the `contenteditable` *attribute* as well as the property
 * because jsdom does not implement `isContentEditable`; in a real Chromium the
 * property answers, so the contenteditable case exercises the branch upstream's
 * environment cannot reach.
 */

function element(html: string): HTMLElement {
	const host = document.createElement('div');
	host.innerHTML = html;
	return host.firstElementChild as HTMLElement;
}

describe('isActionTrigger', () => {
	it.each([
		['<button type="button">Save</button>'],
		['<input type="text" />'],
		['<select></select>'],
		['<textarea></textarea>'],
		['<summary>More</summary>'],
		['<label>Name</label>'],
		['<a href="/somewhere">Link</a>']
	])('treats %s as an action', (html) => {
		expect(isActionTrigger(element(html))).toBe(true);
	});

	it.each([
		['<span>Plain text</span>'],
		['<svg></svg>'],
		['<abbr title="what">WCAG</abbr>'],
		// An anchor without href is a link that goes nowhere.
		['<a>Not a link</a>']
	])('treats %s as inert', (html) => {
		expect(isActionTrigger(element(html))).toBe(false);
	});

	it('reads an explicit role over the tag it sits on', () => {
		expect(isActionTrigger(element('<span role="button">Go</span>'))).toBe(true);
		// Scenery: the role says this button is not the control it looks like.
		expect(isActionTrigger(element('<button role="presentation">x</button>'))).toBe(false);
	});

	it('does not treat mere focusability as an action', () => {
		// The wrapper a text-only Tooltip renders: reachable by keyboard so the
		// hint is not mouse-only, and it still does nothing when activated.
		expect(isActionTrigger(element('<span tabindex="0">Term</span>'))).toBe(false);
	});

	it('treats a contenteditable surface as an action', () => {
		const editable = element('<div contenteditable="true"></div>');
		expect(isActionTrigger(editable)).toBe(true);
	});
});
