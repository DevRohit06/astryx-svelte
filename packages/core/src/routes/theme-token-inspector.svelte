<script lang="ts">
	import Badge from '$lib/components/badge/badge.svelte';
	import Card from '$lib/components/card/card.svelte';
	import Heading from '$lib/components/heading/heading.svelte';
	import VStack from '$lib/components/stack/vstack.svelte';
	import HStack from '$lib/components/stack/hstack.svelte';
	import { useTheme } from '$lib/theme/use-theme.svelte.js';

	/**
	 * Upstream's `TokenInspector` from `Theme.stories.tsx`, transcribed: the raw
	 * values `useTheme()` hands back, next to the theme name and effective mode.
	 */
	const inspectedTokens = [
		'--color-accent',
		'--color-success',
		'--color-warning',
		'--color-error',
		'--color-text-primary',
		'--color-text-secondary',
		'--color-background-surface',
		'--color-border',
		'--spacing-4',
		'--radius-element'
	];

	const theme = useTheme();
</script>

<Card>
	<VStack gap={2}>
		<HStack gap={2} vAlign="center">
			<Heading level={4}>Token Inspector</Heading>
			<Badge label={theme.name} />
			<Badge variant={theme.mode === 'dark' ? 'neutral' : 'info'} label={theme.mode} />
		</HStack>
		<div class="token-grid">
			{#each inspectedTokens as tokenName (tokenName)}
				<span class="token-name" style="color: {theme.token('--color-text-secondary')}"
					>{tokenName}</span
				>
				<span class="token-value">
					{#if tokenName.startsWith('--color-')}
						<span
							class="token-chip"
							style="background-color: {theme.token(tokenName)}; border: 1px solid {theme.token(
								'--color-border-emphasized'
							)}"
						></span>
					{/if}
					<code>{theme.token(tokenName)}</code>
				</span>
			{/each}
		</div>
	</VStack>
</Card>

<style>
	.token-grid {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 4px 16px;
		font-family: monospace;
		font-size: 12px;
	}

	.token-value {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.token-chip {
		display: inline-block;
		width: 14px;
		height: 14px;
		border-radius: 3px;
	}
</style>
