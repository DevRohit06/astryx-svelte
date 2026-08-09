<!--
	Ported from upstream's `templates/blocks/components/Toolbar/ToolbarCardHeader.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Card, Heading, Icon, Section, Toolbar } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `Funnel` and `Plus`. `funnel` is a direct swap;
	 * the registry has no plus, so *Add user* substitutes a built-in. Retires with
	 * the icon registry (TODO.md).
	 */
</script>

<Card style="width: 500px; height: 100%; margin-top: 260px">
	<Toolbar label="User list actions" size="sm" dividers={['bottom']}>
		{#snippet startContent()}
			<Heading level={4}>Card title</Heading>
		{/snippet}
		{#snippet endContent()}
			<Button label="Filter" variant="ghost" isIconOnly>
				{#snippet icon()}<Icon icon="funnel" />{/snippet}
			</Button>
			<Button label="Add user" isIconOnly>
				{#snippet icon()}<Icon icon="check" />{/snippet}
			</Button>
		{/snippet}
	</Toolbar>
	<Section />
</Card>
