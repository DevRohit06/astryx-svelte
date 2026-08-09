<!--
	Ported from upstream's `templates/blocks/components/CheckboxInput/CheckboxInputIndeterminateState.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CheckboxInput, Divider, Stack } from '@astryx-svelte/core';

	let items = $state({ email: true, push: false, sms: true, slack: false });

	const checkedCount = $derived(Object.values(items).filter(Boolean).length);
	const totalCount = $derived(Object.keys(items).length);
	const selectAllValue = $derived<boolean | 'indeterminate'>(
		checkedCount === 0 ? false : checkedCount === totalCount ? true : 'indeterminate'
	);

	function handleSelectAll(checked: boolean | 'indeterminate') {
		const next = checked === true;
		items = { email: next, push: next, sms: next, slack: next };
	}
</script>

<Stack direction="vertical" gap={3}>
	<CheckboxInput
		label="Select all notifications"
		description={`${checkedCount} of ${totalCount} enabled`}
		value={selectAllValue}
		onChange={handleSelectAll}
	/>
	<Divider />
	<Stack direction="vertical" gap={3}>
		<CheckboxInput
			label="Email notifications"
			value={items.email}
			onChange={(v) => (items = { ...items, email: v === true })}
		/>
		<CheckboxInput
			label="Push notifications"
			value={items.push}
			onChange={(v) => (items = { ...items, push: v === true })}
		/>
		<CheckboxInput
			label="SMS alerts"
			value={items.sms}
			onChange={(v) => (items = { ...items, sms: v === true })}
		/>
		<CheckboxInput
			label="Slack messages"
			value={items.slack}
			onChange={(v) => (items = { ...items, slack: v === true })}
		/>
	</Stack>
</Stack>
