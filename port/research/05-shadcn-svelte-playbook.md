# The shadcn-svelte Playbook

> Researched July 2026, before the port existed, as a study of `huntabyte/shadcn-svelte` — a
> different design-system port facing a similar React→Svelte problem — for lessons to reuse here.
> **Its central recommendation was not adopted.** shadcn-svelte's whole architecture is a hosted
> JSON registry plus a copy-in CLI (`add <component>`), and this document worked out a matching
> `astryx-svelte init | add | update | registry build` translation in detail. That translation is
> gone: `02-cli-and-registry.md` and `port/ledger/023-cli-phase-4.md` establish that upstream
> Astryx itself has no registry — it distributes as a normal npm package — and this port's CLI
> follows _that_ model instead, not shadcn-svelte's. The repo-structure mapping, registry
> JSON-schema walkthrough, CLI command surface and docs-site stack recommendation this file used
> to carry here described a road not taken, and are gone as a result.

Two things survived, because they are not about the registry model at all: a comparative
architectural insight that is still true regardless of which CLI shape won, and one still-open
action item nothing else tracks (also carried in `02-cli-and-registry.md`).

## Why Astryx's version of this problem is structurally different

shadcn/ui is styling on top of Radix UI; shadcn-svelte had no Svelte equivalent to build on, so
its maintainer had to build and maintain one first (Bits UI, Formsnap, Paneforge, Vaul Svelte)
before a single component could be ported. That is the real cost the shadcn-svelte project paid,
and it does not apply here: **Astryx has no external primitive dependency at all** — it
implements 100% of its own behavior (focus traps, roving tabindex, dismissable layers, ARIA
wiring) on top of StyleX-compiled atomic CSS. The axis that splits "owned" from "rented" moves as
a result:

| Layer                   | shadcn-svelte                  | astryx-svelte                                           |
| ----------------------- | ------------------------------ | ------------------------------------------------------- |
| Un-owned, auto-updating | Bits UI (behavior + a11y)      | `@astryxdesign/core` + `theme-*` (compiled CSS, tokens) |
| Owned, hand-written     | Styled wrappers around Bits UI | Svelte markup **and** behavior                          |

Consequences worth remembering when a component feels like it should be "just a wrapper": there
is no primitive-parity rate limit blocking any component (nothing to wait for a headless library
to ship), but there are also no free upstream behavior fixes — when Meta fixes an a11y bug in
Astryx's React implementation, this port gets the CSS fix free (the class oracle would catch a
mismatch) and the behavior fix not at all, until someone re-ports it by hand. Markup fidelity is
load-bearing in a way it is not for a Bits-UI-style port for the same reason: Astryx's atomic CSS
is applied per-element, so a DOM-shape mismatch silently breaks styling — which is why this port
hand-ports markup and behavior together rather than composing a headless primitive library and
painting Astryx classes onto it.

## Still open: ask the Astryx maintainers for a blessing

Not yet done as of this compaction — `port/todo.md`'s Release checklist still lists "Consider
asking the Astryx maintainers for a blessing." shadcn-svelte's maintainer reached out to shadcn
before publishing and got an explicit reply, credited in the README ever since ("We are not
affiliated with shadcn, but we did get his blessing before creating a Svelte version of his
work"). It costs one message and is the difference between a welcomed port and a
cease-and-desist — cheaper before the first `npm publish` than after.
