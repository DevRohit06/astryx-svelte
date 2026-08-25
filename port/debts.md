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

Upstream slices `Children.toArray(children)` into a visible subset and a hidden measurement copy; a Svelte snippet is one opaque unit that can be rendered twice but never _sliced_, so the visible row is data-driven (exactly the shape `useOverflow`'s docstring anticipates). `overflowRenderer` is a `Snippet<[OverflowItem<T>[]]>` and `OverflowItem<T>` carries `{ value, index }` where upstream's carries `{ child: ReactElement, index }`. Rendered DOM, classes (byte-identical, oracle-clean) and fit behaviour are otherwise identical. Same forced-snippet-translation family as `Popover`/`Tooltip` above. This resolves the "**`Children.toArray` rendered twice**" blocking design decision (§Blocking design decisions) in favour of candidate (a) — the single hidden measurement container is kept, not given up. **Test suite ported** in `src/tests/overflow-list.svelte.test.ts`, whose own header carries the case contract against the current pin (`exposes a displayName` dropped — Svelte has no such surface; `forwards a ref` ported as an attachment counterpart; three `textContent`/`toBeEmptyDOMElement` cases restated to tolerate Svelte's `{#if}`/`{#each}` anchor comments + whitespace, which are `display:none` in the flex container). Runs in the **client** (Chromium) project with upstream's exact `offsetWidth`/`ResizeObserver` monkeypatch — the `server` node project has no DOM to mount into

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

Upstream publishes one per component — `./Button`, `./Card`, and so on — where this port ships
`.`, `./vite`, `./theme`, `./theme/define`, `./theme/syntax`, `./hooks`, `./naming`, `./utils`,
`./i18n`, `./locales/*.json`, `./astryx.css` and `./base.css`. Defensible while the barrel is
small, but a real surface difference. This entry twice carried a **count** of our own subpaths
that drifted as they were added (corrected 7→9 in `ledger/016`, wrong again by four at 0.4.5);
the list above is the record instead, and the number belongs in `status.md` if it is wanted at
all

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
- **retires:** when `ThemeConfig`/`ComponentOverrides` are renamed to match upstream, and the remaining `theme/types.ts` + over-exports are swept

A substantial set of names upstream's `theme/index.ts` publishes that ours does not — deliberately
unnumbered here, because every count this entry has carried went stale within a batch and a stale
count makes a growing gap read as a settled one. Re-measure with the surface sweep rather than
trusting a figure in this paragraph. **Batch 8 closed the `Theme`/`useTheme` family** (`Theme`, `ThemeContext`, `ThemeContextValue`, `useTheme`, `UseThemeReturn`, `ThemeMode`, `ResolvedThemeMode`, `resolveThemeToken(s)`, the two options types, `tokenVar`, `tokenVars`, `tokenDefaults`) and started `theme/types.ts`, which now holds `ThemeMode` alone — the prose-theming types in it land with the Prose-defaults item. What remains is chiefly the per-group token `*Vars`/`*Defaults` exports and the rest of `theme/types.ts` — plus a set of over-exports and one remaining name drift, `ThemeConfig`/`ComponentOverrides` vs `DefineThemeInput`/`ComponentStyleMap`. (The other drift, `generateThemeCss`/`generateOnMediaCss` vs upstream's `…CSS`, closed in batch 034 along with the shape change behind it — see the retired entry.) The 0.4.5 sweep also found the gap splits two ways that this entry did not distinguish: some names are absent from _every_ barrel here, others are reachable from the root but not from `./theme` — the second kind is a placement problem, not a missing port, and is the cheaper half to close

### Three `./theme` names have no upstream counterpart or the wrong one

- **units:** -
- **kind:** api-divergence
- **retires:** when `TokenMap` is made module-private

(batch-7 sweep).
`TokenMap` has **zero** occurrences anywhere in upstream's `src/`, so it is API this port
invented and should be made module-private.

> **Three of the four closed in batch 030.** `TypeRole` and `TypeWeight` were name drift for
> upstream's `TypographyRole`/`FontWeight`, and `TypeScaleConfig` was _shape_ drift under a
> shared name — upstream's `{base, ratio, weights?}` against this port's `{base, ratio}`, so a
> consumer typing against the published name got an object `expandTypeScale` would not accept.
> This entry said that last one wanted an `astryx-parity` pass rather than a rename, and it did:
> the expander had absorbed the font-family and named-weight derivation that upstream keeps in
> `defineTheme`. Both moved, the three names are upstream's, and the move surfaced a real defect
> — `heading` did not inherit `body`'s family. `TokenMap` alone remains

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

### `Icon`'s component mode has no example block

- **units:** Icon (docs examples)
- **kind:** unported
- **retires:** with `@lucide/svelte`

The demo route hand-drew an SVG for it (`routes/squiggle-icon.svelte`); that route is gone and
`docs/src/lib/examples/Icon/` has no counterpart, so component mode is currently shown by its
props table alone. Retires with `@lucide/svelte`, which supplies a real component-mode icon

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
the `@lucide/svelte` icon registry (Phase 3), like the example blocks' substitutions

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

### The docs example blocks substitute built-in icons for upstream's Heroicons

- **units:** docs (examples)
- **kind:** deliberate-divergence
- **retires:** with the `@lucide/svelte` icon registry (Phase 3)

Upstream's
blocks import `@heroicons/react`; the built-in registry is the 26 icons the components
themselves need, so blocks needing a tag, star, bookmark, scissors, pin, u-turn, flag or
person glyph use a built-in and say so in a header comment. `EmptyState` (`search`) and
`Toolbar` (`chevronLeft`) are near-exact swaps; the rest are approximations, and
`BottomSheetSnapPoints`' turn-by-turn list is the widest of them — six Heroicons over
twelve steps collapse onto four built-ins. Retires with the `@lucide/svelte` icon registry
(Phase 3)

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
identical bytes, three importers. It began as a mirror of the demo route's own
`thumbnail-images.ts`, kept as a second copy rather than imported from core's `src/`, which
`docs/` does not reach into; the route has since been retired and this is the only copy

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
obvious first dogfooding job of the next docs pass. Upstream's own `PropsTablePattern` story shows
the shape the props table should take

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

### The sheet family's effect phases are Svelte's, not upstream's, in three places

- **units:** BottomSheet, BottomSheetPanel, BottomSheetSwitcher
- **kind:** deliberate-divergence
- **retires:** never

Behaviour is identical; the _shape_ is not, and all three differences trace to one fact React
does not have. `bind:this` is an effect created **after** the script's effects, and a child
component's effects run **before** its parent's — so where React's `useLayoutEffect` runs after
the commit with `ref.current` already populated, a Svelte effect has to be placed against that
order deliberately.

**The trigger capture runs in its own pre effect.** Upstream captures `triggerRef` _inside_ the
dialog-opening effect, on the `!dialog.open` branch (`BottomSheetSwitcher.tsx:299-301`). Here that
would be too late: the item's `focusPanel` is a child effect and has already pulled focus into the
sheet, so `document.activeElement` would be a control _inside_ the sheet and closing the flow
would "restore" focus into the sheet it just dismissed. A `$effect.pre` is the only point where
the answer is still the page's. This shipped as a defect first and is the reason the effect is
split out (`ledger/029`).

**Three panel effects guard on the element.** Upstream's have no such guard, because
`waitForTransition(null)` completes immediately by contract and a React ref is populated by the
time a layout effect reads it (`BottomSheetPanel.tsx:446-467,472-481,482-500`). Here a `null`
element means _not yet bound_ rather than _nothing to wait for_, so returning early and letting
the effect re-run when `bind:this` lands is the translation. Without it the entrance completed on
the frame it began — also a shipped defect.

**`focusPanel` and `showModal()` are reordered in the switcher path.** Upstream runs the
switcher's `showModal()` as a layout effect and the item's `focusPanel` as a passive one, so React
guarantees showModal-then-focus; child-before-parent makes ours focus-then-showModal. Verified in
Chromium rather than reasoned about: `showModal()` and `show()`, with and without a prior focus,
against a `tabindex="-1"` panel holding a `[data-autofocus]` input — all four combinations end on
the panel, because the dialog focusing steps pick it as the first focusable area regardless. No
observable difference, and it is what makes the trigger capture above load-bearing

### Only three of upstream's locale catalogs are ported

- **units:** i18n (locales)
- **kind:** unported
- **retires:** when the remaining catalogs are vendored

Both packages declare the same `"./locales/*.json"` subpath, so the specifier shape matches — but
upstream's `locales/` ships a catalog per supported language and this port vendors `en.json`,
`fr-FR.json` and `pseudo.json` only. Every other specifier a consumer can write against upstream's
documentation (`de-DE.json`, `ja-JP.json`, and the rest) resolves upstream and throws
`ERR_MODULE_NOT_FOUND` here. The catalogs are vendored verbatim — `.prettierignore` excludes
`src/lib/locales/` precisely so the upstream bytes survive — so closing this is copying, not
translating. Surfaced by the 0.4.5 surface sweep; it had never been recorded anywhere

### `./theme/tokens` and `./theme/tokens.stylex` are not exported, though the build already ships them

- **units:** theme (exports map)
- **kind:** api-divergence
- **retires:** when the two `exports` keys are added

Upstream exports both, from `theme/tokens.ts` and `theme/tokens.stylex.ts`. This port's `exports`
map has neither, while `dist/styles/tokens.stylex.js` **is already in the tarball** — so the file a
consumer needs ships, and only the door is missing. Two keys. It was measured during the 0.4.1
tracking pass and written down in `port/upstream-diff.md`, whose own header says it is
point-in-time analysis rather than spec, and no agent greps it; that is how a two-line fix stayed
open across four batches. Recorded here so it is findable

### `tailwind-theme.css` has no counterpart

- **units:** theme (tailwind-theme.css)
- **kind:** unported
- **retires:** when the Tailwind bridge is ported

Upstream ships a `./tailwind-theme.css` subpath mapping its tokens into Tailwind's `@theme inline`
layer, so a Tailwind consumer can use Astryx tokens as Tailwind utilities. Nothing here
corresponds. Noted in `ledger/012` and in `port/upstream-diff.md` — both of them
per-batch or frozen records that the parity agents do not read — so it has been effectively
invisible since batch 11. Recorded here instead

### `BottomSheet`'s `height` and `snapPoints` doc types name their alias where upstream writes the members

- **units:** BottomSheet (docs props table)
- **kind:** deliberate-divergence
- **retires:** never

Upstream's `.doc.mjs` shows `'hug' | 'capped' | 'tall' | number | string` and
`ReadonlyArray<number | string>`; ours shows `BottomSheetHeight | number | string` and
`ReadonlyArray<BottomSheetSnapPoint>`. Not a porting shortcut — upstream's strings are
**hand-written prose**, and the members are unrecoverable here by construction: a union of string
literals and `string` is collapsed to `string` by TypeScript before the docs generator sees the
type, and prop types are read from `dist/**/*.d.ts` precisely so nothing about them is guessed
(`docs/scripts/lib/props-types.mjs` says so at `renderType`). Upstream's own source declares the
same `BottomSheetHeight | number | string`.

What was a defect and is fixed: the two names used to be `BottomSheetHeightValue` and
`BottomSheetSnapPointValue`, local import aliases that existed only to dodge a lint error, so the
props table named types **no consumer could import**. Both now name the exported types the barrel
publishes, which is the part that mattered

### `BottomSheetPanel`'s `state` prop is `panelState`

- **units:** BottomSheetPanel
- **kind:** deliberate-divergence
- **retires:** never

Svelte's compiler asks for the rename. A local binding named `state` in a scope that also uses the
`$state` rune emits `store_rune_conflict` — _"Referencing a local variable with a `$` prefix will
create a store subscription. Please rename `state` to avoid the ambiguity"_ — on both the client
and server generations. The component is module-private on both sides, so no published API moves.

Recorded because it is otherwise **re-found every batch**: `astryx-parity` greps this file to
answer "is this drift already known?", and at 0.4.5 it raised the rename as a finding, compiled a
replica to test the justification, saw it compile, and reported the reason as not reproducing. It
was half right — the in-file comment claimed Svelte _errors_, and it warns. The rename is correct;
the overstatement was what made it look invented

### Ported `getByRole` name assertions are substring matches, where upstream's are whole-string

- **units:** src/tests (client project)
- **kind:** api-divergence
- **retires:** when every string `name` in the client suites carries `exact: true` and `status.md`'s assertion-strength count reaches zero

Testing Library matches an accessible name as a **whole string**; Playwright, which supplies the
browser project's locators, matches a string `name` as a case-insensitive **substring**. Every
ported case that reads `getByRole('button', {name: 'Delete'})` verbatim therefore asserts strictly
less than the upstream case it ports, and passes in situations upstream's exists to catch.

Found while porting `VisuallyHidden`: removing the icon span's `aria-hidden` made the control's
accessible name `'Trash Delete'`, and the case still passed. It fails, correctly, with
`exact: true`.

The count is generated into `port/status.md` rather than stated here, because it is the size of a
sweep that has not happened and will move. The sweep is its own batch: adding `exact: true` will
surface every place this port's accessible name differs from upstream's, and each of those is a
parity defect to triage rather than a test to relax. A regex `name` is substring-matching on both
sides by construction and is excluded

### Rest-prop and inline-style precedence disagrees with upstream in four components

- **units:** Blockquote, Badge, ChatComposer, VisuallyHidden
- **kind:** api-divergence
- **retires:** when each component's spread order matches upstream's and `VisuallyHiddenProps` matches upstream's `Omit`

Upstream settles precedence by where a spread sits in `mergeProps(...)`; this port settles it by
where an attribute sits in the element's attribute list, since the last one written wins. The two
have drifted apart in four places, each found while porting that component's suite in batch 031 and
each **invisible to every upstream case**, which is why none of them is a test failure:

- **`Blockquote`** spreads `{...rest}` _before_ its class and style attributes; upstream spreads
  `{...props}` _after_ `mergeProps(...)`. Nothing collides today — `class`, `style` and `xstyle` are
  destructured out of rest on both sides — but the order is upstream's inverted, and it is the exact
  shape of the `ComplexSelector` `onclick` bug in `ledger/026-selector-family.md`. `Code` and `Kbd`
  match upstream.
- **`Badge`** spreads `{...rest}` first, so `themeProps`' output wins where upstream lets a
  consumer's rest props override it. Only `data-variant` collides in practice. Its sibling
  `StatusDot` spreads last and matches upstream.
- **`ChatComposer`** spreads `{...rest}` first against upstream's last, so the
  `themeProps('chat-composer', {density})` data attributes are consumer-overridable upstream and not
  here. Its sibling `ChatComposerDrawer` spreads last and carries a comment saying so — the two
  components in one family disagree.
- **`VisuallyHiddenProps`** omits `'class' | 'style' | 'xstyle'` from `BaseProps`; upstream's omits
  only `'className' | 'style'`, leaving `xstyle` in the published type even though its own docstring
  says it intends to omit it and its implementation never passes it to `stylex.props`. This port's
  type matches upstream's stated intent rather than upstream's type.

Three further instances of the same family **were** behavioural and are fixed rather than recorded:
`AspectRatio`, `Stack` and `Grid` each let a consumer's `style` override the very prop the component
exists for — `<Stack width={400} style="width:100%">` gave 100% here and 400px upstream. Upstream
merges `{...style, ...sizingStyle}`, sizing last. `AspectRatio`'s was caught by an upstream case;
the other two have none and were found by reading the pair after it

### The docs emitter names value-carrying type aliases where upstream spells the values out

- **units:** docs (scripts/lib/props-types.mjs)
- **kind:** api-divergence
- **retires:** when `renderType` expands a named literal union inside a composite type and prints small object aliases structurally, and `PORT_DOC_TYPE_DEBT` in `doc-prop-literals.test.ts` is empty

Upstream's `.doc.mjs` files are hand-authored, so a prop's documented `type` says
`(reason: "auto" | "manual") => void`. This port generates them from its own compiled
`.d.ts`, and `renderType` prints `(reason: ToastDismissReason) => void` — the name, not the
values. A reader without an IDE cannot see what is legal, which is exactly what upstream's
`docPropLiterals.test.ts` exists to prevent, and porting that suite in batch 031 is what
surfaced it.

Three classes, wanting different fixes. **A composite alias whose values reach neither
surface** (`InputStatus`, `TextType`, `TableSortState`, `SelectorStatus`) — upstream prints the
object structurally. **A literal union named inside a larger expression** (`boolean |
LayerPlacement`, `SectionDivider[]`) — the least arguable, since `renderType` inlines a union
only when the prop's whole type is literals plus primitives. **The `IconName` prose exemption
inherited thirteen times** — upstream types its icon slots `ReactNode | IconType`, which
carries no literals, so its `ENUMERATED_IN_PROSE` registry needed one entry; this port's slot
is `IconName | Snippet`, so thirteen props inherit a bargain upstream never had to pay.

The affected props are listed in `PORT_DOC_TYPE_DEBT` in
`packages/core/src/tests/doc-prop-literals.test.ts` rather than counted here, and that list
carries the class oracle's hygiene in both directions: an entry that stops violating fails the
run, and a violation that is not listed fails the run. It can only shrink. Upstream's own
`ENUMERATED_IN_PROSE` is left at its single entry — widening it would be divergence rather
than porting

### Nothing enforces the fully-specified relative import convention

- **units:** core (eslint config)
- **kind:** unported
- **retires:** when an `import/extensions` rule (or equivalent) fails a relative specifier with no extension

CLAUDE.md § Conventions requires relative imports to carry the `.js` extension even for `.ts`
sources. It is an authoring rule and nothing checks it. `svelte-package` rewrites an existing
`.ts` ending to `.js` but never _adds_ a missing one; eslint has no `import/extensions` rule
configured; and `publint` checks that `exports`/`main`/`bin` resolve to published files, not
that specifiers inside those files are fully specified.

So an extensionless relative import would pass build, lint, publint and every Vite-resolved
consumer, and break only a strict-ESM consumer of the tarball. Upstream reaches that failure
through a gap in its `babel-plugin-add-extensions` — the subject of a suite recorded as
no-counterpart here — and this port would reach the same failure by omission. Surfaced while
assessing that suite in batch 031

### `TabList`'s stranger-in-the-strip warning cannot see a `role` attribute flip

- **units:** TabList
- **kind:** api-divergence
- **retires:** when Svelte gains an after-every-render hook

Upstream's warning is a **dependency-less** `useEffect` — "after every commit" — because React cannot
know which render put a non-tab into a `role="tablist"` strip. Svelte has no after-every-render hook,
and the strip's children belong to the consumer's snippet, so this port uses a `MutationObserver` on
`childList` (the same substitution `useListFocus` makes for its roving-tab-stop repair), checked once
on mount and latched after the first warning. It catches a stranger mounting or unmounting; it does
**not** catch an existing child's `role` attribute flipping away from `tab`, which upstream's next
commit would. Upstream's own new test only covers the initial-render case, so the gap is unexercised
on both sides

### `useMergedRefs` (#5267) has no Svelte counterpart

- **units:** hooks/useMergedRefs
- **kind:** unported
- **retires:** never

0.5.0 adds `useMergedRefs` as a published hook and migrates `Avatar`, `Button`, `Item`, `SideNav`,
`TabList`, `TopNav`, `Text` and `Heading` onto it, so a merged ref keeps its identity across
rerenders (#5266, #5267, #5429). The whole hook exists to stabilise a callback ref React would
otherwise recreate every render. Svelte binds the element once via `bind:this` and a focus trap
arrives as an attachment, so there is no ref-merging to stabilise and nothing for the hook to do.
The absence is recorded rather than filled: an empty image, not a behaviour difference

### `BottomSheet`'s scrim-closing condition is a parameter, not a call-site expression

- **units:** BottomSheet
- **kind:** deliberate-divergence
- **retires:** never

Upstream evaluates `hasScrim && !isOpen && isPresented` (standalone) and
`hasScrim && isFlowVisible && activeSheet == null` (switcher) inline at each `stylex.props`. One
module serves both hosts here, so `bottomSheetDialogAttrs` takes the host-specific half as an
`isScrimClosing` parameter and keeps the `hasScrim &&` conjunct inside. Logically identical, and the
class oracle proves the emitted classes are; recorded only because the two hosts' conditions now sit
apart from the key they select

### `useAutoMediaMode` re-measures on its tracked signals, not on every render

- **units:** useAutoMediaMode, MediaTheme
- **kind:** deliberate-divergence
- **retires:** never

Upstream's measurement effect carries **no dependency array on purpose** — its own comment says a
surface's colour is a painted value that no dependency could name, so it re-runs on every React
render and skips its expensive half through a `lastRef` memo when neither the backdrop nor the
theme moved. Svelte has no per-render hook: an effect re-runs only when a signal it read changed.
Ours tracks the three things that are signals — the bound element, `mode === 'auto'`, and
`useTheme().tokens` — and keeps the same memo, so every case upstream's array-free effect exists to
catch is still caught **except one**: an ancestor's painted background changing while the theme
stays put (an inline `style` written by a parent, a class swap). `mode="auto"` then keeps its
previous answer until the theme, the mode or the element changes. The alternative — a
`MutationObserver` over the ancestor chain's `style`/`class` — is machinery upstream does not have
and would still miss a distant opaque ancestor, so the gap is recorded rather than invented around.
Upstream's own regression case for this (`MediaTheme.dom.test.tsx`, "re-measures when the surface
changes without the theme changing") is in the unported client suite

### `BaseTypeahead`'s grouped dropdown numbers options by render order, not by `results` order

- **units:** BaseTypeahead
- **kind:** upstream-lag
- **retires:** when upstream fixes it

Replicated, not fixed. Option grouping arrived at 0.5.0: the dropdown renders
`groupItems(results, {ungroupedFirst: true})` and numbers the rows with a counter that walks
**render** order (`flatIndex++` inside upstream's render IIFE), while the keyboard model still
indexes `results` — `ArrowDown` clamps to `results.length`, and `Enter` selects
`results[highlightedIndex]`. Grouping reorders: ungrouped rows come first and each named
group's rows are gathered together, so as soon as any item carries an `auxiliaryData.group`
and the source's order interleaves groups, flat row _n_ is no longer `results[n]` — the
highlighted row and the row `Enter` commits come apart, and `aria-activedescendant` points at
the row the arrow keys did not move to. Ungrouped results are unaffected (`groupItems` returns
one `heading: null` group holding `results` verbatim, so the two orders coincide), which is
every call site that predates 0.5.0. Upstream shipped the feature with no test for it — the
0.5.0 suite delta is two `Tab`-dismissal cases and nothing about groups — so nothing upstream
catches this either

### `hasActiveFocusTrapEscape` is built on the trap's own Escape stack, not a separate trap-only count

- **units:** hooks/use-focus-trap.svelte.ts
- **kind:** deliberate-divergence
- **retires:** when `useLayerDismissal` + `layerStack` land and the shim is re-based on a trap-only count

Upstream 0.5.0 moved Escape coordination onto one shared dismissal stack and then went to the
trouble of keeping a _second_, private `activeEscapeTrapCount` beside it, incremented from the
same `isActive && onEscape != null` expression that registers the trap on the stack. The
duplication is the point: the shared stack carries families that never trap focus — tooltips,
hover cards, dialogs — and a shim that counted those would tell `BottomSheetSwitcher` a trap sits
above it when none does, so the sheet would stop closing.

Here there is one stack, `useFocusTrap`'s own, and the shim reads its length. The answers are
identical today because nothing but a focus trap ever pushes onto it, and
`tests/focus-trap-escape-shim.svelte.test.ts` pins every one of upstream's answers — including
the four families that must stay `false`. The divergence only becomes a defect the moment the
shared stack lands and other families join: at that point the shim needs its own trap-only
count, exactly as upstream's does, or those four cases start failing. Which is what they are
there to do.

The `@deprecated` tag is carried with the same qualification. Upstream's redirect — "join the
stack rather than ask whether a trap exists" — names a stack this port does not have, so the tag
says so rather than pointing consumers at nothing

## Retired

Closed, kept as the record. **Nothing below counts as an open debt** — `scripts/status.mjs` stops
tallying at this heading, and `astryx-parity` must not find a retired entry when it greps for
"is this drift already known?", or it would skip live drift.

### `generateThemeCss` returns a flat stylesheet where upstream returns two blocks

- **units:** theme/generate-theme-rules.ts
- **kind:** api-divergence
- **retires:** when `generateThemeCss` returns `ThemeCSSOutput`, its `@layer` wrappers move to its callers, and `generateThemeRules` is exported

Upstream's `generateThemeCSS(theme)` returns `{prose, component}` — two `@scope`
blocks and no layer wrappers — and leaves it to each caller to put them in the right
layer. This port's `generateThemeCss(theme)` returns one string with the
`@layer reset` / `@layer astryx-theme` wrappers and a generated-file header already
applied, which is the shape `<Theme>`, the theme build scripts and the docs build all
consume. Upstream also exports `generateThemeRules(theme): string[]`, the rule list
behind the split; this port has only `generateThemeRulesSplit`.

Found while porting `theme/generateThemeRules.test.ts` in batch 030, whose cases
call both `generateThemeRules` and the two-block `generateThemeCSS` and so cannot be
ported case for case until the shapes match. **The suite is deliberately left
unported rather than partially ported**, and `port/status.md` keeps counting it: the
fix is a wide change — around twenty test files call `generateThemeCss(theme)` and
assert on the string, plus `<Theme>`, both theme build scripts and the docs build —
and belongs in a batch of its own rather than inside one restructuring `defineTheme`
at the same time

Scoping it across batches 033 and 034 revised it twice, and the first revision was
wrong. Batch 033 recorded that exporting `generateThemeRules` would require
re-architecting the generator, because upstream derives the split _from_ the flat list
while this port generates the two groups separately. Running the generator disproved
that: **every** rule this port puts in `prose` starts with `:where(`, **no** rule it
puts in `component` does, and the size overrides already fall after the themed type
rules that the ordering case pins. Upstream's derivation and this port's grouping
therefore agree exactly, and the flat list is a genuine addition. The claim had been
reasoned from reading the two implementations rather than measured, and one probe
settled it.

What the entry did understate is real, and it is **DOM-observable**: upstream's `<Theme>` injects _two_ `<style>` elements, marked
`data-astryx-theme-prose` for the reset layer and `data-astryx-theme` for the theme
layer, where `theme.svelte` injects one carrying both. A consumer or test selecting
`style[data-astryx-theme-prose]` finds nothing here. The two name drifts in the
`0.4.5` surface entry above (`generateThemeCss`/`generateOnMediaCss` vs upstream's
`…CSS`) are the same change and should land with it

**Closed at 0.5.0, in batch 034.** `generateThemeRules`, `generateThemeCSS` and `ThemeCSSOutput`
are exported from `./theme` and `./theme/define`, `generateOnMediaCss` is `generateOnMediaCSS`, and
`<Theme>` injects one `<style>` per layer. The published surface is upstream's exactly.
`generateThemeCss` — the layered, headered document — still exists and still backs the theme build
scripts and the docs build, but is off the public barrel: every one of its callers reaches it by
deep path into `dist/`, which the `exports` map does not expose, so the single generator that keeps
a built stylesheet and the runtime from drifting survives without appearing in the API. The suite
this entry blocked, `theme/generateThemeRules.test.ts`, is ported whole

### Batch 5's doc omissions — two of the four closed at 0.4.1

- **units:** NumberInput, CodeBlock
- **kind:** upstream-lag
- **retires:** retired at 0.5.0

`NumberInput`'s `onKeyDown` and `CodeBlock`'s `highlightMode` are still real source props absent from both locales of their `.doc.mjs` props tables; ported from source, as the `Lightbox` `defaultIndex`/`hasAutoPlay` gap below already is. `NumberInput`'s `width` and `FileInput`'s `width` were the other two, and **0.4.1's props tables document both**, so those halves are retired.

**Closed at 0.5.0.** Upstream's documentation PRs (#4315-#4320) document
`NumberInput.onKeyDown` and `CodeBlock.highlightMode`. Our re-emitted `.doc.mjs` carry both — the
handler under Svelte's lowercase `onkeydown`, with upstream's description.

### Upstream doc gap: `defaultIndex` and `hasAutoPlay` are absent from `Lightbox.doc.mjs`

- **units:** Lightbox
- **kind:** upstream-lag
- **retires:** retired at 0.5.0

Real props (present in `LightboxProps` and the shipped `.d.ts`) but are absent from `Lightbox.doc.mjs`'s props table in both locales. Ported from source, per the Icon px→rem precedent

**Closed at 0.5.0.** Both are documented in upstream's `Lightbox.doc.mjs`, and our re-emitted
copy carries them.

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

### `DateInput`'s touch geometry cannot match upstream's class names — `defineConsts` hashes the file path

- **units:** date-input (tokens.stylex.ts, wheel.stylex.ts, month-scroller.stylex.ts, month-year-wheels.stylex.ts, touch-date-field.stylex.ts)
- **kind:** deliberate-divergence
- **retires:** never — unless upstream stops using `defineConsts`, or both oracles learn to blind a const hash the way they already blind a marker hash

`DateInput/tokens.stylex.ts` is the first `stylex.defineConsts` in either tree, and it breaks the
property this whole port is built on: _authoring against the same token references makes the
compiler emit byte-identical CSS_. That holds for `defineVars` because upstream's variable keys
are `--`-prefixed literals — `resolveVarGroupKey` short-circuits on those and returns
`var(--spacing-2)` whatever file it was called from. `defineConsts` has the same escape hatch and
upstream does **not** take it: its keys are `daySize`, `paneBlockSize`, … so
`@stylexjs/babel-plugin` names each one

```
constKey = 'x' + hash(`${packageName}:${pathFromPackageRoot}//${exportName}.${key}`)
```

A consumer of a `defineConsts` member compiles to `var(--<constKey>)` — the plugin never reads the
defining file under `unstable_moduleResolution: {type: 'commonJS'}` (only
`experimental_crossFileParsing` does) — and the atomic class is hashed from _that string_.
`processStylexRules` substitutes the literal back in at sheet-generation time, so the emitted
**declaration** is right; the **class name** is a hash of our package name and our file path.

Ours is `@astryx-svelte/core:src/lib/components/date-input/tokens.stylex.ts`; upstream's is
`@astryxdesign/core:src/DateInput/tokens.stylex.ts`. Neither half can be made equal — the package
name is ours by definition — so eleven classes differ **by name only**, verified declaration for
declaration against `dist/astryx.css`:

| upstream   | ours       | declaration                                 |
| ---------- | ---------- | ------------------------------------------- |
| `xm8gem`   | `x1jwe3ac` | `height:calc(6 * 44px)`                     |
| `xygd9yz`  | `x5rzc5i`  | `min-height:44px` (doubled selector)        |
| `xngvp7v`  | `x1pmxr54` | `min-width:44px` (doubled selector)         |
| `x1uameg1` | `xho1bbs`  | `padding-block:calc((6 * 44px - 28px) / 2)` |
| `xy8nx85`  | `x1h0w9py` | `grid-template-rows:repeat(6, 1fr)`         |
| `x6hpsvf`  | `x3qkrzd`  | `height:28px`                               |
| `x1y2t9nm` | `x178ksff` | `width:calc(44px - 8px)`                    |
| `xw1wawg`  | `x1dfrq2f` | `height:calc(44px - 8px)`                   |
| `x1tutbut` | `x1ywprd`  | `min-width:44px`                            |
| `x1dg37ty` | `x5ly87c`  | `min-height:44px`                           |
| `x7rbydg`  | `x184n3b7` | `top:calc(50% - (28px / 2))`                |

The other **119** classes the four touch modules emit match upstream's by name, byte for byte.

This is the same shape as `defineMarker`, whose class is also path-derived and which the class
oracle already diffs as marker-normalised CSS while the CSS oracle blinds its hash. The two
oracles need the same treatment here, and until they have it the eleven rows above read as
missing classes rather than as renamed ones.

**Rejected alternative, recorded so it is not re-proposed:** a nested `package.json` naming the
directory `@astryxdesign/core`, with the tokens module at `src/DateInput/tokens.stylex.ts` inside
it, _would_ reproduce upstream's canonical path exactly and close all eleven. It puts another
package's name in our tree to steer a hash, it would be copied into `dist/` by `svelte-package`,
and it encodes upstream's directory layout in a place no reader would think to look — a worse
thing to carry than a named debt.

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

### Core's demo workbench imported a downstream package's build output — retired

- **units:** -
- **kind:** deliberate-divergence
- **retires:** retired with the demo routes

**Closed by deletion.** The two files this named — `src/routes/+layout.svelte` and
`+page.svelte` — imported `../../../themes/neutral/dist/`, a relative path chosen so pnpm's
dependency graph would not see a cycle. It worked, because **the bundler's graph is not
pnpm's**: core's `build` ran `vite build` (the workbench) before `prepack` (the library), so on
a clean checkout core's build demanded an artifact from a package that builds _after_ core, and
rolldown failed with `UNRESOLVED_IMPORT` on both lines. It passed on every developer machine
because a previous run had left `themes/neutral/dist/` on disk; it failed on the first CI run
and the first Vercel deploy that ever built core. The interim fix made `build` a library build
only (`npm run prepack`) and moved the workbench to `build:demo`, run by CI after
`pnpm -r build` — which is what left the residue this entry recorded: the import still pointed
at a build artifact, so `pnpm -F @astryx-svelte/core dev` on a fresh clone needed a prior
`pnpm -r build`.

The whole workbench is gone (`ledger/029`), and with it the two imports, `build:demo`, core's
`dev` script and the CI step. Core's `build` stays a library build only, which is what upstream
does — its core `build` is `babel + tsc + css + umd` and produces no app at all, and its
`theme-neutral` takes core as a **peer** dependency. Nothing in this repo now reaches from core
into a package that builds after it.
