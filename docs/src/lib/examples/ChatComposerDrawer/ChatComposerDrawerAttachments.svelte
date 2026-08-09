<!--
	Ported from upstream's `templates/blocks/components/ChatComposerDrawer/ChatComposerDrawerAttachments.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	No `count`, so the drawer offers no collapse — that is upstream's shape here,
	and the one case in the set that exercises it.

	`Carousel` is data-driven in this port (`items` + an `item` snippet) where
	upstream maps over compositional `children`; the component's own note explains
	why, and upstream's `.map()` translates straight onto it.
-->
<script lang="ts">
	import {
		Carousel,
		ChatComposer,
		ChatComposerDrawer,
		Stack,
		Thumbnail,
		Token
	} from '@astryx-svelte/core';

	const IMAGE_ATTACHMENTS = [
		{
			id: '1',
			src: 'https://lookaside.facebook.com/assets/astryx/illustrative-vertical-1.png',
			alt: 'River through a valley',
			label: 'valley.jpg'
		},
		{
			id: '2',
			src: 'https://lookaside.facebook.com/assets/astryx/illustrative-vertical-2.png',
			alt: 'Foggy mountain peak',
			label: 'mountain.jpg'
		},
		{
			id: '3',
			src: 'https://lookaside.facebook.com/assets/astryx/illustrative-vertical-3.png',
			alt: 'Golden retriever puppy',
			label: 'puppy.jpg'
		},
		{
			id: '4',
			src: 'https://lookaside.facebook.com/assets/astryx/illustrative-vertical-4.png',
			alt: 'Bridge at sunset',
			label: 'bridge.jpg'
		},
		{
			id: '5',
			src: 'https://lookaside.facebook.com/assets/astryx/illustrative-vertical-5.png',
			alt: 'Lakeside at dusk',
			label: 'lakeside.jpg'
		}
	];
</script>

{#snippet attachment(img: (typeof IMAGE_ATTACHMENTS)[number])}
	<Thumbnail src={img.src} alt={img.alt} label={img.label} onRemove={() => {}} />
{/snippet}

{#snippet drawer()}
	<ChatComposerDrawer>
		<Stack direction="vertical" gap={2} width="100%">
			<Carousel gap={1} items={IMAGE_ATTACHMENTS} item={attachment} />
			<Stack direction="horizontal" gap={1} wrap="wrap">
				<Token label="quarterly-report.pdf" onRemove={() => {}} />
				<Token label="budget-forecast.xlsx" onRemove={() => {}} />
			</Stack>
		</Stack>
	</ChatComposerDrawer>
{/snippet}

<Stack direction="vertical" gap={4} width={480}>
	<ChatComposer onSubmit={() => {}} {drawer} />
</Stack>
