# 02 — Astryx CLI, Templates/Blocks, and Component Distribution

**Scope:** the `@astryxdesign/cli` package (`packages/cli`) of Meta's Astryx monorepo, mapped for a 1:1 Svelte port (`astryx-svelte`).

**Upstream source read:** `C:\Users\Rohit\AppData\Local\Temp\claude\D--astryx-svelte\958fb66c-28ed-4759-8e20-87f238de1788\scratchpad\astryx-upstream\packages\cli`
**Version analysed:** `@astryxdesign/cli@0.1.7` (`packages/cli/package.json`)

All command/flag data in §1 and all JSON payloads in §2 were captured by **actually executing** the upstream CLI (a copy of `packages/cli` with `commander`/`zod`/`@clack/prompts`/`jiti` installed), not by reading help text. Evidence commands are noted inline.

---

## 0. TL;DR — the three things that matter for the port

1. **There is no registry.** The CLI never fetches component definitions over the network. The only `fetch()` in the entire `src/` tree is the blog RSS reader (`src/api/blog.mjs:28`). Components are consumed as **normal npm imports** from `@astryxdesign/core`; the CLI *reads* the installed package's `src/` directory for docs and source. This is **fundamentally different from shadcn/shadcn-svelte**, whose whole model is a hosted `registry.json` + copy-in files.
2. **Templates and blocks ARE bundled inside the CLI package** (`packages/cli/templates/`, shipped via `package.json#files`). 43 page templates + 588 blocks + 7 themes. `astryx template <id> <path>` copies one file out of the CLI tarball into your project. This is the closest thing to shadcn-svelte's copy-in model — and it is **local-only**, not remote.
3. **`astryx manifest --json` is a derived, self-describing OpenAPI-for-a-CLI.** It is built from Commander metadata at runtime (`src/lib/manifest.mjs`), so it cannot drift. This is trivially portable and is the single highest-leverage feature to replicate verbatim.

---

## 1. Complete command surface

### 1.1 Program-level

Declared in `packages/cli/src/index.mjs`:

```js
program
  .name('astryx')
  .description('Design system CLI — components, themes, and tooling')
  .version(pkg.version)
```

Binary names (`packages/cli/package.json`):

```json
"bin": { "astryx": "./bin/astryx.mjs", "cli": "./bin/astryx.mjs" }
```

#### Global options (apply to every command)

| Flag | Type | Choices / default | Purpose |
|---|---|---|---|
| `-V, --version` | boolean | — | Print version. Special-cased for `--json` in `index.mjs` before Commander exits. |
| `--zh` | boolean | — | Output docs in Chinese Simplified |
| `--dense` | boolean | — | Compressed, token-efficient doc output |
| `--lang <locale>` | enum | `en` \| `zh` \| `dense` | Same as above, unified flag |
| `--detail <level>` | enum | `full` \| `compact` \| `brief` (default `full`) | Output verbosity. List views silently default to `brief`. |
| `--json` | boolean | — | Typed JSON envelopes on stdout |

#### Command registry (lazy-loaded, fault-isolated)

`src/index.mjs` registers each command with a `try/catch` around a dynamic `import()` so **one broken command cannot take down the CLI** — a failed command is replaced by a stub that prints the load error:

```js
const commands = [
  {name: 'init', path: './commands/init.mjs', register: 'registerInit'},
  {name: 'component', path: './commands/component/index.mjs', register: 'registerComponent'},
  {name: 'docs', path: './commands/docs.mjs', register: 'registerDocs'},
  {name: 'blog', path: './commands/blog.mjs', register: 'registerBlog'},
  {name: 'swizzle', path: './commands/swizzle.mjs', register: 'registerSwizzle'},
  {name: 'template', path: './commands/template.mjs', register: 'registerTemplate'},
  {name: 'layout', path: './commands/layout.mjs', register: 'registerLayout'},
  {name: 'upgrade', path: './commands/upgrade.mjs', register: 'registerUpgrade'},
  {name: 'theme', path: './commands/build-theme.mjs', register: 'registerTheme'},
  {name: 'hook', path: './commands/hook/index.mjs', register: 'registerHook'},
  {name: 'discover', path: './commands/discover.mjs', register: 'registerDiscover'},
  {name: 'search', path: './commands/search.mjs', register: 'registerSearch'},
  {name: 'build', path: './commands/build.mjs', register: 'registerBuild'},
  {name: 'doctor', path: './commands/doctor.mjs', register: 'registerDoctor'},
  {name: 'validate-integration', path: './commands/validate-integration.mjs', register: 'registerValidateIntegration'},
];
```

Plus two registered inline in `index.mjs`: `manifest` and the hidden `postinstall`.

### 1.2 Full reference table

Captured from `node bin/astryx.mjs manifest --json`. `J` = supports `--json`.

