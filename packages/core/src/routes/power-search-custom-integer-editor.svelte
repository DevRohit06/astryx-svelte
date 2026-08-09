<script lang="ts">
	import { HStack } from '$lib/index.js';
	import type { PowerSearchEditorProps } from '$lib/index.js';

	/**
	 * Upstream's `CustomIntegerEditor`, declared inside
	 * `PowerSearch.stories.tsx`'s "Custom Components Map" section — a sibling
	 * module for the same reason `power-search-status-token.svelte` is one.
	 *
	 * It deliberately renders no Apply button: the range input saves on every
	 * change, so only Cancel is offered. That is upstream's design, and it is also
	 * what makes the story a real test of the `Editor` override path — the default
	 * `PowerSearchEditPopover` is not rendered at all.
	 */

	const {
		config: _config,
		filter,
		mode: _mode,
		onSave,
		onCancel,
		saveButtonLabel: _saveButtonLabel,
		isReadOnly
	}: PowerSearchEditorProps = $props();

	const current = $derived(filter.value?.type === 'integer' ? filter.value.value : 50);
</script>

<div style="padding: 16px">
	<p style="margin: 0 0 12px; font-size: 13px">Custom range editor for integer fields:</p>
	<HStack gap={2} vAlign="center">
		<input
			type="range"
			min={0}
			max={1000}
			value={current}
			oninput={(e) => {
				if (filter.operator == null) {
					return;
				}
				onSave({
					field: filter.field,
					operator: filter.operator,
					value: { type: 'integer', value: Number(e.currentTarget.value) }
				});
			}}
			style="flex: 1"
			disabled={isReadOnly}
		/>
		<span style="font-size: 12px; white-space: nowrap">{current}</span>
	</HStack>
	<div style="margin-top: 12px; display: flex; gap: 8px; justify-content: flex-end">
		<button onclick={onCancel}>Cancel</button>
	</div>
</div>
