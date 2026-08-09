<!--
	Ported from upstream's `templates/blocks/components/TextInput/TextInputStatusVariant.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { TextInput, Stack, Text } from '@astryx-svelte/core';

	let attached = $state('sarah@');
	let detached = $state('sarah@');
</script>

<div style="width: 640px">
	<Stack direction="horizontal" gap={5}>
		<Stack direction="vertical" gap={2}>
			<Text type="label">attached (default)</Text>
			<TextInput
				label="Email"
				value={attached}
				onChange={(next) => (attached = next)}
				placeholder="you@example.com"
				statusVariant="attached"
				status={{ type: 'error', message: 'Please enter a valid email address.' }}
			/>
			<Text type="supporting">Message overlaps directly below the input.</Text>
		</Stack>
		<Stack direction="vertical" gap={2}>
			<Text type="label">detached</Text>
			<TextInput
				label="Email"
				value={detached}
				onChange={(next) => (detached = next)}
				placeholder="you@example.com"
				statusVariant="detached"
				status={{ type: 'error', message: 'Please enter a valid email address.' }}
			/>
			<Text type="supporting">Message floats below as a separate element with spacing.</Text>
		</Stack>
	</Stack>
</div>
