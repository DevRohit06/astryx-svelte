<script lang="ts">
	import DismissalLayer from './dismissal-layer.svelte';
	import type { LayerEscapeBehavior } from '$lib/components/layer/layer-stack.js';

	/**
	 * Upstream's local `Siblings` component from the `registration order` block —
	 * two unrelated same-depth layers, the older one's behavior a prop.
	 *
	 * `hasNewer` is this port's seam for the case upstream writes by rerendering
	 * a fragment from one `<Layer>` to two: `rerender` merges props here rather
	 * than replacing the tree, so the second layer arrives as a flag.
	 */
	interface Props {
		onOlderDismiss: () => void;
		onNewerDismiss: () => void;
		olderBehavior?: LayerEscapeBehavior;
		hasNewer?: boolean;
	}

	const {
		onOlderDismiss,
		onNewerDismiss,
		olderBehavior = 'close',
		hasNewer = true
	}: Props = $props();
</script>

<DismissalLayer onDismiss={onOlderDismiss} behavior={olderBehavior} />
{#if hasNewer}
	<DismissalLayer onDismiss={onNewerDismiss} />
{/if}
