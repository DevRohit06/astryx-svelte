<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus } from '../field/types.js';
	import { THUMB_SIZE } from './slider.stylex.js';

	/**
	 * `onChange` is a custom callback (not forwarded to an element), so it keeps
	 * upstream's camelCase name; `onchange` (the native handler) is omitted so the
	 * custom one is the whole change API, as upstream's `Omit<BaseProps<
	 * HTMLDivElement>, 'onChange'>` intends.
	 *
	 * Note that `Slider` is a **closed prop list**: upstream declares
	 * `BaseProps<HTMLDivElement>` but destructures a fixed set with no rest
	 * spread, so `id`/`role`/`aria-*`/handlers are accepted by the type and
	 * dropped at runtime. Replicated — see `port/todo.md`'s known debts.
	 */
	export interface SliderBaseProps extends Omit<BaseProps<HTMLDivElement>, 'onchange'> {
		/** Label text for the slider (always rendered for accessibility). */
		label: string;
		/**
		 * Whether to visually hide the label (still accessible to screen readers).
		 * @default false
		 */
		isLabelHidden?: boolean;
		/** Description text displayed below the label. */
		description?: string;
		/**
		 * Whether the slider is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Explains why the slider is disabled. When set together with `isDisabled`,
		 * the slider shows a tooltip with this text on hover and keyboard focus, and
		 * the thumb stays focusable (via `aria-disabled`) so the reason is
		 * discoverable by keyboard and assistive technology. Value changes stay
		 * blocked.
		 *
		 * Use this instead of wrapping a disabled slider in `Tooltip` — disabled
		 * controls don't emit the pointer events an external tooltip needs.
		 */
		disabledMessage?: string;
		/**
		 * Whether the field is optional. Mutually exclusive with isRequired.
		 * @default false
		 */
		isOptional?: boolean;
		/**
		 * Whether the field is required. Mutually exclusive with isOptional.
		 * @default false
		 */
		isRequired?: boolean;
		/**
		 * Status indicator for the slider.
		 * When set with a message, displays a colored message box below the slider.
		 */
		status?: InputStatus;
		/**
		 * Width of the field. Numbers are treated as pixels, strings are used as-is
		 * (e.g. `'100%'`). Sizes the whole field (label, control, and status) so they
		 * stay aligned, unlike setting width via `xstyle`/`class`/`style`.
		 */
		width?: SizeValue;
		/** Tooltip text to display in an info icon at the end of the label. */
		labelTooltip?: string;
		/**
		 * Minimum value.
		 * @default 0
		 */
		min?: number;
		/**
		 * Maximum value.
		 * @default 100
		 */
		max?: number;
		/**
		 * Step increment.
		 * @default 1
		 */
		step?: number;
		/**
		 * Layout direction. Vertical sliders run bottom (min) to top (max).
		 * @default 'horizontal'
		 */
		orientation?: 'horizontal' | 'vertical';
		/**
		 * Formats the displayed value. Drives both the visible readout and
		 * `aria-valuetext` — without it, no `aria-valuetext` is emitted at all.
		 */
		formatValue?: (value: number) => string;
		/**
		 * How the current value is surfaced.
		 * @default 'tooltip'
		 */
		valueDisplay?: 'tooltip' | 'text' | 'none';
		/** Tick marks rendered along the track. */
		marks?: { value: number; label?: string }[];
		/**
		 * The HTML name attribute for a hidden input carrying the value.
		 * Useful for form submissions. Range sliders emit two under the same name.
		 */
		htmlName?: string;
	}

	export interface SliderSingleProps extends SliderBaseProps {
		/** The current value. */
		value: number;
		/** Fired on every value change, including during a drag. */
		onChange?: (value: number) => void;
		/** Fired once an interaction commits — pointer-up or a key press. */
		onChangeEnd?: (value: number) => void;
	}

	export interface SliderRangeProps extends SliderBaseProps {
		/** The current `[start, end]` pair. */
		value: [number, number];
		/** Fired on every value change, including during a drag. */
		onChange?: (value: [number, number]) => void;
		/** Fired once an interaction commits — pointer-up or a key press. */
		onChangeEnd?: (value: [number, number]) => void;
		/**
		 * Minimum number of steps that must separate the two thumbs. They may sit
		 * on the same value at `0`, but can never cross.
		 * @default 0
		 */
		minStepsBetweenThumbs?: number;
	}

	/** Discriminated on `value`: a number is a single slider, a tuple a range. */
	export type SliderProps = SliderSingleProps | SliderRangeProps;

	function clamp(val: number, min: number, max: number): number {
		return Math.min(Math.max(val, min), max);
	}

	/**
	 * Decimal places a number carries, including one written in exponential
	 * notation (e.g. `1e-7` → 7). Used to round away binary floating-point error
	 * after step arithmetic.
	 */
	function getDecimalPrecision(num: number): number {
		if (Math.abs(num) < 1) {
			const parts = num.toExponential().split('e-');
			if (parts.length === 2) {
				const mantissaDecimals = parts[0].split('.')[1]?.length ?? 0;
				return mantissaDecimals + parseInt(parts[1], 10);
			}
		}
		const decimalPart = String(num).split('.')[1];
		return decimalPart ? decimalPart.length : 0;
	}

	function snapToStep(val: number, min: number, step: number): number {
		if (step <= 0) {
			return val;
		}
		const steps = Math.round((val - min) / step);
		const snapped = min + steps * step;
		// `min + steps * step` accumulates binary floating-point error with
		// fractional steps (0 + 3 * 0.1 → 0.30000000000000004), which leaks into
		// onChange/onChangeEnd payloads, aria-valuenow, and the value tooltip.
		// Snapped values can never carry more decimals than min/step combined, so
		// rounding to that precision removes only the error.
		const precision = Math.min(
			Math.max(getDecimalPrecision(min), getDecimalPrecision(step)),
			20 // toFixed() throws past 20 digits
		);
		return Number(snapped.toFixed(precision));
	}

	function getPercent(val: number, min: number, max: number): number {
		if (max === min) {
			return 0;
		}
		return ((val - min) / (max - min)) * 100;
	}

	/**
	 * Thumb travel is inset by half a thumb at each end — the geometry a native
	 * `input[type=range]` uses — so the thumb stays inside the component box at
	 * min and max instead of overhanging it by half its width (#5050). The fill
	 * and the marks map through the same inset, and `travelFraction` inverts it,
	 * so the thumb tracks the pointer that grabbed it. Both directions read
	 * THUMB_SIZE, so a theme cannot resize the thumb through CSS alone.
	 */
	const THUMB_INSET = THUMB_SIZE / 2;

	function cssLength(percent: number, px: number): string {
		// Percentages of the box and step arithmetic both carry binary
		// floating-point error into the DOM (`calc(33% + 3.3999999999999995px)`).
		const round = (n: number) => Number(n.toFixed(3));
		return `calc(${round(percent)}% ${px < 0 ? '-' : '+'} ${Math.abs(round(px))}px)`;
	}

	function insetPosition(percent: number): string {
		return cssLength(percent, THUMB_INSET - (percent / 100) * THUMB_SIZE);
	}

	/** Distance between two inset positions; the inset itself cancels out. */
	function insetSpan(fromPercent: number, toPercent: number): string {
		const delta = toPercent - fromPercent;
		return cssLength(delta, -(delta / 100) * THUMB_SIZE);
	}

	/** Inverse of `insetPosition`: an offset from the box start back to 0–1. */
	function travelFraction(offset: number, size: number): number {
		const travel = size - THUMB_SIZE;
		if (travel > 0) {
			return (offset - THUMB_INSET) / travel;
		}
		// Narrower than the thumb, so there is no travel to map onto: fall back to
		// the raw fraction rather than dividing by zero.
		return size > 0 ? offset / size : 0;
	}
