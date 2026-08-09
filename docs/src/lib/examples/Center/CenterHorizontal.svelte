<!--
	Ported from upstream's `templates/blocks/components/Center/CenterHorizontal.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Heading, Icon, IconButton, Stack } from '@astryx-svelte/core';
	import type { IconName } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `Bold`/`Italic`/`Underline`/`ListBullet`/
	 * `Link`/`Photo`; the registry ships none of the six, so this substitutes
	 * built-ins — the same substitution the demo routes make, retiring with the
	 * icon registry (TODO.md).
	 */
	const tools: { label: string; icon: IconName }[] = [
		{ label: 'Bold', icon: 'check' },
		{ label: 'Italic', icon: 'checkDouble' },
		{ label: 'Underline', icon: 'arrowDown' },
		{ label: 'List', icon: 'menu' },
		{ label: 'Link', icon: 'externalLink' },
		{ label: 'Image', icon: 'viewColumns' }
	];
</script>

<Card width={520} padding={2}>
	<Stack direction="horizontal" vAlign="center">
		<Heading level={2}>Untitled Document</Heading>
		<Stack direction="horizontal" gap={0} hAlign="end" style="flex: 1">
			{#each tools as tool (tool.label)}
				<IconButton label={tool.label} variant="ghost" size="sm">
					{#snippet icon()}<Icon icon={tool.icon} />{/snippet}
				</IconButton>
			{/each}
		</Stack>
	</Stack>
</Card>
