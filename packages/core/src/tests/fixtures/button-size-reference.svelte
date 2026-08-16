<script lang="ts">
	import Button from '$lib/components/button/button.svelte';

	/**
	 * Two icon-only `Button`s — one at the size under test, one at `md` — so a
	 * case can compute the atomic classes that size compiles to *and `md` does
	 * not*.
	 *
	 * Upstream renders this pair inline inside `sizeOnlyClasses` and unmounts it;
	 * a Svelte case renders a fixture instead, and the render is scoped to its own
	 * container so there is nothing to unmount.
	 */
	interface Props {
		size: 'sm' | 'lg';
	}

	const { size }: Props = $props();
</script>

{#snippet icon()}<span></span>{/snippet}

<Button label="sized reference" {size} isIconOnly {icon} data-testid="sized-ref" />
<Button label="md reference" size="md" isIconOnly {icon} data-testid="md-ref" />
