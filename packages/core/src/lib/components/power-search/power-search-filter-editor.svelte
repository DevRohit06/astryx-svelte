<script lang="ts">
	import PowerSearchEditPopover from './power-search-edit-popover.svelte';
	import type { PowerSearchEditorProps } from './types.js';
	import { useInternalConfig } from './use-internal-config.svelte.js';

	/**
	 * Ported from Astryx's `PowerSearchFilterEditor.tsx`.
	 *
	 * The full editing experience — field selector, operator selector, value
	 * editor and save/cancel — published so consumers can use it as a base when
	 * providing a `components[type].Editor` override.
	 *
	 * ## It is not what `PowerSearch` renders, either
	 *
	 * Upstream's docstring says this is "the built-in implementation used by
	 * PowerSearch". As with `PowerSearchToken`, it is not: `PowerSearch` calls
	 * `PowerSearchEditPopover` directly, so this wrapper is exported and reachable
	 * from nothing inside the library. The one thing it adds over calling the
	 * popover yourself is the `PowerSearchConfig` → `InternalConfig` wrap, which
	 * is what makes it usable as an `Editor` override (the override contract
	 * passes the public config).
	 *
	 * **`timezoneID` is on `PowerSearchEditorProps` and is not forwarded**, which
	 * is upstream's own omission — `PowerSearchEditPopover` has no such prop to
	 * forward it to.
	 *
	 * `{#key filter.field}` is upstream's `key={filter.field}`: changing the field
	 * remounts the popover, discarding the operator and value it had seeded.
	 *
	 * **No `<script module>` block**, for the reason `PowerSearchToken` states:
	 * upstream declares no props type of its own here either, and
	 * `PowerSearchEditorProps` already reaches the barrel from `types.ts`.
	 */

	const {
		config: configProp,
		filter,
		mode,
		onSave,
		onCancel,
		saveButtonLabel,
		isReadOnly
	}: PowerSearchEditorProps = $props();

	const config = useInternalConfig(() => configProp);
</script>

{#key filter.field}
	<PowerSearchEditPopover
		{config}
		{filter}
		{mode}
		{onSave}
		{onCancel}
		{saveButtonLabel}
		{isReadOnly}
	/>
{/key}
