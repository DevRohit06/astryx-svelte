<!--
	The `Content({onClose})` component upstream declares inside
	`templates/blocks/components/Dialog/DialogFormDialog.tsx`. Svelte has no
	in-file component declaration, so it lives here — the `LinkProvider/RouterLink`
	precedent.

	It is a *component* rather than the parameterised snippet the other three
	Dialog blocks use, and the reason is its state: upstream renders `Content`
	twice (the inline preview and the dialog `show()` opens) and each React
	instance owns its own `name`/`bio`. A snippet rendered twice would share one
	pair, so editing the preview's fields would silently change the modal's.

	This file is not a block: the example registry looks up `<BlockName>.svelte`,
	so a sibling is invisible to it.
-->
<script lang="ts">
	import {
		Button,
		DialogHeader,
		HStack,
		Layout,
		LayoutContent,
		LayoutFooter,
		TextArea,
		TextInput,
		VStack
	} from '@astryx-svelte/core';

	const { onClose }: { onClose: () => void } = $props();

	let name = $state('Ruby Cheung');
	let bio = $state('Design systems engineer');
</script>

<Layout>
	{#snippet header()}
		<DialogHeader
			title="Edit profile"
			subtitle="Update your display name and bio"
			onOpenChange={() => onClose()}
		/>
	{/snippet}
	{#snippet content()}
		<LayoutContent>
			<VStack gap={4}>
				<TextInput
					label="Display name"
					value={name}
					onChange={(next) => (name = next)}
					placeholder="Enter your name"
				/>
				<TextArea
					label="Bio"
					value={bio}
					onChange={(next) => (bio = next)}
					placeholder="Tell us about yourself"
				/>
			</VStack>
		</LayoutContent>
	{/snippet}
	{#snippet footer()}
		<LayoutFooter>
			<HStack gap={2} hAlign="end">
				<Button label="Cancel" variant="secondary" onclick={onClose} />
				<Button label="Save" variant="primary" onclick={onClose} />
			</HStack>
		</LayoutFooter>
	{/snippet}
</Layout>
