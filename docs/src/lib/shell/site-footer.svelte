<script lang="ts">
	import {
		Divider,
		Grid,
		GridSpan,
		HStack,
		Link,
		Section,
		Text,
		VStack
	} from '@astryx-svelte/core';
	import AstryxLogo from './astryx-logo.svelte';
	import { AUTHOR_NAME, AUTHOR_URL, FOOTER_LINKS, REPO_URL, UPSTREAM_URL } from './nav-items.js';
	import { homeHref } from './links.js';

	/**
	 * The site footer, on every route as upstream's `SiteFooter` is.
	 *
	 * Built from the design system's own components — `Section role="contentinfo"`,
	 * `Grid`/`GridSpan`, `HStack`, `Link type="supporting" color="secondary"
	 * isStandalone`, `Divider`, `Text` — which is upstream's structure, and which
	 * the raw `<footer>`/`<nav>`/`<a>` markup this replaced was only imitating.
	 * The five-column grid with the mark at the start, the links centred across
	 * three columns, and the repo links at the end is upstream's top row; the
	 * divider and the notice below it are upstream's second row.
	 *
	 * **What is deliberately not upstream's:** the social and legal blocks. Those
	 * are Meta's accounts and Meta's terms, and this port ships neither its
	 * trademarks nor its accounts — the "unofficial / not affiliated" notice
	 * (port/todo.md → Release & governance) is what belongs in that space instead.
	 *
	 * The second row's attribution follows the shape shadcn-svelte uses — "Built
	 * by shadcn. Ported to Svelte by Huntabyte." — which is the established
	 * convention for a port's docs site: credit upstream first, then the port,
	 * then link the source. The not-affiliated notice rides on the same line
	 * because it is the same governance requirement it always was.
	 *
	 * Upstream swaps to a stacked layout via `useAppShellMobile()`. The breakpoint
	 * here is a media query, so both arrangements are the same elements — the
	 * server's HTML is right at every width rather than right at one.
	 */
	const year = new Date().getFullYear();
</script>

<Section role="contentinfo" padding={6}>
	<VStack gap={4}>
		<div class="footer-top">
			<Grid columns={5} align="center">
				<Link href={homeHref()} label="astryx-svelte">
					<AstryxLogo size={18} isDecorative />
				</Link>

				<GridSpan columns={3}>
					<HStack gap={4} wrap="wrap" align="center" hAlign="center">
						{#each FOOTER_LINKS as item (item.href)}
							<Link href={item.href} type="supporting" color="secondary" isStandalone>
								{item.label}
							</Link>
						{/each}
						<Link href={REPO_URL} type="supporting" color="secondary" isStandalone target="_blank">
							GitHub
						</Link>
						<Link
							href={UPSTREAM_URL}
							type="supporting"
							color="secondary"
							isStandalone
							target="_blank"
						>
							Astryx
						</Link>
					</HStack>
				</GridSpan>
			</Grid>
		</div>

		<Divider />

		<Text type="supporting" color="secondary">
			Built by <Link href={UPSTREAM_URL} type="supporting" color="secondary" target="_blank"
				>Meta</Link
			>. Ported to Svelte by <Link
				href={AUTHOR_URL}
				type="supporting"
				color="secondary"
				target="_blank">{AUTHOR_NAME}</Link
			>. The source code is available on
			<Link href={REPO_URL} type="supporting" color="secondary" target="_blank">GitHub</Link>.
			Unofficial and not affiliated with Meta. ©{year}
		</Text>
	</VStack>
</Section>

<style>
	/* Upstream's mobile branch stacks the row and centres it; `useAppShellMobile`
	   has no counterpart here, so the same elements re-flow with CSS. */
	@media (max-width: 768px) {
		.footer-top {
			display: flex;
			justify-content: center;
		}
	}
</style>
