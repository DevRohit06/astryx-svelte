<!--
	Ported from upstream's `assets/templates/pages/dashboard-portfolio/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Two upstream dependencies have no Svelte counterpart, and both are handled
	the way this repo already handles them elsewhere.

	1. Icons. Upstream imports Heroicons; the registry substitutions are
	   `ArrowUpIcon` → `arrowUp` and `ArrowDownIcon` → `arrowDown`, which are
	   both true matches rather than stand-ins. Retires with the icon registry.

	2. Charts. Upstream draws with `recharts`, a React-only library — there is
	   no Svelte build of it, and adding one is not something a scaffolded
	   template may assume. The three chart components are therefore drawn as
	   inline SVG, driven by upstream's own recharts props so the mapping stays
	   auditable:

	     `<ResponsiveContainer height={340}>`  → a `bind:clientWidth` wrapper
	     `<AreaChart margin={…}>`              → `portfolioPlot`, below
	     `<CartesianGrid horizontal>`          → one `<line>` per Y tick
	     `<XAxis domain ticks tickFormatter>`  → `portfolioX` + `<text>` labels
	     `<YAxis domain ticks tickFormatter>`  → `portfolioY` + `<text>` labels
	     `<Tooltip content={<ChartTooltip/>}>` → pointer tracking + `chartTooltip`
	     `<Area fill="url(#…)" stroke …>`      → `<path>` + `<polyline>`
	     `<LineChart height={40|24}>` (sparks) → a `preserveAspectRatio="none"`
	                                             viewBox with
	                                             `vector-effect="non-scaling-stroke"`,
	                                             so the sparklines need no
	                                             per-instance measurement

	   Every colour, domain, tick, stroke width, margin and height below is
	   upstream's literal value. Upstream passes tick styling as
	   `tick={{fontSize, fill}}`; here it lands as an inline `style` on the
	   `<text>`, which is where a CSS `var()` actually resolves.

	`ChartTooltip`, `PortfolioChart`, `Sparkline`, `MarketCard`,
	`TrendSparkline`, `ColoredValue`, `MetricCard` and `AssetRow` are local
	sub-components upstream; here they are snippets.
