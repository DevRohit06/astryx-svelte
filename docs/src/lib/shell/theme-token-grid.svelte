<script lang="ts" module>
	import type { DefinedTheme } from '@astryx-svelte/core/theme';

	/** The declared value for one mode: `[light, dark]` picks a side, a bare string is both. */
	export function tokenValue(theme: DefinedTheme, name: string, mode: 'light' | 'dark'): string {
		const declared = theme.tokens?.[name];
		if (declared == null) return '';
		if (Array.isArray(declared)) return String(declared[mode === 'dark' ? 1 : 0] ?? '');
		return String(declared);
	}

	/**
	 * Which family a token belongs to, for the group headings.
	 *
	 * Order is core's own vocabulary order in `tokens.stylex.ts`, and the fallback
	 * bucket is deliberate rather than a guess: a theme may declare a token whose
	 * prefix is not in this list, and dropping it silently would understate what
	 * the theme does.
	 */
	const GROUPS: Array<{ label: string; prefix: string }> = [
		{ label: 'Color', prefix: '--color-' },
		{ label: 'Radius', prefix: '--radius-' },
		{ label: 'Shadow', prefix: '--shadow-' },
		{ label: 'Spacing', prefix: '--spacing-' },
		{ label: 'Size', prefix: '--size-' },
		{ label: 'Border', prefix: '--border-' },
		{ label: 'Duration', prefix: '--duration-' },
		{ label: 'Easing', prefix: '--easing-' },
		{ label: 'Type', prefix: '--font-' },
		{ label: 'Type scale', prefix: '--text-' },
		{ label: 'Line height', prefix: '--line-height-' }
	];

	const OTHER = 'Other';
</script>

<script lang="ts">
	import { Code, Heading, Text, VStack } from '@astryx-svelte/core';

	/**
	 * Every token one theme package **declares**, grouped by family.
	 *
	 * Not the resolved value a component ends up with — the declaration itself,
	 * read straight off the `DefinedTheme`. That distinction is the point of the
	 * panel: `/docs/tokens` already lists core's 184-name vocabulary with its
	 * defaults, and what a *theme* is, is the subset of those names it overrides.
	 * Neutral declares 90 of them and Liquid Glass 106, and seeing which is the
	 * only way to tell how far a theme reaches.
	 *
	 * `shell/token-table.svelte` is the other direction and stays separate: it
	 * renders upstream's authored rows with a live `useTheme().token()` column.
	 * Reusing it here would print core's Light/Dark defaults in two columns beside
	 * a theme's value, which reads as though the theme declared all three.
	 */
	interface Props {
		theme: DefinedTheme;
		/** Which side of a `[light, dark]` pair to show. */
		mode: 'light' | 'dark';
	}

	const { theme, mode }: Props = $props();

	const grouped = $derived.by(() => {
		const names = Object.keys(theme.tokens ?? {}).sort();
		return [...GROUPS.map((group) => group.label), OTHER]
			.map((label) => {
				const prefix = GROUPS.find((group) => group.label === label)?.prefix;
				const members = names.filter((name) =>
					prefix ? name.startsWith(prefix) : !GROUPS.some((group) => name.startsWith(group.prefix))
				);
				return { label, members };
			})
			.filter((group) => group.members.length > 0);
	});

	/** Colour tokens get a swatch; everything else shows the literal it declares. */
	const isColor = (name: string) => name.startsWith('--color-') || name.startsWith('--shadow-');
</script>

<VStack gap={6}>
	{#each grouped as group (group.label)}
		<VStack gap={2}>
			<Heading level={3}>{group.label}</Heading>
			<ul class="token-grid">
				{#each group.members as name (name)}
					{@const value = tokenValue(theme, name, mode)}
					<li class="token">
						{#if isColor(name)}
							<span
								class="swatch"
								class:shadow={name.startsWith('--shadow-')}
								style={name.startsWith('--shadow-')
									? `box-shadow: ${value}`
									: `background: ${value}`}
							></span>
						{/if}
						<span class="token-text">
							<Code>{name}</Code>
							<Text type="supporting" color="secondary">{value}</Text>
						</span>
					</li>
				{/each}
			</ul>
		</VStack>
	{/each}
</VStack>

<style>
	.token-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: var(--spacing-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.token {
		display: flex;
		gap: var(--spacing-2);
		align-items: center;
		min-width: 0;
		padding: var(--spacing-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-container);
	}

	.swatch {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		/* A checkerboard behind the swatch: several themes declare alpha colours
		   (`#00000014`, Liquid Glass's `#ffffffb8`), which are indistinguishable
		   from the card behind them on a flat ground. */
		background-image:
			linear-gradient(45deg, var(--color-background-muted) 25%, transparent 25%),
			linear-gradient(-45deg, var(--color-background-muted) 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, var(--color-background-muted) 75%),
			linear-gradient(-45deg, transparent 75%, var(--color-background-muted) 75%);
		background-position:
			0 0,
			0 4px,
			4px -4px,
			-4px 0;
		background-size: 8px 8px;
		border: 1px solid var(--color-border-emphasized);
		border-radius: var(--radius-sm, 4px);
	}

	.swatch.shadow {
		background: var(--color-background-surface);
		background-image: none;
		border-color: transparent;
	}

	.token-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		/* Token names and hex values are single unbroken words with nothing to
		   break at, so a narrow column overflows the card without this. */
		overflow-wrap: anywhere;
	}
</style>
