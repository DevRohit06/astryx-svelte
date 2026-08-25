<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { StepStatus } from './step-status.js';

	/**
	 * Built-in indicator presets. Anything other than these strings passed to
	 * `indicator` is treated as a custom node (e.g. an `<Icon />` snippet).
	 * - 'auto': numbered badge for not-yet-reached steps, a check once completed
	 *   (default)
	 * - 'number': always a numbered badge
	 * - 'none': no indicator — just the progress bar and label
	 */
	export type StepIndicatorPreset = 'auto' | 'number' | 'none';
	export type StepDensity = 'compact' | 'balanced' | 'spacious';

	export interface StepProps extends BaseProps<HTMLLIElement> {
		/**
		 * Zero-based index of this step. Used to derive progress (completed /
		 * active / not-started) relative to the parent's `activeStep`.
		 */
		step: number;
		/**
		 * Step label text.
		 */
		label: string;
		/**
		 * Optional description shown below the label.
		 */
		description?: string;
		/**
		 * Content rendered below the label and description. Useful in vertical
		 * steppers to show form fields or detailed content for each step.
		 */
		children?: Snippet;

		/**
		 * Semantic status for the step, mapped to the global Astryx semantic tokens
		 * (`accent`, `success`, `warning`, `error`). In the default `auto` indicator
		 * mode it sets both the indicator color and a matching glyph: `success` shows
		 * a green check-circle, `warning`/`error` show the shared Input status icons.
		 * `accent` is color-only. The current (in-progress) step always keeps its
		 * current-step indicator regardless of `status`. Never recolors the
		 * connector/track.
		 *
		 * Because the indicator glyphs are decorative (aria-hidden), the status also
		 * reaches assistive technology as text: visually hidden "completed" /
		 * "warning" / "error" next to the label, and composed into the accessible
		 * name of clickable steps.
		 */
		status?: StepStatus;
		/**
		 * Disable interaction for this step.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Marks the step as optional, appending an "Optional" affordance after the
		 * label.
		 * @default false
		 */
		isOptional?: boolean;
		/**
		 * Trailing content rendered at the end of the label row (e.g. a timestamp
		 * or status chip).
		 */
		endContent?: Snippet;
		/**
		 * What to show as the step indicator. Accepts a preset string or a snippet:
		 * - 'auto': numbered badge until completed, then a check (default)
		 * - 'number': always a numbered badge
		 * - 'none': no indicator, just the bar + label
		 * - Snippet: any custom icon or element to render as the indicator
		 * @default 'auto'
		 */
		// The union is spelled out rather than written as `StepIndicatorPreset`,
		// which is the same type. The docs emitter reads this package's compiled
		// `.d.ts`, so a named alias would publish `StepIndicatorPreset | Snippet`
		// as the documented type — hiding the legal values behind a name, which is
		// exactly what `doc-prop-literals.test.ts` (#1645) exists to catch.
		// Upstream's hand-authored doc spells the same union out.
		indicator?: 'auto' | 'number' | 'none' | Snippet;
		/**
		 * Controls vertical padding of the step. Falls back to the stepper-level
		 * density when unset.
		 * - 'compact': minimal padding (4px block)
		 * - 'balanced': default (8px block)
		 * - 'spacious': generous (12px block, 12px inline)
		 */
		density?: StepDensity;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { colorVars } from '../../styles/tokens.stylex.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import Icon from '../icon/icon.svelte';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { useStepperContext } from './stepper-context.svelte.js';
	import {
		stepBarAttrs,
		stepBodyAttrs,
		stepContentAttrs,
		stepDescriptionAttrs,
		stepDescriptionRowAttrs,
		stepFillTimings,
		stepIconLabelRowAttrs,
		stepIndicatorIconAttrs,
		stepIndicatorNumberAttrs,
		stepLabelAttrs,
		stepOptionalDotAttrs,
		stepOptionalTextAttrs,
		stepOtBodyAttrs,
		stepOtContentAttrs,
		stepOtContentSegAttrs,
		stepOtContentWrapAttrs,
		stepOtIndicatorColAttrs,
		stepOtLabelRowAttrs,
		stepOtLabelWrapAttrs,
		stepOtLeadSegAttrs,
		stepOtRailSegAttrs,
		stepOtTrackRowAttrs,
		stepOtWrapAttrs,
		stepRootAttrs,
		stepVerticalBodyAttrs,
		type StepProgress
	} from './step.stylex.js';

	/**
	 * An individual step within a `Stepper`. Renders a 4px progress-bar segment,
	 * an indicator (numbered badge, check, or any custom icon), a label with
	 * optional description, and an optional content slot.
	 *
	 * Progress (completed / active / not-started) is derived from the parent's
	 * `activeStep` and this step's `step` prop. The optional `status` prop layers a
	 * semantic meaning on top: in the default `auto` indicator mode it recolors the
	 * indicator and swaps in a matching glyph (`success` → green check-circle,
	 * `warning`/`error` → the shared Input status icons). The current step always
	 * keeps its current-step ring. `status` never recolors the connector/track.
	 *
	 * @example
	 * ```svelte
	 * <Step step={0} label="Account details" description="Enter your email" />
	 * ```
	 *
	 * @example
	 * ```svelte
	 * <Step step={1} label="Payment" status="error" />
	 * ```
	 */
	const {
		step,
		label,
		description,
		children,
		status,
		isDisabled = false,
		isOptional = false,
		endContent,
		indicator: indicatorProp,
		density: densityProp,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: StepProps = $props();

	const t = useTranslator();
	const stepper = useStepperContext();

	const activeStep = $derived(stepper().activeStep);
	const previousActiveStep = $derived(stepper().previousActiveStep);
	const orientation = $derived(stepper().orientation);
	const onStepClick = $derived(stepper().onStepClick);
	const ctxDensity = $derived(stepper().density);
	const indicatorPosition = $derived(stepper().indicatorPosition);

	// Register this step index with the parent Stepper for duplicate detection.
	// `registerStep` is a plain closure over the stepper's counting Map, stable
	// for the stepper's lifetime — upstream's `useCallback([])`. Reading it once
	// keeps the effect's only dependency `step`, matching upstream's dep array.
	const registerStep = stepper().registerStep;
	$effect(() => registerStep(step));

	const density = $derived(densityProp ?? ctxDensity);

	// Resolve indicator prop — may be a preset string or a custom snippet.
	const isCustomIndicator = $derived(indicatorProp != null && typeof indicatorProp !== 'string');
	const customIcon = $derived(isCustomIndicator ? (indicatorProp as Snippet) : null);
	const indicator = $derived<StepIndicatorPreset>(
		isCustomIndicator ? 'auto' : ((indicatorProp as StepIndicatorPreset | undefined) ?? 'auto')
	);

	// Internal progress, derived from the parent's activeStep. This is NOT the
	// public `status` prop — `status` controls semantic color only.
	const progress = $derived<StepProgress>(
		step === activeStep ? 'in-progress' : step < activeStep ? 'completed' : 'not-started'
	);

	const isVertical = $derived(orientation === 'vertical');
	const isActive = $derived(progress === 'in-progress');
	// Any non-disabled step is navigable when an onStepClick handler is provided,
	// including not-started steps (free navigation across the flow).
	const isClickable = $derived(!isDisabled && onStepClick != null);

	function handleClick(): void {
		const onClick = stepper().onStepClick;
		if (isClickable && onClick) {
			onClick(step);
		}
	}

	// Bar fill is purely progress-based. `status` never recolors the bar — it
	// only recolors the indicator (icon / number badge) below.
	const isBarFilled = $derived(progress === 'completed' || progress === 'in-progress');

	// A vertical on-track step with a content slot draws a third segment down the
	// side of it, so the span leaving this step is stitched from three pieces.
	const hasContentSeg = $derived(isVertical && children != null);

	const timings = $derived(
		stepFillTimings({ step, activeStep, previousActiveStep, isVertical, hasContentSeg })
	);

	// Semantic `status` drives a distinct indicator glyph (default 'auto' mode,
	// no custom icon), all sourced from the themed Icon registry so a step reads
	// the same as the rest of the system:
	//  - success → the themed `success` glyph (same check-circle as a completed
	//    step), tinted success — i.e. a green check
	//  - warning → the themed `warning` glyph
	//  - error   → the themed `error` glyph
	// The current (in-progress) step always shows the current-step ring — its
	// indicator "replaces" any status glyph. `accent` has no distinct glyph and
	// falls through to the progress-derived default.
	const statusGlyph = $derived<'success' | 'warning' | 'error' | null>(
		indicator === 'auto' &&
			customIcon == null &&
			!isActive &&
			(status === 'success' || status === 'warning' || status === 'error')
			? status
			: null
	);

	const hasIndicator = $derived(indicator !== 'none');
	const showNumber = $derived(
		customIcon == null &&
			statusGlyph == null &&
			(indicator === 'number' || (indicator === 'auto' && progress === 'not-started'))
	);

	// Every indicator glyph below is aria-hidden (pure decoration), so the
	// step's progress/status must also reach assistive tech as text
	// (WCAG 1.4.1 / 1.3.1). `error`/`warning` announce the semantic status;
	// `success` and a completed step both announce "completed". The current
	// step is announced via aria-current="step" instead, and not-started steps
	// stay silent (the default state needs no qualifier).
	const statusText = $derived<string | null>(
		status === 'error'
			? t('@astryx.step.status.error')
			: status === 'warning'
				? t('@astryx.step.status.warning')
				: status === 'success' || progress === 'completed'
					? t('@astryx.step.status.completed')
					: null
	);

	// Rendered next to the label: hidden text for static steps, and composed
	// into the button's accessible name for clickable ones (an aria-label on
	// the button would otherwise override the hidden text). Two separate keys
	// rather than string concatenation so translations control the joiner.
	const stepAriaLabel = $derived(
		statusText != null
			? t('@astryx.step.goToStepWithStatus', {
					stepNumber: step + 1,
					label,
					status: statusText
				})
			: t('@astryx.step.goToStep', { stepNumber: step + 1, label })
	);

	// Theme data attributes reflect progress + optional semantic status.
	const stepTheme = $derived(themeProps('step', { progress, status: status ?? undefined }));
	const indicatorTheme = $derived(
		themeProps('step-indicator', { progress, status: status ?? undefined })
	);
	const connectorTheme = $derived(themeProps('step-connector'));
	const barTheme = $derived(themeProps('step-bar'));

	const rootAttrs = $derived(stepRootAttrs({ orientation, indicatorPosition }, xstyle));
	const barAttrs = $derived(stepBarAttrs({ isVertical, isBarFilled, timing: timings.bar }));
	const verticalBodyAttrs = stepVerticalBodyAttrs();
	const bodyAttrs = $derived(stepBodyAttrs({ density, isClickable }));
	const iconLabelRowAttrs = stepIconLabelRowAttrs();
	const numberAttrs = $derived(stepIndicatorNumberAttrs({ progress, status, isDisabled }));
	const iconAttrs = $derived(
		stepIndicatorIconAttrs({
			progress,
			status,
			isDisabled,
			hasCustomIcon: customIcon != null,
			statusGlyph
		})
	);
	const labelAttrs = $derived(stepLabelAttrs({ progress, isDisabled }));
	const optionalDotAttrs = stepOptionalDotAttrs();
	const optionalTextAttrs = stepOptionalTextAttrs();
	const descriptionRowAttrs = $derived(stepDescriptionRowAttrs(hasIndicator));
	const descriptionAttrs = stepDescriptionAttrs();
	const contentAttrs = $derived(stepContentAttrs({ density, hasIndicator }));

	// ======= ON-TRACK =======
	// Connector fill is purely progress-based (matches the separated bar): the
	// segment before the indicator is "reached" once we're at/past this step; the
	// segment after is filled only once this step is completed. `status` never
	// recolors the connector — only the indicator.
	//
	// First/last connector visibility is decided structurally from the step's own
	// `<li>` position (see `otSegHiddenIfFirst`/`Last`), not by counting children
	// in the parent — so grouping steps in a fragment can't break it.
	const beforeFilled = $derived(step <= activeStep);
	const afterFilled = $derived(step < activeStep);

	const otWrapAttrs = $derived(stepOtWrapAttrs({ isVertical, density, isClickable }));
	const otIndicatorColAttrs = $derived(stepOtIndicatorColAttrs(density));
	const otLeadSegAttrs = $derived(
		stepOtLeadSegAttrs({ isVertical, density, isFilled: beforeFilled, timing: timings.before })
	);
	const otRailSegAttrs = $derived(
		stepOtRailSegAttrs({ isVertical, isFilled: afterFilled, timing: timings.rail })
	);
	const otContentSegAttrs = $derived(
		stepOtContentSegAttrs({ density, isFilled: afterFilled, timing: timings.content })
	);
	const otTrackRowAttrs = stepOtTrackRowAttrs();
	const otBodyAttrs = stepOtBodyAttrs();
	const otLabelWrapAttrs = $derived(stepOtLabelWrapAttrs(density));
	const otLabelRowAttrs = $derived(stepOtLabelRowAttrs(isVertical));
	const otContentWrapAttrs = stepOtContentWrapAttrs();
	const otContentAttrs = $derived(stepOtContentAttrs({ isVertical, density }));
</script>

<!--
	Default progress icons (16px).

	The `completed` progress state and the current-step ring are drawn as local
	<svg> glyphs rather than sourced from the Icon registry. This is a deliberate
	exception to the "glyphs come from the registry" convention (audit rule T17),
	for two reasons:

	 1. `CurrentIcon` (a dot inside a ring) has no registry equivalent — it is a
	    progress affordance, not a general-purpose icon.
	 2. `CheckCircleIcon` (a filled circle with a check) is intentionally NOT the
	    registry `success` glyph, even though the two look similar. They mean
	    different things and must stay independently restyleable: `completed`
	    marks *progress through the sequence* (every step you've passed), while
	    the semantic `success` status marks a step's *outcome*. A stepper can
	    show a completed step that also carries a `warning`/`error` status, so
	    collapsing the two glyphs would conflate progress with outcome. The
	    semantic `success`/`warning`/`error` STATUS glyphs DO defer to the themed
	    registry (see the status branch below), so those share one visual
	    language; only the progress marks are local.

	Both glyphs paint via `currentColor`, so the indicator's color is still
	controlled by tokens on the wrapper (never hardcoded), and the wrapper
	carries the `astryx-step-indicator` theme target.
-->

<!-- Filled circle with a check — shown for a completed step in 'auto' mode. -->
{#snippet checkCircleIcon()}
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
		<circle cx="8" cy="8" r="8" fill="currentColor" />
		<path
			d="M4.75 8.25 7 10.5l4.25-4.5"
			stroke={colorVars['--color-background-surface']}
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

<!-- Filled dot in a ring — shown for the active step in 'auto' mode. -->
{#snippet currentIcon()}
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
		<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2" />
		<circle cx="8" cy="8" r="4" fill="currentColor" />
	</svg>
{/snippet}

<!--
	Build the indicator node.
	 'auto': number for not-started, check/dot icon once reached
	 'number': always number badge
	 'none': nothing
	 custom snippet: render as-is
-->
{#snippet indicatorNode()}
	{#if hasIndicator}
		{#if showNumber}
			<div
				aria-hidden="true"
				{...indicatorTheme}
				class={cx(indicatorTheme.class, numberAttrs.class)}
				style={numberAttrs.style}
			>
				{step + 1}
			</div>
		{:else}
			<div
				aria-hidden="true"
				{...indicatorTheme}
				class={cx(indicatorTheme.class, iconAttrs.class)}
				style={iconAttrs.style}
			>
				<!--
					Priority: explicit custom icon → status glyph (non-current steps) →
					progress-derived default (check when completed, ring when current).
				-->
				{#if customIcon != null}
					{@render customIcon()}
				{:else if statusGlyph === 'success'}
					<Icon icon="success" size="sm" color={isDisabled ? 'disabled' : 'success'} />
				{:else if statusGlyph === 'warning'}
					<Icon icon="warning" size="sm" color={isDisabled ? 'disabled' : 'warning'} />
				{:else if statusGlyph === 'error'}
					<Icon icon="error" size="sm" color={isDisabled ? 'disabled' : 'error'} />
				{:else if progress === 'completed'}
					{@render checkCircleIcon()}
				{:else}
					{@render currentIcon()}
				{/if}
			</div>
		{/if}
	{/if}
{/snippet}

<!-- The label, its hidden status text, the optional affordance and end content. -->
{#snippet labelLine()}
	<span class={labelAttrs.class} style={labelAttrs.style}>{label}</span>
	{#if statusText != null && statusText !== ''}
		<VisuallyHidden>{statusText}</VisuallyHidden>
	{/if}
	{#if isOptional}
		<span class={optionalDotAttrs.class} style={optionalDotAttrs.style}>•</span>
		<span class={optionalTextAttrs.class} style={optionalTextAttrs.style}
			>{t('@astryx.step.optional')}</span
		>
	{/if}
	{#if endContent}{@render endContent()}{/if}
{/snippet}

<!-- Indicator + label row (separated layouts). -->
{#snippet iconLabelNode()}
	<div class={iconLabelRowAttrs.class} style={iconLabelRowAttrs.style}>
		{@render indicatorNode()}
		{@render labelLine()}
	</div>
{/snippet}

<!-- Description row (separated layouts). -->
{#snippet descriptionNode()}
	{#if description != null && description !== ''}
		<div class={descriptionRowAttrs.class} style={descriptionRowAttrs.style}>
			<span class={descriptionAttrs.class} style={descriptionAttrs.style}>{description}</span>
		</div>
	{/if}
{/snippet}

<!-- Content slot (separated layouts). -->
{#snippet contentNode()}
	{#if children}
		<div class={contentAttrs.class} style={contentAttrs.style}>{@render children()}</div>
	{/if}
{/snippet}

<!-- Body: the hover target, a <button> only when the step is clickable. -->
{#snippet separatedBody()}
	{#if isClickable}
		<button
			type="button"
			onclick={handleClick}
			aria-label={stepAriaLabel}
			class={bodyAttrs.class}
			style={bodyAttrs.style}
		>
			{@render iconLabelNode()}
			{@render descriptionNode()}
		</button>
	{:else}
		<div class={bodyAttrs.class} style={bodyAttrs.style}>
			{@render iconLabelNode()}
			{@render descriptionNode()}
		</div>
	{/if}
{/snippet}

<!-- On-track label column + description. -->
{#snippet otLabelLine()}
	<div class={otLabelRowAttrs.class} style={otLabelRowAttrs.style}>
		{@render labelLine()}
	</div>
{/snippet}

{#snippet otDescriptionNode()}
	{#if description != null && description !== ''}
		<span class={descriptionAttrs.class} style={descriptionAttrs.style}>{description}</span>
	{/if}
{/snippet}

<!-- On-track content slot. Vertical steps also continue the rail past it. -->
{#snippet otContentNode()}
	{#if children}
		{#if isVertical}
			<div class={otContentWrapAttrs.class} style={otContentWrapAttrs.style}>
				<div
					aria-hidden="true"
					{...connectorTheme}
					class={cx(connectorTheme.class, otContentSegAttrs.class)}
					style={otContentSegAttrs.style}
				></div>
				<div class={otContentAttrs.class} style={otContentAttrs.style}>{@render children()}</div>
			</div>
		{:else}
			<div class={otContentAttrs.class} style={otContentAttrs.style}>{@render children()}</div>
		{/if}
	{/if}
{/snippet}

<!-- On-track inner: the rail column and the label body (vertical). -->
{#snippet otInnerV()}
	<div class={otIndicatorColAttrs.class} style={otIndicatorColAttrs.style}>
		<div
			aria-hidden="true"
			{...connectorTheme}
			class={cx(connectorTheme.class, otLeadSegAttrs.class)}
			style={otLeadSegAttrs.style}
		></div>
		{@render indicatorNode()}
		<div
			aria-hidden="true"
			{...connectorTheme}
			class={cx(connectorTheme.class, otRailSegAttrs.class)}
			style={otRailSegAttrs.style}
		></div>
	</div>
	<div class={otBodyAttrs.class} style={otBodyAttrs.style}>
		{@render otLabelLine()}
		{@render otDescriptionNode()}
	</div>
{/snippet}

<!-- On-track inner: the track row and the label column below it (horizontal). -->
{#snippet otInnerH()}
	<div class={otTrackRowAttrs.class} style={otTrackRowAttrs.style}>
		<div
			aria-hidden="true"
			{...connectorTheme}
			class={cx(connectorTheme.class, otLeadSegAttrs.class)}
			style={otLeadSegAttrs.style}
		></div>
		{@render indicatorNode()}
		<div
			aria-hidden="true"
			{...connectorTheme}
			class={cx(connectorTheme.class, otRailSegAttrs.class)}
			style={otRailSegAttrs.style}
		></div>
	</div>
	<div class={otLabelWrapAttrs.class} style={otLabelWrapAttrs.style}>
		{@render otLabelLine()}
		{@render otDescriptionNode()}
	</div>
{/snippet}

{#snippet otBody(inner: Snippet)}
	{#if isClickable}
		<button
			type="button"
			onclick={handleClick}
			aria-label={stepAriaLabel}
			class={otWrapAttrs.class}
			style={otWrapAttrs.style}
		>
			{@render inner()}
		</button>
	{:else}
		<div class={otWrapAttrs.class} style={otWrapAttrs.style}>
			{@render inner()}
		</div>
	{/if}
{/snippet}

<li
	{...stepTheme}
	class={cx(stepTheme.class, rootAttrs.class, className)}
	style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	aria-current={isActive ? 'step' : undefined}
	{...rest}
>
	{#if indicatorPosition === 'on-track'}
		{@render otBody(isVertical ? otInnerV : otInnerH)}
		{@render otContentNode()}
	{:else if isVertical}
		<!-- 4px progress bar -->
		<div
			aria-hidden="true"
			{...barTheme}
			class={cx(barTheme.class, barAttrs.class)}
			style={barAttrs.style}
		></div>
		<!-- Body: button wraps only label area, children render outside -->
		<div class={verticalBodyAttrs.class} style={verticalBodyAttrs.style}>
			{@render separatedBody()}
			{@render contentNode()}
		</div>
	{:else}
		<!-- 4px progress bar segment for this step -->
		<div
			aria-hidden="true"
			{...barTheme}
			class={cx(barTheme.class, barAttrs.class)}
			style={barAttrs.style}
		></div>
		{@render separatedBody()}
		{@render contentNode()}
	{/if}
</li>
