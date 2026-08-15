<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { TextColor, TextSize, TextType, TextWeight } from '../text/text.stylex.js';
	import type { TimestampFormat } from './timestamp-format.js';
	import type { TimestampTooltipEntry } from './tooltip-entries.js';

	export interface TimestampProps extends BaseProps<HTMLElement> {
		/** Unix timestamp (seconds or milliseconds) or an ISO 8601 string. */
		value: string | number;
		/**
		 * - `'relative'`: "2 hours ago", "yesterday", "now"
		 * - `'relative_short'`: "2h ago", "1d ago", "now" — the same tiers as
		 *   `'relative'` with abbreviated units (s/m/h/d/mo/y), for compact,
		 *   space-constrained surfaces
		 * - `'auto'`: relative while recent, `date_time` once older than `autoThreshold`
		 * - `'date'`: "Mar 21, 2025"
		 * - `'date_long'`: "March 21, 2025"
		 * - `'date_weekday'`: "Fri, Mar 21, 2025"
		 * - `'date_time'`: "Mar 21, 2025, 2:51 PM"
		 * - `'time'`: "2:51 PM"
		 * - `'system_date'`: "2025-03-21"
		 * - `'system_date_time'`: "2025-03-21 14:51:53"
		 * - `'system_time'`: "14:51:53"
		 * - `'unix_seconds'`: "1742565113" — Unix time in whole seconds since the
		 *   epoch. Absolute (zone-independent), so it ignores any tooltip time zone.
		 *
		 * @default 'auto'
		 */
		format?: TimestampFormat;
		/**
		 * Age in seconds at which `auto` switches to `date_time`.
		 *
		 * @default 604800 (7 days)
		 */
		autoThreshold?: number;
		/**
		 * Whether to show a hover card with the full date/time on hover. The card
		 * is copyable — its default single row carries the full absolute time —
		 * and `tooltipEntries` customizes its rows.
		 *
		 * @default true
		 */
		hasTooltip?: boolean;
		/**
		 * Lines to show on hover, so one instant can be read — and optionally
		 * copied — in several time zones and/or formats at once. Each entry is one
		 * line, rendered in the order given, with an optional label.
		 *
		 * Rows are read-only unless they set `isCopyable` (default `false`). A
		 * copyable row shows a copy button in a dedicated trailing action column
		 * so the buttons align across rows; that column is only present when some
		 * row is copyable. With no entries the card shows a single default row
		 * with the full absolute time in the viewer's own zone, which is copyable.
		 *
		 * Configuring entries also attaches the surface to absolute formats, which
		 * otherwise have no hover card at all. `hasTooltip={false}` still
		 * suppresses it, and an empty array is treated as no configuration.
		 *
		 * @default undefined — a single default row with the full absolute time in
		 *   the viewer's own time zone
		 * @example
		 * ```svelte
		 * <Timestamp
		 *   value={savedAt}
		 *   tooltipEntries={[
		 *     { label: 'Your time' },
		 *     { timezoneID: 'UTC', label: 'UTC' },
		 *     { timezoneID: 'UTC', format: 'system_date_time', label: 'ISO', isCopyable: true }
		 *   ]}
		 * />
		 * ```
		 */
		tooltipEntries?: ReadonlyArray<TimestampTooltipEntry>;
		/**
		 * Append the timezone abbreviation. Applies to `date_time` and `time`;
		 * the `system_*` formats stay machine-readable and never carry one.
		 *
		 * Affects the visible text only — use `tooltipEntries` to control the
		 * card's time zones.
		 *
		 * @default false
		 */
		isTimezoneShown?: boolean;
		/**
		 * Re-render relative output on a timer, so "2 minutes ago" stays true.
		 *
		 * @default false
		 */
		isLive?: boolean;
		/** @default 'supporting' */
		type?: TextType;
		/** Explicit font-size override, leaving the rest of `type` intact. */
		size?: TextSize;
		/** @default 'secondary' */
		color?: TextColor;
		weight?: TextWeight;
		'data-testid'?: string;
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { devWarn } from '../../utils/dev-warning.js';
	import Text from '../text/text.svelte';
	import { formatInstant } from './format-instant.js';
	import {
		DEFAULT_AUTO_THRESHOLD,
		getLiveInterval,
		getRelativeTimeShortString,
		getRelativeTimeString,
		isAbsoluteFormat,
		isRelativeFormat,
		parseValue
	} from './timestamp-format.js';
	import { formatTooltipLines, type TimestampTooltipLine } from './tooltip-entries.js';
	import { timestampAttrs } from './timestamp.stylex.js';

	/**
	 * A formatted timestamp: a semantic `<time>` with an ISO 8601 `datetime`,
	 * styled through `Text`.
	 *
	 * Supports relative ("2 hours ago" / "2h ago"), several absolute formats, and
	 * `auto`, which picks between the two by age. Relative output can update
	 * live. Optionally shows a hover card with the full absolute time, which is
	 * copyable.
	 */
	// Upstream declares `BaseProps<HTMLTimeElement>`, naming the semantic `<time>`
	// root its `ref` points at — but it never forwards its rest props anywhere (see
	// the known debt in port/todo.md). Ours does forward them, to the `<Text>` wrapper,
	// so `HTMLElement` is the element they actually reach. Typing this
	// `HTMLTimeElement` makes the handler types contravariantly incompatible with
	// `Text`'s own props, which is the compiler pointing at the same discrepancy.

	const {
		value,
		format = 'auto',
		autoThreshold = DEFAULT_AUTO_THRESHOLD,
		hasTooltip = true,
		tooltipEntries,
		isTimezoneShown = false,
		isLive = false,
		type = 'supporting',
		color = 'secondary',
		size,
		weight,
		class: className,
		style: styleProp,
		'data-testid': testId,
		...rest
	}: TimestampProps = $props();

	const t = useTranslator();

	// The reference clock everything relative is measured against. Captured once
	// at render, then advanced on a timer when `isLive` is set.
	let now = $state(new Date());

	const date = $derived(parseValue(value));
	// An unparseable value (a malformed date string, or a NaN timestamp from
	// missing data) yields an Invalid Date, and formatting one throws "Invalid
	// time value". Everything below is guarded on this, and the element itself
	// is not rendered at all when it is false.
	const isValidDate = $derived(!Number.isNaN(date.getTime()));

	const diffSeconds = $derived(Math.round((now.getTime() - date.getTime()) / 1000));
	const effectiveFormat = $derived<TimestampFormat>(
		format === 'auto' ? (Math.abs(diffSeconds) <= autoThreshold ? 'relative' : 'date_time') : format
	);

	// No time zone is passed: the visible text always reads in the viewer's own
	// zone, and only the card names others.
	const displayText = $derived(
		!isValidDate
			? ''
			: effectiveFormat === 'relative'
				? getRelativeTimeString(date, now)
				: effectiveFormat === 'relative_short'
					? getRelativeTimeShortString(date, now)
					: isAbsoluteFormat(effectiveFormat)
						? formatInstant(date, effectiveFormat, { isTimezoneShown })
						: ''
	);
	/** Full absolute text, for the accessible name and the card's default row. */
	// Full absolute text for the tooltip (visible — keeps the compact timezone
	// abbreviation) and for the AT-facing aria-label, which spells the timezone
	// out in full: abbreviations like "PST" or "GMT+2" are unexpanded
	// abbreviations to a screen-reader user (WCAG 3.1.4).
	const fullAbsoluteText = $derived(isValidDate ? formatInstant(date, 'full') : '');
	const ariaLabelText = $derived(
		isValidDate ? formatInstant(date, 'full', { timeZoneNameStyle: 'long' }) : ''
	);

	// An empty array is not a second way to spell "off" — `hasTooltip` stays the
	// only on/off axis — so normalize it away before anything reads it.
	const entries = $derived(
		tooltipEntries !== undefined && tooltipEntries.length > 0 ? tooltipEntries : undefined
	);

	// Absolute formats have never carried a hover surface. Leaving that gate
	// closed when a consumer has explicitly configured tooltip lines would let
	// `format` silently suppress another prop's output, so entry presence opens
	// it too. With no entries this reduces to the original condition exactly.
	const showTooltip = $derived(
		hasTooltip && (isRelativeFormat(effectiveFormat) || entries !== undefined)
	);

	// The rows the hover card renders: the configured entries, or the single
	// default absolute line shown when none are set. Either way the surface is
	// the same copyable card — the default line is a one-row card carrying the
	// full absolute time, itself copyable, just like a configured entry.
	//
	// Only ever read inside `{#if isValidDate}`, and that is load-bearing rather
	// than incidental: `formatTooltipLines` on an Invalid Date throws
	// "Invalid time value", and `$derived`'s laziness is the only thing standing
	// in for upstream's early `return null` after the hooks. Reading this above
	// the guard would crash Timestamp on a malformed `value`.
	const lines = $derived<ReadonlyArray<TimestampTooltipLine>>(
		entries === undefined
			? [{ value: fullAbsoluteText, isCopyable: true }]
			: formatTooltipLines(date, entries)
	);

	$effect(() => {
		if (!isLive || !isValidDate || !isRelativeFormat(effectiveFormat)) return;

		// Reading `diffSeconds` re-runs this on every tick, which is the point:
		// the cadence coarsens as the value ages, matching upstream's dependency
		// on the same value.
		const timer = setInterval(() => {
			now = new Date();
		}, getLiveInterval(diffSeconds));

		return () => clearInterval(timer);
	});

	// Upstream's `useDevWarning('Timestamp', …)`: a ref latch inside an effect, so
	// the warning fires at most once per mount and never during SSR. Expanded
	// inline rather than calling our `useDevWarning`, because the message
	// interpolates `value` and the hook takes `message` as a plain string —
	// captured at init, it would report the mount-time value rather than the one
	// that actually failed to parse.
	let hasWarnedInvalidDate = false;
	$effect(() => {
		if (!isValidDate && !hasWarnedInvalidDate) {
			hasWarnedInvalidDate = true;
			devWarn(
				'Timestamp',
				`could not parse value ${JSON.stringify(value)} as a date. Rendering nothing.`
			);
		}
	});

	const attrs = timestampAttrs();
	const theme = $derived(themeProps('timestamp', { format: effectiveFormat }));
</script>

{#snippet timeElement()}
	<Text
		{type}
		{size}
		{color}
		{weight}
		{...rest}
		{...theme}
		class={cx(theme.class, className)}
		style={styleProp as string | undefined}
	>
		<!--
			The hover card is anchored here with `focusTrigger="always"`, which
			attaches focus listeners but does not itself make the anchor focusable. A
			bare `<time>` is not focusable, so without a tab stop sighted keyboard
			users could never reveal the card (WCAG 1.4.13 / 2.1.1). The stop is added
			only while a card is actually attached — no gratuitous tab stops
			otherwise. The card carries its own dashed-underline hover indication as
			the affordance, so the anchor needs no separate focus outline.
		-->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<time
			datetime={date.toISOString()}
			aria-label={isRelativeFormat(effectiveFormat) ? ariaLabelText : undefined}
			data-testid={testId}
			tabindex={showTooltip ? 0 : undefined}
			class={attrs.class}
			style={attrs.style}
		>
			{displayText}
		</time>
	</Text>
{/snippet}

{#if isValidDate}
	{#if showTooltip}
		<!--
			One surface for every timestamp that shows one: the copyable hover card,
			loaded lazily as upstream's `lazy` + `Suspense` does, so a consumer that
			only renders a card-less Timestamp never pulls `HoverCard` or the copy
			affordance's `Icon`/`IconButton` into its bundle. `{#await}`'s pending
			branch is the `Suspense` fallback — the bare `<time>` stays visible while
			the chunk loads, so nothing disappears; the card simply attaches once
			ready.
		-->
		{#await import('./timestamp-hover-card.svelte')}
			{@render timeElement()}
		{:then { default: TimestampHoverCard }}
			<TimestampHoverCard {lines} label={t('@astryx.timestamp.detailsLabel')}>
				{@render timeElement()}
			</TimestampHoverCard>
		{/await}
	{:else}
		{@render timeElement()}
	{/if}
{/if}
