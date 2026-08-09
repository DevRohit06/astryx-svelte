<!--
	Ported from upstream's `assets/templates/pages/dashboard/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Two upstream dependencies have no Svelte counterpart, and both are handled
	the way this repo already handles them elsewhere.

	1. Icons. Upstream imports Heroicons. `ArrowUpIcon` → `arrowUp` and
	   `ArrowDownIcon` → `arrowDown` are true matches; the solid `StopIcon` →
	   `stop` is too (the registry's `stop` is a filled rounded square, the same
	   glyph the legend swatches want). `ArrowPathIcon` → `arrowsUpDown` is a
	   registry stand-in, the same one `ChatMessageMetadataFooter` makes.
	   Retires with the icon registry.

	2. Charts. Upstream draws with `recharts`, a React-only library — there is
	   no Svelte build of it, and adding one is not something a scaffolded
	   template may assume. The charts are therefore drawn inline, driven by
	   upstream's own recharts props so the mapping stays auditable:

	     `<ResponsiveContainer height={300}>`  → a `bind:clientWidth` wrapper
	     `<LineChart margin={…}>`              → `activePlot`, below
	     `<CartesianGrid horizontal>`          → one `<line>` per Y tick
	     `<XAxis domain ticks tickFormatter>`  → `activeX` + `<text>` labels
	     `<YAxis domain ticks>`                → `activeY` + `<text>` labels
	     `<Tooltip content={<ChartTooltip/>}>` → pointer tracking + `chartTooltip`
	     `<Line dataKey … strokeWidth={2}>`    → one `<polyline>` per series
	     `<LineChart height={40}>` (sparkline) → a `preserveAspectRatio="none"`
	                                             viewBox with
	                                             `vector-effect="non-scaling-stroke"`,
	                                             so it needs no measurement
	     `<BarChart layout="vertical">`        → a flex row of segments, which
	                                             reproduces `stackId` + the
	                                             per-end `radius` without the
	                                             non-uniform scaling an SVG
	                                             stand-in would need

	   Every colour, domain, tick, stroke width, margin and height below is
	   upstream's literal value — including `XAxis domain={[0, 23]}` against
	   data whose `hour` runs 0–95 and ticks at 32/64/95. That mismatch is
	   upstream's, and it is reproduced rather than fixed: the same scale draws
	   the line off the right edge (the `<svg>` clips it) and puts three of the
	   four tick labels out of view. Upstream passes tick styling as
	   `tick={{fontSize, fill}}`; here it lands as an inline `style` on the
	   `<text>`, which is where a CSS `var()` actually resolves.

	`ChartLegendItem`, `ChartTooltip`, `ActiveUsersChart`, `Sparkline`,
	`MetricCard`, `StackedBarCard` and `TableCard` are local sub-components
	upstream; here they are snippets. `TableCard` is generic upstream
	(`<T extends {id: string}>`); a snippet takes no type parameters, so it
	takes the two row types as a union.