| Command | Args | Options | J | Response `type`s | What it does |
|---|---|---|---|---|---|
| `init` | — | `--features <list>` (agents,theme,template), `--all`, `--remove-agents`, `--agent <tool>` (claude\|cursor\|codex\|hermes\|all), `--agent-docs-path <path...>` | — | — | Interactive `@clack/prompts` wizard. Installs AI agent docs into `AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md` / `.cursorrules`, optionally scaffolds a page template, prints next steps. Idempotent/re-runnable. `agent-docs` was **folded into** `init` (see comment in `index.mjs`). |
| `component` | `[name]` | `--list`, `--category <c>`, `--props`, `--source`, `--showcase`, `--blocks`, `--package <name>` | ✅ | `component.list`, `component.brief`, `component.full`, `component.detail`, `component.detail.props`, `component.detail.source`, `component.detail.showcase`, `component.detail.blocks` | List components or print docs. Reads `.doc.mjs` from the installed `@astryxdesign/core/src/**`. |
| `hook` | `[name]` | `--list`, `--category <c>`, `--params` | ✅ | `hook.list`, `hook.brief`, `hook.full`, `hook.detail`, `hook.detail.params` | Same, for hooks. |
| `docs` | `[topic] [section]` | — | ✅ | `docs.list`, `docs.detail`, `docs.detail.section` | Reference docs (foundations/guides) from `packages/cli/docs/*.doc.mjs`. 27 doc files (en/zh/dense variants). |
| `search` | `<query>` (required) | `--type <domain>` (component\|hook\|doc\|template), `--limit <n>` (20), `--detail` | ✅ | `search` | Ranked cross-domain search. |
| `build` | `[query]` | `--type <domain>`, `--limit <n>` (60), `--detail` | ❌ | (`build.help` emitted but **not** in `RESPONSE_TYPES`, and `build` is not on the JSON allowlist) | Opinionated "compose a page" verb. No args → prints the how-to-build **playbook**. With a query → a composition kit (closest page template + blocks + components + a `Compose:` line). |
| `discover` | `[query]` | `--components` | ✅ | `discover.list`, `discover.detail`, `discover.detail.doc`, `discover.search` | Discover external Astryx-compatible npm packages in `node_modules` (those with an `astryx` field in package.json). |
| `swizzle` | `[component]` | `--output <dir>` (`./components/astryx`), `--package <pkg>`, `--list`, `-f, --overwrite` | ✅ | `swizzle.list`, `swizzle.copy` | **Eject** a component's source out of `node_modules/@astryxdesign/core/src/<Name>/` into your project, rewriting escaping relative imports to package subpaths. |
| `template` | `[name] [path]` | `--list`, `--type <page\|block>`, `--package <pkg>`, `--skeleton`, `-f, --overwrite` | ✅ | `template.list`, `template.show`, `template.skeleton`, `template.copy` | List / show / scaffold a page or block from the **CLI-bundled** `templates/` dir. |
| `theme` | *(group)* | — | — | — | Theme tools group. |
| `theme build` | `<file>` (required) | `-o, --out <path>`, `-w, --watch` | ✅ | `theme.build` | Compile a `defineTheme()` file to CSS + JS artifacts. |
| `theme list` | — | — | ✅ | `theme.list` | List bundled themes (from `templates/themes/manifest.json`). |
| `theme add` | `[slug] [path]` | `-f, --overwrite`, `--list` | ✅ | `theme.list`, `theme.add` | Copy a bundled theme's source into `src/themes/<slug>/` so you own it. |
| `layout` | *(group)* | — | — | — | XLE/XLO compressed-layout-expression tooling. |
| `layout expand` | `[expression] [path]` | `--file <f>`, `--form <compact\|outline\|auto>` (auto), `--name <PascalCase>` (`GeneratedLayout`), `--loose` | ✅ | `layout.expand` | Expand e.g. `V[g6] > C{card-callout}*4` into validated TSX. |
| `layout check` | `[expression]` | `--file <f>`, `--form <...>`, `--loose` | ✅ | `layout.check` | Validate an expression, echo canonical compact+outline forms. |
| `layout grammar` | — | — | ✅ | `layout.grammar` | Print the XLE/XLO cheatsheet (alias table generated from the branch). |
| `upgrade` | — | `--from <version>`, `--apply` (false), `--force` (false), `--codemod <name>`, `--skip-codemod <name...>`, `--integration <pkg-or-file>` (repeatable, `[]`), `--path <dir>` (`./src`), `--install-deps` (false), `--list` (false) | ✅ | `upgrade.list`, `upgrade.status`, `upgrade.run` | Run version-range codemods. **Dry-run by default.** |
| `doctor` | — | — | ✅ | `doctor` | Diagnose setup, report problems with fixes. |
| `validate-integration` | `[package]` | — | ✅ | `integration.validate` | Validate an integration package's manifest + contributions. |
| `manifest` | — | — | ✅ | `manifest` | Print the full CLI capability manifest. |
| `blog` | `[slug]` | — | ❌ | *(hidden — excluded from `--help` and manifest)* | Read the Astryx blog via its public RSS feed; prints the `.txt` variant. |
| `postinstall` | — | — | ❌ | *(hidden)* | Prints the boxed welcome banner from `package.json` postinstall. |
| `help` | — | — | — | — | Commander's auto help command (`addHelpCommand('help', 'Show all commands')`). |

**Hidden-command mechanism** (`src/commands/blog.mjs`):

```js
program.command('blog [slug]', {hidden: true})
```
and `describeCommand()` in `manifest.mjs` skips `cmd._hidden` and `name === 'help'`.

### 1.3 The "JSON is always JSON" contract

This is a first-class design artifact and should be ported wholesale. Documented in `src/lib/json.mjs`:

> 1. EVERY emission in `--json` mode is a single valid JSON envelope.
>    Success: `{ apiVersion, type, data }` · Error: `{ apiVersion, error, code, suggestions? }`
> 2. Commands that don't support `--json` are rejected **BEFORE any side effect**.
> 3. Human-facing chatter is suppressed in `--json` mode.
> 4. Uncaught throws in `--json` mode become a JSON error envelope, never a raw stack trace.

Enforcement points:

- **Allowlist** — `JSON_SUPPORTED` `Set` in `src/index.mjs` keyed by fully-qualified name (`'theme build'`, `'layout expand'`, …).
- **`preAction` hook** — rejects `--json` on non-allowlisted commands and `process.exit(1)` *before* the action body runs (no half-written files):
  ```js
  program.hook('preAction', (thisCommand, actionCommand) => {
    if (!program.opts().json) return;
    setJsonMode(true);
    if (actionCommand === program) return;
    const fullName = fullCommandName(actionCommand);
    if (JSON_SUPPORTED.has(fullName)) return;
    process.__xdsJsonHandled = true;
    console.log(JSON.stringify({apiVersion: API_VERSION, error: `JSON output is not supported for the '${fullName}' command`, code: ERROR_CODES.ERR_INVALID_OPTION}, null, 2));
    process.exit(1);
  });
  ```
- **`postAction` belt-and-suspenders** — if a "supported" command finished without setting `process.__xdsJsonHandled`, emit an `Internal: ...` error envelope rather than silently corrupting stdout.
- **`humanLog()` / `humanWarn()`** — the stdout-discipline primitive. No-ops in JSON mode, so commands never need `if (!json) console.log(...)`.
- **JSON shim** (`src/lib/json-shim.mjs`, installed *after* all commands register) — extends the contract to Commander's own parse-time short circuits (`--help`, unknown option, missing argument, unknown command).
- **Bin-level error boundary** (`bin/astryx.mjs`) — `process.on('unhandledRejection'|'uncaughtException')` → `toErrorEnvelope()`.
- **Node version preflight gate** — `bin/astryx.mjs` checks `process.versions.node` using **only built-ins** before importing anything that touches `node:util`'s `styleText` (Node ≥ 22.13.0), and hand-rolls a `{apiVersion:1, error, code:'ERR_NODE_VERSION'}` envelope if `--json` is present. It also `realpathSync`es `import.meta.url` so `../src/...` imports resolve through the `node_modules/.bin` symlink.

**Stable error codes** — `src/lib/error-codes.mjs`. The whole point (quoted from the file header):

> The `code` field is the stable contract. … Codes are append-only: once shipped, a code's meaning never changes and the code is never removed. The message may change freely; the code never does.

53 codes, `Object.freeze`d, grouped: generic, parsing/dispatch, environment, unknown-subject lookups, resource-shape, filesystem, theme build, upgrade, GitHub CLI, blog, layout. Examples: `ERR_UNKNOWN_COMPONENT`, `ERR_AMBIGUOUS_TEMPLATE`, `ERR_PATH_TRAVERSAL`, `ERR_NODE_VERSION`, `ERR_CODEMOD_FAILED`, `ERR_LAYOUT_PARSE`.

**Verified error envelope** (`node bin/astryx.mjs frobnicate --json`):

```json
{
  "apiVersion": 1,
  "error": "unknown command 'frobnicate'",
  "code": "ERR_UNKNOWN_COMMAND",
  "suggestions": [
    {"name": "init", "reason": "available command"},
    {"name": "component", "reason": "available command"}
  ]
}
```

Suggestions use Levenshtein distance ≤ 3 (`src/lib/string-utils.mjs`), falling back to "here is every command" so an agent is never stuck.

---

## 2. `npx astryx manifest --json` — the agent-facing capability manifest

### 2.1 What it is

From `src/lib/manifest.mjs`:

> `astryx --json` (and `astryx manifest --json`) emit a structured manifest that lets an AI agent drive the entire CLI WITHOUT scraping `--help` text. **It is to the CLI what an OpenAPI spec is to an HTTP API.**

Two surfaces, one payload:

