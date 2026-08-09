# The shadcn-svelte Playbook

**How shadcn/ui was ported to Svelte, and exactly how to reuse that playbook for `astryx-svelte`.**

Researched July 2026 against `github.com/huntabyte/shadcn-svelte` (CLI v1.4.2), `shadcn-svelte.com`,
`github.com/shadcn-ui/ui`, and `ui.shadcn.com`. Live registry endpoints were fetched and inspected
directly, so the payload shapes below are observed, not inferred.

---

## 0. The one-paragraph summary

shadcn-svelte is not a component library and it does not vendor shadcn/ui's code. It is **a CLI plus a
static JSON registry**. The registry is a set of flat `*.json` files served off the docs site; each
file contains the *source text* of one component with import aliases left as `$PLACEHOLDER$` tokens.
The CLI resolves a dependency graph over those JSON files, string-replaces the placeholders with the
consumer's own path aliases from `components.json`, writes the files into the consumer's repo, and
installs the pinned npm dependencies. Nothing else is shared with upstream except discipline: a hard
policy that nothing ships in the port that does not exist upstream first.

**The port's real cost was not the port.** It was the primitive layer beneath it — Radix has no Svelte
equivalent, so the maintainer had to build and maintain one (Bits UI, Formsnap, Paneforge, Vaul
Svelte). Astryx inverts this: it has **no external primitive dependency at all**, which removes the
lockstep-versioning risk but moves 100% of the behavior work in-house. See §5.

---

## 1. Repository and package structure

### 1.1 shadcn/ui (upstream, React)

```
shadcn-ui/ui/
├─ apps/
│  └─ v4/                  # Next.js docs site + the registry SOURCE of truth
│     └─ registry/         # bases/{base,radix,aria}/… the actual component .tsx
├─ packages/
│  ├─ shadcn/              # npm: `shadcn` — the CLI
│  ├─ react/               # npm: shared React helpers
│  ├─ helpers/             # internal helpers
│  └─ tests/               # CLI integration tests
├─ templates/              # framework starters
├─ skills/                 # agent skills
├─ scripts/
├─ turbo.json              # Turborepo
└─ pnpm-workspace.yaml
```
Tooling: pnpm workspaces + Turborepo. Licence: MIT.

### 1.2 shadcn-svelte (the port)

```
huntabyte/shadcn-svelte/
├─ docs/                   # SvelteKit docs site — ALSO the registry host
│  ├─ content/             # markdown source of every docs page
│  ├─ src/                 # site + component demos + registry source components
│  ├─ static/              # built registry JSON lands here
│  └─ scripts/
│     ├─ build-registry.ts       # emits the registry JSON
│     ├─ capture-registry.ts     # component screenshots
│     ├─ build-llms.ts           # llms.txt generation
│     └─ pull-styles.ts
├─ packages/
│  ├─ cli/                 # npm: `shadcn-svelte` — the ONLY published artifact
│  └─ registry/            # DEPRECATED → superseded by `shadcn-svelte/schema`
├─ registry-template/      # degit-able starter for third-party registries
├─ skills/shadcn-svelte/   # agent skill
├─ repro/                  # bug-repro sandbox
├─ .changeset/             # Changesets — versioning & release
├─ LICENSE.md              # MIT, three copyright holders (incl. shadcn)
├─ CONTRIBUTING.md
└─ pnpm-workspace.yaml     # packages/*, docs, registry-template + a `catalog:`
```

Root `package.json` is `@shadcn-svelte/monorepo`, `private: true`. Release is
`changeset publish`. Node ≥ 20, pnpm ≥ 9, `only-allow pnpm` preinstall guard.
`pnpm-workspace.yaml` uses a **catalog** to pin `svelte`, `@sveltejs/kit`, `vite`, `typescript`,
`zod`, `tsdown` across every workspace package — one place to bump the toolchain.

### 1.3 The mapping

| shadcn/ui | shadcn-svelte | Notes |
|---|---|---|
| `apps/v4` (Next.js) | `docs` (SvelteKit) | Docs app doubles as registry host in **both** |
| `packages/shadcn` | `packages/cli` | npm name changes; role identical |
| `packages/react` | — | No runtime package. Deliberate. |
| `templates/` | `registry-template/` | Svelte version scoped to registry authoring |
| `skills/` | `skills/shadcn-svelte/` | mirrored |
| Turborepo | plain pnpm `-r` scripts | simplification |

**Key structural fact: there is no `packages/ui`.** Not one Svelte component ships to npm. The only
npm artifact is the CLI. Everything else is source text served as JSON.

### 1.4 What `astryx-svelte` should be

```
astryx-svelte/
├─ docs/                   # SvelteKit docs site + registry host  (astryx-svelte.dev)
│  ├─ content/             # markdown, IA mirrored from astryx.atmeta.com
│  ├─ src/lib/registry/    # the canonical .svelte + generated .styles.js sources
│  ├─ static/r/            # built registry JSON
│  └─ scripts/
│     ├─ build-registry.ts
│     ├─ extract-astryx-styles.mjs   # ← already exists at repo root today
│     └─ verify-classes.mjs          # ← already exists; make it a CI gate
├─ packages/
│  └─ cli/                 # npm: `astryx-svelte`
├─ registry-template/
├─ .changeset/
├─ LICENSE.md              # MIT + Meta Platforms copyright carried forward
└─ pnpm-workspace.yaml     # with a catalog:
```

The current single-app repo (`src/lib/astryx/**`, `scripts/extract-astryx-styles.mjs`,
`scripts/verify-classes.mjs`) is the seed of `docs/`. Promote it to a workspace **before** component
count grows — retrofitting a monorepo after 40 components is the single most avoidable pain.

---

## 2. The registry model — the core architectural pattern

### 2.1 The idea

