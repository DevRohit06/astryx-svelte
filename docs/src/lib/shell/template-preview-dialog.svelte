<script lang="ts" module>
	/**
	 * Upstream's `TemplatePreviewItem`, minus the two fields nothing here reads.
	 *
	 * `source` is gone with the registry field it mirrored — it exists upstream to
	 * hand a `page.tsx` to the playground, which this port does not have. So is
	 * `category`, which upstream reads only inside `trackCopy` /
	 * `trackOpenPlayground`; this site ships no analytics, so carrying it would be
	 * a field whose only purpose is to be passed and dropped.
	 */
	export interface TemplatePreviewItem {
		slug: string;
		name: string;
		description?: string;
	}
</script>

<script lang="ts">
	import {
		Button,
		Code,
		Dialog,
		HStack,
		Heading,
		Icon,
		Layout,
		LayoutContent,
		LayoutHeader,
		Skeleton,
		Text,
		Tooltip,
		VStack
	} from '@astryx-svelte/core';
	import ComponentPreviewTheme from './component-preview-theme.svelte';
	import { templateImporterFor } from './example-modules.js';

	/**
	 * One page template, full-bleed in a modal — upstream's
	 * `TemplatePreviewDialog`.
	 *
	 * It is the gallery's detail view: upstream's `/templates/[slug]` is a
	 * redirect to `/templates?preview=<slug>`, so this dialog *is* the template
	 * page, and the query string is its address. The gallery owns that round trip;
	 * this component owns the frame, the header and prev/next.
	 *
	 * Upstream's preview surface is a separate file (`TemplatePreviewSurface.tsx`
	 * plus a CSS module). It is inlined here because, once the playground button
	 * and the analytics calls are gone, what remains is one framed `<div>` with a
	 * lazy import in it — and it has exactly one caller.
	 *
	 * **Two of upstream's mechanisms have no counterpart and are not faked:**
	 *
	 * (A third bullet used to sit here claiming upstream's
	 * `<Theme theme={neutralTheme}>` around the template was "a second boundary at
	 * the same values", hence a no-op. It is not: this site's ambient theme is
	 * `astryxTheme`, so the boundary *switches* the template to neutral. It is
	 * ported, as `ComponentPreviewTheme`.)
	 *
	 * - `useTransition` + `useDeferredValue`, which keep the *previous* template
	 *   on screen while the next one's chunk loads and paint a `Skeleton` overlay
	 *   over it. Svelte has neither. What replaces them is what the surface
	 *   already had to do anyway: `{#await}` shows the same `Skeleton` in the same
	 *   box while the import resolves. The visible difference is that the frame
	 *   goes blank-with-skeleton rather than stale-with-skeleton for the length of
	 *   one chunk fetch.
	 * - The `useEffect` that resets the copied flag on every index change. Keying
	 *   the flag to the slug it was set for ({@link copiedSlug}) makes the reset
	 *   fall out of a `$derived`, so there is no effect to keep in step.
	 *
	 * **"Open in Playground" is dropped**, in the header and on the gallery tile
	 * alike: `/playground` is not in this port (port/todo.md), and `nav-items.ts`'s
	 * standing rule is that linking to a 404 is worse than not linking.
	 */
	interface Props {
		/** The gallery's current display order — prev/next walks exactly this list. */
		items: TemplatePreviewItem[];
		/** Index into `items` of the template to show. */
		index: number;
		isOpen: boolean;
		onOpenChange: (isOpen: boolean) => void;
		/** Request a different template (prev/next). */
		onIndexChange: (index: number) => void;
		/** `fullscreen` on mobile, for an edge-to-edge preview. */
		variant?: 'fullscreen';
	}

	const { items, index, isOpen, onOpenChange, onIndexChange, variant }: Props = $props();

	const count = $derived(items.length);
	const current = $derived(items[index]);
	const isFullscreen = $derived(variant === 'fullscreen');

	const previous = $derived(count > 0 ? items[(index - 1 + count) % count] : undefined);
	const next = $derived(count > 0 ? items[(index + 1) % count] : undefined);

	/**
	 * The scaffold command, and the one place this file knowingly says something
	 * other than upstream's words.
	 *
	 * Upstream prints `npx @astryxdesign/cli template <slug> ./src/app/<slug>`.
	 * Both halves are wrong here. `@astryx-svelte/cli` is a **private** package,
	 * so `npx` cannot resolve it — the same fact `package-actions.svelte` refuses
	 * to print an `npm install` over — and the bare bin is what upstream itself
	 * hard-codes at all but five of its own command hints (port/todo.md, 2026-08-08).
	 * And the destination is a SvelteKit route directory, because the file the
	 * CLI copies is `+page.svelte` rather than `page.tsx`
	 * (`api/template/_adapter.mjs`'s `PAGE_SOURCE_FILE`).
	 */
	const command = $derived(
		current ? `astryx-svelte template ${current.slug} ./src/routes/${current.slug}` : ''
	);

	const load = $derived(current ? templateImporterFor(current.slug) : null);

	/**
	 * The slug whose command is on the clipboard, rather than a bare boolean.
	 *
	 * Upstream needs `useEffect(() => setCmdCopied(false), [index])` because its
	 * flag knows nothing about which template it belongs to. Recording the slug
	 * instead makes "is *this* template's command copied" a comparison, so moving
	 * to the next template resets the button with no effect and no ordering
	 * question about which of the two writes lands last.
	 */
	let copiedSlug = $state<string | null>(null);
	const isCopied = $derived(copiedSlug != null && copiedSlug === current?.slug);
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	function go(delta: number): void {
		if (count === 0) return;
		onIndexChange((index + delta + count) % count);
	}

	function copyCommand(): void {
		const slug = current?.slug;
		if (slug == null) return;
		void navigator.clipboard.writeText(command).then(() => {
			copiedSlug = slug;
			// A second copy inside the two seconds would otherwise be cleared early
			// by the first click's timer.
			clearTimeout(resetTimer);
			resetTimer = setTimeout(() => (copiedSlug = null), 2000);
		});
	}

	/**
	 * Arrow keys, on `window` rather than the dialog, as upstream binds them.
	 *
	 * Escape is not handled here: `Dialog` owns it, and its handler already defers
	 * to any layer stacked on top so one press closes only the top-most thing.
	 *
	 * Upstream's dependency array is `[isOpen, index, count]` — a React handler
	 * closes over the render's values, so it has to resubscribe whenever the index
	 * moves. `go` reads `index` and `count` through props and a `$derived` at call
	 * time, so this effect depends on `isOpen` alone and the listener is installed
	 * once per open.
	 */
	$effect(() => {
		if (!isOpen) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'ArrowLeft') {
				event.preventDefault();
				go(-1);
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				go(1);
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	});
</script>

