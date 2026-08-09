<!--
	Ported from upstream's `templates/blocks/components/LinkProvider/LinkProviderCustomLink.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Link, LinkProvider } from '@astryx-svelte/core';
	import RouterLink from './RouterLink.svelte';

	/**
	 * A stand-in for a framework router link (e.g. SvelteKit's `<a>` handling or a
	 * router's own link component). Instead of letting the browser do a full-page
	 * navigation, it intercepts the click and hands the destination to a custom
	 * handler — the same hook real routers use for client-side navigation. Here it
	 * just announces the target so the behavior swap is observable in the preview.
	 *
	 * Upstream declares `RouterLink` inline in this file; Svelte has no in-file
	 * component declaration, so it sits in the sibling `RouterLink.svelte`.
	 */
</script>

<LinkProvider component={RouterLink}>
	<Link href="/dashboard" isStandalone>Go to dashboard</Link>
</LinkProvider>
