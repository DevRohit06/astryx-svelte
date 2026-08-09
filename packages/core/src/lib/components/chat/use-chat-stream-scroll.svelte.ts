/**
 * Spring-based scroll-to-bottom with lock/unlock, ported from Astryx's
 * `Chat/useChatStreamScroll.ts`.
 *
 * - Locked (default): content growth auto-scrolls to bottom via a rAF spring
 * - Scrolling up (any source): unlocks immediately
 * - Scrolling settles at bottom: re-locks on `scrollend`
 * - The first fill positions instantly (whether content is present at mount or
 *   arrives async); only subsequent growth springs
 * - `scrollToBottom({behavior: 'instant'})` jumps in one frame, no animation
 *
 * Two translations, both this port's settled shapes:
 *
 * - **`scrollRef` becomes a getter.** Upstream takes a
 *   `RefObject<HTMLElement | null>` and reads `.current` on every call; the
 *   getter is read at exactly the same points, so the timing is identical. This
 *   is the `useOutlineFromDOM` / `useScrollSpy` translation.
 * - **Every `useRef` stays a plain `let`, and only the two `useState`s become
 *   `$state`.** Upstream's refs exist to hold mutable values the render never
 *   reads — velocity, the rAF tick stamp, the lock mirror — which is exactly
 *   what a closure variable is in Svelte. `lockedRef` in particular is *not*
 *   merged into `isLocked`: upstream keeps both because the animation loop must
 *   read the lock synchronously mid-frame, and a `$state` read inside a rAF
 *   callback is untracked anyway, so merging them would change nothing except
 *   to make the effect re-run. The pair is kept so the two sides read the same.
 *
 * The options are read once, as upstream's destructured parameters are — none
 * of them is in a dependency array that a caller could change usefully, and
 * upstream's own effect would tear down and re-listen if they did.
 *
 * Under `prefers-reduced-motion`, every spring path falls back to the instant
 * jump.
 */

import { useMediaQuery } from '../../hooks/use-media-query.svelte.js';

export interface ChatScrollToBottomOptions {
	/**
	 * `'instant'` jumps to the bottom in a single frame instead of running the
	 * spring animation. Use for programmatic positioning (opening a
	 * conversation, restoring a session) — keep the default `'spring'` for
	 * user-initiated scrolls like the scroll-to-bottom button. Mirrors the DOM's
	 * `scrollTo({behavior})`.
	 * @default 'spring'
	 */
	behavior?: 'instant' | 'spring';
}

export interface UseChatStreamScrollOptions {
	/**
	 * The scrollable container element. Upstream passes a `RefObject`; this port
	 * passes a getter, so the hook reads it live.
	 */
	scrollRef: () => HTMLElement | null;

	/**
	 * Whether scroll behavior is enabled.
	 * @default true
	 */
	enabled?: boolean;

	/**
	 * Distance from bottom (in px) within which scrollend re-locks. Keep small
	 * so users aren't yanked back from a slight scroll.
	 * @default 10
	 */
	lockThreshold?: number;

	/**
	 * Distance from bottom (in px) beyond which the scroll-to-bottom button
	 * becomes visible.
	 * @default 100
	 */
	buttonThreshold?: number;

	/**
	 * Spring damping — how quickly the animation settles.
	 * @default 0.7
	 */
	damping?: number;

	/**
	 * Spring stiffness — how fast the animation accelerates.
	 * @default 0.05
	 */
	stiffness?: number;

	/**
	 * Spring mass — higher = slower animation.
	 * @default 1.25
	 */
	mass?: number;
}

export interface UseChatStreamScrollReturn {
	/** Whether the user has scrolled up past `buttonThreshold`. */
	readonly isScrolledUp: boolean;

	/** Whether auto-scroll is locked (following content). */
	readonly isLocked: boolean;

	/** Scroll to the bottom of the container and re-lock. */
	scrollToBottom: (options?: ChatScrollToBottomOptions) => void;

	/** Scroll so a specific element is at the top of the visible area. No lock change. */
	scrollToMessage: (el: HTMLElement) => void;

	/** Lock auto-scroll and scroll to bottom. */
	lock: () => void;

	/** Unlock auto-scroll. */
	unlock: () => void;

	/** Scroll to bottom if currently locked. Call on content resize. */
	scrollIfLocked: () => void;

	/** Scroll to the last message in the container. */
	scrollToLastMessage: () => void;
}