Distribution is **copy-in source, not an npm dependency**. The unit of distribution is a JSON
document that carries file *content* as a string. The consumer owns the resulting files outright:
they can edit them, and they never receive an update they didn't ask for.

Two schemas, two lifecycles:

- **`registry.json`** — *authoring* format, lives in the registry author's repo, points at files on disk.
- **`registry-item.json`** — *distribution* format, one per item, emitted by a build step, served over HTTP with content inlined.

The CLI only ever sees the second.

### 2.2 `registry.json` (authoring)

```jsonc
{
  "$schema": "https://shadcn-svelte.com/schema/registry.json",
  "name": "acme",                      // used for data-attributes / metadata
  "homepage": "https://acme.com",
  "include": ["./other/registry.json"],// compose registries; either items or include required
  "items": [
    {
      "name": "hello-world",           // unique across the resolved registry
      "type": "registry:block",
      "title": "Hello World",
      "description": "A simple hello world component.",
      "registryDependencies": ["button"],
      "dependencies": ["some-pkg@^1.2.0"],
      "files": [
        { "path": "./src/lib/hello-world/hello-world.svelte", "type": "registry:component" }
      ]
    }
  ]
}
```

`files[].path` is **relative to the `registry.json` that declares it**.

### 2.3 `registry-item.json` (distribution)

Full field set, as documented by both projects:

| Field | Meaning |
|---|---|
| `$schema` | `https://shadcn-svelte.com/schema/registry-item.json` |
| `name` | unique id |
| `type` | see table below |
| `title` / `description` | human-facing |
| `author` | `"Name <email>"` |
| `dependencies` | npm runtime deps; `pkg@^1.2.3` version syntax supported |
| `devDependencies` | npm dev deps (shadcn-svelte specific; shadcn/ui also has this) |
| `registryDependencies` | other items — bare name, `@ns/name`, full URL, `./local.json`, or `local:name` at build time |
| `files[]` | `{ content, type, target }` when served; `{ path, type, target }` when authored |
| `cssVars` | `{ theme, light, dark }` maps of CSS custom properties |
| `css` | raw CSS rules — `@layer base`, `@utility`, `@keyframes`, `@plugin` |
| `envVars` | dev-only `.env` values (shadcn/ui) |
| `font` | `registry:font` items (shadcn/ui) |
| `docs` | free text the CLI prints after install — post-install instructions |
| `categories` | grouping tags |
| `meta` | arbitrary k/v (shadcn/ui uses it for per-base doc links) |

**`type` values**

| Type | shadcn/ui | shadcn-svelte | Meaning |
|---|:--:|:--:|---|
| `registry:ui` | ✓ | ✓ | UI primitive / single-file component |
| `registry:component` | ✓ | ✓ | simple component |
| `registry:block` | ✓ | ✓ | multi-file composite |
| `registry:lib` | ✓ | ✓ | utilities |
| `registry:hook` | ✓ | ✓ | React hook / **Svelte reactive function or class** |
| `registry:page` | ✓ | ✓ | route file — `target` **required** |
| `registry:file` | ✓ | ✓ | misc file — `target` **required** |
| `registry:style` | ✓ | ✓ | style preset; also the `init` payload |
| `registry:theme` | ✓ | ✓ | theme definition |
| `registry:base` | ✓ | — | whole design system |
| `registry:font` | ✓ | — | font definition |
| `registry:item` | ✓ | — | universal |

`target` uses `~` for project root (`~/svelte.config.js`) and, in shadcn/ui, `@components/`, `@ui/`,
`@lib/`, `@hooks/` placeholders.

### 2.4 Observed wire format — this is the part that matters

**`GET https://shadcn-svelte.com/registry/index.json`** — a *lightweight manifest*, not the payloads:

```json
[
  { "name": "init",   "type": "registry:style", "devDependencies": ["tailwind-variants","@lucide/svelte","tw-animate-css"],
    "registryDependencies": ["utils"], "relativeUrl": "init.json" },
  { "name": "button", "type": "registry:ui", "registryDependencies": [], "relativeUrl": "button.json" },
  { "name": "alert-dialog", "type": "registry:ui", "registryDependencies": ["button"], "relativeUrl": "alert-dialog.json" }
]
```

The manifest carries the **dependency edges only**. The CLI resolves the full transitive graph from
`index.json` alone, then fetches exactly the item payloads it needs. One small request, then N
parallel fetches — no over-fetching.

**`GET https://shadcn-svelte.com/registry/button.json`** — the payload, content inlined:

```jsonc
{
  "$schema": "https://shadcn-svelte.com/schema/registry-item.json",
  "name": "button",
  "type": "registry:ui",
  "devDependencies": ["tailwind-variants@^3.2.2"],
  "files": [
    {
      "content": "<script lang=\"ts\" module>\n\timport { cn, type WithElementRef } from \"$UTILS$.js\";\n\t…",
      "type": "registry:file",
      "target": "button/button.svelte"
    },
    { "content": "…", "type": "registry:file", "target": "button/index.ts" }
  ]
}
```

Note three things:
1. `content` is plain inline source. No base64, no tarball, no git.
2. `target` is **relative to the `ui` alias** — `button/button.svelte`, not an absolute path.
3. The import reads `from "$UTILS$.js"` — **an unresolved placeholder token**.

**`GET .../registry/utils.json`** — the `cn` helper, `type: "registry:lib"`, `target: "utils.ts"`,
`devDependencies: ["clsx@^2.1.1", "tailwind-merge@^3.4.0"]`. Note the *pinned version ranges* on every
dependency — the registry is the source of truth for what version of what package a component needs.

**`GET .../registry/init.json`** — `type: "registry:style"`, `files: []`, `registryDependencies:
["utils"]`. The `init` command is *itself a registry item*. Bootstrapping is data, not code.

### 2.5 The alias mechanism — shadcn-svelte's cleanest divergence

`packages/cli/src/constants.ts`:

```ts
export const SITE_BASE_URL = "https://shadcn-svelte.com";
export const TW3_SITE_BASE_URL = "https://tw3.shadcn-svelte.com";
export const OFFICIAL_REGISTRY_URL = `${SITE_BASE_URL}/registry`;

export const ALIASES = ["components", "ui", "hooks", "utils", "lib"] as const;

export const ALIAS_DEFAULTS = ALIASES.reduce((acc, a) => {
  acc[a] = {
    placeholder: `$${a.toUpperCase()}$`,                              // $UTILS$, $UI$, …
    defaultPath: a === "utils" ? "$lib/utils" : `$lib/registry/${a}`,
  };
  return acc;
}, {} as Record<…>);
```

`packages/cli/src/utils/transformers/transform-imports.ts` — **the entire transform**:

```ts
export const transformImports: Transformer = async ({ content, config }) => {
  for (const alias of ALIASES) {
    content = content.replaceAll(ALIAS_DEFAULTS[alias].placeholder, config.aliases[alias]);
  }
  return { content };
};
```

That's it. Five `replaceAll` calls.

**Why this matters.** shadcn/ui rewrites imports with `ts-morph` AST transforms because `.tsx` is
parseable TypeScript. `.svelte` files are not — they are a bespoke format with `<script>`,
`<script module>`, markup, and `<style>`. Rather than build a Svelte-aware import rewriter,
shadcn-svelte moved the substitution into the *authoring* convention: component sources are written
with literal `$UTILS$` tokens, and the transform is a dumb string replace. It is format-agnostic,
zero-dependency, and impossible to get subtly wrong.

Other transformers in the same pipeline (`packages/cli/src/utils/transformers/`):
`transform-icons.ts` (swap icon library), `transform-font.ts`, `transform-menu.ts`,
`transform-strip-types.ts` (TS → JS for `typescript: false` projects).
CSS is handled separately by `transform-css.ts` using PostCSS, merging `cssVars` and `css` into the
project's `app.css`.

### 2.6 Registry URL resolution

`packages/cli/src/utils/registry/index.ts`:

```ts
export function getRegistryUrl(config: { registry: string; style?: string }) {
  if (process.env.COMPONENTS_REGISTRY_URL) return process.env.COMPONENTS_REGISTRY_URL; // legacy
  const url = process.env.REGISTRY_URL ?? config.registry;
  return new URL(url + `/styles/${config.style ?? "vega"}`).toString();
}
```

So: `components.json#registry` → `+ /styles/{style}` → `+ /index.json` or `+ /{name}.json`.
Themes come from `{base}/colors/{theme}.json`. Two env vars override, one of them purely for
backwards compatibility with URLs from an older major.

Fetching uses `node-fetch-native` with proxy support (`HTTP_PROXY` / `http_proxy` / `--proxy`).
Everything is validated with **zod** schemas (`packages/cli/src/schema/`) after fetch.

### 2.7 Building and serving your own registry

```bash
pnpm i shadcn-svelte@latest
# package.json: "registry:build": "shadcn-svelte registry build"
pnpm run registry:build      # reads ./registry.json → writes ./static/r/*.json
```

Served at `http://localhost:5173/r/{name}.json`. Auth convention: a `token` query param
(`/r/hello-world.json?token=…`); the CLI treats **HTTP 401** as an auth failure and says so.
shadcn/ui adds namespaced registries in `components.json#registries` with header injection:

```jsonc
{ "registries": {
    "@v0": "https://v0.dev/chat/b/{name}",
    "@private": { "url": "https://api.co/r/{name}.json", "headers": { "Authorization": "Bearer ${TOKEN}" } } } }
```
→ `npx shadcn@latest add @private/button`.

### 2.8 → Astryx translation

This model transfers almost unchanged. The Astryx-specific parts:

- **Each registry item ships two files**: the hand-ported `Button.svelte` *and* its generated
  `Button.styles.js`. Type them `registry:ui` and `registry:lib` respectively, or add a custom
  `registry:styles` type. The generated file must be marked non-editable in a header comment.
- **`dependencies` carries the Astryx npm packages**, version-pinned:
  `["@astryxdesign/core@^0.1.7", "@stylexjs/stylex@^0.19.0"]`. This is the exact structural role
  Bits UI plays for shadcn-svelte — see §5.
- **`cssVars`/`css` are mostly unused.** Astryx themes are `@scope ([data-astryx-theme="…"])` blocks
  shipped inside `@astryxdesign/theme-*`. So the `init` item's job is to add the three CSS imports
  (`reset.css`, `astryx.css`, `theme-*/theme.css`) to the app's entry CSS and install
  `@astryxdesign/*`. Use `css` for the import lines and `docs` for the `data-astryx-theme` snippet.
- **Alias placeholders**: `$SX$` (the `stylex.props` adapter), `$UTILS$`, `$UI$`, `$COMPONENTS$`,
  `$LIB$`, `$GENERATED$`. Keep the `$UPPER$` convention verbatim — it works.
- **`registryDependencies`** encodes the real graph you already have: `button` → `spinner` →
  `visually-hidden`; `button-group` → `button`.
- **The `styles/{style}` URL segment has no Astryx analogue** and should be dropped. Astryx's
  equivalent axis is *theme*, and themes are npm packages, not registry variants. Do **not** copy
  shadcn's `style` concept — see §8, it is their longest-lived config wart.

---

## 3. The CLI

### 3.1 Shape

`packages/cli` publishes npm **`shadcn-svelte`** (v1.4.2 at time of writing). Built with `tsdown`,
CLI framework is **commander**, prompts are **@clack/prompts**, validation is **zod**, colours are
**picocolors**. Node ≥ 20 enforced at startup with an explicit error. Peer dep `svelte >= 5`.

`src/index.ts` registers every command by iterating the `commands` barrel export — adding a command
is adding a file.

