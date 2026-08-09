/**
 * Clickable containers that hold nested interactive elements, ported from
 * Astryx's `hooks/useClickableContainer.ts`.
 *
 * The problem it solves: a card is clickable, but it contains buttons and
 * links, and clicking those must not also fire the card. Every rule for that —
 * the interactive-ancestor walk, the text-selection guard, the middle-click
 * branch, the proxy click to a screen-reader-only link so a framework router
 * still handles navigation — is upstream's and transcribes unchanged.
 *
 * Two translations. Upstream takes `RefObject`s; Svelte has no ref objects, so
 * the options carry the **elements** (`container`, `interactive`) as you would
 * get them from `bind:this`, and the whole options object comes in as a getter
 * so those reads stay live. And the returned handlers take Svelte's DOM names
 * (`onclick`, `onmouseup`) so the result spreads straight onto an element.
 */

/**
 * Canonical list of interactive element selectors — native controls plus
 * role-based interactive elements. Clicks on these (or their descendants)
 * should NOT bubble to a clickable container's click handler.
 *
 * Exported so other focus/interaction utilities can share one comprehensive
 * definition of "interactive target" rather than hand-rolling divergent lists.
 * Note: this list is about "don't bubble clicks", not focus-eligibility —
 * consumers that need focusable elements must additionally exclude
 * unfocusable/disabled targets (e.g. `[tabindex="-1"]`, `:disabled`).
 */
export const INTERACTIVE_SELECTORS = [
	'button',
	'a',
	'input',
	'select',
	'textarea',
	'[role="button"]',
	'[role="link"]',
	'[role="checkbox"]',
	'[role="radio"]',
	'[role="switch"]',
	'[role="tab"]',
	'[role="menuitem"]',
	'[role="option"]',
	'[role="combobox"]',
	'[role="listbox"]',
	'[role="slider"]',
	'[role="spinbutton"]',
	'[data-pressable-container]'
].join(',');

const NON_INTERACTIVE_SELECTORS = '[aria-readonly="true"]';

/**
 * Check whether an element has an interactive ancestor between it and the root.
 * If the click target is inside a nested button/link/etc., we should NOT
 * handle it at the container level.
 */
function hasInteractiveAncestor(el: Element, rootEl: Element): boolean {
	let current: Element | null = el;
	while (current != null && current !== rootEl && current !== document.body) {
		if (current.matches(INTERACTIVE_SELECTORS) && !current.matches(NON_INTERACTIVE_SELECTORS)) {
			return true;
		}
		current = current.parentElement;
	}
	return false;
}

/** Check if there's a text selection inside the node (don't navigate on text select) */
function hasTextSelection(node: Element): boolean {
	if (typeof document === 'undefined' || !('getSelection' in document)) {
		return false;
	}
	const selection = document.getSelection();
	if (selection == null || selection.isCollapsed) {
		return false;
	}
	return node.contains(selection.anchorNode);
}

export interface UseClickableContainerOptions {
	/** The outer container element, e.g. from `bind:this`. */
	container: HTMLElement | null;
	/** The primary interactive element inside (link, button). */
	interactive?: HTMLElement | null;
	/** Click handler */
	onclick?: (event: MouseEvent) => void;
	/** Navigation URL — when provided, clicking the container navigates */
	href?: string;
	/** Link target */
	target?: string;
	/** Whether the container is disabled */
	disabled?: boolean;
}

export interface ClickableContainerResult {
	onclick: (event: MouseEvent) => void;
	onmouseup: (event: MouseEvent) => void;
}

/**
 * Makes a container element clickable while preserving nested interactive
 * element behaviour.
 *
 * When the user clicks the container surface (not a nested button or link),
 * the hook fires `onclick` or navigates to `href`. When the user clicks a
 * nested interactive element it does nothing — that element handles its own
 * event.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let container = $state<HTMLElement | null>(null);
 *   const clickable = useClickableContainer(() => ({
 *     container,
 *     onclick: () => console.log('card clicked')
 *   }));
 * </script>
 *
 * <div bind:this={container} {...clickable}>
 *   <p>Click anywhere on this card</p>
 *   <button onclick={() => alert('button')}>Nested button</button>
 * </div>
 * ```
 */
export function useClickableContainer(
	options: () => UseClickableContainerOptions
): ClickableContainerResult {
	// Mark container as pressable for the interactive selector check
	$effect(() => {
		const el = options().container;
		if (el) {
			el.setAttribute('data-pressable-container', 'true');
		}
	});

	function onclick(event: MouseEvent): void {
		const {
			container: containerEl,
			interactive,
			onclick: onClickProp,
			href,
			target,
			disabled = false
		} = options();

		if (disabled) {
			return;
		}

		if (!containerEl) {
			return;
		}

		// Don't trigger on text selection
		if (hasTextSelection(containerEl)) {
			return;
		}

		const eventTarget = event.target;
		if (!(eventTarget instanceof Element)) {
			return;
		}

		// If the click landed on or inside a nested interactive element, bail
		if (eventTarget !== event.currentTarget && hasInteractiveAncestor(eventTarget, containerEl)) {
			return;
		}

		// Fire the click handler
		onClickProp?.(event);
		if (event.defaultPrevented) {
			return;
		}

		// Navigate if href is provided
		if (href != null) {
			const shouldOpenNewTab = target === '_blank' || event.ctrlKey || event.metaKey;
			if (shouldOpenNewTab) {
				window.open(href, '_blank', 'noopener');
			} else if (interactive) {
				// Proxy click to the sr-only link so the framework link component
				// handles navigation (client-side transitions in SvelteKit, etc.).
				interactive.click();
			} else {
				window.location.href = href;
			}
		}

		// Proxy click to the interactive element if no explicit handler
		if (href == null && onClickProp == null && interactive) {
			const clickEvent = new MouseEvent('click', {
				bubbles: event.bubbles,
				cancelable: event.cancelable,
				ctrlKey: event.ctrlKey,
				metaKey: event.metaKey,
				shiftKey: event.shiftKey,
				altKey: event.altKey,
				button: event.button
			});
			interactive.dispatchEvent(clickEvent);
			event.stopPropagation();
		}
	}

	function onmouseup(event: MouseEvent): void {
		const { container: containerEl, href, disabled = false } = options();

		if (disabled) {
			return;
		}

		if (!containerEl) {
			return;
		}

		const eventTarget = event.target;
		if (!(eventTarget instanceof Element)) {
			return;
		}

		// Middle-click on href opens in new tab
		const isMiddleClick = event.button === 1;
		if (
			isMiddleClick &&
			href != null &&
			(eventTarget === event.currentTarget || !hasInteractiveAncestor(eventTarget, containerEl))
		) {
			window.open(href, '_blank', 'noopener');
		}
	}

	return { onclick, onmouseup };
}
