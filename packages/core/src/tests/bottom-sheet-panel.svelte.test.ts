import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import BottomSheetPanel, {
	type BottomSheetPanelMotion,
	type BottomSheetPanelProps,
	type BottomSheetPanelState
} from '$lib/components/bottom-sheet/bottom-sheet-panel.svelte';
import { stubMatchMedia } from './stub-match-media.js';

/**
 * Astryx's `BottomSheet/BottomSheetPanel.test.tsx` — **7 of upstream's 12 at
 * the 0.5.0 pin**, none dropped and none added.
 *
 * **The 5 that are not here all arrived at 0.5.0**, and four of them are one
 * subject — the floating handle bar and the sheet's edge treatment:
 *
 * - `floats the handle bar over content that starts at the sheet top edge`
 * - `backs the floating handle bar with a surface gradient`
 * - `draws a hairline on the three edges that face the scrim`
 * - `paints the surface across the scrolling body so the edge stays uniform`
 * - `closes on an accelerating curve of its own, not the entrance timing` —
 *   the exit easing, which the third restatement below is otherwise about.
 *
 * The first four are computed-style assertions against StyleX output, so they
 * need the `.stylex.ts` side of the 0.5.0 change ported first; 0.5.0 also added
 * a whole `BottomSheetEdgeTint.test.tsx` beside this suite, which has no ported
 * counterpart. (This header read "**all 7 upstream cases at v0.4.5**", true at
 * that pin, where 7 was the whole suite.)
 *
 * Three restatements, all forced by this project running the suite in a real
 * Chromium rather than jsdom:
 *
 * - **`state` is `panelState`.** Renamed because Svelte's compiler asks for it:
 *   a local binding named `state` beside the `$state` rune emits
 *   `store_rune_conflict`, which ends *"Please rename `state` to avoid the
 *   ambiguity"*. It is a warning rather than an error — this file's earlier
 *   wording implied otherwise — and the component is internal, so no published
 *   API moves. See `bottom-sheet-panel.svelte` for the full note.
 * - **"the rendered transition is disabled" is rendered, not stubbed.**
 *   Upstream makes `matchMedia` answer `prefers-reduced-motion: reduce` and
 *   relies on jsdom computing no transition at all. In a real browser the
 *   compiled StyleX rule still applies and a stubbed media query cannot reach
 *   it, so the case disables the transition the way a consumer would — an
 *   inline `transition: none`, which is the branch `waitForTransition` guards.
 *   The reduce-motion stub stays alongside it to match upstream's setup, but the
 *   inline rule is what the assertion rests on: the case would pass on that
 *   branch alone, so it does not evidence the media-query path.
 * - **The public `ref` case is an attachment.** This port's standing
 *   ref-callback translation: an `{@attach}` on the component reaches the sheet
 *   `<div>` through the rest spread. Attach-once-and-clean-up-on-unmount is the
 *   same contract upstream asserts with a callback ref called twice.
 */

const PANEL_TRANSITION_STYLE =
	'transition-property: transform, opacity; transition-duration: 410ms; transition-delay: 0ms';

const content = createRawSnippet(() => ({ render: () => '<span>Panel content</span>' }));

beforeEach(() => {
	stubMatchMedia({ reduceMotion: false, matches: false });
});

afterEach(() => {
	vi.unstubAllGlobals();
});

function panelProps(
	panelState: BottomSheetPanelState,
	callbacks: {
		onMotionStart?: (motion: BottomSheetPanelMotion) => void;
		onMotionComplete?: (motion: BottomSheetPanelMotion) => void;
	} = {},
	style: string | undefined = PANEL_TRANSITION_STYLE
): BottomSheetPanelProps {
	return {
		panelState,
		height: 'hug',
		children: content,
		style,
		onDismiss: () => {},
		onScrimOpacity: () => {},
		onMotionStart: callbacks.onMotionStart,
		onMotionComplete: callbacks.onMotionComplete
	};
}

function getPanel(): HTMLElement {
	const panel = document.querySelector<HTMLElement>('.astryx-bottom-sheet');
	if (panel == null) {
		throw new Error('BottomSheetPanel surface not found');
	}
	return panel;
}

