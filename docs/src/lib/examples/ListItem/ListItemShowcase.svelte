<!--
	Ported from upstream's `templates/blocks/components/ListItem/ListItemShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Icon, List, ListItem } from '@astryx-svelte/core';
</script>

<List header="Settings" hasDividers>
	<ListItem label="Notifications" description="Push, email, and SMS alerts" onclick={() => {}}>
		{#snippet startContent()}<Icon icon="info" />{/snippet}
		{#snippet endContent()}<Badge label="3 new" variant="blue" />{/snippet}
	</ListItem>
	<ListItem label="Privacy" description="Manage data sharing preferences" onclick={() => {}}>
		{#snippet startContent()}<Icon icon="eyeSlash" />{/snippet}
	</ListItem>
	<ListItem label="Appearance" description="Theme, font size, and display" onclick={() => {}}>
		{#snippet startContent()}<Icon icon="wrench" />{/snippet}
	</ListItem>
	<ListItem label="Billing" description="Plans and payment methods" onclick={() => {}}>
		{#snippet startContent()}<Icon icon="copy" />{/snippet}
		{#snippet endContent()}<Badge label="Pro" variant="purple" />{/snippet}
	</ListItem>
</List>
