---
seq: 2
title: Batch 1 — slot translation and seams
upstream: 0.1.7
units: [List, ListItem, MoreMenu, AlertDialog, Banner, Spinner]
upstream-prs: []
---

## Scope

`List` + `ListItem` (+ `list-context`), `MoreMenu`, `AlertDialog`, `Banner`, and `Spinner.label`
restored on the way through. The first batch-numbered work, following the pre-batch primitives in the
previous file.

## Components

- **Batch 1** — `List` + `ListItem` (+ `list-context`), `MoreMenu`, `AlertDialog`, `Banner`:
  - **List / ListItem** — `<ul>`/`<ol>` by marker style, custom counter markers (CSS counter, not
    `list-style-type`), density/dividers/header context; `ListItem` composes `Item`, so the invisible
    button/anchor pattern comes for free. Context is optional — a bare `ListItem` falls back to
    `balanced`/no dividers/no markers, as upstream's nullable context does. 52/52 tests
  - **MoreMenu** — thin `DropdownMenu` wrapper: ghost icon-only trigger carrying the registry's
    `moreHorizontal`, `label` doubling as `aria-label` + tooltip, `hasChevron={false}`. No styles of
    its own, so no oracle case. 16/17 tests (`supports forwardRef` dropped — closed `Pick` props, no
    seam)
  - **AlertDialog** — `role="alertdialog"` over `Dialog` (`purpose="form"`), title/description wired
    through `aria-labelledby`/`aria-describedby`, cancel + action buttons in a `Layout` footer. The
    action never auto-closes. 12/12 tests. **Fixed a real `Dialog` bug on the way in**: our port wrote
    `role={purpose === 'required' ? 'alertdialog' : undefined}`, which _clobbers_ a caller's `role`;
    upstream spreads `{...(purpose === 'required' ? {role} : undefined)}`, so the caller's survives.
    Now a conditional spread. `useImperativeAlertDialog` **landed in batch 15** with `useImperativeDialog`, as a controller plus `<ImperativeAlertDialogLayer>`
  - **Banner** — two theme targets (coloured status header + collapsible content region), status →
    icon/role/background mapping, self-managed dismissal, `aria-controls` set only while the region is
    mounted, `edgeCompSlot.inset` on the end area (its first real consumer). 33/33 tests
- **`Spinner.label` restored** (found while filling the demo's coverage gaps). Upstream's
  `label?: ReactNode` renders below the ring, becomes the accessible name when it is a string,
  and moves the root to a wrapper `<div>` that every consumer prop is routed to. The port had
  dropped the prop entirely — `spinner.stylex.ts` carried the `wrapper` style all along with
  nothing rendering it, and no oracle skip was needed because the key still compiled. `label` is
  `string | Snippet`, and **`Spinner.test.tsx` is now ported** (16/16 then; **17/17** since 0.1.9 split its label case in two, updated at 17c); the component predates the
  case-for-case test discipline and had no suite at all

## Oracle bookkeeping

Not recorded separately from the component notes above.

## What the audits caught

### Batch 1 — slot translation and seams

- [x] **`useImperativeAlertDialog` is ported** — **batch 15**, together with `useImperativeDialog`, which is what "retire both deferrals together" asked for. Each returns `element: ReactNode` upstream, so each splits into a controller plus a companion component (`<ImperativeAlertDialogLayer>` / `<ImperativeDialogLayer>`), the `useLightbox`/`<LightboxLayer>` shape. `AlertDialog/index.ts`'s two names (`useImperativeAlertDialog`, `ImperativeAlertDialogReturn`) and `Dialog/index.ts`'s two are all on the barrel now. `useImperativeAlertDialog` still has no upstream test file, so none arrives with it; `useImperativeDialog.test.tsx` is restored at 5/5
- [ ] **`MoreMenu` has no `ref` counterpart.** Upstream threads `ref` into the trigger button's props; `MoreMenuProps` is a closed `Pick<BaseProps, 'xstyle' | 'class' | 'style'>` on both sides, so there is no rest spread for an attachment to travel through. Its `supports forwardRef` case is the one dropped from that suite — the same situation `Token`'s three ref cases are in
- [ ] **`ListItemProps` is typed `BaseProps<HTMLLIElement>` (upstream's type) but widens at the `Item` seam.** `Item`'s props are `BaseProps<HTMLElement>` and event handlers are contravariant in the element type, so the two are incompatible even though the DOM agrees — the rest props are cast once, at the single point they cross, rather than by publishing a weaker type. React's JSX prop bivariance is what lets upstream avoid the cast
- [ ] `List`'s `header`, `ListItem`'s `label`/`description` and `Banner`'s `title`/`description` are `string | Snippet`; `Banner`'s `icon`/`endContent`/`children` and `ListItem`'s `startContent`/`endContent` are plain `Snippet`. The leaf-slot translation settled for `Item`, applied unchanged
- [ ] **`Banner`'s `defaultIsExpanded` is read once at init** (`svelte-ignore state_referenced_locally`), matching `useState(defaultIsExpanded)`: a later prop change does not reopen a banner the user collapsed


## Rules promoted

Not promoted at the time.

## Debts opened

-
