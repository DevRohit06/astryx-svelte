---
name: start-batch
description: Open a batch of porting work — pick the next number, scaffold its ledger entry, and run the pre-flight checks that this port has already paid for skipping. Use before starting any multi-component unit of work.
---

Open a batch for `$ARGUMENTS` (a scope, e.g. `the Table family at 0.4.1`).

## 1. Number it

```sh
ls port/ledger/
```

Take the next integer, zero-padded to three digits to match the existing files (`009-batch-8.md` …
`027-upstream-0.4.1-infrastructure.md`). Flat and monotonic; no letters — the `17a`/`17b`/`17c`
scheme this replaced is exactly the footgun to avoid.

## 2. Scaffold the entry

Copy `port/ledger/TEMPLATE.md` to `port/ledger/<NNN>-<slug>.md` and fill the front matter exactly as
the template declares it: `seq` (matches the filename prefix — this is the ledger's own sequence, not
a historical "Batch N" number), `title` (carries that historical identity, e.g. `Batch 19 — …`),
`upstream` (the version being ported against), `date`, `units`, `upstream-prs`.

## 3. Pre-flight — create a todo per item and complete them

Every item below is a mistake this port actually made and paid for in rework. The pattern is always
the same: a plan was trusted where the source should have been read, or a cost was estimated from one
dimension when it had several.

- [ ] **Cost the whole import list, not the component directory.** `CodeBlock` was booked at 2,083
      LOC; it also needed `theme/syntax/` (~710 LOC), because its `syntaxTheme` prop and
      `highlight-styles.ts`'s `:root` block both require it. `Markdown` was booked at 3,717 and came
      in around 7,100 because it imports the whole `Table` family to render a GFM table. Read what a
      component _imports_, then what those import, before writing a number down.
- [ ] **If this batch starts a front outside `packages/core`, check
      `port/research/01-component-inventory.md` against upstream source first.** Its per-component
      descriptions are gone — compacted away once every `packages/core` unit shipped, since the code
      and `port/ledger/` are strictly better answers for those than a July 2026 snapshot. What's left
      is the "Packages outside `@astryxdesign/core`" table: sizes and status for `lab`, `charts`,
      `vega`, `build` and `richtext`, still all unstarted as of the file's own compaction date. If
      this batch is the one that starts one of those fronts, verify the table against upstream
      source and update its status in the same commit — it has been wrong before (`Lightbox` was
      once described as a Popover-API overlay with a focus trap and autoplay timing; it is a native
      `<dialog>`, browser-owned focus, no autoplay), and a stale "still unstarted" row is the same
      failure mode.
- [ ] **Check the published dist against the source before wiring the oracle.** The tarball lags:
      `Icon`'s px→rem, `Collapsible`'s `isDisabled` and `content` typography, `DropdownMenu`'s
      selectable trio, and `Table/plugins/tree` — entirely absent from `@astryxdesign/core@0.1.7`'s
      published `dist/`, source-only. Follow the source and record a self-retiring skip; do not port
      a slice the dist cannot verify.
- [ ] **Decide the responsive and SSR story up front.** Both have been retrofitted and both cost a
      rework: the demo route grew to 66 stacked sections with no navigation before it was rebuilt as a
      two-column shell with scroll-spy, and `Timestamp`'s SSR warning still sits in the wrong shape
      (an `$effect`, so client-only) where `Field` got it right at init time.
- [ ] **Name the consumers, and remember the docs site is one.** A component that stops exporting its
      props interface loses its documented types silently — the docs generator reads the props table
      out of `dist/**/*.d.ts`. A discriminated-union prop needs every arm checked (`Slider`'s
      `minStepsBetweenThumbs` lives on the range arm alone and read as undeclared until the generator
      walked union constituents).
- [ ] **Check whether the entry is a hook before designing its page or its props.** `params != null`
      is upstream's discriminator, and a hook's surface is its signature, not a props table.
      `useResizable` is described by _both_ its own `.doc.mjs` (params) and a `components[]` member in
      `Resizable.doc.mjs` (props) — anything merging them has to let the hook branch win.
- [ ] **Read `port/debts.md` for every unit in scope.**
      `grep -n -A3 "^### .*<Name>" port/debts.md` and `grep -n -B2 "units:.*<Name>" port/debts.md`. A
      deliberate divergence already recorded there is not a bug to fix.

## 4. Confirm the scope

State the units, the upstream version, and anything the batch deliberately excludes. Then port with
the `port-component` skill, one unit at a time.
