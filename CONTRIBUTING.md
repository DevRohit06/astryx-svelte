# Contributing to astryx-svelte

Thanks for being here. This is a Svelte 5 port of [Astryx](https://astryx.atmeta.com/), Meta's
open source design system, and contributing to it is a slightly unusual job: most of the design
decisions have already been made upstream, and our work is to reproduce them faithfully rather
than to improve on them.

That constraint is the whole point, and it is what this guide is mostly about.

## The parity rule

**If it's not in Astryx, it's not here.**

Invented props, extra variants, nicer defaults and hand-drawn demo content are _defects_, not
improvements. That includes demo routes and template content, which must show upstream's
documented API rather than a tidied-up version of it.

Where upstream has a bug, we reproduce the bug and record it in `TODO.md` under "Known debts". A
fix that upstream has not made is a divergence, and divergences are how a port stops being a port.

If you think upstream is wrong about something, the place to argue it is
[upstream](https://github.com/facebook/astryx) — not here.

### The exception, and how to take it

Sometimes React has no Svelte counterpart and a judgement call is unavoidable: a `ReactNode` prop
becomes a `Snippet`, a hook's return value is reactive rather than a tuple, an icon Astryx imports
from Heroicons has no equivalent in our registry.

When that happens, **write down what you did and why, in the file**. Every such decision in this
repo carries a comment explaining itself. That is not decoration — it is the difference between a
future reader trusting the code and re-deriving it.

## Read upstream before you write anything

Upstream's source is cloned at `reference/astryx-upstream/` — gitignored, and the thing to read.
Read it _before_ porting, not after: the source, the `.doc.mjs`, the tests, the storybook stories,
and the already-compiled `dist/` in `node_modules/@astryxdesign/core`.

> **After cloning it, rename its `CLAUDE.md` to `UPSTREAM-CLAUDE.md`.** Otherwise every file you
> read in that tree loads Meta's instructions for _their_ repo into your tooling's context, where
> they read as instructions for this one — they describe a React codebase, a different test runner
> and a CLI this repo does not have.

Two live documents track the work:

- **`TODO.md`** — status and backlog: what's next, the batch history, the known debts. Read the
  relevant section before starting; update it when your work lands.
- **`PORTED.md`** — the per-component implementation notes: what each unit does, the translations
  it needed, its oracle and test posture.

Status and open decisions go in `TODO.md`. _How_ a component was built goes in `PORTED.md`.

## Getting set up

```sh
pnpm install
pnpm -r build     # must run before check — theme-neutral typechecks against core's built dist/,
                  #   and the docs generator reads props types out of that same dist/
pnpm -r check     # svelte-check + tsc
pnpm -r lint      # prettier --check && eslint
pnpm -r test      # vitest + both fidelity oracles
```

Day-to-day:

```sh
pnpm dev                                            # core's demo routes
pnpm dev:docs                                       # the docs site
pnpm -F @astryx-svelte/core test:unit --run         # unit tests only
pnpm -F @astryx-svelte/core test:unit --run src/tests/foo.svelte.test.ts   # one file
```

> **Do not write `--` before vitest flags.** Under pnpm 10 the `--` is passed through, so vitest
> sees `"--" "--run" "<path>"`, ignores both the flag and the filter, and starts a full run in
> _watch mode_ that never exits. It looks exactly like a hang.

**Never install with `--prod` or prune devDependencies.** Both fidelity oracles and the docs
content pipeline read the upstream `@astryxdesign/*` packages, which are devDependencies.

## The fidelity oracles

This is the mechanism that makes the port tractable, and the reason review is not the last line of
defence.

`packages/core/scripts/compare-upstream-classes.mjs` compiles our `.stylex.ts` modules with the
StyleX Babel plugin and diffs the emitted atomic classes against the _already compiled_ ones in
`@astryxdesign/core`'s published `dist/`. `packages/themes/neutral/scripts/compare-upstream.mjs`
does the same for theme declarations.

Authoring `stylex.create` against the same token references upstream uses makes the compiler emit
byte-identical CSS. The oracles prove that rather than trusting anyone's eyes.

Deferrals are explicit `skip` entries with a written reason. A skip that stops matching fails the
run — and so does a skip whose key _starts_ matching, so the list cannot rot. The published
tarball is ground truth but **can lag upstream's source**; when it does, follow the source and
record a self-retiring skip.

## StyleX constraints

- StyleX may only be imported from `.ts` / `.stylex.ts` modules, **never from a `.svelte` file**.
  The bundler plugin Babel-parses any module importing `@stylexjs/stylex` and would read Svelte
  markup as JSX. `internal/sx.ts` is the adapter from `stylex.props()` to Svelte's `class`/`style`.
- Adding a **new** `.stylex.ts` file requires a dev-server restart — StyleX's dev cache doesn't
  pick it up.

## Testing

Two vitest projects, selected by filename:

- `*.svelte.test.ts` → **client** project, real headless Chromium via Playwright.
- `*.test.ts` → **server** project, node environment.

Tests and fixtures live in `packages/core/src/tests/`, deliberately outside `src/lib` so
`svelte-package` can never copy them into `dist/`. **This is lint-enforced.** Import through
`$lib/…`, not a relative path out of `src/tests/`.

Svelte has no `renderHook`; the substitute is a _probe_ fixture that runs the hooks and renders
their result. `act()` has no counterpart — a `$state` write flushes on its own, and
`expect.element` retries.

**Upstream suites are ported case for case; the count is the contract.** Any dropped case is named
in the file with its reason.

Coverage _beyond_ upstream needs a high bar: a hazard with **no upstream analogue**, which the
ported suites structurally cannot catch — a Svelte-specific DOM or reactivity failure React cannot
reproduce. `src/tests/layer-attribute-repair.svelte.test.ts` is the precedent, and so far the only
one.

## Conventions

- Component dirs are kebab-case under `src/lib/components/`, holding `<name>.svelte` and
  `<name>.stylex.ts`.
- Every component declares its props interface in `<script module>`, exports it, and re-exports it
  from `src/lib/index.ts` — upstream publishes props types, so we do too.
- Relative imports use the `.js` extension even for `.ts` sources.
- Prettier: **tabs**, single quotes, **no trailing commas**, 100 columns.

## Ways to help

**Port a page template.** The largest open seam. Upstream ships 43 whole-page templates under
`assets/templates/pages/`; each is a self-contained React page that needs transcribing to Svelte
at `packages/cli/assets/templates/pages/<slug>/+page.svelte`. Every component they need is already
exported, so this is transcription rather than component work — a good first contribution.

**Port a component.** Check `TODO.md` for what's unported, read upstream's source and tests first,
then follow the loop below.

**Improve the docs site.** `docs/` is a SvelteKit app; its content is generated from upstream's
`.doc.mjs` files by `docs/scripts/generate-content.mjs`.

**File a bug.** Especially a parity bug — somewhere our API, markup or CSS diverges from upstream's
and neither the oracle nor a ported test caught it. Those are the most valuable reports we get.

## The loop a change goes through

1. **Read upstream first** — source, `.doc.mjs`, tests, and the compiled `dist/`.
2. **Port it** — author the `.stylex.ts` against the same token references upstream uses.
3. **Prove the CSS** — run the class oracle. Byte-identical, or it doesn't land.
4. **Audit** — the repo ships subagents in `.claude/agents/` that encode this port's specific
   failure modes: `astryx-parity` (props, styles, elements, exports vs upstream), `astryx-idiom`
   (whether the React→Svelte translation is _correct_ — contexts storing values instead of
   getters, `$derived` caching through a server render, un-`untrack`ed attachments),
   `astryx-oracle`, `astryx-test-parity`, and `astryx-surface`.
5. **Verify** — `pnpm -r build && pnpm -r check && pnpm -r lint && pnpm -r test`, all clean.
6. **Write it down** — `PORTED.md` for how, `TODO.md` for status.

## Pull requests

- Branch off `main`.
- Keep the diff to one thing. A component port, a batch of templates, a docs fix.
- Say in the description **what you read upstream** and **what you had to decide**. A PR that
  names its judgement calls is far quicker to review than one that hides them.
- Make sure `build`, `check`, `lint` and `test` are all green before asking for review.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating you agree to
uphold it.

## Licence

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE), the same terms that cover the rest of the project.

---

**This project is unofficial and not affiliated with Meta.** Astryx is Meta's design system;
this repository is an independent Svelte port of it.
