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

### A pre-built stylesheet, the same as upstream's

```ts
import '@astryx-svelte/core/base.css';
import '@astryx-svelte/core/astryx.css';
```

That is now the entire setup. 0.3.0 said this package "cannot" ship a pre-built stylesheet; that was
wrong — upstream publishes `./astryx.css` from a post-build script, and not porting that script was
an omission, not a constraint.

**`dist` now ships compiled.** Shipping the stylesheet alone was not enough: `svelte-package` does
not run StyleX, and `stylex.create` *throws* at runtime rather than no-opping, so the stylesheet by
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
  genuinely deferred set is upstream's ~614 *block* templates. This shipped in every tarball and
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
