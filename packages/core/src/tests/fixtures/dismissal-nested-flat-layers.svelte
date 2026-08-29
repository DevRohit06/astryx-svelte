<script lang="ts">
	import DismissalFlatLayer from './dismissal-flat-layer.svelte';

	/**
	 * Upstream's `<FlatLayer><FlatLayer /></FlatLayer>`: two layers the tree
	 * reports at the same depth, one DOM-nested inside the other. A fixture
	 * because the nesting is component content, which is a snippet here.
	 */
	interface Props {
		onOuterDismiss: () => void;
		onInnerDismiss: () => void;
	}

	const { onOuterDismiss, onInnerDismiss }: Props = $props();
</script>

<DismissalFlatLayer onDismiss={onOuterDismiss}>
	<DismissalFlatLayer onDismiss={onInnerDismiss} />
</DismissalFlatLayer>
