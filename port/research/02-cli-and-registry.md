# Astryx CLI, Templates/Blocks, and Component Distribution

> Written in July 2026, before the port existed, against `@astryxdesign/cli@0.1.7`. The CLI it
> planned is now built — `packages/cli/` ships all 14 of upstream's commands but `blog` (see
> `port/ledger/023-cli-phase-4.md`, "Phase 4"). That ledger entry also documents three places this
> file was wrong about 0.1.7-era upstream (an `src/{api,commands,lib}` layout that no longer
> exists at 0.3.0, an interactive `@clack/prompts` wizard upstream has since removed, and `blog`
> being JSON-hidden when it no longer is) plus one measurement it got wrong (43 error codes, not
> 53). Read `packages/cli/` and that ledger entry for anything about the CLI's current shape — the
> command tables, JSON-contract schema, template/blocks file-format spec and config-file schema
> this document used to carry are gone, because `packages/cli/` now answers them directly.

Two things survived: a fact about **upstream's own architecture** that this port's CLI design
still depends on, and one still-open action item nothing else tracks.

## Astryx has no registry — components ship as a normal npm package

The CLI never fetches component definitions over the network; the only `fetch()` in its entire
source tree is the blog RSS reader. Components are consumed as normal npm imports from
`@astryxdesign/core`, and the CLI reads the installed package's shipped `src/` directory for docs
and source — there is no hosted `registry.json`, no `add` command, no copy-in step. This is the
fact that ruled out modelling this port's CLI on shadcn-svelte's registry (see
`port/ledger/023-cli-phase-4.md`'s scope note, and `05-shadcn-svelte-playbook.md` for what a
registry-based alternative would have cost instead). Templates and blocks are the one thing
Astryx does copy in, bundled inside the CLI package rather than hosted — which is why
`astryx-svelte template` mirrors that shape while `component`, `hook` and `util` stay
import-only.

## Still open: ask the Astryx maintainers for a blessing

Not yet done as of this compaction — `port/todo.md`'s Release checklist still lists "Consider
asking the Astryx maintainers for a blessing." The shadcn-svelte precedent
(`05-shadcn-svelte-playbook.md`) is that its author reached out to shadcn before publishing and
got an explicit reply, credited in the README ever since. It costs one message and is the
difference between a welcomed port and a cease-and-desist — cheaper before the first
`npm publish` than after.