{#snippet unavailable()}
	<div class="preview-empty">
		<Text type="body" color="secondary">
			A live preview isn&rsquo;t available for this template yet.
		</Text>
	</div>
{/snippet}

{#snippet chevronLeftIcon()}
	<Icon icon="chevronLeft" color="inherit" />
{/snippet}

{#snippet chevronRightIcon()}
	<Icon icon="chevronRight" color="inherit" />
{/snippet}

<!--
	Upstream returns `null` when the index addresses nothing — a filter change can
	leave `?preview=` pointing outside the list. The `{#if}` is that, and it also
	narrows `current` for everything below, which is what `{@const item}` carries
	into the snippets.
-->
{#if current}
	{@const item = current}

	{#snippet metadata()}
		<VStack
			gap={0.5}
			style={isFullscreen ? 'min-width: 0; padding-inline-end: 48px;' : 'flex: 1; min-width: 0;'}
		>
			<Heading level={2}>{item.name}</Heading>
			{#if item.description}
				<Text type="body" color="secondary">{item.description}</Text>
			{/if}
		</VStack>
	{/snippet}

	{#snippet copyIcon()}
		<Icon icon={isCopied ? 'check' : 'copy'} color="inherit" />
	{/snippet}

	{#snippet closeIcon()}
		<Icon icon="close" color="inherit" />
	{/snippet}

	{#snippet closeButton()}
		<Button
			variant="secondary"
			isIconOnly
			label="Close preview"
			size="lg"
			icon={closeIcon}
			onclick={() => onOpenChange(false)}
			style={isFullscreen ? 'position: absolute; top: 0; inset-inline-end: 0;' : undefined}
		/>
	{/snippet}

	{#snippet actions()}
		<HStack gap={2} vAlign="center" style={isFullscreen ? 'width: 100%; min-width: 0;' : undefined}>
			<HStack gap={2} vAlign="center">
				<Code>{command}</Code>
				<Button
					variant="ghost"
					isIconOnly
					size="lg"
					label={isCopied ? 'Copied!' : 'Copy install command'}
					icon={copyIcon}
					onclick={copyCommand}
				/>
			</HStack>
			{#if !isFullscreen}
				{@render closeButton()}
			{/if}
		</HStack>
	{/snippet}

	{#snippet header()}
		<LayoutHeader style="box-sizing: border-box; padding-inline-start: 8px;">
			{#if isFullscreen}
				<VStack gap={3} style="width: 100%; position: relative;">
					{@render metadata()}
					{@render actions()}
					{@render closeButton()}
				</VStack>
			{:else}
				<HStack gap={4} vAlign="start" style="width: 100%; position: relative;">
					{@render metadata()}
					{@render actions()}
				</HStack>
			{/if}
		</LayoutHeader>
	{/snippet}

	{#snippet content()}
		<LayoutContent isScrollable={false} padding={0}>
			<div class="preview-body">
				<!--
					Keyed on the slug, as upstream keys its surface: without it the
					outgoing template's component instance would be reused for the
					incoming one, and a page that holds state (a selected table row, an
					open panel) would show the previous template's state under the new
					template's markup.
				-->
				{#key item.slug}
					<div class="preview-frame">
						{#if load}
							<svelte:boundary>
								{#await load()}
									<Skeleton width="100%" height="100%" />
								{:then module}
									{@const Template = module.default}
									<ComponentPreviewTheme><Template /></ComponentPreviewTheme>
								{:catch}
									{@render unavailable()}
								{/await}

								{#snippet failed()}
									{@render unavailable()}
								{/snippet}
							</svelte:boundary>
						{:else}
							{@render unavailable()}
						{/if}
					</div>
				{/key}
			</div>
		</LayoutContent>
	{/snippet}

	<Dialog
		{isOpen}
		{onOpenChange}
		{variant}
		width={isFullscreen ? undefined : 1400}
		maxHeight={isFullscreen ? undefined : '92vh'}
		style={isFullscreen ? undefined : 'height: 86vh; border-radius: var(--radius-page);'}
		aria-label={item.name}
	>
		<Layout height="fill" {header} {content} />

		<!--
			The arrows are `position: fixed` *inside* the top-layer `<dialog>`, which
			is what puts them in the backdrop gutters either side of the dialog box
			rather than inside it. Upstream's arrangement exactly, including hiding
			them in fullscreen, where there are no gutters.
		-->
		{#if count > 1 && !isFullscreen}
			<div class="nav-arrow nav-prev">
				<Tooltip content="Previous: {previous?.name ?? ''}" placement="end">
					<Button
						variant="secondary"
						size="lg"
						isIconOnly
						label="Previous template"
						icon={chevronLeftIcon}
						onclick={() => go(-1)}
					/>
				</Tooltip>
			</div>
			<div class="nav-arrow nav-next">
				<Tooltip content="Next: {next?.name ?? ''}" placement="start">
					<Button
						variant="secondary"
						size="lg"
						isIconOnly
						label="Next template"
						icon={chevronRightIcon}
						onclick={() => go(1)}
					/>
				</Tooltip>
			</div>
		{/if}
	</Dialog>
{/if}

<style>
	/* Upstream's `styles.body` — the padded box the frame fills. */
	.preview-body {
		position: relative;
		display: flex;
		box-sizing: border-box;
		height: 100%;
		min-height: 0;
		padding-inline: 16px;
		padding-block-end: 16px;
	}

	/*
	 * Upstream's `TemplatePreviewSurface.module.css .frame` — the preview
	 * "window", and the single scroll container. A fill-height template fits it
	 * exactly and scrolls its own content region; an auto-height template taller
	 * than the frame scrolls here rather than pushing the document.
	 *
	 * The surface colour is load-bearing, not decoration: page templates are
	 * content-only (no `AppShell`) and render transparent, so the host has to
	 * supply the page background or the template reads as floating on the dialog.
	 */
	.preview-frame {
		position: relative;
		flex: 1 1 auto;
		width: 100%;
		max-width: 1600px;
		min-height: 0;
		margin-inline: auto;
		overflow: auto;
		background-color: var(--color-background-surface);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-container);
	}

	.preview-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		padding: var(--spacing-8);
	}

	.nav-arrow {
		position: fixed;
		top: 50%;
		z-index: 1000;
		transform: translateY(-50%);
	}

	.nav-prev {
		inset-inline-start: var(--spacing-5);
	}

	.nav-next {
		inset-inline-end: var(--spacing-5);
	}

	/*
	 * Upstream's `navArrowButton` xstyle, which a `.svelte` file cannot express —
	 * StyleX may not be imported here. `:global` on the stable `.astryx-button`
	 * class is the remaining channel and the one the theme layer itself uses;
	 * `Tooltip` wraps its trigger in `display: contents`, so the descendant
	 * selector still reaches the button through it.
	 */
	.nav-arrow :global(.astryx-button) {
		background-color: var(--color-background-card);
		border-radius: var(--radius-full);
		box-shadow: var(--shadow-high);
	}
</style>
