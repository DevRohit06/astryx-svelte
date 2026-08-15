<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { BaseProps } from '../../base-props.js';
	import type { LinkComponentType } from '../link/types.js';
	import type { AvatarSize } from './avatar.stylex.js';

	export interface AvatarProps extends BaseProps<HTMLDivElement> {
		/** Accessible name and hover text. Falls back to `name`. */
		alt?: string;
		/** Tried when `src` fails. If this fails too, initials take over. */
		fallbackSrc?: string;
		/** Source of the initials, and the default accessible name. */
		name?: string;
		/**
		 * A named size (`xsm` 20px, `sm` 24px, `md` 36px, `lg` 48px, `xl` 128px)
		 * or a specific pixel value.
		 * @default 'md'
		 */
		size?: AvatarSize;
		src?: string;
		/**
		 * Corner content — typically an `AvatarStatusDot`.
		 *
		 * When the element carries a string `label` prop (as `AvatarStatusDot`
		 * does), the label is composed into the avatar's accessible name
		 * (e.g. "Jane Doe, Online") so assistive tech can reach the status —
		 * the `role="img"` root prunes descendant semantics (WCAG 4.1.2).
		 */
		status?: Snippet;
		/**
		 * Tooltip shown on hover (and keyboard focus).
		 * - omitted / `true`: show the avatar's `name`
		 * - a string: show that text instead
		 * - `false`: no tooltip
		 *
		 * The avatar owns this tooltip. It is NOT auto-disabled when wrapped in your
		 * own Tooltip/HoverCard — set `tooltip={false}` if you provide your own
		 * overlay. No tooltip is shown if `tooltip` is `true`/omitted and there is
		 * no (non-whitespace) `name`.
		 * @default true
		 */
		tooltip?: string | boolean;
		/**
		 * When provided, the avatar becomes an interactive link (`<a>` or custom
		 * link component) pointing at `href`. Follows the same element-swap rules as
		 * Button: `href` renders a link, otherwise `onclick` renders a
		 * `<button type="button">`, otherwise the avatar stays a static
		 * (non-focusable) element. An interactive avatar requires a meaningful
		 * accessible name via `alt` or `name`.
		 */
		href?: string;
		/**
		 * Custom link component to use when `href` is provided. Overrides the
		 * provider-level default set by LinkProvider. Useful for SvelteKit's
		 * `<a>`-wrapping router components or other router-aware components. Only
		 * applies when `href` is provided.
		 */
		as?: LinkComponentType;
		/** HTML target attribute for the link. Only applies when `href` is provided. */
		target?: string;
		/** HTML rel attribute for the link. Only applies when `href` is provided. */
		rel?: string;
		/**
		 * Click handler. When provided without `href`, renders the avatar as a
		 * focusable `<button type="button">`. An interactive avatar requires a
		 * meaningful accessible name via `alt` or `name`.
		 */
		onclick?: (event: MouseEvent) => void;
	}

	/**
	 * Reuse a single segmenter when the runtime supports Intl.Segmenter.
	 *
	 * Module scope, not instance scope: constructing a segmenter is expensive
	 * relative to reading two characters off it, and every avatar wants the same
	 * one. `<script module>` is Svelte's counterpart to upstream's module body.
	 */
	const graphemeSegmenter =
		typeof Intl.Segmenter === 'function'
			? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
			: null;
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import { createAttachmentKey } from 'svelte/attachments';
	import LinkElement from '../link/link-element.svelte';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import {
		setAvatarSizeContext,
		setAvatarStatusLabelSink,
		useAvatarGroup
	} from './avatar-context.svelte.js';
	import {
		avatarContentAttrs,
		avatarIconAttrs,
		avatarImageAttrs,
		avatarInitialsAttrs,
		avatarStatusAttrs,
		avatarWrapperAttrs,
		resolveSize
	} from './avatar.stylex.js';

	/**
	 * A user's profile picture: the image when there is one, the initials from
	 * `name` when there isn't, and a generic person icon when there is neither.
	 */
	const {
		alt,
		fallbackSrc,
		name,
		size = 'md',
		src,
		status,
		tooltip = true,
		href,
		as,
		target,
		rel,
		onclick,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: AvatarProps = $props();

	// The exact src that failed, not a boolean: a changed src/fallbackSrc then
	// gets a fresh attempt rather than inheriting the previous one's error.
	let erroredSrc = $state<string | undefined>(undefined);
	let erroredFallbackSrc = $state<string | undefined>(undefined);

	// Truthiness, not a null check, exactly as upstream: an empty `src` is no
	// source at all and must fall through to the next tier. Testing `!= null`
	// would emit `<img src="">`, which resolves to the document URL, and only
	// the error event that follows would correct it.
	const showImage = $derived(!!src && erroredSrc !== src);
	const showFallbackImage = $derived(
		!showImage && !!fallbackSrc && erroredFallbackSrc !== fallbackSrc
	);
	const showInitials = $derived(!showImage && !showFallbackImage && !!name);
	const showIcon = $derived(!showImage && !showFallbackImage && !name);

	// The status element's accessible label, handed up by `AvatarStatusDot`
	// rather than read off it — see `setAvatarStatusLabelSink`.
	let statusLabel = $state<string | undefined>(undefined);
	setAvatarStatusLabelSink((label) => (statusLabel = label));

	// A meaningful accessible name comes from `alt`/`name`, composed with the
	// status element's `label` when one is present ("Jane Doe, Online") — the
	// `role="img"` root prunes descendant semantics, so surfacing the label in
	// the avatar's own name is the only way assistive tech can reach the status
	// (WCAG 4.1.2). A labelled status alone is also meaningful. With neither a
	// name nor a labelled status, the avatar is decorative — expose it as
	// `presentation`/`aria-hidden` rather than announcing a generic "Avatar".
	const t = useTranslator();
	const nameLabel = $derived(alt || name);
	const accessibleName = $derived(
		nameLabel && statusLabel
			? t('@astryx.avatar.nameWithStatus', { name: nameLabel, status: statusLabel })
			: // `||`, not `??`, as upstream writes it: an explicit empty `alt`/`name`
				// must fall through to the status label, or a labelled status dot on a
				// deliberately-unnamed avatar yields `''` and the whole avatar goes
				// decorative — dropping the label the 0.2.0 fix exists to surface.
				nameLabel || statusLabel
	);
	const isDecorative = $derived(!accessibleName);

	// A group sets the size for every avatar inside it, overriding the prop.
	const group = useAvatarGroup();
	const resolvedSize = $derived(group?.().size ?? size);
	const numericSize = $derived(resolveSize(resolvedSize));

	setAvatarSizeContext(() => numericSize);

	// Element-swap trichotomy, copied from Button: `href` renders a link,
	// otherwise `onclick` renders a `<button>`, otherwise today's static element
	// is unchanged (the non-breaking default).
	const renderAsLink = $derived(href != null);
	const renderAsButton = $derived(!renderAsLink && onclick != null);
	const isInteractive = $derived(renderAsLink || renderAsButton);

	// The link branch resolves through `useLinkComponent`, as upstream's does:
	// an interactive avatar inside a `LinkProvider` must navigate through the
	// app's router, not a full-page `<a>`. `as` overrides the provider.
	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink(as));

	// Resolve the tooltip content:
	// - `false`            → no tooltip
	// - a string           → that string
	// - `true` / omitted   → the `name` (a whitespace-only name yields nothing)
	// Note: the *visible* tooltip prefers `name` (not `alt`); the *accessible
	// name* on the root still uses `alt || name` above, independent of this.
	const tooltipContent = $derived(
		tooltip === false ? undefined : typeof tooltip === 'string' ? tooltip : name
	);
	const trimmedTooltip = $derived(tooltipContent?.trim());
	const showTooltip = $derived(trimmedTooltip != null && trimmedTooltip !== '');
	// Whether the tooltip text is a consumer-authored override (a custom string)
	// rather than the default name. A custom description is worth wiring to
	// `aria-describedby` (it adds information, matching Button); the default name
	// tooltip is visual-only — its text duplicates the root `aria-label`, so
	// describing it too would double-announce the same name.
	const isCustomTooltip = $derived(typeof tooltip === 'string');

	const tooltipId = $props.id();
	const tooltipHook = useTooltip(() => ({
		id: tooltipId,
		placement: 'above',
		isEnabled: showTooltip
	}));
	// Upstream builds `describedByProp` as a whole **prop object** that is `null`
	// in the default-tooltip case, so `{...props}` supplies `aria-describedby`
	// untouched and only the custom-tooltip case composes. Falling back to
	// `undefined` here instead would *overwrite* a consumer's value, because the
	// attribute is written after the rest spread on every branch — which is
	// exactly what `preserves a consumer aria-describedby with the default name
	// tooltip` caught.
	const describedBy = $derived(
		showTooltip && isCustomTooltip
			? [rest['aria-describedby'], tooltipHook.describedBy].filter(Boolean).join(' ') || undefined
			: (rest['aria-describedby'] as string | undefined)
	);

	// An interactive control with no accessible name is an unacceptable control
	// name. Warn in the same client-safe way sibling components do (Field,
	// Timestamp, Popover) — a plain `console.warn`, never gated on `process.env`.
	//
	// **Transcribed, not overlooked.** Every other warning in this package routes
	// through `devWarn`/`useDevWarning`; upstream's `Avatar.tsx` is the one site
	// that still writes a bare, ungated `console.warn`, and the comment above is
	// its own justification for it. Its siblings have since moved on, so the
	// reasoning no longer holds upstream either — but the code at v0.3.0 is what
	// it is, and changing it here would be an invented improvement. Left alone
	// deliberately; a sweep that "fixes" this is a parity regression.
	$effect(() => {
		if (isInteractive && !accessibleName) {
			console.warn(
				'Avatar: an interactive avatar (with `href` or `onclick`) needs a ' +
					'meaningful accessible name. Pass `alt` or `name`.'
			);
		}
	});

	const wrapper = $derived(
		avatarWrapperAttrs(
			{
				groupOverlap: group?.().overlap ?? null,
				isInteractive
			},
			xstyle
		)
	);
	// `rest` is typed for the default `<div>` root (its event handlers are
	// HTMLDivElement-typed). The interactive branches render an `<a>`/`<button>`,
	// so the pass-through props are re-typed to the generic element here — the
	// avatar's own handler (`onclick`) is declared on MouseEvent and stays typed.
	// Upstream needs the identical cast (`props as React.HTMLAttributes<HTMLElement>`).
	const interactivePassthrough = $derived(rest as HTMLAttributes<HTMLElement>);

	const content = $derived(avatarContentAttrs(numericSize));
	const image = avatarImageAttrs();
	const initials = $derived(avatarInitialsAttrs(numericSize));
	const icon = avatarIconAttrs();
	const statusAttrs = $derived(avatarStatusAttrs(numericSize));
	const theme = $derived(themeProps('avatar', { size: resolvedSize }));
	// The fallback surface (initials + default icon) is its own theme target as
	// of upstream 0.4.1, replacing the `--_avatar-fallback-*` derived vars: a
	// theme sets background, color and weight on `avatar-fallback`, and per-size
	// font size through its size variant.
	const fallbackTheme = $derived(themeProps('avatar-fallback', { size: resolvedSize }));

	// `LinkElement` renders either a tag or a component, so the attachment travels
	// in the props object — the `BreadcrumbItem`/`ClickableCard` seam.
	const linkProps = $derived({
		...interactivePassthrough,
		...theme,
		href,
		// `useLinkComponent`'s `to` alias for `to`-based routers; upstream injects
		// it inside the hook's wrapper component, which has no Svelte counterpart.
		...(linkResolved.isNative ? {} : { to: href }),
		target,
		rel,
		class: cx(theme.class, wrapper.class, className),
		style: mergeStyle(wrapper.style, styleProp as string | undefined),
		'aria-label': accessibleName,
		'aria-describedby': describedBy,
		'data-avatar-item': '',
		onclick,
		[createAttachmentKey()]: tooltipHook.attachTrigger
	});

	/**
	 * First letter of the first word, plus the first of the last.
	 *
	 * `charAt(0)` returns one UTF-16 **code unit**, which splits any character
	 * outside the BMP down the middle — an emoji or a multi-codepoint grapheme
	 * rendered as a lone surrogate. Segment by grapheme instead, falling back to
	 * code points where `Intl.Segmenter` is unavailable.
	 */
	function firstGrapheme(word: string): string {
		if (graphemeSegmenter) {
			return [...graphemeSegmenter.segment(word)][0]?.segment ?? '';
		}

		return [...word][0] ?? '';
	}

	function getInitials(value: string): string {
		const words = value.trim().split(/\s+/);
		if (words.length === 0) return '';
		if (words.length === 1) return firstGrapheme(words[0]).toUpperCase();
		return (firstGrapheme(words[0]) + firstGrapheme(words[words.length - 1])).toUpperCase();
	}
