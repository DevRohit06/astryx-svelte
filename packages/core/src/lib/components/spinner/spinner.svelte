<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { BaseProps } from '../../base-props.js';
	import type { SpinnerShade, SpinnerSize } from './spinner.stylex.js';

	export interface SpinnerProps extends BaseProps<HTMLSpanElement> {
		size?: SpinnerSize;
		shade?: SpinnerShade;
		/**
		 * Text or content shown below the spinner. A string is rendered as a bold
		 * body `Text`, and the status element is named *from that rendered text*
		 * via `aria-labelledby` — not by duplicating the string as `aria-label`,
		 * which screen readers would announce twice. An explicit `aria-label` still
		 * wins; richer content should carry its own.
		 */
		label?: string | Snippet;
		'data-testid'?: string;
	}

	/**
	 * Pin every ring's rotation to the document timeline's origin instead of its
	 * own start time, so spinners mounted seconds apart turn in phase.
	 *
	 * Setting `startTime` is exact where arithmetic on a clock read is not: a
	 * negative `animation-delay` computed at mount is only as good as the gap
	 * between reading the clock and the frame the animation starts in, which at
	 * 10x CPU throttling measured 116deg of drift.
	 *
	 * Rings are collected and pinned in one frame because `getAnimations()`
	 * resolves style and `startTime` dirties it again, so pinning them one at a
	 * time makes each mount re-force what the previous one invalidated — 53 style
	 * recalcs for 38 spinners against 19 batched.
	 *
	 * Module scope, not component scope: the batch has to be shared by every
	 * spinner on the page, which is what `<script module>` is. Nothing here is
	 * `$state`, so the attachment reads no reactive value and runs once per
	 * element — upstream's stable ref callback, with the returned cleanup
	 * standing in for React's null call.
	 */
	// A plain `Set`, not a `SvelteSet`: nothing renders from it, and making it
	// reactive would make every attachment that adds to it a reader of it — each
	// mount invalidating the others, which is the opposite of the batching this
	// exists for.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const pendingRings = new Set<SVGSVGElement>();
	let flushScheduled = false;

	function pinRingsToTimelineOrigin(): void {
		flushScheduled = false;
		const animations: Animation[] = [];
		for (const svg of pendingRings) {
			animations.push(...svg.getAnimations());
		}
		pendingRings.clear();
		for (const animation of animations) {
			animation.startTime = 0;
		}
	}

	const syncRotationPhase: Attachment<SVGSVGElement> = (svg) => {
		// Not every environment implements the Web Animations API, and this runs in
		// every consumer's component tests.
		if (typeof svg.getAnimations !== 'function') {
			return;
		}
		pendingRings.add(svg);
		if (!flushScheduled) {
			flushScheduled = true;
			requestAnimationFrame(pinRingsToTimelineOrigin);
		}
		return () => {
			pendingRings.delete(svg);
		};
	};
</script>

<script lang="ts">
	import Text from '../text/text.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		ARC_FRACTION,
		BOX_SIZE,
		SIZES,
		spinnerArcAttrs,
		spinnerAttrs,
		spinnerRingAttrs,
		spinnerTrackAttrs,
		spinnerWrapperAttrs
	} from './spinner.stylex.js';

	const {
		size = 'md',
		shade = 'default',
		label,
		class: className,
		style: styleProp,
		'aria-label': ariaLabel,
		'data-testid': testId,
		xstyle,
		...rest
	}: SpinnerProps = $props();

	// With a label the spinner becomes the inner half of a two-part wrapper, and
	// every consumer-facing prop (rest, theme, class/style, testid, xstyle) moves
	// out to that wrapper — exactly upstream's `hasLabel` routing.
	const hasLabel = $derived(label != null);

	const labelId = $props.id();

	// When a visible string label renders (and no explicit aria-label is set),
	// name the status element from the visible Text via aria-labelledby instead of
	// duplicating the same string as aria-label — the duplicate would be announced
	// twice by screen readers (WCAG 4.1.2).
	const namedByVisibleLabel = $derived(hasLabel && typeof label === 'string' && ariaLabel == null);

	// Explicit aria-label > a string label > "Loading".
	const resolvedAriaLabel = $derived(
		ariaLabel ?? (typeof label === 'string' ? label : undefined) ?? 'Loading'
	);

	const metrics = $derived(SIZES[size]);
	const frameSize = $derived(metrics.diameter + metrics.border * 2);
	const centre = $derived(frameSize / 2);
	const circumference = $derived(Math.PI * metrics.diameter);
	const arcLength = $derived(circumference * ARC_FRACTION);

	const base = $derived(spinnerAttrs(size, shade, hasLabel, xstyle));
	const wrapper = $derived(spinnerWrapperAttrs(size, shade, xstyle));
	const ring = spinnerRingAttrs();
	const track = $derived(spinnerTrackAttrs(shade));
	const arc = spinnerArcAttrs();
	const theme = $derived(themeProps('spinner', { size, shade }));
</script>

{#snippet spinner()}
	<span
		role="status"
		aria-label={namedByVisibleLabel ? undefined : resolvedAriaLabel}
		aria-labelledby={namedByVisibleLabel ? labelId : undefined}
		{...hasLabel ? {} : rest}
		{...hasLabel ? {} : theme}
		data-testid={hasLabel ? undefined : testId}
		class={hasLabel ? base.class : cx(theme.class, base.class, className)}
		style={mergeStyle(
			base.style,
			hasLabel ? undefined : (styleProp as string | undefined),
			// The box is sized here, after the caller's `style`: the component's own
			// size wins over a `style="width:…"` a caller passes, exactly as it did
			// before the geometry became themeable. What the value is made of has
			// changed — the composed var rather than a number — so a themed diameter
			// moves the box with the ring. The fallback is the size's own frame, for
			// the render where no stylesheet has declared the var.
			`width:var(${BOX_SIZE}, ${frameSize}px);height:var(${BOX_SIZE}, ${frameSize}px)`
		)}
	>
		<svg
			{@attach syncRotationPhase}
			width={frameSize}
			height={frameSize}
			viewBox="0 0 {frameSize} {frameSize}"
			aria-hidden="true"
			class={ring.class}
			style={ring.style}
		>
			<circle
				cx={centre}
				cy={centre}
				r={metrics.diameter / 2}
				stroke-width={metrics.border}
				class={track.class}
				style={track.style}
			></circle>
			<circle
				cx={centre}
				cy={centre}
				r={metrics.diameter / 2}
				stroke-width={metrics.border}
				stroke-dasharray="{arcLength} {circumference - arcLength}"
				transform="rotate(-90 {centre} {centre})"
				class={arc.class}
				style={arc.style}
			></circle>
		</svg>
	</span>
{/snippet}

{#if !hasLabel}
	{@render spinner()}
{:else}
	<div
		{...rest}
		data-testid={testId}
		{...theme}
		class={cx(theme.class, wrapper.class, className)}
		style={mergeStyle(wrapper.style, styleProp as string | undefined)}
	>
		{@render spinner()}
		{#if typeof label === 'string'}
			<Text id={labelId} type="body" weight="bold">{label}</Text>
		{:else}
			{@render label?.()}
		{/if}
	</div>
{/if}