- `astryx manifest --json` → `{apiVersion, type: 'manifest', data: <CLIManifest>}`
- bare `astryx --json` → `{apiVersion, type: 'help', data: {name, version, commands: string[], jsonSupported, manifest: <CLIManifest>}}` (the flat fields are kept for backwards compat; the rich payload is nested under `data.manifest`).

### 2.2 Derivation — why it cannot drift

Most of it is **derived from Commander metadata** at runtime (`program.commands`, `cmd.options`, `cmd.registeredArguments`, `cmd.description()`). Only two things Commander doesn't know are layered on:

- `JSON_SUPPORTED` — the allowlist `Set` in `index.mjs`
- `RESPONSE_TYPES` — a declarative `Record<string, string[]>` in `manifest.mjs`

plus an optional `EXAMPLES` map. A drift-guard test (`src/lib/manifest.test.mjs`) asserts every registered command appears in the manifest and every JSON-supported command has a response-type entry, **so adding a command without describing it fails CI**.

### 2.3 Exact schema

Authoritative TypeScript in `src/types/manifest.d.ts`:

```ts
export interface ManifestOption {
  flag: string;                              // raw Commander spec, e.g. "-o, --out <path>"
  description: string;
  type: 'boolean' | 'string' | 'enum';       // 'string' when the option takes a value
  choices?: string[];                        // present iff type === 'enum'
  default?: unknown;
  negate?: boolean;                          // true for --no-foo style flags
}

export interface ManifestArgument {
  name: string;
  required: boolean;
  variadic: boolean;
  description: string;
}

export interface ManifestCommand {
  name: string;                              // FULLY-QUALIFIED, e.g. "theme build"
  description: string;
  arguments: ManifestArgument[];
  options: ManifestOption[];
  json: boolean;                             // from the JSON_SUPPORTED allowlist
  aliases?: string[];
  responseTypes?: string[];                  // discriminators this command can emit
  examples?: string[];
  subcommands?: ManifestCommand[];           // recursive
}

export interface CLIManifest {
  name: 'astryx';
  version: string;
  apiVersion: number;
  description: string;
  globalOptions: ManifestOption[];
  commands: ManifestCommand[];               // sorted by name.localeCompare
  jsonSupported: string[];                   // sorted
  responseTypes: Record<string, string[]>;   // flat index, keyed by command
}

export interface ManifestResponse { type: 'manifest'; data: CLIManifest; }
```

Type-derivation rules (`describeOption` in `manifest.mjs`):

```js
const takesValue = o.required || o.optional;      // Commander internals
d.type = takesValue ? 'string' : 'boolean';
if (Array.isArray(o.argChoices) && o.argChoices.length > 0) {
  d.choices = [...o.argChoices];
  d.type = 'enum';
}
if (o.defaultValue !== undefined) d.default = o.defaultValue;
if (o.negate) d.negate = true;
```

`fullName()` walks `cmd.parent` up to the root and space-joins, so subcommands are addressed as `"theme build"` everywhere (allowlist, response types, examples, hooks).

### 2.4 Verified live output (head)

```json
{
  "apiVersion": 1,
  "type": "manifest",
  "data": {
    "name": "astryx",
    "version": "0.1.7",
    "apiVersion": 1,
    "description": "Design system CLI — components, themes, and tooling",
    "globalOptions": [
      {"flag": "-V, --version", "description": "output the version number", "type": "boolean"},
      {"flag": "--zh", "description": "Output docs in Chinese Simplified", "type": "boolean"},
      {"flag": "--lang <locale>", "description": "…", "type": "enum", "choices": ["en","zh","dense"]},
      {"flag": "--detail <level>", "description": "…", "type": "enum", "choices": ["full","compact","brief"], "default": "full"}
    ],
    "commands": [ /* … */ ],
    "jsonSupported": ["component","discover","docs","doctor","hook","layout check","layout expand","layout grammar","manifest","search","swizzle","template","theme add","theme build","theme list","upgrade","validate-integration"],
    "responseTypes": { "component": ["component.list", "…"], "…": [] }
  }
}
```

### 2.5 Sample data envelopes (real output)

`astryx template --json` → `template.list`, 631 entries (43 `page` + 588 `block`):

```json
{
  "apiVersion": 1,
  "type": "template.list",
  "data": [
    {
      "id": "ai-chat",
      "name": "AI Chat Conversation",
      "displayName": "AI Chat Conversation",
      "description": "AI assistant conversation view with tool calls, …",
      "type": "page",
      "package": "@astryxdesign/core",
      "category": "AI Chat - Conversation",
      "isReady": true,
      "scaffold": false
    },
    {
      "id": "AlertDialogDeleteConfirmation",
      "name": "AlertDialog — Delete",
      "type": "block",
      "package": "@astryxdesign/core",
      "category": "components/AlertDialog",
      "componentsUsed": ["AlertDialog"],
      "isReady": true,
      "scaffold": false
    }
  ]
}
```

`astryx theme list --json` → `theme.list`: `{slug, displayName, description, maintained}`.

---

## 3. The templates / blocks system

### 3.1 On-disk layout

`packages/cli/templates/` — **shipped in the npm tarball** via `package.json#files: ["bin","src","templates","docs","CHANGELOG.md"]`. 1,277 files: 638 `.tsx`, 631 `.mjs`, 7 `.ts`, 1 `.json`.

```
packages/cli/templates/
├── pages/                       43 page templates
│   ├── blank/
│   │   ├── page.tsx             ← the source (fixed filename)
│   │   └── template.doc.mjs     ← the metadata (fixed stem `template`)
│   ├── dashboard/
│   ├── ai-chat/  login-split/  kanban-board/  ide/  incident-console/  …
│
├── blocks/
│   └── components/              156 component directories
│       ├── Button/
│       │   ├── ButtonShowcase.tsx        ← source
│       │   ├── ButtonShowcase.doc.mjs    ← same-stem metadata sibling
│       │   ├── ButtonVariants.tsx
│       │   ├── ButtonVariants.doc.mjs
│       │   └── …                          (588 block pairs total)
│       ├── Card/  Table/  ChatComposer/  AppShell/  …
│
└── themes/
    ├── manifest.json            ← generated by scripts/generate-cli-themes.mjs
    ├── neutral/{neutralTheme.ts, icons.tsx}
    └── butter|chocolate|gothic|matcha|stone|y2k/
```

### 3.2 File-format rules (precise)

Defined in `src/api/template.mjs`.

**Suffix families**, canonical-first precedence:

```js
const TEMPLATE_SUFFIXES = ['.template.ts', '.template.mjs', '.template.js']; // canonical
const DOC_SUFFIXES      = ['.doc.ts', '.doc.mjs', '.doc.js'];                // legacy, still accepted
const ALL_TEMPLATE_SUFFIXES = [...TEMPLATE_SUFFIXES, ...DOC_SUFFIXES];
const TEMPLATE_SUFFIX_RE = /\.(template|doc)\.(ts|mjs|js)$/;
```

**Pages** (`discoverPages`): each *directory* under `templates/pages/` is one template. Its id is the directory name. Metadata file = first existing `template.<suffix>`; source = **`page.tsx`** (hard-coded).

