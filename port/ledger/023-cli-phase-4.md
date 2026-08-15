---
seq: 23
title: Phase 4 — the CLI
upstream: 0.3.0
date: 2026-08-07..2026-08-09
units: [build, component, discover, docs, doctor, init, layout, search, swizzle, template, theme, util, upgrade, validate-integration, manifest]
upstream-prs: []
---

## Scope

The next front after the 0.3.0 release (decided 2026-08-07): `packages/cli` goes from a placeholder
`package.json` to a real package shipping all 14 of upstream's commands bar `blog`, which stays
deferred. This file carries the whole phase — all ten slices, landed and still-open items alike — as
one unit, the way `port/todo.md`'s own Phase 4 heading treated it. It is not a component batch, so it
has no `## <Unit>`-per-component section; the slices below are the unit.


**The next front after the release** (decided 2026-08-07). Per `research/02`: Astryx has **no
registry** — components ship as an npm package that publishes its `src/`, and the CLI reads from
`node_modules`. Do **not** graft on a hosted registry.

`packages/cli` is a **placeholder, not a scaffold**: one `package.json`, no sources, and a `bin`
entry pointing at a `./bin/astryx-svelte.mjs` that does not exist. It is marked `"private": true`
so the release cannot publish a broken binary; **remove that flag when the CLI is real**, and not
before.

**Measured scope at `v0.3.0`** — 1,809 files / 4.3 MB, which badly overstates the job:

| area          | files |   size | what it is                                                                                       |
| ------------- | ----: | -----: | ------------------------------------------------------------------------------------------------ |
| `assets/`     | 1,502 | 2.6 MB | docs, templates, blocks, codemods — content, and the `.doc.mjs` half already feeds our docs site |
| `api/`        |   125 | 543 KB | the real logic; returns `{type, data}`, throws `AstryxError`                                     |
| `clients/`    |    75 | 454 KB | the Commander shell                                                                              |
| `foundation/` |    55 | 410 KB | XLE grammar and support                                                                          |
| `authoring/`  |    38 | 103 KB | config / integration / doctype / codemod parsers                                                 |

So **293 code files (~1.5 MB)** is the port — refined once slice 1 landed: **117 of those are
tests**, so **176 are source modules**. The 1,502 asset files are mostly transcription or
adaptation. `foundation/xle/` is an isolated subsystem that can land in a later milestone without
blocking anything — `research/02` already rates it lowest priority.

### Slice 1 — landed 2026-08-08

`packages/cli` is a real package: 20 files in the tarball, `check`/`lint`/`test` all exit 0, 35
tests. Still `"private": true` — that flag comes off when the CLI is genuinely usable, not before.

- [x] **`api/` ↔ `commands/` seam.** `api/` returns `{type, data}` and throws `AstryxError`; it never
      touches stdout, never calls `process.exit`, never reads `--json`. `clients/cli/` owns all four
      enforcement points — the `preAction` allowlist gate, the `postAction` backstop, `cliError` (the
      one place `AstryxError.code` becomes an envelope), and `json-shim`, which extends the contract
      to Commander's parse-time short-circuits that run *before* `preAction`. `manifest` is
      deliberately **not** in `api/`: it introspects the live Commander program, so an `api/manifest`
      would create the `api → cli` cycle upstream calls out by issue number
- [x] **`manifest --json`**, `apiVersion: 1`. Verified against the **real** `@astryxdesign/cli@0.3.0`
      binary (installed under `docs/node_modules`, so it is runnable) rather than against the
      changelog: **12/12 structural checks, 0 diffs** — envelope key order, data key order, all six
      `globalOptions` byte-identical, the `manifest` entry identical on every key including order.
      The only differences are the two that must differ: `data.name` and the bin name in `examples`.
      8 further JSON-contract edge paths (unknown command, bare `--json`, `--version --json`, bad
      `--lang`/`--detail`, unknown option, `--help --json` at root and leaf) all match on keys,
      `type`, `code` and exit code
- [x] **The append-only `ERR_*` codes — there are 43, not 53.** Verified against the frozen object at
      both tags; `v0.1.7` and `v0.3.0` are byte-identical in membership *and* order. **The "53" in
      `research/02` §1.3 and in this checklist was wrong.** All 43 transcribed in upstream's order and
      grouping, including codes for commands not yet ported (blog, layout, upgrade), as append-only
      requires. **Upstream bug, not replicated:** its `error-codes.d.ts` declares only **41** —
      `ERR_UNKNOWN_POST` and `ERR_FETCH_FAILED` are missing from the union, so a TypeScript consumer
      cannot compare against two codes the CLI really emits. Upstream's test only iterates the runtime
      object, which is how it drifted. Ours declares all 43 and cross-checks the union against the
      frozen object for membership *and* order
- [x] **`JSON_SUPPORTED` / `RESPONSE_TYPES` deliberately not pre-seeded** with upstream's 19 commands.
      The drift guard fails in both directions, so pre-seeding would switch it off for the whole port.
      Each slice must add registry entry + allowlist name + response-types row together, or the test
      fails

**Two Commander 12 → 14 breaks, both of which would have shipped silently.** Upstream pins
`commander@^12.1.0`; we are on 14.0.3.

- `configureHelp({wrap})` was renamed to `boxWrap` in 13. `configureHelp` merges unknown keys without
  complaint, so upstream's spelling type-checks, runs, and simply fails to disable wrapping.
