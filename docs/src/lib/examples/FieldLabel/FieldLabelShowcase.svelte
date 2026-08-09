<!--
	Ported from upstream's `templates/blocks/components/FieldLabel/FieldLabelShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { FieldLabel, VStack } from '@astryx-svelte/core';
</script>

<!-- Upstream authors the padlock inline in the story file, so it transcribes as-is. -->
{#snippet lockIcon()}
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width={1.5}
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<rect x="3" y="11" width="18" height="11" rx="2" />
		<path d="M7 11V7a5 5 0 0 1 10 0v4" />
	</svg>
{/snippet}

<VStack gap={4}>
	<FieldLabel label="Email address" inputID="email-input" isRequired />
	<FieldLabel
		label="Phone number"
		inputID="phone-input"
		isOptional
		description="Include country code for international numbers"
	/>
	<FieldLabel
		label="API key"
		inputID="api-input"
		labelTooltip="Your API key can be found in the developer settings"
		labelIcon={lockIcon}
	/>
	<FieldLabel label="Disabled field" inputID="disabled-input" isDisabled />
</VStack>
