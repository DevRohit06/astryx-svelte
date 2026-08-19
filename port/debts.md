# Known debts

Small, named, deliberately not hidden. Upstream bugs are documented here, not replicated.

Every entry carries a machine-readable head so `astryx-parity` can ask "is this drift already a
known debt?" with one grep. Bodies are carried verbatim from `port/todo.md`; where an entry was
re-verified against the tree while this file was assembled, the finding is appended as a
`> **Re-verified …**` note rather than folded into the original text.

### `BlogCoverArt` is not ported, so a non-release post with no `coverImage` has no cover

- **units:** BlogCoverArt
- **kind:** unported
- **retires:** when a second blog post lands without a `coverImage`

Upstream's generative default cover (210 lines, deterministic from post `type` + `slug`) is the
one piece of the blog surface this port skipped. It is not exercised today — the only post is a
release post, so `release-cover-art.svelte` (ported) is what renders — but the gap is real the
moment a `guide` or `perspective` post lands without artwork. `blog-card.svelte` falls through
to the muted field rather than collapsing, so the failure is a blank cover and not a broken
grid. Port it before the second post, or the second post needs a `coverImage`

### The docs top nav sizes its end-content icons at 16px; upstream's are 20px

- **units:** shell/top-nav.svelte
- **kind:** deliberate-divergence
- **retires:** never

A deliberate divergence on the maintainer's call, not an oversight. Upstream's `SharedTopNav` renders
`<Search size={20} />`, `<Moon size={20} />`, `<Sun size={20} />`, `<HeartHandshake size={20} />`
and `<Menu size={20} />`; ours are all `Icon`'s `sm` (1rem, 16px at a 16px root) and a 16×16
GitHub mark. **The bug this replaced was non-uniformity**, which was real: search and the
hamburger were 16px while the mode toggle and GitHub mark were 20px, so two glyphs sat visibly
larger than the two beside them. Equalising was the fix; 16 rather than 20 is the divergence.
`shell/top-nav.svelte` names it at the snippet

### Core's demo workbench imports a downstream package's build output, and that edge is real

- **units:** core (routes/+layout.svelte, routes/+page.svelte)
- **kind:** deliberate-divergence
- **retires:** never

`src/routes/+layout.svelte` and `+page.svelte` import `../../../themes/neutral/dist/` — the
relative path was chosen so pnpm's dependency graph would not see a cycle, and it works, but
**the bundler's graph is not pnpm's**. Core's `build` used to run `vite build` (the workbench)
before `prepack` (the library), so on any clean checkout core's build demanded an artifact from
a package that builds _after_ core, and rolldown failed with `UNRESOLVED_IMPORT` on both lines.
It passed on every developer machine because a previous run had left `themes/neutral/dist/` on
disk; it failed on the first CI run and the first Vercel deploy that ever built core.
**Fixed by making `build` a library build only** (`npm run prepack`), with the workbench moved
to `build:demo` and run by CI _after_ `pnpm -r build`. That matches upstream, whose core
`build` is `babel + tsc + css + umd` and produces no app at all, and whose `theme-neutral`
takes core as a **peer** dependency. The debt is that the import still points at a build
artifact: `pnpm -F @astryx-svelte/core dev` on a fresh clone needs a prior `pnpm -r build`, and
reading the theme's _source_ instead is not an escape — `neutral-theme.ts` imports
`@astryx-svelte/core/theme/define`, which is core's own `dist/`

### Page templates carry three unported dependencies, handled two different ways

- **units:** table-page-chart, table-page-heatmap-status, table-page-shoe-store-heatmap, dashboard, dashboard-portfolio, theme-showcase
- **kind:** unported
- **retires:** when `@astryxdesign/charts` and `@astryxdesign/lab` are ported

The split is
principled, not accidental. `table-page-chart`, `table-page-heatmap-status` and
`table-page-shoe-store-heatmap` import `Chart`/`ChartAxis`/`ChartGrid`/`ChartHeatmapGL` from
`@astryxdesign/charts` and `@astryxdesign/lab`, both **first-party Astryx packages this port
will eventually have** (recorded above as "never started"). Their chart blocks are transcribed
in place as commented Svelte, data left live, to be uncommented when the packages land. The two
dashboards and `theme-showcase` instead use **`recharts`** and **`lucide-react`** — third-party
React libraries that will never gain an `@astryx-svelte` counterpart, so there is nothing to
wait for; those charts are hand-drawn as inline SVG driven by upstream's own recharts props,
element-by-element mapping in each file header. Neither arm invents placeholder content, and
neither leaves an import that would break the docs glob-build or a user's scaffolded project

### `/templates/blank` 404s, where upstream would bounce

- **units:** docs (routes/templates)
- **kind:** deliberate-divergence
- **retires:** never

The registry skips `scaffold`
templates, so the slug is not in `entries`. Upstream's `[slug]` redirects any slug — including
one `generateStaticParams` never generated, since `dynamicParams` defaults true — landing the
reader on a gallery whose dialog silently cannot open. A 404 says more, but it _is_ a
divergence rather than an improvement, and it is recorded as one

### `/templates/<slug>` is a bounce page, not an HTTP 308

- **units:** docs (routes/templates/[slug])
- **kind:** deliberate-divergence
- **retires:** when `adapter-vercel` can express a redirect rule for a prerendered query-string destination

It was a `redirect(308, …)` and that
cannot be prerendered: on a redirect the prerenderer writes the redirect file **and enqueues
the destination** (`kit/src/core/postbuild/prerender.js:421`), so `/templates?preview=<slug>`
was saved as `templates?preview=<slug>.html` — junk on Linux, a hard `ENOENT` build failure on
Windows. The whole site is `prerender = true`, so there is no request-time branch. The route
now emits the `meta refresh` + `location.href` pair character-for-character as SvelteKit writes
it for prerendered redirects. Cost: `adapter-vercel` emits no redirect rule for these paths and
a crawler sees 200-then-refresh. Closing it means a `vercel.json` redirect rule or an adapter
that can express one

### Upstream's `AspectRatio` comments in three Gallery templates are stale

- **units:** gallery-hero, mixed-gallery, product-gallery, side-gallery
- **kind:** upstream-lag
- **retires:** when upstream corrects its own template comments

They claim
`AspectRatio` exposes no `objectFit` or `radius` prop; upstream's own `AspectRatio.tsx` ships
`fit` and `shape`, and so does this port. The comments and the inline styles they justify are
transcribed verbatim under the reproduce-upstream rule. Worth re-checking when upstream next
touches that file

### `parseTemplate` rejects every core `.doc.mjs` template spec

- **units:** cli (authoring/doctypes/template/parse.mjs)
- **kind:** api-divergence
- **retires:** when core specs migrate to `.template.ts`

Not a regression from the
page templates — it rejects the already-landed ones identically, on `displayName`/`isReady`/
`isHiddenFromOverview`. Core specs load through `loadDocModule`, not `parseTemplate`, which
`_adapter.mjs:151` documents as the _integration_ path, so nothing is broken today. But the
canonical `.template.*` schema and the legacy core spec shape have drifted apart, and the next
person to migrate core specs to `.template.ts` will hit it

### The class oracle cannot see a `stylex.create` function style, on either side

- **units:** compare-upstream-classes.mjs
- **kind:** unported
- **retires:** when the script diffs function-style arrow bodies instead of skipping them

A dynamic
style — `dot: (color) => ({backgroundColor: color, …})` — compiles to an **arrow function**
value rather than a `{propHash: "class", $$css: true}` object, and its hoisted static half
lands in a `_temp` const whose properties are bare strings. `extractGroups` requires `$$css`
(for the `STATUS_CONFIG` reason documented at its site), so it skips both halves. Measured
2026-08-07: **54 function styles across 32 modules** — Slider's track fills, Tree's `indent`,
`rowStatus`'s `dot`, every `--_var` carrier. A clean run therefore means _"every **static**
style matches"_, which is narrower than the report's wording, and the reason the limit is now
stated at the head of `compare-upstream-classes.mjs` rather than left to be re-derived.
Closing it means diffing the arrow bodies' emitted class hashes (both sides compile from the
same source, so the strings should be identical) — a real extension to the script, not a
case-table entry. Until then, a function style is only ever covered by a ported test case.

