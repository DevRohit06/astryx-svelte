<script lang="ts">
	import {
		Button,
		Card,
		ClickableCard,
		Heading,
		HStack,
		Link,
		List,
		ListItem,
		Section,
		Text,
		VStack
	} from '@astryx-svelte/core';
	import AstryxWordmark from '$lib/shell/astryx-wordmark.svelte';
	import DiscordLogo from '$lib/shell/discord-logo.svelte';
	import GitHubLogo from '$lib/shell/github-logo.svelte';
	import TemplatesPreview from '$lib/landing/templates-preview.svelte';
	import ThemesPreview from '$lib/landing/themes-preview.svelte';
	import { DISCORD_URL, REPO_URL, UPSTREAM_URL, UPSTREAM_WIKI_URL } from '$lib/shell/nav-items.js';
	import { topicHref } from '$lib/shell/links.js';
	import type { PageProps } from './$types.js';

	/**
	 * The community page — upstream's `app/(site)/community/page.tsx`, with every
	 * link re-aimed at the repository a reader of *this* site can actually act in.
	 *
	 * The composition is upstream's and unchanged: hero (`display-1` + dek + two
	 * buttons) over the contributor wall card, then "How we build together" as a
	 * numbered process beside a grid of contribution-type cards, then a Resources
	 * block of categorised `List`/`ListItem` rows with icon tiles.
	 *
	 * ## The retargeting, which is the whole point of the page
	 *
	 * `site-footer.svelte` already splits upstream's links two ways and this page
	 * applies the same split at much larger scale:
	 *
	 * 1. **Actionable → this repo.** Issues, the contribution guide, the docs
	 *    source, the licence. A reader who clicks "file a bug" has to land where
	 *    Svelte bugs are accepted; `github.com/facebook/astryx` is a different
	 *    library with a different bug tracker, and a bug filed there is noise for
	 *    its maintainers and lost for ours.
	 * 2. **System of record → upstream.** The Astryx docs, and the **API
	 *    Conventions** / **API Arbitration** wiki pages. Those *are* the
	 *    specification the parity rule binds this port to, so pointing them
	 *    anywhere else would be the one genuinely wrong answer. Each is labelled
	 *    so a reader knows the page they land on documents React.
	 * 3. **Meta's brand accounts → dropped.** Facebook, Instagram, Threads and X
	 *    are Meta's marketing channels; this port ships neither its trademarks nor
	 *    its accounts, and the footer already carries the "unofficial and not
	 *    affiliated" notice. Discord stays, because it is the design system's
	 *    community server rather than a brand account. Upstream's six channels
	 *    become three: this repo's Issues, this repo's Discussions, upstream's
	 *    Discord.
	 *
	 * ## What is not ported, and why
	 *
	 * - **`NavSurfaceMode`.** Upstream pins `data-nav-mode="surface"` on `<body>`
	 *   for this page's lifetime, because its top nav is transparent by default
	 *   and the wall card's wordmark looked sliced scrolling under it. Here the
	 *   nav is *already* a frosted surface bar on every route but the home page
	 *   (`landing.css`), and `data-nav-mode="surface"` sets that same background.
	 *   Porting the effect would set a flag whose only effect is what already
	 *   happens, so it is omitted rather than re-implemented as a no-op.
	 * - **The two illustration PNGs** behind upstream's "Fix a bug" and "Improve
	 *   the docs" cards. `docs/static/` does not carry `feature-bug.png` /
	 *   `feature-docs.png` and they are Meta's artwork; those two cards are text
	 *   only, as upstream's own `BlockCard` renders them when no media is passed.
	 *
	 * ## One row upstream does not have
	 *
	 * **"Report a parity bug"**, in Communications, pointing at this repo's
	 * `parity.yml` issue form. Upstream has no counterpart because upstream cannot:
	 * a divergence from Astryx is only a bug in something that is *supposed* to be
	 * Astryx. It is the single highest-value report this project takes, and the
	 * column it sits in is the one that lost three of upstream's six rows when
	 * Meta's brand accounts were dropped, so it costs upstream's structure nothing.
	 */
	const { data }: PageProps = $props();

	// =========================================================================
	// Wall card
	// =========================================================================

	interface AvatarSlot {
		top: string;
		left: string;
		rotate: number;
	}

	/**
	 * Upstream's `AVATAR_SLOTS` — the same twelve centre coordinates and the same
	 * twelve rotations, fixed rather than randomised so the server's markup is
	 * deterministic. Two bands leave a clear channel for the wordmark.
	 *
	 * **Only the order differs, and dropping the placeholder fill is why.**
	 * Upstream always renders all twelve tiles (real faces first, Unsplash
	 * portraits for the remainder), so the order it lists them in is never
	 * visible. Here the slots are filled only as far as there are real
	 * contributors — see `+page.ts` — and upstream's order is left-to-right along
	 * the top band first, which would clump a young repo's two or three faces into
	 * one corner and leave the rest of the card conspicuously bare. The order here
	 * alternates bands and jumps across the card, so any count reads as scattered
	 * rather than as a row that ran out.
	 */
	const AVATAR_SLOTS: readonly AvatarSlot[] = [
		{ top: '10%', left: '8%', rotate: -5 },
		{ top: '88%', left: '76%', rotate: 5 },
		{ top: '12%', left: '40%', rotate: -4 },
		{ top: '92%', left: '24%', rotate: -6 },
		{ top: '11%', left: '76%', rotate: -3 },
		{ top: '86%', left: '40%', rotate: 3 },
		{ top: '6%', left: '24%', rotate: 3 },
		{ top: '94%', left: '92%', rotate: -3 },
		{ top: '8%', left: '60%', rotate: 5 },
		{ top: '88%', left: '8%', rotate: 4 },
		{ top: '6%', left: '92%', rotate: 6 },
		{ top: '90%', left: '60%', rotate: -4 }
	];

	const avatars = $derived(
		data.contributors
			.slice(0, AVATAR_SLOTS.length)
			.map((contributor, index) => ({ contributor, slot: AVATAR_SLOTS[index] }))
	);

	// =========================================================================
	// Data
	// =========================================================================

	/**
	 * Which glyph a resource row shows.
	 *
	 * Upstream stores the icon *component* on each `Resource`, which works because
	 * lucide icons and its brand logos share one React SVG signature. Two of the
	 * four marks here are snippets of inline artwork rather than components, so
	 * the row stores a discriminant and `resourceIcon` does the branching — one
	 * place that knows how each mark is drawn, instead of a union type that has to
	 * describe both shapes.
	 */
	type ResourceIcon = 'file' | 'scale' | 'github' | 'discord';

	interface Resource {
		title: string;
		description: string;
		href: string;
		icon: ResourceIcon;
	}

	interface ResourceCategory {
		label: string;
		items: readonly Resource[];
	}

	/**
	 * Upstream's `CHANNELS`, retargeted. Six rows become four: GitHub Issues and
	 * Discord survive (the first re-aimed at this repo, the second not re-aimed at
	 * all), Discussions replaces the four brand accounts as the second place a
	 * reader can actually say something, the parity form is this port's own, and
	 * Facebook / Instagram / Threads / X are gone.
	 */
	const CHANNELS: readonly Resource[] = [
		{
			title: 'GitHub Issues',
			description:
				'File bugs and feature requests against the Svelte port. Meta’s tracker is for the React library.',
			href: `${REPO_URL}/issues`,
			icon: 'github'
		},
		{
			// Placed immediately after the general tracker, so the column reads
			// general-then-specific. It is a specialisation of the row above it, not
			// a separate destination.
			title: 'Report a parity bug',
			description:
				'The report this port most needs: a place where a component behaves differently from Astryx. The form asks for the upstream behaviour.',
			href: `${REPO_URL}/issues/new?template=parity.yml`,
			icon: 'github'
		},
		{
			// NOTE: GitHub serves /discussions only while the tab is enabled on the
			// repository; with it off this URL 404s, and `nav-items.ts` records the
			// standing rule that linking to a 404 is worse than not linking. It is
			// included because a discussions tab is the natural home for the
			// "is this a bug or a deliberate divergence?" question this port
			// generates constantly — **but if Discussions is not enabled on
			// devrohit06/astryx-svelte, delete this row rather than leaving it.**
			// It cannot be verified from here (the build has no network).
			title: 'GitHub Discussions',
			description:
				'Questions, porting notes, and “is this a bug or a deliberate divergence?” — before it is an issue.',
			href: `${REPO_URL}/discussions`,
			icon: 'github'
		},
		{
			title: 'Discord (upstream)',
			description:
				'The Astryx community server, run upstream. The people there work in React; the design questions are the same.',
			href: DISCORD_URL,
			icon: 'discord'
		}
	];

	interface ProcessStep {
		number: string;
		title: string;
		description: string;
	}

	/**
	 * Upstream's `RFC_STEPS`, **replaced rather than reworded.**
	 *
	 * Its steps 3 and 4 describe shipping a new component into
	 * `@astryxdesign/lab` and graduating it into `@astryxdesign/core`. There is no
	 * `@astryx-svelte/lab`; this port has one package and no incubation stage, so
	 * those two steps describe a gate that does not exist here. Printing them
	 * anyway would advertise a process a contributor cannot follow — the worse
	 * failure, by some distance, than diverging openly.
	 *
	 * These four are the gate this repo really enforces, and every one of them is
	 * written down in `CONTRIBUTING.md` (and in `CLAUDE.md`, which is where an
	 * assistant reads it): read upstream, port against upstream's tokens, prove
	 * the CSS with the class oracle, then audit with the three agents. Four steps
	 * against upstream's six-step loop because the loop's opening and closing
	 * moves — file the issue, open the PR — are the parts a reader already knows;
	 * these are the ones peculiar to a port.
	 */
	const PROCESS_STEPS: readonly ProcessStep[] = [
		{
			number: '01',
			title: 'Read upstream first',
			description:
				'Astryx’s source is cloned at reference/astryx-upstream. Read the component, its .doc.mjs, its tests and the compiled dist/ before writing a line. If it is not in Astryx, it is not here.'
		},
		{
			number: '02',
			title: 'Port it',
			description:
				'Author the .stylex.ts against the same token references upstream uses, then the component around it. React idioms translate; the public API does not change on the way across.'
		},
		{
			number: '03',
			title: 'Prove the CSS',
			description:
				'The class oracle compiles your module and diffs the emitted atomic classes against upstream’s published dist/. Byte-identical, or it does not land. A deferral is an explicit skip with a reason.'
		},
		{
			number: '04',
			title: 'Audit',
			description:
				'Three agents read the result: astryx-parity for the API surface, astryx-idiom for the Svelte translation, astryx-test-parity for the suite — ported case for case, because the count is the contract.'
		}
	];

	interface StartHerePath {
		title: string;
		description: string;
		href: string;
		effort: string;
		/** A live preview rendered at the bottom of the card, as upstream's is. */
		preview?: 'templates' | 'themes';
	}

	/**
	 * Upstream's `START_HERE`, same shape and same four slots.
	 *
	 * Two are retargeted rather than reworded. **"Add a template" becomes "Port a
	 * page template"**, because that is the largest genuine opening this port has:
	 * all 629 of upstream's *block* templates are transcribed, and not one of its
	 * 43 *page* templates is — which is also why `/templates` says so on itself.
	 * Upstream points that card at a wiki page on writing new templates; here the
	 * work is transcription of templates that already exist, so it points at the
	 * issue tracker where the pages are being claimed. **"Build a theme"** keeps
	 * upstream's copy and its `/docs/theme` target: `defineTheme()` is ported and
	 * that page documents it.
	 */
	const START_HERE: readonly StartHerePath[] = [
		{
			title: 'Fix a bug',
			// Kept distinct from the parity row in Communications: this is the form
			// for something plainly broken, that one is for something that works but
			// works differently from Astryx.
			description:
				'A crash, a wrong render, a prop that does nothing. File it with a reproduction and the form asks for the rest.',
			// Upstream's exact URL shape, which resolves here now that
			// `.github/ISSUE_TEMPLATE/bug.yml` exists — an unknown `?template=` falls
			// back to a blank issue, so this was previously a bare `issues/new`.
			href: `${REPO_URL}/issues/new?template=bug.yml`,
			effort: '~2 hours'
		},
		{
			title: 'Improve the docs',
			description:
				'This site is docs/ in the repo. Fix a typo, sharpen an example, or write down a translation that took you three reads.',
			href: `${REPO_URL}/tree/main/docs`,
			effort: '~30 min'
		},
		{
			title: 'Port a page template',
			description:
				'The biggest opening here: 43 of upstream’s whole-page templates are still React only. The block templates are all done — the pages are not.',
			// The claim form, not the issue list. This card is the front door to the
			// 43-page backlog, and the form carries the porting rules as required
			// checkboxes — landing on a filtered list would make a reader hunt for
			// them.
			href: `${REPO_URL}/issues/new?template=port-template.yml`,
			effort: '~half day',
			preview: 'templates'
		},
		{
			title: 'Build a theme',
			description:
				'Full visual control through defineTheme(). Tokens, component overrides, and mode switching.',
			href: topicHref('theme'),
			effort: '~1 day',
			preview: 'themes'
		}
	];

	/**
	 * Upstream's `RESOURCE_CATEGORIES`, with its three labels kept.
	 *
	 * Contributing is where the retargeting is most visible: the first three rows
	 * are this port's own guide, agents and setup (upstream's are its wiki's), and
	 * the last three are upstream's own pages, labelled as upstream because they
	 * are the specification rather than instructions for working here. Upstream's
	 * "Contributing with AI" wiki page maps onto `.claude/agents/`, which is
	 * literally this repo's answer to the same question.
	 */
	const RESOURCE_CATEGORIES: readonly ResourceCategory[] = [
		{
			label: 'Contributing',
			items: [
				{
					title: 'Contributing Guide',
					description:
						'The parity rule and how to take its exception, setup, the oracles, and the six steps a change goes through.',
					href: `${REPO_URL}/blob/main/CONTRIBUTING.md`,
					icon: 'file'
				},
				{
					// Upstream's own label for this row, kept. Its target is a wiki page on
					// using AI assistants within Astryx's conventions; the answer here is
					// executable rather than prose — five subagent definitions that a
					// contributor's assistant actually runs. CONTRIBUTING.md's "the loop"
					// section describes when each one fires.
					title: 'Contributing with AI',
					description:
						'Five subagents encoding this port’s failure modes: astryx-parity, astryx-idiom, astryx-oracle, astryx-test-parity, astryx-surface.',
					href: `${REPO_URL}/tree/main/.claude/agents`,
					icon: 'file'
				},
				{
					title: 'Dev Setup',
					description: 'Install, build, and run the docs site and both fidelity oracles locally.',
					href: topicHref('getting-started'),
					icon: 'file'
				},
				{
					title: 'Astryx (upstream)',
					description:
						'Meta’s React original, and the specification this port is measured against. Read it before proposing an API change.',
					href: UPSTREAM_URL,
					icon: 'file'
				},
				{
					title: 'API Conventions (upstream wiki)',
					description:
						'How components in Astryx are named, shaped, and composed. Upstream’s page, deliberately not forked.',
					href: `${UPSTREAM_WIKI_URL}/API-Conventions`,
					icon: 'file'
				},
				{
					title: 'API Arbitration (upstream wiki)',
					description:
						'How upstream settles design disagreements using vibe testing. Its verdicts bind this port too.',
					href: `${UPSTREAM_WIKI_URL}/API-Arbitration`,
					icon: 'file'
				}
			]
		},
		{
			label: 'Communications',
			items: CHANNELS
		},
		{
			label: 'Legal',
			items: [
				{
					// Upstream's row, restored: this repo now has its own Contributor
					// Covenant rather than relying on Meta's, which governs Meta's
					// project. Reporting goes through a private security advisory or a DM
					// to the maintainer — deliberately not a public issue — which is what
					// the document itself spells out.
					title: 'Code of Conduct',
					description:
						'Contributor Covenant 2.1 — the standards for collaboration here, and how a report is handled in private.',
					href: `${REPO_URL}/blob/main/CODE_OF_CONDUCT.md`,
					icon: 'scale'
				},
				{
					title: 'MIT License',
					description:
						'MIT, with Meta’s copyright kept alongside the port’s. Free to use, commercially or otherwise.',
					href: `${REPO_URL}/blob/main/LICENSE`,
					icon: 'scale'
				}
			]
		}
	];

	/** Upstream's own test: external links open in a new tab, internal ones do not. */
	function isExternal(href: string): boolean {
		return href.startsWith('http');
	}
