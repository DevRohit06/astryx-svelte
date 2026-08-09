<!--
	Ported from upstream's `templates/blocks/components/Avatar/AvatarWithImage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, Stack } from '@astryx-svelte/core';
</script>

<Stack direction="horizontal" gap={4} vAlign="center">
	<Avatar
		src="https://lookaside.facebook.com/assets/astryx/DATA-Ami-Pena.png"
		name="Ami Pena"
		size="xsm"
	/>
	<Avatar
		src="https://lookaside.facebook.com/assets/astryx/DATA-Ana-Thomas.png"
		name="Ana Thomas"
		size="md"
	/>
	<Avatar
		src="https://lookaside.facebook.com/assets/astryx/DATA-Daniela-Gimenez.png"
		name="Daniela Gimenez"
		size="lg"
	/>
	<Avatar
		src="https://lookaside.facebook.com/assets/astryx/DATA-Gabriela-Fernandez.png"
		name="Gabriela Fernandez"
		size="xl"
	/>
</Stack>