**Blocks** (`discoverBlocks`): a recursive walk of `templates/blocks/` for any file matching `TEMPLATE_SUFFIX_RE`. Its id is the **basename with the suffix stripped**; source must be the **same-stem `.tsx` sibling** — `if (!fs.existsSync(tsxPath)) continue;`. `category` is the POSIX-normalised path relative to `blocks/` (e.g. `components/Button`).

**Metadata module loading** (`loadDocModule`) accepts both export styles — `.ts` via `jiti` (`createJiti(import.meta.url, {jsx: true})`), `.mjs`/`.js` via native dynamic import:

```js
return docModule.default ?? docModule.doc;
```

**Real page metadata** — `templates/pages/dashboard/template.doc.mjs`:

```js
/** @type {import('../../../../core/src/docs-types').TemplateDoc} */
export const doc = {
  type: 'page',
  name: 'Analytics Dashboard',
  displayName: 'Analytics Dashboard',
  description: 'Analytics dashboard with KPI cards, charts, and data tables',
  isReady: true,
  category: 'Dashboard - Analytics',
  isHiddenFromOverview: true,
};
```

`templates/pages/blank/template.doc.mjs` additionally carries `scaffold: true` — the flag marking a template suitable as a starting skeleton.

**Real block metadata** — `templates/blocks/components/Button/ButtonShowcase.doc.mjs`:

```js
export const doc = {
  type: 'block',
  exampleFor: 'Button',
  name: 'Button — Variants',
  displayName: 'Button — Variants',
  description: 'All four button variants side by side: primary, secondary, ghost, and destructive. …',
  isReady: true,
  isShowcase: true,        // this block is THE canonical showcase for its component
  aspectRatio: 16 / 9,
  componentsUsed: ['Button', 'Layout'],
};
```

`componentsUsed` is the join key powering `astryx component <Name> --blocks` (`findRelatedBlocks`) and the showcase resolution ladder in `findShowcase()`: (1) block lives in a directory named after the component, (2) block lists the component in `componentsUsed`.

**Validation schema** — `src/schemas/template-schema.mjs` (kept free of any `@astryxdesign/core` import so `astryx init` doesn't need core's built `dist/`):

```js
export const BaseTemplateSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().min(1, 'description is required'),
  category: z.string().optional(),
  componentsUsed: z.array(z.string()).optional(),
  preview: z.object({image: z.string().optional(), aspectRatio: z.string().optional()}).strict().optional(),
}).strict();

export const TemplateEnvelopeSchema = BaseTemplateSchema.extend({
  type: z.enum(['page', 'block']),
});
```

Note the comment: *"Inline `source`/`sourceFile` are intentionally NOT part of v1 — a template's source is the required same-stem sibling file."* And the load-boundary philosophy: *"discovery does not check 'was it made by the factory', only the shape."*

**Note the asymmetry:** bundled core templates use the legacy `export const doc = {...}` and are loaded loosely by `loadDocModule` (schema-free). *Integration* templates go through `loadIntegrationDoc` → `TemplateEnvelopeSchema` and are strictly validated. A port can strict-validate both from day one.

### 3.3 Scaffolding — what actually happens on disk

`template(name, {targetPath})` in `src/api/template.mjs`, in order:

1. **Resolve** `name` against the merged discovery set (core pages + core blocks + external-package blocks + integration templates), narrowed by `--type` / `--package`. Zero matches → `ERR_UNKNOWN_TEMPLATE` with the full list as `suggestions`; more than one → `ERR_AMBIGUOUS_TEMPLATE`.
2. **Path-safety gate, before any mkdir**:
   ```js
   resolvedTarget = assertWithin(targetPath, cwd, {label: 'template target path'});
   // PathSafetyError → ERR_PATH_TRAVERSAL
   ```
   Absolute paths and `..` escapes are rejected. There is a dedicated test file per command (`template.path-safety.test.mjs`, `swizzle.path-safety.test.mjs`, `build-theme.path-safety.test.mjs`, `agent-docs.path-safety.test.mjs`).
3. **File vs directory target** — `isFilePathArg('./foo.tsx')` → write directly to that file. Otherwise treat as a directory; output filename is `page.tsx` for pages, or `path.basename(match.filePath)` for blocks.
4. **Asset sanitisation** — `stripTemplateAssetRefs()` replaces Meta's `lookaside.facebook.com` demo images with an **inline SVG data URI placeholder** so a scaffolded page renders with zero network setup. Genuine third-party URLs (brand logos) are deliberately untouched.
5. **Write** — a single `fs.writeFileSync`. Result: `{type: 'template.copy', data: {template, outputDir, fileName, filesCopied: 1}}`.

**One template = exactly one file.** There is no dependency graph, no multi-file expansion, no `npm install` side effect, no import rewriting. Compare `theme add` (`src/api/theme-add.mjs`), which copies N files listed in `manifest.json#themes[].files`, strips the Meta copyright header, and uses **staged temp-file writes with rollback**:

```js
const tmp = `${w.dest}.${process.pid}.tmp`;
fs.writeFileSync(tmp, contents);
staged.push({tmp, dest: w.dest});
// …then rename all; on any failure rm all staged tmps and throw ERR_WRITE_FAILED
```

`templates/themes/manifest.json` is the closest structural analogue to a shadcn `registry.json` — but it is **local and generated**:

```json
{
  "version": 1,
  "generatedBy": "scripts/generate-cli-themes.mjs",
  "themes": [
    {
      "slug": "neutral",
      "displayName": "Neutral",
      "description": "Restrained warm grays. Minimal and quiet, so the content stays the focus.",
      "maintained": true,
      "entry": "neutralTheme.ts",
      "exportName": "neutralTheme",
      "files": ["neutralTheme.ts", "icons.tsx"]
    }
  ]
}
```

### 3.4 Derived views over templates

- `--skeleton` → `extractSkeleton()` walks the source line-by-line from `export default function` / `return (`, capturing JSX opening tags with an allowlist of 15 `SPATIAL_PROPS` (`padding`, `gap`, `columns`, `minChildWidth`, `variant`, `density`, `maxWidth`, …), capped at 35 lines. Gives an agent the *shape* of a page without the whole file.
- `--show` (default when no target path) → returns the full source plus `extractComponents()`, a regex sweep of `/<(XDS)?([A-Z]\w+)/g` minus a `UBIQUITOUS` denylist (`Text`, `Heading`, `Button`, `HStack`, `VStack`, `Link`, `StackItem`, `Icon`).

---

## 4. Config file format

### 4.1 `src/config.mjs` is a 9-line re-export

```js
/**
 * Re-export of the config-authoring helper, which now lives in
 * `@astryxdesign/core/config` so an app's config file gets type feedback
 * without depending on the CLI. Kept here so existing
 * `@astryxdesign/cli/config` imports continue to work unchanged.
 */
export {createConfig} from '@astryxdesign/core/config';
```

The **runtime contract** lives in `src/lib/config-schema.mjs`; the **resolution logic** in `src/lib/project.mjs`.

### 4.2 Discovery

```js
export const CONFIG_BASENAMES = ['astryx.config.ts', 'astryx.config.mjs', 'astryx.config.js'];
```

`findConfigPath(startDir)` walks up (max 50 levels) to the **nearest `package.json`** and looks for the config as its *sibling*. More than one present → hard error: *"Multiple Astryx config files found in … Keep exactly one."* Zero present is fine — the project runs on defaults (`{integrations: []}`).

