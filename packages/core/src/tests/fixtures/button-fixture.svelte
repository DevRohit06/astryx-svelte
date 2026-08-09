<script lang="ts" module>
	import type { ButtonProps } from '$lib/components/button/button.svelte';

	export interface ButtonFixtureProps {
		/**
		 * The Button's own props. The three snippet slots are supplied below.
		 * Required, because `label` is — every upstream case passes one.
		 */
		button: Omit<ButtonProps, 'icon' | 'endContent' | 'children'>;
		/**
		 * Text of the `icon` slot, rendered as upstream's
		 * `<span data-testid="icon">⚙</span>`. Omitted → no icon.
		 */
		icon?: string;
		/** Text of `children`. Omitted → no children, so `label` shows through. */
		text?: string;
		/**
		 * Label of a `Badge` in the `endContent` slot, rendered as upstream's
		 * `<Badge data-testid="end" label={…} />`. Omitted → no endContent.
		 */
		endBadge?: string | number;
	}
</script>

<script lang="ts">
	import Badge from '$lib/components/badge/badge.svelte';
	import Button from '$lib/components/button/button.svelte';

	/**
	 * `<Button icon={…} endContent={…}>children</Button>` for the ported Button
	 * suite.
	 *
	 * Upstream writes all three inline as JSX; here they are `Snippet`s, and a
	 * snippet can only be authored in a template. `endBadge` is a string or a
	 * number because upstream passes `label={3}` — our `Badge.label` is
	 * `string | Snippet`, so the number is stringified here rather than widening
	 * the component.
	 */
	const { button, icon, text, endBadge }: ButtonFixtureProps = $props();
</script>

{#snippet iconSlot()}
	<span data-testid="icon">{icon}</span>
{/snippet}

{#snippet endSlot()}
	<Badge data-testid="end" label={String(endBadge)} />
{/snippet}

{#snippet childrenSlot()}
	{text}
{/snippet}

<Button
	{...button}
	icon={icon != null ? iconSlot : undefined}
	endContent={endBadge != null ? endSlot : undefined}
	children={text != null ? childrenSlot : undefined}
/>
