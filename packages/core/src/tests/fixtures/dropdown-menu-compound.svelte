<script lang="ts" module>
	export type CompoundScenario =
		| 'items'
		| 'endContent'
		| 'disabled'
		| 'divider'
		| 'menuDivider'
		| 'mixed'
		| 'destructive'
		| 'defaultVariant';
</script>

<script lang="ts">
	import DropdownMenu from '$lib/components/dropdown-menu/dropdown-menu.svelte';
	import DropdownMenuItem from '$lib/components/dropdown-menu/dropdown-menu-item.svelte';
	import DropdownMenuDivider from '$lib/components/dropdown-menu/dropdown-menu-divider.svelte';
	import Divider from '$lib/components/divider/divider.svelte';

	/**
	 * Compound-mode `DropdownMenu` for the cases upstream writes as JSX children.
	 * React can pass `<DropdownMenuItem …/>` (and `<Divider/>`, an `endContent`
	 * element, a conditional child) inline; a Svelte `children` snippet can only be
	 * authored in a template, so the scenarios live here, selected by `scenario`.
	 *
	 * `editClick`/`deleteClick` are the test's `vi.fn()`s, threaded onto the items
	 * so the click assertions can observe them.
	 */
	interface Props {
		scenario: CompoundScenario;
		editClick?: () => void;
		deleteClick?: () => void;
		isDisabled?: boolean;
		showConditional?: boolean;
	}
	const {
		scenario,
		editClick = () => {},
		deleteClick = () => {},
		isDisabled = false,
		showConditional = true
	}: Props = $props();
</script>

{#snippet badge()}<span data-testid="badge">3</span>{/snippet}

<DropdownMenu button={{ label: 'Actions' }}>
	{#if scenario === 'items'}
		<DropdownMenuItem label="Edit" onClick={editClick} />
		<DropdownMenuItem label="Delete" onClick={deleteClick} />
	{:else if scenario === 'endContent'}
		<DropdownMenuItem label="Notifications" endContent={badge} />
	{:else if scenario === 'disabled'}
		<DropdownMenuItem label="Edit" onClick={editClick} {isDisabled} />
	{:else if scenario === 'divider'}
		<DropdownMenuItem label="Edit" onClick={editClick} />
		<Divider />
		<DropdownMenuItem label="Delete" onClick={deleteClick} />
	{:else if scenario === 'menuDivider'}
		<DropdownMenuItem label="Edit" />
		<DropdownMenuDivider />
		<DropdownMenuItem label="Delete" />
	{:else if scenario === 'mixed'}
		<DropdownMenuItem label="Always" onClick={() => {}} />
		{#if showConditional}
			<DropdownMenuItem label="Conditional" onClick={() => {}} />
		{/if}
	{:else if scenario === 'destructive'}
		<DropdownMenuItem label="Delete" variant="destructive" onClick={() => {}} />
		<DropdownMenuItem label="Edit" onClick={() => {}} />
	{:else if scenario === 'defaultVariant'}
		<DropdownMenuItem label="Edit" onClick={() => {}} />
	{/if}
</DropdownMenu>
