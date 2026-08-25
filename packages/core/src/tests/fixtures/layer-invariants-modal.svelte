<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface LayerInvariantsModalProps {
		label: string;
		purpose?: 'required';
		isOpenInitially?: boolean;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import Dialog from '$lib/components/dialog/dialog.svelte';

	/**
	 * Upstream's local `Modal` from `Layer/layerDismissalInvariants.test.tsx` — "a
	 * modal whose own open state is real, so the DOM changes when it closes".
	 *
	 * A fixture rather than a `render()` prop bag because the nesting upstream
	 * writes as JSX children is component *content*, which is a snippet here.
	 * `useState(isOpenInitially)` becomes a `$state` seeded from the prop at init,
	 * which is the same "own state, seeded once" shape — `untrack` is what says
	 * "seeded once" out loud, and silences the compiler's warning about reading a
	 * prop's initial value.
	 */
	const { label, purpose, isOpenInitially = true, children }: LayerInvariantsModalProps = $props();

	let isOpen = $state(untrack(() => isOpenInitially));
</script>

<Dialog {isOpen} onOpenChange={(open) => (isOpen = open)} {purpose} aria-label={label}>
	{label}
	{@render children?.()}
</Dialog>
