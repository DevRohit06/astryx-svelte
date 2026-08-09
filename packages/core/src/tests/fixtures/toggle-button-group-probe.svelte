<script lang="ts" module>
	export interface ToggleGroupItemConfig {
		value: string;
		label: string;
	}
</script>

<script lang="ts">
	import ToggleButtonGroup from '$lib/components/toggle-button/toggle-button-group.svelte';
	import ToggleButton from '$lib/components/toggle-button/toggle-button.svelte';

	/**
	 * A `ToggleButtonGroup` around icon-only `ToggleButton` children upstream
	 * authors inline as JSX (`SingleGroup`/`MultipleGroup`). A Svelte `.ts` test
	 * cannot pass components as a children render prop inline, so the items are
	 * described by an array and the group value is held in the probe's own `$state`
	 * — controlled exactly as upstream's `useState` + `setValue`, committing each
	 * change so the DOM reflects it.
	 *
	 * `type` discriminates single vs multiple; `single`/`multiple` seed the initial
	 * value. Buttons are icon-only (`label` is the accessible name), matching
	 * upstream; the icon glyph is generic and never asserted on.
	 */
	interface Props {
		label: string;
		items: ToggleGroupItemConfig[];
		type?: 'single' | 'multiple';
		single?: string | null;
		multiple?: string[];
	}

	let { label, items, type = 'single', single = null, multiple = [] }: Props = $props();

	// svelte-ignore state_referenced_locally
	let singleValue = $state(single);
	// svelte-ignore state_referenced_locally
	let multipleValue = $state(multiple);
</script>

{#snippet icon()}<span aria-hidden="true">◆</span>{/snippet}

{#if type === 'multiple'}
	<ToggleButtonGroup
		type="multiple"
		value={multipleValue}
		onChange={(v: string[]) => (multipleValue = v)}
		{label}
	>
		{#each items as item (item.value)}
			<ToggleButton value={item.value} label={item.label} {icon} isIconOnly />
		{/each}
	</ToggleButtonGroup>
{:else}
	<ToggleButtonGroup value={singleValue} onChange={(v: string | null) => (singleValue = v)} {label}>
		{#each items as item (item.value)}
			<ToggleButton value={item.value} label={item.label} {icon} isIconOnly />
		{/each}
	</ToggleButtonGroup>
{/if}
