<script lang="ts">
	import { page } from '$app/state';
	import { Icon, SideNav, SideNavItem, SideNavSection, TextInput } from '@astryx-svelte/core';
	import componentGroups from '$lib/generated/component-groups.js';
	import docsRegistry from '$lib/generated/docs-registry.js';
	import packageRegistry from '$lib/generated/package-registry.js';
	import type { SidebarEntry } from '$lib/generated/types.js';
	import { componentHref, componentsHref, topicHref } from './links.js';

	/**
	 * The docs sidebar — **now the real `SideNav`**, the other thing batch 10 was
	 * for. It was hand-built at v1 behind this seam because `SideNav`,
	 * `SideNavSection` and `SideNavItem` were unported; only the search field was
	 * already a shipped component. Now all four are, and the tree is composed
	 * rather than marked up.
	 *
	 * The mode switch is unchanged, because it is upstream's `DocsShell` behaviour
	 * and not an artefact of the hand-built version: under `/components` it lists
	 * the component registry grouped as the generator grouped it, with a filter
	 * box pinned in `topContent`; everywhere else it lists the doc topics grouped
	 * Guide / Foundations. Filtering flattens the groups to one level and drops the
	 * Overview row, exactly as upstream's does.
	 *
	 * **How upstream nests a group, and what this had wrong.** `DocsShell` gives
	 * every group a `SideNavSection … isHeaderHidden` — the section exists to name
	 * a `role="group"` for assistive tech, not to print a label — and the *visible*
	 * row is a `SideNavItem collapsible` inside it carrying the group's name. That
	 * is what supplies the chevron, the `aria-expanded`/`aria-controls` pair and
	 * the one-level indent (label at x=16, children at x=40, measured on
	 * astryx.atmeta.com). Guide and Foundations were rendered here as *visible*
	 * `SideNavSection` headers instead, so the group name was inert text and its
	 * children sat at the label's own x with no hierarchy to read. The components
	 * mode already had the right shape; it was missing only the section wrapper.
	 *
	 * **`Libraries` has landed; `What's New` has not.** `DocsShell` lists both —
	 * a `Libraries` group over its `packageRegistry` and a `What's New` row at
	 * `/changelog`. The group is here now that `/docs/core` and `/docs/cli` are
	 * real pages; the row is not, because there is no `/changelog` route and no
	 * changelog data (port/todo.md keeps it out of the v1 cut), and a nav row pointing
	 * at a 404 is worse than its absence.
	 *
	 * The group reads the **slim** `package-registry.js`, never the README text
	 * that goes with it. This component is mounted by the root layout on every
	 * page, so importing the markdown here would put ~40 KB of it in the layout
	 * chunk for all 236 pages — the `component-groups.js` leak again.
	 *
	 * Two things the swap changes, both improvements that came free:
	 *
	 * - The collapsible groups were `<details>`/`<summary>`; they are now
	 *   `SideNavItem collapsible`, so they animate, carry `aria-expanded` and
	 *   `aria-controls`, and expose their children as a labelled `role="group"`.
	 * - Inside `AppShell`'s mobile drawer this same component renders in
	 *   `drawer-content` mode without being told to, and activating a row closes
	 *   the drawer. The hand-built version had no drawer at all.
	 */

	const pathname = $derived(page.url.pathname);
	const isComponentsMode = $derived(pathname.startsWith('/components'));

	let query = $state('');
	const needle = $derived(query.trim().toLowerCase());

	// --- mode A: doc topics -------------------------------------------------

	const guideTopics = $derived(
		docsRegistry
			.filter((topic) => topic.category === 'guide' && topic.name !== 'getting-started')
			.sort((a, b) => a.title.localeCompare(b.title))
	);

	// Upstream forces Tokens first, then sorts the rest by title.
	const foundationTopics = $derived(
		docsRegistry
			.filter((topic) => topic.category === 'foundations')
			.sort((a, b) =>
				a.name === 'tokens' ? -1 : b.name === 'tokens' ? 1 : a.title.localeCompare(b.title)
			)
	);

	const gettingStarted = $derived(docsRegistry.find((topic) => topic.name === 'getting-started'));

	// --- mode B: components -------------------------------------------------

	function matches(entry: SidebarEntry): boolean {
		return entry.displayName.toLowerCase().includes(needle);
	}

	const filteredFlat = $derived.by(() => {
		if (!needle) return [];
		const found: SidebarEntry[] = [];
		for (const item of componentGroups.items) {
			if (item.kind === 'item') {
				if (matches(item.entry)) found.push(item.entry);
			} else {
				found.push(...item.entries.filter(matches));
			}
		}
		found.push(...componentGroups.utilities.filter(matches));
		return found;
	});

	/** True when the active route sits inside this group, so it opens by default. */
	function containsActive(entries: SidebarEntry[]): boolean {
		return entries.some((entry) => pathname === `/components/${entry.name}`);
	}

	const href = (entry: SidebarEntry): string => componentHref(entry.name);
