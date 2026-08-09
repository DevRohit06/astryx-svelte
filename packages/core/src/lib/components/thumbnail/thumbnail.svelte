<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';

	export interface ThumbnailProps extends BaseProps<HTMLDivElement> {
		/**
		 * Image source for the preview. A skeleton shows while it loads, the image
		 * on success, and a placeholder on error.
		 */
		src?: string;
		/** Alt text. Required for accessibility whenever `src` is set. */
		alt?: string;
		/**
		 * Accessible label, e.g. the file name. Not rendered as text — it becomes
		 * the tooltip, the group's accessible name, and part of the remove button's.
		 */
		label?: string;
		/**
		 * Called when the remove button is clicked. Setting it is what puts the
		 * overlaid close button in the top-right corner.
		 *
		 * Keeps upstream's casing: unlike `onclick`, this is a callback prop and
		 * never reaches an element, so there is no DOM event name to match.
		 */
		onRemove?: (event: MouseEvent) => void;
		/**
		 * Click handler for opening a lightbox or detail view. Setting it makes the
		 * thumbnail interactive.
		 */
		onclick?: (event: MouseEvent) => void;
		/**
		 * Shows a loading state regardless of `src` — a shimmer while uploading,
		 * or a spinner overlay once a preview URL exists.
		 * @default false
		 */
		isLoading?: boolean;
		/** @default false */
		isDisabled?: boolean;
		/**
		 * When the remove button is visible.
		 * - `hover` — the button is revealed on hover, and on keyboard focus so
		 *   it stays reachable. On any touch-capable device it stays visible.
		 *   This is the default.
		 * - `always` — the button is always shown.
		 *
		 * Only has an effect when `onRemove` is set.
		 * @default 'hover'
		 */
		showRemoveOn?: 'always' | 'hover';
	}
</script>