- **`allowExcessArguments` flipped default `true` → `false`**, and this one destroyed a real recovery
  path: `astryx-svelte bogus-cmd` was rejected by the excess-args check *during parse*, so the root
  action never ran, and the result was `ERR_INVALID_ARGUMENT` with no suggestions instead of
  `ERR_UNKNOWN_COMMAND` with the "did you mean" list — exactly what an agent depends on when it
  guesses a verb wrong. Caught by the ported test, confirmed against the upstream binary.

**Three corrections to `research/02`, all of it 0.1.7-era where it disagrees:**

- **The `src/{api,commands,lib,…}` layout in §7.3 no longer exists.** At v0.3.0 upstream is
  root-level `api/` + `clients/cli/` + `foundation/` + `authoring/`. Slice 1 follows v0.3.0, because
  ~293 later-slice files carry v0.3.0 paths and a `src/` remap would need a translation table for
  every one. One deliberate divergence: the bin sits at `bin/astryx-svelte.mjs` rather than
  `clients/cli/bin/`, matching what `package.json#bin` already declared.
- **`@clack/prompts` is dead.** Upstream v0.3.0 uses **no prompt library at all** — `init` is
  non-interactive. §7.3's "interactive `@clack/prompts` wizard" is 0.1.7-era; the dependency has been
  removed.
- **`blog` is no longer hidden and *is* on the JSON allowlist** (`blog.list` / `blog.detail`), and
  **`build` is now JSON-supported** (`build.help` / `build.kit`). `research/02` says the opposite for
  both, true at 0.1.7.

### Slice 2 — Foundation II, landed 2026-08-08

`fs/paths`, `fs/path-safety`, `fs/module-loader`, `env/semver`, `text/string-utils`, plus the three
suites slice 1 shipped source for but no coverage of (`env/node-version`, `env/package-manager`,
`text/levenshtein`). **163 tests, up from 35**; `check` / `lint` / `test` all exit 0; the tarball is
25 files and still contains no `.test.mjs`.

Near-verbatim, as forecast — the identity strings change (`@astryxdesign/core` →
`@astryx-svelte/core`, `astryx` → `astryx-svelte`) and prettier reflows. The four places it is
_not_:

- **`jiti` is now a declared dependency**, one slice earlier than scheduled above.
  `module-loader`'s `.ts` branch is what needs it, and that branch lands here rather than with its
  callers. Not deferrable: a SvelteKit project is TypeScript by default, so `astryx-svelte.config.ts`
  is the _likely_ spelling rather than the exotic one, and Node's default 22.x type stripping does
  not cover an imported `.ts`.
- **`isFilePathArg` gained `.svelte`** — the extension the adapted `template` writes (`+page.svelte`
  where upstream writes `page.tsx`). Upstream's `.tsx`/`.jsx` entries are kept rather than pruned:
  the set only decides _file or directory_, so dropping them would not reject `./foo.tsx`, it would
  silently create a **directory** named `foo.tsx` — the exact bug the helper exists to close. Folded
  into the existing case, so the ported count still matches.
- **`listComponents` reads `<core>/src/lib/components`**, not `<core>/src`. Upstream's deny-list
  (`hooks`, `theme`, `utils`) has nothing left to deny — here those three are siblings of
  `components`, not of the components. The ported case keeps its upstream name and still asserts
  none of the three appear.
- **`searchComponents`' Pass 2 finds nothing, and cannot yet.** Its doc lookup is retargeted to our
  layout and upstream's legacy `XDS<Name>.doc.mjs` fallback dropped — but **this port's core ships
  no `.doc.mjs` at all**; the docs site reads upstream's out of `@astryxdesign/core`. Scoring is
  therefore entirely Pass 1 today. Ported now so slice 5 inherits the scoring contract instead of
  re-deriving it.

**`findProjectRoot` is inherited dead — and dead in a way that matters later.** It has **zero
callers** upstream, and it detects a monorepo by looking for `workspaces` in a root `package.json`,
which upstream's own root does not have (it is pnpm-only, `packageManager: pnpm@11.10.0`) — so the
helper returns `null` in the very repo it was written for. It works here only because this root
mirrors its `pnpm-workspace.yaml` into a `workspaces` field. Ported verbatim rather than fixed,
since nothing calls it, but **no later slice should build on it**: in an ordinary pnpm consumer
project it returns `null`, and `findCoreDir`'s `node_modules` branch is the reliable one.

**A footgun worth naming, because it will recur.** The file comment documenting
`formatCliCommand`'s regex divergence quoted upstream's pattern verbatim inside a `/** … */` block.
That pattern ends `\s*/`, which _closes the block comment_ — and the resulting syntax error is
reported at the end of the file, 220 lines from its cause. Any later slice documenting a regex has
the same trap.

**Two decisions were deliberately left open here**, because slice 4 is what had the information to
make them. **Both are now resolved** — recorded in place below rather than moved, so the reasoning
sits with the code that raised it:

