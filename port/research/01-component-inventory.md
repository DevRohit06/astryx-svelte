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