### 4.3 Full schema (`src/lib/config-schema.mjs`)

```js
export const AstryxConfigSchema = z.object({
  integrations: z.array(z.string()).optional(),
  issuesUrl: z.string().url().optional(),
  hooks: z.object({
    postCodemod: z.array(PostCodemodHookSchema).optional(),
  }).strict().optional(),
  experimental: z.object({
    xle: z.object({
      components: z.record(z.string(), XleComponentSchema).optional(),
    }).strict().optional(),
  }).strict().optional(),
}).strict();

export const PostCodemodHookSchema = z.object({
  name: z.string().optional(),
  buildCommand: Fn,                 // z.custom(v => typeof v === 'function')
}).strict();

export const XleComponentSchema = z.object({
  from: z.string(),
  description: z.string().optional(),
  default: z.boolean().optional(),
}).strict();
```

| Field | Type | Meaning |
|---|---|---|
| `integrations` | `string[]` | npm **package names** to load as integrations |
| `issuesUrl` | url | Where `swizzle` routes "tell the maintainers" feedback for **core** components. Default `https://github.com/facebook/astryx/issues/new`. |
| `hooks.postCodemod[]` | `{name?, buildCommand: Function}` | Run after `upgrade` codemods (e.g. rebuild a theme) |
| `experimental.xle.components` | `Record<string, {from, description?, default?}>` | Register custom components in the XLE layout grammar |

Every object is `.strict()` — unknown keys are a hard validation failure. `formatZodError(label, error)` joins issues as `path: message; path: message`.

Minimal real config (from `docs/cli-integrations.doc.mjs`):

```ts
import {createConfig} from '@astryxdesign/core/config';

export default createConfig({
  integrations: ['@acme/astryx-widgets'],
});
```

### 4.4 The integration manifest (the *second* config file)

`src/lib/integrations.mjs`. Package authors ship one of:

```js
export const MANIFEST_BASENAMES = ['astryx.integration.ts', 'astryx.integration.mjs', 'astryx.integration.js'];
```

as a **sibling of their `package.json`**. Schema:

```js
export const AstryxIntegrationSchema = z.object({
  components: z.string().optional(),   // dir root, resolved relative to the package
  templates: z.string().optional(),
  codemods:  z.string().optional(),
  issuesUrl: z.string().url().optional(),
}).strict();
```

Identity (`name`, `version`) comes from the package's `package.json`, **not** the manifest. Missing manifest → hard error; multiple manifests → hard error. Resolution is a plain path join, `node_modules/<scope>/<pkg>`:

```js
export function resolvePackageDir(packageName, cwd = process.cwd()) {
  return path.resolve(cwd, 'node_modules', ...packageName.split('/'));
}
```

### 4.5 `Project` — the single read API

`src/lib/project.mjs`. `Project.load(cwd, {cache})` is an async factory: find config → validate → load integrations. **Discovery is lazy and memoised** per instance (`components()`, `templates()`, `codemods(from, to)`), keyed by `cacheKey(configContentHash, cwd, kind)`.

The governing policy, quoted from the file header:

> **SKIP + WARN policy:** as a discovery method runs, per-integration work is guarded so one broken integration never throws out of discovery. Any `AstryxIntegrationIssue` encountered is collected into a private set and that integration's contributions are skipped.

Issues are deduped by `(package, code, message)` with `{package, code, severity, message}` shape. `issuesUrl(ref)` routes feedback: core → `config.issuesUrl` ?? default; integration → that integration's manifest `issuesUrl`.

### 4.6 A third, lighter extension point: the `astryx` package.json field

Separate from integrations, `discoverExternalPackages()` in `src/utils/paths.mjs` scans `node_modules` (recursing into `@scope/`) for packages with an `astryx` key:

```json
{ "astryx": { "docs": "./src", "category": "Common", "blocks": "./blocks/components" } }
```

Requires `astryx.docs` to be counted. Powers `astryx discover` and external block contributions. No config entry needed — pure convention.

---

## 5. Codemods

### 5.1 Structure

```
src/codemods/
├── registry.mjs               version → () => import('./transforms/vX/index.mjs')
├── runner.mjs                 orchestration, dry-run, corruption guards
├── run-codemod.mjs            shared execution primitives (code + config codemods)
├── ensure-jscodeshift.mjs     lazy dependency install
├── integration-discovery.mjs  find integration-contributed codemods
├── integration-runner.mjs
└── transforms/
    ├── v0.0.2/  … v0.1.7/     14 versions
    │   ├── index.mjs                     ordered manifest (default export array)
    │   ├── <transform-name>.mjs          the jscodeshift transform
    │   └── __tests__/<name>.test.mjs
```

`registry.mjs`:

```js
const registry = new Map([
  ['0.0.2',  () => import('./transforms/v0.0.2/index.mjs')],
  /* … */
  ['0.1.7',  () => import('./transforms/v0.1.7/index.mjs')],
]);
export async function getTransformsBetween(from, to) { /* exclusive of from, inclusive of to */ }
```

Per-version manifest (`transforms/v0.1.7/index.mjs`) is an **ordered array** — order is the run order:

```js
export default [
  {name: 'migrate-table-tableprops-to-direct-props', transform: …, meta: …},
  {name: 'rename-table-renderprops-styles-to-xstyle', transform: …, meta: …},
];
```

### 5.2 What the transforms actually do

Overwhelmingly **API-rename mechanics on JSX and imports**, plus a few CSS/token migrations:

- prop renames: `isShown` → `isOpen`, `endButton` → `endContent`, `endSlot` → `endContent`, `header` → `heading`, `title` → `heading`, `items` → `options`, `element` → `as`, `isStreaming` → `isStopShown`, `imperativeRef` → `handleRef`
- component renames: `Collapse` → `Collapsible`, `Attachments` → `Drawer`, `DatePicker` → `Input`, `BadgeDot` → `StatusDot`
- prop-shape migrations: `gap` string → numeric, `isFullBleed` → `padding`, `Table.tableProps` → direct props, `children` → `endContent` / `renderOption`
- token renames: radius, shadow, `text-color-active` → `accent`
- import-specifier / module-path rewrites: `drop-xds-prefix-imports`, `migrate-xds-module-specifiers`, `migrate-xds-declare-module`
- CSS-surface rewrites: `migrate-xds-css-surfaces`, `migrate-theme-selectors-to-data-attrs`
- experimental gating: `migrate-layout-components-to-experimental`

### 5.3 Public authoring API — `src/codemod.mjs`

Exported as `@astryxdesign/cli/codemod`. The factories are *stamp-only*; validation happens at the load boundary:

```js
export const CodemodSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  isOptional: z.boolean().optional().default(false),
  fileExtensions: z.array(z.string()).optional(),
  transform: Fn,
}).strict();

export const ConfigCodemodSchema = /* same, minus fileExtensions */;

export const CodemodEnvelopeSchema = z.discriminatedUnion('type', [
  CodemodSchema.extend({type: z.literal('code')}),
  ConfigCodemodSchema.extend({type: z.literal('config')}),
]);

export function createCodemod(def)       { return {...def, type: 'code'};   }
export function createConfigCodemod(def) { return {...def, type: 'config'}; }
```

Unified file-based contract (`run-codemod.mjs` header):

```
(file, api) => string | null | undefined
  file = {path, source}
  api  = {jscodeshift, stats, report}
```

