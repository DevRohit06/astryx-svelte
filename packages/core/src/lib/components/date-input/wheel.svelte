<script lang="ts" module>
	export interface WheelOption {
		/** Stable numeric identity of the row (a month 1-12, or a year). */
		value: number;
		/** Row text. */
		label: string;
		/** Rows outside min/max stay visible but cannot be committed. */
		isDisabled?: boolean;
	}

	export interface WheelProps {
		/** Accessible name for the column, e.g. "Month". */
		label: string;
		/** Rows, top to bottom. */
		options: ReadonlyArray<WheelOption>;
		/** Committed value; must match one option's `value`. */
		value: number;
		/** Fired when the wheel comes to rest on a different, enabled row. */
		onChange: (value: number) => void;
		/**
		 * False while the wheel is hidden — scroll offsets of a display:none
		 * scroller are meaningless, so listeners and the initial scroll wait.
		 */
		isActive?: boolean;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { useScrollSettle } from './use-scroll-settle.svelte.js';
	import { useOwnScrollGesture } from './use-own-scroll-gesture.svelte.js';
	import { usePointerDragScroll } from './use-pointer-drag-scroll.svelte.js';
	import {
		wheelBandAttrs,
		wheelColumnAttrs,
		wheelItemAttrs,
		wheelItemInnerAttrs,
		wheelScrollerAttrs
	} from './wheel.stylex.js';

	/**
	 * One snap-scrolling picker column, ported from Astryx's
	 * `DateInput/Wheel.tsx`.
	 *
	 * Accessibility: this is a listbox, not a novel widget. It is one tab stop
	 * with arrow/Home/End/PageUp/PageDown keys, `aria-activedescendant` tracking
	 * the active row, and every row reachable by tap — none of which depends on
	 * the scroll-driven decoration.
	 *
	 * Internal to `DateInput`; not exported from the barrel, exactly as upstream
	 * keeps it out of `DateInput/index.ts`.
	 */
	let { label, options, value, onChange, isActive = true }: WheelProps = $props();

	const uid = $props.id();
	let scroller = $state<HTMLDivElement | null>(null);

	const selectedIndex = $derived(
		Math.max(
			0,
			options.findIndex((o) => o.value === value)
		)
	);

	// Which row is under the band right now. Tracks the finger during a scroll;
	// `selectedIndex` only catches up when the wheel settles.
	//
	// The initialiser is upstream's `useState(selectedIndex)`: it runs once, at
	// component init, and reads the props directly rather than the `$derived`
	// above — a `$derived` read here would be evaluated in the same untracked
	// initialisation pass anyway, and spelling out the expression keeps the
	// "once, from the first render's value" semantics visible.
	//
	// `svelte-ignore`, not a fix: reading the props here is the whole point,
	// and Svelte's suggestion (a `$derived`) would make the highlight track the
	// committed value instead of the finger.
	// svelte-ignore state_referenced_locally
	let activeIndex = $state(
		Math.max(
			0,
			options.findIndex((o) => o.value === value)
		)
	);

	/**
	 * Row height in px, read from layout rather than assumed, so a theme that
	 * retunes the wheel item size still lands on the right row.
	 */
	function itemBlockSize(): number {
		const first = scroller?.firstElementChild;
		return first instanceof HTMLElement && first.offsetHeight > 0 ? first.offsetHeight : 0;
	}

	function scrollToIndex(index: number, behavior: ScrollBehavior): void {
		const size = itemBlockSize();
		if (scroller == null || size === 0) {
			return;
		}
		scroller.scrollTo({ top: index * size, behavior });
	}

	// Commit on rest. A disabled row is bounced back to the committed one
	// rather than silently keeping a value the wheel is not showing.
	//
	// Declared here, above the park effect, because that effect consults the
	// `isAtRest` this returns before it repositions anything.
	const settle = useScrollSettle(
		() => scroller,
		(element) => {
			const size = itemBlockSize();
			if (size === 0) {
				return;
			}
			const index = Math.min(options.length - 1, Math.max(0, Math.round(element.scrollTop / size)));
			const option = options[index];
			if (option == null || option.isDisabled) {
				scrollToIndex(selectedIndex, 'smooth');
				return;
			}
			if (option.value !== value) {
				onChange(option.value);
			}
		},
		() => isActive
	);

	// Park the committed row under the band whenever the wheel is shown, or the
	// value is changed from outside (the calendar scrolled to another month).
	//
	// NEVER while the wheel is still moving. A scroller that is mid-gesture or
	// still carrying momentum is the user's, and repositioning it does not stop
	// the momentum — on iOS it feeds a cycle where the scroll this causes reads
	// as a new settle, commits the next row along, and parks again. See
	// use-scroll-settle. The settle handler re-checks the position afterwards, so
	// a correction that is genuinely needed still happens, just at rest.
	//
	// `settle.isAtRest` is deliberately NOT reactive: it is upstream's ref, and
	// making it a rune would re-run this effect on every scroll event — which is
	// the mid-flight repositioning the flag exists to prevent.
	$effect(() => {
		const index = selectedIndex;
		const node = scroller;
		if (!isActive || !settle.isAtRest) {
			return;
		}
		const size = itemBlockSize();
		if (node == null || size === 0) {
			return;
		}
		if (Math.round(node.scrollTop / size) !== index) {
			node.scrollTo({ top: index * size, behavior: 'auto' });
		}
		untrack(() => {
			activeIndex = index;
		});
	});

	// Highlight follows the finger. rAF-throttled: a scroll can fire far more
	// often than the display refreshes, and this only feeds a repaint.
	$effect(() => {
		const node = scroller;
		const count = options.length;
		if (node == null || !isActive) {
			return;
		}
		let frame: number | undefined;
		const onScroll = (): void => {
			if (frame != null) {
				return;
			}
			frame = requestAnimationFrame(() => {
				frame = undefined;
				const size = itemBlockSize();
				if (size === 0) {
					return;
				}
				activeIndex = Math.min(count - 1, Math.max(0, Math.round(node.scrollTop / size)));
			});
		};
		node.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			node.removeEventListener('scroll', onScroll);
			if (frame != null) {
				cancelAnimationFrame(frame);
				frame = undefined;
			}
		};
	});

	// Keep the finger. Inside a BottomSheet the sheet would otherwise read a
	// downward drag here as swipe-to-dismiss; see use-own-scroll-gesture. Gated
	// on isActive because the hidden panel keeps its layout box.
	// 'all': a wheel scrolls vertically, the same axis the sheet wants, so
	// there is no way to share — it takes every touch that lands on it.
	useOwnScrollGesture(
		() => scroller,
		() => 'all',
		() => ({ isEnabled: isActive })
	);

	// A mouse cannot drag a scroll container, so without this the wheel ignores
	// the one gesture its shape invites. Touch is untouched — it pans natively,
	// with momentum this could not match. See use-pointer-drag-scroll.
	usePointerDragScroll(
		() => scroller,
		() => isActive
	);

	function moveBy(delta: number): void {
		const next = Math.min(options.length - 1, Math.max(0, activeIndex + delta));
		const option = options[next];
		if (option == null || option.isDisabled) {
			return;
		}
		activeIndex = next;
		scrollToIndex(next, 'smooth');
		if (option.value !== value) {
			onChange(option.value);
		}
	}

	function handleKeyDown(event: KeyboardEvent): void {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				moveBy(1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				moveBy(-1);
				break;
			case 'PageDown':
				event.preventDefault();
				moveBy(10);
				break;
			case 'PageUp':
				event.preventDefault();
				moveBy(-10);
				break;
			case 'Home':
				event.preventDefault();
				moveBy(-activeIndex);
				break;
			case 'End':
				event.preventDefault();
				moveBy(options.length - 1 - activeIndex);
				break;
			default:
				break;
		}
	}

	function handleOptionClick(option: WheelOption, index: number): void {
		if (option.isDisabled) {
			return;
		}
		activeIndex = index;
		scrollToIndex(index, 'smooth');
		if (option.value !== value) {
			onChange(option.value);
		}
	}

	const columnAttrs = wheelColumnAttrs();
	const bandAttrs = wheelBandAttrs();
	const scrollerAttrs = wheelScrollerAttrs();
	const itemInnerAttrs = wheelItemInnerAttrs();
