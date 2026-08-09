<!--
	Ported from upstream's `templates/blocks/components/Toolbar/ToolbarThreeSlot.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Card, Heading, Icon, Section, Toolbar } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `ArrowLeftIcon`; the registry ships
	 * `chevronLeft`, so this is a near-direct swap. Retires with the icon
	 * registry (TODO.md).
	 */
</script>

<Card style="width: 600px; height: 100%; margin-top: 260px">
	<Toolbar label="Document toolbar" dividers={['bottom']}>
		{#snippet startContent()}
			<Button label="Back" variant="ghost" isIconOnly>
				{#snippet icon()}<Icon icon="chevronLeft" />{/snippet}
			</Button>
		{/snippet}
		{#snippet centerContent()}
			<Heading level={4}>Title</Heading>
		{/snippet}
		{#snippet endContent()}
			<Button label="Discard" variant="secondary" />
			<Button label="Save" variant="primary" />
		{/snippet}
	</Toolbar>
	<Section />
</Card>