-->
<script lang="ts">
	import {
		Button,
		Card,
		Divider,
		Grid,
		HStack,
		Heading,
		Icon,
		Layout,
		LayoutContent,
		Link,
		ProgressBar,
		Table,
		Text,
		VStack,
		pixel,
		proportional,
		type TableColumn
	} from '@astryx-svelte/core';

	// ============= DATA =============

	// Active users chart data (96 points over 24h at 15-min intervals: Apr 1 14:00 → Apr 2 14:00)
	// Each point has an index (0–95) for even spacing, plus a label for display
	const activeUsersData = [
		// Apr 1 14:00 — mid-afternoon, strong work hours
		{ hour: 0, label: 'Apr 1 14:00', allUsers: 116, desktop: 79, mobile: 37 },
		{ hour: 1, label: 'Apr 1 14:15', allUsers: 118, desktop: 80, mobile: 38 },
		{ hour: 2, label: 'Apr 1 14:30', allUsers: 117, desktop: 79, mobile: 38 },
		{ hour: 3, label: 'Apr 1 14:45', allUsers: 119, desktop: 81, mobile: 38 },
		// Apr 1 15:00 — afternoon lull
		{ hour: 4, label: 'Apr 1 15:00', allUsers: 116, desktop: 79, mobile: 37 },
		{ hour: 5, label: 'Apr 1 15:15', allUsers: 113, desktop: 76, mobile: 37 },
		{ hour: 6, label: 'Apr 1 15:30', allUsers: 109, desktop: 72, mobile: 37 },
		{ hour: 7, label: 'Apr 1 15:45', allUsers: 111, desktop: 74, mobile: 37 },
		// Apr 1 16:00 — late afternoon, some leaving early
		{ hour: 8, label: 'Apr 1 16:00', allUsers: 110, desktop: 72, mobile: 38 },
		{ hour: 9, label: 'Apr 1 16:15', allUsers: 107, desktop: 69, mobile: 38 },
		{ hour: 10, label: 'Apr 1 16:30', allUsers: 104, desktop: 66, mobile: 38 },
		{ hour: 11, label: 'Apr 1 16:45', allUsers: 101, desktop: 62, mobile: 39 },
		// Apr 1 17:00 — 5PM exodus, desktop drops fast, mobile bumps
		{ hour: 12, label: 'Apr 1 17:00', allUsers: 100, desktop: 57, mobile: 43 },
		{ hour: 13, label: 'Apr 1 17:15', allUsers: 99, desktop: 54, mobile: 45 },
		{ hour: 14, label: 'Apr 1 17:30', allUsers: 97, desktop: 50, mobile: 47 },
		{ hour: 15, label: 'Apr 1 17:45', allUsers: 95, desktop: 46, mobile: 49 },
		// Apr 1 18:00 — commute, mobile overtakes desktop
		{ hour: 16, label: 'Apr 1 18:00', allUsers: 93, desktop: 41, mobile: 52 },
		{ hour: 17, label: 'Apr 1 18:15', allUsers: 91, desktop: 39, mobile: 52 },
		{ hour: 18, label: 'Apr 1 18:30', allUsers: 89, desktop: 37, mobile: 52 },
		{ hour: 19, label: 'Apr 1 18:45', allUsers: 87, desktop: 36, mobile: 51 },
		// Apr 1 19:00 — dinner, decline slowing
		{ hour: 20, label: 'Apr 1 19:00', allUsers: 85, desktop: 34, mobile: 51 },
		{ hour: 21, label: 'Apr 1 19:15', allUsers: 83, desktop: 32, mobile: 51 },
		{ hour: 22, label: 'Apr 1 19:30', allUsers: 80, desktop: 30, mobile: 50 },
		{ hour: 23, label: 'Apr 1 19:45', allUsers: 77, desktop: 28, mobile: 49 },
		// Apr 1 20:00 — couch browsing, mobile plateau
		{ hour: 24, label: 'Apr 1 20:00', allUsers: 75, desktop: 26, mobile: 49 },
		{ hour: 25, label: 'Apr 1 20:15', allUsers: 76, desktop: 26, mobile: 50 },
		{ hour: 26, label: 'Apr 1 20:30', allUsers: 76, desktop: 27, mobile: 49 },
		{ hour: 27, label: 'Apr 1 20:45', allUsers: 75, desktop: 27, mobile: 48 },
		// Apr 1 21:00 — winding down, mobile dropping off
		{ hour: 28, label: 'Apr 1 21:00', allUsers: 73, desktop: 27, mobile: 46 },
		{ hour: 29, label: 'Apr 1 21:15', allUsers: 71, desktop: 27, mobile: 44 },
		{ hour: 30, label: 'Apr 1 21:30', allUsers: 69, desktop: 27, mobile: 42 },
		{ hour: 31, label: 'Apr 1 21:45', allUsers: 67, desktop: 28, mobile: 39 },
		// Apr 1 22:00 — bedtime wave, mobile drops, desktop holds
		{ hour: 32, label: 'Apr 1 22:00', allUsers: 65, desktop: 29, mobile: 36 },
		{ hour: 33, label: 'Apr 1 22:15', allUsers: 63, desktop: 29, mobile: 34 },
		{ hour: 34, label: 'Apr 1 22:30', allUsers: 61, desktop: 30, mobile: 31 },
		{ hour: 35, label: 'Apr 1 22:45', allUsers: 60, desktop: 31, mobile: 29 },
		// Apr 1 23:00 — desktop overtakes as local users sleep, other TZs active
		{ hour: 36, label: 'Apr 1 23:00', allUsers: 59, desktop: 33, mobile: 26 },
		{ hour: 37, label: 'Apr 1 23:15', allUsers: 58, desktop: 34, mobile: 24 },
		{ hour: 38, label: 'Apr 1 23:30', allUsers: 57, desktop: 35, mobile: 22 },
		{ hour: 39, label: 'Apr 1 23:45', allUsers: 56, desktop: 36, mobile: 20 },
		// Apr 2 00:00 — EMEA morning starts, desktop dominant
		{ hour: 40, label: 'Apr 2 00:00', allUsers: 56, desktop: 38, mobile: 18 },
		{ hour: 41, label: 'Apr 2 00:15', allUsers: 56, desktop: 39, mobile: 17 },
		{ hour: 42, label: 'Apr 2 00:30', allUsers: 57, desktop: 40, mobile: 17 },
		{ hour: 43, label: 'Apr 2 00:45', allUsers: 56, desktop: 40, mobile: 16 },
		// Apr 2 01:00 — EMEA working, plateau
		{ hour: 44, label: 'Apr 2 01:00', allUsers: 56, desktop: 41, mobile: 15 },
		{ hour: 45, label: 'Apr 2 01:15', allUsers: 55, desktop: 41, mobile: 14 },
		{ hour: 46, label: 'Apr 2 01:30', allUsers: 55, desktop: 41, mobile: 14 },
		{ hour: 47, label: 'Apr 2 01:45', allUsers: 54, desktop: 40, mobile: 14 },
		// Apr 2 02:00 — EMEA mid-morning, holding steady
		{ hour: 48, label: 'Apr 2 02:00', allUsers: 54, desktop: 40, mobile: 14 },
		{ hour: 49, label: 'Apr 2 02:15', allUsers: 53, desktop: 39, mobile: 14 },
		{ hour: 50, label: 'Apr 2 02:30', allUsers: 53, desktop: 39, mobile: 14 },
		{ hour: 51, label: 'Apr 2 02:45', allUsers: 52, desktop: 38, mobile: 14 },
		// Apr 2 03:00 — EMEA lunch gap, slight dip
		{ hour: 52, label: 'Apr 2 03:00', allUsers: 51, desktop: 37, mobile: 14 },
		{ hour: 53, label: 'Apr 2 03:15', allUsers: 50, desktop: 36, mobile: 14 },
		{ hour: 54, label: 'Apr 2 03:30', allUsers: 49, desktop: 35, mobile: 14 },
		{ hour: 55, label: 'Apr 2 03:45', allUsers: 49, desktop: 35, mobile: 14 },
		// Apr 2 04:00 — EMEA afternoon, floor
		{ hour: 56, label: 'Apr 2 04:00', allUsers: 48, desktop: 34, mobile: 14 },
		{ hour: 57, label: 'Apr 2 04:15', allUsers: 48, desktop: 33, mobile: 15 },
		{ hour: 58, label: 'Apr 2 04:30', allUsers: 49, desktop: 33, mobile: 16 },
		{ hour: 59, label: 'Apr 2 04:45', allUsers: 49, desktop: 32, mobile: 17 },
		// Apr 2 05:00 — early risers checking phones, mobile climbing
		{ hour: 60, label: 'Apr 2 05:00', allUsers: 50, desktop: 31, mobile: 19 },
		{ hour: 61, label: 'Apr 2 05:15', allUsers: 51, desktop: 30, mobile: 21 },
		{ hour: 62, label: 'Apr 2 05:30', allUsers: 52, desktop: 29, mobile: 23 },
		{ hour: 63, label: 'Apr 2 05:45', allUsers: 54, desktop: 28, mobile: 26 },
		// Apr 2 06:00 — alarms going off, mobile surging
		{ hour: 64, label: 'Apr 2 06:00', allUsers: 56, desktop: 27, mobile: 29 },
		{ hour: 65, label: 'Apr 2 06:15', allUsers: 58, desktop: 26, mobile: 32 },
		{ hour: 66, label: 'Apr 2 06:30', allUsers: 61, desktop: 26, mobile: 35 },
		{ hour: 67, label: 'Apr 2 06:45', allUsers: 64, desktop: 27, mobile: 37 },
		// Apr 2 07:00 — commute, mobile peaks, desktop starting
		{ hour: 68, label: 'Apr 2 07:00', allUsers: 67, desktop: 28, mobile: 39 },
		{ hour: 69, label: 'Apr 2 07:15', allUsers: 70, desktop: 30, mobile: 40 },
		{ hour: 70, label: 'Apr 2 07:30', allUsers: 73, desktop: 33, mobile: 40 },
		{ hour: 71, label: 'Apr 2 07:45', allUsers: 76, desktop: 37, mobile: 39 },
		// Apr 2 08:00 — arriving at desks, desktop ramping
		{ hour: 72, label: 'Apr 2 08:00', allUsers: 80, desktop: 43, mobile: 37 },
		{ hour: 73, label: 'Apr 2 08:15', allUsers: 85, desktop: 49, mobile: 36 },
		{ hour: 74, label: 'Apr 2 08:30', allUsers: 90, desktop: 55, mobile: 35 },
		{ hour: 75, label: 'Apr 2 08:45', allUsers: 95, desktop: 61, mobile: 34 },
		// Apr 2 09:00 — work day, desktop dominant
		{ hour: 76, label: 'Apr 2 09:00', allUsers: 99, desktop: 66, mobile: 33 },
		{ hour: 77, label: 'Apr 2 09:15', allUsers: 102, desktop: 69, mobile: 33 },
		{ hour: 78, label: 'Apr 2 09:30', allUsers: 104, desktop: 72, mobile: 32 },
		{ hour: 79, label: 'Apr 2 09:45', allUsers: 104, desktop: 72, mobile: 32 },
		// Apr 2 10:00 — coffee break stall, then climbing
		{ hour: 80, label: 'Apr 2 10:00', allUsers: 106, desktop: 74, mobile: 32 },
		{ hour: 81, label: 'Apr 2 10:15', allUsers: 109, desktop: 76, mobile: 33 },
		{ hour: 82, label: 'Apr 2 10:30', allUsers: 112, desktop: 78, mobile: 34 },
		{ hour: 83, label: 'Apr 2 10:45', allUsers: 114, desktop: 80, mobile: 34 },
		// Apr 2 11:00 — approaching peak
		{ hour: 84, label: 'Apr 2 11:00', allUsers: 116, desktop: 81, mobile: 35 },
		{ hour: 85, label: 'Apr 2 11:15', allUsers: 117, desktop: 81, mobile: 36 },
		{ hour: 86, label: 'Apr 2 11:30', allUsers: 119, desktop: 83, mobile: 36 },
		{ hour: 87, label: 'Apr 2 11:45', allUsers: 119, desktop: 82, mobile: 37 },
		// Apr 2 12:00 — lunch dip, mobile ticks up
		{ hour: 88, label: 'Apr 2 12:00', allUsers: 120, desktop: 83, mobile: 37 },
		{ hour: 89, label: 'Apr 2 12:15', allUsers: 115, desktop: 78, mobile: 37 },
		{ hour: 90, label: 'Apr 2 12:30', allUsers: 111, desktop: 74, mobile: 37 },
		{ hour: 91, label: 'Apr 2 12:45', allUsers: 110, desktop: 73, mobile: 37 },
		// Apr 2 13:00 — returning from lunch
		{ hour: 92, label: 'Apr 2 13:00', allUsers: 113, desktop: 76, mobile: 37 },
		{ hour: 93, label: 'Apr 2 13:15', allUsers: 116, desktop: 79, mobile: 37 },
		{ hour: 94, label: 'Apr 2 13:30', allUsers: 118, desktop: 81, mobile: 37 },
		{ hour: 95, label: 'Apr 2 14:00', allUsers: 120, desktop: 83, mobile: 37 }
	];

	// X-axis tick indices and their display labels
	const xAxisTicks = [0, 32, 64, 95];
	const xAxisLabels: Record<number, string> = {
		0: 'Apr 1 14:00',
		32: 'Apr 1 22:00',
		64: 'Apr 2 06:00',
		95: 'Apr 2 14:00'
	};

	// Metric cards
	const metrics = [
		{
			label: 'Monthly Visitors',
			value: '27.3 k',
			change: '+18.2%',
			positive: true
		},
		{
			label: 'Monthly Page Views',
			value: '48.2 k',
			change: '+12.5%',
			positive: true
		},
		{
			label: 'Avg. Session',
			value: '4.5 min',
			change: '-14.3%',
			positive: false
		},
		{
			label: 'Bounce Rate',
			value: '42.3%',
			change: '-8.7%',
			positive: false
		}
	];

	// Sparkline data for each metric card (30 days, weekends at indices 5-6, 12-13, 19-20, 26-27)
	const sparklines = [
		// Monthly Visitors: +18.2% — declining first 2 weeks, hits bottom around day 14, then sharp recovery
		// prettier-ignore
		[48, 46, 44, 42, 40, 18, 16, 38, 36, 34, 32, 30, 12, 10, 28, 26, 28, 32, 36, 14, 12, 40, 44, 48, 52, 56, 28, 24, 58, 62],
		// Monthly Page Views: +12.5% — flat/choppy first 3 weeks, then kicks up sharply in final week
		// prettier-ignore
		[36, 38, 35, 37, 36, 14, 12, 38, 36, 34, 37, 35, 12, 10, 36, 34, 36, 35, 38, 14, 12, 40, 44, 50, 54, 56, 26, 22, 58, 60],
		// Avg. Session: -14.3% — strong start, holds through week 2, then clear drop-off week 3-4
		// prettier-ignore
		[58, 56, 60, 58, 62, 30, 26, 60, 58, 62, 60, 58, 28, 24, 56, 54, 50, 46, 42, 18, 14, 38, 36, 34, 32, 30, 10, 8, 28, 26],
		// Bounce Rate: -8.7% — high and volatile first half, starts dropping around day 16, steady decline
		// prettier-ignore
		[52, 56, 50, 54, 58, 62, 60, 54, 52, 56, 50, 54, 60, 58, 50, 48, 46, 44, 40, 46, 44, 38, 36, 34, 36, 32, 38, 36, 30, 28]
	];

	// Demographics
	const regionData = [
		{
			label: 'NORAM',
			value: 38,
			color: 'var(--color-data-categorical-blue, #0171E3)'
		},
		{
			label: 'EMEA',
			value: 28,
			color: 'var(--color-data-categorical-orange, #EB6E00)'
		},
		{
			label: 'APAC',
			value: 22,
			color: 'var(--color-data-categorical-green, #0B991F)'
		},
		{
			label: 'LATAM',
			value: 8,
			color: 'var(--color-data-categorical-purple, #6B1EFD)'
		},
		{ label: 'Other', value: 4, color: 'var(--color-data-neutral, #8494A3)' }
	];

	const roleData = [
		{
			label: 'Engineer',
			value: 45,
			color: 'var(--color-data-categorical-blue, #0171E3)'
		},
		{
			label: 'Manager',
			value: 20,
			color: 'var(--color-data-categorical-orange, #EB6E00)'
		},
		{
			label: 'Designer',
			value: 15,
			color: 'var(--color-data-categorical-green, #0B991F)'
		},
		{
			label: 'Data Scientist',
			value: 12,
			color: 'var(--color-data-categorical-purple, #6B1EFD)'
		},
		{ label: 'Other', value: 8, color: 'var(--color-data-neutral, #8494A3)' }
	];

	// Engagement — Top pages
	interface PageRow extends Record<string, unknown> {
		id: string;
		page: string;
		views: number;
		newUsers: string;
		avgTime: string;
		exits: string;
	}

	const topPagesData: PageRow[] = [
		{
			id: '1',
			page: '/home',
			views: 8420,
			newUsers: '62.3%',
			avgTime: '3:42',
			exits: '18.5%'
		},
		{
			id: '2',
			page: '/products',
			views: 6150,
			newUsers: '45.1%',
			avgTime: '4:15',
			exits: '22.8%'
		},
		{
			id: '3',
			page: '/pricing',
			views: 4830,
			newUsers: '38.7%',
			avgTime: '2:58',
			exits: '35.2%'
		},
		{
			id: '4',
			page: '/blog',
			views: 3920,
			newUsers: '71.4%',
			avgTime: '5:30',
			exits: '12.1%'
		},
		{
			id: '5',
			page: '/docs',
			views: 3410,
			newUsers: '29.8%',
			avgTime: '6:12',
			exits: '8.4%'
		},
		{
			id: '6',
			page: '/about',
			views: 2980,
			newUsers: '55.6%',
			avgTime: '2:15',
			exits: '28.3%'
		},
		{
			id: '7',
			page: '/contact',
			views: 2540,
			newUsers: '48.2%',
			avgTime: '1:48',
			exits: '41.7%'
		},
		{
			id: '8',
			page: '/changelog',
			views: 2210,
			newUsers: '22.1%',
			avgTime: '4:55',
			exits: '15.6%'
		},
		{
			id: '9',
			page: '/support',
			views: 1870,
			newUsers: '59.3%',
			avgTime: '3:22',
			exits: '30.9%'
		},
		{
			id: '10',
			page: '/careers',
			views: 1520,
			newUsers: '83.1%',
			avgTime: '2:34',
			exits: '45.2%'
		}
	];

	const topPagesMaxViews = Math.max(...topPagesData.map((d) => d.views));

	const topPagesColumns = $derived.by<TableColumn<PageRow>[]>(() => [
		{ key: 'page', header: 'Page', width: pixel(160) },
		{
			key: 'views',
			header: 'Views',
			width: proportional(1),
			renderCell: pageViewsCell
		},
		{ key: 'newUsers', header: 'New Users', width: pixel(120) },
		{ key: 'avgTime', header: 'Avg. Time', width: pixel(120) }
	]);

	// Engagement — Top events
	interface EventRow extends Record<string, unknown> {
		id: string;
		event: string;
		count: number;
		users: number;
		newUsers: number;
	}

	const topEventsData: EventRow[] = [
		{ id: '1', event: 'page_view', count: 18420, users: 12300, newUsers: 4920 },
		{ id: '2', event: 'session_start', count: 14850, users: 9870, newUsers: 3950 },
		{ id: '3', event: 'first_visit', count: 8230, users: 8230, newUsers: 8230 },
		{ id: '4', event: 'user_engagement', count: 6120, users: 4510, newUsers: 1580 },
		{ id: '5', event: 'click', count: 3540, users: 2680, newUsers: 940 },
		{ id: '6', event: 'scroll', count: 2910, users: 2140, newUsers: 750 },
		{ id: '7', event: 'form_submit', count: 1870, users: 1350, newUsers: 540 },
		{ id: '8', event: 'video_play', count: 1240, users: 980, newUsers: 390 },
		{ id: '9', event: 'search', count: 960, users: 720, newUsers: 290 },
		{ id: '10', event: 'share', count: 580, users: 410, newUsers: 160 }
	];

	const topEventsMaxCount = Math.max(...topEventsData.map((d) => d.count));

	const topEventsColumns = $derived.by<TableColumn<EventRow>[]>(() => [
		{ key: 'event', header: 'Event', width: pixel(160) },
		{
			key: 'count',
			header: 'Count',
			width: proportional(1),
			renderCell: eventCountCell
		},
		{
			key: 'users',
			header: 'Users',
			width: pixel(120),
			renderCell: eventUsersCell
		},
		{
			key: 'newUsers',
			header: 'New Users',
			width: pixel(120),
			renderCell: eventNewUsersCell
		}
	]);

	// ============= CHART COMPONENTS =============

	// Chart line colors via Astryx design tokens (CSS custom properties)
	const chartColors = {
		allUsers: 'var(--color-data-categorical-blue, #0171E3)',
		desktop: 'var(--color-data-categorical-orange, #EB6E00)',
		mobile: 'var(--color-data-categorical-purple, #6B1EFD)'
	};

	// ============= CHART GEOMETRY =============
	// The stand-in for recharts. See the header comment.

	const BORDER = 'var(--color-border, rgba(5, 54, 89, 0.1))';
	const TICK_STYLE =
		'font-size: var(--font-size-sm, 12px); fill: var(--color-text-secondary, #4E606F);';

	function scale(value: number, d0: number, d1: number, r0: number, r1: number): number {
		return d1 === d0 ? (r0 + r1) / 2 : r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
	}

	// `<ResponsiveContainer width="100%" height={300}>` + `margin` + `YAxis width={30}`.
	// 30 is recharts' default XAxis height, the band its tick labels occupy.
	const ACTIVE_HEIGHT = 300;
	const ACTIVE_MARGIN = { top: 5, right: 10, left: 0, bottom: 5 };
	const ACTIVE_Y_AXIS_WIDTH = 30;
	const ACTIVE_X_AXIS_HEIGHT = 30;
	const activeYTicks = [0, 20, 40, 60, 80, 100, 120];

	const activeSeries = [
		{ dataKey: 'allUsers', name: 'All Users', color: chartColors.allUsers },
		{ dataKey: 'desktop', name: 'Desktop', color: chartColors.desktop },
		{ dataKey: 'mobile', name: 'Mobile', color: chartColors.mobile }
	] as const;

	let activeWidth = $state(0);
	let activeHoverIndex: number | null = $state(null);

	const activePlot = $derived({
		left: ACTIVE_MARGIN.left + ACTIVE_Y_AXIS_WIDTH,
		right: activeWidth - ACTIVE_MARGIN.right,
		top: ACTIVE_MARGIN.top,
		bottom: ACTIVE_HEIGHT - ACTIVE_MARGIN.bottom - ACTIVE_X_AXIS_HEIGHT
	});

	// `domain={[0, 23]}` is upstream's, against `hour` values running 0–95.
	const activeX = (hour: number) => scale(hour, 0, 23, activePlot.left, activePlot.right);
	const activeY = (value: number) => scale(value, 0, 120, activePlot.bottom, activePlot.top);

	const activeLines = $derived(
		activeSeries.map((series) => ({
			...series,
			points: activeUsersData
				.map((d) => `${activeX(d.hour)},${activeY(d[series.dataKey])}`)
				.join(' ')
		}))
	);
	const activeHoverPoint = $derived(
		activeHoverIndex === null ? null : activeUsersData[activeHoverIndex]
	);

	function onActiveMove(event: PointerEvent) {
		const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const hour = scale(event.clientX - bounds.left, activePlot.left, activePlot.right, 0, 23);
		const index = Math.round(hour);
		activeHoverIndex = Math.max(0, Math.min(activeUsersData.length - 1, index));
	}

	// `<LineChart>` sparkline: no `<YAxis>`, so recharts' default `[0, 'auto']`
	// domain applies; `margin` is recharts' default 5 on every side.
	function sparkPoints(data: number[], height: number): string {
		const max = Math.max(...data);
		return data.map((v, i) => `${i},${scale(v, 0, max, height - 5, 5)}`).join(' ');
	}
