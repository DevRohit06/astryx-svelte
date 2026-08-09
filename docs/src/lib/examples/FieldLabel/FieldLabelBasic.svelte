<!--
	Ported from upstream's `templates/blocks/components/FieldLabel/FieldLabelBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { FieldLabel, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={4}>
	<FieldLabel label="Email address" inputID="email-input" isRequired />
	<FieldLabel
		label="Phone number"
		inputID="phone-input"
		isOptional
		description="Include country code for international numbers"
	/>
</VStack>