- **PascalCase name ↔ kebab-case directory — RESOLVED 2026-08-08, and the answer is "there is no
  mapping".** Upstream's component directories _are_ the component names (`src/Button`); ours are
  `src/lib/components/button` while the name a user types is `Button`. The tempting fix is a
  mechanical transform, and it was measured before being adopted rather than after:
  - kebab → Pascal → kebab **round-trips for all 97 directories**, so the transform itself is sound;
  - but **98 of 191 exported components have no directory of their own** — `AvatarStatusDot` lives
    in `avatar/`, `ChatComposer` in `chat/`, `BreadcrumbItem` in `breadcrumbs/`. Name → directory
    is not a function.
  - Falling back to the *filename* (`chat-composer.svelte` → `ChatComposer`) covers 176 of 191 and
    then fails three different ways at once: **aliased re-exports** (`BreadcrumbMenuItem` and 9
    siblings are `dropdown-menu-item.svelte` published under another name), **casing** (`hstack.svelte`
    pascalises to `Hstack`, not `HStack`), and **location** (`Theme`/`MediaTheme`/`SyntaxTheme` live
    under `src/lib/theme/`, not `components/` at all).

  So **the barrel is the index and the filesystem is not a naming convention.** `foundation/discovery/`
  must read the export surface and follow each re-export to its source, not derive a path from a
  name. This is not a new mechanism to invent: `docs/scripts/lib/export-surface.mjs` already does
  exactly this, parsing the generated `.d.ts` with the TypeScript compiler, and its header records
  the same lesson learned the same way — "guessing from the source barrel with a regex would miss
  multi-line and re-export forms". Slice 4 models on it.

  Consequences for what slice 2 left provisional: `listComponents` returning directory names stays
  correct for `swizzle` (slice 7), which copies a directory, but it is **not** the component list —
  slice 4 adds the barrel-derived one alongside it rather than changing it. `searchComponents`
  joining the given name as a path segment is wrong for the 98 and must resolve through the index.
