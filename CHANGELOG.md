# Changelog

Every package in this workspace carries the version of the upstream
[Astryx](https://astryx.atmeta.com/) release it ports, and they are published together, so this one
file covers all ten.

**The version is the parity target, not a count of this port's own releases** — which means a
release the port makes on its own has no number of its own to take. 0.3.1 is the first of those: it
ports Astryx 0.3.0, exactly as 0.3.0 did, and changes only things upstream has no counterpart for.
Each entry states its parity target for that reason.

## 0.3.1

Ports Astryx `0.3.0` — the same parity target as 0.3.0. **This release is the port's own, not an
upstream one**, which is something the version scheme cannot express; `TODO.md` carries the rule for
when upstream publishes its own 0.3.1.

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

### Fixed

- **`doctor` reported optional peer dependencies as missing.** `peerDependenciesMeta.optional` was
  ignored, so adding `vite` and `@stylexjs/unplugin` as optional peers of core told every project on
  another bundler to install two packages it has no use for. A warning nobody should act on is how
  the ones that matter stop being read.

## 0.3.0

The first release. Ports Astryx `0.3.0` — the tag, not the tarball, where the two disagree.

Documentation: **<https://astryx-svelte.rohitk06.in/>**, generated from the same `.doc.mjs` modules
the CLI reads, so the site and the terminal cannot disagree.

### Published

| Package                                                                                       | What it is                                                              |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `@astryx-svelte/core`                                                                         | Components, theme system, hooks, message catalogs                       |
| `@astryx-svelte/cli`                                                                          | Docs, search, page templates, theme tooling and codemods                |
| `@astryx-svelte/theme-{neutral,butter,chocolate,gothic,matcha,stone,y2k}`                      | Upstream's seven themes                                                 |
| `@astryx-svelte/theme-liquid-glass`                                                           | macOS translucent materials — **no upstream counterpart**, see below    |

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
