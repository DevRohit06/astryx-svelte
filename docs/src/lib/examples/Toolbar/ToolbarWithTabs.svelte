<!--
	Ported from upstream's `templates/blocks/components/Toolbar/ToolbarWithTabs.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Card, Icon, Section, Tab, TabList, Toolbar } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `PlusIcon`; the registry ships no plus glyph, so
	 * this substitutes a built-in — the same gap the `TabList` demo's
	 * `WithActions` story records. Retires with the icon registry (TODO.md).
	 */

	// Upstream hoists this to a `CSSProperties` const; the Svelte counterpart is a
	// style string, so it is written inline on the element.
	let tab = $state('overview');
</script>

{#snippet plusIcon()}<Icon icon="check" />{/snippet}

<Card style="width: 100%; max-width: 500px; height: 100%; margin-top: 200px">
	<Toolbar label="Section navigation" dividers={['bottom']}>
		{#snippet startContent()}
			<TabList value={tab} onChange={(next) => (tab = next)}>
				<Tab value="overview" label="Overview" />
				<Tab value="analytics" label="Analytics" />
				<Tab value="settings" label="Settings" />
			</TabList>
		{/snippet}
		{#snippet endContent()}
			<Button label="New item" icon={plusIcon} isIconOnly />
		{/snippet}
	</Toolbar>
	<Section />
</Card>
