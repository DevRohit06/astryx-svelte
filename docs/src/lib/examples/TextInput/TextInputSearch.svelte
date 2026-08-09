<!--
	Ported from upstream's `templates/blocks/components/TextInput/TextInputSearch.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, Stack, TextInput } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `MagnifyingGlassIcon`; the registry's `search` is
	 * the same glyph, so this is a true match rather than a stand-in and nothing
	 * retires with the icon registry.
	 */

	let query = $state('');
	let filter = $state('design systems');
</script>

{#snippet searchIcon()}<Icon icon="search" size="sm" color="secondary" />{/snippet}

<div style="width: 300px">
	<Stack direction="vertical" gap={3}>
		<TextInput
			label="Search field"
			value={query}
			onChange={(next) => (query = next)}
			placeholder="Search projects…"
			startIcon={searchIcon}
			hasClear
		/>
		<TextInput
			label="Search field with value"
			value={filter}
			onChange={(next) => (filter = next)}
			placeholder="Filter…"
			startIcon={searchIcon}
			hasClear
		/>
	</Stack>
</div>