```
packages/cli/src/
├─ commands/{init,add,apply,registry,update}/
├─ preset/           # styles, base colours, themes, icon libraries
├─ schema/           # zod schemas for registry + registry-item
├─ icons/
├─ utils/
│  ├─ config/        # components.json schema + resolution
│  ├─ registry/      # fetch, resolve graph, parse
│  ├─ transformers/  # transform-imports|icons|font|menu|strip-types
│  ├─ updaters/
│  ├─ add-registry-items.ts   resolve-imports.ts   transform-css.ts
│  ├─ install-deps.ts   auto-detect.ts   preconditions.ts   project.ts
│  └─ css.ts  colors.ts  fonts.ts  font-markers.ts  errors.ts  get-env-proxy.ts
├─ constants.ts
└─ tailwind.css
```

The package also exposes subpath exports so *other* tools can reuse the internals:
`shadcn-svelte/schema` (types + zod for registry authoring), plus preset, transformer and CSS
utilities. `packages/registry` — a separate npm package that used to serve this purpose — is now
deprecated in favour of those subpaths.

### 3.2 Command surface

**`init`** — installs dependencies, adds the `cn` util, writes CSS variables, writes `components.json`.
```
--preset <preset>            --base-color <neutral|stone|zinc|mauve|olive|mist|taupe>
--css <path>                 --components-alias / --lib-alias / --utils-alias
--hooks-alias / --ui-alias   --no-deps        --skip-preflight
-c, --cwd <path>             -y, --yes        --proxy <proxy>
```

**`add [components...]`** — resolve graph → fetch → transform → write → install deps.
```
-a, --all   -y, --yes   -o, --overwrite   --no-deps   --proxy   -c, --cwd   --skip-preflight
```

**`apply [preset-id]`** — apply a preset (theme/font) to an existing project. `--only theme|font`,
`-y`, `-s, --silent`.

**`registry build [registry.json]`** — emit distribution JSON. `-o, --output <path>` (default `./static/r`).

**`update [components...]`** — *hidden and undocumented*. Re-fetches and re-writes existing
components. Flags mirror `add`: `-a/--all`, `-y`, `--no-deps`, `--proxy`, `-c`, `--skip-preflight`.
It overwrites; it does not merge. The documented user workflow is still "re-run `add` and reconcile
by hand."

**Environment**: `REGISTRY_URL`, `COMPONENTS_REGISTRY_URL` (legacy), `HTTP_PROXY`/`http_proxy`.

### 3.3 `components.json`

Resolved defaults from `packages/cli/src/utils/config/schema.ts`:

```jsonc
{
  "$schema": "https://shadcn-svelte.com/schema.json",
  "tailwind": { "css": "src/app.css", "baseColor": "slate" },
  "aliases": {
    "lib":        "$lib",
    "utils":      "$lib/utils",
    "hooks":      "$lib/hooks",
    "components": "$lib/components",
    "ui":         "$lib/components/ui"
  },
  "typescript": true,                              // or { "config": "path/to/tsconfig.json" }
  "registry": "https://shadcn-svelte.com/registry",
  "style": "nova",
  "iconLibrary": "lucide",
  "menuColor": "default",
  "menuAccent": "subtle"
}
```

**The compatibility trick worth stealing.** The schema is built as three layers:

```ts
const baseConfigSchema      = z.object({ tailwind, aliases:{components,utils}, typescript });
const originalConfigSchema  = baseConfigSchema.extend({ style: z.string().optional() });
const newConfigSchema       = baseConfigSchema.extend({ aliases:{…ui,hooks,lib}, registry, iconLibrary, … });

export const rawConfigSchema = z.object({          // union of old ∪ new
  ...originalConfigSchema.shape,
  ...newConfigSchema.shape,
  aliases: z.object({ ...originalConfigSchema.shape.aliases.shape,
                      ...newConfigSchema.shape.aliases.shape }),
});
```
Every field added since v0 has a `.default()`. A `components.json` written by the first release still
parses today. **Config is forever; treat it as a public API from commit one.**

Alias resolution (`utils/resolve-imports.ts`) is not naive: it resolves an alias against
`tsconfig.json` `paths` via `get-tsconfig`, then falls back to `package.json#imports` (`#`-prefixed
subpath imports), then to workspace package `exports` via `resolve.exports`. Aliases work in
monorepos, not just in SvelteKit's `$lib`.

### 3.4 Divergence from shadcn's CLI

| | shadcn (`shadcn`) | shadcn-svelte (`shadcn-svelte`) |
|---|---|---|
| Commands | `init`/`create`, `add`, `apply`, `preset`, `view`, `search`, `list`, `build`, `docs`, `migrate`, `eject` | `init`, `add`, `apply`, `registry build`, `update` (hidden) |
| Import rewriting | `ts-morph` AST | `$PLACEHOLDER$` string replace |
| Registry sub-path | `/r/{name}.json` | `/registry/styles/{style}/{name}.json` |
| Multi-registry | `components.json#registries` with namespaces + headers | single `registry` URL |
| Framework config | `rsc`, `tsx`, `tailwind.config`, `prefix` | `typescript`, `tailwind.css` only |
| Scaffolding | `create` scaffolds whole apps from templates | none — assumes an existing SvelteKit project |
| Discovery | `search` / `list` / `view` / `docs` | none |

shadcn-svelte deliberately shipped a **strict subset**. It never chased `diff`, `search`, `eject`, or
app scaffolding. That restraint is why a two-person team kept parity for three years.

### 3.5 → Astryx translation

