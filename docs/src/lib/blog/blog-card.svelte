<script lang="ts">
	import { AspectRatio, Heading, Link, Text, VStack } from '@astryx-svelte/core';
	import type { BlogPost } from './schema.js';
	import { parseReleaseVersion } from './release.js';
	import AuthorByline from './author-byline.svelte';
	import ReleaseCoverArt from './release-cover-art.svelte';

	/**
	 * A post on the blog index — upstream's `BlogCard`: cover, title, excerpt and
	 * a compact byline, the whole tile one link. The `feature` variant (the latest
	 * post) renders larger.
	 *
	 * The cover has three arms, in upstream's order: an authored `coverImage`
	 * wins; otherwise a title carrying a version renders `release-cover-art`;
	 * otherwise upstream falls through to its generative `BlogCoverArt`, **which
	 * this port has not yet built** — see port/todo.md. Until it does, a non-release
	 * post with no `coverImage` gets the muted field and nothing on it, so the
	 * card still lays out rather than collapsing.
	 *
	 * The hover treatment is a plain scoped rule, as upstream's `BlogCard.module.css`
	 * is — it reaches through the card link to tint the cover and promote the
	 * secondary text, and needs no StyleX marker machinery on either side.
	 */
	interface Props {
		post: BlogPost;
		feature?: boolean;
		/** Hide the excerpt (upstream uses this to keep the home showcase tight). */
		hideDescription?: boolean;
	}

	const { post, feature = false, hideDescription = false }: Props = $props();

	const releaseVersion = $derived(parseReleaseVersion(post.title));
</script>

<div class="card" class:card--feature={feature}>
	<Link href="/blog/{post.slug}" label={post.title} color="inherit" display="block">
		<VStack gap={feature ? 4 : 3}>
			<div class="cover">
				<AspectRatio ratio={16 / 9}>
					{#if post.coverImage}
						<img class="cover-img" src={post.coverImage} alt={post.coverAlt ?? ''} />
					{:else if releaseVersion}
						<ReleaseCoverArt
							version={releaseVersion}
							packageName={post.releasePackage ?? undefined}
						/>
					{/if}
				</AspectRatio>
			</div>
			<VStack gap={3}>
				<VStack gap={1}>
					<Heading level={feature ? 1 : 3}>{post.title}</Heading>
					{#if !hideDescription}
						<div class="excerpt">
							<Text type={feature ? 'large' : 'body'} weight="normal" color="secondary">
								{post.description}
							</Text>
						</div>
					{/if}
				</VStack>
				<AuthorByline
					authors={post.authors}
					date={post.date}
					readingTimeMinutes={post.readingTimeMinutes}
					variant="compact"
					class="byline"
				/>
			</VStack>
		</VStack>
	</Link>
</div>

<style>
	.card {
		width: 100%;
		height: 100%;
	}

	.card :global(a) {
		color: inherit;
		text-decoration: none;
	}

	.cover {
		position: relative;
		overflow: hidden;
		background-color: var(--color-background-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-container);
	}

	/* Upstream's `.cover::after` — the hover tint, painted over the cover rather
	   than on it so an authored image is tinted too. */
	.cover::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-color: transparent;
		transition: background-color var(--duration-fast) var(--ease-standard);
	}

	.cover-img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Two lines, then ellipsis. The `-webkit-` prefixed line-clamp is what
	   upstream uses and is still the only form Safari honours. */
	.excerpt :global(*) {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Below 720px the grid is one column, so the feature card's type drops to
	   match the regular cards and the stack reads evenly. */
	.card--feature :global(h1) {
		font-size: var(--text-heading-3-size);
		line-height: var(--text-heading-3-leading);
	}

	@media (min-width: 720px) {
		.card--feature :global(h1) {
			font-size: var(--text-heading-1-size);
			line-height: var(--text-heading-1-leading);
		}
	}

	@media (hover: hover) {
		.card:hover .cover::after {
			background-color: color-mix(in srgb, currentColor 5%, transparent);
		}

		.card:hover .excerpt :global(*),
		.card:hover :global(.byline *) {
			color: var(--color-text-primary);
		}
	}
</style>