function endTransition(propertyName: 'transform' | 'opacity'): void {
	getPanel().dispatchEvent(new TransitionEvent('transitionend', { propertyName, bubbles: true }));
}

describe('BottomSheetPanel', () => {
	it('reports entrance completion only for the surface transform', async () => {
		const onMotionStart = vi.fn();
		const onMotionComplete = vi.fn();
		await render(BottomSheetPanel, {
			props: panelProps({ kind: 'open', entering: true }, { onMotionStart, onMotionComplete })
		});

		expect(onMotionStart).toHaveBeenCalledWith('entering');
		endTransition('opacity');
		expect(onMotionComplete).not.toHaveBeenCalled();
		endTransition('transform');
		expect(onMotionComplete).toHaveBeenCalledWith('entering');
	});

	it('completes a retained-sheet reactivation without waiting for a new entrance', async () => {
		const onMotionComplete = vi.fn();
		const screen = await render(BottomSheetPanel, {
			props: panelProps(
				{ kind: 'retained', motion: 'covered', alignmentOffset: 0 },
				{ onMotionComplete }
			)
		});

		await screen.rerender(panelProps({ kind: 'open', entering: true }, { onMotionComplete }));

		expect(onMotionComplete).toHaveBeenCalledWith('entering');
	});

	it('applies the switcher alignment offset to a retained surface', async () => {
		await render(BottomSheetPanel, {
			props: panelProps({ kind: 'retained', motion: 'aligning', alignmentOffset: 120 })
		});

		expect(getPanel().style.transform).toBe('translateY(120px)');
	});

	it('maps exit and fade completion to their respective CSS properties', async () => {
		const onMotionComplete = vi.fn();
		const screen = await render(BottomSheetPanel, {
			props: panelProps(
				{ kind: 'retained', motion: 'fading', alignmentOffset: 0 },
				{ onMotionComplete }
			)
		});

		endTransition('opacity');
		expect(onMotionComplete).toHaveBeenLastCalledWith('fading');

		await screen.rerender(panelProps({ kind: 'exiting' }, { onMotionComplete }));
		endTransition('transform');
		expect(onMotionComplete).toHaveBeenLastCalledWith('exiting');
	});

	it('completes immediately when the rendered transition is disabled', async () => {
		stubMatchMedia({ reduceMotion: true, matches: false });
		const onMotionComplete = vi.fn();
		await render(BottomSheetPanel, {
			props: panelProps({ kind: 'open', entering: true }, { onMotionComplete }, 'transition: none')
		});

		expect(onMotionComplete).toHaveBeenCalledWith('entering');
	});

	it('derives its transition backstop from the rendered timing', async () => {
		vi.useFakeTimers();
		try {
			const onMotionComplete = vi.fn();
			await render(BottomSheetPanel, {
				props: panelProps(
					{ kind: 'open', entering: true },
					{ onMotionComplete },
					'transition-property: transform, opacity; transition-duration: 0.5s, 200ms; transition-delay: 100ms, 0ms'
				)
			});

			vi.advanceTimersByTime(649);
			expect(onMotionComplete).not.toHaveBeenCalled();
			vi.advanceTimersByTime(1);
			expect(onMotionComplete).toHaveBeenCalledWith('entering');
		} finally {
			vi.useRealTimers();
		}
	});

	it('does not detach a stable public ref during an ordinary rerender', async () => {
		const detach = vi.fn();
		const attach = vi.fn(() => detach);
		const attachKey = createAttachmentKey();
		const withRef = (panelState: BottomSheetPanelState, label: string) => ({
			...panelProps(panelState, {}, undefined),
			children: createRawSnippet(() => ({ render: () => `<span>${label}</span>` })),
			[attachKey]: attach
		});

		const screen = await render(BottomSheetPanel, {
			props: withRef({ kind: 'open', entering: false }, 'First render')
		});

		expect(attach).toHaveBeenCalledTimes(1);
		await screen.rerender(withRef({ kind: 'open', entering: false }, 'Second render'));
		expect(attach).toHaveBeenCalledTimes(1);
		expect(detach).not.toHaveBeenCalled();

		screen.unmount();
		expect(detach).toHaveBeenCalledTimes(1);
		expect(attach).toHaveBeenCalledTimes(1);
	});
});