</script>

<div class={columnAttrs.class} style={columnAttrs.style}>
	<div aria-hidden="true" class={bandAttrs.class} style={bandAttrs.style}></div>
	<div
		bind:this={scroller}
		role="listbox"
		aria-label={label}
		aria-activedescendant={`${uid}-${options[activeIndex]?.value}`}
		tabindex="0"
		onkeydown={handleKeyDown}
		class={scrollerAttrs.class}
		style={scrollerAttrs.style}
	>
		{#each options as option, index (option.value)}
			{@const attrs = wheelItemAttrs(index === activeIndex, option.isDisabled === true)}
			<!--
				The listbox is ONE tab stop and tracks the active row with
				`aria-activedescendant`, which is the APG pattern and upstream's; giving
				each option a tabindex would put a hundred years of months in the tab
				order. The keyboard vocabulary lives on the scroller's `onkeydown`.
			-->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_interactive_supports_focus -->
			<div
				id={`${uid}-${option.value}`}
				role="option"
				aria-selected={option.value === value}
				aria-disabled={option.isDisabled || undefined}
				onclick={() => handleOptionClick(option, index)}
				class={attrs.class}
				style={attrs.style}
			>
				<span class={itemInnerAttrs.class} style={itemInnerAttrs.style}>{option.label}</span>
			</div>
		{/each}
	</div>
</div>