</script>

<svelte:head>
	<title>Community · astryx-svelte</title>
	<meta
		name="description"
		content="Contribute to the Svelte port of Astryx: file issues, port a page template, or build a theme. Unofficial and not affiliated with Meta."
	/>
</svelte:head>

<!--
	The four marks the resource rows draw.

	`file` and `scale` stand in for lucide's `FileText` and `Scale`, which upstream
	imports directly. This port's `Icon` registry is the 26 glyphs the components
	themselves need and carries neither, and the nearest members (`copy`, `info`)
	would read as the wrong thing — so the artwork is inlined as docs chrome, the
	same call `moon-icon.svelte` and `sun-icon.svelte` already made, and it does
	not touch the registry the theme oracle covers. Path data from Lucide (ISC),
	the icon set upstream itself uses.

	`github` and `discord` are the existing logo components. Upstream's community
	page uses the `0 0 16 16` GitHub drawing from `logos.tsx` while `github-logo.svelte`
	is the `0 0 24 24` one its nav declares; the two are the same mark at the size
	this tile renders, and porting a second drawing of it would be porting artwork
	for no visible difference.
-->
{#snippet resourceIcon(kind: ResourceIcon)}
	{#if kind === 'github'}
		<GitHubLogo width={18} height={18} />
	{:else if kind === 'discord'}
		<DiscordLogo width={18} height={18} />
	{:else if kind === 'scale'}
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path>
			<path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path>
			<path d="M7 21h10"></path>
			<path d="M12 3v18"></path>
			<path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path>
		</svg>
	{:else}
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
			<path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
			<path d="M10 9H8"></path>
			<path d="M16 13H8"></path>
			<path d="M16 17H8"></path>
		</svg>
	{/if}
{/snippet}

<div class="page-wrap">
	<Section padding={6}>
		<div class="section-stack">
			<div class="hero-group">
				<div class="hero-row">
					<!--
						Upstream hangs `styles.heroText` on a `VStack gap={1}`. Svelte's style
						scoping cannot reach a child component's root element, and wrapping the
						Stack in a styled div moves the width out one level while the alignment
						stays behind — so, as `discover-showcase.svelte` settled it, where
						upstream styles a Stack this file uses a plain element and declares the
						flex the Stack would have applied.
					-->
					<div class="hero-text">
						<Heading level={1} type="display-1" color="primary">Build with us</Heading>
						<Text type="body" size="base" color="secondary">
							A small port of a large design system, transcribed one component at a time — and there
							is a great deal left to transcribe.
						</Text>
					</div>
					<HStack gap={2} wrap="wrap">
						<Button
							variant="secondary"
							size="md"
							label="Browse Issues"
							href={`${REPO_URL}/issues`}
						/>
						<Button
							variant="primary"
							size="md"
							label="Start Contributing"
							href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}
						/>
					</HStack>
				</div>

				<!--
					Upstream's `WallCard`, over this repository's contributors rather than
					`facebook/stylex`'s — see `+page.ts` for why the list moved and why the
					Unsplash placeholder fill did not come with it. With no contributors
					fetched the avatar layer renders nothing and the card is the wordmark,
					the invitation and the link, which is a complete composition rather than
					a grid with holes in it.
				-->
				<Card padding={0} class="wall-card">
					<div class="wall-avatar-layer" aria-hidden="true">
						{#each avatars as avatar (avatar.contributor.login)}
							<img
								class="wall-avatar"
								src={avatar.contributor.avatar_url}
								alt=""
								style="top: {avatar.slot.top}; left: {avatar.slot
									.left}; transform: translate(-50%, -50%) rotate({avatar.slot.rotate}deg);"
							/>
						{/each}
					</div>
					<div class="wall-card-center">
						<!-- `--color-brand` rather than upstream's Astryx blue, matching
						     `astryx-logo.svelte`: the mark on this site is the port's own
						     identity, and the token is docs chrome rather than a theme value. -->
						<AstryxWordmark class="wall-wordmark" />
						<Text type="body" color="primary" justify="center" class="wall-description">
							A Svelte port is a long transcription, done a component at a time.
							<br />
							Everyone who lands one is on this wall.
						</Text>
						<Link
							label="See contributors"
							href={`${REPO_URL}/graphs/contributors`}
							target="_blank"
							type="supporting"
							color="secondary"
							hasUnderline
							class="wall-see-contributors"
						>
							See contributors
						</Link>
					</div>
				</Card>
			</div>

			<!-- How we build together — heading + numbered process on the left,
			     contribution-type cards on the right. -->
			<div class="contrib-row">
				<div class="contrib-process">
					<VStack gap={1}>
						<Heading level={2} type="display-3">How we build together</Heading>
						<Text type="body" color="secondary">
							Contributing here means matching Astryx, not improving on it — an invented prop or a
							nicer default is a defect. Each step has a gate, and the third one is a script rather
							than an opinion.
						</Text>
						<!-- Stated outright, because the steps below are visibly not the ones
						     on upstream's own community page and a reader deserves to know
						     which process they are reading. -->
						<Text type="supporting" color="secondary">
							This is the Svelte port's process, not upstream's. Astryx incubates new components in
							@astryxdesign/lab; there is no @astryx-svelte/lab, so the gate here is the class
							oracle instead.
						</Text>
					</VStack>
					{#each PROCESS_STEPS as step (step.number)}
						<div class="process-step">
							<Text
								type="body"
								weight="semibold"
								color="secondary"
								hasTabularNumbers
								class="process-step-number"
							>
								{step.number}
							</Text>
							<VStack gap={1}>
								<Heading level={3}>{step.title}</Heading>
								<Text type="supporting" color="secondary">{step.description}</Text>
							</VStack>
						</div>
					{/each}
				</div>
				<div class="contrib-types">
					<div class="block-grid">
						{#each START_HERE as path (path.title)}
							<!--
								Upstream's `BlockCard`. `height="100%"` is its `blockCardStack`
								reached through VStack's own prop rather than a class, since the
								Stack publishes exactly that value; the media wrapper below is a
								plain element in this file's scope, so it needs no `:global()`.

								Both previews are the existing landing-page components and neither
								takes props — upstream passes `maxRows={2}` to its `TemplatesPreview`
								and this port's has no such knob (it renders six blocks in three
								rows, for the reasons its own docstring gives).
							-->
							<ClickableCard
								label="Open {path.title}"
								href={path.href}
								variant="transparent"
								padding={5}
								class="block-card"
							>
								<VStack gap={1} align="start" height={path.preview ? '100%' : undefined}>
									<Heading level={3} color="primary">{path.title}</Heading>
									<Text type="body" color="primary">{path.description}</Text>
									<Text type="supporting" color="secondary">{path.effort}</Text>
									{#if path.preview}
										<div class="block-card-preview">
											{#if path.preview === 'templates'}
												<TemplatesPreview />
											{:else}
												<ThemesPreview />
											{/if}
										</div>
									{/if}
								</VStack>
							</ClickableCard>
						{/each}
					</div>
				</div>
			</div>

			<!-- End-of-page Resources block — Contributing, Communications and Legal
			     in one categorised list grid. -->
			<div class="end-block">
				<div class="end-block-resources">
					<Heading level={2} type="display-2" class="end-block-header-text">Resources</Heading>
					<div class="end-block-resources-grid">
						{#each RESOURCE_CATEGORIES as category (category.label)}
							<div class="resource-column">
								<Heading level={4} color="primary">{category.label}</Heading>
								<List class="resource-list">
									{#each category.items as resource (resource.title)}
										<!--
											Declared here rather than inside `ListItem`: a `{#snippet}` that
											is a *direct* child of a component is read as one of its props,
											and these two are passed by name. Inside the `{#each}` they are
											ordinary locals that close over `resource`.

											`description` is a snippet, not a string, for upstream's reason —
											a string opts `ListItem` into single-line truncation, and the
											clamp below allows two.
										-->
										{#snippet startContent()}
											<span class="icon-tile" aria-hidden="true">
												{@render resourceIcon(resource.icon)}
											</span>
										{/snippet}
										{#snippet description()}
											<span class="resource-description">{resource.description}</span>
										{/snippet}
										<ListItem
											label={resource.title}
											{description}
											{startContent}
											href={resource.href}
											target={isExternal(resource.href) ? '_blank' : undefined}
										/>
									{/each}
								</List>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</Section>
</div>

<style>
	/*
	 * Upstream's `styles.pageWrap` — a plain wrapper rather than `Section`'s
	 * `maxWidth` prop, because Section's negative-inline-margin styles override
	 * `margin-inline: auto`.
	 */
	.page-wrap {
		width: 100%;
		max-width: var(--docs-content-max-width);
		margin-inline: auto;
	}

	/* Upstream's `sectionStack`: a 96px section rhythm, which VStack cannot express
	   (its gap scale stops at 40px). */
	.section-stack {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-12) * 2);
		width: 100%;
		max-width: var(--docs-content-max-width);
		margin-inline: auto;
	}

	.hero-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
	}

	/* flex-end aligns the CTAs to the dek's baseline at wide widths; flex-start
	   left-aligns them under the text once stacked. */
	.hero-row {
		display: flex;
		flex-direction: row;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--spacing-6);
	}

	.hero-text {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
		min-width: 0;
		max-width: 480px;
	}

	@media (max-width: 760px) {
		.hero-row {
			flex-direction: column;
			align-items: flex-start;
		}
	}

	/*
	 * Upstream's `wallCard`. `position: relative` contains the absolutely
	 * positioned avatar layer; `isolation: isolate` keeps the z-indexed children
	 * stacking inside the card, so the wordmark cannot render above the sticky top
	 * nav on scroll. Reached by `class` through a `:global()` nested under a local
	 * ancestor — the standing way this app styles a component's own root box.
	 */
	.hero-group :global(.wall-card) {
		position: relative;
		isolation: isolate;
		min-height: 280px;
		padding-block: var(--spacing-12);
		padding-inline: var(--spacing-6);
		overflow: hidden;
		border-color: transparent;
		background-color: var(--color-background-body);
	}

	/* width/height are load-bearing: they give the flex column the card's full box
	   to centre the wordmark within. */
	.wall-card-center {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3);
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		min-height: inherit;
	}

	.wall-card-center :global(.wall-wordmark) {
		position: relative;
		z-index: 1;
		display: block;
		width: auto;
		height: 56px;
		color: var(--color-brand);
	}

	.wall-card-center :global(.wall-description) {
		position: relative;
		z-index: 1;
		max-width: 480px;
	}

	.wall-card-center :global(.wall-see-contributors) {
		position: relative;
		z-index: 1;
	}

	.wall-avatar-layer {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}

	/* `translate(-50%, -50%)` (inline, with the slot's own coordinates) positions
	   each tile by its centre, so an AVATAR_SLOTS percentage is where the middle of
	   the avatar sits. */
	.wall-avatar {
		position: absolute;
		width: 48px;
		height: 48px;
		border-radius: var(--radius-element);
		object-fit: cover;
	}

	/* Upstream's `contribRow`: `flex 1` here against `flex 2` on the card column
	   is what yields the 1:2 split. */
	.contrib-row {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: flex-start;
	}

	.contrib-process {
		display: flex;
		flex: 1 1 0;
		flex-direction: column;
		gap: var(--spacing-5);
		min-width: 0;
	}

	.contrib-types {
		flex: 2 1 0;
		width: 100%;
		min-width: 0;
	}

	@media (max-width: 900px) {
		.contrib-row {
			flex-direction: column;
		}
	}

	.process-step {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-3);
		align-items: flex-start;
	}

	/* The tabular figures are `Text`'s own `hasTabularNumbers`; the fixed min-width
	   is what keeps the number column from shifting between "01" and "10". */
	.process-step :global(.process-step-number) {
		flex-shrink: 0;
		min-width: 28px;
	}

	.block-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-4);
		width: 100%;
	}

	@media (max-width: 720px) {
		.block-grid {
			grid-template-columns: 1fr;
		}
	}

	.block-grid :global(.block-card) {
		height: 100%;
		overflow: hidden;
		background-color: var(--astryx-marketing-feature-card-bg);
	}

	/* No negative bleed here, unlike upstream's image variant: both previews own
	   their own edge treatment. */
	.block-card-preview {
		align-self: stretch;
		width: 100%;
		min-width: 0;
		margin-top: auto;
		padding-top: 16px;
	}

	.end-block {
		position: relative;
	}

	.end-block-resources {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-8);
	}

	.end-block :global(.end-block-header-text) {
		max-width: 680px;
	}

	/* Categories stack rather than wrapping into grid columns, so the reading order
	   stays unambiguous. */
	.end-block-resources-grid {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-8);
		width: 100%;
	}

	.resource-column {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3);
		min-width: 0;
	}

	/* The negative inline margin cancels ListItem's internal start padding, so the
	   row icons sit flush with the page's left reading rail. */
	.resource-column :global(.resource-list) {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--spacing-2) var(--spacing-6);
		width: calc(100% + var(--spacing-3));
		margin-inline-start: calc(-1 * var(--spacing-3));
	}

	@media (max-width: 900px) {
		.resource-column :global(.resource-list) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 600px) {
		.resource-column :global(.resource-list) {
			grid-template-columns: 1fr;
		}
	}

	.icon-tile {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius-element);
		background-color: var(--color-background-muted);
		color: var(--color-text-primary);
	}

	/* Clamped to two lines. ListItem mid-truncates a *string* description to one
	   line, which is why the description is handed in as a snippet at all. */
	.resource-description {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		/* Upstream's StyleX emits the prefixed property alone; the standard one is
		   added here because svelte-check flags its absence and no oracle covers a
		   docs stylesheet. */
		line-clamp: 2;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
