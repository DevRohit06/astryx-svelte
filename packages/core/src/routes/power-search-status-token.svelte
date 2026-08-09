<script lang="ts">
	import { Token } from '$lib/index.js';
	import type { PowerSearchTokenProps } from '$lib/index.js';

	/**
	 * Upstream's `StatusToken`, declared inside `PowerSearch.stories.tsx`'s
	 * "Custom Components Map" section. A sibling module because Svelte has no
	 * in-file component declaration — the `LinkProvider/RouterLink.svelte`
	 * precedent — and because `PowerSearchComponentOverride.Token` is a
	 * `Component<PowerSearchTokenProps>`, i.e. a constructor rather than a
	 * snippet, so it has to be a real component.
	 *
	 * `config`, `field` and the rest arrive as upstream's props. `maxLength` is
	 * destructured and unused upstream too.
	 */

	const {
		filter,
		field,
		operator,
		maxLength: _maxLength,
		onClick,
		onRemove,
		isDisabled
	}: PowerSearchTokenProps = $props();

	const value = $derived(filter.value.type === 'enum' ? filter.value.value : '?');

	const colors: Record<string, string> = {
		open: '#22c55e',
		in_progress: '#3b82f6',
		review: '#a855f7',
		closed: '#6b7280',
		blocked: '#ef4444'
	};
</script>

{#snippet endContent()}
	<span style="font-weight: 600; color: {colors[value] ?? 'inherit'}">{value}</span>
{/snippet}

<Token
	label={`${field.label}: ${operator.label}`}
	{endContent}
	onclick={onClick
		? (e: MouseEvent) => {
				e.stopPropagation();
				onClick();
			}
		: undefined}
	{onRemove}
	{isDisabled}
/>