</script>

<!--
	The inner visuals are identical across the static and interactive variants,
	so they live in one snippet rendered by all three branches. Upstream shares
	them the same way (`visualContent`), and it is what keeps the element swap
	from being able to change what the avatar looks like.
-->
{#snippet visualContent()}
	<div class={content.class} style={content.style}>
		{#if showImage}
			<!-- alt="" throughout: the accessible name lives on the wrapper, so
			     describing the image again would announce the person twice. -->
			<img
				{src}
				alt=""
				class={image.class}
				style={image.style}
				onerror={() => (erroredSrc = src)}
			/>
		{:else if showFallbackImage}
			<img
				src={fallbackSrc}
				alt=""
				class={image.class}
				style={image.style}
				onerror={() => (erroredFallbackSrc = fallbackSrc)}
			/>
		{:else if showInitials}
			<div class={cx(fallbackTheme.class, initials.class)} style={initials.style}>
				{getInitials(name as string)}
			</div>
		{:else if showIcon}
			<div class={cx(fallbackTheme.class, icon.class)} style={icon.style}>
				<svg
					width={numericSize * 0.6}
					height={numericSize * 0.6}
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
					/>
				</svg>
			</div>
		{/if}
	</div>
	{#if status}
		<div class={statusAttrs.class} style={statusAttrs.style}>
			{@render status()}
		</div>
	{/if}
{/snippet}

<!--
	The three roots carry the *same* class list (see `avatarWrapperAttrs`), so
	swapping between them changes semantics and focusability, never layout.

	`data-avatar-item` marks the interactive ones for `AvatarGroup`'s roving
	focus, which selects on that attribute rather than a tag or role — so roving
	never catches a nested button inside a custom status/badge slot.

	The tooltip is a sibling layer, not a wrapper: toggling it must not remount
	the avatar subtree and lose the image-load state.
-->
{#if renderAsLink}
	<!--
		Rendered through `LinkElement`, not a bare `<a>`: upstream calls
		`useLinkComponent(as)` here, so an interactive avatar inside a
		`LinkProvider` navigates through the app's router. A hard-coded anchor
		would silently do a full page load — the provider would appear to work
		everywhere else and fail only here.

		`href` is a consumer-supplied URL of any kind, so SvelteKit's resolve()
		does not apply; the attachment travels in `props` because `LinkElement`
		spreads them onto whichever element it resolves.
	-->
	<LinkElement component={linkResolved.component} props={linkProps}>
		{@render visualContent()}
	</LinkElement>
{:else if renderAsButton}
	<button
		{...interactivePassthrough}
		{...theme}
		{@attach tooltipHook.attachTrigger}
		type="button"
		class={cx(theme.class, wrapper.class, className)}
		style={mergeStyle(wrapper.style, styleProp as string | undefined)}
		aria-label={accessibleName}
		aria-describedby={describedBy}
		data-avatar-item=""
		{onclick}
	>
		{@render visualContent()}
	</button>
{:else}
	<!--
		The root is a `div[role="img"]`, not natively focusable. When a name
		tooltip is active it takes a tab stop so keyboard users can reveal it
		(WCAG 1.4.13 / 2.1.1) — matching Timestamp and Button, and what upstream
		does. Suppressed inside an AvatarGroup, which owns a single roving tab
		stop for its members.
	-->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		{...rest}
		{...theme}
		{@attach tooltipHook.attachTrigger}
		class={cx(theme.class, wrapper.class, className)}
		style={mergeStyle(wrapper.style, styleProp as string | undefined)}
		role={isDecorative ? 'presentation' : 'img'}
		aria-label={isDecorative ? undefined : accessibleName}
		aria-hidden={isDecorative || undefined}
		aria-describedby={describedBy}
		tabindex={showTooltip && !group ? 0 : undefined}
	>
		{@render visualContent()}
	</div>
{/if}

{#if showTooltip}
	<TooltipLayer tooltip={tooltipHook}>{trimmedTooltip}</TooltipLayer>
{/if}
