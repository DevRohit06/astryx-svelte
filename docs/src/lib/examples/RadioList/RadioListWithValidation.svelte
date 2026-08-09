<!--
	Ported from upstream's `templates/blocks/components/RadioList/RadioListWithValidation.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { RadioList, RadioListItem } from '@astryx-svelte/core';
	import type { InputStatus } from '@astryx-svelte/core';

	let value = $state('');

	/**
	 * Upstream inlines a `value === '' ? {…} : undefined` ternary on `status`.
	 * Passing an explicit `undefined` to an optional prop is what
	 * `exactOptionalPropertyTypes` forbids, so the same branch is computed here as
	 * a `$derived` typed `InputStatus | undefined`. Nothing about what renders
	 * moves.
	 */
	const status = $derived<InputStatus | undefined>(
		value === '' ? { type: 'error', message: 'Please select a notification method' } : undefined
	);
</script>

<RadioList
	label="Notification preference"
	isRequired
	{status}
	{value}
	onChange={(next) => (value = next)}
>
	<RadioListItem label="Email" value="email" />
	<RadioListItem label="SMS" value="sms" />
	<RadioListItem label="Push notification" value="push" />
</RadioList>
