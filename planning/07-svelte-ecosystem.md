# 07 — The Svelte 5 Ecosystem: What `astryx-svelte` Should Adopt

> Working document 07 of the Astryx Svelte port. Every version number, publish date and
> peer-dependency range below was read from the **live npm registry** and **GitHub API** on
> **2026-07-21**, not from memory. Browser-support figures come from caniuse and the
> `api.webstatus.dev` Baseline API on the same date. Method and raw commands: [Appendix B](#appendix-b--how-this-was-verified).

| | |
|---|---|
| Date of survey | **2026-07-21** |
| Svelte | **5.56.7** (published 2026-07-20) |
| SvelteKit | **2.70.1** (published 2026-07-19) |
| Upstream Astryx | `@astryxdesign/core` **0.1.7** — republished **2026-07-21** (upstream is shipping actively) |
| Packages evaluated | 70 |
| Adopt | 8 |
| Consider / conditional | 7 |
| Reject | 21 (of which **6** are unmaintained or Svelte-4-only — flagged in §0.2) |

### Contents

0. [Summary decision table](#0-summary-decision-table)
1. [The governing constraint, restated and re-verified](#1-the-governing-constraint-restated-and-re-verified)
2. [Rune utilities](#2-rune-utilities)
3. [Table — the 9,047 LOC question](#3-table--the-9047-loc-question)
4. [Date & time](#4-date--time)
5. [Virtualization](#5-virtualization)
6. [Docs site — authoring, highlighting, search](#6-docs-site--authoring-highlighting-search)
7. [Icons](#7-icons)
8. [Testing](#8-testing)
9. [Floating / positioning and the 2026 browser baseline](#9-floating--positioning-and-the-2026-browser-baseline)
10. [i18n](#10-i18n)
11. [Everything else](#11-everything-else)
12. [Concrete `package.json` deltas](#12-concrete-packagejson-deltas)
13. [Watch list — what would change these answers](#13-watch-list--what-would-change-these-answers)
- [Appendix A — corrections to earlier planning docs](#appendix-a--corrections-to-earlier-planning-docs)
- [Appendix B — how this was verified](#appendix-b--how-this-was-verified)

**If you read one thing:** §0, then §3. The Table answer is the one that matters, and it is
"no" — but for a reason that is worth understanding precisely, because the same reasoning
disposes of two thirds of the reject list.

---

## 0. Summary decision table

### 0.1 The decisions

Legend for **Kind**: **pure-logic** = ships no markup, cannot perturb DOM shape → safe under the
StyleX constraint. **DOM-owning** = renders or controls elements → dangerous. **build-time** = never
reaches the component runtime. **dev-only** = not in the shipped dependency graph.

| Library | Area | Verdict | Version (2026-07-21) | Kind | Rationale |
|---|---|---|---|---|---|
| **`runed`** | Rune utilities | **ADOPT** (keep) | **0.37.1** · pub 2025-12-20 | pure-logic | 34 rune utilities, ~20 map 1:1 onto Astryx internals (§2.2). Svelte `^5.7.0`. Already a dep. Caveat: 7-month release gap — watch, don't panic (§2.4). |
| **`svelte/reactivity`** (built-in) | Rune utilities | **ADOPT** | ships with Svelte 5.56.7 | pure-logic | `MediaQuery`, `createSubscriber`, `SvelteMap/Set/Date/URL`. Zero-cost; **prefer over the runed equivalents** where they overlap. |
| **`@tanstack/virtual-core`** | Virtualization | **ADOPT** | **3.17.5** · pub 2026-07-20 | pure-logic | Framework-free measurement/windowing maths. No DOM, no deps, no peers. The single cleanest fit in this entire survey. |
| **`@lucide/svelte`** | Icons (themes + docsite) | **ADOPT** | **1.25.0** · pub 2026-07-17 | DOM-owning (isolated) | Renders `<svg>` only, inside the `IconRegistry` seam that already isolates it. `svelte: ^5`. **Not** a `core` dependency. |
| **`intl-messageformat`** | i18n | **ADOPT** (keep) | **11.2.12** · pub 2026-07-16 | pure-logic | Upstream's *only* runtime dependency. Actively published. Changing it breaks the message-catalogue contract for zero gain. |
| **`vitest` + `@vitest/browser` + `@vitest/browser-playwright`** | Testing | **ADOPT** | **4.1.10** · pub 2026-07-06 | dev-only | Current major. Already in the repo. |
| **`vitest-browser-svelte`** | Testing | **ADOPT — bump to 3** | **3.0.0** · pub 2026-07-09 | dev-only | Repo pins `^2.1.1`. v3 is a one-line breaking change (`render` is async-only). Current Svelte 5 best practice (§8). |
| **`@stylexjs/stylex`** | Styling runtime | **ADOPT** (keep) | **0.19.0** · pub 2026-06-16 | pure-logic | `stylex.props()` at runtime; matches upstream's peer range exactly. Non-negotiable — it *is* the constraint. |
| **`@tanstack/table-core` v9** | Table | **CONSIDER — not now** | **9.0.0-beta.55** · pub 2026-07-17 | pure-logic | Genuinely Svelte-5-runes-native and genuinely headless. But it replaces only ~910 of Astryx's ~4,846 plugin LOC and cannot express the render-transform pipeline that is the other 80%. Still beta. See §3. |
| **`@oddbird/css-anchor-positioning`** | Positioning fallback | **CONSIDER — opt-in only** | **0.9.0** · pub 2026-02-11 | build/runtime CSS | Escape hatch for Safari < 26 and Firefox ESR 140. Rewrites CSS, never DOM → safe. Ship as an *optional* import, never a dependency. §9.3. |
| **`mdsvex`** | Blog authoring | **CONSIDER** | **0.12.8** · pub 2026-07-19 | build-time | Only 5 markdown files exist in the whole product. Justified only if blog posts need embedded Svelte components. §6.2. |
| **`shiki`** | Syntax highlighting | **CONSIDER — docs blog only** | **4.3.1** · pub 2026-07-03 | build-time | Astryx's own 533-LOC tokenizer feeds `SyntaxTheme`; Shiki cannot. Acceptable *only* for blog code fences if the ported `CodeBlock` isn't ready. §6.3. |
| **`pagefind`** | Docs search | **CONSIDER — later** | **1.5.2** · pub 2026-04-12 | build-time | Upstream uses an in-bundle static index over the generated registries. Keep parity; adopt Pagefind only when the index outgrows the bundle. §6.4. |
| **`codemirror` 6** | Playground editor | **CONSIDER — phase 2** | **6.0.2** (`@codemirror/state` **6.7.1**, pub 2026-07-05) | DOM-owning (isolated) | Owns a whole editor surface, but that surface is *outside* the design system. Lighter than Monaco. §11.4. |
| **`temporal-polyfill`** | Date | **CONSIDER — 2027** | **1.0.1** · pub 2026-06-19 | pure-logic | Hit 1.0. Temporal is Chrome 144+ / Firefox 139+, **no Safari** → Baseline *limited*. Revisit when Safari ships. §4.4. |
| **`bits-ui`** | Component primitives | **REJECT** | 2.18.1 · pub 2026-05-03 | **DOM-owning** | Owns element structure. Confirmed unchanged — §1. Prior decision stands. |
| **`melt`** (next-gen) | Component primitives | **REJECT** | 0.44.0 · pub 2026-01-04 | **DOM-owning** | Builder attributes still dictate structure/ordering. Also slowing: last repo push 2026-03-04. |
| **`@melt-ui/svelte`** (v0) | Component primitives | **REJECT — legacy** | 0.86.6 · pub **2025-03-28** | **DOM-owning** | 16 months stale; peer `svelte ^5.0.0-next.118` (a *prerelease* pin). Superseded by `melt`. |
| **`@tanstack/svelte-table` v8** | Table | **REJECT — Svelte 4 only** | 8.21.3 · pub 2025-04-14 | pure-logic | `peerDependencies: {"svelte": "^4.0.0 \|\| ^3.49.0"}`. **Does not declare Svelte 5.** Superseded by the v9 beta. |
| **`svelte-headless-table`** | Table | **REJECT — unmaintained** | 0.18.3 · pub **2024-10-28** | pure-logic | 21 months stale, peer `svelte ^4.0.0`. Dead end. |
| **`@internationalized/date`** | Date | **REJECT** | 3.12.2 · pub 2026-05-28 | pure-logic | Excellent library, wrong project. Astryx's 866 LOC of date maths is already framework-free and ports by `cp`. Adopting it is a *rewrite*, not a saving. §4. |
| **`date-fns` / `dayjs` / `luxon`** | Date | **REJECT** | 4.4.0 / 1.11.21 / 3.7.2 | pure-logic | Same reason, plus none model `PlainDate`/`ISOTimeString` the way Astryx's inputs require. |
| **`@tanstack/svelte-virtual`** | Virtualization | **REJECT — legacy shape** | 3.13.33 · pub 2026-07-20 | pure-logic | Published yesterday but the source is `svelte/store` `writable`/`derived` — a **Svelte 4 store wrapper**. Use `virtual-core` + ~40 lines of runes. §5.2. |
| **`virtua`** | Virtualization | **REJECT** | 0.49.3 · pub 2026-07-11 | **DOM-owning** | Ships `<VList>`/`<VGrid>` components that own the scroll container and item wrappers. |
| **`svelte-virtuallists`** | Virtualization | **REJECT** | 1.4.2 · pub 2025-03-01 | **DOM-owning** | Component-based; also 16 months stale. |
| **`@humanspeak/svelte-virtual-list`** | Virtualization | **REJECT** | 0.5.12 · pub 2026-07-16 | **DOM-owning** | Active, but component-based and pre-1.0. |
| **`svelte-tiny-virtual-list`** | Virtualization | **REJECT — Svelte 4 only** | 3.0.1 · pub 2025-07-05 | DOM-owning | peer `svelte ^4.2.19`. |
| **`@sveltejs/svelte-virtual-list`** | Virtualization | **REJECT — dead** | 3.0.1 · pub **2019-08-22** | DOM-owning | Seven years stale. Listed only so nobody proposes it again. |
| **`mdsx`** | Docs authoring | **REJECT — abandoned** | 0.0.7 · pub 2025-05-25 | build-time | **`github.com/svecosystem/mdsx` returns HTTP 404** — the repository is gone. Never left `0.0.x`. |
| **`velite`** | Docs authoring | **REJECT** | 0.4.0 · pub 2026-06-17 | build-time | Healthy project, but it is a *markdown* content layer. Astryx docs are `.doc.mjs` **executable data**; there is no markdown to model. |
| **`@sveltepress/vite`** | Docs site | **REJECT** | 1.3.13 · pub 2026-07-14 | **DOM-owning** | A whole opinionated docs *theme*. The docsite must dogfood Astryx's own `AppShell`/`SideNav`/`TabList`. |
| **`@floating-ui/dom`** | Positioning | **REJECT** | 1.8.0 · pub 2026-07-11 | pure-logic-ish | Would introduce a JS-computed inline-`style` positioning path that upstream does not have, competing with the atomic CSS. Upstream is pure CSS anchor positioning. §9. |
| **`svelte-floating-ui`** | Positioning | **REJECT — stale** | 1.6.2 · pub 2025-03-28 | pure-logic-ish | 16 months stale, and moot given the above. |
| **`paneforge`** | Resizable | **REJECT** | 1.0.2 · pub **2025-08-02** | **DOM-owning** | Renders `PaneGroup`/`Pane`/`Resizer`. Astryx already has `Resizable` (986 LOC). Also ~12 months without a push. |
| **`svelte-splitpanes`** | Resizable | **REJECT** | 8.0.12 · pub 2025-11-25 | **DOM-owning** | Same reason. |
| **`marked` / `markdown-it`** | Markdown | **REJECT** | 18.0.7 / 14.3.0 | pure-logic | Astryx's parser emits a custom AST with a `citation` node **and supports incremental/streaming re-parse**. Neither does that. §11.2. |
| **`@inlang/paraglide-js`** | i18n | **REJECT** | 2.22.0 · pub 2026-07-14 | build-time | Compile-time message extraction. Astryx takes a runtime `messages` prop on a provider — architecturally incompatible. (`@inlang/paraglide-sveltekit` is **deprecated** outright.) |
| **`svelte-i18n`** | i18n | **REJECT — stale** | 4.0.1 · pub **2024-10-21** | pure-logic | 21 months stale; store-based, pre-runes. |
| **`xstate`** | State machines | **REJECT** | 5.32.5 · pub 2026-07-14 | pure-logic | Healthy, but nothing in Astryx is machine-shaped enough to earn a 40 kB dep. `runed`'s `FiniteStateMachine` covers the two or three places that want one. §11.5. |
| **`embla-carousel-svelte`** | Carousel | **REJECT** | 8.6.0 · pub 2025-04-04 | **DOM-owning** | Owns the viewport/container/slide structure. Astryx `Carousel` is 430 LOC. |
| **`formsnap` / `sveltekit-superforms`** | Forms | **REJECT** | 2.0.1 (pub 2025-04-09) / 2.30.2 | DOM-owning / server | Astryx has no form-orchestration layer to replace; `Field`/`FieldStatus` are the contract. Formsnap is also 15 months stale. |
| **`monaco-editor`** | Playground editor | **REJECT** (prefer CodeMirror) | 0.56.0 · pub 2026-07-20 | DOM-owning | Works, but ~5× the weight of CodeMirror for a phase-2 surface. |

### 0.2 Explicitly flagged: unmaintained or Svelte-4-only

These are the ones that will bite someone who searches npm and finds a plausible-looking result.

| Package | Problem | Evidence |
|---|---|---|
| **`lucide-svelte`** | **DEPRECATED by its authors** | npm `deprecated` field: *"Package deprecated. Please use @lucide/svelte instead."* Peer range still `^3 \|\| ^4 \|\| ^5.0.0-next.42`. **Planning doc 04 currently recommends this package — that recommendation is wrong now.** See [Appendix A](#appendix-a--corrections-to-earlier-planning-docs). |
| **`@tanstack/svelte-table` v8** | **Svelte-4-only** | `peerDependencies: {"svelte": "^4.0.0 \|\| ^3.49.0"}` on the `latest` tag. |
| **`svelte-headless-table`** | Unmaintained + Svelte-4-only | Last publish 2024-10-28; peer `svelte ^4.0.0`. |
| **`mdsx`** | **Repository deleted** | `https://github.com/svecosystem/mdsx` → HTTP 404. Last publish 2025-05-25 at `0.0.7`. |
| **`@melt-ui/svelte`** (v0 line) | Superseded + stale | Last publish 2025-03-28; peers a Svelte 5 *prerelease* (`^5.0.0-next.118`). |
| **`@inlang/paraglide-sveltekit`** | **DEPRECATED** | npm `deprecated` field set; last publish 2025-03-13. |
| **`svelte-tiny-virtual-list`** | Svelte-4-only | peer `svelte ^4.2.19`. |
| **`@sveltejs/svelte-virtual-list`** | Dead | Last publish 2019-08-22. |
| **`shiki-magic-move`** | **DEPRECATED** | npm `deprecated` field set (noted in case someone wants animated code transitions in the docs). |

Borderline — usable, but slowing down. Not rejections, just facts to hold:

| Package | Last release | Last repo push | Note |
|---|---|---|---|
| `runed` | 2025-12-20 | 2025-12-20 | 7 months quiet on `main`. Still the right choice; see §2.4 for the exit plan. |
| `melt` (next-gen) | 2026-01-04 | 2026-03-04 | Rejected anyway. |
| `paneforge` | 2025-08-02 | 2025-08-02 | Rejected anyway. |
| `mdsvex` | 2026-07-19 | 2026-07-19 | Just woke up after a 14-month gap (0.12.6 May 2025 → 0.12.8 July 2026) with an explicitly Svelte-5-runes fix. Healthy *today*. |

### 0.3 The three choices that save the most work

1. **`@tanstack/virtual-core` (3.17.5)** — the only unambiguous win in the survey. It is
   pure measurement maths with **zero dependencies, zero peers, and no DOM whatsoever**;
   it hands you `{ index, start, size, key }` and you render your own `<tr>`. Astryx has
   **no** virtualization today, so this is not a replacement — it is a capability the port
   gets essentially free, and it plugs into the existing `transformScrollWrapper` plugin
   hook, which upstream's own comment says exists *"to attach a ref to the scrollable
   element (scroll-aware shadows, **virtualization**)"*. Table, `List`, `TreeList`,
   `ChatMessageList` and `Selector` all benefit. Estimated saving: **~1,000–1,500 LOC of
   genuinely hard, easy-to-get-subtly-wrong code**, plus the bugs you don't write.

2. **`runed` (0.37.1) + `svelte/reactivity` built-ins** — the mapping in §2.2 shows ~20 of
   Astryx's 22 internal hooks and several component internals have a direct runed
   counterpart. `Context`, `useResizeObserver`/`ElementSize`/`ElementRect`, `ScrollState`,
   `activeElement`, `IsFocusWithin`, `useEventListener`, `Debounced`/`Throttled`,
   `TextareaAutosize`, `useIntersectionObserver`, `useMutationObserver` and `AnimationFrames`
   between them are the boring-but-fiddly half of `src/hooks/` (4,905 LOC) and the observer
   plumbing in `utils/sharedResizeObserver.ts`. Estimated saving: **~600–900 LOC**, and more
   importantly it removes the SSR/teardown class of bug from a dozen places at once.

3. **Deciding *not* to adopt three things** — `@internationalized/date`, TanStack Table, and
   any headless primitive library. This sounds like a non-answer; it is the largest number
   in the document. Astryx's date layer (866 LOC), Table plugin pipeline (~4,846 LOC) and
   markdown parser (1,906 LOC) are **already framework-free TypeScript that ports by copy**.
   Every one of the "obvious" library adoptions converts a `cp` into a rewrite *and* an API
   break against upstream's documented public surface. Naming that explicitly here is worth
   more schedule than any dependency: it protects roughly **7,600 LOC of free port**.

---

## 1. The governing constraint, restated and re-verified

Doc 05 §5.4 established it; this survey re-checked the mechanism in upstream source and it holds
exactly.

`@astryxdesign/core@0.1.7` declares **one** runtime dependency:

```json
"dependencies": { "intl-messageformat": "^11.2.9" },
"peerDependencies": {
  "@stylexjs/stylex": "^0.19.0",
  "react": ">=19.0.0",
  "react-dom": ">=19.0.0"
}
```

That is the whole dependency graph of a 102,858-LOC design system. It is not an accident, and
`astryx-svelte` should match the discipline: **`@astryx-svelte/core` should ship with at most
two runtime dependencies** (`@stylexjs/stylex`, `runed`) and possibly a third
(`@tanstack/virtual-core`) only if virtualization lands in `core` rather than in a separate
`@astryx-svelte/table` entry point.

Styling flows through `themeProps()` → class names + `data-*` attributes → per-element atomic
classes applied by `stylex.props()`. The Table makes the coupling literal. Its plugin interface
(`packages/core/src/Table/types.ts:417`) is **not** a state system:

```ts
export interface TablePlugin<T> {
  transformColumns?:      (columns) => TableColumn<T>[];
  transformTable?:        (props: TableRenderProps) => TableRenderProps;
  transformHeaderRow?:    (props: HeaderRowRenderProps) => HeaderRowRenderProps;
  transformHeaderCell?:   (props, column, columnIndex, columns) => HeaderCellRenderProps;
  transformBodyRow?:      (props, item, index) => BodyRowRenderProps;
  transformBodyCell?:     (props, column, item, columnIndex, columns) => BodyCellRenderProps;
  transformScrollWrapper?:(props: ScrollWrapperRenderProps) => ScrollWrapperRenderProps;
  transformTableContext?: (children: ReactNode) => ReactNode;
}
```

Every method transforms **the props of a specific DOM element**. This is the atomic-CSS
application pipeline wearing a plugin costume. Any library that wants to own `<table>`, `<tr>`,
`<th>` or `<td>` is not a plugin candidate — it is a competitor to the styling system.

**The classification test used throughout this document:** *does the library, at any point,
decide what element gets rendered or what attributes land on it?* If yes → DOM-owning → reject
or isolate behind a seam that already exists. If it only returns data — numbers, ranges,
sorted arrays, parsed ASTs, formatted strings — → pure-logic → safe.

---

## 2. Rune utilities

### 2.1 The field

| Package | Version | Published | Svelte peer | Verdict |
|---|---|---|---|---|
| **`runed`** | **0.37.1** | 2025-12-20 | `^5.7.0` (+ optional `@sveltejs/kit`, `zod`) | **ADOPT — keep** |
| `svelte/reactivity` | built in to 5.56.7 | 2026-07-20 | — | **ADOPT — prefer where it overlaps** |
| `svelte-toolbelt` | 0.10.6 | 2025-10-16 | — | Skip. Huntabyte's internal grab-bag for Bits UI; not a public API. |
| `@sv-use/core` | 1.15.1 | **2025-02-23** | — | Reject — 17 months stale. |
| `svelte-legos` | 0.2.5 | **2024-08-25** | — | Reject — 23 months stale, pre-runes. |

`runed` has no real competitor. `@sv-use/core` was the VueUse-style challenger and has not
shipped since February 2025. `svelte-toolbelt` exists to serve Bits UI, not consumers.

Structurally `runed` is safe: it exports functions and classes returning reactive values. It
renders nothing. `sideEffects` is unset but the package is tree-shakeable ESM, and both its
non-Svelte peers (`@sveltejs/kit`, `zod`) are marked `optional: true` in
`peerDependenciesMeta` — so a component library that never touches SvelteKit or Zod pulls
neither. Runtime deps are three small ones: `dequal`, `esm-env`, `lz-string`.

### 2.2 Runed → Astryx internals map

This is the payoff table. Left column is the exact runed export; right is what it replaces or
underpins in the port.

| Runed utility | Category | Astryx internal it serves | Notes |
|---|---|---|---|
| **`Context`** | state | `SizeContext`, `InteractiveRoleContext`, `LayerContext`, `TableContext`, `LinkProvider`, `InternationalizationContext`, `ButtonGroup`/`ToggleButtonGroup`/`SegmentedControl` contexts | The highest-leverage single utility. Doc 01 §2.6 counts 19 units consuming `SizeContext` alone. Type-safe `getContext`/`setContext` with a "not inside provider" error — removes the whole class of untyped-symbol-key bugs. |
| **`useResizeObserver`**, **`ElementSize`**, **`ElementRect`** | elements | `utils/sharedResizeObserver.ts` (88), `useOverflow` (221), `useScrollOverflow` (107), `Resizable` (986), `Table` column resize, `OverflowList`, `Breadcrumbs`, `TabList` | `useOverflow` is rated **hard** in doc 01. Runed's observers do the subscribe/unsubscribe/SSR half. |
| **`ScrollState`** | elements | `useScrollOverflow`, `ChatLayoutScrollButton`, Table sticky headers, `Lightbox` | Gives `scrollTop/Left`, arrived-at-edge flags, and a programmatic scroll setter. `useScrollOverflow` is nearly a thin wrapper over it. |
| **`activeElement`** | elements | `useFocusTrap` (400), `useKeyboardHint` (332), `useListFocus`, `useGridFocus`, `useTreeFocus` | A single global reactive `document.activeElement`. The four focus hooks total 2,127 LOC and every one of them currently hand-rolls focus tracking. |
| **`IsFocusWithin`** | elements | `Popover`, `Selector`, `MultiSelector`, `Typeahead`, `InputGroup`, `Field` focus-within states | Drives `data-focus-within` attributes that the atomic CSS already targets. |
| **`useEventListener`** | browser | Essentially every hook in `src/hooks/` | Auto-teardown, accepts a getter for the target so it survives element swaps. |
| **`onClickOutside`** | sensors | `useLayer` light-dismiss for the *non*-Popover-API fallback path, `HoverCard`, `MoreMenu` | Native Popover light-dismiss covers the common case (§9); this covers the rest. |
| **`PressedKeys`** | sensors | `useHotkeys` (203), `Kbd` live display, `CommandPalette` | Reactive set of currently-held keys. |
| **`Debounced`**, **`useDebounce`**, **`Throttled`**, **`useThrottle`** | state / utilities | `Typeahead` (1,757), `PowerSearch` (4,611), `MultiSelector`, Table `useTableFiltering` (1,146), `Selector` async search | Replaces the ad-hoc timer refs these components carry. |
| **`TextareaAutosize`** | elements | `TextArea` (536), `ChatComposerInput` | Direct, complete replacement for the autosize logic. |
| **`useIntersectionObserver`**, **`IsInViewport`** | elements | `ChatLayoutScrollButton`, `Thumbnail` lazy load, `Outline` active-heading tracking, virtualization sentinels | Enhanced in the most recent release (#202). |
| **`useMutationObserver`** | elements | `useTheme` (223) — upstream literally uses a `MutationObserver` on `data-theme` | Exact fit. |
| **`AnimationFrames`** | animation | `useStreamingText` (195), `useEntryAnimation` (124), Chat token reveal | rAF loop with fps cap and auto-cleanup. Doc 01 lists `rAF` as a "signal" on `ContextMenu` and `DropdownMenu` too. |
| **`IsMounted`** | component | `useIsomorphicLayoutEffect` (22), every SSR guard | Doc 06 §1.10 says `useIsomorphicLayoutEffect` disappears; `IsMounted` covers what remains. |
| **`Previous`** | state | Entry/exit animation diffing, `Toast` exit, `Carousel` direction, `TabList` indicator | |
| **`FiniteStateMachine`** | state | `useMenuHover` safe-triangle (195), `Toast` lifecycle, async `clickAction` pending/settled | The in-house answer to "do we need XState?" — no. §11.5. |
| **`boolAttr`** | utilities | `themeProps()` / `themeDataAttributes()` output | Emits `""` vs `undefined` correctly so `[data-x]` selectors match. Small, but it is exactly the semantics the atomic CSS depends on. |
| **`PersistedState`** | state | Docs site theme picker, sidebar collapse, playground state | Docsite only, not `core`. |
| **`useSearchParams`** | reactivity | Docs site `/themes?theme=`, playground share links | Docsite only. Requires the optional `@sveltejs/kit` peer. |
| **`watch`**, **`extract`** | reactivity | General `$effect` ergonomics across the port | `watch` gives explicit dependency lists — closer to `useEffect(fn, [deps])` semantics, which matters when translating the 80 `useEffect` call sites in doc 06 §1.6. |
| **`resource`** | reactivity | Async `clickAction`/`pressedChangeAction` props (doc 06 §1.7) | Covers the `useTransition` + `useOptimistic` pattern. |
| `IsIdle`, `IsDocumentVisible`, `useGeolocation`, `useInterval`, `onCleanup`, `StateHistory` | — | No current consumer | Available, unused. |

**Overlap rule.** Where Svelte core and runed both provide something, prefer core:

| Need | Use this | Not this |
|---|---|---|
| Media query | `MediaQuery` from **`svelte/reactivity`** | runed's re-export |
| External store subscription (`useSyncExternalStore`, doc 06 §1.8) | `createSubscriber` from **`svelte/reactivity`** | — |
| Reactive `Map`/`Set`/`Date`/`URL` | `SvelteMap` / `SvelteSet` / `SvelteDate` / `SvelteURL` | plain collections in `$state` |

### 2.3 Verdict

**ADOPT — keep `runed@^0.37.1`.** It is already a `packages/core` dependency and it is the
correct one.

### 2.4 The one caveat, and the exit plan

`runed`'s last release and last `main`-branch commit are both **2025-12-20** — seven months
before this survey. The repo is not archived (1,830 stars, 64 open issues, `updated_at`
2026-07-19 from issue traffic), the release cadence before the gap was roughly monthly, and
both `bits-ui@2.18.1` and `paneforge@1.0.2` still depend on it — so it is load-bearing for the
ecosystem, not orphaned. It is also pinned at `0.x`, which means a breaking release is
permitted at any minor bump.

This is a *manageable* risk rather than a blocking one, because of what runed actually is: ~34
small, independent, individually-vendorable utilities. Concretely:

- Import from the package root (`import { Context, ScrollState } from 'runed'`), never deep
  paths, so a future vendor-in is a single re-export module.
- Put a `src/lib/internal/runed.ts` barrel between the library and the dependency from day one.
  If runed stalls past ~12 months, that file becomes the vendored implementation and no
  component changes.
- Pin the caret (`^0.37.1`) and review the diff on any minor bump — at `0.x`, semver does not
  protect you.

**Re-evaluate:** if there is no release by **2026-12-20** (12 months), vendor the ~8 utilities
actually in use and drop the dependency.

---

## 3. Table — the 9,047 LOC question

### 3.1 What Astryx's Table actually is

Measured from upstream source, not from the doc:

| Layer | Files | LOC (excl. tests) | Nature |
|---|---|---|---|
| Core render pipeline | `BaseTable.tsx`, `Table.tsx`, `TableRow/Cell/HeaderCell/Header/Footer/Body`, `useTableCellStyles`, `table.stylex.ts`, `columnUtils.ts`, `types.ts`, `tableContextMenu.tsx` | ~2,700 | **DOM + atomic CSS** |
| Plugin implementations (10) | `plugins/**` | **~4,846** | mixed — see below |
| Public exports | 16 symbols (`Table`, `TableRow`, `TableCell`, `TableHeaderCell`, + 12 `useTable*` hooks) | — | **API contract** |

Splitting the 4,846 plugin LOC by what a headless table library could possibly replace:

| Plugin file | LOC | Replaceable by TanStack? |
|---|---|---|
| `sortable/useTableSortableState.tsx` | 312 | ✅ sorting state + comparator |
| `selection/useTableSelectionState.tsx` | 210 | ✅ row-selection state |
| `columnSettings/useTableColumnSettingsState.tsx` | 263 | ✅ visibility/order state |
| `filtering/useTableFilterState.tsx` | 78 | ✅ filter state |
| `pagination/paginateData.ts` | 47 | ✅ page slicing |
| **Subtotal — pure state/derivation** | **910** | **~19% of the plugin layer** |
| `filtering/useTableFiltering.tsx` | 1,146 | ❌ filter *UI*: popovers, field refs, chips, i18n |
| `columnResize/useTableColumnResize.tsx` | 866 | ❌ pointer-drag, live width writing, resize handles |
| `rowExpansion/useTableRowExpansion.tsx` | 591 | ❌ injects expander column + detail `<tr>` |
| `sortable/useTableSortable.tsx` | 438 | ❌ sort buttons + `aria-sort` in `<th>` |
| `stickyColumns/useTableStickyColumns.tsx` | 407 | ❌ cumulative `inset-inline-start` offsets on `<th>`/`<td>` |
| `selection/useTableSelection.tsx` | 366 | ❌ injects a checkbox `<th>`/`<td>` column |
| `groupedRows/useTableGroupedRows.tsx` | 351 | ❌ group header `<tr>` injection |
| `pagination/useTablePagination.tsx` | 295 | ❌ wraps the table in a `Pagination` provider |
| `columnSettings/useTableColumnSettings.tsx` | 115 | ❌ column-settings menu |
| `rowIndex/useTableRowIndex.tsx` | 114 | ❌ injects an index column |
| **Subtotal — DOM transforms** | **~4,689** | **~81% — untouchable** |

### 3.2 TanStack Table v9: the honest assessment

Credit where due — v9 is a real, serious rewrite and it clears every technical bar:

- **v9 beta landed 2026-06-07**; `@tanstack/table-core@9.0.0-beta.55` and
  `@tanstack/svelte-table@9.0.0-beta.55` were both published **2026-07-17**. 55 betas in
  ~6 weeks — this is under very active development.
- **The Svelte adapter is Svelte-5-runes-native.** `peerDependencies: {"svelte": "^5.0.0"}`,
  built on `$state`, `$derived.by` and `$effect.pre`, with reactive inputs passed as getters
  (`get data() { return data }`). It replaced v8's `createSvelteTable` with `createTable`.
- **It is genuinely headless.** v9 renders nothing. `<FlexRender>` / `renderComponent()` /
  `renderSnippet()` are opt-in helpers you may ignore entirely; you write all markup.
- **Feature registration is explicit and tree-shakeable** — `tableFeatures({ rowSortingFeature,
  sortedRowModel: createSortedRowModel() })`. Baseline bundle dropped from ~14–20 kB to ~4 kB.
  Backed by `@tanstack/store` atoms rather than React state.

So it passes the DOM test cleanly. It is pure-logic. The problem is elsewhere.

### 3.3 Does Astryx's plugin model conflict?

**They do not conflict — they are at different layers, and that is precisely the problem.**

TanStack v9 features answer *"given rows, state and column defs, what rows do I display and in
what order?"* Astryx plugins answer *"given the rows I'm about to render, what extra columns do
I inject, what props go on each `<th>` and `<td>`, and what chrome wraps the table?"*

Layering v9 underneath Astryx's pipeline is architecturally possible. It buys you the 910 LOC in
the first subtotal. It costs you:

1. **A beta dependency in the riskiest component.** v9 is at beta.55 with no announced stable
   date; the maintainer's own framing is "hoping for a faster beta cycle... pending community
   feedback". Putting a moving pre-release under the single highest-risk port unit inverts the
   risk ordering. (For calibration: v8 sat in beta for well over a year.)
2. **A new transitive dependency tree** — `@tanstack/store` + `@tanstack/svelte-store` — in a
   library whose upstream has exactly one runtime dep.
3. **A public API break.** Astryx exports `useTableSortable`, `useTableSelection`,
   `useTablePagination`, `useTableColumnSettings`, `useTableFiltering`, `useTableColumnResize`,
   `useTableGroupedRows`, `useTableRowExpansion`, `useTableRowIndex`, `useTableStickyColumns`,
   `useTableSelectionState`, `useTableFilterState` — twelve documented hooks, each with a
   `.doc.mjs` page on the public site. Every one returns a `TablePlugin` object. TanStack's
   state shapes (`SortingState`, `RowSelectionState`, `ColumnSizingState`) do not match
   Astryx's (`TableSortState` keyed by `sortKey`, which upstream deliberately decouples from
   column identity). You would either wrap TanStack in an Astryx-shaped façade — writing
   adapter code roughly the size of the state code you deleted — or ship a different API than
   upstream, which is the shadcn-svelte "API drift" failure mode doc 05 §5.3 documents at length.
4. **A second reactivity system.** `@tanstack/store` atoms bridged into runes via
   `store-reactivity-bindings`, sitting inside components that are otherwise pure `$state`.
   Every debugging session in the Table now spans two models.
5. **You still write 4,689 LOC.** The hard part — cumulative sticky offsets, pointer-capture
   column resize, checkbox-column injection, group-header rows, the filter popover system — is
   untouched.

Net: **~910 LOC saved, ~1,000+ LOC of adapter written, one beta dependency and one public API
break incurred.** That is a losing trade.

### 3.4 Verdict

**REJECT `@tanstack/svelte-table` v8** — outright: its `latest` tag declares
`svelte: ^4.0.0 || ^3.49.0` and does not support Svelte 5 at all.

**CONSIDER-but-not-now for `@tanstack/table-core` v9** — the right posture is:

- Port Astryx's plugin architecture faithfully. It is the public API and it is where the
  atomic-CSS application lives.
- Keep the ~910 LOC of state logic in **separate, dependency-free `.svelte.ts` modules**
  (`sortableState.svelte.ts`, `selectionState.svelte.ts`, …) with no knowledge of the
  transform pipeline. Upstream already splits them this way — `useTableSortableState` is a
  different file from `useTableSortable` — so this is free.
- **Revisit only when all three hold:** (a) v9 reaches stable; (b) someone asks for a v9 feature
  Astryx lacks — server-side pagination models, faceted filters, virtualized column pinning; and
  (c) it can be delivered as an *optional* `@astryx-svelte/table-tanstack` adapter package that
  feeds the existing `TablePlugin` interface, so `core` stays dependency-clean.

Because of the file split above, that door stays open at essentially zero cost. Design for it;
don't buy it yet.

---

## 4. Date & time

### 4.1 What Astryx already has

`packages/core/src/utils/` contains **866 LOC** of date/time code with **zero React imports**:

| Module | LOC | Contents |
|---|---|---|
| `plainDate.ts` | 265 | `PlainDate` struct + 23 operations, 5 `Intl.DateTimeFormatOptions` presets, `plainDateFormat` |
| `timeParser.ts` | 382 | Branded `ISOTimeString`, `parseTimeInput` (free-text → time), 12h/24h display, compare/clamp/adjust/range |
| `dateParser.ts` | 219 | `parseDateInput` (free-text → date), `isLocaleDayFirst()` via `Intl` probing |

Doc 01 §2.2 marks all three: **"Pure. Copy as-is."** It is correct. The port cost is `cp`.

And it is not naive code. `plainDateToInstant` does proper two-pass DST-safe offset resolution
against a named IANA zone:

```ts
const utcGuess     = Date.UTC(date.year, date.month - 1, date.day, hour, minute);
const firstOffset  = getTimezoneOffsetMS(timezoneID, utcGuess);
const firstInstant = utcGuess - firstOffset;
const secondOffset = getTimezoneOffsetMS(timezoneID, firstInstant);
return utcGuess - secondOffset;
```

…with `getTimeZoneParts` reading `Intl.DateTimeFormat(...).formatToParts` at `hourCycle: 'h23'`.
That is the same algorithm a polyfill uses, implemented correctly, with no bundled CLDR.

### 4.2 The candidates

| Package | Version | Published | Kind | Verdict |
|---|---|---|---|---|
| `@internationalized/date` | 3.12.2 | 2026-05-28 | pure-logic | **REJECT** for this project |
| `temporal-polyfill` | 1.0.1 | 2026-06-19 | pure-logic | **CONSIDER — 2027** |
| `@js-temporal/polyfill` | 0.5.1 | 2025-03-31 | pure-logic | Reject — superseded, 16 months stale, still `0.x` |
| `date-fns` (+ `@date-fns/tz` 1.5.0) | 4.4.0 | 2026-05-29 | pure-logic | Reject |
| `dayjs` | 1.11.21 | 2026-05-26 | pure-logic | Reject |
| `luxon` | 3.7.2 | 2025-09-05 | pure-logic | Reject |

### 4.3 Why `@internationalized/date` is the wrong answer *here*

It is an excellent, actively maintained (3.12.2, 2026-05-28), genuinely pure-logic library — it is
what Bits UI and React Aria build calendars on, and if `astryx-svelte` were writing a Calendar
from scratch it would be the obvious pick. It is not the right pick because:

1. **There is no work to save.** The brief's premise — pure logic is safe and cuts enormous
   work — needs a *gap* to fill. There isn't one. The port cost of Astryx's date layer is a
   file copy; a library cannot beat zero.
2. **It is a rewrite of five components.** `CalendarDate`/`CalendarDateTime`/`Time`/`ZonedDateTime`
   are immutable class instances with `.add({months:1})`/`.compare()` methods. Astryx's
   `PlainDate` is `{year, month, day}` plain data manipulated by free functions. Swapping means
   touching the internals of `Calendar` (2,234 LOC), `DateInput` (729), `DateRangeInput` (691),
   `DateTimeInput` (1,069), `TimeInput` (743) and `PowerSearch` (4,611) — **10,077 LOC of
   churn to replace 866 LOC of working code.**
3. **The public API breaks.** `ISODateString`, `DateRange`, `DayOfWeek` and the branded
   `ISOTimeString` are exported types on `DateInput`/`DateRangeInput`/`TimeInput` props. Users
   pass and receive ISO strings. `@internationalized/date` would either leak class instances
   into that surface or require conversion at every boundary.
4. **It cannot do the interesting part.** `parseTimeInput` and `parseDateInput` are *lenient
   free-text* parsers ("3pm", "15:30", "3/4/25" disambiguated by `isLocaleDayFirst()`).
   `@internationalized/date` parses ISO strings; it has no equivalent. You would keep 601 of the
   866 LOC anyway.
5. **It adds `@swc/helpers`** as a runtime dependency to a library that currently has one.

**Where it *would* be right:** non-Gregorian calendar systems (Hebrew, Islamic, Buddhist, Japanese).
Astryx's `PlainDate` is Gregorian-only by construction. If `astryx-svelte` ever needs a
`calendar` prop on `<Calendar>`, `@internationalized/date` is the answer and this decision should
be reopened — but that is a **feature request beyond upstream parity**, and doc 05 is explicit
that parity comes first.

### 4.4 Temporal

`temporal-polyfill` reached **1.0.1 (2026-06-19)** — a milestone. Native support per
`webstatus.dev` on 2026-07-21:

| Browser | Temporal |
|---|---|
| Chrome / Edge | ✅ 144 (2026-01-13) |
| Firefox | ✅ 139 (2025-05-27) |
| Safari | ❌ not shipped |
| **Baseline** | **limited** |

Two engines, not three. So Temporal today means shipping a polyfill (~50 kB) to every user, to
replace 265 lines that already work. **Revisit when Safari ships Temporal** — at that point
`plainDate.ts` collapses into `Temporal.PlainDate` and `plainDateToInstant` becomes
`.toZonedDateTime()`, which is a genuinely attractive simplification. Not in 2026.

### 4.5 Verdict

**REJECT all date libraries. Port `plainDate.ts`, `timeParser.ts`, `dateParser.ts` verbatim.**
Add a one-line comment at the top of each pointing at this section so the question does not get
re-litigated. Revisit if either (a) Safari ships Temporal, or (b) non-Gregorian calendars become
a requirement.

---

## 5. Virtualization

### 5.1 The one clear adoption

| Package | Version | Published | Deps | Peers | Kind |
|---|---|---|---|---|---|
| **`@tanstack/virtual-core`** | **3.17.5** | **2026-07-20** | **none** | **none** | **pure-logic** |

Published *yesterday*, 125 versions, zero dependencies, zero peer dependencies, no framework
coupling. It exports a `Virtualizer` class that takes `{count, getScrollElement, estimateSize,
overscan}` and returns `getVirtualItems() → {index, start, size, key}[]` plus `getTotalSize()`.
It touches the DOM only to *read* — `observeElementRect`, `observeElementOffset` — and to scroll
on demand via `elementScroll`. **It never creates an element and never sets a class.** Under the
StyleX constraint that is as safe as a library gets.

Astryx has **no virtualization at all** today, and the seam is already cut for it. From
`types.ts:461` (upstream's own comment on `transformScrollWrapper`):

> *"Transform the scroll-wrapper region — the `<div>` wrapping the `<table>`... Use to attach a
> `ref` to the scrollable element (scroll-aware shadows, **virtualization**) or to inject chrome
> before/after the table."*

The plugin interface was designed with this in mind. A `virtualization` plugin drops into the
existing pipeline, attaches the scroll ref via `transformScrollWrapper`, and the body renders
`{#each virtualizer.getVirtualItems() as v (v.key)}` — with `TableRow`/`TableCell` and their
atomic classes completely unchanged. That is the whole point: **the DOM stays Astryx's.**

Consumers beyond Table: `List` (511), `TreeList` (1,021 — needs flattened-tree windowing),
`ChatMessageList` (part of Chat's 7,336), `Selector`/`MultiSelector`/`Typeahead` option lists,
`OverflowList`.

### 5.2 Why not the Svelte adapter

`@tanstack/svelte-virtual@3.13.33` was also published 2026-07-20, and its peer range says
`^3.48.0 || ^4.0.0 || ^5.0.0`. That range is a warning, not a reassurance. Downloading and
reading `dist/index.js`:

```js
import { derived, writable } from 'svelte/store';
...
virtualizerWritable = writable(virtualizer, () => { setOptions(initialOptions); return virtualizer._didMount(); });
return derived(virtualizerWritable, (instance) => Object.assign(instance, { setOptions }));
```

It is a **Svelte 4 store wrapper**. It works under Svelte 5 (stores are still supported) but it
is exactly the legacy shape the port is trying to leave behind, and it forces `$store` syntax
into rune-based components. The wrapper is ~40 lines; write the runes version:

```ts
// virtualizer.svelte.ts — sketch
export function createVirtualizer<T extends Element>(options: () => PartialKeys<VirtualizerOptions<T, Element>, ...>) {
  const v = new Virtualizer({ observeElementRect, observeElementOffset, scrollToFn: elementScroll, ...options() });
  let version = $state(0);
  $effect(() => { v.setOptions({ ...options(), onChange: () => version++ }); return v._didMount(); });
  return { get items() { version; return v.getVirtualItems(); },
           get totalSize() { version; return v.getTotalSize(); },
           scrollToIndex: v.scrollToIndex.bind(v) };
}
```

### 5.3 Everything else — rejected

| Package | Version | Published | Why |
|---|---|---|---|
| `virtua` | 0.49.3 | 2026-07-11 | Active and multi-framework (`svelte >=5`), but ships `<VList>`/`<VGrid>` — **owns the scroll container and every item wrapper**. Fatal under the constraint. |
| `svelte-virtuallists` | 1.4.2 | 2025-03-01 | Component-based; 16 months stale. |
| `@humanspeak/svelte-virtual-list` | 0.5.12 | 2026-07-16 | Active but component-based and pre-1.0. |
| `svelte-tiny-virtual-list` | 3.0.1 | 2025-07-05 | **Svelte-4-only** (`^4.2.19`). |
| `@sveltejs/svelte-virtual-list` | 3.0.1 | **2019-08-22** | Dead. |

### 5.4 Verdict

**ADOPT `@tanstack/virtual-core@^3.17.5`** — behind a ~40-line runes wrapper, wired through
`transformScrollWrapper`. **REJECT every component-based virtual list.** Ship it as an opt-in
plugin (or a `@astryx-svelte/core/virtual` subpath) so non-virtualized Tables don't pay for it.

---

## 6. Docs site — authoring, highlighting, search

### 6.1 The fact that decides most of this

From doc 04 §3.1, re-verified: **`apps/docsite` has zero MDX/markdown-pipeline dependencies.**
Content lives in three places:

| Content | Format | Volume |
|---|---|---|
| Component & hook pages | `.doc.mjs` — **executable JS object literals** | 198 files → 200 routes |
| Long-form `/docs/<topic>` | `.doc.mjs` with `sections[].content[]` `ContentBlock` arrays | 22 routes |
| `/docs/core`, `/docs/cli`, `/changelog` | package `README.md` / `CHANGELOG.md`, rendered by the in-house `<Markdown>` **component** | 3 routes |
| **Blog** | **Markdown + YAML frontmatter** | **5 posts** |

So the entire markdown authoring surface of the product is **five files**. Every markdown-content
framework in the survey is sized for a problem this project does not have. The `.doc.mjs` format
is deliberate — the CLI (`astryx docs <topic>`) and the MCP server consume the same objects
directly, and `docs-types.ts` says "no markdown parsing needed".

### 6.2 Authoring pipeline

| Option | Version | Published | Verdict |
|---|---|---|---|
| **Ported `generate-data.mjs`** (status quo) | — | — | **ADOPT.** It's plain Node, framework-agnostic, and doc 04 §8 already makes it phase 1. Wrap as a Vite plugin for HMR on `.doc.mjs` edits. |
| `mdsvex` | **0.12.8** | 2026-07-19 | **CONSIDER** — blog only. |
| `mdsx` | 0.0.7 | 2025-05-25 | **REJECT — repo is 404.** |
| `velite` | 0.4.0 | 2026-06-17 | **REJECT** — a markdown content layer for a project with 5 markdown files. |
| `@sveltepress/vite` | 1.3.13 | 2026-07-14 | **REJECT** — a whole docs *theme*; the docsite must dogfood Astryx's own shell. |

**On mdsvex specifically.** It is healthier than its reputation suggests. `pngwn/MDsveX` was
pushed 2026-07-19; **0.12.8 (2026-07-19)** added a `layoutPropForwarding` option that *"can
generate Svelte 5 runes-compatible layout prop forwarding"*, and 0.12.5 (2025-04-22) "ensure[d]
that mdsvex files and layouts can contain Svelte 5 syntax". So Svelte 5 is supported. But note
the shape of that history: 0.12.6 in May 2025, then nothing until July 2026. Low bus factor.

Decision: **only adopt mdsvex if a blog post needs to embed a live Svelte component.** Otherwise
port `posts.mjs` and render post bodies through the ported `<Markdown>` component — which you
have to build anyway for `/docs/core` and `/changelog`, and which gives all five posts Astryx's
own `Blockquote`/`CodeBlock`/`Link`/`List`/`Table` styling for free. That is *better* parity than
mdsvex, not worse.

**`mdsx` must not be proposed again:** `https://github.com/svecosystem/mdsx` returns HTTP 404 and
a repo search for it finds nothing. Last publish 2025-05-25 at version `0.0.7`.

### 6.3 Syntax highlighting: Shiki vs the in-house tokenizer

`packages/core/src/CodeBlock/` — `tokenizer.ts` (533), `highlightRanges.ts` (453),
`highlightStyles.ts` (116). The tokenizer is regex-based, synchronous, dependency-free, and
covers ~11 language families: ts/js/tsx/jsx, json, html/xml/svg, css/scss/less, python, bash/sh/zsh,
php, hack, yaml, markdown. It emits `{type, start, end}` tokens per line with line-relative offsets.

The decisive point is not quality — Shiki's highlighting is better — it is **what consumes the
output**. Astryx's tokens feed `highlightStyles.ts` → `SyntaxTheme` / `defineSyntaxTheme`
(`theme/syntax/`, 555 LOC), a *public theming API* with presets, exported alongside `Theme` and
`MediaTheme`. Tokens become **StyleX atomic classes driven by theme tokens**. Shiki resolves
TextMate grammars to **inline `style="color:#..."`** (or CSS variables) using its own theme
model. Swapping tokenizers means `SyntaxTheme` no longer controls code colours — a public API
silently stops working, and code blocks stop responding to `Theme` / `MediaTheme`.

Additional factors: Shiki 4.3.1 (2026-07-03) is a healthy, actively developed project, but it
pulls WASM/Oniguruma and a grammar corpus; and the tokenizer is used by `CodeBlock` **and**
`CodeEditor` (per its own file header) — i.e. it must run at runtime on user-edited text in the
playground, where a build-time highlighter is useless.

**Verdict: port the in-house tokenizer verbatim (it is 533 lines of pure TypeScript).** Shiki is
a **CONSIDER** for one narrow case only: build-time highlighting of blog code fences, if the
blog ships before `CodeBlock` does. Remove it once `CodeBlock` lands.

### 6.4 Search

Upstream: `<CommandPalette>` (1,529 LOC) + `createStaticSource` over the generated registries.
No Algolia, no Pagefind, no Orama.

| Option | Version | Published | Verdict |
|---|---|---|---|
| **In-bundle static index** (status quo) | — | — | **ADOPT.** ~200 components + 22 docs + 42 templates + 5 posts is a few hundred KB of titles/descriptions/keywords, already generated. Parity, zero deps, works offline, instant. |
| `pagefind` | 1.5.2 | 2026-04-12 | **CONSIDER — later.** Very healthy (5,357 stars, pushed 2026-07-21). Post-build WASM index with fetch-on-demand fragments. Right answer *if* the index outgrows the bundle — e.g. when full **body** text of every doc becomes searchable. |
| `@orama/orama` | 3.1.18 | 2025-12-19 | Skip — no advantage over the static source at this size; 7 months quiet. |
| `minisearch` / `flexsearch` | 7.2.0 / 0.8.212 | 2025-09-16 / 2025-09-06 | Skip — same. |

Note the interaction: Pagefind indexes *rendered HTML output*, so it needs the docs site
prerendered (which doc 04 confirms every content route is). It stays available as a drop-in
later; the `CommandPalette` source interface is the seam.

### 6.5 Docs-site stack summary

```
SvelteKit 2.70.1 + Svelte 5.56.7 + Vite 8 + adapter-vercel (or adapter-static)
Content    ported generate-data.mjs → src/lib/generated/*, wrapped as a Vite plugin
Blog       ported posts.mjs + the ported <Markdown> component   (mdsvex only if a post needs a component)
Code       ported CodeBlock/tokenizer.ts + SyntaxTheme          (shiki@4.3.1 only as a stopgap for blog fences)
Search     in-bundle static index + <CommandPalette>            (pagefind@1.5.2 when body text is indexed)
Icons      @lucide/svelte@1.25.0
Playground CodeMirror 6 + svelte/compiler in a Worker           (phase 2 — doc 04 §8)
```

---

## 7. Icons

### 7.1 How Astryx does icons

Three layers, and the middle one is the whole answer:

1. **`core` ships its own inline SVGs.** `Icon/defaultIcons.tsx` (264 LOC) hand-writes all 25
   glyphs against a shared `svgProps` (`viewBox 0 0 24 24`, `stroke: currentColor`,
   `strokeWidth: 1.5`, `width/height: 1em`, `aria-hidden`). **`@astryxdesign/core` has no icon
   dependency at all.**
2. **A global registry is the seam.** `Icon/globalIconRegistry.tsx` (118 LOC) exports
   `registerIcons` / `getIconRegistry` / `getIcon` / `resetIcons` over
   `IconRegistry = Record<IconName, ReactNode>` with 25 names: `close`, `chevronDown`,
   `chevronLeft`, `chevronRight`, `check`, `success`, `error`, `warning`, `info`, `calendar`,
   `clock`, `externalLink`, `menu`, `moreHorizontal`, `search`, `arrowUp`, `arrowDown`,
   `arrowsUpDown`, `funnel`, `eyeSlash`, `viewColumns`, `copy`, `checkDouble`, `wrench`, `stop`,
   `microphone`. The module has no `'use client'` so it is importable from RSC.
3. **Themes supply lucide.** `packages/cli/templates/themes/*/icons.tsx` (7 themes × ~77 LOC)
   import from `lucide-react` and register them. The file header is explicit: *"These icons are
   bundled with the theme, not with `@astryxdesign/core`."*

### 7.2 The candidates

| Package | Version | Published | Svelte peer | Verdict |
|---|---|---|---|---|
| **`@lucide/svelte`** | **1.25.0** | **2026-07-17** | **`^5`** | **ADOPT** — for themes + docsite |
| `lucide-svelte` | 1.0.1 | 2026-03-23 | `^3 \|\| ^4 \|\| ^5.0.0-next.42` | **REJECT — DEPRECATED** |
| `unplugin-icons` (+ `@iconify/json` 2.2.503) | 23.0.1 | 2026-01-14 | — | Reject for `core`/themes; optional docsite convenience |

`lucide-svelte` carries an npm deprecation notice: *"Package deprecated. Please use
@lucide/svelte instead."* Its peer range still lists Svelte 3 and a Svelte 5 *prerelease*.
`@lucide/svelte` is the maintained scoped package — `svelte: ^5` only, 132 versions, published
four days before this survey — and it is what shadcn-svelte migrated to (doc 05 §5.2).
Upstream's docsite is on `lucide-react ^1.18.0`, so `@lucide/svelte@1.25.0` is the matching major.

`unplugin-icons` (23.0.1, 2026-01-14; `@iconify/json` refreshed 2026-07-20) is a build-time
Vite transform giving on-demand access to ~200k icons. It is fine tooling, but it introduces a
*compiler* dependency into the theme templates that users copy into their own projects — those
templates must be plain, portable Svelte. Skip it for themes. It is a defensible convenience in
the docsite alone if you need one-off icons outside the 25 semantic names.

### 7.3 DOM classification

`@lucide/svelte` renders `<svg>` with `<path>` children — it *is* DOM-owning. It is safe here for
one specific reason: **it renders only inside the `IconRegistry` seam that upstream already
designed as the third-party boundary.** Astryx's `Icon` component owns the wrapper element and
applies the atomic classes; the registry entry supplies the inner glyph with `size: '1em'` and
`aria-hidden`. Nothing about the atomic CSS depends on the shape of the `<path>` data. This is
the model for "DOM-owning but acceptable": the library gets a leaf, never a container.

### 7.4 Svelte-specific note

`IconRegistry` becomes `Record<IconName, Component | Snippet>` rather than `Record<IconName,
ReactNode>` — Svelte has no pre-instantiated-element equivalent of `<X {...iconProps} />`. Two
workable shapes: store the component constructor and render `<svelte:component>`/`{@const}`, or
store a `Snippet` and `{@render}` it. Prefer **component references** — `@lucide/svelte` exports
components directly, and it keeps `registerIcons({ close: X })` as terse as upstream's JSX.

### 7.5 Verdict

- **`@astryx-svelte/core`: no icon dependency.** Port `defaultIcons` as 25 inline `<svg>`
  snippets. Preserves upstream's zero-dep property exactly.
- **Theme templates + docsite: `@lucide/svelte@^1.25.0`.**
- **Never `lucide-svelte`** — and update doc 04 §7/§7.1 (Appendix A).

---

## 8. Testing

### 8.1 Current best practice for Svelte 5

The ecosystem converged during 2026, and the evidence is in the dependency graphs:
**`vitest-browser-svelte@3.0.0` and `@testing-library/svelte@5.4.2` now both depend on the same
`@testing-library/svelte-core@1.1.3`** (published 2026-06-23). The rendering/cleanup core is
shared; the difference is only the query/interaction layer and where the test runs.

| Package | Version | Published | Peers |
|---|---|---|---|
| **`vitest`** | **4.1.10** | 2026-07-06 | — |
| **`@vitest/browser`** | **4.1.10** | 2026-07-06 | — |
| **`@vitest/browser-playwright`** | **4.1.10** | 2026-07-06 | `vitest 4.1.10`, `playwright *` |
| **`vitest-browser-svelte`** | **3.0.0** | **2026-07-09** | `svelte ^3\|^4\|^5`, **`vitest ^4.0.0`** |
| `@testing-library/svelte` | 5.4.2 | 2026-06-23 | `svelte ^3\|^4\|^5`, `vite *`, `vitest *` |
| `@testing-library/svelte-core` | 1.1.3 | 2026-06-23 | `svelte ^3\|^4\|^5` |

**Recommendation: `vitest-browser-svelte`**, for reasons that are specific to this project rather
than general taste:

1. **Real browsers.** Astryx's behaviour layer is `useFocusTrap`, `useListFocus`, `useGridFocus`,
   `useTreeFocus`, `useOverflow`, `useScrollOverflow`, `useScrollLock`, `useImageMode`. Focus
   order, `:focus-visible`, scrollbar-gutter compensation, `OffscreenCanvas` and real layout
   measurement are all things jsdom either fakes or gets wrong.
2. **The Popover API and CSS anchor positioning do not exist in jsdom.** Every overlay in the
   system (§9) routes through `useLayer`, which uses `popover` + `anchor()`/`position-area`.
   These are simply untestable outside a real browser.
3. **Atomic-CSS verification needs a real cascade.** `scripts/verify-classes.mjs` (doc 05 §5.4)
   is a static check; catching *visual* regressions from a wrong `data-*` attribute needs
   computed styles from an engine that actually applied `astryx.css`.
4. The repo is already configured for it (`@vitest/browser-playwright ^4.1.8`, `playwright ^1.60.0`).

Keep `@testing-library/svelte` available for the genuinely pure units — `plainDate`, `timeParser`,
`dateParser`, `hct.ts`, `color.ts`, `groupItems`, the markdown parser, the tokenizer — but most of
those need no renderer at all, just plain `vitest` in Node. A **two-project `vitest.config.ts`**
(node project for pure logic, browser project for components) is the right shape and is what
`create-svelte` scaffolds in 2026.

### 8.2 Action required in this repo

`packages/core/package.json` pins `vitest-browser-svelte: ^2.1.1` alongside `vitest ^4.1.8`.
That resolves, but 2.1.1 is three minors behind. **Bump to `^3.0.0`.**

The v3.0.0 breaking change is exactly one thing: **`render` is async-only.**

```diff
- const { getByRole } = render(Button, { props: { label: 'Save' } });
+ const { getByRole } = await render(Button, { props: { label: 'Save' } });
```

Since the repo has no component tests yet (`packages/core/src` contains 4 files), **bump now** —
the migration cost is zero today and grows with every test written. v2.2.0 also added a `wrapper`
option, which is the clean way to mount components inside `<Theme>` / `<InternationalizationProvider>`
/ `<LayerProvider>` — that is worth having from the first test.

### 8.3 Verdict

**ADOPT** `vitest@^4.1.10` + `@vitest/browser@^4.1.10` + `@vitest/browser-playwright@^4.1.10` +
**`vitest-browser-svelte@^3.0.0`** (bump from `^2.1.1`), with a node-side `vitest` project for
pure modules. `@testing-library/svelte` optional; not required.

---

## 9. Floating / positioning and the 2026 browser baseline

### 9.1 What upstream does

`src/Layer/` (978 LOC) is doc 01's *"single most important primitive"* — every Popover, Tooltip,
HoverCard, DropdownMenu, ContextMenu, Selector, MultiSelector, Typeahead, Toast, MobileNav,
TabList overflow and SideNav flyout routes through it. Doc 01 §2.4:

> *"Positioning is done in **pure CSS** via `position-area` / `anchor()` with logical keywords, so
> RTL mirrors for free. Native **Popover API** (`popover` attribute + light dismiss) does the
> layering — there is no JS floating-ui-style positioning engine to port. This is good news: the
> hard part is CSS, and the CSS moves over unchanged."*

`anchorName.ts` (46 LOC) generates unique `--anchor-*` names. That is the entire positioning
engine.

### 9.2 Current baseline support (2026-07-21)

**Popover API** — `api.webstatus.dev`:

| Browser | Version | Date |
|---|---|---|
| Chrome / Chrome Android | 116 | 2023-08-15 |
| Edge | 116 | 2023-08-21 |
| Safari | 17 | 2023-09-18 |
| Firefox / Firefox Android | 125 | 2024-04-16 |
| Safari iOS | 18.3 | 2025-01-27 |
| **Baseline** | **newly available since 2025-01-27** | |

caniuse global usage: **89.75%**. **This is settled. Ship it.**

**CSS anchor positioning** — caniuse:

| Browser | Status |
|---|---|
| Chrome / Edge | ✅ 125+ (117–124 behind a flag) |
| Safari | ✅ 26.0+ |
| Firefox | ✅ 147+ (145–146 behind a flag) |
| **Global usage** | **81.67%** |
| **Baseline (webstatus.dev)** | **limited** |

All three engines now ship it — that is the material change since the last time this question
was asked. Firefox stable is **152.0.6** as of today (checked against
`product-details.mozilla.org`), so 147 is five releases back and the feature is well past its
Firefox debut. Baseline still reads "limited" because Baseline lags the third-engine ship by
design.

The residual ~18% is concentrated and identifiable:

- **Safari 18.x holdouts** (iOS devices not updated to iOS 26) — the largest slice.
- **Firefox ESR 140** — verified as the current ESR today. ESR 140 < 147, so **enterprise
  Firefox does not have anchor positioning** and will not until the next ESR rebase.
- Older Chromium (< 125), embedded webviews.

### 9.3 Is `@floating-ui/dom` needed?

**No — reject it as a dependency.** Three reasons, in order of weight:

1. **It would create a code path upstream doesn't have.** Floating UI computes coordinates in JS
   and writes `style="position:absolute; left:…px; top:…px"` (or transforms) onto the floating
   element. Astryx's overlays get position from CSS `position-area` on classes that come out of
   the compiled atomic sheet. Running both means inline styles racing atomic classes on the same
   element — the exact failure mode this project is organised to avoid. It also breaks
   `Layer`'s RTL-for-free property, which comes from CSS logical keywords.
2. **Divergence cost.** Doc 05's core lesson is that behavioural divergence from upstream is
   permanent and expensive. A JS positioning engine in `useLayer` means the Svelte `Layer`
   is a different component from the React one forever.
3. **It doesn't degrade gracefully anyway.** Without anchor positioning the popover still
   *renders* (Popover API is at 89.75% and Baseline-newly), it just lands in the browser's
   default position. That is a cosmetic degradation on a shrinking minority, not a broken
   feature.

`svelte-floating-ui@1.6.2` (2025-03-28, 16 months stale) is doubly moot.

### 9.4 The escape hatch

**CONSIDER — opt-in only: `@oddbird/css-anchor-positioning@0.9.0`** (published 2026-02-11).

It is a **polyfill**: it parses stylesheets for `anchor()`/`position-area`/`@position-try`,
computes positions, and applies them. Critically for this project, **it rewrites CSS values, not
DOM structure** — no elements added, no classes changed — so it passes the constraint test.

Ship it as documentation plus an optional entry point, never a dependency:

```js
// Only for apps that must support Safari < 26 or Firefox ESR 140.
if (!CSS.supports('anchor-name: --a')) {
  await import('@oddbird/css-anchor-positioning/fn').then(m => m.default());
}
```

Feature-detected, dynamically imported, zero cost for the 82% who don't need it. It is still
`0.x`, so treat it as best-effort. Document the degradation; don't promise pixel parity.

### 9.5 Bonus finding — `@scope`

`theme/generateThemeRules.ts` (669 LOC) *"emits `@scope`-based CSS rules"*. Worth knowing:
`@scope` became **Baseline newly available on 2025-12-12** (Chrome 143 2025-12-02, Firefox 146
2025-12-09, Safari 26.2 2025-12-12) — **seven months old**. It is newer than anchor positioning's
Chrome ship. The theming system therefore has a *narrower* effective support floor than the
positioning system. That is upstream's choice and the port inherits it, but it belongs in the
docs-site browser-support note alongside the anchor caveat, and it means nested `<Theme>` is the
first thing to check when a bug report arrives from an older browser.

### 9.6 Verdict

**Native Popover API + CSS anchor positioning is sufficient in 2026. REJECT `@floating-ui/dom`
and `svelte-floating-ui`. Port `useLayer`'s CSS verbatim. Offer
`@oddbird/css-anchor-positioning` as a documented, feature-detected, opt-in polyfill.**

---

## 10. i18n

### 10.1 How Astryx does it

`src/i18n/` — 459 LOC across 6 files: `resolve.ts` (165, locale resolution + fallback chain),
`InternationalizationProvider.tsx` (82, props `locale`/`messages`/`overrides`/`timeZone`),
`types.ts` (53), `useTranslator.ts` (50), `InternationalizationContext.ts` (39),
`translator.ts` (31, interpolation). Formatting is native `Intl` throughout — **no bundled CLDR**.
`intl-messageformat@^11.2.9` is the **only** runtime dependency in `@astryxdesign/core`.
44 of 96 component units call `useTranslator`.

### 10.2 Should anything change? No.

`intl-messageformat@11.2.12` was published **2026-07-16** — five days before this survey. FormatJS
is one of the best-maintained i18n stacks in JavaScript (309 versions; `@formatjs/intl@4.1.17`
same day). It has no framework coupling and renders nothing: you give it an ICU MessageFormat
string and values, it gives you a string. Textbook pure-logic.

More importantly the *architecture* is right for a component library. Messages arrive as a
**runtime prop** on a provider, with an `overrides` escape hatch. That is what lets a consumer
drop `@astryx-svelte/core` into an app with an existing translation pipeline and wire it up in
one place.

| Alternative | Version | Published | Why not |
|---|---|---|---|
| `@inlang/paraglide-js` | 2.22.0 | 2026-07-14 | Healthy, and a good choice for *applications*. But it **compiles messages into per-locale JS modules at build time**. A component library cannot compile its consumers' messages. Structurally incompatible with the `messages` prop. |
| `@inlang/paraglide-sveltekit` | 0.16.1 | 2025-03-13 | **DEPRECATED** on npm. |
| `svelte-i18n` | 4.0.1 | **2024-10-21** | 21 months stale; store-based, pre-runes. |
| `typesafe-i18n` | 5.27.1 | 2026-02-11 | Codegen-based; same structural mismatch as Paraglide, smaller community. |
| `@formatjs/intl` | 4.1.17 | 2026-07-16 | Bigger sibling of what's already used — adds a locale-data/caching layer Astryx doesn't need. |

### 10.3 The Svelte-specific work

The port work is in the *plumbing*, not the library. Per doc 06 §7 the shape is:

- `InternationalizationContext` → a `runed` `Context<I18nState>`.
- `useTranslator()` returns a `t` function; make it a `$derived` over `{locale, messages,
  overrides}` so re-renders happen when the provider changes — **the classic Svelte reactivity
  trap doc 06 §3.2 warns about** (destructuring the context loses reactivity).
- Cache `IntlMessageFormat` instances per `(locale, key)`. `intl-messageformat` ships
  `@formatjs/fast-memoize` for exactly this; upstream leans on it.
- SSR: message resolution must be deterministic per request. Do not memoize across requests in
  module scope on the server.

### 10.4 Verdict

**ADOPT — keep `intl-messageformat@^11.2.12`.** Match upstream's `^11.2.9` floor. No alternative
is justified.

---

## 11. Everything else

### 11.1 Resizable panels

Astryx `Resizable` (986 LOC) exports `Resizable`, `useResizable`, `ResizeHandle`, and is consumed
by `SideNav` (2,574 LOC).

| Package | Version | Published | Verdict |
|---|---|---|---|
| `paneforge` | 1.0.2 | **2025-08-02** | **REJECT** — renders `PaneGroup`/`Pane`/`Resizer`, owns the flex container and every divider. ~12 months without a push. |
| `svelte-splitpanes` | 8.0.12 | 2025-11-25 | **REJECT** — same, plus its own class names and slot structure. |

Both are textbook DOM-owning. Astryx's `Resizable` puts atomic classes on the container, the
panes and the handle, and `SideNav` layers its own collapse behaviour on top. Port it; use
runed's `ElementSize`/`useResizeObserver` and `useEventListener` for the pointer plumbing.

Note that `paneforge` is by the same author as `bits-ui` and depends on `runed` + `svelte-toolbelt`
— it is a *reference* worth reading for pointer-capture and `aria-valuenow` handling on a
separator, and nothing more.

### 11.2 Markdown parsing

Astryx `Markdown/` — `parser.ts` (1,776), `Markdown.tsx` (1,750), `streaming.ts` (130), plus
2,188 LOC of tests including `incremental.test.ts` (688) and `parser.perf.test.ts` (194).

**REJECT `marked@18.0.7` / `markdown-it@14.3.0`.** Both are excellent general parsers and both
are actively maintained (marked published *today*). Neither fits, for two concrete reasons:

1. **A custom AST.** `InlineNode` includes `{type: 'citation', sourceId: string}` — an
   Astryx-specific node with no CommonMark equivalent. `BlockNode` carries an ordered-list
   `delimiter: '.' | ')'`, a `loose` flag, and per-column `TableAlignment`. `Markdown.tsx` maps
   these onto `Blockquote`, `CheckboxList`, `Citation`, `CodeBlock`, `Link`, `List` and `Table`
   — Astryx components with atomic classes. A generic parser gives you HTML or an mdast, and you
   would write a full transform layer to get back to this AST.
2. **Incremental/streaming re-parse.** The parser is built to be re-run on a growing string as
   chat tokens arrive, paired with `useStreamingText` (195 LOC). `incremental.test.ts` is 688
   lines of exactly this. `marked`/`markdown-it` are single-shot; re-parsing the whole buffer per
   token is O(n²) and drops the partial-state handling the streaming tests assert.

`streaming-markdown@0.2.15` (2025-05-04) does target streaming, but it is 14 months stale, `0.x`,
and emits its own DOM. Reject.

**Port `parser.ts` verbatim** — it is pure TypeScript with zero imports. Only `Markdown.tsx`'s
render half needs rewriting. Consider `dompurify@3.4.12` (2026-07-11) *only* if the Svelte port
ever renders raw HTML passthrough; the AST-based renderer doesn't need it.

### 11.3 Code editing (playground, phase 2)

| Package | Version | Published | Verdict |
|---|---|---|---|
| `codemirror` 6 (`@codemirror/state` 6.7.1, pub 2026-07-05) | 6.0.2 | 2025-06-19 | **CONSIDER — preferred** |
| `monaco-editor` | 0.56.0 | 2026-07-20 | Reject — works, but ~5× the weight |
| `svelte-codemirror-editor` | 2.1.0 | 2025-10-10 | Optional thin wrapper (`svelte ^5`, `codemirror ^6`); the direct integration is ~50 lines |
| `carta-md` | 4.11.2 | 2026-04-10 | Not applicable — a markdown *editor*, not a code editor |

Upstream self-hosts Monaco from `public/monaco/vs`. CodeMirror 6 is lighter, has first-class
Svelte usage (the official Svelte REPL uses it), and integrates with Vite without the worker
gymnastics Monaco needs. The `codemirror` meta-package's `6.0.2` date looks stale but is
misleading — it is a thin re-export; the real packages (`@codemirror/state@6.7.1`, 2026-07-05)
ship constantly.

This is DOM-owning and that is fine: the editor lives on `/playground`, outside the design
system's styling surface. Isolate it in the docsite; it must never appear in `@astryx-svelte/core`.

### 11.4 State machines

**REJECT `xstate@5.32.5`** (2026-07-14 — healthy, just unnecessary). Nothing in Astryx is
machine-shaped enough to justify ~40 kB plus a modelling paradigm. The two or three places that
genuinely want one — `useMenuHover`'s safe-triangle intent (195 LOC), `Toast` lifecycle,
async `clickAction` pending/settled — are served by **`runed`'s `FiniteStateMachine`**, which is
already in the dependency tree at zero marginal cost.

### 11.5 Carousel

**REJECT `embla-carousel-svelte@8.6.0`** (2025-04-04). Embla owns the viewport/container/slide
element structure and writes transforms inline. Astryx `Carousel` is 430 LOC with `Button` +
`Icon` deps. Port it.

### 11.6 Forms

**REJECT `formsnap@2.0.1`** (2025-04-09 — 15 months stale) and **`sveltekit-superforms@2.30.2`**
(2026-07-04 — healthy, but server-form-centric with a 15-validator peer matrix). Astryx has no
form-orchestration layer to replace: `Field` (849), `FieldLabel`, `FieldStatus` (185),
`FormLayout` (201) and `inputAria.ts` (58) *are* the contract, and `getInputARIA()` is
deliberately the shared ARIA wiring for every Data Input component. Adding a form library would
compete with it.

### 11.7 Utilities that are already in Svelte or upstream

| Tempting dep | Use instead |
|---|---|
| `clsx` (2.1.1, 2024-04-23) | `stylex.props()` already returns `{className, style}`; doc 06 §4.6 defines the merge |
| `tabbable` (6.5.0) / `focus-trap` (8.2.2) | Astryx has `focusableSelector.ts` (25) + `useFocusTrap` (400). Both are current and are worth reading as references. |
| `nanoid` | `$props.id()` (doc 06 §1.5) + `crypto.randomUUID()` |
| `dequal` | Already transitively present via `runed` |
| `@sveltejs/enhanced-img` (0.11.0) | Docsite-only convenience; not for `core` |

---

## 12. Concrete `package.json` deltas

### `packages/core/package.json`

```jsonc
{
  "dependencies": {
    "@stylexjs/stylex": "^0.19.0",     // keep — matches upstream peer exactly
    "runed": "^0.37.1",                // keep — see §2.4 for the review trigger
    "intl-messageformat": "^11.2.12"   // ADD when i18n/ lands (upstream floor: ^11.2.9)
    // "@tanstack/virtual-core": "^3.17.5"  // ADD when virtualization lands;
    //                                       // prefer a /virtual subpath export
  },
  "peerDependencies": { "svelte": "^5.0.0" },
  "devDependencies": {
    "vitest-browser-svelte": "^3.0.0"  // BUMP from ^2.1.1 — render() is now async-only
  }
}
```

Everything else in `core`'s current `devDependencies` is current (Svelte 5.56.1 floor, Vite 8,
Vitest 4.1.8, `@vitest/browser-playwright` 4.1.8, svelte-check 4.6, TypeScript 6). No other changes
needed.

Target end state: **three runtime dependencies, maximum.** Upstream ships with one.

### Docs site (`apps/docs` — to be created)

```jsonc
{
  "dependencies": { "@lucide/svelte": "^1.25.0" },
  "devDependencies": {
    "@sveltejs/kit": "^2.70.1",
    "svelte": "^5.56.7"
    // "mdsvex": "^0.12.8"   // ONLY if a blog post must embed a Svelte component
    // "shiki": "^4.3.1"     // ONLY as a stopgap until CodeBlock ports
    // "pagefind": "^1.5.2"  // ONLY when the static index outgrows the bundle
  }
}
```

### CLI theme templates (`packages/cli/templates/themes/*`)

Each generated theme's `icons.ts` should import from `@lucide/svelte@^1.25.0` — **never
`lucide-svelte`**. Users copy these files into their own projects, so keep them plain: no
`unplugin-icons`, no build-step requirement.

---

## 13. Watch list — what would change these answers

| Trigger | Revisit | Check by |
|---|---|---|
| `runed` publishes nothing by **2026-12-20** (12 months) | Vendor the ~8 utilities in use behind `src/lib/internal/runed.ts`; drop the dep | 2026-12-20 |
| **TanStack Table v9 reaches stable** *and* a v9-only feature is requested | Optional `@astryx-svelte/table-tanstack` adapter feeding `TablePlugin` — never in `core` | quarterly |
| **Safari ships Temporal** | Replace `plainDate.ts`/`timeParser.ts` internals with `Temporal.*`; keep the `ISODateString`/`ISOTimeString` public types | quarterly |
| **CSS anchor positioning reaches Baseline "newly available"** | Delete the polyfill escape hatch from the docs | quarterly |
| **Firefox ESR rebases past 147** | Same — removes the largest identified enterprise gap | at each ESR |
| Non-Gregorian calendars become a requirement | Reopen `@internationalized/date` — it is the right library for that problem | on demand |
| The docs index outgrows the bundle (full body-text search) | Adopt `pagefind@^1.5.2`; the `CommandPalette` source interface is the seam | when it hurts |
| `mdsvex` goes quiet again for >12 months | Moot if the recommendation in §6.2 is followed (no mdsvex) | 2027-07 |

---

## Appendix A — corrections to earlier planning docs

Two recommendations in doc 04 are now out of date, and one deserves reinforcement.

| Doc | Says | Correction |
|---|---|---|
| **04 §7 (Icons row) and §7.1 (stack block)** | *"Icons: **`lucide-svelte`**"* | **`lucide-svelte` is deprecated on npm** — *"Package deprecated. Please use @lucide/svelte instead."* Use **`@lucide/svelte@^1.25.0`** (peer `svelte: ^5`). §7. |
| **04 §7 (Blog row)** | *"**mdsvex** ... or keep the same generator + `marked`/`markdown-it`"* | Prefer the ported `posts.mjs` + the ported `<Markdown>` component. `marked`/`markdown-it` are rejected for the *component* (§11.2); for the blog they are unnecessary since `<Markdown>` must exist anyway for `/docs/core` and `/changelog`. mdsvex (0.12.8) is fine **only** if a post embeds a component. §6.2. |
| **05 §5.4** | *"Bits UI / Melt UI are rejected as a foundation because Astryx's styling contract is DOM-shape-coupled."* | **Confirmed, not overturned.** Re-verified against `bits-ui@2.18.1` and `melt@0.44.0`. The Table's `TablePlugin` interface (§1) is direct evidence: eight of its eight methods transform element props. §1, §3. |

Doc 04's other calls all survive: keep `.doc.mjs`, port the in-house tokenizer, keep the
in-bundle search index, use CodeMirror-or-Monaco for the playground, port `analytics.ts` and
`resolve-content-root.mjs` verbatim.

---

## Appendix B — how this was verified

Version numbers and publish dates in this document were read from the **live npm registry**
(`https://registry.npmjs.org/<pkg>`, `dist-tags` + `time` + per-version `peerDependencies` /
`peerDependenciesMeta` / `deprecated`), not from search results or memory. Search-engine results
were treated as leads only.

- **Registry sweep** — a Node script fetched the full packument for ~70 candidates and printed
  `latest`, its publish timestamp, the most recent publish on *any* tag, the version count and
  all dist-tags. This is how `lucide-svelte`'s deprecation, `@tanstack/svelte-table` v8's Svelte-4
  peer range, and `@inlang/paraglide-sveltekit`'s deprecation were found — none of which surface
  in documentation.
- **Source inspection** — `@tanstack/svelte-virtual@3.13.33` was downloaded with `npm pack` and
  its `dist/index.js` read directly. That is the only way the `svelte/store` implementation
  (versus the permissive `^5.0.0` peer range) became visible. §5.2.
- **Repository health** — GitHub API (`gh api repos/<owner>/<repo>`) for `archived`, `pushed_at`,
  stars and open issues; `.../commits` and `.../releases` for cadence. This distinguished
  `runed`'s 7-month release gap from actual abandonment, and established that
  `github.com/svecosystem/mdsx` returns **404**.
- **Browser support** — `https://api.webstatus.dev/v1/features/<id>` for Baseline status and
  per-browser ship dates (Popover, `@scope`, Temporal); caniuse for CSS anchor positioning global
  usage; `https://product-details.mozilla.org/1.0/firefox_versions.json` to confirm Firefox
  stable **152.0.6** and ESR **140.12.0esr** as of 2026-07-21.
- **Upstream source** — read from `reference/astryx-upstream`: `packages/core/src/Table/**`
  (plugin interface, per-plugin LOC), `src/utils/{plainDate,timeParser,dateParser}.ts`,
  `src/Icon/{globalIconRegistry,defaultIcons}.tsx`, `src/Markdown/parser.ts`,
  `src/CodeBlock/tokenizer.ts`, `packages/core/package.json`,
  `packages/cli/templates/themes/*/icons.tsx`.
- **This repo** — `packages/core/package.json` for the current dependency set;
  `node_modules/.pnpm/svelte@5.56.7/.../reactivity/index-client.js` for the exact list of
  built-in reactive primitives.

Key sources: [npm registry](https://registry.npmjs.org), [TanStack Table v9 blog](https://tanstack.com/blog/tanstack-table-v9-taking-form),
[TanStack Table v9 Svelte migration guide](https://tanstack.com/table/beta/docs/framework/svelte/guide/migrating),
[Runed docs](https://runed.dev/docs), [caniuse: CSS anchor positioning](https://caniuse.com/css-anchor-positioning),
[webstatus.dev](https://webstatus.dev), [MDsveX releases](https://github.com/pngwn/MDsveX/releases),
[vitest-browser-svelte releases](https://github.com/vitest-community/vitest-browser-svelte/releases).
