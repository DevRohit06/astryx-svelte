# Astryx → Svelte: Component Inventory & Public API Surface

> Written in July 2026, before the port existed, from a machine read of every
> `packages/core/src/<Name>/<Name>.doc.mjs` in upstream `@astryxdesign/core@0.1.7`. All 96
> `packages/core` units it inventoried are now ported — see `packages/core/src/lib/components/`
> (98 directories) for the actual API, and `port/ledger/` for how each one was built. The
> per-component descriptions, the build-order/dependency-graph planning, and the difficulty
> ratings this file used to carry are gone: the code and the ledger are strictly better answers
> to those questions now.

Only one section survived compaction: the inventory of what `packages/core` does **not** cover,
because that work has not started and upstream's own source (not this repo) is still the only
spec for it.

## Packages outside `@astryxdesign/core`

None of this is in scope for `packages/core` — it explains the "Data Visualization" category on
the public site and the components that appear there without existing in this port. Cross-check
against `port/todo.md`'s "Fronts not started" table before scoping any of it.

| Package                                     | Contents                                                                                                                                                                                                                                                                                                                                                                         | Note                                                                                                              |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `@astryxdesign/charts`                      | `Chart`, `ChartAxis`, `ChartGrid`, `ChartLegend`, `ChartTooltip`, `ChartSwatch`, marks, WebGL helpers                                                                                                                                                                                                                                                                            | The Data Visualization category. Depends on core.                                                                 |
| `@astryxdesign/lab`                         | `Chart*` (Area/Bar/Candlestick/Dot/DotGL/HeatmapGL/Line/StreamGL), `ChatEmojiPicker`, `ChatReactionBar`, `ChatTypingIndicator`, `ChatUnreadDivider`, `ChatReasoning`, `CircularProgress`, `CodeEditor`, `Drawer`, `InfoTip`, `LogStream`, `RadialChart`, `SankeyChart`, `SVGIcon`, `Schedule`, `Stat`, `Stepper`/`Step`, `3DBar`/`3DChart`/`3DScatter`/`3DScatterGL`/`3DSurface` | **Unstable / lab.** 31 documented components, several WebGL/Three.js. Port only after core parity work has slack. |
| `@astryxdesign/themes`                      | Prebuilt themes                                                                                                                                                                                                                                                                                                                                                                  | Data only — this port already builds its own 8 theme packages against upstream's token references.                |
| `@astryxdesign/cli`                         | Scaffolding + showcase block templates                                                                                                                                                                                                                                                                                                                                           | Reference for canonical usage examples.                                                                           |
| `@astryxdesign/vega`, `@astryxdesign/build` | Vega integration, build tooling                                                                                                                                                                                                                                                                                                                                                  | n/a                                                                                                               |

As of this compaction (2026-08-16), `lab` (17 components, ~995 KB), `charts` (35 files), `vega`
(5 files), `richtext` (1 file) and `build` (7 files) are all still unstarted — read the upstream
source at `reference/astryx-upstream/packages/{lab,charts,vega,build}` directly when one of these
becomes the next front, rather than trusting a July 2026 snapshot of it.

> **Corrected 2026-08-19, opening batch 029.** Two things above were already wrong, and the
> `start-batch` pre-flight is what caught them.
>
> **`lab` is not a fixed set — components graduate out of it.** `BottomSheet` moved from
> `packages/lab/src/BottomSheet/` to `packages/core/src/BottomSheet/` at upstream 0.4.4, taking
> `useSheetGestures`, `useMobileKeyboard` and `snapOffsets` with it and gaining a substantial
> rewrite on the way (rename similarity as low as 50%). `lab`'s source directory count went 20 ->
> 19 between v0.4.2 and v0.4.4. So "unstarted lab component" is not a stable category: one of them
> is now a **core** unit this port owes, and the next tracking batch may inherit another the same
> way.
>
> **The `lab` row never listed `BottomSheet`.** The component list in the table above is not the
> whole package and never was, so a count derived from it — the "17 components" — was not a
> measurement. Read `git ls-tree -d --name-only <tag> packages/lab/src/` for the real figure; it
> reports 19 at v0.4.4.
>
> The rest of the row is unverified against 0.4.4 and should be re-measured, not trusted, whenever
> `lab` genuinely becomes the next front.
