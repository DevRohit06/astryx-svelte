<script lang="ts">
	import ComplexSelector from '$lib/components/complex-selector/complex-selector.svelte';
	import type {
		ComplexSelectorSize,
		ComplexSelectorVariant
	} from '$lib/components/complex-selector/complex-selector.stylex.js';
	import type { LayerAlignment } from '$lib/components/layer/use-layer.svelte.js';
	import type { ComplexSelectorStatus } from '$lib/components/complex-selector/complex-selector.svelte';
	import type { IconName } from '$lib/components/icon/icon-registry.js';

	/**
	 * The shell-level `ComplexSelector` cases: variant, start icon, alignment and
	 * the imperative handle. Its content is inert — these cases are about the
	 * trigger and the popup surface, not about committing a value.
	 */
	interface Props {
		label?: string;
		value?: unknown;
		size?: ComplexSelectorSize;
		variant?: ComplexSelectorVariant;
		startIcon?: IconName;
		alignment?: LayerAlignment;
		status?: ComplexSelectorStatus;
		isDisabled?: boolean;
		'data-testid'?: string;
	}

	const {
		label = 'View options',
		value = [],
		size,
		variant,
		startIcon,
		alignment,
		status,
		isDisabled = false,
		'data-testid': testId
	}: Props = $props();

	/**
	 * The selector instance, so a case can drive `open`/`close`/`toggle`/`isOpen`.
	 * Upstream reaches these through a `React.createRef<ComplexSelectorHandle>()`;
	 * here the instance *is* the handle, so the fixture only has to hand it back.
	 */
	let selector = $state<ReturnType<typeof ComplexSelector> | undefined>();

	export function handle() {
		return selector;
	}
</script>

<ComplexSelector
	bind:this={selector}
	{label}
	{value}
	{size}
	{variant}
	{startIcon}
	{alignment}
	{status}
	{isDisabled}
	data-testid={testId}
>
	<button type="button">Apply</button>
</ComplexSelector>
