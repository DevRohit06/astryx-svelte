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
 * Astryx's `BottomSheet/BottomSheetPanel.test.tsx`, ported case for case —
 * **all 7 upstream cases at v0.4.5**, none dropped and none added.
 *
 * Three restatements, all forced by this project running the suite in a real
 * Chromium rather than jsdom:
 *
 * - **`state` is `panelState`.** The prop is renamed in this port because a
 *   local binding named `state` makes every `$state` rune in the same scope
 *   ambiguous with a store subscription. The component is internal, so no
 *   published API moves; see `bottom-sheet-panel.svelte`.
 * - **"the rendered transition is disabled" is rendered, not stubbed.**
 *   Upstream makes `matchMedia` answer `prefers-reduced-motion: reduce` and
 *   relies on jsdom computing no transition at all. In a real browser the
 *   compiled StyleX rule still applies and a stubbed media query cannot reach
 *   it, so the case disables the transition the way a consumer would — an
 *   inline `transition: none`, which is the branch `waitForTransition` guards.
 *   The stub is kept alongside it, so both paths are exercised.
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