Normalised entry shape across core and integrations: `{id, type: 'code'|'config', codemod: {title, transform, fileExtensions?, isOptional?}, package, version}`.

### 5.4 Safety machinery worth stealing regardless of framework

- **Dry-run by default.** `--apply` is opt-in.
- **Output corruption guards** (`runner.mjs`) — post-transform regex checks that abort the write:
  ```js
  const CORRUPTION_PATTERNS = [
    [/\[native code\]/g, '[native code] injection (prototype pollution in identifier map)'],
    [/function \w+\(\) \{ \[native code\] \}/g, 'native function toString() leak'],
  ];
  ```
- **`fixDirectiveCorruption()`** — works around a known jscodeshift bug that double-prints the semicolon on `'use client';` prologues. Applied centrally so every codemod inherits the fix.
- **`--skip-codemod <name...>`** — repeatable escape hatch: *"Re-run past a failed codemod by skipping it."*
- **`hooks.postCodemod`** — project config can register a rebuild command to run afterwards.

### 5.5 Does the Svelte port need an equivalent? — **Yes, but not yet.**

Rationale:

- **Necessity is structural, not framework-specific.** Any copy-in/eject design system creates code in users' repos that outlives the library's API. Astryx has 14 codemod versions inside 0.1.x. This need is *identical* in Svelte.
- **The mechanism must be replaced entirely.** jscodeshift/recast is a JS AST toolchain and does **not** parse `.svelte` files. A Svelte equivalent needs:
  - `svelte/compiler`'s `parse()` for the template AST + `svelte2tsx` or `acorn`/`ts-morph` for `<script>` blocks, or
  - **`magic-string` + targeted rewrites over the compiler's AST offsets**, which is the idiomatic Svelte-ecosystem answer (this is what `svelte-migrate` uses) and preserves formatting far better than a print-from-AST round trip.
- **shadcn-svelte precedent:** it ships `npx shadcn-svelte@latest migrate <name>` (e.g. `svelte-5`, `tailwind-v4`) — a small, named-migration surface rather than a version-range engine. That is the right v1 shape here.
- **Recommendation:** ship `astryx-svelte upgrade` with the **full CLI-level contract** (registry map, `--from`, `--apply` dry-run default, `--list`, `--skip-codemod`, corruption guard, `upgrade.list|status|run` JSON types, `hooks.postCodemod`) but with an **initially empty transform registry** and a `magic-string`-based runner. The command surface is 1:1 from day one; the transform library grows with the port's own version history. Do **not** port Astryx's 40+ React transforms — they migrate React prop names that will not exist in the Svelte components.

---

## 6. THE critical question: how are components resolved and installed?

### 6.1 The answer

**There is no registry. Components are distributed as a normal npm package, and the CLI reads that installed package's shipped `src/` directory.**

### 6.2 Evidence

**(a) The CLI makes exactly one network request in its entire source tree — the blog RSS feed.**

```
$ grep -rn "fetch(" --include=*.mjs packages/cli/src | grep -v test
packages/cli/src/api/blog.mjs:28:    res = await fetch(url, {
```

`grep -rni "registry\.json|registryUrl|REGISTRY_URL|https://.*registry"` over `packages/cli/src` → **zero matches**. The only `https://` literals in the source are issue-tracker URLs, doc links, and the `lookaside.facebook.com` image patterns being stripped out.

**(b) Component *source* is located inside `node_modules`.** `src/utils/paths.mjs`:

```js
export function findCoreDir(startDir = process.cwd()) {
  let dir = startDir;
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, 'packages', 'core');   // monorepo dev
    if (fs.existsSync(candidate)) return candidate;
    const nodeModules = path.join(dir, 'node_modules', '@astryxdesign', 'core');  // installed
    if (fs.existsSync(nodeModules)) return nodeModules;
    /* walk up */
  }
  return null;
}
```

Failure mode is `ERR_CORE_NOT_FOUND`: *"Could not find @astryxdesign/core package. Make sure you are inside the design system monorepo or have @astryxdesign/core installed."*

**(c) `@astryxdesign/core` deliberately ships `src/` to npm.** `packages/core/package.json`:

```json
"files": ["dist", "src", "locales", "docs.mjs", "groups.doc.mjs", "README.md", "CHANGELOG.md"]
```

and a real component directory is:

```
packages/core/src/Button/
├── Button.tsx        ← source, read by `swizzle` and `component --source`
├── Button.doc.mjs    ← metadata, read by `component`, `search`, `agent-docs`
├── Button.test.tsx   ← excluded from swizzle copy
└── index.ts
```

The `src/` directory **is** the registry — it just travels inside the tarball.

**(d) The primary consumption model is `import`, not copy.** `getNextSteps()` in `src/commands/init.mjs`:

```
1. Import base styles: import '@astryxdesign/core/reset.css'
   and import '@astryxdesign/core/astryx.css'
2. Import components: import { Button } from '@astryxdesign/core'
3. Optionally add a theme …
```

`@astryxdesign/core` has ~150 per-component export subpaths (`./Button`, `./Card`, …). Users `npm install` and import. **No `add` command exists.** There is no `astryx add button`.

**(e) `swizzle` is an *eject* escape hatch, not the install path.** `src/commands/swizzle.mjs`:

```js
const coreComponentDir = path.join(coreDir, 'src', name);   // node_modules/@astryxdesign/core/src/Button
```
copies every file except `.test.`, `.doc.`, `README.md` into `./components/astryx/<Name>/`, and rewrites escaping relative imports back to the owner package:

```js
export function rewriteImports(content, ownerPackage = CORE_PACKAGE) {
  return content.replace(/(from\s+['"])(\.\.\/.+?)(['"])/g, (m, prefix, importPath, suffix) => {
    const topDir = importPath.replace(/^\.\.\//, '').split('/')[0];
    return `${prefix}${ownerPackage}/${topDir}${suffix}`;   // '../theme/tokens' → '@astryxdesign/core/theme'
  });
}
```

Crucially, the CLI treats swizzling as a **failure signal**, printing after every copy:

> "Customizing a component often signals a gap in the design system. Let the maintainers know what you needed:"

…with a ready-to-run `gh issue create --repo <owner>/<repo> --title "[Button] Swizzle feedback"` when `gh` is installed. It also warns that swizzled StyleX source needs a StyleX compiler or it *"renders unstyled (no error)"*.

**(f) Extensibility is via npm + convention, not a hosted index.** Three tiers, all local:

| Tier | Mechanism | Where declared |
|---|---|---|
| Core | `findCoreDir()` → `node_modules/@astryxdesign/core/src` | implicit |
| External packages | `pkg.astryx = {docs, category, blocks}` | the package's own `package.json` |
| Integrations | `astryx.integration.{ts,mjs,js}` + listed in the consumer's `astryx.config` | two files |

### 6.3 Astryx vs shadcn/shadcn-svelte — the side-by-side

