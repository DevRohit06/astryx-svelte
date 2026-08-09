<!--
	Ported from upstream's `templates/blocks/components/List/ListBasicList.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { List, ListItem } from '@astryx-svelte/core';
</script>

<List>
	<ListItem label="Notifications" description="Manage your alerts" />
	<ListItem label="Privacy" description="Control your data" />
	<ListItem label="Security" description="Password and 2FA" />
</List>