</script>

<!-- ============= CHART COMPONENTS ============= -->

{#snippet chartLegendItem(color: string, label: string)}
	<HStack gap={2} vAlign="center">
		<Icon icon="stop" size="xsm" style="color: {color};" />
		<Text type="supporting" color="secondary">{label}</Text>
	</HStack>
{/snippet}

{#snippet chartTooltip(point: (typeof activeUsersData)[number])}
	<Card padding={3}>
		<VStack gap={1}>
			<Text type="supporting" color="secondary">{point?.label ?? ''}</Text>
			{#each activeSeries as entry (entry.name)}
				<HStack gap={2} vAlign="center">
					<Icon icon="stop" size="xsm" style="color: {entry.color};" />
					<Text type="supporting">{entry.name}: {point[entry.dataKey]}</Text>
				</HStack>
			{/each}
		</VStack>
	</Card>
{/snippet}

{#snippet activeUsersChart()}
	<VStack gap={3}>
		<!-- `role="presentation"` because the wrapper is pure layout: the `<svg>` is
		     `aria-hidden` (recharts' surface is no more accessible) and the tooltip
		     is a pointer-only affordance. -->
		<div
			class="chart"
			role="presentation"
			style="height: {ACTIVE_HEIGHT}px;"
			bind:clientWidth={activeWidth}
			onpointermove={onActiveMove}
			onpointerleave={() => (activeHoverIndex = null)}
		>
			{#if activeWidth > 0}
				<svg width={activeWidth} height={ACTIVE_HEIGHT} aria-hidden="true">
					{#each activeYTicks as tick (tick)}
						<line
							x1={activePlot.left}
							x2={activePlot.right}
							y1={activeY(tick)}
							y2={activeY(tick)}
							stroke={BORDER}
						/>
					{/each}
					{#each xAxisTicks as tick (tick)}
						<text
							x={activeX(tick)}
							y={activePlot.bottom + 20}
							text-anchor="middle"
							style={TICK_STYLE}>{xAxisLabels[tick] ?? ''}</text
						>
					{/each}
					{#each activeYTicks as tick (tick)}
						<text
							x={activePlot.left - 8}
							y={activeY(tick) + 4}
							text-anchor="end"
							style={TICK_STYLE}>{tick}</text
						>
					{/each}
					{#if activeHoverPoint}
						<line
							x1={activeX(activeHoverPoint.hour)}
							x2={activeX(activeHoverPoint.hour)}
							y1={activePlot.top}
							y2={activePlot.bottom}
							stroke={BORDER}
						/>
					{/if}
					{#each activeLines as line (line.dataKey)}
						<polyline points={line.points} fill="none" stroke={line.color} stroke-width="2" />
					{/each}
				</svg>
			{/if}
			{#if activeHoverPoint}
				<div
					class="chart-tooltip"
					style="left: {activeX(activeHoverPoint.hour)}px; top: {activeY(
						activeHoverPoint.allUsers
					)}px;"
				>
					{@render chartTooltip(activeHoverPoint)}
				</div>
			{/if}
		</div>
		<HStack gap={6} vAlign="center">
			{@render chartLegendItem(chartColors.allUsers, 'All Users')}
			{@render chartLegendItem(chartColors.desktop, 'Desktop')}
			{@render chartLegendItem(chartColors.mobile, 'Mobile')}
		</HStack>
	</VStack>
{/snippet}

{#snippet sparkline(data: number[])}
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
			stroke="var(--color-data-categorical-blue, #0171E3)"
			stroke-width="1.5"
			vector-effect="non-scaling-stroke"
		/>
	</svg>
{/snippet}

<!-- ============= CARD COMPONENTS ============= -->

{#snippet metricCard(metric: (typeof metrics)[number], sparklineData: number[])}
	<Card>
		<VStack gap={2}>
			<Heading level={4}>{metric.label}</Heading>
			<HStack gap={2} vAlign="center">
				<Heading level={2}>{metric.value}</Heading>
				<HStack gap={1} vAlign="center">
					{#if metric.positive}
						<Icon icon="arrowUp" size="xsm" color="success" />
					{:else}
						<Icon icon="arrowDown" size="xsm" color="error" />
					{/if}
					<Text type="body" color="secondary">{metric.change}</Text>
				</HStack>
			</HStack>
			<Text type="supporting" color="secondary">Last 30 days vs. Previous</Text>
			{@render sparkline(sparklineData)}
		</VStack>
	</Card>
{/snippet}

{#snippet stackedBarCard(title: string, data: Array<{ label: string; value: number; color: string }>)}
	{@const total = data.reduce((sum, d) => sum + d.value, 0)}
	<Card>
		<VStack gap={4}>
			<Heading level={4}>{title}</Heading>
			<div class="stacked-bar" aria-hidden="true">
				{#each data as d, i (d.label)}
					<div
						style="flex: {d.value}; background-color: {d.color}; border-radius: {i === 0
							? '4px 0 0 4px'
							: i === data.length - 1
								? '0 4px 4px 0'
								: '0'};"
					></div>
				{/each}
			</div>
			<!-- Legend -->
			<HStack gap={4} wrap="wrap">
				{#each data as d (d.label)}
					<VStack gap={0}>
						<HStack gap={2} vAlign="center">
							<Icon icon="stop" size="xsm" style="color: {d.color};" />
							<Text type="supporting">{d.label}</Text>
						</HStack>
						<Text type="supporting" color="secondary">
							{d.value} - {((d.value / total) * 100).toFixed(2)}%
						</Text>
					</VStack>
				{/each}
			</HStack>
		</VStack>
	</Card>
{/snippet}

<!-- ============= TABLE COMPONENTS ============= -->

{#snippet pageViewsCell(item: PageRow)}
	<VStack gap={1}>
		<ProgressBar
			value={item.views}
			max={topPagesMaxViews}
			label={`${item.page} views`}
			isLabelHidden
		/>
		<Text type="supporting">{item.views.toLocaleString()} views</Text>
	</VStack>
{/snippet}

{#snippet eventCountCell(item: EventRow)}
	<VStack gap={1}>
		<ProgressBar
			value={item.count}
			max={topEventsMaxCount}
			label={`${item.count}`}
			isLabelHidden
		/>
		<Text type="supporting">{item.count.toLocaleString()}</Text>
	</VStack>
{/snippet}

{#snippet eventUsersCell(item: EventRow)}{item.users.toLocaleString()}{/snippet}

{#snippet eventNewUsersCell(item: EventRow)}{item.newUsers.toLocaleString()}{/snippet}

{#snippet tableCard(
	title: string,
	linkLabel: string,
	linkHref: string,
	data: PageRow[] | EventRow[],
	columns: TableColumn<PageRow>[] | TableColumn<EventRow>[]
)}
	<Card>
		<VStack gap={6}>
			<HStack hAlign="between" vAlign="center">
				<Heading level={4}>{title}</Heading>
				<Link href={linkHref}>{linkLabel}</Link>
			</HStack>
			<Table
				data={data as Record<string, unknown>[]}
				columns={columns as TableColumn<Record<string, unknown>>[]}
				idKey="id"
				density="compact"
				dividers="rows"
				hasHover
			/>
		</VStack>
	</Card>
{/snippet}

<!-- ============= SIDENAV ============= -->

<!-- ============= MAIN COMPONENT ============= -->

{#snippet reloadIcon()}
	<Icon icon="arrowsUpDown" size="sm" />
{/snippet}

{#snippet content()}
	<LayoutContent padding={6}>
		<VStack gap={6}>
			<!-- Active Users Chart -->
			<VStack gap={6}>
				<HStack hAlign="between" vAlign="center">
					<Heading level={3}>Active users</Heading>
					<Button label="Reload" variant="secondary" size="md" icon={reloadIcon} />
				</HStack>
				{@render activeUsersChart()}
			</VStack>

			<!-- Metric Cards -->
			<Grid columns={{ minWidth: 320, repeat: 'fit' }} gap={4}>
				{#each [0, 2] as start (start)}
					<Grid columns={{ minWidth: 240, repeat: 'fit' }} gap={4}>
						{#each metrics.slice(start, start + 2) as m, i (m.label)}
							{@render metricCard(m, sparklines[start + i])}
						{/each}
					</Grid>
				{/each}
			</Grid>

			<Divider />

			<!-- Demographics -->
			<HStack hAlign="between" vAlign="center">
				<Heading level={3}>Demographics</Heading>
				<Button label="View more" variant="secondary" size="md" />
			</HStack>
			<Grid columns={{ minWidth: 320, repeat: 'fit' }} gap={4}>
				{@render stackedBarCard('Region', regionData)}
				{@render stackedBarCard('Role', roleData)}
			</Grid>

			<Divider />

			<!-- Engagement -->
			<HStack hAlign="between" vAlign="center">
				<Heading level={3}>Engagement</Heading>
				<Button label="View more" variant="secondary" size="md" />
			</HStack>
			<Grid columns={{ minWidth: 320, repeat: 'fit' }} gap={4}>
				{@render tableCard('Top pages', 'All pages', '#', topPagesData, topPagesColumns)}
				{@render tableCard('Top events', 'All events', '#', topEventsData, topEventsColumns)}
			</Grid>
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

	/* `<BarChart layout="vertical">` with one `stackId` and a `radius` on each
	   end segment. A flex row reproduces it without an SVG's non-uniform
	   horizontal scaling. */
	.stacked-bar {
		display: flex;
		width: 100%;
		height: 24px;
	}
</style>
