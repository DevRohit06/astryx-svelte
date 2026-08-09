<script lang="ts">
	import Banner from '$lib/components/banner/banner.svelte';

	/**
	 * `<Banner>` with its snippet slots filled from data.
	 *
	 * Upstream's cases pass `children` and `endContent` as inline JSX; a Svelte
	 * snippet can only be authored in a template, so this fixture is the template.
	 */
	interface Props {
		/** The banner's own props. */
		props: Record<string, unknown>;
		/** Render `children` — the collapsible content area. */
		hasChildren?: boolean;
		/** `data-testid` on the child content, when the case looks for it. */
		childTestid?: string;
		/** Text of the child content. */
		childText?: string;
		/** Render `endContent` — a real `<button>`, as upstream's case passes. */
		endButtonTestid?: string;
	}

	const {
		props,
		hasChildren = false,
		childTestid,
		childText = 'Extra content',
		endButtonTestid
	}: Props = $props();
</script>

{#snippet children()}
	<div data-testid={childTestid}>{childText}</div>
{/snippet}

{#snippet endContent()}
	<button type="button" data-testid={endButtonTestid}>Action</button>
{/snippet}

<Banner
	{...props}
	status={props.status as 'info' | 'warning' | 'error' | 'success'}
	title={props.title as string}
	endContent={endButtonTestid != null ? endContent : undefined}
	children={hasChildren ? children : undefined}
/>