-->
<script lang="ts">
	import {
		Avatar,
		Badge,
		Button,
		Card,
		Divider,
		DropdownMenu,
		Grid,
		GridSpan,
		HStack,
		Heading,
		Icon,
		Layout,
		LayoutContent,
		Link,
		List,
		ListItem,
		Table,
		Text,
		VStack,
		proportional,
		type TableColumn
	} from '@astryx-svelte/core';

	// ============= DATA =============

	// Portfolio value over ~12 months (Oct 2024 → Oct 2025), one data point per day.
	// Realistic fluctuations: dips in Feb–Mar, recovery in summer, climb into fall.
	const portfolioData = (() => {
		const anchors: Array<[number, number]> = [
			[0, 230000],
			[14, 238000],
			[28, 245000],
			[42, 250000],
			[56, 245000],
			[70, 258000],
			[84, 252000],
			[98, 260000],
			[112, 255000],
			[126, 245000],
			[140, 222000],
			[154, 218000],
			[168, 225000],
			[182, 232000],
			[196, 225000],
			[210, 235000],
			[224, 240000],
			[238, 245000],
			[252, 235000],
			[266, 248000],
			[280, 255000],
			[294, 260000],
			[308, 268000],
			[322, 275000],
			[336, 278000],
			[350, 285000],
			[364, 288000],
			[378, 290000],
			[392, 292000],
			[406, 294200]
		];
		const totalDays = anchors[anchors.length - 1][0];
		const monthPerDay = 12 / totalDays;
		const out: Array<{ month: number; label: string; value: number }> = [];
		let ai = 0;
		for (let day = 0; day <= totalDays; day++) {
			while (ai < anchors.length - 2 && day >= anchors[ai + 1][0]) {
				ai++;
			}
			const [d0, v0] = anchors[ai];
			const [d1, v1] = anchors[ai + 1];
			const t = (day - d0) / (d1 - d0);
			const base = v0 + (v1 - v0) * t;
			const seed = Math.sin(day * 12.9898 + 78.233) * 43758.5453;
			const noise = (seed - Math.floor(seed) - 0.5) * 3600;
			out.push({
				month: day * monthPerDay,
				label: `Day ${day + 1}`,
				value: Math.round(base + noise)
			});
		}
		return out;
	})();

	const xAxisTicks = [0, 3, 6, 9, 12];
	const xAxisLabels: Record<number, string> = {
		0: 'Oct',
		3: 'Jan',
		6: 'Apr',
		9: 'Jul',
		12: 'Oct'
	};

	// KPI summary metrics
	const metrics = [
		{ value: '$294,200', change: '+14.8%', label: 'Total value' },
		{ value: '14.8%', change: '+2.1%', label: 'Annual return' },
		{ value: '2.8%', change: '$2,060/qtr', label: 'Dividend yield' },
		{ value: '23', change: '+4 YTD', label: 'Total asset holdings' }
	];

	// Top holdings
	const topAssets = [
		{ ticker: 'AAPL', name: 'Apple Inc.', value: '$87,200', change: '+18.4%' },
		{ ticker: 'MSFT', name: 'Microsoft Corp.', value: '$72,500', change: '+14.7%' },
		{ ticker: 'NVDA', name: 'NVIDIA Corp.', value: '$63,800', change: '+31.2%' },
		{
			ticker: 'VTI',
			name: 'Vanguard Total Stock',
			value: '$58,400',
			change: '+11.3%'
		},
		{
			ticker: 'BND',
			name: 'Vanguard Total Bond',
			value: '$45,600',
			change: '+4.2%'
		}
	];

	// 96 points per series = one tick every 15 minutes across a 24h window.
	// Deterministic LCG so the sparklines are stable across renders.
	function genSpark(
		seed: number,
		start: number,
		end: number,
		volatility: number,
		N: number = 96
	): number[] {
		let s = seed >>> 0;
		const rand = () => {
			s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
			return s / 0x100000000;
		};
		const points: number[] = [];
		let drift = 0;
		for (let i = 0; i < N; i++) {
			const t = i / (N - 1);
			const trend = start + (end - start) * t;
			// Multiple overlaid waves at different frequencies for session-like rhythm
			// plus high-frequency chop.
			const wave =
				Math.sin(t * Math.PI * 2.3 + seed * 0.13) * volatility * 1.4 +
				Math.sin(t * Math.PI * 5.7 + seed * 0.41) * volatility * 0.9 +
				Math.sin(t * Math.PI * 13.1 + seed * 0.07) * volatility * 0.5;
			// Loosely-correlated random walk so adjacent ticks jitter rather than glide.
			drift = drift * 0.55 + (rand() - 0.5) * volatility * 2.2;
			// Occasional sharper spike to mimic news-driven moves.
			const spike = rand() < 0.04 ? (rand() - 0.5) * volatility * 4 : 0;
			points.push(trend + wave + drift + spike);
		}
		return points;
	}

	// Market index cards — 24h sparkline data (every 15min, 96 points)
	const marketIndices = [
		{
			name: 'Dow Jones',
			ticker: 'DJI',
			price: '43,821.67',
			change: '+0.42%',
			positive: true,
			spark: genSpark(1337, 78, 84, 3.2)
		},
		{
			name: 'NASDAQ',
			ticker: 'IXIC',
			price: '18,942.18',
			change: '-0.50%',
			positive: false,
			spark: genSpark(2042, 86, 78, 3.8)
		},
		{
			name: 'S&P 500',
			ticker: 'SPX',
			price: '5,918.33',
			change: '+0.21%',
			positive: true,
			spark: genSpark(3155, 71, 75, 2.8)
		},
		{
			name: 'NYSE Composite',
			ticker: 'NYA',
			price: '19,752.41',
			change: '-0.20%',
			positive: false,
			spark: genSpark(4287, 70, 65, 3.0)
		},
		{
			name: 'NVIDIA Corp.',
			ticker: 'NVDA',
			price: '$177.39',
			change: '+0.93%',
			positive: true,
			spark: genSpark(5519, 60, 67, 3.6)
		},
		{
			name: 'Intel Corp.',
			ticker: 'INTC',
			price: '$50.38',
			change: '+4.89%',
			positive: true,
			spark: genSpark(6701, 40, 51, 2.6)
		},
		{
			name: 'Nokia Corp.',
			ticker: 'NOK',
			price: '$8.82',
			change: '+6.65%',
			positive: true,
			spark: genSpark(7823, 30, 41, 2.4)
		},
		{
			name: 'Tesla, Inc.',
			ticker: 'TSLA',
			price: '$360.59',
			change: '-5.42%',
			positive: false,
			spark: genSpark(8945, 90, 76, 4.2)
		}
	];

	// Trending stocks table data
	interface StockRow extends Record<string, unknown> {
		id: string;
		ticker: string;
		price: string;
		dailyPts: number;
		dailyPct: number;
		weekChg: number;
		spark: number[];
	}

	const trendingStocks: StockRow[] = [
		{
			id: '1',
			ticker: 'AAPL',
			price: '$188.72',
			dailyPts: 1.35,
			dailyPct: 0.72,
			weekChg: 22.4,
			spark: genSpark(11023, 60, 70, 2.6, 48)
		},
		{
			id: '2',
			ticker: 'MSFT',
			price: '$415.6',
			dailyPts: 3.2,
			dailyPct: 0.78,
			weekChg: 18.6,
			spark: genSpark(12591, 55, 65, 2.4, 48)
		},
		{
			id: '3',
			ticker: 'NVDA',
			price: '$177.39',
			dailyPts: 1.65,
			dailyPct: 0.93,
			weekChg: 45.2,
			spark: genSpark(13744, 40, 68, 3.8, 48)
		},
		{
			id: '4',
			ticker: 'AMZN',
			price: '$186.5',
			dailyPts: -0.8,
			dailyPct: -0.43,
			weekChg: 15.3,
			spark: genSpark(14882, 70, 63, 2.5, 48)
		},
		{
			id: '5',
			ticker: 'GOOGL',
			price: '$155.72',
			dailyPts: 2.1,
			dailyPct: 1.37,
			weekChg: 12.8,
			spark: genSpark(15967, 50, 60, 2.7, 48)
		},
		{
			id: '6',
			ticker: 'META',
			price: '$505.3',
			dailyPts: 4.5,
			dailyPct: 0.9,
			weekChg: 35.1,
			spark: genSpark(17105, 45, 61, 3.0, 48)
		},
		{
			id: '7',
			ticker: 'TSLA',
			price: '$360.59',
			dailyPts: -20.67,
			dailyPct: -5.42,
			weekChg: -8.3,
			spark: genSpark(18249, 90, 64, 4.4, 48)
		},
		{
			id: '8',
			ticker: 'INTC',
			price: '$50.38',
			dailyPts: 2.35,
			dailyPct: 4.89,
			weekChg: -12.5,
			spark: genSpark(19388, 65, 57, 2.8, 48)
		},
		{
			id: '9',
			ticker: 'AMD',
			price: '$162.45',
			dailyPts: -1.2,
			dailyPct: -0.73,
			weekChg: 28.7,
			spark: genSpark(20471, 50, 63, 2.9, 48)
		},
		{
			id: '10',
			ticker: 'NFLX',
			price: '$628.9',
			dailyPts: 5.4,
			dailyPct: 0.87,
			weekChg: 42.1,
			spark: genSpark(21556, 42, 58, 2.6, 48)
		}
	];

	// ============= CHART GEOMETRY =============
	// The stand-in for recharts. See the header comment.

	const GREEN = 'var(--color-data-categorical-green, #22c55e)';
	const SPARK_GREEN = 'var(--color-data-categorical-green, #0B991F)';
	const SPARK_RED = 'var(--color-data-categorical-red, #E5484D)';
	const BORDER = 'var(--color-border, rgba(5, 54, 89, 0.1))';
	const TICK_STYLE =
		'font-size: var(--font-size-sm, 12px); fill: var(--color-text-secondary, #4E606F);';

	function scale(value: number, d0: number, d1: number, r0: number, r1: number): number {
		return d1 === d0 ? (r0 + r1) / 2 : r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
	}

	// `<ResponsiveContainer width="100%" height={340}>` + `margin` + `YAxis width={50}`.
	// 30 is recharts' default XAxis height, the band its tick labels occupy.
	const PORTFOLIO_HEIGHT = 340;
	const PORTFOLIO_MARGIN = { top: 10, right: 10, left: 0, bottom: 5 };
	const PORTFOLIO_Y_AXIS_WIDTH = 50;
	const PORTFOLIO_X_AXIS_HEIGHT = 30;
	const portfolioYTicks = [200000, 240000, 280000, 320000];

	let portfolioWidth = $state(0);
	let portfolioHoverIndex: number | null = $state(null);

	const portfolioPlot = $derived({
		left: PORTFOLIO_MARGIN.left + PORTFOLIO_Y_AXIS_WIDTH,
		right: portfolioWidth - PORTFOLIO_MARGIN.right,
		top: PORTFOLIO_MARGIN.top,
		bottom: PORTFOLIO_HEIGHT - PORTFOLIO_MARGIN.bottom - PORTFOLIO_X_AXIS_HEIGHT
	});

	const portfolioX = (month: number) =>
		scale(month, 0, 12, portfolioPlot.left, portfolioPlot.right);
	const portfolioY = (value: number) =>
		scale(value, 200000, 320000, portfolioPlot.bottom, portfolioPlot.top);

	const portfolioLinePoints = $derived(
		portfolioData.map((d) => `${portfolioX(d.month)},${portfolioY(d.value)}`).join(' ')
	);
	const portfolioAreaPath = $derived(
		`M${portfolioX(portfolioData[0].month)},${portfolioPlot.bottom}` +
			portfolioData.map((d) => `L${portfolioX(d.month)},${portfolioY(d.value)}`).join('') +
			`L${portfolioX(portfolioData[portfolioData.length - 1].month)},${portfolioPlot.bottom}Z`
	);
	const portfolioHoverPoint = $derived(
		portfolioHoverIndex === null ? null : portfolioData[portfolioHoverIndex]
	);

	function onPortfolioMove(event: PointerEvent) {
		const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const month = scale(
			event.clientX - bounds.left,
			portfolioPlot.left,
			portfolioPlot.right,
			0,
			12
		);
		const index = Math.round((month / 12) * (portfolioData.length - 1));
		portfolioHoverIndex = Math.max(0, Math.min(portfolioData.length - 1, index));
	}

	// `<LineChart>` sparkline: `<YAxis hide domain={['dataMin', 'dataMax']} />`,
	// `margin={{top: 2, right: 0, left: 0, bottom: 2}}`. Rendered into a viewBox
	// whose X unit is the point index, so no measurement is needed.
	function sparkPoints(data: number[], height: number): string {
		const min = Math.min(...data);
		const max = Math.max(...data);
		return data.map((v, i) => `${i},${scale(v, min, max, height - 2, 2)}`).join(' ');
	}

	const currency = (value: number) =>
		value.toLocaleString('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		});

	// ============= MAIN COMPONENT STATE =============

	let timeRange = $state('1 year');

	const trendingColumns = $derived.by<TableColumn<StockRow>[]>(() => [
		{
			key: 'ticker',
			header: 'Ticker',
			width: proportional(1),
			renderCell: tickerCell
		},
		{ key: 'price', header: 'Price', width: proportional(1) },
		{
			key: 'dailyPts',
			header: 'Daily Chg (pts)',
			width: proportional(1),
			renderCell: dailyPtsCell
		},
		{
			key: 'dailyPct',
			header: 'Daily Chg (%)',
			width: proportional(1),
			renderCell: dailyPctCell
		},
		{
			key: 'weekChg',
			header: '52W Chg (%)',
			width: proportional(1),
			renderCell: weekChgCell
		},
		{
			key: 'spark',
			header: '24h Trend',
			width: proportional(1),
			renderCell: sparkCell
		}
	]);
</script>

<!-- ============= CHART COMPONENTS ============= -->

{#snippet chartTooltip(value: number)}
	<Card padding={3}>
		<Text type="supporting">{currency(value)}</Text>
	</Card>
{/snippet}

{#snippet portfolioChart()}
	<!-- `role="presentation"` because the wrapper is pure layout: the `<svg>` is
	     `aria-hidden` (recharts' surface is no more accessible) and the tooltip is
	     a pointer-only affordance. -->
	<div
		class="chart"
		role="presentation"
		style="height: {PORTFOLIO_HEIGHT}px;"
		bind:clientWidth={portfolioWidth}
		onpointermove={onPortfolioMove}
		onpointerleave={() => (portfolioHoverIndex = null)}
	>
		{#if portfolioWidth > 0}
			<svg width={portfolioWidth} height={PORTFOLIO_HEIGHT} aria-hidden="true">
				<defs>
					<linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stop-color={GREEN} stop-opacity="0.3" />
						<stop offset="95%" stop-color={GREEN} stop-opacity="0.05" />
					</linearGradient>
				</defs>
				{#each portfolioYTicks as tick (tick)}
					<line
						x1={portfolioPlot.left}
						x2={portfolioPlot.right}
						y1={portfolioY(tick)}
						y2={portfolioY(tick)}
						stroke={BORDER}
					/>
				{/each}
				<path d={portfolioAreaPath} fill="url(#portfolioGradient)" />
				<polyline points={portfolioLinePoints} fill="none" stroke={GREEN} stroke-width="1.5" />
				{#each xAxisTicks as tick (tick)}
					<text
						x={portfolioX(tick)}
						y={portfolioPlot.bottom + 20}
						text-anchor="middle"
						style={TICK_STYLE}>{xAxisLabels[tick] ?? ''}</text
					>
				{/each}
				{#each portfolioYTicks as tick (tick)}
					<text
						x={portfolioPlot.left - 8}
						y={portfolioY(tick) + 4}
						text-anchor="end"
						style={TICK_STYLE}>{`$${(tick / 1000).toFixed(0)}k`}</text
					>
				{/each}
				{#if portfolioHoverPoint}
					<line
						x1={portfolioX(portfolioHoverPoint.month)}
						x2={portfolioX(portfolioHoverPoint.month)}
						y1={portfolioPlot.top}
						y2={portfolioPlot.bottom}
						stroke={BORDER}
					/>
				{/if}
			</svg>
		{/if}
		{#if portfolioHoverPoint}
			<div
				class="chart-tooltip"
				style="left: {portfolioX(portfolioHoverPoint.month)}px; top: {portfolioY(
					portfolioHoverPoint.value
				)}px;"
			>
				{@render chartTooltip(portfolioHoverPoint.value)}
			</div>
		{/if}
	</div>
{/snippet}

<!-- ============= CARD COMPONENTS ============= -->

{#snippet sparkline(data: number[], positive: boolean)}
	<svg
		width="100%"
		height="40"
		viewBox="0 0 {data.length - 1} 40"
		preserveAspectRatio="none"
		aria-hidden="true"
	>
		<polyline
			points={sparkPoints(data, 40)}
			fill="none"
			stroke={positive ? SPARK_GREEN : SPARK_RED}
			stroke-width="1.5"
			vector-effect="non-scaling-stroke"
		/>
	</svg>
{/snippet}

{#snippet marketCard(index: (typeof marketIndices)[number])}
	<Card>
		<VStack gap={4}>
			<VStack gap={0}>
				<Heading level={3}>{index.name}</Heading>
				<Text type="supporting" color="secondary">{index.ticker}</Text>
			</VStack>
			{@render sparkline(index.spark, index.positive)}
			<HStack gap={3} vAlign="center">
				<Text type="display-3" weight="bold">{index.price}</Text>
				<HStack gap={1} vAlign="center">
					<Icon
						icon={index.positive ? 'arrowUp' : 'arrowDown'}
						size="xsm"
						color={index.positive ? 'success' : 'error'}
					/>
					<Text type="body" color="secondary">{index.change}</Text>
				</HStack>
			</HStack>
		</VStack>
	</Card>
{/snippet}

{#snippet trendSparkline(data: number[], positive: boolean)}
	<svg
		width="100%"
		height="24"
		viewBox="0 0 {data.length - 1} 24"
		preserveAspectRatio="none"
		aria-hidden="true"
	>
		<polyline
			points={sparkPoints(data, 24)}
			fill="none"
			stroke={positive ? SPARK_GREEN : SPARK_RED}
			stroke-width="1"
			vector-effect="non-scaling-stroke"
		/>
	</svg>
{/snippet}

{#snippet coloredValue(value: string, isPositive: boolean)}
	<Badge label={value} variant={isPositive ? 'green' : 'red'} />
{/snippet}

{#snippet tickerCell(row: StockRow)}
	<Text type="body" weight="bold">{row.ticker}</Text>
{/snippet}

{#snippet dailyPtsCell(row: StockRow)}
	{@render coloredValue(
		(row.dailyPts >= 0 ? '+' : '') + row.dailyPts.toFixed(2),
		row.dailyPts >= 0
	)}
{/snippet}

{#snippet dailyPctCell(row: StockRow)}
	{@render coloredValue(
		(row.dailyPct >= 0 ? '+' : '') + row.dailyPct.toFixed(2) + '%',
		row.dailyPct >= 0
	)}
{/snippet}

{#snippet weekChgCell(row: StockRow)}
	{@render coloredValue(
		(row.weekChg >= 0 ? '+' : '') + row.weekChg.toFixed(1) + '%',
		row.weekChg >= 0
	)}
{/snippet}

{#snippet sparkCell(row: StockRow)}
	{@render trendSparkline(row.spark, row.dailyPct >= 0)}
{/snippet}

{#snippet metricCard(metric: (typeof metrics)[number])}
	{@const positive = !metric.change.startsWith('-')}
	<Card>
		<VStack gap={1}>
			<HStack gap={3} vAlign="center">
				<Text type="display-3" weight="bold">{metric.value}</Text>
				<HStack gap={1} vAlign="center">
					<Icon
						icon={positive ? 'arrowUp' : 'arrowDown'}
						size="xsm"
						color={positive ? 'success' : 'error'}
					/>
					<Text type="body" color="secondary">{metric.change}</Text>
				</HStack>
			</HStack>
			<Text type="body" color="secondary">{metric.label}</Text>
		</VStack>
	</Card>
{/snippet}

{#snippet assetRow(asset: (typeof topAssets)[number])}
	{#snippet assetLabel()}
		<Text weight="bold">{asset.ticker}</Text>
	{/snippet}
	{#snippet assetStart()}
		<Avatar name={asset.ticker} size="md" />
	{/snippet}
	{#snippet assetEnd()}
		<VStack gap={0} hAlign="end">
			<Text type="body">{asset.value}</Text>
			<Badge label={asset.change} variant={asset.change.startsWith('-') ? 'red' : 'green'} />
		</VStack>
	{/snippet}
	<ListItem
		label={assetLabel}
		description={asset.name}
		href="#"
		startContent={assetStart}
		endContent={assetEnd}
	/>
{/snippet}

<!-- ============= SIDENAV ============= -->

<!-- ============= MAIN COMPONENT ============= -->

{#snippet content()}
	<LayoutContent padding={6}>
		<VStack gap={6}>
			<!-- Page header -->
			<HStack hAlign="between" vAlign="center">
				<Heading level={1}>My Portfolio</Heading>
				<DropdownMenu
					button={{
						label: timeRange,
						variant: 'secondary',
						size: 'lg'
					}}
					hasChevron
					items={[
						{ label: '1 month', onClick: () => (timeRange = '1 month') },
						{ label: '3 months', onClick: () => (timeRange = '3 months') },
						{ label: '6 months', onClick: () => (timeRange = '6 months') },
						{ label: '1 year', onClick: () => (timeRange = '1 year') },
						{ label: '5 years', onClick: () => (timeRange = '5 years') },
						{ label: 'All time', onClick: () => (timeRange = 'All time') }
					]}
				/>
			</HStack>

			<!-- KPI metric cards -->
			<Grid columns={{ minWidth: 280, repeat: 'fit' }} gap={4}>
				{#each Array.from({ length: Math.ceil(metrics.length / 2) }, (_, i) => i) as i (i)}
					<Grid columns={{ minWidth: 280, repeat: 'fit' }} gap={4}>
						{#each metrics.slice(i * 2, i * 2 + 2) as m (m.label)}
							{@render metricCard(m)}
						{/each}
					</Grid>
				{/each}
			</Grid>

			<!-- Chart + Top assets -->
			<Grid columns={{ minWidth: 280, max: 4 }} gap={4}>
				<GridSpan columns={3}>
					<Card>
						<VStack gap={4}>
							<HStack hAlign="between" vAlign="center">
								<Heading level={3}>Portfolio Value</Heading>
								<Link href="#">View details</Link>
							</HStack>
							{@render portfolioChart()}
						</VStack>
					</Card>
				</GridSpan>
				<GridSpan columns={1}>
					<Card>
						<VStack gap={4}>
							<HStack hAlign="between" vAlign="center">
								<Heading level={3}>Top Assets</Heading>
								<Link href="#">View all</Link>
							</HStack>
							<List density="spacious">
								{#each topAssets as asset (asset.ticker)}
									{@render assetRow(asset)}
								{/each}
							</List>
						</VStack>
					</Card>
				</GridSpan>
			</Grid>

			<Divider />

			<!-- Market section -->
			<HStack hAlign="between" vAlign="start">
				<VStack gap={1}>
					<Heading level={1}>Market Today</Heading>
					<Text type="body" color="secondary">Past 24 hours</Text>
				</VStack>
				<Button label="View more" variant="secondary" size="lg" />
			</HStack>

			<!-- Market index cards -->
			<Grid columns={{ minWidth: 320, repeat: 'fit' }} gap={4}>
				{#each marketIndices as m (m.ticker)}
					{@render marketCard(m)}
				{/each}
			</Grid>

			<!-- Trending stocks table -->
			<Card>
				<VStack gap={4}>
					<Heading level={3}>Trending Stocks</Heading>
					<Table
						data={trendingStocks}
						columns={trendingColumns}
						idKey="id"
						hasHover
						dividers="rows"
					/>
				</VStack>
			</Card>
		</VStack>
	</LayoutContent>
{/snippet}

<Layout height="fill" {content} />

<style>
	.chart {
		position: relative;
		width: 100%;
	}

	.chart-tooltip {
		position: absolute;
		pointer-events: none;
		transform: translate(12px, -50%);
		z-index: 1;
	}
</style>
