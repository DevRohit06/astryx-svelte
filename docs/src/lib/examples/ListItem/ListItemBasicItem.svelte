<!--
	Ported from upstream's `templates/blocks/components/ListItem/ListItemBasicItem.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { List, ListItem } from '@astryx-svelte/core';
</script>

<List header="Account settings" hasDividers>
	<ListItem label="Profile" description="Name, avatar, and bio" />
	<ListItem label="Notifications" description="Email and push alerts" />
	<ListItem label="Security" description="Password and two-factor auth" />
</List>
