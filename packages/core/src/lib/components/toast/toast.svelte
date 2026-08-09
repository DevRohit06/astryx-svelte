<script lang="ts" module>
	import type { ToastType, ToastDismissReason, ToastContent } from './types.js';

	export interface ToastProps {
		type: ToastType;
		body: ToastContent;
		endContent?: ToastContent;
		isAutoHide: boolean;
		autoHideDuration: number;
		isExiting?: boolean;
		onDismiss: (reason: ToastDismissReason) => void;
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
	import {
		toastRootAttrs,
		toastInnerAttrs,
		toastContentAttrs,
		toastEndContentAttrs
	} from './toast.stylex.js';

	/**
	 * Individual toast notification.
	 *
	 * Renders with inverted surface colors for the default variant, and
	 * error-inverted for the error variant. Uses `MediaTheme` to set the correct
	 * token context for children. Pauses auto-dismiss on hover and focus.
	 *
	 * `ToastProps` is a closed list upstream — it does not extend `BaseProps`, so
	 * there is no `class`/`style`/`xstyle` and no rest spread. A toast is only
	 * ever constructed by `ToastViewport` from a `ToastOptions`.
	 *
	 * @example
	 * ```svelte
	 * <Toast
	 *   type="info"
	 *   body="Saved successfully"
	 *   isAutoHide={true}
	 *   autoHideDuration={5000}
	 *   onDismiss={(reason) => removeToast(id, reason)}
	 * />
	 * ```
	 */
	const {
		type,
		body,
		endContent,
		isAutoHide,
		autoHideDuration,
		isExiting = false,
		onDismiss
	}: ToastProps = $props();

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

	const isError = $derived(type === 'error');
	// Determine media mode: inverted surface is always dark in light mode,
	// always light in dark mode. Error toast is always on a dark surface.
	const mediaMode = $derived(isError || themeMode.current === 'light' ? 'dark' : 'light');

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
	{...theme}
	class={cx(theme.class, root.class)}
	style={root.style}
>
	<MediaTheme mode={mediaMode}>
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
	</MediaTheme>
</div>

{#snippet dismissIcon()}
	<Icon icon="close" size="sm" color="inherit" />
{/snippet}
