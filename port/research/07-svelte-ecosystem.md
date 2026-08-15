# The Svelte 5 Ecosystem: What `astryx-svelte` Should Adopt

> A dependency-adoption survey from 2026-07-21, before the port existed — 70 packages evaluated
> against live npm/GitHub data at that date. Its verdicts are now facts you can check directly
> against `packages/core/package.json`, `packages/cli/package.json`, `packages/themes/*/package.json`
> and `docs/package.json` rather than trusting a year-old snapshot: version numbers move, and at
> least one recommendation this file made was **not** followed — it recommended keeping `runed` as
> a `packages/core` dependency (§2 in the original), and `packages/core` ships none today; the
> `Context`-shaped helper this port's code and `.claude/agents/astryx-idiom.md` call "the `runed`
> Context wrapper" is a hand-written equivalent, not the npm package. `@lucide/svelte` **was**
> adopted exactly as recommended, but only in themes and the CLI, never in `core` — check
> `packages/themes/*/package.json` rather than this file. The per-library decision tables (runes
> utilities, Table/TanStack, date libraries, virtualization, docs-site tooling, icons, testing,
> i18n, "everything else") this document used to carry are gone as a result; whatever the current
> answer is, `package.json` and the actual source under `packages/*/src/lib/` are ground truth.

Two things survived: a reusable decision heuristic that outlives any specific library, and a
browser-support measurement that would be expensive to retake and that still feeds an open
decision in `port/todo.md`.

## The classification test for any future library candidate

Astryx's styling is DOM-shape-coupled: atomic CSS classes are applied per-element via
`stylex.props()`, so a library that owns element structure competes with the styling system
rather than assisting it. The test used throughout the original survey, still worth applying to
anything proposed later: **does the library, at any point, decide what element gets rendered or
what attributes land on it?** If yes, it is DOM-owning — reject it, or isolate it behind a seam
that already exists (the way `@lucide/svelte` is safe only because it renders exclusively inside
the `Icon` component's registry seam, never as a container). If it only returns data — numbers,
ranges, sorted arrays, parsed ASTs, formatted strings — it is pure-logic and safe regardless of
whether it ends up adopted.

## Browser-baseline measurement: Popover API, CSS anchor positioning, `@scope`

Feeds `port/todo.md`'s still-open decision, "Decide the `@scope` floor (Baseline only since
2025-12-12) — fall back to descendant selectors, or require it?" Re-verify the dates before
relying on them; this was measured once, on 2026-07-21, against `api.webstatus.dev` and caniuse:

| Feature                | Status as of 2026-07-21                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Popover API            | Baseline newly available since 2025-01-27; ~89.75% global usage. Settled.                                                                                                                                                                                                                                                                                                                |
| CSS anchor positioning | All three engines ship it (Chrome/Edge 125+, Safari 26+, Firefox 147+), but Baseline still reads "limited" because Baseline lags the third-engine ship by design. ~81.67% global usage. Residual gap: Safari 18.x holdouts (iOS not on 26), Firefox ESR 140 (below 147), older Chromium.                                                                                                 |
| `@scope`               | Baseline newly available since 2025-12-12 (Chrome 143, Firefox 146, Safari 26.2) — narrower support than anchor positioning, since it shipped later on all three engines. This is upstream's own choice (`generateThemeRules.ts` emits `@scope`-based theme CSS) and the port inherits it: nested `<Theme>` is the first thing to check when a bug report arrives from an older browser. |

This is also why `@floating-ui/dom` was rejected rather than added as a JS-computed positioning
fallback: Astryx's overlays get position from CSS `position-area` on classes already in the
compiled atomic sheet, and a JS positioning engine would write competing inline styles onto the
same element — the exact failure mode atomic CSS is organised to avoid — while buying nothing,
since without anchor positioning support the popover still renders, just in the browser's default
position. `@oddbird/css-anchor-positioning` remains the documented, feature-detected, opt-in
escape hatch for Safari-below-26 / Firefox-ESR readers, because it rewrites CSS values rather
than DOM structure and so passes the classification test above; it was not built at time of
writing, so check whether it has been added since.
