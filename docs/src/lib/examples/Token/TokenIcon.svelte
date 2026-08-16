<!--
	Ported from upstream's `templates/blocks/components/Token/TokenIcon.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, Stack, Text, Token } from '@astryx-svelte/core';
	import type { IconName } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `User`/`Star`/`Tag`/`ShieldCheck`; the registry
	 * ships none of the four, so this substitutes built-ins — the same
	 * substitution the demo routes make, retiring with the icon registry
	 * (port/todo.md).
	 */
	const tokens: { label: string; color: 'blue' | 'yellow' | 'purple' | 'green'; icon: IconName }[] =
		[
			{ label: 'Sarah Chen', color: 'blue', icon: 'info' },
			{ label: 'Featured', color: 'yellow', icon: 'check' },
			{ label: 'Design', color: 'purple', icon: 'funnel' },
			{ label: 'Verified', color: 'green', icon: 'checkDouble' }
		];
</script>

<Stack direction="vertical" gap={4}>
	<Text type="supporting" color="secondary">Icons identify the token category</Text>
	<Stack direction="horizontal" gap={2} wrap="wrap">
		{#each tokens as entry (entry.label)}
			<Token label={entry.label} color={entry.color}>
				{#snippet icon()}<Icon icon={entry.icon} size="sm" color="inherit" />{/snippet}
			</Token>
		{/each}
	</Stack>
</Stack>