### `docs/` depends on `theme-chocolate`; upstream's docsite does not

- **units:** docs (package.json)
- **kind:** deliberate-divergence
- **retires:** never

(batch 18). Upstream's
docsite depends on butter, gothic, matcha, neutral, stone and y2k — no chocolate. Ours
depends on all eight, so `THEME_OBJECTS` carries two entries upstream's does not. This is
much smaller than the liquid-glass divergence and arguably not one at all — the docsite's
dependency list is a _docsite_ choice rather than published API, and the entries are inert
(`themeFor()` is only called for `REEL_THEMES` names, and chocolate is in no slide). Recorded
because the alternative — dropping the dependency to match — would leave a shipped theme
package with no page that loads its stylesheet. **Neither chocolate nor stone gets hero-reel
content**, and that is parity rather than an omission: upstream depends on `theme-stone` and
still gives it zero rows in all seven of `CONTENT_BY_THEME`, `LABEL_BY_THEME`,
`AURORA_BY_THEME`, `DARK_THEMES`, `WORDMARK_COLOR_BY_THEME`, `REEL_THEMES` and
`REEL_FONT_FAMILIES`. Writing rows for either would be invented demo content

### `liquid-glass` is a slide in the landing hero reel

- **units:** docs (landing/hero/hero-theme-content.ts)
- **kind:** deliberate-divergence
- **retires:** never

Which is the one place this addition is visible
in `docs/` and therefore the one place it touches a file ported from upstream
(`hero-theme-content.ts` ← `heroThemeContent.ts`). It rides the **local-theme seam upstream
already wrote** for the docsite's own brand theme — a sentinel name, an entry per table, a
branch in `themeFor()` — rather than a fabricated `@astryxdesign/theme-liquid-glass` key in
`THEME_OBJECTS`. That distinction is the whole of the parity argument: the map keyed by
upstream's package names still lists exactly what upstream publishes, and a reader can tell
the local slide from the ported ones by its key alone. Its card content reuses the vendored
Neutral photo set, as the `astryx` slide does, so no demo asset was invented either

### Safari ignores any `backdrop-filter` containing a `var()`, whatever it resolves to

