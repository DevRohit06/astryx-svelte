<script lang="ts" module>
	export type SelectableScenario =
		'checkbox' | 'radioGroup' | 'radioItemWithoutGroup' | 'radioCloseOnSelect';
</script>

<script lang="ts">
	import DropdownMenu from '$lib/components/dropdown-menu/dropdown-menu.svelte';
	import DropdownMenuCheckboxItem from '$lib/components/dropdown-menu/dropdown-menu-checkbox-item.svelte';
	import DropdownMenuRadioGroup from '$lib/components/dropdown-menu/dropdown-menu-radio-group.svelte';
	import DropdownMenuRadioItem from '$lib/components/dropdown-menu/dropdown-menu-radio-item.svelte';

	/**
	 * Compound-mode `DropdownMenu` holding the selectable items. Upstream writes
	 * these as JSX children; a Svelte `children` snippet can only be authored in a
	 * template, so the scenarios live here — the arrangement
	 * `dropdown-menu-compound.svelte` already uses.
	 */
	interface Props {
		scenario: SelectableScenario;
		/** Checkbox scenario. */
		value?: boolean;
		onChange?: (checked: boolean) => void;
		isDisabled?: boolean;
		hasCloseOnSelect?: boolean;
		/** Radio scenario. */
		radioValue?: string;
		onRadioChange?: (value: string) => void;
	}
	const {
		scenario,
		value = false,
		onChange = () => {},
		isDisabled = false,
		hasCloseOnSelect,
		radioValue = 'newest',
		onRadioChange = () => {}
	}: Props = $props();
</script>

{#if scenario === 'checkbox'}
	<DropdownMenu button={{ label: 'View' }}>
		<DropdownMenuCheckboxItem
			label="Show archived"
			{value}
			{onChange}
			{isDisabled}
			hasCloseOnSelect={hasCloseOnSelect ?? false}
		/>
	</DropdownMenu>
{:else if scenario === 'radioGroup' || scenario === 'radioCloseOnSelect'}
	<DropdownMenu button={{ label: 'Sort' }}>
		<DropdownMenuRadioGroup
			value={radioValue}
			onChange={onRadioChange}
			label="Sort by"
			hasCloseOnSelect={hasCloseOnSelect ?? true}
		>
			<DropdownMenuRadioItem value="newest" label="Newest" />
			<DropdownMenuRadioItem value="oldest" label="Oldest" />
		</DropdownMenuRadioGroup>
	</DropdownMenu>
{:else if scenario === 'radioItemWithoutGroup'}
	<DropdownMenu button={{ label: 'Sort' }}>
		<DropdownMenuRadioItem value="x" label="X" />
	</DropdownMenu>
{/if}
