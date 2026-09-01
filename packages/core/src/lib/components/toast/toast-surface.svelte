<script lang="ts" module>
	import { INTERACTIVE_SELECTORS } from '../../hooks/use-clickable-container.svelte.js';
	import type { ToastProps } from './toast.svelte';
	import type { ToastGestureDirection } from './use-toast-gesture.js';

	const SWIPE_INTERACTIVE_TARGET_SELECTOR = `${INTERACTIVE_SELECTORS},[tabindex],[contenteditable]:not([contenteditable="false"])`;

	/**
	 * Whether a swipe starting on this target belongs to a control inside the
	 * card rather than to the card. Walks up to the card root (or `<body>`), so a
	 * drag begun on the dismiss button, an action, or any focusable/editable
	 * descendant never turns into a dismissal.
	 */
	function isInteractiveTarget(target: EventTarget | null, root: HTMLElement): boolean {
		if (!(target instanceof Element)) {
			return false;
		}
		let current: Element | null = target;
		while (current != null && current !== root && current !== document.body) {
			if (current.matches(SWIPE_INTERACTIVE_TARGET_SELECTOR)) {
				return true;
			}
			current = current.parentElement;
		}
		return false;
	}

	/**
	 * Deliberately not exported: upstream declares `ToastSurfaceProps` in
	 * `Toast.tsx` without exporting it, and `Toast/index.ts` publishes neither it
	 * nor `ToastSurface`. `gestureDirection` is resolved by `ToastViewport` from
	 * the stack's position, so it stays off the published `ToastProps` — a `Toast`
	 * rendered directly gets upstream's `1`.
	 */
	interface ToastSurfaceProps extends ToastProps {
		gestureDirection: ToastGestureDirection;
	}
</script>

<script lang="ts">
	import Button from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';
	import MediaTheme from '../../theme/media-theme.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useThemeMode } from '../../internal/theme-mode.svelte.js';
	import { useToastGesture } from './use-toast-gesture.js';
	import {
		toastRootAttrs,
		toastInnerAttrs,
		toastContentAttrs,
		toastEndContentAttrs
	} from './toast.stylex.js';

	/**
	 * Upstream's `ToastSurface`: the whole toast, plus the one prop `Toast` does
	 * not take. `Toast` is the published wrapper and renders this with
	 * `gestureDirection={1}`; `ToastViewport` renders it directly so a stack
	 * anchored to the top edge swipes upward.
	 */
	const {
		type,
		body,
		endContent,
		isAutoHide,
		autoHideDuration,
		isExiting = false,
		onDismiss,
		renderContent,
		gestureDirection
	}: ToastSurfaceProps = $props();

	const t = useTranslator();
	const themeMode = useThemeMode();

	// Deliberately plain `let`, not `$state`: these are upstream's refs. Nothing
	// renders from them, and making them reactive would feed the timer effect
	// below its own writes.
	let timer: ReturnType<typeof setTimeout> | null = null;
	let isPaused = false;
	// Capturing the initial value is the point — this is upstream's
	// `useRef(autoHideDuration)`. The effect below re-seeds it whenever the prop
	// genuinely changes; a live read would defeat `pauseTimer`'s bookkeeping.
	// svelte-ignore state_referenced_locally
	let remaining = autoHideDuration;
	let startTime: number | null = null;

	/**
	 * Upstream reads `onDismiss` through a ref because the viewport re-creates it
	 * on every render, and a `startTimer` depending on it would restart — and
	 * un-pause — this toast's timer whenever another toast arrives or leaves.
	 *
	 * Svelte obviates the ref twice over: a prop read is always current, and the
	 * read below happens inside a `setTimeout` callback, which is asynchronous
	 * and therefore outside the effect's tracking. So the timer effect depends on
	 * `autoHideDuration` and `isAutoHide` only, exactly as upstream's dependency
	 * list does.
	 */
	function startTimer(): void {
		if (!isAutoHide || isPaused) {
			return;
		}
		if (timer) {
			clearTimeout(timer);
		}
		startTime = Date.now();
		timer = setTimeout(() => {
			onDismiss('auto');
		}, remaining);
	}

	function pauseTimer(): void {
		if (!isAutoHide || isPaused) {
			return;
		}
		isPaused = true;
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		if (startTime != null) {
			const elapsed = Date.now() - startTime;
			// Upstream's 1000ms floor: a toast paused with under a second left is
			// *extended* to a second so it cannot vanish the instant focus returns.
			remaining = Math.max(remaining - elapsed, 1000);
		}
	}

	function resumeTimer(): void {
		if (!isAutoHide || !isPaused) {
			return;
		}
		isPaused = false;
		startTimer();
	}

	$effect(() => {
		remaining = autoHideDuration;
		startTimer();
		return () => {
			if (timer) {
				clearTimeout(timer);
			}
		};
	});

	// Pause the auto-hide timer while the window is not focused, so a toast
	// doesn't silently expire while the user is in another window or tab.
	$effect(() => {
		if (!isAutoHide) {
			return;
		}
		window.addEventListener('blur', pauseTimer);
		window.addEventListener('focus', resumeTimer);
		return () => {
			window.removeEventListener('blur', pauseTimer);
			window.removeEventListener('focus', resumeTimer);
		};
	});

	function handleDismiss(): void {
		onDismiss('manual');
	}

	/**
	 * Touch/pen swipe dismissal. The bindings carry the pen handlers *and* the
	 * attachment that stands in for upstream's `rootRef`, so they are spread on
	 * the card exactly where upstream spreads `bindings` and sets `ref`.
	 */
	const gesture = useToastGesture(() => ({
		direction: gestureDirection,
		enabled: !isExiting,
		canPauseTimer: isAutoHide,
		isTimerPaused: () => isPaused,
		pauseTimer,
		resumeTimer,
		dismiss: handleDismiss,
		shouldIgnoreTarget: isInteractiveTarget
	}));

	const isError = $derived(type === 'error');
	// The surface's media side is **measured**, not assumed — a theme can define
	// `--color-background-inverted` as anything, including a colour whose
	// contrast makes the assumed side unreadable. This is only the value
	// `mode="auto"` falls back to before the measurement lands.
	const fallbackMediaMode = $derived(isError || themeMode.current === 'light' ? 'dark' : 'light');

	const theme = $derived(themeProps('toast', { type }));
	const root = $derived(toastRootAttrs(isError, isExiting));
	const inner = toastInnerAttrs();
	const content = toastContentAttrs();
	const end = toastEndContentAttrs();
