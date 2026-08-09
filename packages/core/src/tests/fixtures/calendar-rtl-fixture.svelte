<script lang="ts">
	import Calendar, { type CalendarProps } from '$lib/components/calendar/calendar.svelte';

	/**
	 * The markup upstream writes inline as JSX around `render`, which a Svelte
	 * case cannot author: `<div dir="rtl"><Calendar … /></div>`.
	 *
	 * Nothing else about the fixture is load-bearing — the Calendar props pass
	 * straight through.
	 */
	interface Props {
		calendar: CalendarProps;
	}

	const { calendar }: Props = $props();
</script>

<div dir="rtl">
	<Calendar {...calendar} />
</div>
