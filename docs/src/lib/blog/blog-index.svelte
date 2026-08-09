<script lang="ts">
	import {
		EmptyState,
		Heading,
		Section,
		Text,
		ToggleButton,
		ToggleButtonGroup,
		VStack
	} from '@astryx-svelte/core';
	import type { BlogPost, BlogPostType } from './schema.js';
	import { POST_TYPE_LABELS } from './schema.js';
	import BlogCard from './blog-card.svelte';

	/**
	 * The blog index — upstream's `BlogIndex`: type filters over a card grid, with
	 * the latest post featured full-width above it.
	 *
	 * Two of upstream's behaviours are load-bearing and easy to lose:
	 *
	 * - **The filter row only renders when more than one type has posts.** A
	 *   single-type blog showing a lone "Engineering (1)" toggle is noise, and
	 *   this port is exactly that case today.
	 * - **The feature card only appears under "All".** Filtering to a type shows a
	 *   plain grid, because a "featured" post within a filtered subset is a claim
	 *   the ordering does not support.
	 */
	interface Props {
		posts: BlogPost[];
		availableTypes: BlogPostType[];
	}

	const { posts, availableTypes }: Props = $props();

	let activeType = $state<'all' | BlogPostType>('all');

	const filtered = $derived(
		activeType === 'all' ? posts : posts.filter((post) => post.type === activeType)
	);

	const counts = $derived.by(() => {
		const map: Record<string, number> = { all: posts.length };
		for (const type of availableTypes) {
			map[type] = posts.filter((post) => post.type === type).length;
		}
		return map;
	});

	const showFeature = $derived(activeType === 'all' && filtered.length > 0);
	const featurePost = $derived(showFeature ? filtered[0] : null);
	const restPosts = $derived(showFeature ? filtered.slice(1) : filtered);
</script>

<div class="blog-index">
	<Section maxWidth={800} padding={6}>
		<VStack gap={10}>
			<VStack gap={2}>
				<Heading level={1} type="display-1" justify="center">Blog</Heading>
				<Text weight="normal" color="secondary" justify="center">
					Releases, notes and the occasional deep dive on porting Astryx to Svelte.
				</Text>
			</VStack>

			{#if availableTypes.length > 1}
				<div class="type-filter">
					<ToggleButtonGroup
						label="Filter posts by type"
						value={activeType}
						onChange={(value: string | null) =>
							(activeType = (value as 'all' | BlogPostType) ?? 'all')}
					>
						<ToggleButton value="all" label="All ({counts.all})" />
						{#each availableTypes as type (type)}
							<ToggleButton value={type} label="{POST_TYPE_LABELS[type]} ({counts[type]})" />
						{/each}
					</ToggleButtonGroup>
				</div>
			{/if}

			{#if filtered.length === 0}
				<EmptyState
					title="No posts yet"
					description="Check back soon for releases, guides, and stories."
				/>
			{:else}
				<VStack gap={10}>
					{#if featurePost}
						<BlogCard post={featurePost} feature />
					{/if}
					{#if restPosts.length > 0}
						<div class="post-grid">
							{#each restPosts as post (post.slug)}
								<BlogCard {post} />
							{/each}
						</div>
					{/if}
				</VStack>
			{/if}
		</VStack>
	</Section>
</div>

<style>
	.blog-index :global(> *) {
		margin-inline: auto;
	}

	.type-filter :global(> *) {
		flex-wrap: wrap;
		justify-content: center;
	}

	/*
		Upstream's `postGrid`. `min(320px, 100%)` clamps the track to the container
		so a 320px column never overflows a narrower viewport — without it the grid
		is the one thing on the page that scrolls sideways on a small phone.
	*/
	.post-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
		column-gap: var(--spacing-5);
		row-gap: var(--spacing-10);
	}
</style>
