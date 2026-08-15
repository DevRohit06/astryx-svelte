<!--
	Ported from upstream's `templates/blocks/components/DropdownMenu/DropdownMenuWithSubmenu.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		DropdownMenu,
		DropdownMenuItem,
		DropdownMenuSubMenu,
		Text,
		VStack
	} from '@astryx-svelte/core';

	/**
	 * Upstream's block passes `icon="pencil"`, `icon="folder"` and `icon="trash"`.
	 * **None of those three is an icon name** — upstream's own `IconName` union is
	 * the same 26 entries as this port's, and none of them is in it. Its
	 * `DropdownMenuItem.icon` is typed `ReactNode | IconType`, so a bare string
	 * slips through as a `ReactNode`; `renderIconSlot` then casts it back to
	 * `IconName` and `getIcon` returns `undefined`, rendering an **empty icon
	 * slot**. The props are inert upstream.
	 *
	 * This port types `icon` as `Snippet | IconName`, which rejects them at
	 * compile time. They are DROPPED rather than substituted: picking some other
	 * registry icon would be demo content upstream does not have. Recorded under
	 * "Known debts" in port/debts.md.
	 */
	let lastAction = $state<string | null>(null);
</script>

<VStack gap={3}>
	<DropdownMenu button={{ label: 'Actions' }}>
		<DropdownMenuItem label="Rename" onClick={() => (lastAction = 'Rename')} />
		<DropdownMenuSubMenu label="Move to">
			<DropdownMenuItem label="Projects" onClick={() => (lastAction = 'Move to Projects')} />
			<DropdownMenuItem label="Archive" onClick={() => (lastAction = 'Move to Archive')} />
			<DropdownMenuItem label="Trash" onClick={() => (lastAction = 'Move to Trash')} />
		</DropdownMenuSubMenu>
		<DropdownMenuItem label="Delete" onClick={() => (lastAction = 'Delete')} />
	</DropdownMenu>
	{#if lastAction}
		<Text type="supporting" color="secondary">Last action: {lastAction}</Text>
	{/if}
</VStack>
