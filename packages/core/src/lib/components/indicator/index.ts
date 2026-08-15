/**
 * Indicators are the componentized form of stateful control visuals — the
 * checkbox box, the radio circle, the mark on a chosen option. They are
 * decorative: the owning component keeps the role, state, and focus behavior,
 * while the indicator turns state into a picture.
 *
 * That makes them themeable through CSS targets like any other component, and
 * replaceable wholesale by name through `defineTheme({indicators})` — replace
 * `check` and every single-selection mark in the app follows.
 */

export { default as CheckboxIndicator } from './checkbox-indicator.svelte';
export { default as CheckIndicator } from './check-indicator.svelte';
export { default as RadioIndicator } from './radio-indicator.svelte';

export type { CheckboxIndicatorProps } from './checkbox-indicator.svelte';
export type { CheckIndicatorProps } from './check-indicator.svelte';
export type { RadioIndicatorProps } from './radio-indicator.svelte';

// Registry — resolves without a `<Theme>` having mounted, so it works on the
// server as well as the client.
export { defaultIndicators, getIndicator } from './indicator-registry.js';
export type { CoreIndicatorName, IndicatorRegistrySource } from './indicator-registry.js';

export { useIndicator } from './use-indicator.svelte.js';
export type { UseAnyIndicatorReturn, UseCoreIndicatorReturn } from './use-indicator.svelte.js';

export { indicatorScope } from './indicator.markers.stylex.js';

export type {
	IndicatorComponent,
	IndicatorFamily,
	IndicatorFamilyMap,
	IndicatorMap,
	IndicatorName,
	IndicatorNameOfFamily,
	IndicatorPosition,
	IndicatorProps,
	IndicatorRegistry,
	IndicatorSize,
	IndicatorState
} from './types.js';
