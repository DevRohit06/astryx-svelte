<script lang="ts">
	import { Text } from '@astryx-svelte/core';

	/**
	 * The generated cover for release posts — upstream's `ReleaseCoverArt`.
	 *
	 * The version renders in the brand colour on a soft pastel field, with the
	 * Astryx mark as the separator between segments and the package name beneath.
	 * It is inline markup, not an `<img>`, so it scales and re-themes with the
	 * page. `blog-card` and `blog-article` reach for it when
	 * `parseReleaseVersion` finds a version in the post title.
	 *
	 * **Everything sizes in `cqw`, and the container query is why there are two
	 * elements rather than one.** Upstream calls this out and it is easy to
	 * collapse by accident: an element is not its own query container, so putting
	 * `gap` on the same element that declares `container-type: size` resolves it
	 * against the *viewport* instead of the cover. The cover would then look right
	 * at full width and wrong in a card. The root declares the container; the
	 * inner `.content` carries the gap.
	 *
	 * `color-scheme: light` is pinned on the root for the same reason upstream
	 * pins it: the field colour is fixed, so any `light-dark()` token resolving
	 * inside it must take its light branch or the text picks dark-mode values
	 * against a permanently light background.
	 */
	interface Props {
		/** Semantic version without the leading `v` (e.g. "0.3.0"). */
		version: string;
		/** The package label rendered beneath the version. */
		packageName?: string;
	}

	const { version, packageName = '@astryx-svelte/core' }: Props = $props();

	const segments = $derived(version.split('.'));

	/**
	 * The Astryx mark, 40×40 — the same path `shell/astryx-logo.svelte` and the
	 * favicon draw. Upstream's copy in this file is itself mirrored from
	 * `BlogCoverArt`.
	 */
	const MARK_PATH =
		'M11.2002 0C14.7347 0.000105757 17.6 2.8654 17.6001 6.3999V11.2002C17.6002 12.3047 18.4956 13.2002 19.6001 13.2002H20.3999C21.5044 13.2002 22.3998 12.3047 22.3999 11.2002V6.3999C22.4 2.8654 25.2653 0.000106275 28.7998 0H37.6001C38.9255 5.15369e-05 39.9999 1.07451 40 2.3999V11.2002C39.9999 14.7347 37.1346 17.6 33.6001 17.6001H28.7998C27.6953 17.6002 26.7998 18.4956 26.7998 19.6001V20.3999C26.7998 21.5044 27.6953 22.3998 28.7998 22.3999H33.6001C37.1346 22.4 39.9999 25.2653 40 28.7998V37.6001C40 38.9255 38.9255 39.9999 37.6001 40H28.7998C25.2653 39.9999 22.3999 37.1346 22.3999 33.6001V28.7998C22.3998 27.6953 21.5044 26.7998 20.3999 26.7998H19.6001C18.4956 26.7998 17.6002 27.6953 17.6001 28.7998V33.6001C17.6001 37.1346 14.7347 39.9999 11.2002 40H2.39991C1.07449 39.9999 3.97232e-05 38.9255 0 37.6001V28.7998C0.000118127 25.2653 2.86539 22.4 6.3999 22.3999H11.2002C12.3047 22.3998 13.2002 21.5044 13.2002 20.3999V19.6001C13.2002 18.4956 12.3047 17.6002 11.2002 17.6001H6.3999C2.86538 17.6 9.39063e-05 14.7347 0 11.2002V2.3999C6.46793e-05 1.07451 1.07451 5.28641e-05 2.39991 0H11.2002Z';
</script>

<div class="cover" role="presentation" aria-hidden="true">
	<div class="content">
		<div class="row">
			{#each segments as segment, i (i)}
				{#if i > 0}
					<svg class="mark" viewBox="0 0 40 40"><path d={MARK_PATH} /></svg>
				{/if}
				<span class="version"><Text type="code" weight="semibold">{segment}</Text></span>
			{/each}
		</div>
		<span class="handle"><Text type="code" color="secondary" as="div">{packageName}</Text></span>
	</div>
</div>

<style>
	.cover {
		container-type: size;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background-color: var(--astryx-marketing-feature-card-bg);
		color-scheme: light;
		user-select: none;
	}

	/* Carries the vertical gap — see the note in the docstring for why this
	   cannot be merged into `.cover`. */
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.8cqw;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 1.1cqw;
	}

	/* The font sizing has to reach the `Text` element itself, which renders
	   inside these wrappers, so both rules are inherited-through rather than set
	   on a wrapper the text ignores. */
	.version,
	.version :global(*) {
		color: var(--color-brand);
		font-size: 14.7cqw;
		line-height: 1;
	}

	.handle,
	.handle :global(*) {
		font-size: 2.3cqw;
	}

	.mark {
		display: block;
		flex-shrink: 0;
		width: 3.3cqw;
		height: 3.3cqw;
		fill: var(--color-brand);
		/* Sits low so the mark reads as the "dot" between version segments. */
		transform: translateY(2.1cqw);
	}
</style>
