<script lang="ts">
	import Banner from '$lib/components/banner/banner.svelte';

	/**
	 * A focusable sibling *before* a dismissable `<Banner>`.
	 *
	 * Upstream's focus-handoff cases render a fragment — a `<button>` next to the
	 * banner — so that focus has somewhere to have come *from*. `render()` takes a
	 * component, not a fragment, so the pair lives here.
	 */
	interface Props {
		/** Label of the button preceding the banner. */
		beforeLabel?: string;
	}

	const { beforeLabel = 'Before' }: Props = $props();
</script>

<button type="button">{beforeLabel}</button>
<Banner status="info" title="Heads up" isDismissable />