- **Where the CLI's component prose comes from — RESOLVED 2026-08-08: generate it.** Pass 2 above
  is the first place the port wants `.doc.mjs` from core and finds none, and the gap is total —
  **core ships 0 where upstream ships 208**. Of the three options (hand-author beside the
  components, generate, or read the docs site's registries), generation is the only one that does
  not either invent prose or make the CLI depend on the docs app. **The docs pipeline already holds
  both halves**: it reads upstream's prose from `@astryxdesign/core`'s `.doc.mjs` and reconciles it
  against this port's own compiler-derived types out of `packages/core/dist/**/*.d.ts`. That
  reconciled record — upstream's words, our types — _is_ the doc file, so emitting it is
  serialisation rather than authorship.

  Layout follows from the barrel decision above rather than being a second choice: one file per
  documented entry, **named for the export** and placed in the directory of that export's source
  module — `components/button/Button.doc.mjs`, `components/dropdown-menu/DropdownMenuItem.doc.mjs`,
  `hooks/useMediaQuery.doc.mjs`. Measured: **all 209 documented entries resolve to a source module
  through the barrel, none unresolved**, and naming by export is collision-free where naming by
  source basename is not (`dropdown-menu-item.svelte` backs both `ContextMenuItem` and
  `DropdownMenuItem`; `i18n/index.js` backs both `InternationalizationProvider` and `useTranslator`).
  This is upstream's own file convention (`src/Text/Heading.doc.mjs`), kept even though our
  `.svelte` files are kebab-case.

  **No name→source index file is emitted**, and the earlier note that one would be needed to keep
  `typescript` out of the CLI's runtime dependencies was wrong: upstream's `resolveImportPath` and
  `findComponentSource` walk the tree and read `package.json#exports`, needing no compiler. The
  co-located docs are the index, exactly as upstream's are.

The `astryx` package.json field `discoverExternalPackages` scans for **keeps upstream's spelling**.
It is a convention third-party packages author against, and renaming it forks that contract for no
gain. The cost — a React Astryx add-on being discovered and its React source read as Svelte — is
theoretical today: neither `@astryxdesign/core` nor `@astryxdesign/cli` declares the field, and both
are installed in this repo.

### Slice 3 — Authoring + config, landed 2026-08-08

`authoring/**` (parsers, doctypes, the sealed zod schemas), `foundation/config/`
(`config-cache`, `Project`) and `foundation/integrations/`. **254 tests passing + 13 `it.todo`
across 20 files**, up from 163; `check` / `lint` / `test` all exit 0; the tarball is **64 files**,
32 of them `authoring/`, with no `.test.mjs` and no `scripts/`. Six subpath exports added
(`./authoring`, `./config`, `./integration`, `./doc`, `./template`, `./codemod`), every target
verified to resolve on disk.

**Case parity is exact on all 19 suites** — every one matches upstream's `it(` count, with the 13
deferrals carried as `it.todo` naming the slice that unblocks them (6 doctypes `loadComponentDoc`
→ slice 4; 6 `Project` discovery/issues → slices 4/6/9; 1 integrations `discover()` → slice 5). The
single over-count, `error-codes.test.mjs` at 15 vs 11, is slice 1's deliberate declaration-parity
layer, which has no upstream analogue and is documented in that file's header.

Three decisions are worth reading before the file list, because each one reverses or defers
something.

**`Project` could not land the way the slice was scoped, and the fix shaped the whole slice.**
TODO called it "the single read API"; it is also the most forward-coupled file in the CLI, with
five outbound edges into code no slice has written — component discovery (4), template discovery
(6), the codemod registry and integration codemod discovery (9 / deferred assets), and
`validate-integration` (7). Deferring `Project` was not an option, because **every later slice is
blocked on it**. So the class lands **whole** — every getter, `#memo`, `#pushIssue`,
`#collectIssues`, `issuesUrl()`, `issues()`, and the skip-and-warn scaffolding _inside_ all three
discovery methods — with only the discovery calls themselves deferred, each marked at its own call
site with the slice that owns it. A later slice adds a line; it does not reshape a method.

Two things fell out of that. `api/integration/validate-integration.mjs` lands as a **deliberate
fragment**: one of its five exports and one of its three contribution checks. That is not
arbitrary — `checkRoots` is the only check with no forward dependency, and it is also the one that
matters most day to day, because a deleted contribution directory is how an integration usually
breaks after install. It was enough to land **all six** `integration-warnings` cases, which the
slice plan predicted and which held. And `Project.codemods()`' core half returns `[]`, which is
**not a stub**: upstream reads an 18-entry version registry, this port has released no versions, so
there is no transform between any two of them and the empty result is the correct answer.

**Config and manifest basenames are renamed** to `astryx-svelte.config.{ts,mjs,js}` and
`astryx-svelte.integration.{ts,mjs,js}`. This **reverses the call made for the `astryx`
package.json field** that `discoverExternalPackages` reads, and the reasoning is the same one
pointed the other way: that field was kept because it is a third-party authoring contract whose
payload — a docs directory, a category string — is framework-neutral, so the cost of a collision
was theoretical. A manifest's payload is not neutral; it points at component sources this CLI will
read as Svelte. Sharing upstream's basename would let a React Astryx integration installed
alongside this port be loaded and its `.tsx` read as `.svelte`. Same principle, opposite
conclusion, because what the file contains differs. No `.svelte.ts` basename was added — a config
is not a runes module and jiti loads plain `.ts`.

- [ ] **The published docs now contradict the shipped CLI on this.** The docs site already
      publishes a live `cli-integrations` page whose prose — reused verbatim from upstream's
      `.doc.mjs` — says `astryx.config.{ts,mjs,js}` and `astryx.integration.{ts,mjs,js}`. It needs a
      doc overlay for that page. Agreed as rename-plus-overlay; the overlay is not written yet

**`DEFAULT_ISSUES_URL` is read from this package's own `package.json#bugs`, not hard-coded.**
Upstream's literal is `https://github.com/facebook/astryx/issues/new`, which must not be inherited —
it would route a *port* bug to Meta's tracker. It was not replaced with a guess either: this
repository declares no `repository`, `bugs` or `homepage` and has no git remote, so **there is no
correct URL to write down yet**. Reading the field means the answer appears the moment the package
declares one, and until then `issuesUrl()` returns `undefined` rather than a plausible-looking
address that goes nowhere.

- [ ] **Set `packages/cli/package.json#bugs` before the release.** Until it is set, `issuesUrl()`
      returns `undefined` for every core-owned reference. The ported test asserts against the
      exported constant rather than a literal, so it passes either way — which means nothing will
      fail to remind you

**Inherited, not introduced: `foundation/` imports from `api/`.** Both `project.mjs` and
`integration-warnings.mjs` reach up into `api/integration/validate-integration.mjs`. Slice 1 was
careful to avoid exactly this shape for `manifest` (an `api → cli` cycle it called out by issue
number); upstream did not avoid the mirror image here. Replicated for parity and recorded under
Known debts, because unwinding it would move a published module's path.

**The `.tsx` → `.svelte` adaptation surface turned out to be far smaller than the brief assumed**,
and the negative finding is the useful one: across all 47 slice-3 files there are **zero** Next.js
hits (no `app/`, `pages/`, `page.tsx`, `next.config`), **zero** StyleX or CSS-file hits, and only
**six** literal `.tsx` occurrences. The `app/` → `src/routes` and `page.tsx` → `+page.svelte`
mappings the plan budgeted for do not arise until slices 6 and 7.

**The drift-locks were dead on arrival, and the reason is worth internalising.** Three parsers
carry a compile-time `Expect<Equal<…>>` asserting the sealed zod schema still infers exactly the
public type. Adding `authoring/**` to the tsconfig `include` — which this slice did, precisely so
they would fire — was necessary and **not sufficient**: the first mutation test came back _clean_.
TypeScript groups extensions as `[.mts, .d.mts, .mjs]` and, for a **wildcard-matched** path, keeps
only the highest-priority extension sharing a basename. So `authoring/config/parse.d.mts` **evicts
`authoring/config/parse.mjs` from the program entirely** — `--listFiles` showed the three
declaration files and not one parser. Every lock, and every `@param`/`@returns` in those files, was
a dead comment. Upstream never hits it because its
`tsconfig.authoring-contract.json` includes `authoring/**/*.mjs` + `authoring/**/*.ts`, and `*.ts`
does not match `.d.mts`.

The fix is one entry — `**/*.d.mts` in `exclude` — chosen over upstream's include-shape because it
also covers `authoring/doctypes/*/parse.d.mts` (which had the same hazard, live, in the same slice)
and any future `api/**/*.d.mts` without a second edit. The `.d.mts` files cannot simply be deleted:
`authoring/index.d.ts` re-exports value bindings from `./*.mjs` and a downstream build without
`allowJs` needs them to resolve. **Verified by mutation, not by reading**: all 8 parsers now enter
the program, and changing `integrations: z.array(z.string())` to `z.array(z.number())` fails with
`TS2344: Type 'false' does not satisfy the constraint 'true'` at the assertion plus an independent
`TS2322` at the `return result.data` line; reverting is clean. The general lesson is the one this
port keeps relearning — **a lock you have not watched fail is not a lock** — with a sharper edge
this time, because the thing that disarmed it was a file-resolution rule, not a mistake anyone made.

**A third instance of the stale-rename class.** Alongside the known `xds-*`/`astryx-*` and
`Astryx*.tsx`/`XDS*.tsx` pairs, `component/type.ts` twice says a name is the "full export name
**including** the Astryx prefix" and gives `"TableRow"` → `"Astryx Table Row"` as a `displayName`
example. All three are false against upstream's own files (`Button.tsx`, `TableRow.tsx`, and a real
`displayName: 'Table Row'`). Corrected rather than replicated, on the same reasoning as the other
two: it is rename residue, not a documented API.

