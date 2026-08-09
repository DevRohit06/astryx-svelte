<!--
	Ported from upstream's `templates/blocks/components/Link/LinksWithTooltips.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Link } from '@astryx-svelte/core';
</script>

<HStack gap={4} vAlign="center">
	<Link href="#" tooltip="Configure your account settings" isStandalone>Settings</Link>
	<Link href="#" tooltip="View and edit your profile" isStandalone>Profile</Link>
	<Link href="#" tooltip="Get help and support" color="secondary" isStandalone>Help</Link>
</HStack>
