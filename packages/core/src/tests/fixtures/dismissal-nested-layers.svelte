<script lang="ts">
	import DismissalLayer from './dismissal-layer.svelte';
	import type { LayerEscapeBehavior } from '$lib/components/layer/layer-stack.js';

	/**
	 * Upstream's `<Layer outer><Layer inner /></Layer>` nesting, which is
	 * component *content* and therefore a snippet here — it cannot be written in
	 * a `render()` props object.
	 *
	 * The inner layer's switches are props so the one shape covers every nested
	 * case upstream writes with it: the plain pair, `behavior="block"`,
	 * `isPresent`, and `isEnabled={false}`. `hasInner` is the seam for the case
	 * that rerenders the inner layer away.
	 */
	interface Props {
		onOuterDismiss: () => void;
		onInnerDismiss: () => void;
		hasInner?: boolean;
		innerBehavior?: LayerEscapeBehavior;
		innerIsEnabled?: boolean;
		innerIsPresent?: () => boolean;
	}

	const {
		onOuterDismiss,
		onInnerDismiss,
		hasInner = true,
		innerBehavior = 'close',
		innerIsEnabled = true,
		innerIsPresent
	}: Props = $props();
</script>

<DismissalLayer onDismiss={onOuterDismiss}>
	{#if hasInner}
		<DismissalLayer
			onDismiss={onInnerDismiss}
			behavior={innerBehavior}
			isEnabled={innerIsEnabled}
			isPresent={innerIsPresent}
		/>
	{/if}
</DismissalLayer>