</script>

<script lang="ts">
	import { isRtlElement } from '../../hooks/is-rtl-element.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import Field from '../field/field.svelte';
	import Tooltip from '../tooltip/tooltip.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import {
		sliderFilledTrackAttrs,
		sliderMarkAttrs,
		sliderMarkLabelAttrs,
		sliderMarksContainerAttrs,
		sliderRowAttrs,
		sliderTextValueAttrs,
		sliderThumbAttrs,
		sliderTrackAttrs,
		sliderTrackContainerAttrs
	} from './slider.stylex.js';

	/**
	 * A slider for selecting a numeric value or a range, ported from Astryx's
	 * `Slider/Slider.tsx`.
	 *
	 * Fully controlled — there is no internal value state. Pointer interaction is
	 * owned by the track container (never the thumbs) and survives leaving the
	 * element through pointer capture, so there are no window-level listeners.
	 *
	 * @example
	 * ```svelte
	 * <Slider label="Volume" value={volume} onChange={(v) => (volume = v)} />
	 * <Slider label="Price range" value={range} onChange={(v) => (range = v)} />
	 * ```
	 */
	let {
		label,
		isLabelHidden = false,
		description,
		isDisabled = false,
		disabledMessage,
		isOptional = false,
		isRequired = false,
		status,
		labelTooltip,
		min = 0,
		max = 100,
		step = 1,
		orientation = 'horizontal',
		formatValue,
		htmlName,
		valueDisplay = 'tooltip',
		marks,
		width,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId,
		value,
		onChange,
		onChangeEnd,
		// Upstream's leftover `props` object. It is read for exactly one thing —
		// the `'minStepsBetweenThumbs' in props` probe below — and deliberately
		// never spread onto an element: `Slider` is a closed prop list upstream.
		...rest
	}: SliderProps = $props();

	const isRange = $derived(Array.isArray(value));
	const minStepsBetweenThumbs = $derived(
		isRange && 'minStepsBetweenThumbs' in rest
			? ((rest as { minStepsBetweenThumbs?: number }).minStepsBetweenThumbs ?? 0)
			: 0
	);
	const isHorizontal = $derived(orientation === 'horizontal');

	// Upstream mints three ids with three `useId` calls plus a fourth inside
	// `useTooltip`. `$props.id()` may be called once per component, so the
	// counterpart is one base id with derived suffixes.
	const uid = $props.id();
	const id = `${uid}-input`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const tooltipID = `${uid}-tooltip`;
	const labelID = `${uid}-label`;
	const requiredID = `${uid}-required`;

	let trackEl = $state<HTMLDivElement | null>(null);

	// The synchronous drag flag, read by the move/up handlers. Deliberately a
	// plain `let` rather than `$state`, as upstream's `useRef` is: a move that
	// arrives in the same tick as the down must already see it.
	let draggingThumbRef: number | null = null;
	// The reactive half — its only consumer is the value tooltip's `isOpen`.
	let draggingThumb = $state<number | null>(null);

	// Disabled-reason tooltip. This is a *separate* `useTooltip` instance from the
	// per-thumb value bubble (the `<Tooltip>` below): it anchors to the track
	// container and fires on hover/focus of the whole control. Disabled controls
	// swallow pointer events, so the thumb stays perceivable via aria-disabled
	// while the pointer/keyboard handlers early-return on isDisabled.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipID,
		placement: 'above' as const,
		// The track container is not naturally focusable; focusin bubbles up from
		// the thumb, so always attach focus listeners.
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	// Required state. `aria-required` is not a supported property of
	// `role="slider"` in WAI-ARIA 1.2, so the thumb instead points its
	// `aria-describedby` at a visually hidden "Required" span — mirroring the
	// Field label's visible indicator (where `isOptional` takes precedence).
	const conveysRequired = $derived(isRequired && !isOptional);

	const ariaDescribedBy = $derived(
		[
			description ? descriptionID : null,
			status?.message ? statusMessageID : null,
			conveysRequired ? requiredID : null,
			showsDisabledMessage ? disabledMessageTooltip.describedBy : null
		]
			.filter(Boolean)
			.join(' ') || undefined
	);

	// Guarded against a missing `value` (playground previews render without one),
	// as upstream's `value != null` fallback to `min` is.
	// Guard against an undefined value (e.g. playground previews that render the
	// component without providing one), and clamp: a controlled value outside
	// [min, max] used to position the thumb off the track and report an
	// out-of-range `aria-valuenow`.
	const values = $derived<number[]>(
		(Array.isArray(value) ? value : [value != null ? value : min]).map((currentValue) =>
			clamp(currentValue, min, max)
		)
	);

	function getValueFromPosition(clientX: number, clientY: number): number {
		const track = trackEl;
		if (!track) {
			return min;
		}
		const rect = track.getBoundingClientRect();

		// Inverse of `insetPosition`: the pointer maps onto the thumb's travel
		// (the box minus half a thumb at each end), so pressing on the thumb
		// leaves it where it is instead of jumping.
		let percent: number;
		if (isHorizontal) {
			// In RTL the inline-start (value = min) is the right edge, so measure
			// the pointer fraction from the right instead of the left. Detected
			// from the track's computed direction (lazy, only on pointer move).
			percent = travelFraction(
				isRtlElement(track) ? rect.right - clientX : clientX - rect.left,
				rect.width
			);
		} else {
			// Vertical: bottom = min, top = max
			percent = 1 - travelFraction(clientY - rect.top, rect.height);
		}
		percent = clamp(percent, 0, 1);
		const raw = min + percent * (max - min);
		return clamp(snapToStep(raw, min, step), min, max);
	}

	function getClosestThumb(newValue: number): number {
		if (!isRange) {
			return 0;
		}
		const [v0, v1] = values;
		// Prefer the lower thumb if equidistant
		return Math.abs(newValue - v0) <= Math.abs(newValue - v1) ? 0 : 1;
	}

	function updateValue(thumbIndex: number, newVal: number): void {
		if (isDisabled) {
			return;
		}
		const clamped = clamp(snapToStep(newVal, min, step), min, max);

		if (isRange) {
			const currentValues = [...values] as [number, number];
			currentValues[thumbIndex] = clamped;

			// Enforce minStepsBetweenThumbs
			const minGap = minStepsBetweenThumbs * step;
			if (thumbIndex === 0) {
				currentValues[0] = Math.min(currentValues[0], currentValues[1] - minGap);
			} else {
				currentValues[1] = Math.max(currentValues[1], currentValues[0] + minGap);
			}

			// Keep within bounds
			currentValues[0] = clamp(currentValues[0], min, max);
			currentValues[1] = clamp(currentValues[1], min, max);

			(onChange as SliderRangeProps['onChange'])?.(currentValues);
		} else {
			(onChange as SliderSingleProps['onChange'])?.(clamped);
		}
	}

	function fireChangeEnd(newValues?: number[]): void {
		const currentValues = newValues ?? values;
		if (isRange) {
			(onChangeEnd as SliderRangeProps['onChangeEnd'])?.(currentValues as [number, number]);
		} else {
			(onChangeEnd as SliderSingleProps['onChangeEnd'])?.(currentValues[0]);
		}
	}

	function handlePointerDown(e: PointerEvent): void {
		if (isDisabled) {
			return;
		}
		e.preventDefault();

		// If the press originated on a mark, snap to that mark's value instead of
		// computing from the pointer position (avoids an off-by-one when clicking
		// a wide label like "100").
		const markEl = (e.target as HTMLElement).closest<HTMLElement>('[data-mark-value]');
		const newVal = markEl
			? Number(markEl.dataset.markValue)
			: getValueFromPosition(e.clientX, e.clientY);
		const thumbIndex = getClosestThumb(newVal);
		draggingThumbRef = thumbIndex;
		draggingThumb = thumbIndex;
		updateValue(thumbIndex, newVal);

		// Focus the closest thumb
		const thumbs = trackEl?.querySelectorAll<HTMLElement>('[role="slider"]');
		thumbs?.[thumbIndex]?.focus();

		const target = e.currentTarget as HTMLElement;
		if (typeof target.setPointerCapture === 'function') {
			target.setPointerCapture(e.pointerId);
		}
	}

	function handlePointerMove(e: PointerEvent): void {
		if (draggingThumbRef === null || isDisabled) {
			return;
		}
		updateValue(draggingThumbRef, getValueFromPosition(e.clientX, e.clientY));
	}

	function handlePointerUp(): void {
		if (draggingThumbRef !== null) {
			draggingThumbRef = null;
			draggingThumb = null;
			fireChangeEnd();
		}
	}

	function handleKeyDown(thumbIndex: number, e: KeyboardEvent): void {
		if (isDisabled) {
			return;
		}
		const currentVal = values[thumbIndex];
		let newVal: number;

		switch (e.key) {
			case 'ArrowRight':
			case 'ArrowUp':
				newVal = currentVal + step;
				break;
			case 'ArrowLeft':
			case 'ArrowDown':
				newVal = currentVal - step;
				break;
			case 'PageUp':
				newVal = currentVal + step * 10;
				break;
			case 'PageDown':
				newVal = currentVal - step * 10;
				break;
			case 'Home':
				newVal = min;
				break;
			case 'End':
				newVal = max;
				break;
			default:
				return;
		}

		e.preventDefault();
		const clamped = clamp(snapToStep(newVal, min, step), min, max);
		updateValue(thumbIndex, newVal);

		// Recompute the post-update values independently so `onChangeEnd` reports
		// the committed value without waiting for the parent to write `value` back.
		if (isRange) {
			const newValues = [...values] as [number, number];
			newValues[thumbIndex] = clamped;
			const minGap = minStepsBetweenThumbs * step;
			if (thumbIndex === 0) {
				newValues[0] = Math.min(newValues[0], newValues[1] - minGap);
			} else {
				newValues[1] = Math.max(newValues[1], newValues[0] + minGap);
			}
			newValues[0] = clamp(newValues[0], min, max);
			newValues[1] = clamp(newValues[1], min, max);
			fireChangeEnd(newValues);
		} else {
			fireChangeEnd([clamped]);
		}
	}

	function displayValue(val: number): string {
		return formatValue ? formatValue(val) : String(val);
	}

	/**
	 * The thumb's offset, as **style directives** rather than a `style` string.
	 *
	 * This is load-bearing, not a stylistic choice. Svelte applies a changed
	 * `style` *attribute* by assigning `cssText`, which replaces the whole
	 * declaration block; a style directive goes through `setProperty`, which is
	 * what React does with the style *object* upstream passes here. It matters
	 * because the thumb is a `Tooltip` trigger, and `useLayer`'s `attachTrigger`
	 * writes the CSS `anchor-name` onto this element's inline style imperatively.
	 * With a string write, the first value change — one arrow key, one pointermove
	 * of a drag — would erase that anchor name, and nothing puts it back: the
	 * value bubble would detach and pin to the viewport corner for the rest of the
	 * component's life. Upstream is immune because React writes style objects
	 * per-property.
	 */
	// Horizontal positioning is **logical**, as upstream's is
	// (`{insetInlineStart: …}` at `Slider.tsx:742`, `:832`, `:964`). It has to be:
	// `thumbHorizontal` carries no positional inset on either edge, so this inline
	// style is the sole source of the thumb's position, and the stylex block
	// already ports the RTL half of the pair by flipping `transform` to
	// `translate(50%, -50%)` under `[dir="rtl"]`. A physical `left` here would
	// mirror the centring without mirroring the offset — and would disagree with
	// `handlePointerDown`, which measures the fraction from the right edge in RTL.
	// The *vertical* `left: 50%` stays physical: it is a centring constant, and
	// upstream writes it physically too.
	const thumbInlineStart = $derived((val: number) =>
		isHorizontal ? insetPosition(getPercent(val, min, max)) : null
	);
	const thumbLeft = $derived(() => (isHorizontal ? null : '50%'));
	const thumbBottom = $derived((val: number) =>
		isHorizontal ? null : insetPosition(getPercent(val, min, max))
	);

	function markPositionStyle(markValue: number): string {
		const pos = insetPosition(getPercent(markValue, min, max));
		return isHorizontal ? `inset-inline-start:${pos}` : `bottom:${pos}`;
	}

	// Filled track position — ends at the thumb centre, so it uses the same
	// inset mapping as the thumb.
	const filledStyle = $derived.by(() => {
		if (isRange) {
			const p0 = getPercent(values[0], min, max);
			const p1 = getPercent(values[1], min, max);
			return isHorizontal
				? `inset-inline-start:${insetPosition(p0)};width:${insetSpan(p0, p1)}`
				: `bottom:${insetPosition(p0)};height:${insetSpan(p0, p1)}`;
		}
		const p = getPercent(values[0], min, max);
		return isHorizontal
			? `inset-inline-start:0%;width:${insetPosition(p)}`
			: `bottom:0%;height:${insetPosition(p)}`;
	});

	// Suppress the per-thumb value bubble while the disabled-message tooltip is
	// showing, so a disabled slider surfaces the *reason* on hover/focus rather
	// than stacking two tooltips over the same thumb.
	const useValueTooltip = $derived(valueDisplay === 'tooltip' && !showsDisabledMessage);
	const tooltipPlacement = $derived(isHorizontal ? 'above' : 'start');

	const rowTheme = $derived(
		themeProps('slider', { orientation, disabled: isDisabled ? 'disabled' : null })
	);
	const rowAttrs = sliderRowAttrs();
	const trackContainerAttrs = $derived(sliderTrackContainerAttrs(isHorizontal, isDisabled));
	const trackTheme = $derived(themeProps('slider-track', { orientation }));
	const trackAttrs = $derived(sliderTrackAttrs(isHorizontal));
	const filledTrackAttrs = $derived(sliderFilledTrackAttrs(isHorizontal));
	const marksContainerAttrs = $derived(sliderMarksContainerAttrs(isHorizontal));
	const markAttrs = $derived(sliderMarkAttrs(isHorizontal));
	const markLabelAttrs = $derived(sliderMarkLabelAttrs(isHorizontal));
	const textValueAttrs = sliderTextValueAttrs();
	const thumbTheme = $derived(
		themeProps('slider-thumb', { orientation, disabled: isDisabled ? 'disabled' : null })
	);
	const thumbAttrs = $derived(sliderThumbAttrs(isHorizontal, isDisabled));

	const fieldStatus = $derived(
		status
			? {
					type: status.type,
					message: status.message,
					messageID: status.message ? statusMessageID : undefined
				}
			: undefined
	);
