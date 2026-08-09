<!--
	Ported from upstream's `templates/blocks/components/ChatComposerDrawer/ChatComposerDrawerFeedback.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`ListItem.label` and `startContent` are `string | Snippet` / `Snippet` here
	where upstream types them `ReactNode`, and both vary per option — a snippet
	with parameters cannot be pre-applied and handed to a prop, so each option's
	badge is selected through a lookup declared beside the `{#each}`.
-->
<script lang="ts">
	import {
		Badge,
		ChatComposer,
		ChatComposerDrawer,
		List,
		ListItem,
		Stack,
		Text
	} from '@astryx-svelte/core';

	const options = [
		{ key: 'A', label: 'Yes' },
		{ key: 'B', label: 'Yes, and don’t ask again for `git add` commands' },
		{ key: 'C', label: 'No, and tell me what to do differently' }
	];

	let selected = $state<string | null>(null);
</script>

{#snippet question()}
	<Text weight="bold">Do you want to proceed?</Text>
{/snippet}

{#snippet badgeA()}
	<Badge variant={selected === 'A' ? 'info' : 'neutral'} label="A" />
{/snippet}

{#snippet badgeB()}
	<Badge variant={selected === 'B' ? 'info' : 'neutral'} label="B" />
{/snippet}

{#snippet badgeC()}
	<Badge variant={selected === 'C' ? 'info' : 'neutral'} label="C" />
{/snippet}

{#snippet drawer()}
	<ChatComposerDrawer count={1} label="User feedback requested">
		<Stack direction="vertical" gap={1} width="100%">
			<List>
				{@const badgeFor = { A: badgeA, B: badgeB, C: badgeC } as Record<string, typeof badgeA>}
				<ListItem label={question} />
				{#each options as opt (opt.key)}
					<ListItem
						label={opt.label}
						startContent={badgeFor[opt.key]}
						isSelected={selected === opt.key}
						onclick={() => (selected = opt.key)}
					/>
				{/each}
			</List>
		</Stack>
	</ChatComposerDrawer>
{/snippet}

<Stack direction="vertical" style="width: 100%; max-width: 450px">
	<ChatComposer
		onSubmit={(value) => {
			console.log('Submit:', value, '| Answer:', selected);
		}}
		{drawer}
	/>
</Stack>