const SIXTY_FPS_MS = 1000 / 60;

export function useChatStreamScroll(
	options: UseChatStreamScrollOptions
): UseChatStreamScrollReturn {
	// Every one of these is in an upstream dependency array — `enabled`,
	// `lockThreshold` and `buttonThreshold` in the listener effect (`:387`),
	// `damping`/`stiffness`/`mass` in `animate` (`:190`) — which is React's way of
	// saying "re-read on change". Destructuring them would freeze whatever the
	// caller passed at mount, so `enabled={!isSelecting}` could never turn
	// auto-scroll off. `$derived` is the counterpart to a dependency array: a
	// caller passing plain numbers is unaffected, and one passing getters tracks.
	const scrollRef = options.scrollRef;
	const enabled = $derived(options.enabled ?? true);
	const lockThreshold = $derived(options.lockThreshold ?? 10);
	const buttonThreshold = $derived(options.buttonThreshold ?? 100);
	const damping = $derived(options.damping ?? 0.7);
	const stiffness = $derived(options.stiffness ?? 0.05);
	const mass = $derived(options.mass ?? 1.25);

	// Under `prefers-reduced-motion` every spring path falls back to the instant
	// jump: the transcript still tracks the bottom, without animated travel.
	const prefersReducedMotion = useMediaQuery(() => '(prefers-reduced-motion: reduce)');

	let isScrolledUp = $state(false);
	let isLocked = $state(true);

	let locked = true;
	// True until the initial fill has been positioned — consumed by the first
	// scrollIfLocked that sees scrollable content.
	let initialFillPending = true;
	let velocity = 0;
	let animating = false;
	let lastTick: number | undefined = undefined;

	// For scroll direction detection
	let lastScrollTop = 0;
	// For synthetic scroll detection
	let lastScrollHeight = 0;
	let lastOffsetHeight = 0;

	// --- Spring animation ---

	function animate(): void {
		const el = scrollRef();
		if (!el || !locked) {
			animating = false;
			lastTick = undefined;
			velocity = 0;
			return;
		}

		if (el.scrollHeight <= el.clientHeight) {
			animating = false;
			lastTick = undefined;
			velocity = 0;
			return;
		}

		const target = el.scrollHeight - el.clientHeight;
		const diff = target - el.scrollTop;

		if (Math.abs(diff) < 0.5 && Math.abs(velocity) < 0.1) {
			el.scrollTop = target;
			animating = false;
			lastTick = undefined;
			velocity = 0;
			return;
		}

		const now = performance.now();
		const tickDelta = lastTick ? (now - lastTick) / SIXTY_FPS_MS : 1;
		lastTick = now;

		velocity = (damping * velocity + stiffness * diff) / mass;
		el.scrollTop += velocity * tickDelta;

		requestAnimationFrame(animate);
	}

	// Every spring entry point (scrollToBottom, lock, the scrollIfLocked growth
	// follow) funnels through here, so this one branch covers them all. Upstream
	// declares `startAnimation` after `jumpToBottom` because its `useCallback`
	// needs the value; a function declaration hoists, so the order here is the
	// one that reads best.
	function startAnimation(): void {
		if (!locked) {
			return;
		}
		if (prefersReducedMotion.matches) {
			jumpToBottom();
			return;
		}
		if (!animating) {
			animating = true;
			lastTick = undefined;
			requestAnimationFrame(animate);
		}
	}

	// Jump to the bottom in a single frame — cancels any in-flight spring so a
	// later animation tick can't fight the assignment.
	function jumpToBottom(): void {
		const el = scrollRef();
		if (!el) {
			return;
		}
		animating = false;
		velocity = 0;
		lastTick = undefined;
		el.scrollTop = el.scrollHeight - el.clientHeight;
		lastScrollTop = el.scrollTop;
	}

	// --- Public API ---

	function scrollToBottom(options?: ChatScrollToBottomOptions): void {
		locked = true;
		isLocked = true;
		isScrolledUp = false;
		initialFillPending = false;
		if (options?.behavior === 'instant') {
			jumpToBottom();
			return;
		}
		startAnimation();
	}

	function scrollToMessage(el: HTMLElement): void {
		const container = scrollRef();
		if (!container) {
			return;
		}
		const containerRect = container.getBoundingClientRect();
		const elRect = el.getBoundingClientRect();
		const offset = elRect.top - containerRect.top + container.scrollTop;
		container.scrollTo({ top: offset, behavior: 'instant' });
		lastScrollTop = container.scrollTop;
	}

	function scrollToLastMessage(): void {
		const container = scrollRef();
		if (!container) {
			return;
		}
		const messages = container.getElementsByClassName('astryx-chat-message');
		const last = messages[messages.length - 1];
		if (last instanceof HTMLElement) {
			scrollToMessage(last);
		}
	}

	function lock(): void {
		locked = true;
		isLocked = true;
		isScrolledUp = false;
		startAnimation();
	}

	function unlock(): void {
		locked = false;
		animating = false;
		isLocked = false;
	}

	function scrollIfLocked(): void {
		if (!enabled) {
			return;
		}
		if (!locked) {
			return;
		}
		// Initial fill: content appearing for the first time (e.g. an
		// async-loaded conversation) positions in one frame instead of
		// spring-flying from the top. Stays pending through empty/loading
		// resizes until the container is actually scrollable.
		const el = scrollRef();
		if (initialFillPending && el && el.scrollHeight > el.clientHeight) {
			initialFillPending = false;
			jumpToBottom();
			return;
		}
		startAnimation();
	}

	// --- Event listeners ---

	$effect(() => {
		const el = scrollRef();
		if (!el || !enabled) {
			return;
		}

		// Initialize tracking values
		lastScrollTop = el.scrollTop;
		lastScrollHeight = el.scrollHeight;
		lastOffsetHeight = el.offsetHeight;

		const onScroll = () => {
			const { scrollTop, scrollHeight, offsetHeight } = el;
			const dist = scrollHeight - scrollTop - offsetHeight;

			// Button visibility
			isScrolledUp = dist > buttonThreshold;

			// Detect synthetic scroll — Chrome fires scroll events when
			// scrollHeight or offsetHeight changes (content resize, keyboard).
			const scrollHeightChanged = scrollHeight !== lastScrollHeight;
			const offsetHeightChanged = offsetHeight !== lastOffsetHeight;
			lastScrollHeight = scrollHeight;
			lastOffsetHeight = offsetHeight;

			if (scrollHeightChanged || offsetHeightChanged) {
				// Synthetic scroll from resize — don't change lock state
				lastScrollTop = scrollTop;
				return;
			}

			// Scroll direction — unlock on scroll up
			const isScrollingUp = scrollTop < lastScrollTop;
			lastScrollTop = scrollTop;

			if (isScrollingUp && locked) {
				locked = false;
				animating = false;
				isLocked = false;
			}
		};

		const onScrollEnd = () => {
			const dist = el.scrollHeight - el.scrollTop - el.offsetHeight;
			if (dist <= lockThreshold) {
				locked = true;
				isLocked = true;
			}
		};

		// Wheel up while animating — interrupt immediately. onScroll direction
		// detection covers most cases, but wheel fires before the scroll
		// position updates so we can react faster.
		const onWheel = (e: WheelEvent) => {
			if (e.deltaY < 0 && animating) {
				locked = false;
				animating = false;
				isLocked = false;
			}
		};

		// Touch move — user is dragging, take control
		const onTouchMove = () => {
			if (animating) {
				locked = false;
				animating = false;
				isLocked = false;
			}
		};

		el.addEventListener('scroll', onScroll, { passive: true });
		el.addEventListener('scrollend', onScrollEnd);
		el.addEventListener('wheel', onWheel, { passive: true });
		el.addEventListener('touchmove', onTouchMove, { passive: true });

		// Initial scroll to bottom — content already present at mount.
		requestAnimationFrame(() => {
			if (el.scrollHeight > el.clientHeight) {
				el.scrollTop = el.scrollHeight - el.clientHeight;
				lastScrollTop = el.scrollTop;
				initialFillPending = false;
			}
		});

		return () => {
			el.removeEventListener('scroll', onScroll);
			el.removeEventListener('scrollend', onScrollEnd);
			el.removeEventListener('wheel', onWheel);
			el.removeEventListener('touchmove', onTouchMove);
		};
	});

	return {
		get isScrolledUp() {
			return isScrolledUp;
		},
		get isLocked() {
			return isLocked;
		},
		scrollToBottom,
		scrollToMessage,
		lock,
		unlock,
		scrollIfLocked,
		scrollToLastMessage
	};
}
