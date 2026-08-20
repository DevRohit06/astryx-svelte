# port/research

Research written in July 2026, **before this port existed**, into what upstream Astryx looked
like and how a Svelte port of it might be built. It predates every ported component, the CLI, the
theme packages and the docs site.

**It is research, not spec, and it has been wrong before.** Treat everything here the way
`.claude/skills/start-batch/SKILL.md`'s pre-flight already tells you to: verify a claim against
upstream source or this repo's own code before relying on it. Where a file below still carries
real content, that content is specifically the kind a fresh read of the source can't hand you
back cheaply — a still-open action item, a decision that went a non-obvious way, or a measurement
(of upstream, or of the web platform) that would be expensive to retake. Everything these files
used to say about _what upstream's components do_ or _what this port should build_ has been
superseded by the components, the CLI, the theme packages and the docs site themselves, and by
`port/ledger/`'s record of how each of those was actually built — read those first.

This directory was compacted on 2026-08-16 from 13,355 lines to under 1,800. Most of that cut was
description of now-ported components, CLI commands, theme internals and docs-site plumbing that
the code now answers directly, plus three files (`08`, `09`, `10`) that were pre-batch plans for
work the corresponding `port/ledger/` entries now record in far more detail. Git history has the
original text if you need it.

## Files

- **`01-component-inventory.md`** — what survived is only the inventory of `@astryxdesign/lab`,
  `charts`, `vega` and `build`: the "Fronts not started" in `port/todo.md`, still unported, still
  only documented upstream.
- **`02-cli-and-registry.md`** — the one architectural fact about upstream's CLI this port's own
  CLI design still depends on (no registry, npm-package distribution), plus a still-open action
  item (ask upstream for a blessing before publishing).
- **`03-theming.md`** — one upstream doc-comment bug (`Button`'s theming comment names a
  `.variants` path that doesn't exist) that a fresh read of the source won't surface on its own.
- **`04-docs-site.md`** — design notes for the two docs routes not yet built, `/playground` and
  `/mcp`; everything already built is answered by `docs/` itself.
- **`05-shadcn-svelte-playbook.md`** — lessons from a different design-system's Svelte port whose
  central recommendation (a hosted registry) this port did **not** take, plus the one comparative
  insight that's still true (Astryx owns 100% of its own behavior, unlike a Radix-backed port) and
  the same still-open blessing action item as `02`.
- **`06-react-to-svelte-patterns.md`** — **unedited.** Live, load-bearing canon: cited by
  `.claude/agents/astryx-idiom.md` as the canonical pattern reference and by `close-batch`'s
  promotion rule (rule H12). Do not touch without updating both.
- **`07-svelte-ecosystem.md`** — a reusable "is this library DOM-owning?" decision test, plus a
  browser-baseline measurement (Popover API / CSS anchor positioning / `@scope`) that feeds the
  still-open `@scope` floor decision in `port/todo.md`. The dependency-adoption verdicts this file
  used to carry are now just `package.json` facts — and at least one of them (`runed` as a
  `core` dependency) turned out not to be what shipped.