**Two test divergences, both named in their files.** `project.test.mjs`'s `issues() dedupes` and
`issues() validates unvisited` are **refixtured** from `brokenComponent` (which needs slice 4's
`checkComponents`) onto a **missing contribution root**, which `checkRoots` already reports. The
property under test is unchanged; only the issue that populates the set differs. Left as-is they
would have been _vacuous_ — a stubbed `components()` returns `[]`, so every "is absent" assertion
passes for the wrong reason. And `integrations.test.mjs`'s `resolvePackageDir` case compares
against `path.resolve` where upstream compares against `path.join`: the two agree on POSIX, so
upstream's form passes in CI and fails **only on a Windows dev machine** — a false negative about
correct code.

**Left open by this slice:**

- [ ] **`authoring/index.d.ts` under-publishes.** Upstream's barrel omits six types reachable from
      ones it does export. Two were added because omitting them makes the published surface
      unusable — `PostCodemodCommand` (the return of `PostCodemodHook.buildCommand`) and
      `XleComponent`. The remaining four — `SubComponentDoc`, `ComponentRef`, `ComponentBaseDoc`
      and the three `*TemplateDoc` bases — are recorded rather than fixed, for an
      `astryx-surface` sweep to decide as one question
- [ ] **`codemod/type.ts` ports lines 1–77 only.** Six types are deferred to slice 9, not three:
      `CodemodTransform`, `CodemodTransformApi` and `JscodeshiftFactory` are jscodeshift-bound, and
      `CodemodEntry`, `CodemodRunResult` and `CliLog` are runner infrastructure that slice 9 will
      redeclare against the `magic-string` + `svelte/compiler` surface. `AstryxCodemodApi.jscodeshift`
      survives as `unknown` for parity, with a note that it is the wrong tool here and nothing
      populates it
- [ ] **`ComponentSlotElement` is ported verbatim and unresolved.** It serialises React's
      `createElement`; Svelte 5 has no synchronous element factory. Its only consumer is the docs
      playground, so the decision belongs with that work, not with the CLI. No mechanism was
      invented — the type carries a `TODO(playground)` naming the ambiguity, and its one referrer
      was reworded to stop asserting `createElement`
- [ ] **A zod-major bump would silently break one doctypes case.** "Rejects an empty name with a
      readable message" passes only because zod 4 collapses a union failure to the shared branch
      issue, surfacing `name is required` rather than a bare `Invalid input`. Upstream pins the same
      `^4.4.3`, so this is parity rather than luck — but it is behaviour no assertion pins down

### `validate-integration` — the port's second real command, landed 2026-08-08

Taken out of slice 7 and landed early, because it turned out to need nothing slice 7 owns: its
whole dependency set — `path-safety`, `module-loader`, `findManifestPaths` / `loadManifestObject` /
`resolvePackageDir`, `jsonOut`, the formatters — was already on the ground after slices 1–3.
**267 tests + 17 todo across 22 files.**

- `api/integration/validate-integration.mjs` completed from the slice-3 fragment: `validateAtPackageDir`,
  `validateLocalIntegration`, `validateInstalledIntegration`, `validateIntegration`,
  `summarizeIssues`, plus `validate-integration.type.mjs`. **The manifest half is now complete** —
  presence, uniqueness, schema, roots-inside-package, roots-exist — which is every way an
  integration can be wrong _about itself_. The three contribution checks stay deferred to slices
  4 / 6 / 9, named at their call sites.
- `clients/cli/commands/validate-integration.mjs` registered, with **registry entry + `JSON_SUPPORTED`
  name + `RESPONSE_TYPES` row + `EXAMPLES` added together**, which is what slice 1's bidirectional
  drift guard requires. `manifest --json` now advertises the command, its `integration.validate`
  response type and its examples, so the agent-facing contract is real rather than declared.
- Verified by driving the binary, not only the suites: no-manifest prints guidance at **exit 0**; a
  missing root emits `missing_root` at **exit 1**; and `validate-integration ../evil --json`
  degrades the path-safety throw into an `invalid_package_spec` diagnostic instead of a raw stack.
  That last one is the reason the guard exists and the only way to see it work.

**Case parity 17/17 across the two suites, with 4 deferred.** One of those four is worth naming:
"reports no errors for a valid component" **would pass today** — asserting zero `invalid_component`
issues is trivially true when nothing can emit one. It passes for the wrong reason, which is worse
than not running, because it would report a check as working that does not exist. Same call as the
two refixtured `project.test.mjs` cases.

