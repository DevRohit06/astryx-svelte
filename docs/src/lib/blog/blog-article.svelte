<script lang="ts">
	import {
		AspectRatio,
		Badge,
		BreadcrumbItem,
		Breadcrumbs,
		ClickableCard,
		Divider,
		Grid,
		HStack,
		Heading,
		Icon,
		Markdown,
		Section,
		Text,
		VStack
	} from '@astryx-svelte/core';
	import type { BlogPost } from './schema.js';
	import { POST_TYPE_LABELS } from './schema.js';
	import InlineMarkdown from '$lib/shell/inline-markdown.svelte';
	import AuthorByline from './author-byline.svelte';
	import ReleaseCoverArt from './release-cover-art.svelte';
	import { parseReleaseVersion } from './release.js';

	/**
	 * A full blog post — upstream's `BlogArticle`: breadcrumb, title, dek, byline,
	 * cover, prose, tags and related docs.
	 *
	 * The body renders through core's `Markdown` with `headingLevelStart={2}`,
	 * which is upstream's value and not incidental: the post title is the page's
	 * `h1`, so a `#` in the markdown body has to start at `h2` or the document
	 * grows a second top-level heading.
	 *
	 * The **dek** goes through `inline-markdown` rather than `Markdown`, matching
	 * upstream's `MarkdownText`. It is a single line that may carry a link, and
	 * running it through the block renderer would wrap it in a `<p>` inside the
	 * `<Text>` that styles it.
	 *
	 * **The type-scale override is on the section**, as upstream's is: the blog
	 * body reads 17px/1.647 rather than the docs default, and re-declaring the
	 * tokens here scopes that to the article. Upstream assigns
	 * `typeScaleVars[…]` through StyleX; StyleX cannot be imported from a
	 * `.svelte` file, so the same four custom properties are set in the scoped
	 * block below. Title (`display-1`) and dek (`large`) read different tokens, so
	 * only the body moves — except `--text-large-*`, which upstream also
	 * re-declares here and which the dek does read.
	 */
	interface Props {
		post: BlogPost;
	}

	const { post }: Props = $props();

	const releaseVersion = $derived(parseReleaseVersion(post.title));
</script>

<div class="article">
	<Section maxWidth={800} padding={6}>
		<VStack gap={10}>
			<VStack gap={4}>
				<Breadcrumbs>
					<BreadcrumbItem href="/blog">Blog</BreadcrumbItem>
					<BreadcrumbItem isCurrent>{POST_TYPE_LABELS[post.type]}</BreadcrumbItem>
				</Breadcrumbs>
				<Heading level={1} type="display-1">{post.title}</Heading>
				<Text type="large" weight="normal" color="secondary">
					<InlineMarkdown text={post.dek ?? post.description} />
				</Text>
				<AuthorByline
					authors={post.authors}
					date={post.date}
					updatedAt={post.updatedAt}
					readingTimeMinutes={post.readingTimeMinutes}
					variant="full"
				/>
				<Divider />
			</VStack>

			{#if post.coverImage}
				<div class="cover">
					<AspectRatio ratio={16 / 9}>
						<img class="cover-img" src={post.coverImage} alt={post.coverAlt ?? ''} />
					</AspectRatio>
				</div>
			{:else if releaseVersion}
				<div class="cover">
					<AspectRatio ratio={16 / 9}>
						<ReleaseCoverArt
							version={releaseVersion}
							packageName={post.releasePackage ?? undefined}
						/>
					</AspectRatio>
				</div>
			{/if}

			<!-- `children` is a string prop here, not a snippet — core's `Markdown`
			     takes the source as `children: string`, so upstream's JSX child
			     becomes an attribute rather than slot content. -->
			<Markdown children={post.body} headingLevelStart={2} contentWidth="100%" />

			{#if post.tags.length > 0}
				<div class="tag-row">
					<HStack gap={1}>
						{#each post.tags as tag (tag)}
							<Badge label={tag} variant="neutral" />
						{/each}
					</HStack>
				</div>
			{/if}

			{#if post.relatedDocs && post.relatedDocs.length > 0}
				<VStack gap={6}>
					<Divider />
					<Heading level={2} type="display-3">Related</Heading>
					<Grid columns={{ minWidth: 280, repeat: 'fill' }} gap={2}>
						{#each post.relatedDocs as doc (doc.href)}
							<ClickableCard href={doc.href} label={doc.title} padding={3} variant="muted">
								<HStack justify="between" align="center" gap={2}>
									<Text type="body" weight="medium">{doc.title}</Text>
									<Icon icon="chevronRight" size="sm" color="secondary" />
								</HStack>
							</ClickableCard>
						{/each}
					</Grid>
				</VStack>
			{/if}
		</VStack>
	</Section>
</div>

<style>
	.article {
		/* Upstream's four `typeScaleVars` assignments, as plain custom properties.
		   Scoped to the article so the docs pages keep their own body treatment. */
		--text-body-size: 1.0625rem;
		--text-body-leading: 1.6470588235;
		--text-large-size: 1.25rem;
		--text-large-leading: 2rem;
	}

	.article :global(> *) {
		margin-inline: auto;
	}

	.cover {
		overflow: hidden;
		background-color: var(--color-background-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-container);
	}

	.cover-img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.tag-row :global(> *) {
		flex-wrap: wrap;
	}
</style>
