<script lang="ts">
	import DateInput from '$lib/components/date-input/date-input.svelte';
	import type { DateInputProps } from '$lib/components/date-input/date-input.svelte';
	import type { ISODateString } from '$lib/components/date-input/date-input.svelte';

	/**
	 * Upstream's `Controlled` from `DateInput/DateInputTouch.test.tsx`: a
	 * `useState` wrapper that feeds its own `onChange` back in as `value`, so a
	 * case that taps a day observes a value that actually moves.
	 *
	 * Three of upstream's defaults are carried here rather than at each call:
	 *
	 * - `label="Event date"`.
	 * - `nativePicker="never"`. The suite is about Astryx's own touch surface,
	 *   which is opt-out — a coarse pointer gets the platform picker unless a
	 *   field says otherwise. The surface-selection cases pass their own value
	 *   over this.
	 * - `min`/`max` of `2026-02-01`…`2026-04-30`. Unbounded, the scroller mounts
	 *   seven month panes — 294 day buttons — per render. Upstream bounds it for
	 *   speed under jsdom; the reason holds here for a different one, since a
	 *   real `ResizeObserver` mounts every one of those panes for real. Cases
	 *   that are *about* the range pass their own.
	 *
	 * `onChange` is **composed, not overridden**: upstream records that spreading
	 * a test's `onChange` over the state setter used to replace it, so the field
	 * silently stopped updating in exactly the tests watching it most closely.
	 * Here the spread cannot reach it — `onChange` is destructured out of
	 * `rest` — which makes the same guarantee structurally.
	 */
	interface Props extends Omit<DateInputProps, 'label' | 'value'> {
		initial?: ISODateString;
		label?: string;
	}

	const {
		initial,
		onChange,
		label = 'Event date',
		nativePicker = 'never',
		min = '2026-02-01' as ISODateString,
		max = '2026-04-30' as ISODateString,
		...rest
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let value = $state<ISODateString | undefined>(initial);
</script>

<DateInput
	{label}
	{nativePicker}
	{min}
	{max}
	{...rest}
	{value}
	onChange={(next) => {
		value = next;
		onChange?.(next);
	}}
/>