- [x] **The no-manifest hint stays a fixed string — decided 2026-08-08, and the parity rule
      decides it.** The question was whether `formatCliCommand` should replace fixed command hints
      everywhere, since it would make them install-aware (`pnpm exec astryx-svelte …` vs
      `npx @astryx-svelte/cli …`). Measured instead of assumed: **upstream calls `formatCliCommand`
      at exactly 5 non-test sites** (`api/upgrade/status`, `api/upgrade/_adapter` ×3,
      `clients/cli/commands/build`, `clients/cli/commands/search`) and hard-codes the bare bin
      everywhere else — including this exact string (`clients/cli/commands/validate-integration.mjs:53`).
      Upstream's selectivity is the specification, so there is no repo-wide sweep to schedule and no
      decision left for slice 4 to make: **mirror upstream site by site**, renaming the bin and
      nothing else. A sweep would have made ~14 command hints diverge from upstream to no benefit

### Core ships 209 `.doc.mjs` — the slice 4/5 blocker, cleared 2026-08-08

Core shipped **0** doc files against upstream's **207**, and every doc-driven command reads them, so
slices 4 and 5 could not start. `docs/scripts/emit-core-docs.mjs` now emits them —
`pnpm -F docs emit-core-docs`, with `--check` wired as docs' `test` script.

It is **serialisation, not authorship**. `generate-content.mjs` already reconciles upstream's prose
against this port's compiler-derived types out of `packages/core/dist/**/*.d.ts`; the emitter
imports its `reconcile()` and reshapes the result. Nothing re-derives the reconciliation, which is
the one thing that must not happen twice.

- [x] **209 files, one per documented entry, named for the export and placed beside its source
      module** — `components/button/Button.doc.mjs`, `components/dropdown-menu/DropdownMenuItem.doc.mjs`,
      `hooks/useMediaQuery.doc.mjs`. Upstream's own file convention, kept even though our `.svelte`
      files are kebab-case, because it makes name → file a trivial function. **183 stamped
      `type: 'component'`, 26 `type: 'function'`** — the same split as the registry's 183
      Properties tabs and 26 hook pages, arrived at independently
- [x] **All 209 round-trip through the CLI's own `parseDoc`**, checked inside the emitter before a
      file is written and re-checked from outside afterwards: 209/209, no duplicate names, and
      every filename equal to its `name` field. That last one is the whole lookup contract. A doc
      the CLI cannot load is worthless, and this is the check that asks the real question rather
      than a proxy for it
- [x] **They ship.** `svelte-package` carries `.mjs` through untouched, so the tarball has **418** —
      209 under `src/` and 209 under `dist/` — and `assert-core-ships-src.mjs` still passes
- [x] **No dependency cycle was created to win a type annotation.** Upstream's docs annotate
      themselves `/** @type {import('@astryxdesign/cli/authoring').ComponentDoc} */`, which here
      would make `packages/core` devDepend on `@astryx-svelte/cli` while the CLI's own tests read
      core. The files are emitted unannotated; correctness is enforced by running `parseDoc` at emit
      time instead, which is a stronger check than an annotation anyway
- [x] **Four fields survive normalisation solely because the emitter reads them** —
      `subComponentOf`, `hiddenComponents`, `relatedComponents`, `relatedHooks`. The props-page
      audit had dropped all four because the site renders none of them, and that reasoning still
      holds for the site: `projectForSite` strips them, so `component-registry.js` is byte-identical.
      **26 docs carry the related lists, matching upstream's 26 exactly**
- [ ] **Ten entries are emitted without their `examples`, and upstream has them** —
      `AvatarGroupOverflow`, `CheckboxListItem`, `DialogHeader`, `Field`,
      `InternationalizationProvider`, `Markdown`, `Outline`, `useTableRowExpansion`,
      `useTableSelection`, `useTableTreeData`. `ComponentBaseDoc.examples` is a real field and
      upstream's CLI renders it after the props table, so this is a **gap, not a tidy-up**. It is
      dropped because upstream's `code` is JSX — a React function component,
      `<Field status={{type: 'success'}}>`, `defaultValue` — where this port's own
      `ComponentExampleDoc.code` is documented as "Svelte source for the example". Emitting it
      verbatim would ship React as this CLI's answer to "show me an example", the `Button.icon`
      mistake CLAUDE.md names: upstream's prose is reusable, upstream's _code_ is not. Ten
      hand-translated Svelte examples is the fix. **The deferral cannot rot** —
      `UPSTREAM_EXAMPLES_NOT_PORTED` is exact on the class oracle's `skip` rule and the run fails if
      an entry starts or stops carrying examples; **both directions mutation-checked**

**The silence was the defect, not the drop.** The first cut of the emitter dropped `examples` with
no note anywhere — no constant, no comment, no count — which is indistinguishable from not having
noticed. Refusing upstream's JSX is right; refusing it invisibly is how a gap becomes folklore.

### Phase 4 is complete — every slice landed 2026-08-09

**14 commands** — `build`, `component`, `discover`, `docs`, `doctor`, `init`, `layout`, `search`,
`swizzle`, `template` (+`add`), `theme`, `util` (+`hook`), `upgrade`, `validate-integration` — plus
`manifest`. That is upstream's whole surface bar `blog`, which stays deferred.

**1,932 tests + 27 `it.todo` across 103 files**, from 267 + 17 across 22 at the start of the day.
`pnpm -r build`, `check`, `lint` all exit 0; the tarball is 218 files with **0** `*.test.*`.

Case parity is exact on every ported suite. The four suites written *beyond* upstream each declare
why at the top and are mutation-checked, per the bar `src/tests/layer-attribute-repair` set:
`swizzle.svelte-adaptations`, `skeleton-svelte-ast`, `resolve-theme-loading` and
`runner-corruption-guards`.

