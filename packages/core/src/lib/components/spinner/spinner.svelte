<script lang="ts" module>
	import type { Snippet } from 'svelte';
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
</script>

<script lang="ts">
	import Text from '../text/text.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		SIZES,
		SPREAD,
		START_POINT,
		spinnerAttrs,
		spinnerCanvasAttrs,
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

	let canvas = $state<HTMLCanvasElement | null>(null);

	const metrics = $derived(SIZES[size]);
	const frameSize = $derived(metrics.diameter + metrics.border * 2);

	const base = $derived(spinnerAttrs(hasLabel ? undefined : xstyle));
	const wrapper = $derived(spinnerWrapperAttrs(xstyle));
	const canvasAttrs = spinnerCanvasAttrs();
	const theme = $derived(themeProps('spinner', { size, shade }));

	/**
	 * The two ring colours, declared in CSS so the *browser* resolves them — the
	 * same route every other component takes.
	 *
	 * They cannot be read off the custom properties directly:
	 * `getComputedStyle(el).getPropertyValue('--color-accent')` returns the
	 * property's *substitution value*, not a computed colour, so a token declared
	 * as `light-dark(#15110C, #DFE2E5)` comes back as that literal string. Canvas
	 * rejects it, `strokeStyle` silently keeps its previous value, and the whole
	 * spinner paints in the default black — in both colour schemes.
	 *
	 * Declaring them as real colour properties instead means `light-dark()`,
	 * `var()` chains and `color-mix()` are all resolved by the time the effect
	 * reads them, and resolved *in position*, which is what lets a theme's
	 * `.astryx-progressbar.accent { --color-accent: … }` reach the ring. Upstream
	 * has a JS theme object that reimplements all three; this port does not, and
	 * `useTheme()`'s token map is the one thing it could not bring across.
	 *
	 * `color` carries the arc. The track rides on `text-decoration-color`, which
	 * is inert on a canvas and always computes to a concrete colour — a carrier,
	 * not a decoration. `inherit` sets neither, so both fall back to the parent's
	 * `currentColor`.
	 */
	const ringStyle = $derived.by(() => {
		switch (shade) {
			case 'inherit':
				return 'text-decoration-color:currentColor';
			case 'onMedia':
				return 'color:var(--color-on-dark);text-decoration-color:var(--color-on-dark)';
			case 'subtle':
				return 'color:var(--color-text-secondary);text-decoration-color:var(--color-track)';
			default:
				return 'color:var(--color-accent);text-decoration-color:var(--color-track)';
		}
	});

	/**
	 * Draws the faded track ring plus the coloured active arc.
	 */
	$effect(() => {
		if (canvas == null) return;

		const context = canvas.getContext('2d');
		if (!context) return;

		// Read reactive inputs up front so the effect re-runs when they change.
		const { border, diameter } = SIZES[size];
		const currentShade = shade;

		// Both already resolved to `rgb(...)` by the cascade — see `ringStyle`.
		// Reading them in the effect is safe because Svelte applies DOM updates
		// before effects flush, so a `shade` change is on the element by now.
		const computed = getComputedStyle(canvas);
		const activeColor = computed.color;
		const trackColor = computed.textDecorationColor;

		// onMedia gets a 30% alpha track so the ring reads against arbitrary
		// backgrounds, and `inherit` fades currentColor the same way. Upstream
		// spells onMedia's alpha as a `4D` suffix on a hex token; a resolved
		// `rgb()` cannot take one, so both go through `globalAlpha` — the
		// mechanism the inherit branch already used. 0x4D/255 ≈ 0.3.
		const isTrackFaded = currentShade === 'inherit' || currentShade === 'onMedia';

		const cssSize = diameter + border * 2;
		const pixelRatio = window.devicePixelRatio || 1;

		// Round to an even number of device pixels so the centre lands on a whole
		// pixel; otherwise the rotation visibly jitters.
		const rawFrame = Math.round(cssSize * pixelRatio);
		const frame = rawFrame + (rawFrame % 2);

		const scale = frame / cssSize;
		const radius = (diameter / 2) * scale;
		const centre = frame / 2;

		canvas.height = canvas.width = frame;
		canvas.style.width = canvas.style.height = `${cssSize}px`;

		context.lineCap = 'round';
		context.lineWidth = border * scale;

		context.beginPath();
		context.arc(centre, centre, radius, 0, 2 * Math.PI);
		context.strokeStyle = trackColor;
		if (isTrackFaded) context.globalAlpha = 0.3;
		context.stroke();
		context.globalAlpha = 1;

		context.beginPath();
		context.arc(
			centre,
			centre,
			radius,
			START_POINT * Math.PI,
			((START_POINT + SPREAD) % 2) * Math.PI
		);
		context.strokeStyle = activeColor;
		context.stroke();
	});
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
			`width:${frameSize}px;height:${frameSize}px`,
			hasLabel ? undefined : (styleProp as string | undefined)
		)}
	>
		<canvas
			bind:this={canvas}
			class={canvasAttrs.class}
			style={mergeStyle(canvasAttrs.style, ringStyle)}
		></canvas>
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
