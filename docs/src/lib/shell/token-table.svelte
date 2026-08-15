<script lang="ts">
	import {
		Card,
		HStack,
		Table,
		Text,
		Theme,
		VStack,
		pixel,
		proportional,
		useTheme,
		type TableColumn
	} from '@astryx-svelte/core';
	import { neutralTheme } from '@astryx-svelte/theme-neutral';
	import { getColorModeContext } from './color-mode.svelte.js';
	import {
		colorRows,
		evaluateBezier,
		parseCubicBezier,
		primaryFamily,
		tokenTableKind,
		typeScaleRows,
		valueRows,
		type ColorTokenRow,
		type TypeScaleRow,
		type ValueTokenRow
	} from './token-table.js';

	/**
	 * The token tables — upstream's twelve, as twelve column shapes over one
	 * component.
	 *
	 * Upstream writes them as eight files under `components/tokens/` and maps
	 * them to section titles in `TokensDocView` (`TOPIC_SECTION_OVERRIDES`).
	 * `tokenTableKind()` is that map, keyed on the section's own `previewType`
	 * plus — for the four that share `font-sample` — the token prefix each of
	 * those components already selects its rows by. Same twelve shapes, no title
	 * table to keep in sync across two topics' spellings.
	 *
	 * **The authored `headers` are not the rendered ones, and that is upstream's
	 * behaviour.** `TokensDocView` filters the `table` block out of the section
	 * (`content.filter(block => block.type !== 'table')`) and each table declares
	 * its own columns: Colour is `Token | Value` with both swatches and the hex
	 * pair *inside* the value cell, where the authored block says
	 * `Token | Light | Dark`. Rendering the authored headers is what produced the
	 * five-column table this replaces — `Preview | Token | Light | Dark |
	 * Resolved`, with hexes wrapping mid-value in ~90px columns.
	 *
	 * **There is no `Resolved` column.** Upstream has none; the values shown are
	 * the ones the doc authored. The column it replaces resolved through
	 * `useTheme()`, which since the site adopted `astryxTheme` at the root reads
	 * the *brand skin* — so it printed `#15110C` beside `--color-accent`'s
	 * authored `#0064E0`, unlabelled, next to a swatch painted from a third
	 * value. Upstream's nested `<Theme theme={neutralTheme}>` exists precisely so
	 * its tables do not do that.
	 *
	 * `useTheme()` stays for the one table upstream reads it in:
	 * `TypographyTokenTable` resolves `--text-{name}-size|weight|leading` and the
	 * family through `resolveToken(theme, …)`. (Spelling that placeholder with
	 * angle brackets would be a defect, not a nicety: svelte2tsx locates the style
	 * block by scanning the whole file for its opening tag, so a literal one in a
	 * comment makes `svelte-check` report the script as never closed while `vite`
	 * compiles the file happily. See port/todo.md → Known debts.)
	 *
	 * Upstream also wraps each table in a `Card`, and inside that a
	 * `<Theme theme={neutralTheme} mode={mode}>` — "resolve swatches against the
	 * canonical neutralTheme, not the docsite's astryx brand skin", as
	 * `TokensDocView` puts it. The file this replaces said the nested `Theme`
	 * could wait until "a brand skin ever lands"; one has, so the previews were
	 * being drawn with the brand's own shape tokens — `--radius-element` is a pill
	 * under `astryxTheme`, which turned every 28px swatch into a circle. The
	 * table's own scroll wrapper bleeds the card padding, so it spans the card
	 * edge to edge.
	 *
	 * `useTheme()` is read *outside* that nested `Theme`, which is also upstream:
	 * `TokensDocView` computes `theme` at the top and passes it down as a prop, so
	 * the type scale reports the brand's text tokens while the swatches beside it
	 * resolve neutral's.
	 */
	interface Props {
		/** The authored header row. Read only by the unknown-family fallback. */
		headers: string[];
		rows: string[][];
		previewType?: string;
	}

	const { headers, rows, previewType }: Props = $props();

	const kind = $derived(tokenTableKind(previewType, rows));
	const theme = useTheme();
	const colorMode = getColorModeContext();

	const colorData = $derived(colorRows(rows));
	const valueData = $derived(valueRows(rows));
	const typeScaleData = $derived(typeScaleRows((name) => theme.token(name)));
	const fallbackData = $derived(
		rows.map((row) => Object.fromEntries(row.map((cell, i) => [`c${i}`, cell])))
	);

	/** `--spacing-6` → `24px` for the bars, which need a length. */
	function px(value: string): string {
		return value || '0px';
	}

	function hexLabel(item: ColorTokenRow): string {
		return item.light === item.dark ? item.light : `${item.light} / ${item.dark}`;
	}

	function prefersReducedMotion(): boolean {
		return (
			typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	// --- Duration bars ------------------------------------------------------
	//
	// Upstream gives every `DurationBar` its own `setInterval(…, 2000)` toggling
	// a 0%↔100% width against `transition: width <token> ease`. They all mount
	// together and therefore all run in phase, so one timer for the table is the
	// same picture with nine fewer timers.
	let durationOn = $state(false);

	$effect(() => {
		if (kind !== 'duration') {
			return;
		}
		if (prefersReducedMotion()) {
			durationOn = true;
			return;
		}
		const id = setInterval(() => {
			durationOn = !durationOn;
		}, 2000);
		return () => clearInterval(id);
	});

	// --- Easing curve -------------------------------------------------------
	//
	// Upstream's `EasingCurve` rAF loop, transcribed: a 1200ms sweep, an 800ms
	// hold, then a restart. `progress` starts at 0, which is also what the server
	// renders, so there is no hydration branch to swap.
	let easingProgress = $state(0);

	$effect(() => {
		if (kind !== 'easing') {
			return;
		}
		if (prefersReducedMotion()) {
			easingProgress = 1;
			return;
		}
		let running = true;
		let start = 0;
		let frame = 0;
		const duration = 1200;
		const pause = 800;
		const cycle = duration + pause;
		const tick = (ts: number): void => {
			if (!running) {
				return;
			}
			if (!start) {
				start = ts;
			}
			const inCycle = (ts - start) % cycle;
			easingProgress = inCycle < duration ? inCycle / duration : 1;
			if ((ts - start) % (cycle * 2) >= cycle * 2 - 16) {
				start = ts;
			}
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => {
			running = false;
			cancelAnimationFrame(frame);
		};
	});

	/** The SVG viewBox padding upstream uses so the stroke is not clipped. */
	const CURVE_PAD = 0.12;
	const curveViewBox = `${-CURVE_PAD} ${-CURVE_PAD} ${1 + CURVE_PAD * 2} ${1 + CURVE_PAD * 2}`;

	// `TableColumn.renderCell` is a `Snippet<[T]>`, and a template snippet does
	// not exist while this block runs — so every column array is a `$derived.by`,
	// deferred to first read inside the render. Same reason
	// `examples/Table/TableRichCellTable.svelte` uses one.
	const colorColumns = $derived.by<TableColumn<ColorTokenRow>[]>(() => [
		{ key: 'tokenName', header: 'Token', width: pixel(260) },
		{ key: 'value', header: 'Value', renderCell: colorValueCell }
	]);

	const spacingColumns = $derived.by<TableColumn<ValueTokenRow>[]>(() => [
		{ key: 'tokenName', header: 'Token', width: pixel(200) },
		{ key: 'value', header: 'Value', renderCell: spacingValueCell }
	]);

	const sizeColumns = $derived.by<TableColumn<ValueTokenRow>[]>(() => [
		{ key: 'tokenName', header: 'Token', width: pixel(200) },
		{ key: 'value', header: 'Value', renderCell: sizeValueCell }
	]);

	const borderColumns = $derived.by<TableColumn<ValueTokenRow>[]>(() => [
		{ key: 'tokenName', header: 'Token', width: pixel(200) },
		{ key: 'value', header: 'Value', width: pixel(200), renderCell: codeCell },
		{
			key: 'example',
			header: 'Example',
			width: proportional(1, { minWidth: 120 }),
			renderCell: borderExampleCell
		}
	]);

	const radiusColumns = $derived.by<TableColumn<ValueTokenRow>[]>(() => [
		{ key: 'tokenName', header: 'Token', width: pixel(200) },
		{ key: 'value', header: 'Value', width: pixel(200), renderCell: codeCell },
		{
			key: 'example',
			header: 'Example',
			width: proportional(1, { minWidth: 120 }),
			renderCell: radiusExampleCell
		}
	]);

	const elevationColumns = $derived.by<TableColumn<ValueTokenRow>[]>(() => [
		{ key: 'tokenName', header: 'Token', width: pixel(220) },
		{ key: 'preview', header: 'Preview', width: pixel(80), renderCell: shadowCell }
	]);

	const durationColumns = $derived.by<TableColumn<ValueTokenRow>[]>(() => [
		{ key: 'tokenName', header: 'Token', width: pixel(200) },
		{ key: 'value', header: 'Value', renderCell: durationValueCell }
	]);

	const easingColumns = $derived.by<TableColumn<ValueTokenRow>[]>(() => [
		{ key: 'tokenName', header: 'Token', width: pixel(200) },
		{ key: 'value', header: 'Value', renderCell: easingValueCell }
	]);

	const fontFamilyColumns = $derived.by<TableColumn<ValueTokenRow>[]>(() => [
		{ key: 'tokenName', header: 'Token', width: pixel(200) },
		{ key: 'value', header: 'Value', width: pixel(200), renderCell: familyCodeCell },
		{
			key: 'example',
			header: 'Example',
			width: proportional(1, { minWidth: 200 }),
			renderCell: familySampleCell
		}
	]);

	const fontSizeColumns = $derived.by<TableColumn<ValueTokenRow>[]>(() => [
		{ key: 'tokenName', header: 'Token', width: pixel(200) },
		{ key: 'value', header: 'Value', width: pixel(200), renderCell: codeCell },
		{
			key: 'example',
			header: 'Example',
			width: proportional(1, { minWidth: 200 }),
			renderCell: sizeSampleCell
		}
	]);

	const fontWeightColumns = $derived.by<TableColumn<ValueTokenRow>[]>(() => [
		{ key: 'tokenName', header: 'Token', width: pixel(200) },
		{ key: 'value', header: 'Value', width: pixel(200), renderCell: codeCell },
		{
			key: 'example',
			header: 'Example',
			width: proportional(1, { minWidth: 200 }),
			renderCell: weightSampleCell
		}
	]);

	const typeScaleColumns = $derived.by<TableColumn<TypeScaleRow>[]>(() => [
		{ key: 'label', header: 'Sample', width: pixel(200), renderCell: typeScaleSampleCell },
		{
			key: 'tokens',
			header: 'Tokens',
			width: proportional(1, { minWidth: 280 }),
			renderCell: typeScaleTokensCell
		}
	]);

	const fallbackColumns = $derived(
		headers.map((header, i) => ({
			key: `c${i}`,
			header,
			width: i === 0 ? pixel(260) : proportional(1, { minWidth: 160 })
		}))
	);
</script>

<!--
	The sample string every font table repeats — upstream's `FONT_SAMPLE`.
-->
{#snippet fontSample()}The quick brown fox jumps over the lazy dog{/snippet}

{#snippet codeCell(item: ValueTokenRow)}
	<span class="code-value"><Text type="code" color="secondary">{item.value}</Text></span>
{/snippet}

{#snippet colorValueCell(item: ColorTokenRow)}
	<HStack gap={2} vAlign="center">
		<div class="surface" style="background-color: #FFFFFF; color-scheme: light;">
			<div class="swatch-inner" style="background-color: {item.light}"></div>
		</div>
		<div class="surface" style="background-color: #1C1C1E; color-scheme: dark;">
			<div class="swatch-inner" style="background-color: {item.dark}"></div>
		</div>
		<!--
			Upstream drops this text below 768px (`useMediaQuery('(max-width:
			768px)')`), leaving the two swatches. A media query reaches the same
			place without the hydration branch swap `useMediaQuery` costs — it does
			not run during SSR, so a `{#if}` on it discards the server's nodes on
			any viewport where the default guessed wrong.
		-->
		<span class="code-value hide-narrow">
			<Text type="code" color="secondary">{hexLabel(item)}</Text>
		</span>
	</HStack>
{/snippet}

{#snippet spacingValueCell(item: ValueTokenRow)}
	<HStack gap={2} vAlign="center">
		<div class="spacing-bar" style="width: {px(item.value)}"></div>
		<span class="code-value"><Text type="code" color="secondary">{item.value}</Text></span>
	</HStack>
{/snippet}

{#snippet sizeValueCell(item: ValueTokenRow)}
	<HStack gap={2} vAlign="center">
		<div class="size-box" style="width: {px(item.value)}; height: {px(item.value)}"></div>
		<span class="code-value"><Text type="code" color="secondary">{item.value}</Text></span>
	</HStack>
{/snippet}

{#snippet borderExampleCell(item: ValueTokenRow)}
	<div class="border-line" style="border-bottom-width: {item.value}"></div>
{/snippet}

{#snippet radiusExampleCell(item: ValueTokenRow)}
	<div class="radius-box" style="border-radius: {item.value}"></div>
{/snippet}

{#snippet shadowCell(item: ValueTokenRow)}
	<div class="shadow-box" style="box-shadow: {item.value}"></div>
{/snippet}

{#snippet durationValueCell(item: ValueTokenRow)}
	<HStack gap={2} vAlign="center">
		<div class="duration-track">
			<div
				class="duration-fill"
				style="width: {durationOn ? '100%' : '0%'}; transition: width {item.value} ease"
			></div>
		</div>
		<span class="code-value"><Text type="code" color="secondary">{item.value}</Text></span>
	</HStack>
{/snippet}

{#snippet easingValueCell(item: ValueTokenRow)}
	{@const bezier = parseCubicBezier(item.value)}
	<HStack gap={2} vAlign="center">
		{#if bezier}
			{@const [x1, y1, x2, y2] = bezier}
			{@const easedY = evaluateBezier(x1, y1, x2, y2, easingProgress)}
			<HStack gap={2} vAlign="center">
				<svg class="curve" width="32" height="24" viewBox={curveViewBox} aria-hidden="true">
					<path
						d="M 0 1 C {x1} {1 - y1}, {x2} {1 - y2}, 1 0"
						fill="none"
						stroke="var(--color-neutral)"
						stroke-width="0.04"
					/>
					<path
						d="M 0 1 C {x1} {1 - y1}, {x2} {1 - y2}, 1 0"
						fill="none"
						stroke="var(--color-accent)"
						stroke-width="0.06"
						stroke-dasharray="1"
						stroke-dashoffset={1 - easingProgress}
						pathLength="1"
					/>
					<circle cx={easingProgress} cy={1 - easedY} r="0.06" fill="var(--color-accent)" />
				</svg>
				<div class="easing-track">
					<div class="easing-dot" style="left: {easedY * 100}%"></div>
				</div>
			</HStack>
		{/if}
		<span class="code-value"><Text type="code" color="secondary">{item.value}</Text></span>
	</HStack>
{/snippet}

{#snippet familyCodeCell(item: ValueTokenRow)}
	<span class="code-value">
		<Text type="code" color="secondary">{primaryFamily(item.value)}</Text>
	</span>
{/snippet}

{#snippet familySampleCell(item: ValueTokenRow)}
	<span class="font-sample" style="font-family: {item.value}">{@render fontSample()}</span>
{/snippet}

{#snippet sizeSampleCell(item: ValueTokenRow)}
	<span class="font-sample" style="font-size: {item.value}">{@render fontSample()}</span>
{/snippet}

{#snippet weightSampleCell(item: ValueTokenRow)}
	<span class="font-sample" style="font-weight: {item.value}">{@render fontSample()}</span>
{/snippet}

{#snippet typeScaleSampleCell(item: TypeScaleRow)}
	<span
		class="font-sample"
		style="font-family: {item.fontFamily}; font-size: {item.fontSize}; font-weight: {item.fontWeight}; line-height: {item.leading.split(
			' '
		)[0]}">{item.label}</span
	>
{/snippet}

{#snippet typeScaleTokensCell(item: TypeScaleRow)}
	<VStack gap={1}>
		<span class="code-value">
			<Text type="code" color="secondary">
				{item.fontSize} · {primaryFamily(item.fontFamily)}
			</Text>
		</span>
		<span class="code-value">
			<Text type="code" color="secondary">{item.fontWeight} · {item.leading}</Text>
		</span>
	</VStack>
{/snippet}

{#snippet tableForKind()}
	{#if kind === 'color'}
		<Table
			data={colorData}
			columns={colorColumns}
			idKey="tokenName"
			density="spacious"
			dividers="rows"
		/>
	{:else if kind === 'spacing'}
		<Table
			data={valueData}
			columns={spacingColumns}
			idKey="tokenName"
			density="spacious"
			dividers="rows"
		/>
	{:else if kind === 'size'}
		<Table
			data={valueData}
			columns={sizeColumns}
			idKey="tokenName"
			density="spacious"
			dividers="rows"
		/>
	{:else if kind === 'border'}
		<Table
			data={valueData}
			columns={borderColumns}
			idKey="tokenName"
			density="spacious"
			dividers="rows"
		/>
	{:else if kind === 'radius'}
		<Table
			data={valueData}
			columns={radiusColumns}
			idKey="tokenName"
			density="spacious"
			dividers="rows"
		/>
	{:else if kind === 'elevation'}
		<Table
			data={valueData}
			columns={elevationColumns}
			idKey="tokenName"
			density="spacious"
			dividers="rows"
		/>
	{:else if kind === 'duration'}
		<Table
			data={valueData}
			columns={durationColumns}
			idKey="tokenName"
			density="spacious"
			dividers="rows"
		/>
	{:else if kind === 'easing'}
		<Table
			data={valueData}
			columns={easingColumns}
			idKey="tokenName"
			density="spacious"
			dividers="rows"
		/>
	{:else if kind === 'font-family'}
		<Table
			data={valueData}
			columns={fontFamilyColumns}
			idKey="tokenName"
			density="spacious"
			dividers="rows"
		/>
	{:else if kind === 'font-size'}
		<Table
			data={valueData}
			columns={fontSizeColumns}
			idKey="tokenName"
			density="spacious"
			dividers="rows"
		/>
	{:else if kind === 'font-weight'}
		<Table
			data={valueData}
			columns={fontWeightColumns}
			idKey="tokenName"
			density="spacious"
			dividers="rows"
		/>
	{:else if kind === 'type-scale'}
		<Table
			data={typeScaleData}
			columns={typeScaleColumns}
			idKey="name"
			density="spacious"
			dividers="rows"
		/>
	{:else}
		<!--
			A `previewType` no upstream table claims. The authored headers are the
			only shape known for it, so they are rendered rather than guessed at.
		-->
		<Table data={fallbackData} columns={fallbackColumns} density="spacious" dividers="rows" />
	{/if}
{/snippet}

<Card>
	<Theme theme={neutralTheme} mode={colorMode.themeMode}>
		{@render tableForKind()}
	</Theme>
</Card>

<style>
	/*
	 * **This used to set `white-space: nowrap`, and that was the "clipped value"
	 * bug.** The reasoning was sound when it was written — a value is one unbroken
	 * token, and breaking `#0082FB33` after `#0082FB3` reads as a different colour
	 * — but it was written for a five-column table that no longer exists, and the
	 * claim that "the table's own scroll wrapper carries the overflow instead" is
	 * false: `Table` sets `min-width` from the *declared* column widths, so a cell
	 * whose nowrap content is wider than its share overflows the cell, which is
	 * `overflow: hidden`, and the wrapper never scrolls because the table itself
	 * fits. Measured at 1000px on `/docs/tokens`: `--color-neutral`'s value cell
	 * was 417px wide over 450px of content — 33px of
	 * `rgba(223, 226, 229, 0.2)` cut off with no scrollbar and no ellipsis.
	 *
	 * Upstream's cells wrap (`white-space: normal`, `word-break: break-word`, both
	 * from `Table` itself), and this port's `Table` emits exactly the same — so
	 * deleting the override is not a new behaviour, it is the component's. The
	 * mid-token break the note feared needs a column narrower than one hex, which
	 * upstream's own two-column layout never produces.
	 */
	.code-value {
		display: inline-block;
	}

	@media (max-width: 768px) {
		.hide-narrow {
			display: none;
		}
	}

	/* ColorTokenTable.styles.surface / .swatchInner */
	.surface {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		overflow: hidden;
		border: 1px solid var(--color-border-gray);
		border-radius: var(--radius-element);
	}

	.swatch-inner {
		width: 100%;
		height: 100%;
	}

	/* SpacingTokenTable.styles.bar */
	.spacing-bar {
		flex-shrink: 0;
		min-width: 2px;
		max-width: 64px;
		height: 12px;
		background-color: var(--color-accent);
		border-radius: var(--radius-element);
		opacity: 0.6;
	}

	/* SizeTokenTable.styles.box */
	.size-box {
		flex-shrink: 0;
		background-color: var(--color-accent);
		border-radius: var(--radius-element);
		opacity: 0.6;
	}

	/* ShapeTokenTable.styles.borderLine / .radiusBox */
	.border-line {
		flex-shrink: 0;
		width: 96px;
		height: 0;
		border-bottom-style: solid;
		border-bottom-color: var(--color-border-emphasized);
	}

	.radius-box {
		flex-shrink: 0;
		width: 96px;
		height: 96px;
		background-color: var(--color-accent-muted);
		border: 2px solid var(--color-accent);
	}

	/* ElevationTokenTable.styles.shadowBox */
	.shadow-box {
		flex-shrink: 0;
		width: 48px;
		height: 32px;
		background-color: var(--color-background-surface);
		border-radius: var(--radius-element);
	}

	/* MotionTokenTable.styles.durationTrack / .durationFill */
	.duration-track {
		flex-shrink: 0;
		width: 40px;
		height: 8px;
		overflow: hidden;
		background-color: var(--color-neutral);
		border-radius: var(--radius-element);
	}

	.duration-fill {
		height: 100%;
		background-color: var(--color-accent);
		border-radius: var(--radius-element);
	}

	/* MotionTokenTable.styles.easingTrack / .easingDot */
	.curve {
		flex-shrink: 0;
	}

	.easing-track {
		position: relative;
		flex-shrink: 0;
		width: 40px;
		height: 8px;
		overflow: visible;
		background-color: var(--color-neutral);
		border-radius: var(--radius-element);
	}

	.easing-dot {
		position: absolute;
		top: 0;
		width: 8px;
		height: 8px;
		background-color: var(--color-accent);
		border-radius: var(--radius-full);
		transform: translateX(-50%);
	}

	/* FontTokenTables.styles.fontSample / TypographyTokenTable.styles.sample */
	.font-sample {
		display: block;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
</style>
