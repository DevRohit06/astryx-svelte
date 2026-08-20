<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	/** The kind of media a `LightboxMedia` entry points at. */
	export type LightboxMediaType = 'image' | 'video';

	export interface LightboxMedia {
		/** Media source URL. */
		src: string;
		/** Alternative text. Also the dialog's accessible name when non-empty. */
		alt: string;
		/**
		 * Caption rendered under the media.
		 *
		 * Upstream types this `ReactNode`; a toast-style leaf slot here, so a bare
		 * string works and a `Snippet` covers rich content.
		 */
		caption?: string | Snippet;
		/** @default 'image' */
		type?: LightboxMediaType;
	}

	export interface LightboxProps extends BaseProps<HTMLDialogElement> {
		isOpen: boolean;
		onOpenChange: (isOpen: boolean) => void;
		media: LightboxMedia | LightboxMedia[];
		/** Controlled index. Leave undefined for uncontrolled. */
		index?: number;
		/** @default 0 */
		defaultIndex?: number;
		onIndexChange?: (index: number) => void;
		/**
		 * Enable zoom on double-click, or Enter/Space/`+`/`-` via keyboard
		 * (images only). When zoomed, drag or use arrow keys to pan.
		 * @default false
		 */
		hasZoom?: boolean;
		/** Sets `autoplay` on a video item. @default false */
		hasAutoPlay?: boolean;
	}
</script>

