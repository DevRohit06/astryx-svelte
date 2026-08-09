<script lang="ts">
	import FieldLabel from '$lib/components/field/field-label.svelte';

	/**
	 * Upstream's `renderWithControl` helper from `FieldLabel.test.tsx`'s
	 * `description click forwarding` block: a real control carrying the target
	 * `id`, rendered as a *sibling* of the `FieldLabel` whose description
	 * forwards clicks to it.
	 *
	 * A fixture rather than inline props because upstream passes a fragment of
	 * two elements and, in one case, a `description` containing a real `<a>` with
	 * its own handler — a Svelte snippet, which only a template can author.
	 */
	interface Props {
		/** `type` of the sibling control. @default 'checkbox' */
		controlType?: string;
		/** Renders the label as a group label, which must not forward clicks. */
		isGroupLabel?: boolean;
		/** Spy for a click landing on the control. */
		onControlClick: (event: MouseEvent) => void;
		/** Renders the interactive-content description instead of plain text. */
		hasLink?: boolean;
		/** Spy for a click landing on the nested link. */
		onLinkClick?: (event: MouseEvent) => void;
	}

	const {
		controlType = 'checkbox',
		isGroupLabel,
		onControlClick,
		hasLink = false,
		onLinkClick
	}: Props = $props();
</script>

{#snippet linkDescription()}
	See our <a href="#terms" onclick={onLinkClick}>terms</a>
{/snippet}

<input id="ctrl" type={controlType} onclick={onControlClick} />
<FieldLabel
	label="Notify"
	inputID="ctrl"
	description={hasLink ? linkDescription : "We'll email you"}
	descriptionID="ctrl-desc"
	{isGroupLabel}
/>
