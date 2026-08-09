<script lang="ts">
	import { useTheme } from '$lib/theme/use-theme.svelte.js';

	/**
	 * Upstream's `ThemeAwareBarChart` from `Theme.stories.tsx`, transcribed.
	 *
	 * The point of the story: an SVG chart needs *concrete* values — a `fill` of
	 * `var(--color-accent)` works, but a canvas or a charting library needs the
	 * hex — and `useTheme().token()` resolves them for the active mode without a
	 * `getComputedStyle` read or a second render.
	 */
	interface Props {
		data: { label: string; value: number }[];
		width?: number;
		height?: number;
	}

	const { data, width = 400, height = 200 }: Props = $props();

	const theme = useTheme();

	const maxValue = $derived(Math.max(...data.map((d) => d.value)));
	const barWidth = $derived((width - 60) / data.length - 8);
	const chartHeight = $derived(height - 40);
</script>

<svg {width} {height} role="img" aria-label="Bar chart">
	<!-- Grid lines -->
	{#each [0.25, 0.5, 0.75, 1] as pct (pct)}
		{@const y = chartHeight - chartHeight * pct + 20}
		<g>
			<line
				x1={50}
				y1={y}
				x2={width - 10}
				y2={y}
				stroke={theme.token('--color-border')}
				stroke-dasharray="4 4"
			/>
			<text
				x={45}
				y={y + 4}
				text-anchor="end"
				font-size={10}
				fill={theme.token('--color-text-secondary')}
			>
				{Math.round(maxValue * pct)}
			</text>
		</g>
	{/each}

	<!-- Bars -->
	{#each data as d, i (d.label)}
		{@const barHeight = (d.value / maxValue) * chartHeight}
		{@const x = 55 + i * (barWidth + 8)}
		{@const y = chartHeight - barHeight + 20}
		<g>
			<rect
				{x}
				{y}
				width={barWidth}
				height={barHeight}
				rx={3}
				fill={theme.token('--color-accent')}
			/>
			<text
				x={x + barWidth / 2}
				y={height - 5}
				text-anchor="middle"
				font-size={11}
				fill={theme.token('--color-text-secondary')}
			>
				{d.label}
			</text>
		</g>
	{/each}
</svg>
