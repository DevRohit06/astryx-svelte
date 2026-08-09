<!--
	Ported from upstream's `templates/blocks/components/SelectorOption/SelectorOptionBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Selector, SelectorOption } from '@astryx-svelte/core';

	const descriptions: Record<string, string> = {
		admin: 'Full access to all resources',
		editor: 'Can edit and publish content',
		viewer: 'Read-only access'
	};

	const roles = [
		{ value: 'admin', label: 'Admin' },
		{ value: 'editor', label: 'Editor' },
		{ value: 'viewer', label: 'Viewer' }
	];

	/**
	 * Upstream reads `option.label` and indexes `descriptions` inline. Both are
	 * `string | undefined` under this repo's `exactOptionalPropertyTypes`, which
	 * forbids passing an explicit `undefined` to an optional prop — so the two
	 * reads are made total, exactly as `SelectorOptionShowcase` does. Every role
	 * above carries a label and a description, so nothing about the rendered
	 * example moves.
	 */
	function labelFor(option: { value: string; label?: string }): string {
		return option.label ?? option.value;
	}

	function descriptionFor(value: string): string {
		return descriptions[value] ?? '';
	}

	let value = $state<string | undefined>('editor');
</script>

<Selector
	style="width: 300px"
	label="Role"
	options={roles}
	{value}
	onChange={(next: string) => (value = next)}
	placeholder="Assign a role..."
>
	{#snippet renderOption(option)}
		<SelectorOption label={labelFor(option)} description={descriptionFor(option.value)} />
	{/snippet}
</Selector>
