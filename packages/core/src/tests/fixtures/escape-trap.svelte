<script lang="ts">
	import { useFocusTrap } from '$lib/hooks/use-focus-trap.svelte.js';

	interface Props {
		isActive: boolean;
		onEscape: () => void;
		label: string;
	}

	const { isActive, onEscape, label }: Props = $props();

	const trap = useFocusTrap(() => ({ isActive, onEscape }));
</script>

<div {@attach trap.attachContainer} data-testid={label}>
	<button type="button">{label}-btn</button>
</div>