</script>

<!--
	Upstream uses `onFocusCapture`/`onBlurCapture` — React's `onFocus`/`onBlur`
	are delegated `focusin`/`focusout`, and the `*Capture` variants are their
	capture phase. Svelte spells that with a `capture` suffix, so the literal
	translation is `onfocusincapture`/`onfocusoutcapture`.

	The phase is load-bearing rather than incidental: on the bubble phase a
	descendant calling `stopPropagation()` on `focusin` would silently strip the
	pause, and an auto-hiding toast would expire under the user's cursor while
	they were tabbing through its own controls.
-->
<div
	role={isError ? 'alert' : 'status'}
	aria-live={isError ? 'assertive' : 'polite'}
	aria-atomic="true"
	onmouseenter={pauseTimer}
	onmouseleave={resumeTimer}
	onfocusincapture={pauseTimer}
	onfocusoutcapture={resumeTimer}
	{...gesture}
	{...theme}
	class={cx(theme.class, root.class)}
	style={root.style}
>
	<MediaTheme mode="auto" fallback={fallbackMediaMode}>
		{#if renderContent}
			{@render renderContent({
				body,
				endContent,
				type,
				isAutoHide,
				autoHideDuration,
				dismiss: handleDismiss
			})}
		{:else}
			<div class={inner.class} style={inner.style}>
				<div class={content.class} style={content.style}>
					{#if typeof body === 'function'}
						{@render body()}
					{:else}
						{body}
					{/if}
				</div>

				<div class={end.class} style={end.style}>
					{#if typeof endContent === 'function'}
						{@render endContent()}
					{:else}
						{endContent}
					{/if}
					<Button
						variant="ghost"
						size="sm"
						icon={dismissIcon}
						label={t('@astryx.toast.dismiss')}
						onclick={handleDismiss}
						isIconOnly
					/>
				</div>
			</div>
		{/if}
	</MediaTheme>
</div>

{#snippet dismissIcon()}
	<Icon icon="close" size="sm" color="inherit" />
{/snippet}