<script lang="ts">
	import Button from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';
	import Skeleton from '../skeleton/skeleton.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import Tooltip from '../tooltip/tooltip.svelte';
	import { useContainerReveal } from '../../hooks/use-container-reveal.svelte.js';
	import { useDevWarning } from '../../hooks/use-dev-warning.svelte.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		thumbnailImageAttrs,
		thumbnailImageContainerAttrs,
		thumbnailInsetBorderAttrs,
		thumbnailInteractiveButtonAttrs,
		thumbnailPlaceholderAttrs,
		thumbnailRemoveButtonXstyle,
		thumbnailRemoveSlotAttrs,
		thumbnailRootAttrs,
		thumbnailUploadOverlayAttrs
	} from './thumbnail.stylex.js';

	/**
	 * A square preview for an image attachment.
	 *
	 * Shows a skeleton shimmer while the image is still uploading, the image on
	 * success, or a placeholder silhouette when there is no source. An overlaid
	 * remove button appears when `onRemove` is set, revealed on hover/focus by
	 * default and always visible on touch.
	 *
	 * **The remove button no longer samples the picture.** It used to: the button
	 * sits *on* the image, so its contrast depended on what the image looked like
	 * in that corner, and `useImageMode` scored the sampled pixels with APCA to
	 * pick an inverted `<MediaTheme>`. Upstream replaced that in 0.1.9 with a
	 * fixed translucent scrim (`--color-overlay`) plus an `--color-on-dark` icon,
	 * which reads on any image without sampling — so both the hook call and the
	 * `MediaTheme` wrapper are gone from here. `useImageMode` itself stays
	 * exported, unused by core, exactly as upstream keeps it.
	 *
	 * **The hover reveal is no longer Thumbnail's own CSS either.** Upstream
	 * 0.3.0 moved `showRemoveOn="hover"` onto `useContainerReveal` and deleted
	 * `thumbnail.markers.stylex.ts`; the hook hands out a marker for the image
	 * container and the matching reveal block for the remove slot. No API change
	 * — `showRemoveOn` still gates it — and the remove button still stays mounted,
	 * focusable and in the a11y tree, revealed on `:focus-within` and always
	 * visible on touch.
	 *
	 * @example
	 * ```svelte
	 * <Thumbnail src="/photo.jpg" alt="Vacation photo" onRemove={() => {}} />
	 * <Thumbnail src="/preview.png" alt="Preview" onclick={() => {}} label="preview.png" />
	 * ```
	 */

	const {
		src,
		alt,
		label,
		onRemove,
		onclick,
		isLoading = false,
		isDisabled = false,
		showRemoveOn = 'hover',
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: ThumbnailProps = $props();

	/** What either reveal getter hands back — `{}` while the reveal is inert. */
	type RevealAttrs = { class?: string; style?: string };

	const t = useTranslator();

	// Track the exact src that failed (rather than a boolean) so a changed src
	// gets a fresh load attempt instead of the stale error.
	let erroredSrc = $state<string | undefined>(undefined);

	const hasSrc = $derived(src != null);
	const hasError = $derived(hasSrc && erroredSrc === src);
	const showSkeleton = $derived(isLoading && !hasSrc);
	const showImage = $derived(hasSrc && !showSkeleton && !hasError);
	const showUploadOverlay = $derived(isLoading && hasSrc);
	const showPlaceholder = $derived((!isLoading && !hasSrc) || hasError);
	const isInteractive = $derived(onclick != null && !isDisabled && !isLoading);
	const hasRemove = $derived(onRemove != null && !isDisabled);
	const isHoverReveal = $derived(hasRemove && showRemoveOn === 'hover');
	const reveal = useContainerReveal(() => ({ isEnabled: isHoverReveal }));
	const accessibleName = $derived(
		label && alt ? `${label} — ${alt}` : (label ?? alt ?? t('@astryx.thumbnail.fallbackName'))
	);

	// Without `alt`, the image is explicitly decorative rather than silently
	// empty-alt, matching Avatar's handling of unnamed images.
	const isImageDecorative = $derived(!alt);

	// Dev-time guardrail: `src` with no `alt` hides the image from assistive
	// technology. That is fine when the thumbnail is otherwise named — `label`
	// (or a consumer-provided aria name) becomes the group's accessible name —
	// but with no name source at all the group falls back to a generic
	// "thumbnail".
	//
	// This was a bare init-time `console.warn` justified by a comment claiming it
	// "warns during SSR as upstream's render-time `useDevWarning` does". **That was
	// false on both halves** — upstream's `useDevWarning` is `useEffect`-based and
	// never warns during SSR — so the init statement diverged rather than matched:
	// two lines (server + hydrate) where upstream emits one, silence when props
	// later become the bad combination, and no `NODE_ENV` gate so it shipped.
	// `checkbox-list-item.svelte` carried the identical claim; both are now on the
	// real hook, which landed with `useContainerReveal` this batch.
	useDevWarning(
		'Thumbnail',
		'`src` is set without `alt` or `label`. The image is treated as decorative ' +
			'and hidden from assistive technology, and the thumbnail falls back to a ' +
			'generic "thumbnail" name. Pass `alt` to describe the image content, or ' +
			'`label` (file name) to name the thumbnail.',
		() =>
			src != null &&
			alt == null &&
			label == null &&
			rest['aria-label'] == null &&
			rest['aria-labelledby'] == null
	);

	const root = $derived(thumbnailRootAttrs(isDisabled, xstyle));
	const container = $derived(thumbnailImageContainerAttrs(isInteractive));
	const removeSlot = thumbnailRemoveSlotAttrs();
	// Upstream merges the hook's props into each element with `mergeProps`, which
	// concatenates the two class strings rather than re-running StyleX's merge —
	// so `cx` is the exact counterpart, not an approximation.
	const containerReveal: RevealAttrs = $derived(isHoverReveal ? reveal.getContainerProps() : {});
	// The remove button is absolutely positioned in the corner, so it is already
	// out of flow — an opacity-only reveal (layout preserved) matches its overlay
	// placement instead of the clip recipe.
	const removeReveal: RevealAttrs = $derived(
		isHoverReveal ? reveal.getContentRevealProps({ isLayoutPreserved: true }) : {}
	);
	const theme = themeProps('thumbnail');
	const imageAttrs = thumbnailImageAttrs();
	const insetBorder = thumbnailInsetBorderAttrs();
	const placeholder = thumbnailPlaceholderAttrs();
	const interactiveButton = thumbnailInteractiveButtonAttrs();
	const uploadOverlay = thumbnailUploadOverlayAttrs();
</script>

{#snippet imageContent()}
	{#if showImage}
		<img
			{src}
			alt={alt ?? ''}
			role={isImageDecorative ? 'presentation' : undefined}
			aria-hidden={isImageDecorative || undefined}
			onerror={() => (erroredSrc = src)}
			class={imageAttrs.class}
			style={imageAttrs.style}
		/>
	{/if}
	{#if showSkeleton}
		<Skeleton radius={2} />
	{/if}
	{#if showPlaceholder}
		<div class={placeholder.class} style={placeholder.style}>
			<svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path
					d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2M8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-5.5z"
				/>
			</svg>
		</div>
	{/if}
{/snippet}

{#snippet thumbnail()}
	<div
		{...theme}
		role="group"
		aria-label={accessibleName}
		class={cx(theme.class, root.class, className)}
		style={mergeStyle(root.style, styleProp as string | undefined)}
		{...rest}
	>
		<div
			class={cx(container.class, containerReveal.class)}
			style={mergeStyle(container.style, containerReveal.style)}
		>
			{#if isInteractive}
				<button
					type="button"
					{onclick}
					aria-label={t('@astryx.thumbnail.open', { accessibleName })}
					class={interactiveButton.class}
					style={interactiveButton.style}
				>
					{@render imageContent()}
				</button>
			{:else}
				{@render imageContent()}
			{/if}

			{#if showImage}
				<div class={insetBorder.class} style={insetBorder.style}></div>
			{/if}

			{#if showUploadOverlay}
				<div class={uploadOverlay.class} style={uploadOverlay.style}>
					<Spinner size="sm" shade="onMedia" />
				</div>
			{/if}

			{#if hasRemove}
				<div
					class={cx(removeSlot.class, removeReveal.class)}
					style={mergeStyle(removeSlot.style, removeReveal.style)}
				>
					<Button
						label={t('@astryx.thumbnail.remove', { accessibleName })}
						variant="secondary"
						size="sm"
						isIconOnly
						xstyle={thumbnailRemoveButtonXstyle}
						onclick={(event) => {
							event.stopPropagation();
							onRemove?.(event);
						}}
					>
						{#snippet icon()}
							<Icon icon="close" size="xsm" />
						{/snippet}
					</Button>
				</div>
			{/if}
		</div>
	</div>
{/snippet}

{#if label != null}
	<!-- Wrapped rather than driven from here, as upstream does: the tooltip's
	     `display: contents` wrapper finds this div as its first element child. -->
	<Tooltip content={label}>{@render thumbnail()}</Tooltip>
{:else}
	{@render thumbnail()}
{/if}
