<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { StepperIndicatorPosition, StepperOrientation } from './stepper-context.svelte.js';

	export interface StepperProps extends BaseProps<HTMLOListElement> {
		/**
		 * Zero-based index of the active step.
		 */
		activeStep: number;
		/**
		 * Step elements to render.
		 */
		children: Snippet;
		/**
		 * Layout direction of the stepper.
		 * @default 'horizontal'
		 */
		orientation?: StepperOrientation;
		/**
		 * Called when a step indicator is clicked. Enables non-linear navigation.
		 * When provided, completed and current steps become clickable.
		 */
		onStepClick?: (index: number) => void;
		/**
		 * Accessible label describing the set of steps. Defaults to a translated
		 * "Progress" when unset.
		 */
		label?: string;
		/**
		 * Controls density (padding) of all steps.
		 * @default 'balanced'
		 */
		density?: 'compact' | 'balanced' | 'spacious';
		/**
		 * Controls where each step's indicator sits relative to the connector track.
		 * - 'separated': indicator lives in the label row, distinct from the progress
		 *   bar (the original Astryx layout).
		 * - 'on-track': indicator is slotted into the connector line as a node on the
		 *   track (the on-track indicator design).
		 * @default 'separated'
		 */
		indicatorPosition?: StepperIndicatorPosition;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { setStepperContext, type StepperContextValue } from './stepper-context.svelte.js';
	import { stepperRootAttrs } from './stepper.stylex.js';

	/**
	 * A stepper component for multi-step workflows. Displays numbered steps
	 * with visual indicators for completed, active, and upcoming states.
	 *
	 * Each Step child must provide a `step` prop (zero-based index) so it
	 * can derive its state from the parent's activeStep. The on-track layout
	 * hides the leading connector on the first step and the trailing connector
	 * on the last step structurally, from each step's own `<li>` position, so
	 * it works regardless of how the steps are grouped.
	 *
	 * Rendered as an ordered list (`<ol>`/`<li>`) rather than a `nav`
	 * landmark: a stepper communicates *progress through a sequence*, not a
	 * set of site navigation links. The active step is marked with
	 * `aria-current="step"` (handled per-step) and the list carries an
	 * accessible `label`. This follows the WAI-ARIA pattern for steppers /
	 * progress sequences and avoids polluting the page's landmark map.
	 *
	 * @example
	 * ```svelte
	 * <Stepper activeStep={1}>
	 *   <Step step={0} label="Account" />
	 *   <Step step={1} label="Profile" />
	 *   <Step step={2} label="Review" />
	 * </Stepper>
	 * ```
	 */
	const {
		activeStep,
		children,
		orientation = 'horizontal',
		onStepClick,
		label: labelFromProps,
		density = 'balanced',
		indicatorPosition = 'separated',
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: StepperProps = $props();

	const t = useTranslator();
	const label = $derived(labelFromProps ?? t('@astryx.stepper.label'));

	// Dev-mode duplicate step index detection. Steps register on mount and
	// deregister on unmount; a Map tracks count per index so we can warn when
	// two Steps share the same `step` value (which breaks aria-current).
	//
	// A plain `Map` in a plain `let`, which is what upstream's `useRef` is: a
	// mutable box nothing renders from. Making it `$state` would schedule a
	// re-render on every mount for a value only a `console.warn` reads.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const stepCounts = new Map<number, number>();
	function registerStep(index: number): () => void {
		const prev = stepCounts.get(index) ?? 0;
		stepCounts.set(index, prev + 1);
		// Upstream writes this as a bare, `NODE_ENV`-gated `console.warn` rather
		// than routing it through `devWarning`, and the message text is part of
		// what a consumer greps for — kept verbatim, as `Avatar`'s is.
		if (process.env.NODE_ENV !== 'production' && prev + 1 > 1) {
			console.warn(
				`[Stepper] Duplicate step index ${index}: two <Step> elements share the same \`step\` value. ` +
					`This breaks \`aria-current="step"\` and causes both to show as active simultaneously.`
			);
		}
		return () => {
			const cur = stepCounts.get(index) ?? 1;
			if (cur <= 1) {
				stepCounts.delete(index);
			} else {
				stepCounts.set(index, cur - 1);
			}
		};
	}

	// The step we came *from*. Steps need it to stagger their connector fill:
	// the distance and direction of the change decide which segment moves first
	// and how long the whole sweep may take (see `step.stylex.ts`'s CONNECTOR
	// FILL block).
	//
	// Upstream derives this during render from state — an effect runs after
	// paint, so the browser would already have committed the new fill states with
	// last render's delays, and on a jump of one that wrong first frame is the
	// entire animation. `$derived` is the same position in the Svelte lifecycle:
	// it recomputes when `activeStep` invalidates, before the DOM is updated, so
	// the classes and the timings land in the same commit.
	//
	// `seenCurrent`/`seenPrevious` are plain `let`s, not `$state`: writing to
	// `$state` from inside a `$derived` is a cycle, and nothing renders from them
	// directly. The step is idempotent for the same reason upstream's is stable
	// under StrictMode's double render — a second evaluation for an unchanged
	// `activeStep` finds `seenCurrent === activeStep` and changes nothing.
	//
	// Seeding both halves from the current `activeStep` is what suppresses the
	// cascade on mount: a stepper that opens on step 3 has no previous step to
	// have travelled from, so its completed segments paint filled at once. That
	// also makes the first evaluation identical on the server, so there is
	// nothing for hydration to disagree about.
	// `untrack` because the initial read is deliberately a snapshot — the
	// `$derived` below is the only thing that may follow `activeStep`.
	let seenCurrent = untrack(() => activeStep);
	let seenPrevious = untrack(() => activeStep);
	const previousActiveStep = $derived.by(() => {
		if (seenCurrent !== activeStep) {
			seenPrevious = seenCurrent;
			seenCurrent = activeStep;
		}
		return seenPrevious;
	});

	// A getter, never a frozen value: `activeStep` and `previousActiveStep` move
	// on every navigation and every Step reads both.
	setStepperContext((): StepperContextValue => ({
		activeStep,
		previousActiveStep,
		orientation,
		isNonLinear: onStepClick != null,
		onStepClick: onStepClick ?? null,
		density,
		indicatorPosition,
		registerStep
	}));

	const theme = $derived(themeProps('stepper', { orientation, indicatorPosition }));
	const rootAttrs = $derived(stepperRootAttrs({ orientation, indicatorPosition }, xstyle));
</script>

<ol
	aria-label={label}
	{...rest}
	{...theme}
	class={cx(theme.class, rootAttrs.class, className)}
	style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
>
	<!-- Each step renders its own progress bar segment; no child introspection
	     needed — steps derive state from context. -->
	{@render children()}
</ol>
