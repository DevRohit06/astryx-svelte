---
name: port-component
description: Port an Astryx React component to Svelte 5 end-to-end — extract the upstream spec, author the .stylex.ts and .svelte, wire the class oracle, then audit idiom and test parity. Use whenever a component from Astryx is being ported or an existing port is being finished.
---

Port `$ARGUMENTS` (an Astryx component name, e.g. `Alert`) from React to Svelte 5.

The order matters: each step's output is the next step's input, and skipping the spec extraction is
how invented API gets in.

## 1. Spec — before writing anything

Check `TODO.md` first: the component may be partly done, blocked on an unported primitive, or listed
under "Known debts" with a deliberate deviation.

Then run the **`astryx-parity`** agent against the upstream original to extract the complete
inventory — props and defaults, variants, rendered elements, ARIA, exports, and what its own tests
assert. Upstream lives at `reference/astryx-upstream/`; its compiled output is in
`node_modules/@astryxdesign/core/dist/`.

Do not proceed on a partial spec. If upstream depends on a primitive this port doesn't have yet, say
so and stop — half-built is worse than absent, and `TODO.md` records that choice.

## 2. Author

Create `packages/core/src/lib/components/<kebab-name>/` with `<kebab-name>.stylex.ts` and
`<kebab-name>.svelte`.

- The `.stylex.ts` module authors `stylex.create` against **the same token references upstream uses**
  — that's what makes the compiler emit byte-identical classes. Copy the token references from
  upstream's source rather than re-deriving values.
- The `.svelte` file declares its props interface in `<script module>`, exports it, and consumes the
  styles through `internal/sx.ts`. Never import `@stylexjs/stylex` from a `.svelte` file.
- Re-export the component and its props type from `src/lib/index.ts`.
- A new `.stylex.ts` file needs a dev-server restart before it compiles.

## 3. Oracle

Run the **`astryx-oracle`** agent to wire the new `.stylex.ts` into
`packages/core/scripts/compare-upstream-classes.mjs` and diagnose any mismatch (object vs inline
mode, group renames, or the published-`dist`-lags-source case). It may edit the oracle, not the
styles — a mismatch is a report, and the styles are what get fixed.

Verify with `pnpm -F @astryx-svelte/core test:parity`.

## 4. Idiom

Run the **`astryx-idiom`** agent if the component has state, effects, refs, or context. It catches
what parity is told to ignore: a context storing a value instead of a getter, a `$derived` that
caches through a server render, an attachment that re-subscribes because its body wasn't `untrack`ed.

## 5. Tests

Run the **`astryx-test-parity`** agent to port upstream's `.test.tsx` suite case for case into
`packages/core/src/tests/`. Filename picks the project: `*.svelte.test.ts` runs in real Chromium,
`*.test.ts` in node. Any upstream case without a counterpart is named in the file with its reason.

## 6. Close out

- `pnpm -r build && pnpm -r check && pnpm -r lint && pnpm -r test` — all clean.
- Re-run **`astryx-parity`** to catch drift between the spec and what actually got written, in both
  directions. Anything the port has that upstream doesn't is a defect to remove.
- Update `TODO.md`: move the component into the Done list, refresh the counts in the Status table,
  and record any deliberate deviation under "Known debts".
- Add the demo to the core dev routes showing **upstream's documented API only**, not invented usage.