- npm name **`astryx-svelte`**. Binary `astryx-svelte`. `npx astryx-svelte@latest init | add button`.
- Keep the filename **`components.json`** — it is the ecosystem convention and editors already
  associate it with a `$schema`. Replace the `tailwind` block with an `astryx` block:
  ```jsonc
  {
    "$schema": "https://astryx-svelte.dev/schema.json",
    "astryx": { "css": "src/app.css", "theme": "neutral" },
    "aliases": { "lib": "$lib", "utils": "$lib/utils", "components": "$lib/components",
                 "ui": "$lib/components/astryx", "generated": "$lib/components/astryx/generated" },
    "typescript": true,
    "registry": "https://astryx-svelte.dev/registry"
  }
  ```
- Ship v1 with **`init`, `add`, `update`, `registry build`** only. Nothing else.
- Copy `resolve-imports.ts` wholesale — tsconfig paths → `package.json#imports` → workspace exports.
- Build the zod config schema in the three-layer shape from day one, with `.default()` on every
  non-essential field.
- Add one Astryx-specific command the shadcn CLIs have no analogue for: **`astryx-svelte doctor`**
  (or fold it into `add`'s postcondition) that runs the `verify-classes` check against the
  consumer's installed `@astryxdesign/core` — asserting every atomic class the copied components
  reference actually exists in that version's `astryx.css`. StyleX class names are content-derived
  hashes; a consumer on a mismatched `@astryxdesign/core` gets silently unstyled components. This is
  astryx-svelte's single largest failure mode and the CLI is the only place to catch it.

---

## 4. Docs site

### 4.1 Stack

SvelteKit + Vite. Content pipeline is **Velite** (typed content collections, schema-validated) plus
**mdsx** (markdown → Svelte components). Highlighting is **Shiki** (`@shikijs/langs`,
`@shikijs/themes`). Dark mode is **mode-watcher** with an inline `setInitialMode` script in `app.html`
to avoid FOUC. Deployment is **`@sveltejs/adapter-cloudflare` + wrangler** (Cloudflare Workers).
Images via `@sveltejs/enhanced-img`. Fonts via ~28 `@fontsource-variable/*` packages so theme presets
can switch typefaces. Analytics is self-hosted Plausible; EthicalAds for funding.

Build orchestration (`docs/package.json`):
```
build = concurrently(build:icons, build:content, build:llm-placeholders)
        → build:svelte → build:llms
build:registry     = tsx scripts/build-registry.ts build-registry
build:screenshots  = tsx scripts/capture-registry.ts
```

**The docs app is the registry host.** One deploy publishes both the documentation and the JSON the
CLI fetches — they can never drift.

### 4.2 Information architecture — mirrored 1:1 from shadcn

`docs/content/`:
```
index.md  installation/  components-json.md  theming.md  dark-mode/  cli.md
javascript.md  figma.md  skills.md  legacy.md  changelog.md + changelog/  about.md
migration/{svelte-5, tailwind-v4}  registry/{getting-started, faq, examples,
                                             registry-json, registry-item-json}
components/  forms/
```
Top nav: **Installation · Components · Blocks · Charts · Create**.
Sidebar "Getting Started": Installation, components.json, Theming, Dark Mode, CLI, Skills,
JavaScript, Figma, llms.txt, Legacy Docs. Then Registry. Then 65+ components A–Z.

The port even mirrors upstream's later additions (`llms.txt`, agent `skills`, Blocks, Charts) rather
than inventing its own IA. Two additions upstream doesn't need: **`migration/`** and **`legacy.md`**,
both artefacts of being a downstream port that survived breaking upstream ecosystem shifts.

### 4.3 → Astryx translation

Mirror **astryx.atmeta.com**'s IA exactly, not shadcn's — the user's instruction is that layout and
styling follow Astryx. So: Astryx's own nav, page order, and component ordering, with three
Svelte-port-specific pages grafted on: `installation`, `components.json`, `cli`. Add `registry/` once
third-party registries are supported.

Stack recommendation: same as shadcn-svelte (SvelteKit + Velite + mdsx + Shiki). It is proven, it is
Svelte-native, and it keeps the docs app and registry host as one deployable. Use
`@sveltejs/adapter-cloudflare` or any static adapter — the registry is just files in `static/r/`, so
even GitHub Pages works.

One Astryx-specific docs obligation: **each component page must show the rendered atomic class
output** alongside the React original, because "identical output" is this port's headline claim. Make
it verifiable on the page.

---

## 5. The primitive gap — React→Svelte, and why Astryx's version is different

### 5.1 What shadcn/ui depends on

shadcn/ui is styling on top of **Radix UI** — and as of 2026, three interchangeable "bases":
`radix`, `base` (Base UI), and `aria` (React Aria). The live `ui.shadcn.com/r/index.json` carries
per-item `meta.links` with `base`/`aria`/`radix` doc + example + API links, i.e. upstream now ships
*the same component against three different primitive libraries*.

### 5.2 What shadcn-svelte substituted

Per the About page and observed deps:

| shadcn/ui | shadcn-svelte |
|---|---|
| Radix UI (accordion, dialog, popover, menu, select, tabs, …) | **Bits UI** |
| react-hook-form + zod resolvers | **Formsnap** (+ sveltekit-superforms) |
| react-resizable-panels | **Paneforge** |
| Vaul | **Vaul Svelte** |
| cmdk | **Bits UI Command** (after `cmdk-sv` was absorbed) |
| lucide-react | **@lucide/svelte** |
| class-variance-authority | **tailwind-variants** |
| Recharts | **LayerChart** |
| embla-carousel-react | embla-carousel-svelte |
| date-fns / react-day-picker | @internationalized/date + Bits UI Calendar |

The maintainer's stated rationale (Discussion #588): keep the headless layer as a **separate
auto-updating npm dependency**, and the styled layer as **owned copied code**. "If shadcn-svelte
required copying the entire bits-ui codebase into each project, maintainability would become quite
the nightmare." Bug fixes to behavior arrive via `pnpm i bits-ui@latest` without touching a single
file the user owns.

### 5.3 What it cost

1. **The substitutes had to be built.** Bits UI, Formsnap, Paneforge, Vaul Svelte and Melt UI are all
   authored by the same maintainer/org. The port was gated on a primitive library that did not exist,
   so the real project was *two* projects. Component parity with upstream was permanently rate-limited
   by primitive parity.
2. **API drift.** Bits UI's API is not Radix's. Component props, slot/snippet names and composition
   patterns diverge, so docs and examples cannot be copied — every page is rewritten.
3. **Coupled majors.** Svelte 4→5, Bits UI 0→1, and Tailwind 3→4 landed in roughly the same window.
   That forced a long parallel-universe period: a `next.shadcn-svelte.com` docs site, a separate
   pre-release registry, and two migration guides (`migration/svelte-5`, `migration/tailwind-v4`) with
   explicit advice to migrate in two steps (Svelte 5 first on Tailwind 3, *then* Tailwind 4).
4. **Dependency churn.** `cmdk-sv` was abandoned mid-life and its component absorbed into Bits UI —
   a breaking change for consumers caused by a third-party package's lifecycle.
5. **Frozen legacy infrastructure.** They had to stand up `tw3.shadcn-svelte.com` as a permanently
   frozen Tailwind-v3 registry, hard-coded as `TW3_SITE_BASE_URL` in the CLI, so old projects keep
   resolving forever.

### 5.4 The Astryx equivalent problem — stated precisely

**Astryx has no external primitive dependency.** It implements its own behavior in-house, on top of
StyleX-compiled atomic CSS shipped in `@astryxdesign/core`.

That means the shadcn-svelte layering does not map directly. Restated:

| Layer | shadcn-svelte | astryx-svelte |
|---|---|---|
| Un-owned, auto-updating npm dep | **Bits UI** (behavior + a11y) | **`@astryxdesign/core` + `theme-*`** (the compiled atomic CSS, `reset.css`, `astryx.css`, tokens) |
| Owned, copied-in source | styled Svelte wrappers around Bits UI | **Svelte markup + behavior**, applying styles via `stylex.props()` |
| Generated, never hand-edited | — | **`generated/*.styles.js`** lifted out of Astryx's `dist` by codegen |

So the split is preserved — but **the axis moved**. shadcn-svelte owns *styling* and rents *behavior*.
astryx-svelte rents *styling* (for free, and it stays correct across upstream Astryx releases) and
owns **100% of behavior**.

Consequences, and they are the defining constraints of this project:

- **No primitive-parity rate limit.** You are never blocked waiting for a Svelte headless library to
  ship a Combobox. You can port any Astryx component the day you decide to.
- **No lockstep major-version risk.** There is no Bits-UI-0→1 event in your future. Your only upstream
  is `@astryxdesign/core`, and its CSS surface is far more stable than a component API.
- **But no free behavior fixes.** Every focus trap, roving tabindex, dismissable layer, portal,
  popper positioning, typeahead, and ARIA wiring that Astryx's React components implement must be
  re-implemented in Svelte and then *maintained*. When Meta fixes an a11y bug in Astryx's React
  `Menu`, you get the CSS fix free and the behavior fix **not at all** until someone re-ports it.
- **Markup fidelity is load-bearing in a way it is not for shadcn-svelte.** Astryx's atomic CSS is
  applied per-element via `stylex.props()`; the styling correctness of a component depends on the
  DOM shape matching. This is exactly why **you should not** adopt Bits UI as a behavior layer and
  paint Astryx classes onto it: Bits UI controls its own DOM structure, and any structural mismatch
  silently breaks styling. The existing repo already made the right call — hand-port markup and
  behavior, apply styles through the `sx.ts` adapter.
- **The guard is the deliverable.** `scripts/verify-classes.mjs` — asserting every merged class exists
  in `astryx.css` — is the moral equivalent of shadcn-svelte's dependency on a versioned Bits UI. It
  is what converts "silently unstyled in production" into "CI fails". Make it a required check, run it
  in the registry build, and expose it through the CLI (§3.5).

**Decision to record explicitly:** astryx-svelte takes behavior in-house. Bits UI / Melt UI are
*rejected* as a foundation because Astryx's styling contract is DOM-shape-coupled. They remain
acceptable as a *reference* for a11y semantics.

---

## 6. Naming, branding, attribution and licensing

**Naming**
- npm CLI: `shadcn-svelte` (unscoped; upstream is `shadcn`, formerly `shadcn-ui`). Suffix pattern:
  `{upstream}-{framework}`.
- Private monorepo root: `@shadcn-svelte/monorepo`.
- Domains: `shadcn-svelte.com` (prod), `next.shadcn-svelte.com` (pre-release major),
  `tw3.shadcn-svelte.com` (frozen legacy registry).
- Schema URLs are branded and self-hosted: `https://shadcn-svelte.com/schema/registry-item.json` —
  they did **not** reuse `ui.shadcn.com`'s schema URLs even though the schemas are near-identical.

**Attribution**
- `LICENSE.md` is MIT with **three copyright lines**:
  ```
  Copyright (c) 2023 Hunter Johnston <https://github.com/huntabyte>
  Copyright (c) 2023 CokaKoala   <https://github.com/adriangonz97>
  Copyright (c) 2023 shadcn
  ```
  Upstream's copyright is carried into the port's licence file, not just name-checked in a README.
- README/docs, verbatim: *"an unofficial, community-led Svelte port of shadcn/ui"*, *"We are not
  affiliated with shadcn, but we did get his blessing before creating a Svelte version of his work."*
- Byline: *"Created by shadcn. Ported to Svelte by Huntabyte & CokaKoala."*
- An `/docs/about` page credits, in order: shadcn (original), the primitive deps (Bits UI, Formsnap,
  Paneforge, Vaul Svelte), Radix UI (as the original foundation that inspired it), Shu Ding
  (typography, via Nextra), Cal.com (button styles).
- They **obtained permission before starting**. Socially, that is the whole ballgame.

**→ Astryx**
- npm: **`astryx-svelte`**. Root: `@astryx-svelte/monorepo`. Domain: `astryx-svelte.dev` (or similar).
  Self-host `/schema/registry.json` and `/schema/registry-item.json` under your own domain.
- `LICENSE.md`: MIT, carrying **`Copyright (c) Meta Platforms, Inc. and affiliates`** alongside your
  own — Astryx is MIT (verify the exact notice in `facebook/astryx/LICENSE` and reproduce it
  verbatim).
- README/docs first line, plainly: *"an unofficial, community-led Svelte port of Astryx, Meta's
  open-source design system. Not affiliated with or endorsed by Meta."*
- **Do not use Meta or Astryx trademarks/logos in branding.** Word-mark reference in prose
  ("a port of Astryx") is descriptive fair use; a lockup or logo derivative is not. Meta's brand
  guidelines are enforced far more actively than an individual's.
- Add an `/docs/about` page from day one crediting Astryx, StyleX, and every dependency.
- Attribution *inside generated files*: the codegen already writes `src/lib/astryx/generated/**`.
  Give each generated file a header naming its source (`@astryxdesign/core@0.1.7`,
  `Button.styles.js`) and the codegen script — provenance in the artefact, not only in the repo.

---

## 7. Staying in sync with upstream — the maintenance model

**Rule 1 — hard parity policy.** From `CONTRIBUTING.md`:
> "this project is a port of shadcn/ui, meaning if a feature is not in shadcn/ui, it will not be
> considered here"

Missing-upstream-feature issues get a **`parity`** label. Contributors are told to verify the feature
exists upstream before requesting it. Substantial work requires a discussion first. PRs address a
single issue. AI-written issue/PR *prose* is discouraged; AI-assisted *code* is fine.

This one rule is the reason the project is maintainable. It converts an infinite design surface into
a finite, externally-defined backlog. It also means the port has no design debates — upstream already
had them.

**Rule 2 — Changesets for release.** `.changeset/`, `@changesets/cli`,
`@svitejs/changesets-changelog-github-compact`, `ci:release = build && changeset publish`. Every
user-visible change carries a changeset; the changelog writes itself.

**Rule 3 — porting is manual and PR-driven.** There is no automated transpile of upstream `.tsx` to
`.svelte`. A human reads the upstream component and rewrites it against Bits UI. Community
contributors do most of it; three maintainers review.

**Rule 4 — migrations are first-class documentation.** `docs/content/migration/` holds a page per
ecosystem-breaking event, with sequenced advice. A `/docs/changelog` page mirrors upstream's.

**Rule 5 — never break an existing install.**
- Config schema unions old ∪ new with defaults everywhere (§3.3).
- `COMPONENTS_REGISTRY_URL` kept "so old URLs will still work" — comment is in the source.
- A whole frozen hostname (`tw3.`) for the previous ecosystem major.
- A `legacy.md` docs page.

**Rule 6 — for consumers, sync is opt-in and manual.** The documented workflow is: re-run
`add <name>` (or the hidden `update`) to pull upstream changes, then reconcile with your edits by
hand. There is no merge, no three-way diff. shadcn/ui once had a `diff` command; it was removed. This
is a deliberate acceptance that "you own the code" means "you own the merge."

**→ Astryx**

- Adopt the parity rule verbatim: *nothing ships in astryx-svelte that is not in Astryx.* Use a
  `parity` label. It will save you from a hundred "can we add a variant?" debates.
- Track upstream by **`@astryxdesign/core` version**, not by commits. Every release: bump, re-run
  `extract-astryx-styles.mjs`, run `verify-classes.mjs`, diff the generated styles. The generated-file
  diff *is* your upstream change report — a style-only upstream change shows up as a pure codegen diff
  and needs no human port. That is an advantage shadcn-svelte does not have.
- **Automate the upstream watch.** A scheduled GitHub Action that bumps `@astryxdesign/core`, reruns
  codegen + verify, and opens a PR when generated output changes. shadcn-svelte's ecosystem does
  exactly this for its skills manifest; you have a much better target for it because your upstream
  surface is a versioned npm package with deterministic output.
- Maintain a **PORTING_STATUS table** in the repo: every Astryx component × {not started, styles
  extracted, markup ported, behavior ported, a11y verified, docs written}. The current README already
  does this informally ("Ported: Button, Spinner, VisuallyHidden. Deferred on Button: tooltip, `as`,
  ButtonGroup"). Formalise it — it is the port's roadmap, contributor onboarding, and honest
  status page in one artefact.
- Changesets from commit one.

---

## 8. Lessons and pitfalls

### 8.1 What shadcn-svelte got right — copy these

1. **Static JSON registry, no server.** Files in `static/`, served by any CDN, cacheable,
   forkable, mirrorable, works offline behind a proxy. Zero infrastructure.
2. **One npm package, and it is the CLI.** Not a single component ships to npm. No runtime coupling,
   no peer-dep matrix, no semver pressure on the design system itself.
3. **Placeholder tokens beat AST rewriting.** Five `replaceAll` calls do what shadcn/ui needs
   `ts-morph` for. Format-agnostic and impossible to get subtly wrong.
4. **Split the manifest from the payloads.** `index.json` carries names, types and dependency edges
   only; the CLI resolves the whole graph from it before fetching a single payload.
5. **Version-pin every dependency in the registry item.** `tailwind-variants@^3.2.2` lives in the
   item, so the registry — not the consumer — is the source of truth for compatible versions.
6. **`init` is a registry item.** Bootstrapping is data, not branching code.
7. **Config schema is additive forever.** Old ∪ new, `.default()` on everything.
8. **A frozen hostname per legacy major.** `tw3.` cost one deploy and bought permanent backwards
   compatibility for every existing project.
9. **Docs site hosts the registry.** One deploy; they cannot drift.
10. **`registry-template` from early on.** Third parties could publish compatible registries without
    reverse-engineering anything.
11. **Attribution in the LICENSE, plus permission obtained before starting.**
12. **A written non-goal ("if it's not upstream, it's not here") enforced with an issue label.**

### 8.2 What hurt them — avoid these

1. **The primitive layer was the real project.** They had to build Bits UI, Formsnap, Paneforge and
   Vaul Svelte to have anything to style. Astryx's equivalent hazard is different but real: **behavior
   is 100% yours**, forever, with no upstream fixes flowing in. Budget for it explicitly.
2. **Coupled ecosystem majors.** Svelte 5 + Tailwind 4 + Bits UI 1 arrived together and produced a
   long, confusing `next.` period with a parallel docs site and parallel registry.
   *Mitigation: never take more than one ecosystem breaking change per release train.*
3. **The `style` concept was inherited and never fit.** `default` vs `new-york` came from upstream,
   became a permanent field in `components.json` and a permanent `/styles/{style}/` segment in every
   registry URL, and `default` is now deprecated. **Do not invent an axis you do not need.** Astryx's
   only variation axis is *theme*, and themes are npm packages — keep them out of the registry URL.
4. **Schema shipped as a separate package, then deprecated.** `packages/registry` existed solely to
   export types + zod schemas, and is now superseded by a `shadcn-svelte/schema` subpath export.
   *Put the schema in the CLI package as a subpath export from day one.*
5. **The registry was labelled "experimental" long after people depended on it.** Either commit or
   don't publish. A schema URL under your own domain is a promise.
6. **No real update story.** `update` is hidden and undocumented; the sanctioned workflow is
   hand-reconciliation. This is the single biggest recurring user complaint in the model.
   *Improvement worth making: record a content hash of each file at install time in a lockfile
   (`components.lock.json`). Then `update` can distinguish untouched files (safe to overwrite),
   modified files (show a diff, require confirmation), and give a genuine three-way merge.*
7. **Docs demo duplication.** Every component needs a docs page plus demo components plus screenshots
   plus llms.txt entries, all maintained by hand. *Generate as much as possible from the registry
   source; make the demo the registry example.*
8. **Turborepo was skipped, then build orchestration grew ad hoc.** Root scripts are a thicket of
   `pnpm -r -F` filters and `concurrently` + `wait-on`. Fine at this size, fragile beyond it.

### 8.3 Day-one checklist for `astryx-svelte`

Ordered. Items 1–6 are things that are cheap now and expensive in three months.

1. **Restructure to a monorepo now.** `docs/` + `packages/cli/` + `registry-template/`,
   pnpm workspaces with a `catalog:`, Changesets configured, `only-allow pnpm`.
2. **Freeze the public contracts before writing the CLI:** the `components.json` shape (three-layer
   zod, defaults everywhere), the `$UPPER$` placeholder set, the registry URL layout, and the two
   self-hosted schema URLs. These are the things you can never change.
3. **Decide the registry URL layout with no `style` segment.**
   `https://astryx-svelte.dev/registry/index.json` and `/registry/{name}.json`. Nothing else.
4. **Write `build-registry.ts` before the second component.** The registry emitter must be what
   produces distribution JSON from `docs/src/lib/registry/**` — never hand-write item JSON.
5. **Make `verify-classes.mjs` a CI gate and wire it into the registry build.** No item is publishable
   whose merged classes are absent from the pinned `@astryxdesign/core`'s `astryx.css`.
6. **Record the codegen/hand-written boundary in machine-readable form.** The README table
   (`generated/**` = codegen, `<Component>/*.svelte` = hand-ported) should be a manifest the build
   enforces, plus a header comment in every generated file. Also capture the
   *compiler-inlined class strings* (VisuallyHidden's clip block, Button's `labelText`,
   `endContentWrapper`, spinner overlay) in a single tracked file — they are the one thing codegen
   cannot recover, and they will silently rot on an upstream bump.
7. **Add `components.lock.json`** (per-file content hash at install time) so `update` can do a real
   three-way merge. This is the improvement over shadcn-svelte most worth making.
8. **Publish `PORTING_STATUS.md`** — the component × stage matrix.
9. **Write `LICENSE.md`, the About page, and the "unofficial / not affiliated with Meta" line before
   the first public commit.** Reach out to the Astryx maintainers for a blessing the way huntabyte did
   with shadcn; it costs one message and it is the difference between a welcomed port and a
   cease-and-desist.
10. **Adopt the parity rule in `CONTRIBUTING.md` on day one**, with a `parity` issue label.
11. **Scheduled upstream-watch Action**: bump `@astryxdesign/core` → codegen → verify → open PR on
    diff.
12. **Ship v1 of the CLI with `init`, `add`, `update`, `registry build` and nothing else.**

---

## 9. Source index

- github.com/huntabyte/shadcn-svelte — repo root, `packages/cli/src/**`, `CONTRIBUTING.md`,
  `LICENSE.md`, `pnpm-workspace.yaml`, root `package.json`, `docs/package.json`
- Live endpoints inspected: `shadcn-svelte.com/registry/index.json`, `/registry/button.json`,
  `/registry/utils.json`, `/registry/init.json`, `/registry/styles/vega/index.json`,
  `ui.shadcn.com/r/index.json`
- shadcn-svelte.com/docs — Introduction, About, CLI, components.json, Changelog,
  Registry (Getting Started, registry.json, registry-item.json), Migration
- ui.shadcn.com/docs — CLI, components.json, registry/registry-json, registry/registry-item-json
- github.com/shadcn-ui/ui — repo structure, `packages/`
- github.com/huntabyte/shadcn-svelte/discussions/588 — why shadcn-svelte is separate from Bits UI