**Three things could not be transcribed and were written instead**, each because the React
mechanism has no Svelte counterpart rather than as a preference:

- **`upgrade`'s codemod runner.** jscodeshift fuses editing (`toSource()`) with parsing (`j(result)`,
  the corruption guard) and cannot read `.svelte` at all. The two jobs split: `magic-string` splices
  the original buffer, `svelte/compiler`'s `parse` re-reads it. `magic-string` is the one dependency
  the whole phase added; `jscodeshift` never will be
- **`template --skeleton`.** Upstream's line scanner anchors on `export default function` … `return (`,
  neither of which exists in a `.svelte` file, so it would have emitted nothing at all
- **`swizzle`'s import rewriting.** Upstream's textual `../<dir>/<x>` → `<pkg>/<dir>` collapse rests
  on 123 per-component subpaths; this port publishes 10, so each specifier is resolved and
  classified against the owner's real `exports`

**What the slices found that no review would have.** Each was caught by writing the tests, which is
the argument for the case-for-case contract:

- **`.gitignore`'s bare `build` was silently excluding two whole slices** — `git check-ignore`
  confirmed `api/build/**` and `api/theme/build/**`, both upstream's own paths, were unstageable.
  The loss would have looked like nothing
- **`assets` was missing from `package.json#files`** — all 27 doc assets and 17 template assets sat
  outside the tarball, so a published `astryx-svelte docs` would have listed nothing
- **`doctor`'s peer-dependency check could not be tested at all.** Vite's resolver ignores
  `createRequire`'s `paths`, so three hermetic fixtures were reading the monorepo's own
  `node_modules` and passing for the wrong reason
- **Core's root barrel documents itself in prose**, and unanchored `export * from` regexes read the
  comments as code, indexing three directories a second time under the root specifier
- **Core emitted no prose reset for a theme with no type scale** — a one-token theme lost its
  `@layer reset` entirely. All 8 shipped themes declare `typography`, so the branch never fired and
  the oracles, which diff declarations rather than their absence, could not see it
- **`api/index.mjs` was under-exported by three separate slices**, because **nothing guards that
  barrel** — upstream has no test for it either

### What is left, and none of it is a slice

- [ ] **146 upstream codemod assets stay deferred, and should stay deferred permanently in their
      present form.** Every one is a jscodeshift transform over `.tsx` migrating *React* source
      between React Astryx versions. The first real registry entry belongs to this port's second
      release, written against the `magic-string` + `svelte/compiler` api
- [ ] **1,329 template assets and 43 page templates stay deferred.** `template --list` therefore
      shows nothing from core, and `init --features template` returns `skipped`. Everything around
      it is live and tested — integration-contributed templates and external-package blocks are
      discovered, listed, shown, skeletonised and scaffolded — which is also what makes
      `component --showcase`, `search --type template` and `layout`'s `{hint}` catalog work now
- [ ] **`blog` (7/5) is not ported.** It needs content this port does not have
- [ ] **`components.lock.json` with per-file content hashes** — still not started
- [ ] **The 27 remaining `it.todo`s do not name a slice any more.** Nine wait on this port cutting a
      **second release** (a codemod migrates *between* two versions, and there is one); the rest
      wait on the deferred assets. Both are content, not code

### The original slice sizing

Kept for the record. Sized as `source files (tests)` at v0.3.0, ordered so each unblocked the next.

| #   | Slice                                                                              | Files   | Notes                                                                                              |
| --- | ---------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| ~~2~~ | ~~**Foundation II** — `fs/` (paths, path-safety, module-loader), `env/semver`, `text/`~~ | 5 (8) | **Landed 2026-08-08** — see above. Sized 7 here; 5 sources, since slice 1 had already taken two |
| ~~3~~ | ~~**Authoring + config** — `authoring/`, `foundation/config/`, `foundation/integrations/`~~ | 37 (10) | **Landed 2026-08-08** — see above. Sizing held exactly; `Project` landed whole with only its three discovery bodies deferred |
| ~~4~~ | ~~**`component` + `util` (+`hook` alias)** — incl. `foundation/discovery/`~~ | 18 (14) | **Landed** — 16 suites, 179 cases, exact parity |
| ~~5~~ | ~~**`docs` + `search` + `discover`**~~ | 16 (11) | **Landed** — 94 cases, and all 27 doc assets rewritten, none deferred |
| ~~6~~ | ~~**`template` (+`add` alias) + `theme list\|add`**~~ | 13 (8) | **Landed** — split: 6a template (41 cases + 4 beyond), 6b themes with 8 |
| ~~7~~ | ~~**`swizzle` + `init` + `doctor`**~~ | 17 (13) | **Landed** — 177 cases + 4 beyond. `validate-integration` had landed early |
| ~~8~~ | ~~**`theme build` + `build` playbook**~~ | 12 (11) | **Landed** with 6b — `build` is a composition assistant, not a compiler |
| ~~9~~ | ~~**`upgrade` shell**~~ | 7 (6) | **Landed** — the runner is written, not ported. `magic-string` declared |
| ~~10~~ | ~~**`layout` / XLE**~~ | 17 (5) | **Landed** — 72 cases; the oracle is `svelte/compiler`, stronger than upstream's |
| —   | _deferred_                                                                          | —       | `blog` (7/5); 1,329 template assets; 146 codemod assets — transcription rather than porting          |

