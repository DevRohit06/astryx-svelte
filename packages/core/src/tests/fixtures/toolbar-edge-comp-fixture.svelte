<script lang="ts" module>
	/** One toolbar-slot button. `props` reaches `<Button>`; `iconGlyph` fills its `icon` snippet. */
	export interface ToolbarEdgeCompButton {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props: Record<string, any>;
		/** `icon` — a span carrying this glyph, for the `isIconOnly` cases. */
		iconGlyph?: string;
	}
</script>

<script lang="ts">
	import Button from '$lib/components/button/button.svelte';
	import Toolbar from '$lib/components/toolbar/toolbar.svelte';

	/**
	 * `<Toolbar>` with a real `<Button>` in its start and/or end slot.
	 *
	 * `toolbar-fixture` fills the slots with bare `<span>`s and plain `<button>`s,
	 * which is what its own suite needs; the edge-compensation cases need the
	 * Astryx `Button` (it is what carries the marker) with `variant`, `isIconOnly`
	 * and `tooltip` varying per case, so they get their own fixture rather than a
	 * flag added to that one.
	 *
	 * Upstream passes the slots as inline JSX — `startContent={<Button … />}`. A
	 * Svelte snippet can only be authored in a template, so each slot becomes a
	 * spec and this fixture is the template that turns it back into markup.
	 */
	interface Props {
		/** The toolbar's accessible name. */
		label: string;
		start?: ToolbarEdgeCompButton;
		end?: ToolbarEdgeCompButton;
	}

	const { label, start, end }: Props = $props();
</script>

{#snippet startIcon()}<span>{start?.iconGlyph}</span>{/snippet}
{#snippet endIcon()}<span>{end?.iconGlyph}</span>{/snippet}

{#snippet startContent()}
	{#if start}
		<Button
			{...start.props}
			label={start.props.label as string}
			icon={start.iconGlyph != null ? startIcon : undefined}
		/>
	{/if}
{/snippet}

{#snippet endContent()}
	{#if end}
		<Button
			{...end.props}
			label={end.props.label as string}
			icon={end.iconGlyph != null ? endIcon : undefined}
		/>
	{/if}
{/snippet}

<Toolbar
	{label}
	startContent={start ? startContent : undefined}
	endContent={end ? endContent : undefined}
/>
