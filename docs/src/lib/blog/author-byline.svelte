<script module lang="ts">
	/**
	 * Format an ISO date for display — upstream's `formatDate`.
	 *
	 * Parsed as UTC and formatted in UTC, which is upstream's own guard and not a
	 * detail to drop: `new Date('2026-08-10')` is midnight **UTC**, so a reader
	 * west of Greenwich formatting in local time gets the 9th.
	 */
	export function formatDate(iso: string): string {
		const d = new Date(iso + 'T00:00:00Z');
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			timeZone: 'UTC'
		});
	}
</script>

<script lang="ts">
	import { Avatar, AvatarGroup, Divider, HStack, Link, Text } from '@astryx-svelte/core';
	import { resolveAuthor } from '../../content/blog/authors.js';

	/**
	 * The blog byline — upstream's `AuthorByline`: author avatars and names, the
	 * publish date, an optional updated date, and reading time, divided by hairline
	 * rules.
	 *
	 * **`linkAuthors` is only true in the `full` variant, and that is a
	 * correctness constraint rather than a style choice.** Upstream states it: the
	 * compact byline renders *inside* `blog-card`'s card-wide `<a>`, and a nested
	 * anchor is invalid HTML. React breaks hydration on it; Svelte would emit it
	 * and let the browser silently reparent the inner link out of the card, which
	 * is the quieter and worse failure.
	 */
	interface Props {
		authors: string[];
		date: string;
		updatedAt?: string | null;
		readingTimeMinutes?: number;
		variant?: 'compact' | 'full';
		/** Set by `blog-card` so its hover rule can reach the byline's text. */
		class?: string;
	}

	const {
		authors,
		date,
		updatedAt = null,
		readingTimeMinutes,
		variant = 'compact',
		class: className
	}: Props = $props();

	const resolved = $derived(authors.map(resolveAuthor));
	const avatarSize = $derived(variant === 'full' ? 'md' : 'xsm');
	const textType = $derived(variant === 'full' ? 'body' : 'supporting');
	const linkAuthors = $derived(variant === 'full');
</script>

<div class={className}>
	<HStack gap={variant === 'full' ? 4 : 2} align="center">
		{#if resolved.length > 0}
			<AvatarGroup size={avatarSize}>
				{#each resolved as author (author.key)}
					<Avatar src={author.avatar} name={author.name} />
				{/each}
			</AvatarGroup>
			<Text type={textType} color="secondary">
				{#each resolved as author, i (author.key)}
					{i > 0 ? ', ' : ''}{#if linkAuthors && author.href}<Link
							href={author.href}
							type={textType}
							color="secondary"
							target="_blank"
							rel="noopener noreferrer">{author.name}</Link
						>{:else}{author.name}{/if}
				{/each}
			</Text>
			<div class="rule"><Divider orientation="vertical" /></div>
		{/if}
		<Text type={textType} color="secondary">{formatDate(date)}</Text>
		{#if variant === 'full' && updatedAt}
			<div class="rule"><Divider orientation="vertical" /></div>
			<Text type={textType} color="secondary">Updated {formatDate(updatedAt)}</Text>
		{/if}
		{#if readingTimeMinutes}
			<div class="rule"><Divider orientation="vertical" /></div>
			<Text type={textType} color="secondary">{readingTimeMinutes} min read</Text>
		{/if}
	</HStack>
</div>

<style>
	/*
		Upstream's `styles.divider`, which is `height: 0.75em` on the `Divider`
		itself. `xstyle` is a StyleX prop and StyleX cannot be imported from a
		`.svelte` file, so the height goes on a wrapper the divider fills — the
		same substitution the rest of the docs shell uses.
	*/
	.rule {
		display: flex;
		align-self: center;
		height: 0.75em;
	}
</style>
