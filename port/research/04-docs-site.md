# Astryx Docs Site: Information Architecture, Content Pipeline & Port Plan

> Written in July 2026, before the port existed, against `astryx.atmeta.com` and upstream's
> `apps/docsite`. Most of what it mapped is now built: `docs/` is a real SvelteKit site with
> routes for `/components`, `/docs`, `/templates`, `/themes`, `/blog` and `/community`, and
> `docs/scripts/generate-content.mjs` (not a from-scratch design, but a real ~1,900-line
> generator) reads the same `.doc.mjs` files this document describes. Read `CLAUDE.md`'s "The
> docs site" section and `docs/scripts/` directly for how the pipeline actually works today —
> the site map, `.doc.mjs` format walkthrough, component-page anatomy and tech-stack mapping this
> file used to carry here are gone as a result.

Two pieces of upstream's design are kept, because `port/todo.md` still lists the routes they
describe as **not built** (`/playground`, `/mcp`) — for those, this is still the only design this
port has, until the code exists to supersede it.

## The in-browser playground (`/playground`) is a different problem in Svelte

Upstream compiles user TSX in an iframe via `ts.transpileModule` + a hand-rolled `require()` over
a generated module scope (`playground-scope.ts`) — Monaco for editing, `lz-string`/`fflate` for
URL-encoded sharing. None of that machinery ports: Svelte cannot be compiled by
`ts.transpileModule`, because a `.svelte` file is not parseable TypeScript. The Svelte compiler
itself has to run wherever the code is compiled.

Best-to-worst options, as assessed in July 2026:

1. **`svelte/compiler` in a Web Worker** — the same approach `svelte.dev/playground` and
   `@sveltejs/repl` use: compile `.svelte` → JS in a worker, then eval with a scope-mapped
   `require`. Highest fidelity; the compiler itself is a ~1–2 MB self-hostable bundle.
2. **Rollup/esbuild-wasm in a worker** — more general, heavier.
3. **Defer it.** The component-page live examples and the interactive props table (both now
   built) cover nearly all of the per-component docs value; only the standalone `/playground` and
   "Open in Playground" links depend on in-browser compilation.

Prefer CodeMirror 6 over Monaco for the editor if this is built — first-class Svelte usage (the
official Svelte REPL uses it), no worker gymnastics to integrate with Vite, roughly a fifth the
weight.

## The MCP server (`/mcp`) has a direct SvelteKit shape

Upstream exposes `search()`/`get()` over its generated content registries via `mcp-handler`
(Next-shaped) at `app/mcp/route.ts`. The registry-driven logic ports unchanged; the transport
does not — use `@modelcontextprotocol/sdk` directly inside a SvelteKit `+server.ts` with the
Streamable HTTP transport, reading the same registries `docs/scripts/generate-content.mjs`
already emits.