</script>

{#snippet thumb(thumbIndex: number)}
	<!--
		ARIA bounds must agree with the movement clamping in `updateValue`: in range
		mode a thumb cannot cross its sibling (minus the `minStepsBetweenThumbs`
		gap), and the result is always clamped to [min, max]. Reporting the raw
		[min, max] on both thumbs told AT the end thumb could travel below the start
		one, which the pointer and keyboard paths both refuse.
	-->
	{@const minGap = minStepsBetweenThumbs * step}
	{@const ariaValueMin = isRange && thumbIndex === 1 ? clamp(values[0] + minGap, min, max) : min}
	{@const ariaValueMax = isRange && thumbIndex === 0 ? clamp(values[1] - minGap, min, max) : max}
	<div
		id={!isRange ? id : undefined}
		role="slider"
		aria-valuemin={ariaValueMin}
		aria-valuemax={ariaValueMax}
		aria-valuenow={values[thumbIndex]}
		aria-valuetext={formatValue ? formatValue(values[thumbIndex]) : undefined}
		aria-orientation={orientation}
		aria-disabled={isDisabled ? 'true' : undefined}
		aria-invalid={status?.type === 'error' ? 'true' : undefined}
		aria-label={isRange ? (thumbIndex === 0 ? 'Minimum value' : 'Maximum value') : undefined}
		aria-labelledby={!isRange ? labelID : undefined}
		aria-describedby={ariaDescribedBy}
		{...thumbTheme}
		tabindex={isDisabled && !showsDisabledMessage ? -1 : 0}
		onkeydown={(e) => handleKeyDown(thumbIndex, e)}
		class={cx(thumbTheme.class, thumbAttrs.class)}
		style={thumbAttrs.style}
		style:inset-inline-start={thumbInlineStart(values[thumbIndex])}
		style:left={thumbLeft()}
		style:bottom={thumbBottom(values[thumbIndex])}
	></div>
{/snippet}

<Field
	data-testid={testId}
	{label}
	{isLabelHidden}
	{description}
	inputID={id}
	{labelID}
	isGroupLabel
	descriptionID={description ? descriptionID : undefined}
	{isOptional}
	{isRequired}
	{isDisabled}
	status={fieldStatus}
	{labelTooltip}
	statusVariant="detached"
	{width}
	{xstyle}
	class={className}
	style={styleProp}
>
	<div {...rowTheme} class={cx(rowTheme.class, rowAttrs.class)} style={rowAttrs.style}>
		{#if htmlName != null}
			<!--
				Positional identity: index 0 is the start thumb, 1 the end. Disabled
				native controls are excluded from form submission, so the hidden
				carrier mirrors that.
			-->
			{#each values as v, i (i)}
				<input type="hidden" name={htmlName} value={String(v)} disabled={isDisabled} />
			{/each}
		{/if}
		<div
			bind:this={trackEl}
			{@attach disabledMessageTooltip.attachTrigger}
			role={isRange ? 'group' : undefined}
			aria-labelledby={isRange ? labelID : undefined}
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerUp}
			class={trackContainerAttrs.class}
			style={trackContainerAttrs.style}
		>
			<!-- Background track -->
			<div
				aria-hidden="true"
				{...trackTheme}
				class={cx(trackTheme.class, trackAttrs.class)}
				style={trackAttrs.style}
			></div>

			<!-- Filled track -->
			<div
				aria-hidden="true"
				class={filledTrackAttrs.class}
				style={mergeStyle(filledTrackAttrs.style, filledStyle)}
			></div>

			<!-- Marks -->
			{#if marks}
				<div aria-hidden="true" class={marksContainerAttrs.class} style={marksContainerAttrs.style}>
					<!--
						Keyed by index, not by `mark.value` as upstream is: React only
						warns on a duplicate key where Svelte throws, and marks carry no
						focus, input state or transitions, so positional identity produces
						byte-identical DOM. The convention `Carousel`/`OverflowList` follow.
					-->
					{#each marks as mark, i (i)}
						<div>
							<div
								data-testid="slider-mark"
								data-mark-value={mark.value}
								class={markAttrs.class}
								style={mergeStyle(markAttrs.style, markPositionStyle(mark.value))}
							></div>
							{#if mark.label}
								<span
									data-testid="slider-mark-label"
									data-mark-value={mark.value}
									class={markLabelAttrs.class}
									style={mergeStyle(markLabelAttrs.style, markPositionStyle(mark.value))}
								>
									{mark.label}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<!-- Thumbs — upstream keys by `thumbIndex`, i.e. positionally. -->
			{#each values as _, i (i)}
				{#if useValueTooltip}
					<Tooltip
						content={displayValue(values[i])}
						placement={tooltipPlacement}
						delay={0}
						focusTrigger="always"
						isOpen={draggingThumb === i ? true : undefined}
					>
						{@render thumb(i)}
					</Tooltip>
				{:else}
					{@render thumb(i)}
				{/if}
			{/each}
		</div>

		{#if valueDisplay === 'text'}
			<span class={textValueAttrs.class} style={textValueAttrs.style}>
				{isRange
					? `${displayValue(values[0])} – ${displayValue(values[1])}`
					: displayValue(values[0])}
			</span>
		{/if}
	</div>
	{#if conveysRequired}
		<VisuallyHidden id={requiredID}>Required</VisuallyHidden>
	{/if}
	{#if showsDisabledMessage && disabledMessage}
		<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
	{/if}
</Field>
