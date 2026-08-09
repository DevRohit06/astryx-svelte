<!--
	Ported from upstream's `templates/blocks/components/Dialog/DialogFullscreenDialog.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Button,
		Card,
		Dialog,
		DialogHeader,
		HStack,
		Layout,
		LayoutContent,
		LayoutFooter,
		Text,
		VStack
	} from '@astryx-svelte/core';

	const SECTIONS = [
		{
			title: 'Getting started',
			body: 'Create your first project by clicking New Project in the sidebar. Choose a template or start from scratch.'
		},
		{
			title: 'Team members',
			body: 'Invite collaborators from Settings > Team. Each member can have Admin, Editor, or Viewer permissions.'
		},
		{
			title: 'Billing',
			body: 'Free plans include up to 3 projects. Upgrade to Pro for unlimited projects and priority support.'
		},
		{
			title: 'API access',
			body: 'Generate API keys from Settings > Developer. Rate limits are 1,000 requests per minute on free plans.'
		},
		{
			title: 'Data export',
			body: 'Export your data anytime from Settings > Data. Exports are available as CSV or JSON within 24 hours.'
		}
	];

	let isOpen = $state(false);
</script>

<Card>
	<VStack gap={3}>
		<VStack gap={1}>
			<Text type="body" weight="bold">Help &amp; Documentation</Text>
			<Text type="supporting" color="secondary">5 articles · Last updated Apr 2026</Text>
		</VStack>
		<Button label="Open documentation" variant="secondary" onclick={() => (isOpen = true)} />
	</VStack>
	<Dialog {isOpen} onOpenChange={(next) => (isOpen = next)} variant="fullscreen">
		<Layout>
			{#snippet header()}
				<DialogHeader
					title="Documentation"
					subtitle="Everything you need to get started"
					onOpenChange={(next) => (isOpen = next)}
				/>
			{/snippet}
			{#snippet content()}
				<LayoutContent>
					<VStack gap={4}>
						{#each SECTIONS as section (section.title)}
							<VStack gap={1}>
								<Text type="body" weight="bold">{section.title}</Text>
								<Text type="body">{section.body}</Text>
							</VStack>
						{/each}
					</VStack>
				</LayoutContent>
			{/snippet}
			{#snippet footer()}
				<LayoutFooter>
					<HStack hAlign="end">
						<Button label="Close" variant="primary" onclick={() => (isOpen = false)} />
					</HStack>
				</LayoutFooter>
			{/snippet}
		</Layout>
	</Dialog>
</Card>