| Dimension | shadcn-svelte | Astryx |
|---|---|---|
| Source of truth | Hosted `registry.json` / `registry/{style}/{name}.json` over HTTPS | Files inside the installed npm package + the CLI tarball |
| Component delivery | `add` fetches JSON, writes files into `$lib/components/ui/` | `npm install @astryxdesign/core`; you `import` |
| Ownership | User owns every component from install | User owns nothing by default; `swizzle` to opt into ownership |
| Upgrades | Re-run `add` / manual diff | `npm update` + `astryx upgrade` codemods |
| Config | `components.json` (aliases, tailwind, style, ts) | `astryx.config.{ts,mjs,js}` (integrations, issuesUrl, hooks, experimental) |
| Third-party | Registry URLs / namespaced registries | npm packages with `astryx.integration.*` or a `pkg.astryx` field |
| Copy-in surface | **components** | **page templates, blocks, and themes** |
| Network | Required for `add` | **Zero**, except the hidden `blog` command |

**The architectural insight for the port:** Astryx's copy-in surface exists — it is just aimed one level *up* the composition ladder. shadcn-svelte copies you a `Button`. Astryx gives you a `Button` from npm and copies you an entire **dashboard page** or a **Card callout block**. `templates/` is Astryx's registry; it is bundled rather than hosted, and its unit is a composition, not a primitive.

---

## 7. Proposal: the `astryx-svelte` CLI

### 7.1 Guiding decisions

**D1 — Keep the npm-package distribution model; do NOT graft on a shadcn-style hosted registry.**
Astryx components are deeply interdependent (`Layout`/`Stack` primitives, a theme token system, an icon registry, `AppShell` composition). Copying a `Button` in isolation would drag half the library. A 1:1 port means `@astryx-svelte/core` is an installed dependency and `import { Button } from '@astryx-svelte/core'` is the happy path. **Ship `src/` in `files`** so the CLI can read docs and source — that single `package.json` line is what makes the whole CLI work.

**D2 — Keep templates/blocks bundled in the CLI package.** Local, versioned, offline, atomic with the CLI. Do not host them.

**D3 — Add a hosted registry only as a *later, additive* layer**, if third-party template/block sharing becomes a goal. The `Project`/integration abstraction already gives package-based third-party contribution without any hosting. If you do add it, model it as a `--registry <url>` source that produces the *same* internal template record shape — never as a replacement for the bundled path.

**D4 — Port the JSON contract, the manifest, and the error codes verbatim.** They are framework-agnostic and are the reason the CLI is agent-friendly. `apiVersion: 1` and every `ERR_*` code should carry over unchanged so agent tooling written against Astryx works against the Svelte port.