- **units:** themes/liquid-glass
- **kind:** deliberate-divergence
- **retires:** when Safari fixes [mdn/browser-compat-data#25914](https://github.com/mdn/browser-compat-data/issues/25914)

([mdn/browser-compat-data#25914](https://github.com/mdn/browser-compat-data/issues/25914),
open, reproduced through Safari 18.3). So the theme's 25 glass surfaces carry **literal**
material values, interpolated at build time, and its seven `--glass-*` custom properties are
_descriptive rather than live_ — overriding `--glass-blur` does not retune the theme. This
shipped wrong first: the component rules referenced the vars, which meant no material at all
on the one browser a macOS theme most needs to be right on, failing silently and identically
to success on the Chromium machine it was written on. `check-theme.mjs` now fails the build if
a `var()` reappears inside a `backdrop-filter`. **Retire the check, inline the vars again and
the knobs go live**, all three the same day WebKit fixes it

### Concentric radii, which is Tahoe's geometry rule and not a detail

- **units:** themes/liquid-glass
- **kind:** deliberate-divergence
- **retires:** never

A nested corner shares
its container's centre of curvature, so `inner = outer − gap`. SwiftUI ships it as
`ConcentricRectangle`/`containerShape`, and it is why Tahoe's windows-with-toolbars grew a
larger radius than windows without. Six menu-row components compute
`calc(var(--radius-container) - var(--glass-menu-inset))` live rather than carrying a
precomputed number, so retuning the container radius moves both halves together — the same
construction `chat-composer.stylex.ts` already uses for its send button, so the idiom is the
codebase's own. Only `dropdown-menu` and `segmented-control` are given the matching _inset_,
because they are the two containers whose padding upstream put in the derived-var registry;
the other menus keep their own padding and just take the concentric row radius

### SF is tracked by size, not uniformly

- **units:** themes/liquid-glass
- **kind:** deliberate-divergence
- **retires:** never

Apple's table runs -1.05px at 34pt to +0.15px at
11pt, crossing zero around 15pt — large text tightens, small text opens. Eight
`letter-spacing` declarations carry it, converted to `em` and thinned to the sizes where it
is visible; h4/body/label/code land on the zero crossing and get none. They merge _into_ the
entries `expandTypeScale` generates rather than replacing them, which is exactly the
three-level `deepMergeComponents` depth the type-scale bug fix bought

### The spacing scale is untouched on purpose

- **units:** themes/liquid-glass
- **kind:** deliberate-divergence
- **retires:** never

Astryx's default already _is_ Apple's 4pt grid
step for step, so there was nothing to correct. What needed setting is which step each
container spends: menus 5px, segmented control 2px, cards 16px, dialogs 20px (macOS's window
margin). Control heights are derived rather than picked, at ~1.55× the body size for `md`.
They were 30/36/44 first, which was wrong in a nameable way: 44 is the _iOS_ touch target,
and hitting it makes a desktop theme read as a phone theme

### `corner-shape: squircle` on the 15 container surfaces

- **units:** themes/liquid-glass
- **kind:** deliberate-divergence
- **retires:** when Firefox and Safari ship `corner-shape`

Apple's corners are continuous
curvature, not circular arcs, and `squircle` is the shorthand for the `superellipse(2)` that
lands on the macOS look. Chromium 139+ only, ~65% of users, no Firefox or Safari timeline.
Kept anyway because it degrades to _nothing_: the property has no effect without a non-zero
`border-radius`, so an unsupporting browser keeps the ordinary rounded corner the radius
already gave it. Deliberately **not** applied at `--radius-full` — a capsule is already the
right shape, and superellipsing a half-height radius rounds it off into neither

### `@media (prefers-reduced-transparency: reduce)` switches all 25 surfaces opaque

- **units:** themes/liquid-glass
- **kind:** deliberate-divergence
- **retires:** when Safari ships `prefers-reduced-transparency`

Honouring
macOS's own Accessibility → Display → Reduce Transparency. Appended to the stylesheet by this
package's `scripts/build-theme.mjs` and derived from the theme object, because `defineTheme`
has no media-query seam and adding one would mean editing a file ported from upstream for a
feature upstream does not have. Chrome/Edge 118+, ~73% of users, **no Safari** — which is the
inverse of the bug above, and means neither browser gets both halves right yet

### No refraction

- **units:** themes/liquid-glass
- **kind:** deliberate-divergence
- **retires:** when a cross-browser refraction technique exists

Apple's Liquid Glass lenses the backdrop at the rim; the web technique for
that is an SVG `feDisplacementMap` fed into `backdrop-filter`, which needs a filter element in
the document, is Chromium-only, and cannot be expressed as a token or a component override. A
theme package is the wrong layer for it. What is here is blur + saturation + the specular
inset edge, which is the readable 90%

### The `liquid-glass` colours are Apple's published system palette used verbatim, including one value under AA

- **units:** themes/liquid-glass
- **kind:** deliberate-divergence
- **retires:** never

`--color-text-teal` light (`#008299`, ~4.0:1) is Apple's own accessible teal.
Kept rather than hand-tuned, on the grounds that a categorical text token labels rather than
carries body copy. Retire by re-deriving the hue if that assumption ever stops holding

### `chat` is in `derivedVarRegistry` but nothing renders `themeProps('chat')`

- **units:** theme/derived-var-registry.ts, themes/liquid-glass
- **kind:** upstream-lag
- **retires:** when Chat renders `themeProps('chat')`, or when upstream's own `Chat` family ships a `Chat.tsx`

So
`.astryx-chat` matches no element and a theme's `chat: {borderRadius}` is a dead rule. Found
by `liquid-glass`'s `check-theme.mjs` on its first run, which is the entire argument for that
script. Harmless in practice — `chat-composer.stylex.ts` reads
`var(--_chat-composer-radius, var(--radius-chat))`, so the token reaches the shape anyway —
and the registry is transcribed from upstream, whose `Chat` family also ships no `Chat.tsx`.
Recorded rather than corrected: dropping the key would diverge from upstream's registry, which
the theme oracles compare against

### `Timestamp` is typed `BaseProps<HTMLElement>`, not `HTMLTimeElement`

- **units:** Timestamp
- **kind:** api-divergence
- **retires:** never

Our rest reaches the `<Text>` wrapper; the narrower type makes handler types contravariantly incompatible with `Text`

### `Layout`'s four slot components do spread rest, last, as upstream's do

- **units:** Layout
- **kind:** deliberate-divergence
- **retires:** never

(No further detail in the original entry beyond the title.)

### `List` destructures a closed list with no rest spread, dropping attributes its type promises

- **units:** List
- **kind:** api-divergence
- **retires:** never

`List` destructures a closed list (`children`/`density`/`hasDividers`/`header`/`listStyle`/`start`/`xstyle`/`className`/`style`/`data-testid`/`ref`) with no rest spread, dropping `id`/`aria-*`/handlers its `BaseProps<HTMLUListElement | HTMLOListElement>` promises; we forward rest onto the `<ul>`/`<ol>`, as `DropdownMenu` and `Timestamp` do. Spread _first_, so the component's own `role="list"`/`aria-labelledby`/`start` still win

### `Slider` destructures a closed list off `BaseProps<HTMLDivElement>` and does not rest-spread

- **units:** Slider
- **kind:** api-divergence
- **retires:** never

`id`/`role`/`aria-*`/handlers its type promises are dropped. This is the one root where we **replicate** rather than forward, because the leftover object is load-bearing: upstream reads it for `'minStepsBetweenThumbs' in props`, its only use, and forwarding it would have to pick an element to forward _to_ (the `Field` root, the row, or the track container) where upstream picks none. Only `class`/`style`/`xstyle`/`width`/`data-testid` reach the DOM, all via `Field`

### `TimeInput` destructures a closed list off `BaseProps` with no rest spread

- **units:** TimeInput
- **kind:** api-divergence
- **retires:** never

So `id`/`role`/`aria-*`/`data-*`/handlers its type promises are dropped; we forward rest onto the `<input>`, as `Timestamp`/`List`/`DropdownMenu` do. It is the **only** member of the date/time family upstream leaves closed — `DateInput`, `DateTimeInput` and `DateRangeInput` all rest-spread, each onto its wrapper `<div>`, and this port matches all three targets and orderings exactly. The forwarding is also what forces `syncDisplayValue`: a spread routes every attribute through `set_attributes`, which loses Svelte's compare-against-the-DOM guard on `value` (the hazard recorded in the batch-5 entry below; `NumberInput`'s client-side pin for it was retired at 0.4.1, so `TimeInput`'s own suite is worth re-reading for whether _it_ still has an observable symptom), so the value write moves into an attachment

### `ChatSendButton` drops its own theme class as of 0.2.0, an upstream regression the forwarding fix introduced

- **units:** ChatSendButton
- **kind:** deliberate-divergence
- **retires:** never

It writes
`{...themeProps('chat-send-button')} className={className}`, and a later key wins in an object literal even when its value is `undefined` — so `astryx-chat-send-button` is replaced by the consumer's `className`, or by nothing at all, which is the usual case. **Verified in the shipped 0.2.0 `dist/`, not just the source.** Documented and _not_ replicated: reproducing it would silently retire a theme target `defineTheme` still advertises. This port emits `cx(theme.class, className)`

### `Token` reads a closed list and does not rest-spread

- **units:** Token
- **kind:** api-divergence
- **retires:** never

`id`/`role`/`aria-*`/handlers accepted by `TokenProps extends BaseProps` are dropped at runtime, exactly as upstream. Only `class`/`style`/`data-testid`/`aria-label`(when `isLabelHidden`)/`aria-description`/(link)`aria-disabled` reach the DOM. No `ref`/attachment seam either, so its three ref-forwarding test cases assert the rendered element type instead

### There is no `/components/Chat` family-overview page

- **units:** Chat
- **kind:** unported
- **retires:** when a family entry counts as ported when its `components[]` members are, or when the registry gets a family-overview rule change

And it is the only one of upstream's
201 doc entries this site does not render (`200 documented / 201 upstream`). It is a docs-site
gap, not a component one: upstream ships **no `Chat.tsx`**, so `Chat.doc.mjs` is a family entry
whose `displayName: 'Chat'` matches no export, and `buildComponentRegistry`'s ported-check —
"is this display name in core's export surface?" — correctly drops it. All 15 real Chat
components have their own pages; what is lost is the family's `usage`, `theming` and best-practices
prose, plus its `hiddenComponents` handling. Fixing it means letting an entry count as ported
when its `components[]` members are, which is a rule change to the registry rather than a
transcription. **Worth generalising: `200 of 201` was sitting in the generator's output for a
whole batch and read as rounding** — the count is only useful if the remainder is named, which
is why the unported list is now printed rather than counted

### `CodeBlock`'s tokenizer gains a `svelte` language

- **units:** CodeBlock (tokenizer.ts)
- **kind:** deliberate-divergence
- **retires:** never

Upstream's table stops at
`tsx`/`jsx` because its examples are TSX; every example here is a `.svelte` file and
`example-block.svelte` passes `language="svelte"` for all of them, so without it
`buildLanguage` returns `null`, `tokenize` yields `[]`, and the docs site renders **all** of
its example source unhighlighted. Svelte is markup and script in one file, which this
tokenizer has no notion of — it applies one flat ordered pattern list per language — so the
two sets are merged and ordered by specificity. Two deliberate departures from the `html`
group it is modelled on: template blocks (`{#if}`, `{:else}`, `{/each}`, `{@render}`) and
runes (`$state`, `$derived.by`) get their own rules, and the generic attribute rule is
tightened from `(?=\s*=)` to `(?==["'{])` — the loose form colours the `value` in
`let value = $state('')` as an attribute, which cannot happen in `html` because it has no
script block. It is a highlighter, not a parser: `a < b` in a script block still reads as a
tag open, the same approximation `html` already makes. **Not covered by a test** — the ported
tokenizer suite is case-for-case and this language has no upstream case to port, and the bar
in CLAUDE.md for coverage beyond upstream is a Svelte-specific DOM or reactivity hazard,
which a pure regex table is not

### The docs `ContentBlockRenderer` port had dropped three things, now restored

- **units:** docs (shell/content-block.svelte)
- **kind:** deliberate-divergence
- **retires:** when `.svelte` files can import StyleX / `xstyle`

Upstream's
`docs/CodeBlock.tsx` does, now restored: the `VStack gap={1}` wrapper, the label as a
supporting `Text` _above_ the block rather than the block's own `title`, and `isWrapped`.
The width is the visible one — upstream overrides `CodeBlock`'s `fit-content` default with
`xstyle={{width: '100%'}}`, and without it every docs code block sat at its content width
(400–700px in a 752px column). `xstyle` needs StyleX, which a `.svelte` file may not import,
so this uses the published `width` prop instead; the only difference is below a 400px
container, where upstream's `fit-content` floor still forces an overflow and this does not

### `showcase-preview.svelte`'s inner wrapper is `display: contents` above 768px

- **units:** docs (shell/showcase-preview.svelte)
- **kind:** deliberate-divergence
- **retires:** never

Upstream
renders the block as a _direct_ flex child on desktop and only wraps it in the
`min-width: fit-content` div in its small-screen branch; the branch is CSS here rather than a
`useMediaQuery`, so the wrapper is unconditional in the markup and is taken back out of the
layout tree instead. Without it the wrapper is an auto-width block between the flex container
and the block, and a percentage width inside resolves against a box sized by its own content
— `ChatComposer` in upstream's `Stack width="100%"` collapsed to 64px, the composer's
max-content, because a contenteditable has no intrinsic width

### `Tooltip`'s text-only trigger is a prop, not component content

- **units:** Tooltip, HoverCard
- **kind:** api-divergence
- **retires:** never

`Tooltip`'s text-only trigger is a prop (`children="…"`), not component content — Svelte wraps content in a snippet whatever it holds, so a bare string can't reach the string branch; written as content it takes the element branch and nothing wires (same silence upstream gives element-free non-string children). **`HoverCard` inherits verbatim.** Concrete instance of the open `string | Snippet` decision

### `Popover`'s render-prop trigger is a separate `trigger` prop, not function `children`

- **units:** Popover
- **kind:** api-divergence
- **retires:** never

Upstream's `children: ReactNode | (props => ReactNode)` is discriminated by `typeof === 'function'`; Svelte wraps both content and render-functions as snippets, so `children` (automatic mode) and `trigger: Snippet<[PopoverTriggerRenderProps]>` (explicit mode) split. Same family as the `Tooltip` string-branch decision. The render-prop's `ref` is an `Attachment` (the port's ref-callback translation)

### `Popover`'s `anchorRef` is `HTMLElement | null`, not a `RefObject`

- **units:** Popover
- **kind:** api-divergence
- **retires:** never

(bind the element directly). Consequence: sibling mode can't be keyed on the ref's _value_ the way upstream keys it on the ref object's _presence_ (an element is `null` until it mounts), so `mode` is decided by which trigger prop was supplied — `trigger` → render, else `children` → automatic, else sibling — never by reading `anchorRef`. Avoids a not-yet-mounted sibling being misread as an empty automatic trigger

### `Icon` doesn't port `renderIconSlot`

- **units:** Icon
- **kind:** deliberate-divergence
- **retires:** never

Every icon slot here is already a `Snippet`, nothing to dispatch on (Svelte-obviates)

### `OverflowList` takes `items: T[]` + `item: Snippet<[T, number]>`, not compositional `children`

- **units:** OverflowList
- **kind:** api-divergence
- **retires:** never

Upstream slices `Children.toArray(children)` into a visible subset and a hidden measurement copy; a Svelte snippet is one opaque unit that can be rendered twice but never _sliced_, so the visible row is data-driven (exactly the shape `useOverflow`'s docstring anticipates). `overflowRenderer` is a `Snippet<[OverflowItem<T>[]]>` and `OverflowItem<T>` carries `{ value, index }` where upstream's carries `{ child: ReactElement, index }`. Rendered DOM, classes (byte-identical, oracle-clean) and fit behaviour are otherwise identical. Same forced-snippet-translation family as `Popover`/`Tooltip` above. This resolves the "**`Children.toArray` rendered twice**" blocking design decision (§Blocking design decisions) in favour of candidate (a) — the single hidden measurement container is kept, not given up. **Test suite ported** in `src/tests/overflow-list.svelte.test.ts` (14 of upstream's 15 `it` cases; `exposes a displayName` dropped — Svelte has no such surface; `forwards a ref` ported as an attachment counterpart; three `textContent`/`toBeEmptyDOMElement` cases restated to tolerate Svelte's `{#if}`/`{#each}` anchor comments + whitespace, which are `display:none` in the flex container). Runs in the **client** (Chromium) project with upstream's exact `offsetWidth`/`ResizeObserver` monkeypatch — the `server` node project has no DOM to mount into

### `Switch` omits an upstream leading-whitespace text node

- **units:** Switch
- **kind:** deliberate-divergence
- **retires:** never

(a JSX artifact, no effect; element-child-count cases unaffected)

### `Grid` keeps upstream's deprecated `minChildWidth`

- **units:** Grid
- **kind:** api-divergence
- **retires:** never

(API parity; emits no styles)

### `HoverCard` honours `class`/`style`/`xstyle` where upstream declares then drops them

- **units:** HoverCard
- **kind:** deliberate-divergence
- **retires:** never

Verified a bug in source _and_ `dist/`; intent is unambiguous (aimed at the popover container), so they reach it here, threaded to `<Layer>`

### No per-component subpath exports

- **units:** -
- **kind:** api-divergence
- **retires:** never

Upstream publishes `./Button`, `./Card`, … (~110). We ship `.`, `./theme`, `./theme/syntax`, `./utils`, `./i18n`, `./hooks`, `./naming`, `./base.css`. Defensible while the barrel is small, but a real surface difference

### Repo-wide surface drift — missing exports closed, over-exports sanctioned under a written rule

- **units:** -
- **kind:** api-divergence
- **retires:** partially retired at 0.4.2 polish; the `./naming` duplication and the four inline-union aliases remain

**The 9 missing exports are 0.** `ButtonVariantMap`, `DropdownMenuContext`, `TableContext`,
`TextXStyleAllowed` and `ProseElement` closed in earlier batches. The last three closed here:

- **`FormLayoutContext`** — the `Context` object itself is now published, as upstream's
  `FormLayout/index.ts` publishes it and as `RadioListContext` and `SizeContext` already were.
  `setFormLayoutContext`/`useFormLayout` are the Svelte wrappers _around_ it, never a substitute.
- **`SizeProvider`** — `internal/size-scope.svelte`, published under upstream's name. Its own
  docstring had argued against exporting it, on the grounds that `setSizeContext` was already
  the counterpart. That was wrong, and the paragraph directly above it said why: `setSizeContext`
  cascades to a component's _whole_ subtree, where `SizeProvider` scopes to _part_ of one. They
  are different capabilities and only one of them can express upstream's.
- **`useTruncation`, `UseTruncationOptions`, `UseTruncationReturn`** — the hook existed as
  `createTruncation`/`Truncation` in `internal/`, module-private and under a name upstream does
  not use. Renamed to upstream's and published; `attach` stands in for upstream's `ref`, which is
  the standing ref-callback→attachment mapping.

**The 37 over-exports resolve into a stated rule rather than a sweep.** The entry's own reading
was that the eight-strong Svelte-only state-type family "is one decision, not eight findings",
that it grows by roughly one per hook ported, and that publishing some while documenting
`LayerProps` and withholding others "is the one option that is not defensible". The decision is
made and written at the head of `src/lib/index.ts`: **a Svelte-only name is published when it
appears on an already-published signature, and stays module-public otherwise.** That is the
argument the `BaseTablePlugins` / `TableContextProvider` and `TableFilterFieldRef` notes were
already making case by case; all eight members satisfy it, so nothing is removed and the
inconsistency was the absent rule rather than the exports.

Still open, and deliberately not swept during a release: the seven `./naming` symbols duplicated
at the root (upstream keeps them off the root entirely), the four named aliases for unions
upstream inlines (`CarouselGap`, `DividerOrientation`, `ProgressBarFillVariant`,
`AbsoluteTimestampFormat`) plus `LightboxTriggerProps`, the ten-to-twelve context
provider/reader wrappers, and `Layer`'s anchor-name helpers. Every one of those is a _removal_
from a surface that has shipped, which is a breaking change and belongs at a minor, not in the
polish pass before a patch.

### `./theme` barrel drift, pre-existing, surfaced by the same sweep

- **units:** -
- **kind:** api-divergence
- **retires:** when `generateThemeCss`/`generateOnMediaCss` and `ThemeConfig`/`ComponentOverrides` are renamed to match upstream, and the remaining `theme/types.ts` + over-exports are swept

~90 names upstream's `theme/index.ts` publishes that ours does not. **Batch 8 closed the `Theme`/`useTheme` family** (`Theme`, `ThemeContext`, `ThemeContextValue`, `useTheme`, `UseThemeReturn`, `ThemeMode`, `ResolvedThemeMode`, `resolveThemeToken(s)`, the two options types, `tokenVar`, `tokenVars`, `tokenDefaults`) and started `theme/types.ts`, which now holds `ThemeMode` alone — the prose-theming types in it land with the Prose-defaults item. What remains is chiefly the per-group token `*Vars`/`*Defaults` exports and the rest of `theme/types.ts` — plus 13 over-exports and two name drifts (`generateThemeCss`/`generateOnMediaCss` vs upstream's `…CSS`; `ThemeConfig`/`ComponentOverrides` vs `DefineThemeInput`/`ComponentStyleMap`)

### Three `./theme` names have no upstream counterpart or the wrong one

- **units:** -
- **kind:** api-divergence
- **retires:** when `TypeRole`/`TypeWeight` are renamed, `TokenMap` is made module-private and `TypeScaleConfig`'s shape matches upstream's

(batch-7 sweep).
`TypeRole` and `TypeWeight` are name drift for upstream's `TypographyRole`/`FontWeight` (and
ours drops `TypographyRole`'s `weight` field); `TokenMap` has **zero** occurrences anywhere in
upstream's `src/`, so it is API this port invented and should be made module-private. Worse,
`TypeScaleConfig` is _shape_ drift under a shared name — upstream's is
`{base, ratio, weights?: {heading?, text?}}` and ours is `{base, ratio}`, so a consumer typing
against it gets a narrower object than the published name promises. That last one wants an
`astryx-parity` pass on `theme/expand-type-scale.ts`, not just a rename

### `./authoring` (21 names), `./config`, `./docs.mjs`, `./groups.doc.mjs` and the 14 `docs-types` root types are absent

- **units:** -
- **kind:** unported
- **retires:** with Phase 4/5

Upstream's authoring/doc-generation surface. Belongs
with Phase 4/5 rather than the per-symbol list, and is recorded here only so the sweep's count
reconciles

### The root barrel is not a mirror of `./theme`, deliberately

- **units:** -
- **kind:** deliberate-divergence
- **retires:** if the root barrel is ever widened

`defineTheme`, `generateThemeCss` and the rest stay on the subpath, where upstream's root does `export * from './theme'`. Theme _components_ are the practical exception and are now applied consistently: `MediaTheme` and (since batch 5) `SyntaxTheme`/`useSyntaxTheme` are re-exported at the root. The remaining syntax symbols (`defineSyntaxTheme`, `syntaxTokenDefaults`, the presets, the `SyntaxTheme*` types) stay subpath-only, matching how theme-authoring API is treated generally. Worth settling as one decision if the root barrel is ever widened

### No vitest project can run a hydration test

- **units:** HoverCard
- **kind:** unported
- **retires:** when a third vitest project can transform a component twice

So `HoverCard`'s `server markup matches first client render` case is dropped (a `.svelte` module compiles for one target per transform). Needs a third project that transforms components twice. `src/tests/hover-card.test.ts` pins the server markup as inline-safe meanwhile

### Three `wrapDynamicImport` TypeErrors logged every browser-project run

- **units:** Text, Heading, Timestamp
- **kind:** unported
- **retires:** when SvelteKit's Vite plugin can wrap a dynamic import under the vitest browser provider

The lazy-`Tooltip` code split (`Text`/`Heading`/`Timestamp`); SvelteKit's Vite plugin can't wrap a dynamic import under the vitest browser provider. Non-fatal, but the split path isn't exercised as in a real build

### `Icon` demo hand-draws an SVG for component mode

- **units:** Icon (demo route)
- **kind:** unported
- **retires:** with `@lucide/svelte`

(`routes/squiggle-icon.svelte`) — retires with `@lucide/svelte`

### `DropdownMenuItem`'s `icon` is `IconName | Snippet`, not upstream's `ReactNode | IconType`

- **units:** DropdownMenuItem
- **kind:** api-divergence
- **retires:** never

The Svelte icon-slot shape (as `Button.icon`); a snippet renders any custom icon. `renderIconSlot` is inlined as an `{#if typeof icon === 'string'}` branch rather than ported as a helper (Svelte-obviates the ReactNode-vs-component dispatch)

### `DropdownMenu` forwards rest props to the menu container where upstream drops them

- **units:** DropdownMenu
- **kind:** deliberate-divergence
- **retires:** never

(`...props` is destructured but never spread) — same closed-prop-root contradiction documented for `Timestamp`/`FieldLabel`; we forward as every other component does. `data-testid`→trigger, `class`/`style`/`xstyle`→menu, matching where upstream routes the named props

### Consumer `class` is silently dropped on `ToggleButton`

- **units:** ToggleButton
- **kind:** upstream-lag
- **retires:** never

Upstream destructures `className: _className` and never forwards it; styling is `xstyle`-only. The port drops it identically.

### `...rest` is spread last onto `Button` inside `ToggleButton`, so a consumer `onclick` clobbers the toggle handler

- **units:** ToggleButton
- **kind:** upstream-lag
- **retires:** never

(after `onclick={handleClick}`) — an upstream footgun, replicated.

### `ToggleButtonGroup` is a closed component (no rest spread)

- **units:** ToggleButtonGroup
- **kind:** deliberate-divergence
- **retires:** never

Only `role`/`aria-label`/`data-testid` + the stylex/theme classes reach the `<div>`. Its type forbids arbitrary attributes, so this is intended, not a missing spread.

### `Spinner`, `Kbd` and `Code` document less than their source ships

- **units:** Spinner, Kbd, Code
- **kind:** upstream-lag
- **retires:** when upstream's `.doc.mjs` documents these

`Spinner` `size="xl"` (source + `SpinnerSizes` use it; `.doc.mjs` omits); `Kbd` `plus` special key; `Code` `color`/`size` props

### Batch 5's doc omissions — two of the four closed at 0.4.1

- **units:** NumberInput, CodeBlock
- **kind:** upstream-lag
- **retires:** when upstream documents `onKeyDown` and `highlightMode` in their `.doc.mjs`

`NumberInput`'s `onKeyDown` and `CodeBlock`'s `highlightMode` are still real source props absent from both locales of their `.doc.mjs` props tables; ported from source, as the `Lightbox` `defaultIndex`/`hasAutoPlay` gap below already is. `NumberInput`'s `width` and `FileInput`'s `width` were the other two, and **0.4.1's props tables document both**, so those halves are retired.

### `Badge.label` is `string | Snippet`, not `ReactNode`

- **units:** Badge
- **kind:** api-divergence
- **retires:** never

The same leaf-slot translation, and
the one place where it costs a _reachable_ upstream call: `Button/ButtonWithEndSlot.tsx` passes
`label={3}`, a number, which our type rejects. Widening to `string | number | Snippet` would be
inventing API against a `ReactNode` original, so the ported block writes `label="3"` and the
rendered output is identical. Worth revisiting only if a numeric-label case appears somewhere
the string form reads wrong

### `ToastOptions.body` / `endContent` are `string | Snippet`, not `ReactNode`

- **units:** Toast
- **kind:** api-divergence
- **retires:** never

A toast is shown _imperatively_ — the caller hands content to `showToast()` as an option value, so unlike `Tooltip`/`HoverCard` there is no markup position to capture and the string branch is reachable. Same forced-snippet-translation family as `Popover`/`OverflowList`. Not exported under a public name (`ToastContent` is internal): upstream's counterpart is React's own `ReactNode`, so publishing an alias would invent API

### Toast's mode resolution reads the root attribute a microtask later than upstream

- **units:** Toast, internal/theme-mode.svelte.ts
- **kind:** deliberate-divergence
- **retires:** never

**Timing note:** upstream's `useSyncExternalStore` reads the root attribute _during render_, so a client-mounted toast has the right mode in its first commit; ours defers to `$effect.pre`, so the first commit carries `data-astryx-media="dark"` for one extra microtask under `<html data-theme="dark">`. All microtasks drain before paint, so nothing flashes — but a synchronous DOM read in the same flush sees the pre-resolution value. Reading the attribute at init instead would be hydration-unsafe, which is what upstream's `getServerSnapshot` exists to prevent

### `ToastViewport`'s mutators wrap their state reads in `untrack`

- **units:** Toast (ToastViewport)
- **kind:** deliberate-divergence
- **retires:** never

Upstream never reads `toasts` while producing the next value (`setToasts(prev => …)` inside `useCallback([])`, current list reachable only through the inert `toastsRef`), which is what makes the documented `useEffect(() => { if (error) toast(…) }, [error])` consumer pattern legal. A plain read would subscribe the _caller's_ effect to `toasts` and loop with `effect_update_depth_exceeded`; `untrack` inside the viewport restores the ref semantics without asking call sites to opt out

### `toasts` is `$state.raw`

- **units:** Toast (ToastViewport)
- **kind:** deliberate-divergence
- **retires:** never

Every mutation is a whole-array reassignment and upstream treats an entry as opaque. Deep-proxying would also make a consumer mutating the `ToastOptions` object it passed re-render our toast, which React does not do

### Toast's faithful upstream quirks (replicated, not fixed)

- **units:** Toast
- **kind:** upstream-lag
- **retires:** never

An `inset` value of `0` is ignored (`if (inset?.top)` truthiness); `maxVisible` silently drops overflow toasts with no queue re-promotion, so a hidden older toast's auto-hide timer never runs because its `Toast` is not mounted; `pauseTimer` floors the remaining time at `1000`ms, so a toast paused with under a second left is _extended_ to a second

### Untested edge: a Toast `Snippet` body can outlive the component whose template declared it

- **units:** Toast
- **kind:** unported
- **retires:** when a targeted test for this case is added

(caller unmounts on a route change while the toast is still up). React's `ReactNode` is an inert description and has no equivalent hazard. Worth a targeted test before the slot-translation debt above is closed

### `LightboxLayer` is an export upstream has no counterpart for

- **units:** Lightbox
- **kind:** api-divergence
- **retires:** never

`useLightbox` returns `element: ReactNode` — a rendered value Svelte has no equivalent of — so the rendering half becomes a component, exactly as `useLayer`→`<Layer>`, `useTooltip`→`<TooltipLayer>` and `useKeyboardHint`→`<KeyboardHintLayer>` already do. `LightboxLayerProps` likewise has no upstream name, for the same reason `LayerProps`/`KeyboardHintLayerProps` don't. `useLightbox` takes its options as a **getter** so a changing `media` stays live; upstream re-memoises on `[isOpen, media, index, lightboxProps]`

### `UseLightboxReturn.setIndex` has no upstream counterpart

- **units:** Lightbox
- **kind:** api-divergence
- **retires:** never

Upstream's `element` closure owned the index setter directly; splitting the rendering half out means `<LightboxLayer>` needs a way back in. Same seam `useTooltip` opens with `cancelHide`/`scheduleHide`, for the same reason

### The open/close effect's key set is wider than upstream's `[isOpen]`

- **units:** Lightbox
- **kind:** deliberate-divergence
- **retires:** never

`dialogEl` is `$state` (deliberately — it makes the effect ordering-proof if `bind:this` lands after it), and the `<dialog>` sits inside `{#if currentItem}`, so it re-runs on remount. A `wasShown` latch narrows the _trigger capture_ back to a genuine closed→open transition; without it a `media: [] → [item]` round-trip while open re-captures `triggerElement` as `<body>` and the eventual close focuses the body instead of the trigger

### `LightboxTriggerProps` is a named type for what upstream declares inline twice

- **units:** Lightbox
- **kind:** api-divergence
- **retires:** never

(on `triggerProps` and on `getTriggerProps`'s return). The keys are Svelte's: `tabIndex`→`tabindex`, `onClick`→`onclick`, `onKeyDown`→`onkeydown`; `role`/`aria-haspopup` unchanged. Upstream's `triggerProps` is `getTriggerProps(0)` by another name — its `open()` defaults to index 0

### `LightboxMedia.caption` is `string | Snippet`, not `ReactNode`

- **units:** Lightbox
- **kind:** api-divergence
- **retires:** never

The same leaf-slot translation as `Toast`'s `body`. Every upstream call site passes a plain string

### Upstream bug (replicated): scroll lock leaks on an empty Lightbox gallery

- **units:** Lightbox
- **kind:** upstream-lag
- **retires:** never

`useScrollLock(isOpen)` runs _before_ the `if (!currentItem) return null` early return, so `media={[]}` with `isOpen` scroll-locks the body while rendering nothing and offering no close affordance. Upstream's own test asserts the null render but not the lock

### Upstream bug (replicated): Lightbox arrow keys `preventDefault()` unconditionally

- **units:** Lightbox
- **kind:** upstream-lag
- **retires:** never

`ArrowLeft`/`ArrowRight` call `preventDefault()` before the `canPrev`/`canNext` guards, so on a `type: 'video'` item they kill native `<video controls>` seeking (the keydown bubbles from the video to the dialog handler), and they fire on single-item lightboxes where the nav is a no-op

### Upstream dead code, dropped: `imageWrapperRef`

- **units:** Lightbox
- **kind:** deliberate-divergence
- **retires:** never

Created and attached but never read upstream. There is no `bind:this` to justify porting it

### Upstream i18n gap (replicated) in Lightbox

- **units:** Lightbox
- **kind:** upstream-lag
- **retires:** never

The two announcement strings (`"<alt>, N of M"` / `"Image N of M"`) are hard-coded English, unlike the four button/dialog labels which do go through `useTranslator`

### Upstream doc gap: `defaultIndex` and `hasAutoPlay` are absent from `Lightbox.doc.mjs`

- **units:** Lightbox
- **kind:** upstream-lag
- **retires:** when upstream documents `defaultIndex`/`hasAutoPlay`

Real props (present in `LightboxProps` and the shipped `.d.ts`) but are absent from `Lightbox.doc.mjs`'s props table in both locales. Ported from source, per the Icon px→rem precedent

### `Lightbox` renders nothing at all when `media` is empty; pan is unclamped and zoom is a toggle

- **units:** Lightbox
- **kind:** deliberate-divergence
- **retires:** never

Not even the `<dialog>` — matching upstream's `return null`. Its `hasAutoPlay` is only the `<video autoplay>` attribute: there is no timer and no auto-advance. Pan is **unclamped** (a zoomed image can be dragged out of view) and zoom is a 1↔2 double-click toggle with no wheel or pinch. `research/01` described this component as a Popover-API overlay with a focus trap and autoplay timing; all three were wrong and that row has been corrected

### The colour-mode toggle borrows three unrelated icons

- **units:** docs (shell/top-nav.svelte)
- **kind:** deliberate-divergence
- **retires:** with the `@lucide/svelte` icon registry (Phase 3)

The built-in registry is the 26
icons the components themselves need; upstream's toggle uses Heroicons' sun/moon. Retires with
the `@lucide/svelte` icon registry (Phase 3), like the demo route's substitutions

### `svelte/no-navigation-without-resolve` is off in `docs/`

- **units:** docs (eslint.config.js)
- **kind:** deliberate-divergence
- **retires:** never

With the reason in
`eslint.config.js`: every internal href is built by `shell/links.ts`, which _does_ call
SvelteKit's `resolve()`, and the rule is syntactic — satisfying it literally would inline the
route id at ~25 call sites. The thing actually worth enforcing is that nothing bypasses
`links.ts`, which a rule making it the only importer of `$app/paths` would catch

### The example preview is client-only

- **units:** docs (shell/example-preview.svelte)
- **kind:** deliberate-divergence
- **retires:** when Svelte's `experimental.async` can await an import during SSR without collapsing the code split

`shell/example-preview.svelte` resolves blocks through
a lazy `import.meta.glob`, so the prerendered HTML carries the _frame_ and the block itself
arrives on hydration. That is upstream's arrangement (`ShowcasePreview` lazily `import()`s the
copied `.tsx`) and it is what keeps a component page from bundling every block it documents,
but on a fully prerendered site it does mean the hero preview is not in the static HTML.
Fixing it properly needs a way to await the import during SSR without collapsing the code
split — Svelte's `experimental.async` is the candidate, and it is not worth enabling for this

### `TooltipHookUsage` needs an `id` upstream's does not

- **units:** docs (examples/useTooltip/TooltipHookUsage)
- **kind:** api-divergence
- **retires:** never

`useTooltip` requires an SSR-stable
`id` because `useLayer` cannot mint one from inside a hook, so the block passes `$props.id()`.
Its other two translations are this port's standing shapes: options arrive as a getter, and
upstream's `renderTooltip()` is a `<TooltipLayer>` component, because a Svelte hook cannot
return markup

### The docs example blocks make the same Heroicons substitutions the demo routes do

- **units:** docs (examples)
- **kind:** deliberate-divergence
- **retires:** with the `@lucide/svelte` icon registry (Phase 3)

Upstream's
blocks import `@heroicons/react`; the built-in registry is the 26 icons the components
themselves need, so blocks needing a tag, star, bookmark, scissors or person glyph use a
built-in and say so in a header comment. `EmptyState` (`search`) and `Toolbar`
(`chevronLeft`) are near-exact swaps; the rest are approximations. Retires with the
`@lucide/svelte` icon registry (Phase 3)

### A handful of docs example blocks needed type-level adjustments upstream's TS config does not force

- **units:** docs (examples)
- **kind:** api-divergence
- **retires:** never

`Selector`/`Slider`/`NumberInput`/`ToggleButtonGroup` take discriminated-union props, so an
inline `onChange` arrow needs its parameter annotated; `SelectorOptionShowcase` reads
`option.label` and a `Record` index and `TextTypes` spreads two optional booleans, all
`string | undefined` / `boolean | undefined` under `exactOptionalPropertyTypes`, so those
reads are made total; `FormLayoutShowcase` renames upstream's `state` binding (the US address
field) because it shadows the `$state` rune in svelte-check's transform; and
`ListOrderedSteps` writes its `{ }` as HTML entities, because a bare `{` in an attribute
starts a Svelte expression and the `{'{'}` escape trips `svelte/no-useless-mustaches`. Each is
commented in place. None changes what renders

### `SelectableCardMulti` uses a `SvelteSet`, not a cloned `Set`

- **units:** docs (examples/SelectableCard/SelectableCardMulti)
- **kind:** deliberate-divergence
- **retires:** never

Upstream clones the set on
every change because React needs a new reference to re-render; `SvelteSet` is reactive in
place, so the clone goes and the mutation is direct. The same reduction applies wherever an
upstream block threads `setX(prev => …)` — `ThumbnailRemovable`/`ThumbnailGallery` assign a
filtered array to a `$state` binding instead

### Three `Thumbnail` blocks share one `thumbnail-images.ts`

- **units:** docs (examples/Thumbnail)
- **kind:** deliberate-divergence
- **retires:** never

Upstream repeats the four
data-URI scenes verbatim in each block file. They are hoisted to a sibling module here —
identical bytes, three importers — mirroring the demo routes' own `thumbnail-images.ts`.
Kept as a second copy rather than imported from core's `src/`, which `docs/` does not reach
into

### `AspectRatioCircleImage`'s alt text is upstream's, warning and all

- **units:** docs (examples/AspectRatio/AspectRatioCircleImage)
- **kind:** upstream-lag
- **retires:** never

"Circular image" trips
Svelte's `a11y_img_redundant_alt`, because a screen reader already announces an `<img>` as an
image. The text is example _content_ and the page shows the block's source, so it is kept
verbatim with a documented `svelte-ignore` rather than quietly edited — unlike the `Code`
spacing typo below, nothing here renders wrong; it is only a wording smell

### Upstream typo not replicated: `Code/CodeInlineInParagraph.tsx` drops a space after two `</Code>` tags

- **units:** docs (examples/Code/CodeInlineInParagraph)
- **kind:** deliberate-divergence
- **retires:** never

So upstream's block renders "`useState`for local state and `useEffect`for
side effects". The ported block inserts the spaces. Copying a rendering defect is not parity —
the rule is that upstream bugs get documented here, not reproduced

### `Carousel`/`OverflowList` docs blocks render through `items` + `item`, not children

- **units:** docs (examples/Carousel, examples/OverflowList)
- **kind:** api-divergence
- **retires:** never

Because
that is this port's documented API divergence for those two components (recorded above under
the 22 untyped props). The block content is otherwise upstream's

### 22 documented props resolve to no declaration in core

- **units:** docs (generator)
- **kind:** api-divergence
- **retires:** never

And are rendered with a stated
reason instead of a type. Three shapes: React `ref`/`anchorRef`/`handleRef` (no Svelte
counterpart — `bind:this` or an attachment), `data-testid` (forwarded through rest, never
declared), and `children` on `Carousel`/`OverflowList` (the documented `items` + `item`
snippet divergence). None is a defect; each is a translation already recorded above

### `SyntaxThemeProps` and `SelectorOptionProps` are module-private, matching upstream

- **units:** SyntaxTheme, SelectorOption
- **kind:** deliberate-divergence
- **retires:** never

So they are absent from the barrel. The generator finds them by scanning per-component `.d.ts`
for unexported declarations — which works, but means the props table depends on a private
declaration keeping its name

### The docs generator hard-fails on a missing `displayName`, replicating upstream's `requireDisplayName()`

- **units:** docs (generate-content.mjs)
- **kind:** deliberate-divergence
- **retires:** never

Deliberate, but it means a malformed upstream doc breaks the docs
build rather than degrading it

### Table blocks in reference docs still render a plain `<table>`

- **units:** docs (shell/props-table.svelte)
- **kind:** unported
- **retires:** when `props-table.svelte` migrates to `Table`

Table blocks in reference docs still render a plain `<table>`, and so do the component
props tables — but the reason has changed. `Table` is no longer unported: its core landed with
batch 11, so this is now a _docs-site migration_ rather than a blocked feature, and it is the
obvious first dogfooding job of the next docs pass. Upstream's own `PropsTablePattern` story is
ported on the demo route and shows the shape the props table should take

> **Re-verified 2026-08-15 while routing this file.** The reference-doc table blocks and the
> component props tables have since diverged: `docs/src/lib/shell/content-block.svelte`'s own
> `'table'` block has migrated to upstream's `Card` → `Table` shape, but `props-table.svelte`,
> which renders every component's props table, has not — its own header comment still reads
> "A `<table>` until `Table` lands (batch 13)", and it still renders a bare `<table>`. The debt
> above survives for `props-table.svelte`; the reference-doc half of it has closed.

### Upstream's codemod assets stay deferred, and should stay deferred in their present form

- **units:** cli (assets/codemods)
- **kind:** deliberate-divergence
- **retires:** when this port ships its own codemods against `magic-string` + `svelte/compiler`

Every one of upstream's codemod assets is a jscodeshift transform over `.tsx`, migrating _React_
source between React Astryx versions. jscodeshift cannot parse `.svelte`, so porting them in their
present form would produce transforms that cannot run against a consumer's code. The first real
registry entry belongs to this port's own codemods, written against the `magic-string` +
`svelte/compiler` API the `upgrade` command already uses.

### Upstream's template assets stay deferred from the CLI's own catalog

- **units:** cli (assets/templates)
- **kind:** deliberate-divergence
- **retires:** when the CLI grows its own template scaffolding catalog

`template --list` shows nothing from core and `init --features template` returns `skipped`. The page
template _content_ has separately landed as demo and docs assets — 42 of them — so this is the CLI's
own scaffolding catalog rather than the templates themselves.

### `SideNavItem` puts `xstyle`/`class`/`style` on its wrapper, where upstream's collapsed branch takes neither

- **units:** SideNavItem
- **kind:** api-divergence
- **retires:** never, unless upstream gives the wrapper those props

`{...rest}` moved onto the item element at 0.4.2 (#5048's sibling hardening pass), which is where
upstream lands it and where a consumer's `aria-*`, `title` or handler belongs — that half now
matches. The styling props did not move: upstream's collapsed-with-children branch renders
`<div {...stylex.props(styles.root, xstyle)}>` and drops `className`/`style` entirely, so a
consumer's class is discarded there. Ours applies all three to the wrapper. Forwarding is the
better behaviour and dropping it to match would be a regression, so the divergence is recorded
rather than closed.

### The 0.4.2 test delta — mostly closed; 26 SideNav and 12 Slider cases remain

- **units:** SideNav, Slider
- **kind:** unported
- **retires:** when both suites' counts match upstream's at the current pin

The 0.4.2 tracking batch tracked implementation drift and did not track the **test** delta.
Upstream added roughly 90 cases at that tag; the batch ported 21. The closing audits found it,
and the polish pass closed most of it — **about 105 cases added** across thirteen suites:

| Suite                    | Added         | Covers                                                                                                                  |
| ------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `menu-hover`             | 21 (new file) | the whole `useMenuHover` suite, for a hook the batch rewrote and this port had no suite for at all                      |
| `side-nav`               | 17            | the `useMenuHover` guard, the eight shared-focus-ring cases, the five size-cascade cases                                |
| `layer`                  | 14            | the nine `context hosting` cases, the five `offset` cases absent since before 0.4.0, and one beyond-upstream regression |
| `top-nav` (x3 files)     | 8             | `TopNavHeading`'s hover guard and both drawer focus-ring pairs                                                          |
| `slider`                 | 7             | the three `THUMB_INSET` `it.each` blocks (#5051)                                                                        |
| `avatar`                 | 6             | the box moving to the theme target, and whitespace-only name/alt                                                        |
| `container-reveal`       | 5             | `hoverDelay`, `forceState`, `forceVisibility` (#5084)                                                                   |
| `chat-message`           | 4             | ghost alignment and the `width` cap (#2574)                                                                             |
| `dropdown-menu-sub-menu` | 3             | the hover/click guard                                                                                                   |
| `hover-card`             | 2             | the nested-theme portal and live custom properties                                                                      |
| `button-group`           | 2             | the two `DropdownMenu` cases whose stated blocker had cleared                                                           |
| `focus-trap`             | 1             | a trap with no tabbable controls (#5023)                                                                                |

The mega-menu focus-ring case is **mutation-checked**: reverting `megaMenuItemDrawerAttrs` to its
bare `sx(...)` turns it red, so it genuinely catches the defect the audits found rather than
passing either way.

**What remains, named rather than implied:**

- **SideNav — 26 of the 43.** The forced-colors compiled-output pair, the flyout hover-intent and
  coarse-pointer gates, the collapsed-submenu keyboard path and its focus restore, Tab order and
  disabled-item skipping, the catalog-named submenu dialog and its translation, prop forwarding on
  `SideNavItem`, and the hidden section header. The seventeen that _are_ ported were chosen as the
  ones verifying what the 0.4.2 hardening pass changed.
- **Slider — 12 blocks**, listed in `src/tests/slider.svelte.test.ts`'s header: `isRequired`,
  `minStepsBetweenThumbs` and RTL pointer mirroring, three behaviours the suite does not exercise
  at all. Predates 0.4.2 — the header claimed "nothing dropped" at 32 while upstream has had >=45
  since v0.2.0.

**The rule this earns:** a tracked release's test delta is part of its scope, not a follow-up. The
batch's own headline change — `THUMB_INSET` — shipped with zero coverage while the ledger described
it as transcribed and routed, and `useLayer`'s unported `context hosting` block is precisely what
would have caught the two Layer defects the idiom audit found instead.

## Retired

Closed, kept as the record. **Nothing below counts as an open debt** — `scripts/status.mjs` stops
tallying at this heading, and `astryx-parity` must not find a retired entry when it greps for
"is this drift already known?", or it would skip live drift.

### `{...rest}` position now matches upstream everywhere it is observable

- **units:** Breadcrumbs, Heading, Lightbox, SideNav, TopNav, Collapsible, MobileNav, ChatComposerDrawer, CodeBlock, Text
- **kind:** deliberate-divergence
- **retires:** retired — kept as the record of how the measurement was wrong

**Closed.** The entry previously read "upstream spreads rest **last** in eleven components and
**first** in fifteen … four more (`Collapsible`, `MobileNav`, `ChatComposerDrawer`, `CodeBlock`)
invert precedence for `data-*` reflections only". Both halves were wrong. Re-measured
mechanically against `v0.4.2` — every `.svelte` under `components/` whose `{...rest}` is followed
by an attribute the component writes itself (`aria-*`, `role`, `title`, `data-*`, a handler),
cross-checked against whether the upstream counterpart's root spread is trailing:

- The four named were **not** in the observable set at all. They are pure `data-*` reflection
  cases, flipped here for consistency.
- The observable set was **five**, and the entry named none of them: `Breadcrumbs` (`aria-label`),
  `Heading` (`aria-level`, `title`), `SideNav` (`aria-label`, `role`), `TopNav` (the same, on both
  its branches) and `Lightbox` (`oncancel`, `onclick`). A consumer could not override any of them.
- `Text` was a sixth, found by the 0.4.2 parity audit rather than by the sweep: it writes
  `title={tooltipEnabled ? … : undefined}` _after_ the spread, and a later `undefined` **removes**
  an attribute — so a consumer's own `title` was discarded on every untruncated `Text`.

All ten now match upstream's position, and the sweep reports **0 drift**.

`Lightbox` was the entry's stated reason for leaving the set alone ("upstream's order lets a
caller-supplied `oncancel` _replace_ `handleCancel`, so Escape stops calling `onOpenChange(false)`").
That is a real upstream bug, and it is not an argument for the wrong spread order — it is an
argument for the rule `CLAUDE.md` already carries: an event the component handles itself is
destructured out of `$props()` and invoked explicitly. `oncancel` is now composed the way `onclick`
and `onkeydown` already were, so the consumer is heard, `preventDefault()` still pins the dialog
open, and the spread's position stops mattering.

**The rule this earns:** a debt that states a count is as rotten as a test header that states one.
This one had been carried across three batches on an estimate nobody re-measured, and it named
four components that were never the problem while missing all five that were.

### `TypeRole` takes no `weight` — retired

- **units:** theme/expand-type-scale.ts, cli (assets/theme.template.ts)
- **kind:** api-divergence
- **retires:** retired at 0.4.2 polish

**Closed.** `TypeRole` now declares `weight` alongside `weights`, and
`expandTypeScale` resolves it exactly as upstream's `defineTheme` does: on `heading` it fills
every level `weights` does not name, on `body` and `code` it sets that text role's token
directly, and `weights` wins where both apply. `TypeWeight` also widened to
`… | (string & {})` to match upstream's `FontWeight`, which documents raw CSS values as a
deliberate escape hatch — and a new `resolveWeight` keeps the named/raw split upstream's
`resolveFontWeight` draws, so `'bold'` becomes `var(--font-weight-bold)` while `'900'`
passes through.

Upstream's six-case `describe('typography weight derivation')` is ported into
`src/tests/theme.test.ts`, reading `resolvedTokens` rather than `tokens` because this port
keeps the raw input map separate — against the wrong map every one of them would pass
vacuously.

The annotated theme template documents `weight` now instead of naming this entry as the
reason not to; `packages/cli/scripts/check-theme-template.test.mjs` still passes 7/7, which
is what keeps the two in step.

### `Timestamp` expanded `useDevWarning` inline — retired, and the entry's premise was wrong

- **units:** Timestamp, Field, hooks/useDevWarning
- **kind:** deliberate-divergence
- **retires:** retired at 0.4.2 polish

**Closed, but not the way the entry described.** It read "`Timestamp` warns from an `$effect`
(client-only); upstream warns during render (server too)" and proposed moving `Timestamp` to
`Field`'s shape. Both halves were wrong, and checking upstream is what showed it: upstream's
`useDevWarning` is `useRef` + **`useEffect`**, so it does not warn during SSR either, and
`Field` reaches it through this port's own `useDevWarning`, which is an `$effect` — the two
shapes were already identical and neither warned on the server. There was no SSR difference to
close.

The real divergence was narrower and is now fixed: this port's `useDevWarning` took `message`
as a plain string captured at init, where upstream's is an ordinary argument re-evaluated each
render and listed in the effect's dependency array. `Timestamp` interpolates the value that
failed to parse, so a captured string would have reported the mount-time value — which is
exactly why it expanded the hook inline instead of calling it. `message` now accepts
`string | (() => string)`, and `Timestamp` calls the hook like every other consumer.

**The rule this earns:** a debt that asserts what upstream does is worth re-reading against
upstream before acting on it. This one would have had us "fix" a difference that did not exist
while leaving the one that did.

### Ten `./utils` symbols sat on the wrong subpath — retired

- **units:** -
- **kind:** api-divergence
- **retires:** retired at 0.4.2 polish

**Closed.** `SizeValue`, `parseStyleKey`, `themeProps`, `themeDataAttributes`, `ClassProps`,
`ClassValue`, `ThemeProps`, `ThemeDataAttributes`, `observeResize` and `unobserveResize` are all
on `./utils` now, so `import {themeProps} from '@astryx-svelte/core/utils'` resolves here as it
does upstream.

Two things deliberately did **not** move. The _files_ stay in `internal/` and `theme/`: they are
imported by name across the tree and relocating them is whole-tree churn with no
consumer-visible effect — that half of the "two homes for one upstream dir" item stays open in
`port/todo.md` as the internal-imports problem it always was. And the root re-exports stay,
because they have shipped since 0.3.1 and removing one to tidy a barrel would break a consumer
for no gain. This was placement, and adding the missing placement is the whole fix.
