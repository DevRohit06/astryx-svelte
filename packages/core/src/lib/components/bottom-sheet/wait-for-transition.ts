/**
 * Ported from the `waitForTransition` helper in Astryx's
 * `BottomSheet/BottomSheetPanel.tsx`.
 *
 * Its own module here rather than a file-local, because Svelte cannot export a
 * helper from a component's instance script. `bottom-sheet-panel.svelte` is its
 * only importer, and calls it from two sites. Not exported from the barrel;
 * upstream publishes nothing of it.
 *
 * Resolving a transition cannot rely on `transitionend` alone: with transitions
 * disabled — an inline `transition: none`, a `0s` duration token, a harness
 * turning animation off — no event ever arrives, and the caller would wait
 * forever. So this reads the computed timing and backstops with a timer, and
 * completes synchronously when there is nothing to wait for.
 */

const TRANSITION_BACKSTOP_BUFFER_MS = 50;

function parseTransitionTime(value: string): number | null {
	const normalizedValue = value.trim();
	if (!/^-?(?:\d+|\d*\.\d+)(?:ms|s)$/.test(normalizedValue)) {
		return null;
	}
	const time = Number.parseFloat(value);
	return normalizedValue.endsWith('ms') ? time : time * 1000;
}

export function waitForTransition(
	element: HTMLElement | null,
	propertyName: 'transform' | 'opacity',
	complete: () => void
): () => void {
	if (element == null) {
		complete();
		return () => {};
	}

	let done = false;
	let timer: ReturnType<typeof setTimeout> | null = null;
	const handleTransitionEnd = (event: TransitionEvent) => {
		if (event.target === element && event.propertyName === propertyName) {
			finish();
		}
	};
	const finish = () => {
		if (done) {
			return;
		}
		done = true;
		if (timer != null) {
			clearTimeout(timer);
		}
		element.removeEventListener('transitionend', handleTransitionEnd);
		element.removeEventListener('transitioncancel', handleTransitionEnd);
		complete();
	};
	element.addEventListener('transitionend', handleTransitionEnd);
	element.addEventListener('transitioncancel', handleTransitionEnd);

	const computedStyle = getComputedStyle(element);
	if (element.style.transition.trim() === 'none' || computedStyle.transition.trim() === 'none') {
		finish();
		return () => {};
	}
	const properties = computedStyle.transitionProperty.split(',').map((value) => value.trim());
	const durations = computedStyle.transitionDuration.split(',').map(parseTransitionTime);
	const delays = computedStyle.transitionDelay.split(',').map(parseTransitionTime);
	let hasUnresolvedTiming = false;
	const transitionMs = properties.reduce((longest, property, index) => {
		if (property !== propertyName && property !== 'all') {
			return longest;
		}
		const duration = durations[index % durations.length];
		const delay = delays[index % delays.length];
		if (duration == null || delay == null) {
			hasUnresolvedTiming = true;
			return longest;
		}
		return Math.max(longest, duration + delay);
	}, 0);

	if (hasUnresolvedTiming) {
		// An environment that leaves CSS variables unresolved. There the native
		// event remains authoritative; choosing a fixed timeout would make an
		// assumption about the consumer's theme.
		return () => {
			element.removeEventListener('transitionend', handleTransitionEnd);
			element.removeEventListener('transitioncancel', handleTransitionEnd);
		};
	}

	if (transitionMs <= 0) {
		finish();
		return () => {};
	}

	timer = setTimeout(finish, transitionMs + TRANSITION_BACKSTOP_BUFFER_MS);
	return () => {
		if (timer != null) {
			clearTimeout(timer);
		}
		element.removeEventListener('transitionend', handleTransitionEnd);
		element.removeEventListener('transitioncancel', handleTransitionEnd);
	};
}
