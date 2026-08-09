<script lang="ts">
	import { useTheme } from '$lib/theme/use-theme.svelte.js';

	/**
	 * Upstream's `ThemeAwareGroupedChart` from `Theme.stories.tsx`, transcribed.
	 * Three series, three colour tokens, and a legend built from the same values.
	 */
	interface Props {
		data: { label: string; series: number[] }[];
		width?: number;
		height?: number;
	}

	const { data, width = 480, height = 220 }: Props = $props();

	const theme = useTheme();

	const seriesColors = $derived([
		theme.token('--color-accent'),
		theme.token('--color-success'),
		theme.token('--color-warning')
	]);
	const seriesLabels = ['Revenue', 'Users', 'Sessions'];

	const maxValue = $derived(Math.max(...data.flatMap((d) => d.series)));
	const groupWidth = $derived((width - 80) / data.length);
	const barWidth = $derived((groupWidth - 16) / 3);
	const chartHeight = $derived(height - 50);
</script>

<div>
	<svg {width} {height} role="img" aria-label="Grouped bar chart">
		<!-- Grid lines -->
		{#each [0.25, 0.5, 0.75, 1] as pct (pct)}
			{@const y = chartHeight - chartHeight * pct + 20}
			<line
				x1={55}
				y1={y}
				x2={width - 10}
				y2={y}
				stroke={theme.token('--color-border')}
				stroke-dasharray="4 4"
			/>
		{/each}

		<!-- Grouped bars -->
		{#each data as group, gi (group.label)}
			{@const groupX = 60 + gi * groupWidth}
			<g>
				{#each group.series as value, si (si)}
					{@const barHeight = (value / maxValue) * chartHeight}
					<rect
						x={groupX + si * (barWidth + 2)}
						y={chartHeight - barHeight + 20}
						width={barWidth}
						height={barHeight}
						rx={2}
						fill={seriesColors[si]}
						opacity={0.85}
					/>
				{/each}
				<text
					x={groupX + (groupWidth - 16) / 2}
					y={height - 26}
					text-anchor="middle"
					font-size={11}
					fill={theme.token('--color-text-secondary')}
				>
					{group.label}
				</text>
			</g>
		{/each}
	</svg>

	<!-- Legend -->
	<div style="display: flex; gap: 16px; padding-left: 55px">
		{#each seriesLabels as label, i (label)}
			<div style="display: flex; align-items: center; gap: 6px">
				<div
					style="width: 10px; height: 10px; border-radius: 2px; opacity: 0.85; background-color: {seriesColors[
						i
					]}"
				></div>
				<span style="font-size: 11px; color: {theme.token('--color-text-secondary')}">{label}</span>
			</div>
		{/each}
	</div>
</div>
