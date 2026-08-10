# @astryx-svelte/cli

The CLI is the primary interface for working with the design system, for humans and machines alike.
It provides component documentation, design tokens, reference topics, theming tools, page templates
and upgrade codemods, all reachable as terminal commands, as a typed JSON API, or as programmatic
imports. AI agents and build tools use the same API that powers the CLI, so an agent can run an
end-to-end frontend loop without scraping `--help`.

```bash
npm install -D @astryx-svelte/cli
```

Everything below is written as `pnpm exec astryx-svelte …`, which is the form that works once the
package is a dependency of your project, and is what the CLI itself prints in its follow-up
commands. From a clone of [the repository](https://github.com/devrohit06/astryx-svelte), the
equivalent is `node packages/cli/bin/astryx-svelte.mjs …`.

The binary is `astryx-svelte`, not `astryx`. Astryx's own CLI publishes `astryx`, and bare `astryx`
on npm is an unrelated package; a distinct name means both can be installed in the same project.

Everything the CLI prints is also on [the documentation site](https://astryx-svelte.rohitk06.in/) —
both read the same `.doc.mjs` modules, so the two cannot drift.

## Finding things: `astryx-svelte search`

When you do not know whether what you need is a component, a util, a docs topic or a template,
search across all of them at once. Results are ranked by relevance — name and keyword matches
outrank incidental prose mentions, with fuzzy matching for typos — and each carries the follow-up
command to run:

```text
$ pnpm exec astryx-svelte search button

Results for "button" (20)

name:        Button
domain:      component
import:      @astryx-svelte/core
description: Button triggers an action when clicked. Use it for form submissions, …
command:     pnpm exec astryx-svelte component Button

name:        IconButton
domain:      component
import:      @astryx-svelte/core
description: A button that shows only an icon with no visible text. …
command:     pnpm exec astryx-svelte component IconButton

name:        useClickableContainer
domain:      hook
import:      @astryx-svelte/core/hooks
description: Makes a container element clickable while preserving nested interactive …
command:     pnpm exec astryx-svelte util useClickableContainer
```

Options:

- `--type <component|hook|doc|template>` — restrict to a single domain
- `--limit <n>` — cap the number of results (default 20)
- `--detail` — include the import path and the match reason/score
- `--json` — typed `{ type: 'search', data: { query, results } }` envelope

## Commands

| Command                | Description                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `init`                 | Initialize the design system in your project: theming, agent docs, template pointers |
| `component`            | List components or print docs, props, usage examples, and source                     |
| `util` (alias `hook`)  | List the runes-based composables and print their docs                                |
| `search`               | Find components, utils, docs and templates in one ranked, cross-domain result set    |
| `docs`                 | Print reference documentation (tokens, theme, color, typography, spacing, …)         |
| `template` (as `add`)  | Inject a page or block template into your project                                    |
| `build`                | A composition kit for a page idea, or the page-building playbook with no arguments   |
| `layout`               | Expand, check, and explain compressed layout expressions (XLE/XLO)                   |
| `swizzle`              | Copy component source into your project for deep customization                       |
| `theme`                | `theme list`, `theme add`, and `theme build` — scaffold and compile themes           |
| `upgrade`              | Run codemods to migrate between versions                                             |
| `discover`             | Discover external packages and the components they contribute                        |
| `validate-integration` | Validate an integration package's manifest and contributions                         |
| `doctor`               | Diagnose your setup and report problems with fixes (CI-friendly via exit code)       |

`manifest` is a fifteenth command, described under
[Capability manifest](#capability-manifest-agent-discovery).

Astryx also ships a `blog` command, which reads its published RSS feed. It is not ported — this
project has no feed to read.

### Global options

These flags work with any command:

- `--json` — output a typed JSON envelope: `{ apiVersion, type, data }` (errors:
  `{ apiVersion, error, code, suggestions? }`)
- `--detail <level>` — detail level for list views, increasing in size: `brief` (names only,
  default for `--list`) < `compact` (names + one-line descriptions) < `full` (full docs per entry).
  Single-item views default to `full`
- `--zh` — output docs in Chinese Simplified
- `--dense` — compressed format (token-efficient, useful for AI agents)
- `--lang <locale>` — language/format shorthand (`en`, `zh`, `dense`)

`--zh` and `--dense` read the `.doc.zh.mjs` / `.doc.dense.mjs` overlays a doc ships. Where an
overlay is absent the English doc is returned unchanged.

## JSON API

Every command supports `--json` for machine-readable output. Responses are typed envelopes:

```json
{ "apiVersion": 1, "type": "component.detail", "data": { "name": "Button" } }
```

Errors:

```json
{
	"apiVersion": 1,
	"error": "No component named \"Buttn\"",
	"code": "ERR_UNKNOWN_COMPONENT",
	"suggestions": [{ "name": "Button", "reason": "similar name (distance 1)" }]
}
```

The `code` field is a **stable, machine-readable identifier**. Branch on it, never on the
human-readable `error` string, which changes freely as the wording improves. Every error envelope
carries a `code`, falling back to `ERR_UNKNOWN` when no more specific code applies. The same `code`
is exposed on thrown `AstryxError` instances from the programmatic API, so both surfaces agree.

Codes are **append-only**: once shipped, a code's meaning never changes and a code is never removed.
New error conditions get new codes.

```typescript
import { isError } from '@astryx-svelte/cli/json';

const result = parseResponse(raw);
if (isError(result)) {
	switch (result.code) {
		case 'ERR_UNKNOWN_COMPONENT':
			// suggest the closest match
			break;
		case 'ERR_CORE_NOT_FOUND':
			// prompt the user to install @astryx-svelte/core
			break;
		default:
			console.error(result.error);
	}
}
```

### Error codes

The list is transcribed from Astryx's own, in its order and with its groupings — an agent written
against Astryx branches on the same strings here. Codes for commands this port has not landed are
present and unused, exactly as an append-only list requires.

| Code                      | Meaning                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `ERR_UNKNOWN`             | Generic fallback for any error without a more specific code.                           |
| `ERR_UNKNOWN_COMMAND`     | A top-level command name was not recognized (e.g. `astryx-svelte bogus`).              |
| `ERR_UNKNOWN_SUBCOMMAND`  | A subcommand under a group was not recognized (e.g. `astryx-svelte theme bogus`).      |
| `ERR_INVALID_OPTION`      | An unknown flag was passed, or `--json` was used on a command that doesn't support it. |
| `ERR_INVALID_ARGUMENT`    | An option/argument value was rejected, or required flags were missing.                 |
| `ERR_MISSING_ARGUMENT`    | A required positional argument was omitted (e.g. `theme build` with no file).          |
| `ERR_INVALID_LANG`        | `--lang` was given a value outside its choices (`en`, `zh`, `dense`).                  |
| `ERR_INVALID_DETAIL`      | `--detail` was given a value outside its choices (`full`, `compact`, `brief`).         |
| `ERR_NODE_VERSION`        | The running Node.js version is below the supported minimum.                            |
| `ERR_CORE_NOT_FOUND`      | `@astryx-svelte/core` could not be located (not installed / not in a monorepo).        |
| `ERR_UNKNOWN_COMPONENT`   | No component matched the requested name.                                               |
| `ERR_UNKNOWN_HOOK`        | No util matched the requested name.                                                    |
| `ERR_UNKNOWN_TOPIC`       | No docs topic matched the requested name.                                              |
| `ERR_UNKNOWN_SECTION`     | A docs topic exists but the requested section within it does not.                      |
| `ERR_UNKNOWN_CATEGORY`    | A `--category` filter value did not match any known category.                          |
| `ERR_UNKNOWN_TEMPLATE`    | No template matched the requested name.                                                |
| `ERR_AMBIGUOUS_TEMPLATE`  | A template id matched more than one template (narrow with `--type`/`--package`).       |
| `ERR_AMBIGUOUS_COMPONENT` | A component name is owned by more than one package (narrow with `--package`).          |
| `ERR_UNKNOWN_THEME`       | No theme matched the requested slug (`theme add`).                                     |
| `ERR_UNKNOWN_PACKAGE`     | No package matched the requested name (`discover`).                                    |
| `ERR_UNKNOWN_AGENT`       | An unrecognized `--agent` value was passed (agent docs / `init`).                      |
| `ERR_UNKNOWN_FEATURE`     | An unrecognized `--features` value was passed to `init`.                               |
| `ERR_UNKNOWN_CODEMOD`     | A `--codemod` value did not match any registered codemod (`upgrade`).                  |
| `ERR_CODEMOD_FAILED`      | One or more codemods failed during an upgrade run.                                     |
| `ERR_NOT_FOUND`           | A discover/lookup query matched nothing in any package.                                |
| `ERR_NO_DOC`              | A component exists but has no typed `.doc.mjs` file.                                   |
| `ERR_NO_SHOWCASE`         | No showcase exists for the requested component.                                        |
| `ERR_NO_SOURCE`           | No source file could be located for the component/template.                            |
| `ERR_INVALID_DOC`         | A component's docs failed validation (malformed `.doc.mjs`).                           |
| `ERR_FILE_NOT_FOUND`      | A required input file did not exist.                                                   |
| `ERR_FILE_EXISTS`         | Refused to overwrite an existing file in non-interactive mode.                         |
| `ERR_PATH_TRAVERSAL`      | A path escaped its allowed root, or a name contained traversal markers.                |
| `ERR_WRITE_FAILED`        | Writing output files failed (and was rolled back).                                     |
| `ERR_THEME_INVALID`       | A theme definition was missing a required property (e.g. `name`).                      |
| `ERR_THEME_LOAD`          | A theme file could not be loaded / parsed into a `defineTheme` result.                 |
| `ERR_VERSION_DETECT`      | The current `@astryx-svelte/core` version could not be detected.                       |
| `ERR_INVALID_VERSION`     | A `--from`/`--to` value was not a valid semver string.                                 |
| `ERR_DEP_MISSING`         | A required external dependency is missing.                                             |
| `ERR_GH_CLI`              | GitHub CLI (`gh`) is not installed or not authenticated.                               |
| `ERR_UNKNOWN_POST`        | No blog post matched the requested slug in the feed.                                   |
| `ERR_FETCH_FAILED`        | A network fetch (RSS feed or post text) failed.                                        |
| `ERR_LAYOUT_PARSE`        | A layout expression could not be parsed.                                               |
| `ERR_LAYOUT_INVALID`      | A layout expression parsed but is not valid.                                           |

## Capability manifest (agent discovery)

Agents do not have to scrape `--help` to learn the CLI. A single call returns a **self-describing
manifest**: every command, its arguments, its flags (with types, choices and defaults), whether it
supports `--json`, and the response `type` discriminators it can emit. Think of it as an OpenAPI
spec for the CLI.

```bash
pnpm exec astryx-svelte manifest --json    # dedicated surface — type: "manifest"
pnpm exec astryx-svelte --json             # bare invocation — same payload under data.manifest
```

Shape:

```jsonc
{
	"apiVersion": 1,
	"type": "manifest",
	"data": {
		"name": "astryx-svelte",
		"version": "0.0.0",
		"description": "Design system CLI — components, themes, and tooling",
		"globalOptions": [
			{ "flag": "--json", "type": "boolean", "description": "Output as typed JSON…" },
			{ "flag": "--lang <locale>", "type": "enum", "choices": ["en", "zh", "dense"] },
			{
				"flag": "--detail <level>",
				"type": "enum",
				"choices": ["full", "compact", "brief"],
				"default": "full"
			}
		],
		"commands": [
			{
				"name": "component",
				"description": "List components or print component docs",
				"arguments": [{ "name": "name", "required": false, "variadic": false }],
				"options": [
					{ "flag": "--props", "type": "boolean", "description": "Print only the props table" }
				],
				"json": true,
				"responseTypes": ["component.list", "component.detail", "component.detail.props", "…"],
				"examples": ["astryx-svelte component Button --props --json"]
			}
			// …one entry per command; subcommands (e.g. `theme build`) nest under `subcommands`
		],
		"jsonSupported": ["component", "docs", "…"],
		"responseTypes": { "component": ["component.list", "…"], "theme build": ["theme.build"] }
	}
}
```

The manifest is **derived from Commander metadata** (commands, arguments, options) so it cannot
drift from the real command definitions. The two facts Commander does not track — `--json` support
and emitted response types — are layered on from a `JSON_SUPPORTED` allowlist and a declarative
`RESPONSE_TYPES` map, guarded by a drift test that fails **in both directions**: a registered
command missing from the tables fails, and a table entry naming a command that does not exist fails
too.

**Backwards-compatible:** the bare `astryx-svelte --json` envelope keeps `type: "help"` and its
original shallow fields (`name`, `version`, `commands` as a `string[]` of names, `jsonSupported`);
the structured manifest is additive under `data.manifest`. For the standalone envelope
(`type: "manifest"`), use `astryx-svelte manifest --json`.

## Programmatic API

The same logic that powers `astryx-svelte --json` is available as importable functions:

```typescript
import {
	component,
	docs,
	discover,
	template,
	util,
	search,
	AstryxError
} from '@astryx-svelte/cli/api';

// Same result as: astryx-svelte --json component Button
const btn = await component('Button');
btn.type; // 'component.detail'
btn.data.name; // 'Button' (typed as ComponentDoc)

// Same result as: astryx-svelte --json component --list
const list = await component(undefined, { list: true });

// Same result as: astryx-svelte --json docs principles
const principles = await docs('principles');
principles.data.title; // 'Principles'

// Same result as: astryx-svelte --json util useMediaQuery
const useMediaQuery = await util('useMediaQuery');
useMediaQuery.data.params; // typed as HookParamDoc[]

// Errors throw AstryxError with a stable .code and optional .suggestions
try {
	await component('Buttn');
} catch (e) {
	e.message; // 'No component named "Buttn"'
	e.code; // 'ERR_UNKNOWN_COMPONENT' (stable; branch on this)
	e.suggestions; // [{ name: 'Button', reason: 'similar name (distance 1)' }]
}
```

The command handlers are thin wrappers around these functions: they parse args, call the API, then
format the output. That is what guarantees `@astryx-svelte/cli/api` and `astryx-svelte --json`
always return identical data.

Astryx names the composables surface `hook`; this port names it `util`, because a Svelte composable
is not a React hook. `hook` remains as a command alias so a command written against Astryx keeps
working, but the API function and the response types are `util.*`.

### Consumer utilities

If you spawn the CLI as a subprocess rather than importing the API:

```typescript
import { parseResponse, isError } from '@astryx-svelte/cli/json';
import type {
	ComponentDetailResponse,
	ComponentListResponse,
	DocsListResponse
	// …import the response types for the commands you consume
} from '@astryx-svelte/cli/json';

// parseResponse returns the structural { apiVersion, type, data } envelope; `data`
// is `unknown` until you narrow it. Reconstruct the union you care about from the
// per-command response types, then narrow on `type`:
type MyResponse = ComponentDetailResponse | ComponentListResponse | DocsListResponse;

const result = parseResponse(stdout);
if (isError(result)) {
	console.error(result.error);
} else {
	const r = result as MyResponse;
	switch (r.type) {
		case 'component.detail':
			r.data.name; // narrowed to ComponentDoc
			break;
	}
}
```

Prefer narrowing at the call site? Wrap `assertResponse`, which throws on error or type mismatch:

```typescript
import { assertResponse } from '@astryx-svelte/cli/json';
import type { ComponentDetailResponse } from '@astryx-svelte/cli/json';

type MyResponse = ComponentDetailResponse; /* | …others */

function assertTyped<T extends MyResponse['type']>(raw: unknown, type: T) {
	return assertResponse(raw, type) as Extract<MyResponse, { type: T }>;
}

const detail = assertTyped(stdout, 'component.detail');
detail.data.name; // narrowed
```

### Type discriminators

Every response carries a `type` string that identifies it:

| Command                                              | Type                                    |
| ---------------------------------------------------- | --------------------------------------- |
| `component [--list] [--detail brief\|compact\|full]` | `component.list` (see `data.detail`)    |
| `component <name>`                                   | `component.detail`                      |
| `component <name> --props`                           | `component.detail.props`                |
| `component <name> --source`                          | `component.detail.source`               |
| `component <name> --showcase`                        | `component.detail.showcase`             |
| `component <name> --blocks`                          | `component.detail.blocks`               |
| `util [--list]`                                      | `util.list`                             |
| `util <name>`                                        | `util.detail`                           |
| `util <name> --params`                               | `util.detail.params`                    |
| `docs`                                               | `docs.list`                             |
| `docs <topic>`                                       | `docs.detail`                           |
| `docs <topic> <section>`                             | `docs.detail.section`                   |
| `search <query>`                                     | `search`                                |
| `template [--list]`                                  | `template.list`                         |
| `template <name>`                                    | `template.show`                         |
| `template <name> --skeleton`                         | `template.skeleton`                     |
| `template <name> [path]`                             | `template.copy`                         |
| `build`                                              | `build.help`, `build.kit`               |
| `layout expand` / `check` / `grammar`                | `layout.expand` / `.check` / `.grammar` |
| `swizzle [--list]`                                   | `swizzle.list`                          |
| `swizzle <component>`                                | `swizzle.copy`                          |
| `theme list`                                         | `theme.list`                            |
| `theme add [slug]`                                   | `theme.list`, `theme.add`               |
| `theme build <file>`                                 | `theme.build`, `theme.build.check`      |
| `upgrade --list`                                     | `upgrade.list`                          |
| `upgrade [--apply]`                                  | `upgrade.status`, `upgrade.run`         |
| `discover`                                           | `discover.list`                         |
| `discover @scope/name`                               | `discover.detail`                       |
| `discover @scope/name/Comp`                          | `discover.detail.doc`                   |
| `discover <search>`                                  | `discover.search`                       |
| `validate-integration <package>`                     | `integration.validate`                  |
| `doctor`                                             | `doctor`                                |
| `manifest`                                           | `manifest`                              |

## Doctor

`astryx-svelte doctor` runs health checks against your project and environment and reports each as
`ok` / `warn` / `fail` / `info`, with an actionable fix for anything that is not passing. It is
read-only: it never installs or mutates anything, so it is safe to run anywhere, including CI.

```text
$ pnpm exec astryx-svelte doctor
astryx-svelte doctor - diagnosing your setup

status:  [ok]
check:   Node.js version
message: Node v22.13.0 meets the minimum (>=22.13.0).

status:  [ok]
check:   @astryx-svelte/core installed
message: @astryx-svelte/core resolved (v0.0.0).

status:  [warn]
check:   Theme packages
message: No @astryx-svelte/theme-* packages are installed.
fix:     Install a theme, e.g. `npm install @astryx-svelte/theme-neutral`, then import its CSS.

Summary: 3 passed, 3 warnings, 0 failures, 2 info
```

### Checks

| Check                      | Status it can return | What it verifies                                                      |
| -------------------------- | -------------------- | --------------------------------------------------------------------- |
| Node.js version            | ok / fail            | Running Node meets the CLI's minimum                                  |
| `@astryx-svelte/core`      | ok / fail            | Core is resolvable from the project                                   |
| Version alignment          | ok / warn / info     | Installed core is in step with the CLI                                |
| Theme packages             | ok / warn            | An `@astryx-svelte/theme-*` package is installed and a theme is wired |
| `astryx-svelte.config.mjs` | ok / fail / info     | Config (if present) loads cleanly with a valid shape                  |
| AI agent docs              | ok / warn / info     | Agent docs exist and contain the Astryx section markers               |
| Peer dependencies          | ok / warn / info     | Core's peer dependency (`svelte`) is installed                        |
| Package manager            | info                 | Reports the detected package manager                                  |

### CI gate

The exit code is the contract: `doctor` exits `0` when there are no failures (warnings are fine) and
`1` when any check fails, so it is usable directly as a CI step. Use `--json` for a structured
`{ apiVersion, type: "doctor", data: { checks, summary } }` envelope.

## Configuration

The CLI reads an optional `astryx-svelte.config.{ts,mjs,js}` from your project root, a sibling of
`package.json`. Every field is optional; with no config file the CLI runs on defaults.

```typescript
export default {
	integrations: ['@acme/astryx-widgets'],
	issuesUrl: 'https://github.com/your-org/your-repo/issues'
};
```

There is no factory: write a plain object. For editor autocomplete and type-checking, annotate it
with the `AstryxConfig` type exported from `@astryx-svelte/cli/authoring`.

| Field                         | Type                           | Purpose                                                                                         |
| ----------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `integrations`                | `string[]`                     | Integration package names to load (see [Integrations](#integrations)).                          |
| `issuesUrl`                   | `string`                       | Where "report an issue" links point for your project.                                           |
| `hooks.postCodemod`           | `PostCodemodHook[]`            | Commands to run after `upgrade` applies codemods (reinstall, rebuild, reformat).                |
| `experimental.xle.components` | `Record<string, XleComponent>` | Register app-local components so layout (XLE) expressions can reference them by name. Unstable. |

The config is validated against a strict schema when the CLI loads it, so an unknown field is a hard
error rather than a silent no-op. `doctor` reports whether the config loads cleanly.

## Integrations

An **integration** is any npm package that contributes its own components, templates and upgrade
codemods. The CLI surfaces them next to core's, through the same commands, so a consumer can run
`component`, `template` and `upgrade` across core and every integration uniformly. Use it to ship a
first-party add-on, publish a third-party component library, or share an internal design-system
package across apps.

The system runs on two files, each with a small typed API:

| File                                    | Written by | Role                                      |
| --------------------------------------- | ---------- | ----------------------------------------- |
| `astryx-svelte.config.{ts,mjs,js}`      | Consumer   | Lists which integration packages to load. |
| `astryx-svelte.integration.{ts,mjs,js}` | Author     | Declares what a package contributes.      |

### The integration manifest

A package becomes an integration by exporting a manifest from
`astryx-svelte.integration.{ts,mjs,js}` at its root, a sibling of `package.json`. The manifest points
at where each kind of contribution lives; identity (name, version) comes from `package.json`.

```typescript
export default {
	components: './components',
	templates: './templates',
	codemods: './codemods',
	issuesUrl: 'https://github.com/acme/widgets/issues'
};
```

| Field        | Type     | Purpose                                                               |
| ------------ | -------- | --------------------------------------------------------------------- |
| `components` | `string` | Directory holding the package's components and their `.doc.*` files.  |
| `templates`  | `string` | Directory holding the package's page/block templates.                 |
| `codemods`   | `string` | Directory holding upgrade codemods run by `upgrade`.                  |
| `issuesUrl`  | `string` | Where "report an issue" links for this package's contributions point. |

Every field is optional; declare only the roots the package ships. There is no factory: write a
plain object and annotate it with the `AstryxIntegration` type from
`@astryx-svelte/cli/authoring`.

### How it works

Every command loads the consumer's config, resolves each listed integration's manifest from
`node_modules`, and discovers its contributions. Everything is validated against one strict schema
at the load boundary, so core and integration contributions reach a single uniform surface.

Discovery is resilient: a broken or misconfigured integration is skipped with a one-line warning on
stderr instead of crashing the CLI, and it never corrupts a `--json` envelope. To inspect problems,
run `astryx-svelte validate-integration <package>` for a detailed report on one package, or
`astryx-svelte doctor` for an overall health check.

For the full authoring walkthrough — component doc format, template packaging and `exports`
requirements, and codemod authoring — read the guide:

```bash
pnpm exec astryx-svelte docs cli-integrations
```

## What is empty, and why

Three surfaces are real mechanisms over genuinely empty data sets. None of them is a stub, and none
of them will silently pretend otherwise.

- **`template --list` finds nothing from core.** Astryx's 1,329 template assets are React source and
  are deferred, so core contributes no page or block templates yet. Templates contributed by an
  integration or by another installed package are discovered, listed and injected normally.
- **`upgrade` has no codemods to apply.** A codemod migrates between two releases, and this port has
  had one. The version registry is empty, which routes every range to the "no codemods" result —
  the same path Astryx takes for a range with nothing registered. The first real entry lands with
  the second release.
- **`discover` finds nothing until you install an integration.** It scans `node_modules` for
  packages carrying an integration manifest; a project with none gets an empty list.
