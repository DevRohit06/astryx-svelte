<script lang="ts">
	import CheckboxInput, {
		type CheckboxInputProps
	} from '$lib/components/checkbox-input/checkbox-input.svelte';
	import Icon from '$lib/components/icon/icon.svelte';

	/**
	 * A `CheckboxInput` whose `labelIcon` is a snippet.
	 *
	 * Upstream's `labelIcon` is `ReactNode | IconType`, so its case passes the
	 * semantic name `"info"` and the component resolves it to an `<Icon>` with
	 * `size="sm" color="inherit"`. This port types `labelIcon` as a `Snippet`, so
	 * the caller authors that same `<Icon>` — which a test cannot do inline,
	 * hence this fixture.
	 */
	const props: Omit<CheckboxInputProps, 'labelIcon'> = $props();
</script>

{#snippet labelIcon()}
	<Icon icon="info" size="sm" color="inherit" />
{/snippet}

<CheckboxInput {...props} {labelIcon} />
