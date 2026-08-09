<!--
	Ported from upstream's `templates/blocks/components/Link/LinkExternalLinks.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Link, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={2}>
	<Link href="https://github.com" isExternalLink isStandalone>GitHub</Link>
	<Link href="https://developer.mozilla.org" isExternalLink isStandalone>MDN Web Docs</Link>
	<Link href="https://react.dev" isExternalLink hasUnderline isStandalone>React Documentation</Link>
</VStack>