<script lang="ts">
	import Icon from '../icon/icon.svelte';
	import IconButton from '../icon-button/icon-button.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useAnnounce } from '../../hooks/use-announce.js';
	import { useScrollLock } from '../../hooks/use-scroll-lock.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { rtlMirrorAttrs } from '../../utils/rtl.stylex.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		lightboxDialogAttrs,
		lightboxContainerAttrs,
		lightboxMediaGroupAttrs,
		lightboxImageWrapperAttrs,
		lightboxImageAttrs,
		lightboxVideoAttrs,
		lightboxCaptionAttrs,
		lightboxCounterAttrs,
		lightboxControlButtonStyle,
		lightboxCloseButtonStyle,
		lightboxNavButtonStyle,
		lightboxNavPrevStyle,
		lightboxNavNextStyle
	} from './lightbox.stylex.js';

	/**
	 * Pan distance (px) per arrow-key press while zoomed. Offsets move the
	 * viewport in the arrow's direction — pressing ArrowRight reveals content to
	 * the right, so the image itself shifts left (negative x), matching how
	 * scrolling and pointer-drag panning feel.
	 */
	const KEYBOARD_PAN_STEP = 50;
	const KEYBOARD_PAN_OFFSETS: Record<string, [number, number]> = {
		ArrowLeft: [KEYBOARD_PAN_STEP, 0],
		ArrowRight: [-KEYBOARD_PAN_STEP, 0],
		ArrowUp: [0, KEYBOARD_PAN_STEP],
		ArrowDown: [0, -KEYBOARD_PAN_STEP]
	};

	/**
	 * A fullscreen overlay for viewing images at full resolution.
	 *
	 * Uses the native `<dialog>` element with `showModal()` for focus containment
	 * and top-layer promotion — there is no `Layer`, no Popover API and no
	 * `useFocusTrap`; the browser provides all three.
	 *
	 * Optionally supports zoom (double-click, Enter/Space on the image, or
	 * `+`/`-` to toggle 2x) and pan (drag or arrow keys when zoomed; arrows
	 * navigate the gallery when not zoomed).
	 *
	 * @example
	 * ```svelte
	 * <Lightbox
	 *   isOpen={isOpen}
	 *   onOpenChange={(open) => (isOpen = open)}
	 *   media={photos}
	 *   index={currentIndex}
	 *   onIndexChange={(i) => (currentIndex = i)}
	 * />
	 * ```
	 */
	const {
		isOpen,
		onOpenChange,
		media,
		index: controlledIndex,
		defaultIndex = 0,
		onIndexChange,
		hasZoom = false,
		hasAutoPlay = false,
		xstyle,
		class: className,
		style: styleProp,
		onclick: onclickProp,
		onkeydown: onkeydownProp,
		oncancel: oncancelProp,
		...rest
	}: LightboxProps = $props();

	const t = useTranslator();
	const announce = useAnnounce();

	let dialogEl = $state<HTMLDialogElement | null>(null);
	// Upstream's `containerRef`. Not `$state`: written by `bind:this` and read
	// only inside the click handler, so nothing should re-run when it lands.
	// svelte-ignore non_reactive_update
	let containerEl: HTMLDivElement | null = null;
	// Upstream's `triggerElementRef`. A plain `let`: nothing renders from it.
	let triggerElement: Element | null = null;

	// Index state (controlled + uncontrolled). `defaultIndex` seeds this once and
	// is never re-synced, as upstream's `useState(defaultIndex)` is not.
	const isControlled = $derived(controlledIndex !== undefined);
	// svelte-ignore state_referenced_locally
	let uncontrolledIndex = $state(defaultIndex);
	const index = $derived(isControlled ? (controlledIndex as number) : uncontrolledIndex);

	function setIndex(value: number): void {
		if (!isControlled) {
			uncontrolledIndex = value;
		}
		onIndexChange?.(value);
	}

	// Zoom/pan state
	let zoom = $state(1);
	let pan = $state({ x: 0, y: 0 });
	let isDragging = $state(false);
	// Upstream's `dragStartRef`.
	let dragStart = { x: 0, y: 0, panX: 0, panY: 0 };

	const mediaArray = $derived(Array.isArray(media) ? media : [media]);
	const isGallery = $derived(mediaArray.length > 1);
	const currentItem = $derived(
		mediaArray.length > 0 ? mediaArray[Math.min(index, mediaArray.length - 1)] : null
	);
	const currentType = $derived(currentItem?.type ?? 'image');
	const isVideo = $derived(currentType === 'video');
	const canPrev = $derived(isGallery && index > 0);
	const canNext = $derived(isGallery && index < mediaArray.length - 1);

	useScrollLock(() => isOpen);

	// Reset zoom/pan when the active media item changes.
	const currentSrc = $derived(currentItem?.src);
	$effect(() => {
		// Read both so this tracks exactly upstream's `[index, currentItem?.src]`.
		// Both are load-bearing: `currentSrc` alone would miss the reset when
		// navigating between two gallery entries that share a `src` (a duplicated
		// image), and `index` alone would miss an in-place `media` swap.
		void index;
		void currentSrc;
		zoom = 1;
		pan = { x: 0, y: 0 };
	});

	/**
	 * Announce gallery navigation to screen readers. Moving between images only
	 * updates the visual counter, which is silent to assistive tech, so mirror
	 * each change in a polite live region ("<alt>, 3 of 12", or "Image 3 of 12"
	 * when the image has no alt). Announce only when the image changes during an
	 * already-open session — not on mount, not when opening (even at a new index,
	 * since the dialog's aria-label already names the current image), and not on
	 * close.
	 *
	 * The two trackers are plain `let`s because they are upstream's refs, and
	 * because the effect writes them: making them `$state` would re-enter it.
	 */
	// svelte-ignore state_referenced_locally
	let prevIndex = index;
	// svelte-ignore state_referenced_locally
	let wasOpenTracker = isOpen;
	$effect(() => {
		const currentIndex = index;
		const open = isOpen;
		const list = mediaArray;
		const indexChanged = prevIndex !== currentIndex;
		const wasOpen = wasOpenTracker;
		prevIndex = currentIndex;
		wasOpenTracker = open;
		if (!indexChanged || !open || !wasOpen) {
			return;
		}
		const item = list[Math.min(currentIndex, list.length - 1)];
		// Upstream routed these two through `useTranslator` at 0.4.x; this port's
		// comment here used to say it hard-coded them, which was true at an earlier
		// pin and is why the strings stayed English after the catalogs moved on.
		const position = { index: currentIndex + 1, total: list.length };
		announce(
			item?.alt
				? t('@astryx.lightbox.mediaPosition', { alt: item.alt, ...position })
				: t('@astryx.lightbox.imagePosition', position)
		);
	});

	/**
	 * Open/close the dialog. Upstream uses `useIsomorphicLayoutEffect`; a plain
	 * `$effect` is its counterpart here, since effects never run on the server.
	 * (Not `$effect.pre`: this is a mutate-only layout effect, so it belongs
	 * after the DOM patch — `$effect.pre` would call `showModal()` before a
	 * simultaneous index change had patched the `<img src>`.)
	 *
	 * Upstream keys the effect on `[isOpen]` alone, because `dialogRef` is a ref.
	 * Ours also reads `dialogEl`, which is `$state` — deliberately, so the effect
	 * is ordering-proof if `bind:this` lands after it — and that widens the key
	 * set: the `<dialog>` lives inside `{#if currentItem}`, so it remounts
	 * whenever `media` goes empty and back. `wasShown` narrows the *capture* back
	 * to a genuine closed→open transition. Without it, a `media: [] → [item]`
	 * round-trip while open re-captures `triggerElement` at a moment when the
	 * modal has just left the top layer and `document.activeElement` is `<body>`,
	 * so the eventual close focuses the body instead of the trigger.
	 */
	let wasShown = false;
	$effect(() => {
		const dialog = dialogEl;
		if (!dialog) {
			return;
		}
		if (isOpen && !dialog.open) {
			if (!wasShown) {
				triggerElement = document.activeElement;
			}
			wasShown = true;
			dialog.showModal();
		} else if (!isOpen && dialog.open) {
			wasShown = false;
			dialog.close();
			if (triggerElement instanceof HTMLElement) {
				triggerElement.focus();
			}
		}
	});

	function handleClose(): void {
		onOpenChange(false);
	}

	function handleCancel(e: Event): void {
		// Composed, not replaced. Upstream spreads `{...props}` last, so a consumer's
		// `onCancel` *replaces* this one and Escape silently stops calling
		// `onOpenChange(false)` — the divergence `port/debts.md` used to record as
		// "ours is the safer order". Destructuring the handler out and invoking it
		// explicitly is what `CLAUDE.md` requires anyway, and it makes the rest
		// spread's position a non-question: the consumer is heard *and* the dialog
		// still closes.
		oncancelProp?.(e as Event & { currentTarget: EventTarget & HTMLDialogElement });
		if (e.defaultPrevented) {
			// A consumer that called `preventDefault()` is pinning the dialog open.
			return;
		}
		e.preventDefault();
		handleClose();
	}

	/**
	 * Backdrop click. The layout container fills the whole transparent dialog, so
	 * clicks on the visual backdrop (the dark area around the media) land on the
	 * container, never on the dialog element itself — treat both as the backdrop.
	 * A pan drag that ends over the backdrop still fires a click on the common
	 * ancestor; ignore it so releasing a drag doesn't dismiss.
	 */
	// Upstream's `didDragRef`.
	let didDrag = false;
	function handleBackdropClick(e: MouseEvent): void {
		if (didDrag) {
			didDrag = false;
			return;
		}
		if (e.target === e.currentTarget || e.target === containerEl) {
			handleClose();
		}
	}

	function goToPrev(): void {
		if (canPrev) {
			setIndex(index - 1);
		}
	}

	function goToNext(): void {
		if (canNext) {
			setIndex(index + 1);
		}
	}

	/**
	 * Zoom: double-click, Enter/Space on the image, or +/- keys toggle 1x <-> 2x.
	 * There is no wheel or pinch handler upstream, and no intermediate steps.
	 *
	 * Zoom changes are silent to assistive tech (only the transform changes), so
	 * mirror them in the polite live region, including a hint that arrow keys pan
	 * while zoomed.
	 */
	function applyZoom(next: number): void {
		if (!hasZoom || isVideo || next === zoom) {
			return;
		}
		zoom = next;
		pan = { x: 0, y: 0 };
		announce(next > 1 ? t('@astryx.lightbox.zoomedIn') : t('@astryx.lightbox.zoomedOut'));
	}

	function handleDoubleClick(): void {
		applyZoom(zoom === 1 ? 2 : 1);
	}

	// Keyboard navigation. While zoomed, arrows pan the image (matching common
	// lightbox conventions); when not zoomed they navigate the gallery.
	function handleKeyDown(e: KeyboardEvent): void {
		if (hasZoom && !isVideo) {
			if (e.key === '+' || e.key === '=') {
				e.preventDefault();
				applyZoom(2);
				return;
			}
			if (e.key === '-') {
				e.preventDefault();
				applyZoom(1);
				return;
			}
			if (zoom > 1 && KEYBOARD_PAN_OFFSETS[e.key] !== undefined) {
				e.preventDefault();
				const [dx, dy] = KEYBOARD_PAN_OFFSETS[e.key];
				pan = { x: pan.x + dx, y: pan.y + dy };
				return;
			}
		}
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			goToPrev();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			goToNext();
		}
	}

	// Enter/Space on the focused image wrapper (role="button") toggles zoom.
	function handleImageKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleDoubleClick();
		}
	}

	// Pan: drag when zoomed. Upstream applies no clamping, so a zoomed image can
	// be dragged entirely out of view — replicated.
	function handlePointerDown(e: PointerEvent): void {
		if (zoom <= 1 || !hasZoom) {
			return;
		}
		isDragging = true;
		didDrag = false;
		dragStart = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
	}

	$effect(() => {
		if (!isDragging) {
			return;
		}
		const handlePointerMove = (e: PointerEvent): void => {
			didDrag = true;
			pan = {
				x: dragStart.panX + (e.clientX - dragStart.x),
				y: dragStart.panY + (e.clientY - dragStart.y)
			};
		};
		const handlePointerUp = (): void => {
			isDragging = false;
		};
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
		return () => {
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
		};
	});

	const isZoomed = $derived(zoom > 1);
	const isZoomTarget = $derived(hasZoom && !isVideo);
	// Pan is divided by zoom because `scale` precedes `translate` in the list.
	const imageTransform = $derived(
		zoom === 1 ? null : `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
	);

	const theme = $derived(themeProps('lightbox'));
	const dialogAttrs = $derived(lightboxDialogAttrs(xstyle));
	const container = lightboxContainerAttrs();
	const mediaGroup = lightboxMediaGroupAttrs();
	const mirror = rtlMirrorAttrs();
	const counter = lightboxCounterAttrs();
	const captionAttrs = lightboxCaptionAttrs();
	const video = lightboxVideoAttrs();
	const imageWrapper = $derived(
		lightboxImageWrapperAttrs(
			isZoomTarget,
			!isVideo && hasZoom && !isZoomed,
			!isVideo && isZoomed,
			!isVideo && isDragging
		)
	);
	const image = $derived(lightboxImageAttrs(isDragging, imageTransform));
</script>

{#snippet closeIcon()}
	<Icon icon="close" size="sm" color="inherit" />
{/snippet}

<!--
	Mirrored under RTL so "previous" points toward the previous slide in both
	directions. The `navPrev`/`navNext` wrappers already flip position via
	`insetInlineStart`/`insetInlineEnd`; without this the glyphs would stay
	pointing the way they do in LTR while the buttons swap sides.
-->
{#snippet prevIcon()}
	<span class={mirror.class} style={mirror.style}>
		<Icon icon="chevronLeft" size="sm" color="inherit" />
	</span>
{/snippet}

{#snippet nextIcon()}
	<span class={mirror.class} style={mirror.style}>
		<Icon icon="chevronRight" size="sm" color="inherit" />
	</span>
{/snippet}

<!--
	Upstream returns `null` when there is no current item, so an empty `media`
	array renders nothing at all — not even the <dialog>.
-->
{#if currentItem}
	<dialog
		bind:this={dialogEl}
		oncancel={handleCancel}
		onclick={(e) => {
			handleBackdropClick(e);
			onclickProp?.(e);
		}}
		onkeydown={(e) => {
			handleKeyDown(e);
			onkeydownProp?.(e);
		}}
		aria-label={currentItem.alt || t('@astryx.lightbox.mediaViewer')}
		{...theme}
		class={cx(theme.class, dialogAttrs.class, className)}
		style={mergeStyle(dialogAttrs.style, styleProp as string | undefined)}
		{...rest}
	>
		<div bind:this={containerEl} class={container.class} style={container.style}>
			<IconButton
				icon={closeIcon}
				label={t('@astryx.lightbox.close')}
				variant="ghost"
				onclick={handleClose}
				xstyle={[lightboxCloseButtonStyle, lightboxControlButtonStyle]}
			/>

			<!--
				Gallery nav: prev — stays mounted and is disabled at the start of the
				range so pressing/arrowing to the boundary doesn't unmount the focused
				control and drop focus to <body>.
			-->
			{#if isGallery}
				<IconButton
					icon={prevIcon}
					label={t('@astryx.lightbox.previous')}
					variant="ghost"
					isDisabled={!canPrev}
					onclick={goToPrev}
					xstyle={[lightboxNavButtonStyle, lightboxNavPrevStyle, lightboxControlButtonStyle]}
				/>
			{/if}

			<!-- Media + caption group (centered together) -->
			<div class={mediaGroup.class} style={mediaGroup.style}>
				<!--
					The wrapper is a keyboard-operable zoom toggle when zoom is enabled:
					Enter/Space toggles, aria-pressed reflects state.
				-->
				<!--
					`role` is conditional, so the compiler cannot see that the element
					carrying `tabindex` is the one carrying `role="button"` — the two are
					set by the same flag and never appear apart.
				-->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					role={isZoomTarget ? 'button' : undefined}
					tabindex={isZoomTarget ? 0 : undefined}
					aria-pressed={isZoomTarget ? isZoomed : undefined}
					aria-label={isZoomTarget ? t('@astryx.lightbox.zoom') : undefined}
					class={imageWrapper.class}
					style={imageWrapper.style}
					ondblclick={isVideo ? undefined : handleDoubleClick}
					onkeydown={isZoomTarget ? handleImageKeyDown : undefined}
					onpointerdown={isVideo ? undefined : handlePointerDown}
				>
					{#if isVideo}
						<!-- svelte-ignore a11y_media_has_caption -->
						<video
							src={currentItem.src}
							aria-label={currentItem.alt}
							controls
							autoplay={hasAutoPlay}
							class={video.class}
							style={video.style}
						></video>
					{:else}
						<img
							src={currentItem.src}
							alt={currentItem.alt}
							draggable={false}
							class={image.class}
							style={image.style}
						/>
					{/if}
				</div>

				{#if currentItem.caption}
					<div class={captionAttrs.class} style={captionAttrs.style}>
						{#if typeof currentItem.caption === 'function'}
							{@render currentItem.caption()}
						{:else}
							{currentItem.caption}
						{/if}
					</div>
				{/if}
			</div>

			<!--
				Gallery nav: next — see "prev" above; stays mounted and disabled at the
				end of the range instead of unmounting.
			-->
			{#if isGallery}
				<IconButton
					icon={nextIcon}
					label={t('@astryx.lightbox.next')}
					variant="ghost"
					isDisabled={!canNext}
					onclick={goToNext}
					xstyle={[lightboxNavButtonStyle, lightboxNavNextStyle, lightboxControlButtonStyle]}
				/>
			{/if}

			<!-- Gallery counter -->
			{#if isGallery && mediaArray.length > 1}
				<div class={counter.class} style={counter.style}>
					{index + 1} / {mediaArray.length}
				</div>
			{/if}
		</div>
	</dialog>
{/if}