**D5 — Rename only what is React-specific.** `swizzle` stays (it's a Docusaurus-lineage term, not a React one).

### 7.2 Command-for-command mapping

**Identical** (same name, args, flags, response types; only the payload's language changes):

| Command | Notes for the port |
|---|---|
| `manifest` | Byte-for-byte port of `lib/manifest.mjs`. `name: 'astryx-svelte'`. |
| `docs [topic] [section]` | Port `docs/*.doc.mjs`; rewrite React code samples to Svelte. Keep `--lang en\|zh\|dense`. |
| `search <query>` | Unchanged ranking logic. |
| `build [query]` | Playbook text needs Svelte rules: *"no raw `<div>` for layout"*, *"no `style=` — use props + tokens"*, *"wrap in `<Theme>`"*. |
| `discover [query]` | `pkg.astryx` convention unchanged. |
| `doctor` | Checks change (SvelteKit version, `svelte.config.js`, vite plugin, CSS imports) but the command shape and `doctor` envelope don't. |
| `validate-integration [package]` | Unchanged. |
| `theme list` / `theme add [slug] [path]` | Unchanged; `templates/themes/manifest.json` port as-is. |
| `theme build <file>` | Unchanged CLI shape; emits CSS + JS the same way. |
| `blog [slug]` | Optional. Drop unless there's a blog. |
| `postinstall` | Keep the banner. |

**Adapted** (same command, changed internals):

| Command | Change |
|---|---|
| `component [name]` | `--props` becomes the **Svelte props + snippets + events** table. Discovery regex `/^[A-Z]\w+\.tsx$/` → `/^[A-Z]\w+\.svelte$/`; doc sibling `Button.doc.mjs` stays `.mjs` (framework-neutral metadata). Add `--snippets` alongside `--props`, or fold snippets into the props payload as a `snippets: []` array. |
| `hook [name]` | **Rename to `util`, or keep `hook` as an alias.** Svelte has no hooks; the equivalents are runes-based composables / `.svelte.ts` modules. Recommend registering the command as `util` with `.alias('hook')` — the manifest's `aliases?: string[]` field already carries it, so agents see both. Response types become `util.list`, `util.detail`, `util.detail.params`. |
| `swizzle [component]` | Source dir `node_modules/@astryx-svelte/core/src/<Name>/`; copy `.svelte`/`.ts`/`.css`, exclude `.test.`/`.doc.`/`README.md`. `rewriteImports` is unchanged logic. **Drop the StyleX warning entirely** — replace it with whatever the port's styling story is (see below). |
| `template [name] [path]` | `page.tsx` → **`+page.svelte`** for pages, `<Name>.svelte` for blocks. Everything else — suffix precedence, same-stem sibling rule, `--skeleton`, `--type`, `--package`, path safety, asset stripping — is unchanged. `extractComponents`/`extractSkeleton` must be rewritten against `svelte/compiler`'s `parse()` AST instead of the line-oriented JSX regex; this is a *net improvement* since you get a real AST. |
| `init` | Same flags. Features `agents`, `theme`, `template`. Agent-doc targets identical (`AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, `.cursorrules`). `detectStylingSystem()` → detect Tailwind vs plain CSS vars vs the port's chosen system. Next-steps text becomes SvelteKit-shaped (`src/routes/+layout.svelte`, `app.css`). |
| `upgrade` | Full flag surface preserved; empty registry at v1; `magic-string` + `svelte/compiler` runner replacing jscodeshift. See §5.5. |
| `layout expand\|check\|grammar` | XLE grammar is a *layout* DSL, not a React one — port it. `expand` emits `.svelte` instead of `.tsx`. `experimental.xle.components` config carries over unchanged. **Lowest priority**; it's an isolated subsystem (`src/lib/xle/`) that can land in a later milestone without blocking anything. |

**Not needed / drop:**

- Nothing structural. Every command has a Svelte-meaningful analogue.
- `--zh` / `--dense` doc variants are optional at v1 (the upstream ships `principles`, `theme`, `tokens`, `layout` in dense and `principles`, `theme`, `tokens` in zh). Keep the *flags* in the manifest so the surface matches; fall back to `en` with a note when a variant is absent.

**Consider adding (a deliberate divergence):**

- `astryx-svelte add <block|template>` as an **alias of `template`**. shadcn-svelte users' muscle memory is `add`. Registering `.alias('add')` on `template` costs nothing, shows up in the manifest's `aliases` field, and creates zero new surface. This is the single highest-value ergonomic concession to the Svelte ecosystem.

### 7.3 Package layout for the port

```
packages/cli/
├── bin/astryx-svelte.mjs        Node preflight gate + realpath + error boundary
├── package.json                 files: ["bin","src","templates","docs"]
├── docs/*.doc.mjs               reference docs (Svelte-rewritten samples)
├── templates/
│   ├── pages/<id>/{+page.svelte, template.doc.mjs}
│   ├── blocks/components/<Component>/{<Name>.svelte, <Name>.doc.mjs}
│   └── themes/{manifest.json, <slug>/…}
└── src/
    ├── index.mjs                Commander program, JSON_SUPPORTED, hooks
    ├── api/                     programmatic layer (component, template, search, doctor, …)
    ├── commands/                thin Commander wrappers over api/
    ├── codemods/                registry + magic-string runner (empty v1)
    ├── lib/                     manifest, json, json-shim, error-codes, project,
    │                            integrations, config-schema, component-discovery
    ├── schemas/                 doc-schema.mjs, template-schema.mjs (zod)
    ├── types/                   .d.ts contracts incl. manifest.d.ts
    └── utils/                   paths, path-safety, package-manager, semver
```

Keep the **api/ ↔ commands/ split**. `src/api/*.mjs` returns `{type, data}` and throws `AstryxError(message, suggestions, code)`; `src/commands/*.mjs` is a thin Commander shell that either `jsonOut(result.type, result.data)` or renders human text. This is what makes `@astryxdesign/cli/api` a usable library and makes the JSON contract cheap to guarantee. Mirror the `exports` map too:

```json
"exports": {
  ".": "./bin/astryx-svelte.mjs",
  "./json": {"types": "./src/types/index.d.ts", "import": "./src/lib/parse.mjs"},
  "./api": {"types": "./src/types/api.d.ts", "import": "./src/api/index.mjs"},
  "./config": …, "./integration": …, "./doc": …, "./template": …, "./codemod": …
}
```

### 7.4 Build order

1. **Skeleton + contract** — `bin/`, `index.mjs`, `lib/json.mjs`, `lib/json-shim.mjs`, `lib/error-codes.mjs`, `lib/manifest.mjs`, `lib/cli-error.mjs`, `types/manifest.d.ts`, plus the drift-guard test. Ship `manifest --json` first: it is the acceptance test for everything after it.
2. **Config + project** — `config-schema.mjs`, `integrations.mjs`, `project.mjs`, `module-loader.mjs`, `config-cache.mjs`, `utils/path-safety.mjs`. Nearly verbatim ports.
3. **Read commands** — `component`, `util`(+`hook` alias), `docs`, `search`, `discover`. Requires `component-discovery.mjs` adapted to `.svelte` and `@astryx-svelte/core` shipping `src/`.
4. **Write commands** — `template`(+`add` alias), `theme add|list`, `swizzle`, `init`. The scaffolding path-safety + staged-write patterns port directly.
5. **`build`, `doctor`, `validate-integration`.**
6. **`upgrade`** shell with empty registry + `magic-string` runner.
7. **`theme build`, `layout *`** — heaviest and most independent; last.

### 7.5 Explicit risks

- **Ship `src/` from core.** If `@astryx-svelte/core` publishes only `dist/`, `component --source`, `swizzle`, and `agent-docs` all break with `ERR_NO_SOURCE`. Add a CI check on `package.json#files`.
- **Node floor.** Astryx requires ≥ 22.13.0 for `styleText`. Decide the floor early; the preflight gate in `bin/` depends on it and must stay dependency-free.
- **jiti + `.svelte`.** `jiti` loads `.ts` doc files. If block/template metadata is authored in `.ts`, jiti with `{jsx: true}` handles TS fine — but never point jiti at a `.svelte` file. Keeping metadata in `.mjs`/`.ts` and source in `.svelte` (the same-stem sibling rule) sidesteps this entirely — another reason the upstream's separation is worth preserving exactly.
- **Windows paths.** The upstream normalises with `toPosixPath()` before building category strings and uses `path.sep` splits for integration ids. Keep both; the block `category` field is user-visible and must be `components/Button`, not `components\Button`.
- **`--skeleton` rewrite.** The only place where the port cannot copy the algorithm. Budget for a `svelte/compiler` AST walk that emits the same shape (indented tag names + allowlisted spatial props, ≤35 lines).

---

## Appendix A — file index (upstream paths)

| Concern | File |
|---|---|
| Bin / preflight / error boundary | `packages/cli/bin/astryx.mjs` |
| Program, allowlist, hooks, `manifest` cmd | `packages/cli/src/index.mjs` |
| Capability manifest builder | `packages/cli/src/lib/manifest.mjs` |
| Manifest types | `packages/cli/src/types/manifest.d.ts` |
| JSON envelopes + stdout discipline | `packages/cli/src/lib/json.mjs` |
| Commander parse-time JSON shim | `packages/cli/src/lib/json-shim.mjs` |
| Stable error codes | `packages/cli/src/lib/error-codes.mjs` |
| Config re-export | `packages/cli/src/config.mjs` |
| Config + integration zod schemas | `packages/cli/src/lib/config-schema.mjs` |
| Config discovery + `Project` | `packages/cli/src/lib/project.mjs` |
| Integration manifest loading | `packages/cli/src/lib/integrations.mjs` |
| Core dir / external package scan | `packages/cli/src/utils/paths.mjs` |
| Component discovery | `packages/cli/src/lib/component-discovery.mjs` |
| Component doc zod schema | `packages/cli/src/schemas/doc-schema.mjs` |
| Template zod schema | `packages/cli/src/schemas/template-schema.mjs` |
| Template discovery + scaffold | `packages/cli/src/api/template.mjs` |
| Template command | `packages/cli/src/commands/template.mjs` |
| Swizzle (eject) | `packages/cli/src/commands/swizzle.mjs` |
| Theme add | `packages/cli/src/api/theme-add.mjs` |
| Theme build | `packages/cli/src/commands/build-theme.mjs` |
| Init wizard | `packages/cli/src/commands/init.mjs` |
| Agent docs writer | `packages/cli/src/commands/agent-docs.mjs` |
| Build playbook | `packages/cli/src/commands/build.mjs` |
| Codemod registry | `packages/cli/src/codemods/registry.mjs` |
| Codemod runner + corruption guards | `packages/cli/src/codemods/runner.mjs` |
| Codemod authoring API | `packages/cli/src/codemod.mjs` |
| Upgrade command | `packages/cli/src/commands/upgrade.mjs` |
| XLE layout DSL | `packages/cli/src/lib/xle/` |
| Integration authoring guide | `packages/cli/docs/cli-integrations.doc.mjs` |
| Agent guide | `packages/cli/docs/working-with-ai.doc.mjs` |
| Bundled templates | `packages/cli/templates/` |
| Core component + doc example | `packages/core/src/Button/{Button.tsx, Button.doc.mjs}` |
| Core publish surface | `packages/core/package.json` (`files: [..., "src", ...]`) |

## Appendix B — reproducing the evidence

The upstream clone has no `node_modules`. To run the CLI:

```bash
cp -r <upstream>/packages/cli/{bin,src,templates,docs,package.json} ./clicopy/
mkdir deps && cd deps && echo '{"name":"deps","private":true}' > package.json
npm install commander@12 zod@4 @clack/prompts jiti
cp -r deps/node_modules clicopy/node_modules
cd clicopy && node bin/astryx.mjs manifest --json
```

(Installing directly into the copied `package.json` fails with `ETARGET` — its devDependencies reference unpublished workspace packages `@astryxdesign/lab` etc.)

Commands that need `@astryxdesign/core` on disk (`component`, `hook`, `swizzle`, `search`, `doctor`) will report `ERR_CORE_NOT_FOUND` in this setup — itself confirming §6: **the CLI cannot describe a component without the package installed locally, because there is nowhere else to get it from.**