One dependency note left for scheduling: slice 9 needs **`magic-string`** declared (jscodeshift is
explicitly not being ported — it cannot parse `.svelte`). **`jiti` is declared as of slice 2** —
`module-loader`'s `.ts` branch forced it a slice or two earlier than this line anticipated. Upstream
declares both `jiti` and `jscodeshift`; we now declare the first and never will the second.

**Slices 6 and 8 have a blocker of their own, found 2026-08-08 while sizing them: plain Node cannot
load this port's theme packages at all.** Upstream's `clients/cli/lib/resolve-theme.mjs` loads a
theme with `createRequire()` and reads `variants` / `fonts` off it; `theme list|add` (slice 6) and
`theme build` (slice 8) all rest on that. Ported verbatim it would return `null` for **every theme
this port ships**, and silently — `tryLoadModule`'s bare `catch` turns a resolution failure into
"no theme configured". Both loaders fail, for two unrelated reasons, and each was reproduced rather
than reasoned about:

- **`require()` → `ERR_PACKAGE_PATH_NOT_EXPORTED`.** Every theme's `exports["."]` declares `types`,
  `svelte` and `import` and **no `require` condition**, so resolution fails before Node 24's
  require(esm) support is even reached. This is the failure upstream's `catch` swallows.
- **`await import()` → `ERR_UNKNOWN_FILE_EXTENSION`.** The built entry's first statement is
  `import { neutralIconRegistry } from './icons.svelte'`, so the token object is only reachable
  through a module plain Node cannot parse. **All 8 themes** do this (`butter`, `chocolate`,
  `gothic`, `liquid-glass`, `matcha`, `neutral`, `stone`, `y2k`) — it is the icon-registry design,
  not one theme's accident. Upstream's themes are plain token objects and have no analogue.

So the CLI needs a path to a theme's tokens that does not drag in a Svelte component: a `./tokens`
subpath that stops short of the icon registry, reading the built `dist/theme.css`, or a jiti loader
with a `.svelte` stub. **Decide it at the top of slice 6, not inside it** — `resolveTheme`'s
signature going async ripples through every caller in both slices.

### Still open from the original checklist

- [ ] Commands identical to upstream: `docs`, `search`, `discover`, `doctor`, `theme *`, `validate-integration`
- [ ] Adapted: `component` (props + snippets), `template` (`page.tsx` → `+page.svelte`), `swizzle`, `init`
- [ ] Rename `hook` → `util` with `.alias('hook')`; add `.alias('add')` to `template`
- [ ] `upgrade` with the full contract (dry-run default, corruption guards) but a `magic-string` + `svelte/compiler` runner (jscodeshift can't parse `.svelte`)
- [x] **CI assertion on `package.json#files`** — **landed 2026-08-08** as
      `packages/cli/scripts/assert-core-ships-src.mjs`, wired as the CLI's `test:core-src` and
      chained into its `test` script the way core chains `test:parity`. It asserts against what
      `npm pack --dry-run` would really publish, not against the `files` array read literally —
      the array is the input to the question, not the answer. Four checks: every non-test file
      under core's `src/lib` is in the tarball (**691 of 691**), the barrel and `base-props` are
      there, `dist/index.{js,d.ts}` are there, and no `*.test.*` leaked. **Mutation-checked**:
      setting core's `files` to `["dist"]` fails it with all 691 named, and it passes again on
      revert. Two implementation notes worth keeping — it must **not** be phrased as "every
      component dir ships `<name>.svelte`" (`chat/`, `nav-menu/`, `resizable/` are families with no
      same-named root and `nav-item/` has no component at all, so that phrasing fails on four dirs
      today), and on Windows `npm` is a `.cmd` shim that Node refuses to spawn without a shell
      since the CVE-2024-27980 fix — POSIX takes `execFileSync` with an args array, Windows a
      static command string
- [ ] **Core ships its demo routes to consumers.** The assertion above surfaced it: core's tarball
      is 2,356 files, of which `src/lib` is 691 — the other ~286 `src/` entries are `src/routes`,
      the SvelteKit demo app, plus the app shell files around it. Upstream ships `src` wholesale
      too, but upstream's `src` has no demo app in it (their stories live elsewhere), so this is a
      port artifact rather than parity. A `"!src/routes"` negation is the whole fix. Left alone
      here because it changes published content and this slice was not the moment; it should ride
      with the release checklist rather than a CLI slice
- [ ] `components.lock.json` with per-file content hashes
- [ ] Drop `"private": true` from `packages/cli/package.json` — **only** when the CLI is genuinely usable

---


## Oracle bookkeeping

Not applicable in the class/theme-oracle sense — the CLI carries no `.stylex.ts`. Its own bookkeeping
is test-count parity, recorded inline above (35 → 163 → 254 → 267 → 1,932 tests, `it.todo` counts
tracked alongside).

## What the audits caught

## Retired debts

### Retired — Empty package

- [ ] `packages/cli` — package.json only, no `bin/` or `src/`; `test` is an honest no-op
  - Retired by: `packages/cli` now has `bin/`, `api/`, `authoring/`, `foundation/`, `assets/`,
    `clients/` and a real `test` script (`test:unit -- --run && test:core-src && test:themes-bundle`)
    — not empty, and not a no-op.

## Rules promoted

Not promoted at the time.

## Debts opened

-
