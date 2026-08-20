# Changelog

Every package in this workspace carries the version of the upstream
[Astryx](https://astryx.atmeta.com/) release it ports, and they are published together, so this one
file covers all ten.

**The version is the parity target, not a count of this port's own releases** — which means a
release the port makes on its own has no number of its own to take. 0.3.1 is the first of those: it
ports Astryx 0.3.0, exactly as 0.3.0 did, and changes only things upstream has no counterpart for.
Each entry states its parity target for that reason.

## 0.4.5

Ports Astryx `0.4.5`.

**This is the first release since `0.4.1`.** The `0.4.2` entry below was written, merged and never
tagged, so it never reached npm — upgrading from `0.4.1` brings everything in _both_ entries, and
nothing in `0.4.2` is superseded. It is kept below rather than folded in here, because it is an
accurate account of its own upstream target and rewriting it would lose that.

Across `0.4.3`, `0.4.4` and `0.4.5` upstream added exactly one component directory — `BottomSheet`,
promoted out of `lab` — extracted four modules onto subpaths of their own, and drifted inside
directories this port already shipped.

### `BottomSheet`, promoted out of `lab`

A mobile touch sheet that rises from the bottom edge, with drag-to-dismiss, drag-to-resize snap
points, and mobile-keyboard accommodation. Upstream did not write it for this release; it moved from
`packages/lab` into `core` at `0.4.4` and was rewritten on the way, so it arrives here as a fresh
port rather than as drift.

Two shapes. A standalone `BottomSheet` owns its own `<dialog>` — modal with a scrim by default,
non-modal with `hasScrim={false}` so the page behind stays interactive. A `BottomSheetSwitcher`
owns one shared dialog for a multi-step flow, and its children opt in with `sheetId`; handing off
between steps keeps the native top layer, moves the sheet to the incoming step's height, and never
closes and reopens the dialog underneath.

`height` takes `'hug'`, `'capped'`, `'tall'`, or any CSS length. `snapPoints` adds resting heights
the user can drag between; a stop of a quarter of the sheet or less is treated as a peek — it slides
away rather than reflowing into itself, and thins the scrim as it goes. Only a fully expanded `tall`
sheet accommodates the mobile keyboard, which is upstream's rule, and it stops doing so the moment
the user drags it to a shorter detent.

### An IME composition no longer reads as a command

Seven components ran their keydown logic while an IME composition was still open. Because the
composing keydown fires _before_ `compositionend`, a Korean, Japanese or Chinese user committing a
candidate with Enter was committing the pending date, selecting the highlighted option or toggling
it; the candidate window's arrows were stepping the time instead of walking candidates.

`DateInput`, `DateTimeInput`, `TimeInput`, `NumberInput`, `Typeahead`, `Selector` and
`MultiSelector` now guard on the shared `isImeKeyEvent` predicate, as upstream does. `ChatComposer`,
`ContextMenu` and `useTooltip` already behaved correctly but carried their own inlined copy of the
test; they call the shared predicate now, so there is one definition of "this keystroke belongs to
the IME" rather than four.

### Forms can declare a default optionality

`FormLayout` takes `defaultOptionality`, so a form states once whether its fields are optional or
required and only the exception carries a visible indicator. Fields resolve `isRequired` /
`isOptional` against it; a field outside any layout is unaffected.

### New

- `characterCount`, `firstCharacter` and `truncateCharacters` on `@astryx-svelte/core/utils` —
  grapheme-aware, so an emoji or a combining sequence counts as one character.
- `isImeKeyEvent` moves to `@astryx-svelte/core/utils`. The `hooks` re-export stays for one release
  and is marked deprecated, matching upstream.
- `getStandaloneShortWeekdayNames` for calendar headers, from the CLDR standalone forms.
- `deepMergeComponents`, split out of `defineTheme` so component style maps can be merged directly.
- `expandColorScale` takes a per-scheme accent — `accent?: string | [light, dark]` — so one seed can
  drive different accents in light and dark.
- `TreeList` exposes `density` and `variant` as theming axes.
- `StatusDot` takes an `icon` slot.

### Fixed

- Three documented theming targets rendered no class at all, so a theme could not reach them:
  `input-clear-button`, `date-time-input-toggle-icon` and `date-time-input-clock-icon`.
- `ComplexSelector`, `Banner`, `MobileNav` and `DateRangeInput` pick up upstream's fixes at these
  tags; `MobileNav`'s close-timing rework (#4290) retires a divergence this port carried.

### The demo routes are gone

`packages/core` no longer ships `src/routes` — a SvelteKit demo app that predated the documentation
site and duplicated it. Nothing published changes: the route was excluded from the tarball already.
`pnpm dev` now runs the docs site, which is where every component's examples live, and
`@sveltejs/adapter-auto` is no longer a dependency of `core`.

### Verified

Both fidelity oracles reach zero: **1,635 style keys and 532 inline call sites with no skips**, and
`astryx.css` matching upstream. All seven theme oracles are clean.

The closing audits are the reason to trust this release rather than the green suite. The ported
`BottomSheet` suites found seven defects during the port, six of them one mistake — a Svelte effect
reading the DOM a phase too early — and the idiom audit run _after_ those were fixed found two more
that 146 passing cases could not see, because the assertions they would have to fail are true in
either phase.

The same pass re-derived **every suite header against the `0.4.5` pin**. A header stating a case
count is a contract against upstream's file at a specific version, and 23 still named `0.4.1` or
`0.4.2`; four were not merely stale but wrong in a way that made a real gap look accounted for. 17
missing upstream cases landed as a result, including a five-case deferral whose stated reason had
expired.

172 client files at 4,828 cases, plus 44 server files at 939.

Two suites remain short of upstream and say so in their own headers rather than leaving it implied:
`SideNav` and `Slider`, both predating this release and tracked in `port/debts.md`.

## 0.4.2

Ports Astryx `0.4.2`.

No component was added, deleted or renamed upstream, so this is drift inside directories the port
already shipped: 28 `packages/core/src` component directories, three hooks, the theme internals, the
`en` locale catalog, and one new CLI command.

### Layers now correct themselves out of hosts that cannot legally contain them

A context layer renders an inert `<template>` marker at its position and mounts the real container
where the marker's parent allows it — inline when that parent is safe, portaled to the nearest legal
ancestor when it is not. A `HoverCard` written inside a `<p>`, a link, a `<td>` or an `<li>` no
longer depends on the HTML parser to reparent it.

`HoverCard` also defers mounting until it opens, so rich content never enters an invalid paragraph
even briefly, and every layer declares its own `font-size`/`line-height` rather than inheriting the
trigger's — the same `Tooltip` no longer renders at 13px from a caption and 20px from a lede.

### One hover-menu machine, five adopters

The hover→click guard, time-bounded reopen suppression, synchronous focus and focus restoration all
moved into the shared `useMenuHover`. `TopNavMegaMenu` lost its private copy and `SideNavItem` its
hand-rolled timers; `TopNavMenu`, `TopNavHeading`, `SideNavHeading` and `DropdownMenuSubMenu` gained
a guard they never had. Hovering a menu open and clicking it no longer dismisses it, and a menu
dismissed under a stationary pointer no longer springs back open.

### Touch targets, forced colors, and the SideNav hardening pass

`Switch`, `CheckboxInput` and `RadioListItem` floor their tappable area to 24x24 on a coarse pointer
(WCAG 2.5.8 AA), `Thumbnail` grows a hit inset, and `Slider`'s track floors to 24px. The selected
SideNav row survives Windows High Contrast — a 6% background tint flattens away entirely under
forced colors, leaving the current page unmarked — and every focusable row now draws the _shared_
focus ring, so a theme that restyles focus restyles all of them together.

### New

- **`astryx-svelte theme template`** writes an annotated reference of the whole `defineTheme`
  surface into your project. It is machine-checked against this port's own types, so it cannot drift
  into documenting a field that does not exist.
- **`theme build` warns about fonts you named but never loaded.**
- **`typography.body/heading/code` take a role-level `weight`**, filling every heading level
  `weights` does not name. Named weights become token references so retuning `--font-weight-*` moves
  them too; a raw CSS value passes through.
- **`ChatMessageBubble.width`**, so ghost-bubble custom content can span the full message column
  instead of the `max(80%, 280px)` cap.
- **`useContainerReveal`** gained a hover-intent dwell (`hoverDelay`) and forced states.
- **`Slider`'s thumb is inset by half its width at each end**, which is the geometry a native
  `input[type=range]` uses: at min/max it no longer overhangs the component box by 10px.
- **21 new locale keys.** `CommandPaletteFooter`'s keyboard hints and `DateTimeInput`'s time
  placeholders stopped being hardcoded English.

### Fixed

Live in shipped behaviour, not style drift:

- **Every `HoverCard` inside a `<p>`, `<a>`, `<td>` or `<li>` mounted hidden and never appeared.**
  Three faults compounded: the marker's attachment subscribed to the open state, the resolved mount
  was reallocated on every resolve, and the portal treated "no target" as nothing to do. Any one of
  them evicted a showing popover from the top layer with nothing left to re-show it.
- **A layer whose render call moved between two positions vanished**, because the portal removed it
  and never put it back; if it was open, it did not reopen.
- **`TopNavMegaMenuItem`'s drawer row drew no focus ring at all** — keyboard users had no visible
  focus anywhere in the mobile drawer.
- **`SideNavHeading`'s collapsed flyout could not be dismissed from the keyboard.** Its heading
  button was still wired to the trigger's click handler, so Enter and Space only re-focused the
  first item; Escape restored focus to nothing, because the collapsed trigger never registered.
- **`Switch` and `AvatarGroupOverflow` documented a `size` theming axis they did not emit.** A theme
  rule written against `[data-size]` silently matched nothing.
- **A `TreeList` with no expandable items indented every row** by a chevron column none of them had.
- **`Text` discarded a consumer's `title`** on every untruncated instance: the component wrote
  `title={undefined}` after the rest spread, and a later `undefined` removes an attribute. The same
  ordering hid a caller's `aria-label`/`role` on `Breadcrumbs`, `Heading`, `SideNav` and `TopNav`,
  and let a caller's `oncancel` replace `Lightbox`'s Escape handler.
- **`--radius-none` was `0.125rem` in four themes.** It is fixed by contract, like `--radius-full`,
  and must never be scaled.
- **A whitespace-only `Avatar` name rendered an empty plate** behind a blank accessible name.

### API

- `useTruncation`, `SizeProvider` and `FormLayoutContext` are published, closing the last of the
  missing exports upstream ships.
- `themeProps`, `parseStyleKey`, `observeResize` and seven siblings are reachable from
  `@astryx-svelte/core/utils`, the subpath upstream puts them on. Their existing root exports stay.
- `BreadcrumbMenuDividerProps` and `ContextMenuDividerProps` complete those two alias families.
- Three CLI internals (`buildHelp`, `buildKit`, `importSpecifier`) left the `api` barrel, where
  upstream keeps them module-private.

### Verified

Both fidelity oracles reach zero: 1,621 style keys and 515 inline call sites with **no skips**, and
`astryx.css` matching upstream across 1,504 shared classes. All seven theme oracles are clean, and
the token map now matches upstream family for family — same names, same counts, nothing extra on
either side — for the first time.

**The closing audits found a release blocker in this release's own headline feature**, and the
corrective-portal defects above are what they turned up. The cause was uncovered code: upstream
added roughly 90 test cases at this tag and the first pass ported 21, including none of the nine
that exercise exactly the layer paths that broke. Around 105 cases have since landed across
thirteen suites — among them the whole 21-case `useMenuHover` suite, which this port had never had
for a hook it rewrote from scratch. 165 client files, 4,621 cases, plus 854 server cases.

Two suites remain short of upstream and are named in `port/debts.md` rather than left implied:
`SideNav` (26 cases) and `Slider` (12, predating this release).

## 0.4.1

Ports Astryx `0.4.1`.

**0.4.1 and not 0.4.0, deliberately.** 0.4.1 is upstream's npm `latest`, and it repairs something
0.4.0 shipped: the `complex-selector-popup` / `multi-selector-popup` theme targets landed on an
element that cannot paint. Since the version here _is_ the parity target, porting 0.4.0 exactly
would have meant reproducing a known-bad implementation in order to undo it in the next release.

### Breaking: `useTableRowExpansion` is a detail panel, and nothing else

Its tree mode is gone and `useTableRowExpansionState` is deleted. Child rows that reuse the parent's
columns are now `useTableTreeData` + `useTableTreeState`.

Upstream shipped a codemod rather than a compatibility shim, and this follows it — **the first
codemods this port has ever registered**; `assets/codemods/registry.mjs` had been empty by design
since it was written, because a codemod migrates _between_ two releases and there had only been one.

```sh
npx @astryx-svelte/cli upgrade --from 0.3.1
```

All three of upstream's v0.4.0 transforms are here: the row-expansion migration,
`rename-dropdown-menu-radio-dot-target` and `rename-menu-divider-data-types`. The two renames matter
more than they look. A theme keyed on the removed `dropdown-menu-radio-dot` target **keeps compiling
and simply stops matching** — runtime themes are not validated, so there is no error anywhere, which
is why it needs a codemod rather than a line in this file. The rename is also not scope-preserving
and cannot be: `radio-indicator-dot` reaches every radio dot in the app, so each rewritten site gets
a `TODO(astryx upgrade)` comment asking whether the widening was intended.

Upstream's transforms are jscodeshift; these are `magic-string` + `svelte/compiler`, which changes
their reach in both directions. `.svelte` files are in scope, so a `<Table data={state.data}>` in
markup is rewritten in the same pass as the hook call. The divider rename's value-vs-type check is
`JSXIdentifier` upstream — here the import sits in `<script>` and the render sits in the fragment,
so the whole tree is walked before any decision is made.

### The Indicator layer

Three indicators (checkbox, radio, switch), a family-typed registry and `useIndicator`. A theme
replaces a control's visual **by name**, not per call site, so one entry reaches every component
that draws it — mapping `check` to `RadioIndicator` gives radio visuals to every single-selection
mark in the app. Each entry is checked against its indicator's family, so a replacement has to
accept the states that family passes.

`CheckboxInput`, `RadioListItem` and the menu checkbox and radio rows all draw from these now. The
menu radio's dot in particular is the shared radio dot, which is what retires the menu-specific
target above.

### Every focus ring comes from one definition

36 modules had their own ring. They now draw from one themeable definition, so a theme restyles
focus once rather than per component.

**This is also where the batch's most useful finding came from.** Migrating a module means deleting
its local ring declaration and wrapping the call site instead — and deleting the declaration while
forgetting the wrap produces **zero oracle mismatches**, because the ring now arrives from a
different module and its absence at the call site is not a difference either oracle is looking at.
**16 modules silently lost their ring**, and they were found by grepping, not by the gate that
exists to catch exactly this. Generalised: both oracles prove what a module _declares_, never what
an element _receives_. `TODO.md` carries it.

### Theme authoring: `extends` does something now

```ts
const myTheme = defineTheme({
	name: 'my-brand',
	extends: neutralTheme,
	tokens: { '--color-accent': '#FF0000' }
});
```

This was carried as a deferred debt on the grounds that a consumer would at worst hit a silently
ignored key. That was wrong on the facts: the CLI's shipped `theme.doc.mjs` had been documenting
`extends` the whole time — upstream's prose and worked example, carried over verbatim. The published
surface promised it while `defineTheme` dropped it on the floor. Tokens, components, icons and
indicators all merge with the base at lowest precedence; `name` is always the child's.

### New

- **`PanelSearchInput`**, **`DropdownMenuDivider`**, **`useClipboard`**, **`focusReturn`**,
  **`interactionModality`**, **`useLayer.offset`** (flip-safe: margins on both edges),
  **`usePopover.surfaceTarget`**, and the shared `astryx-popover-surface` class.
- **`NumberInput` is a text-backed spinbutton** — `type="text"` with `role="spinbutton"` and
  `aria-valuemin`/`valuemax`/`valuenow`, which is what lets `formatValue` show a thousands
  separator without the native control rejecting it. If you assert on it, its value is a **string**
  now and its bounds are the `aria-value*` attributes rather than `min`/`max`.
- **Menu items take a `variant`, a close policy and stable keys**; the selector search panel is
  rebuilt, and a theme can replace its check.
- **Container reveal is scoped by inheritance**, retiring the marker pool.
- **A theme build can name its own icon specifier**, and no longer warns about states.

### Fixed

Live in shipped behaviour, not style drift:

- **Disabled `TextInput`/`TextArea` still POSTed their values**, and a required+disabled `Switch` or
  `CheckboxInput` **permanently blocked form submission** — the form could never be satisfied.
- **Hovering a mega-menu trigger and then clicking it dismissed the panel.**
- **`EmptyState` spread rest props _after_ `role="status"`**, so a caller silently clobbered it.
  `CommandPaletteItem` did the same to `onclick`/`onmouseenter`, and `ComplexSelector` discarded a
  consumer's `onclick` entirely.
- **`useScrollLock` snapshotted per caller**, so a Dialog opening a Drawer left the page pinned with
  no lock holding it. Now module-scoped, and only the transition through zero touches the body.
- **`useTypeahead` wrapped a fresh single-character search onto the _last_ item** — the starting
  index was `-1` and the modulo carried it to the end of the list. Option+`a` also failed to match
  "å", because `altKey` was excluded from the printable-character test.
- **13 shipped i18n keys had zero call sites.** The locale files carried translations for them while
  the components rendered hardcoded English.
- **`contrast: 'high'` never reached either border token.**
- **A relative `Timestamp`'s `aria-label` read "PST"** as an unexpanded abbreviation (WCAG 3.1.4).
- **IME Enter double-committed.**
- **The CLI's bundled `neutral-theme.ts` was stale against a 0.4.1 correction** — `--radius-none` is
  fixed at `0px` and it still shipped `0.25rem`.

### Verified

Both fidelity oracles reach zero, from 267 and 54 mismatches at the start of the batch: 1,613 style
keys and 519 inline call sites with **no skips**, and `astryx.css` matching upstream across 1,492
shared classes. All seven theme oracles are clean.

**The client test project runs, which it had never done.** 163 files, 4,510 cases, in real headless
Chromium — and not once in CI before this release, because Typecheck was failing ahead of the Test
step and skipping it. Its first real execution failed 19 cases and **not one was a component
defect**; every implementation matched upstream, several byte for byte. They were tests written
against the pre-0.4.1 DOM, which is the predictable cost of writing cases against a suite nothing
has ever run.

## 0.3.1

Ports Astryx `0.3.0` — the same parity target as 0.3.0. **This release is the port's own, not an
upstream one**, which is something the version scheme cannot express; `TODO.md` carries the rule for
when upstream publishes its own 0.3.1.

### A pre-built stylesheet, the same as upstream's

```ts
import '@astryx-svelte/core/base.css';
import '@astryx-svelte/core/astryx.css';
```

That is now the entire setup. 0.3.0 said this package "cannot" ship a pre-built stylesheet; that was
wrong — upstream publishes `./astryx.css` from a post-build script, and not porting that script was
an omission, not a constraint.

**`dist` now ships compiled.** Shipping the stylesheet alone was not enough: `svelte-package` does
not run StyleX, and `stylex.create` _throws_ at runtime rather than no-opping, so the stylesheet by
itself produced a crash rather than a styled page. `prepack` now compiles `dist/**/*.stylex.js`, and
checks that every class the compiled output references is present in `astryx.css` — the first run
found 26 that were not, because the two builds hashed `defineVars` companion classes from different
module paths.

Verified as a consumer would: a Vite app with **no StyleX plugin at all**, built and driven in
headless Chromium, renders an Avatar at `border-radius: 9999px`, `36×36`, `inline-flex`. And across
the docs site's prerendered pages, every atomic class in the markup resolves in the CSS —
365/365, 284/284, 353/353.

**Migration, and it is silent if missed.** A precompiled `dist` gives your StyleX plugin nothing to
compile, so a 0.3.0 project that configured the compiler now emits no component CSS. Either add the
`astryx.css` import above, or keep compiling and ask for the new `source` condition
(`resolve: { conditions: ['source'] }`). `doctor` accepts both and no longer reports the first as
broken.

Ours is that script, ported: the same single `@layer astryx-base` wrapper and the same
`processStylexRules(rules, false)`, so priority is specificity padding rather than
`@layer priority1…9` and a consumer ordering layers around Astryx orders around upstream's layer
name.

**A third fidelity oracle checks it**, and it is not redundant with the other two. `test:parity`
reads `.stylex.ts` modules statically, so it cannot see inside a `stylex.create` function style —
there are 54 of those, and the blindness is a documented limitation. `test:css` compares the CSS the
compiler actually emitted, which has no such blind spot: **1,463 shared atomic classes, zero
differing rules**, 27 marker-scoped rules paired after blinding the path-derived hashes, and 10
named skips.

Those ten skips are all one upstream bug. `Badge.test-violations.tsx` is upstream's ESLint fixture —
a file of deliberate token violations — and their build ignores `**/*.test.*`, which
`.test-violations.` does not match. So `color:#FF0000` ships in every copy of their stylesheet. Not
replicated; recorded, and the skip retires itself when they fix the glob.

### The StyleX setup is one line now

`@astryx-svelte/core/vite` exports `astryx()` — the StyleX plugin plus the two settings Vite would
otherwise use to route this package around it:

```ts
import { astryx } from '@astryx-svelte/core/vite';
export default defineConfig({ plugins: [astryx(), sveltekit()] });
```

It replaces ~25 lines of copied configuration whose options had to match this package's own build
**exactly**, or a consumer compiled atomic CSS that no oracle had ever checked. Hand-rolling the
three still works and is still documented.

**Verified by dogfooding rather than asserted**: the docs site was the hand-rolled consumer and now
uses the preset. Its build emits **2,344 distinct CSS rules before and after, with zero differences
in either direction**.

### `doctor` reads your bundler config

`astryx-svelte doctor` gained a StyleX-wiring check. It had seven checks and none of them covered
the single most common way to get this package wrong — the one that renders correct markup with no
styling and never throws. It passes the preset, passes a complete hand-rolled config, and names
whichever of the three pieces is missing otherwise.

A text scan, not an import: a `vite.config.ts` may import project-local modules, and the engine's
contract is to read rather than execute. So a missing piece is a `warn`, never a `fail`.

### The docs site can be found now

It had a `<title>` and sometimes a description. Nothing else — no canonical URL, no social card, and
no sitemap, so ~280 generated pages were reachable only by crawling links, and every link shared
anywhere unfurled as a bare URL.

- **One `<Seo>` component** supplies title, description, canonical, Open Graph and Twitter tags for
  every route. The canonical comes from `page.url.pathname` rather than a prop, because a canonical
  a caller can get wrong is worse than none — it points search engines at the wrong page.
- **`/sitemap.xml`**, built from the same registries the pages render from, so a page that exists is
  a page that is listed. 281 URLs. `robots.txt` now points at it.
- **A real social card.** `scripts/generate-og-image.mjs` renders it in the site's own tokens with
  Playwright, so an unfurled link looks like the destination.
- **JSON-LD** — `SoftwareSourceCode` on the home page, `BlogPosting` on posts, which is what lets a
  search result carry a date.

### Fixed

- **`packages/cli/README.md` and `packages/core/README.md` both said `template --list` finds
  nothing.** Running the binary returns **43 page templates**, every id matching upstream. The
  genuinely deferred set is upstream's ~614 _block_ templates. This shipped in every tarball and
  rendered at `/docs/cli`.
- **Avatar's status dot was mispositioned in RTL.** It was ported against upstream 0.2.0, which used
  a physical `right`; 0.3.0 moved to `insetInlineEnd` and mirrored the `translate` that pushes the
  dot onto the circle's edge. Ours kept 0.2.0's version, with a comment arguing for it. The new CSS
  oracle found it on its first run — exactly the function-style blindness it exists to cover.
- **The declared layer order omitted the layers the compiler emits.** `base.css` declared
  `reset, astryx-base, astryx-theme, product`, but compiling this package yourself produces
  `@layer priority1 … priority9`, and layer order is order of first appearance — so nine unnamed
  layers landed _after_ `product`, inverting the cascade. Themes stopped being able to override
  components, and app CSS lost to component CSS. Silent in every case. `base.css` now names them,
  verified in a real build: the declaration lands at byte 13,394, ahead of `astryx-theme` at 13,580.
  The complete order had existed since the docs site hit this — but only in `docs/src/app.html`,
  where no consumer could benefit from it.
- **No package declared `main`.** Upstream's every package does. With `exports` present, Node and
  modern bundlers never read `main`, which is why this went unnoticed — but anything that does not
  understand `exports` could not resolve `@astryx-svelte/core` or any theme at all. Added to all
  nine.
- **`doctor` reported optional peer dependencies as missing.** `peerDependenciesMeta.optional` was
  ignored, so adding `vite` and `@stylexjs/unplugin` as optional peers of core told every project on
  another bundler to install two packages it has no use for. A warning nobody should act on is how
  the ones that matter stop being read.

## 0.3.0

The first release. Ports Astryx `0.3.0` — the tag, not the tarball, where the two disagree.

Documentation: **<https://astryx-svelte.rohitk06.in/>**, generated from the same `.doc.mjs` modules
the CLI reads, so the site and the terminal cannot disagree.

### Published

| Package                                                                   | What it is                                                           |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `@astryx-svelte/core`                                                     | Components, theme system, hooks, message catalogs                    |
| `@astryx-svelte/cli`                                                      | Docs, search, page templates, theme tooling and codemods             |
| `@astryx-svelte/theme-{neutral,butter,chocolate,gothic,matcha,stone,y2k}` | Upstream's seven themes                                              |
| `@astryx-svelte/theme-liquid-glass`                                       | macOS translucent materials — **no upstream counterpart**, see below |

### What is in it

- **101 / 101 upstream component directories**, with a bidirectional diff confirming nothing here
  is invented. Ours are 97 directories because `HStack`/`VStack` fold into `stack/` and
  `SizeContext`/`InteractiveRoleContext` into context modules; all four are exported.
- **184 / 184 design tokens**, and a 250-key `en` catalog byte-identical to upstream's, alongside
  `fr-FR` (upstream's own 3-key partial) and `pseudo`.
- **Eight theme packages** — upstream's seven, plus `liquid-glass`, which ports nothing and is
  labelled as the port's own addition rather than presented as parity.
- **All 19 hooks**, including `useContainerReveal` and its pooled style module.
- **43 page templates** shipped by the CLI and injectable with `astryx-svelte template <name>`. The
  docs registry carries 42 of them, which is upstream's own count — its generator skips `scaffold`
  templates, dropping `blank` from the gallery while leaving it scaffoldable.
- Upstream's `reset.css` **ported in full** into `base.css`, because the components are authored
  against it and misrender without it. Upstream ships it as an opt-in subpath; here it is not
  optional, so it is not separable.

### Verified, not reviewed

Components are authored against the same design-token references Astryx uses, so the StyleX
compiler emits byte-identical atomic CSS. Two oracles diff our compiled output against the
already-compiled classes in the published `@astryxdesign/*` packages, in both directions — a
missing declaration, a wrong value and an invented one all fail the run:

- component classes: **1,528 style keys + 615 inline call sites, 0 skips, 0 mismatches**
- theme declarations: **2,418 across the seven ported themes, 0 mismatches**

### Known limitations

Named rather than hidden; each is tracked in `TODO.md`.

- **The class oracle cannot see a `stylex.create` function style** — 54 of them across 32 modules.
  A clean run means "every _static_ style matches", which is narrower than it sounds, and the
  blindness was measured rather than assumed: inverting a `!isDisabled` guard in `text-input` left
  the oracle at 0 mismatches while the bug was live in 13 call sites.
- **434 upstream test cases have no counterpart here yet.** Ported suites are case-for-case and the
  count is the contract, but suites with no ported file have no header to be wrong, and that
  blindness had already let a real `ChatComposer` bug ship.
- **The full browser suite does not complete in one run.** It passes in chunks; the shared Chromium
  instance dies late in an unchunked run and takes the remaining files with it. Infrastructure, not
  product.
- **Page templates are outside every tsconfig**, so `svelte-check` reports 0 errors on a deliberate
  type error in one. It matters more now that the templates import real icon packages.
- **The 28-name icon registry cannot keep upstream's glyphs distinct at page-template scale.** Every
  collision is named in its file's header and retires when the registry grows.
- **Upstream bugs are reproduced, not corrected**, and each is written down in `TODO.md`.

### Setup that has no upstream counterpart

`@astryxdesign/core` ships pre-built CSS; this package cannot. `svelte-package` transpiles
TypeScript and does not run StyleX, so `dist/**/*.stylex.js` publishes **uncompiled** and every
consumer compiles it as part of their own build. Getting that wrong fails **without an error** —
the components render, unstyled. `packages/core/README.md` has the Vite/SvelteKit configuration,
including the two settings that exist because Vite has two ways to route a dependency around a
plugin.