</script>

{#snippet searchIcon()}
	<Icon icon="search" size="sm" color="secondary" />
{/snippet}

{#snippet filterBox()}
	<!--
		Upstream's `SideNav topContent` is exactly this `TextInput` — hidden label,
		search icon, clear button.
	-->
	<TextInput
		label="Search components"
		isLabelHidden
		value={query}
		onChange={(next) => (query = next)}
		placeholder="Search components…"
		startIcon={searchIcon}
		hasClear
		width="100%"
	/>
{/snippet}

{#snippet componentRows(entries: SidebarEntry[])}
	{#each entries as entry (entry.name)}
		<SideNavItem
			label={entry.displayName}
			href={href(entry)}
			isSelected={pathname === href(entry)}
		/>
	{/each}
{/snippet}

{#snippet topicRows(topics: { name: string; title: string }[])}
	{#each topics as topic (topic.name)}
		<SideNavItem
			label={topic.title}
			href={topicHref(topic.name)}
			isSelected={pathname === topicHref(topic.name)}
		/>
	{/each}
{/snippet}

{#if isComponentsMode}
	<SideNav topContent={filterBox}>
		<SideNavSection title="Components" isHeaderHidden>
			{#if needle}
				{#if filteredFlat.length === 0}
					<p class="sidenav-empty">No component matches “{query}”.</p>
				{:else}
					{@render componentRows(filteredFlat)}
				{/if}
			{:else}
				<SideNavItem
					label="Overview"
					href={componentsHref()}
					isSelected={pathname === componentsHref()}
				/>
				{#each componentGroups.items as item (item.sortKey)}
					{#if item.kind === 'item'}
						<SideNavItem
							label={item.entry.displayName}
							href={href(item.entry)}
							isSelected={pathname === href(item.entry)}
						/>
					{:else}
						<!--
							A group is a `collapsible` item with no primary action, so clicking
							the row toggles it — upstream's own pattern for a nav group, and the
							reason there is no `href` here. It starts open when the active route
							is inside it.
						-->
						<SideNavItem
							label={item.label}
							collapsible={{ defaultIsCollapsed: !containsActive(item.entries) }}
						>
							{@render componentRows(item.entries)}
						</SideNavItem>
					{/if}
				{/each}
				<!--
					Utilities is the one group upstream starts collapsed unconditionally
					("Always starts collapsed; users can expand on demand"), rather than
					opening on the active route as the others do.
				-->
				<SideNavItem label="Utilities" collapsible={{ defaultIsCollapsed: true }}>
					{@render componentRows(componentGroups.utilities)}
				</SideNavItem>
			{/if}
		</SideNavSection>
	</SideNav>
{:else}
	<SideNav>
		<SideNavSection title="Documentation" isHeaderHidden>
			{#if gettingStarted}
				<SideNavItem
					label={gettingStarted.title}
					href={topicHref('getting-started')}
					isSelected={pathname === topicHref('getting-started')}
				/>
			{/if}
		</SideNavSection>

		<SideNavSection title="Guide" isHeaderHidden>
			<SideNavItem label="Guide" collapsible={{ defaultIsCollapsed: false }}>
				{@render topicRows(guideTopics)}
			</SideNavItem>
		</SideNavSection>

		<SideNavSection title="Foundations" isHeaderHidden>
			<SideNavItem label="Foundations" collapsible={{ defaultIsCollapsed: false }}>
				{@render topicRows(foundationTopics)}
			</SideNavItem>
		</SideNavSection>

		<!--
			Upstream labels each row with the **package name**, not the slug or the
			display name — `@astryx-svelte/core`, not `Core` — and links it at
			`/docs/<slug>`, which is the same route the topics above use.
		-->
		<SideNavSection title="Libraries" isHeaderHidden>
			<SideNavItem label="Libraries" collapsible={{ defaultIsCollapsed: false }}>
				{#each packageRegistry as pkg (pkg.slug)}
					<SideNavItem
						label={pkg.name}
						href={topicHref(pkg.slug)}
						isSelected={pathname === topicHref(pkg.slug)}
					/>
				{/each}
			</SideNavItem>
		</SideNavSection>
	</SideNav>
{/if}

<style>
	.sidenav-empty {
		padding-inline: var(--spacing-2);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
</style>
