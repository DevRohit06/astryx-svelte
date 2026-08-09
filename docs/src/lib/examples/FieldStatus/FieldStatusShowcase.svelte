<!--
	Ported from upstream's `templates/blocks/components/FieldStatus/FieldStatusShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { FieldStatus, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={4}>
	<FieldStatus type="error" message="This field is required" variant="detached" />
	<FieldStatus
		type="warning"
		message="This username is already taken by another team"
		variant="detached"
	/>
	<FieldStatus type="success" message="Your changes have been saved" variant="detached" />
</VStack>
