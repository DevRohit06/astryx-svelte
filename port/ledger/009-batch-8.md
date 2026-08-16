---
seq: 9
title: Batch 8 — the launch set — Theme
upstream: 0.1.7
units: [Theme, ThemeContext, useTheme]
upstream-prs: []
---

## Scope

`Theme` (+ `ThemeContext`, `theme/types.ts`) and, with it, `useTheme` + `theme/tokens.ts`.

## Components

- **Batch 8 — the launch set** — `Theme` (+ `ThemeContext`, `theme/types.ts`) and, with it,
  `useTheme` + `theme/tokens.ts`:
  - **Theme** — a `display: contents` wrapper carrying `data-astryx-theme` and a `color-scheme`,
    which is the load-bearing half: every `light-dark()` token resolves against it. The **first**
    `<Theme>` in the tree also mirrors `data-theme` and `data-astryx-theme` onto `<html>`, so
    browser chrome and top-layer content follow the app's mode; nested ones theme their own subtree
    and deliberately do not. Nesting is detected by a module-private marker context **read before it
    is set** — Svelte's context map includes a component's own writes, so presence of `ThemeContext`
    could not serve. Runtime style injection is skipped for a `__built` theme (the flag the theme
    build now stamps) and otherwise writes one `<style>` per theme name, **refcounted** through a
    module-level registry — where upstream keeps a presence `Set`, so its second `<Theme>` on the
    same theme name registers no cleanup and whichever instance unmounts first takes the shared
    stylesheet away from the survivor. Icons register from the **component body** as well as an
    effect: `Icon` resolves against a module-level map, so a registration that happened only in an
    effect would make the server emit the fallback glyph and hydration replace it. 11/11 tests
  - **`useTheme` + `theme/tokens.ts`** — not in the batch plan, and landed because every one of
    upstream's five `Theme` stories is built on it _and_ Phase 5's `TokensDocView` wants live token
    values. `tokens.ts` transcribes upstream's resolver: `light-dark()` splitting, `var()`
    substitution with cycle guarding, and `color-mix(in srgb, …)` evaluated against `utils/color`,
    so a chart gets `#0064E0` rather than `var(--color-accent)`. The hook itself is thin — the mode
    half was already `internal/theme-mode.svelte.ts`, which now reads `ThemeContext` first and only
    subscribes the shared `MutationObserver` on the no-context path (upstream's args-switched
    no-op store). 16/17 tests
  - **`tokenDefaults` lives in `tokens.ts`, not `define-theme.ts`** where upstream declares it.
    Building it means importing `styles/tokens.stylex.ts`, and this package ships `.stylex.js`
    _uncompiled_ — so a plain-Node importer hits a runtime `stylex.defineVars` and throws.
    `define-theme.ts` is on the theme build's plain-Node import path (`build-theme.mjs` →
    `generate-theme-rules.js` → here), and the build **did** break on the first cut. Upstream has no
    such constraint: its published `dist/` is already compiled
  - **`useToast.test.tsx` restored** (4/4), the suite deferred at batch 7 on the unported `<Theme>`
  - **`@astryx-svelte/theme-neutral` now emits `dist/index.js`** — the package's `.` export promised
    a theme object and the build only ever wrote `theme.css`, so
    `import { neutralTheme } from '@astryx-svelte/theme-neutral'` failed. It carries `__built: true`,
    as upstream's `astryx theme build` artifact does
  - **A docs-generator bug fixed on the way in.** `internal/theme-props.ts` publishes a `ThemeProps`
    (the return of `themeProps()`) and `theme.svelte` declares a module-private `ThemeProps` of its
    own — upstream has the identical collision. The props index was keyed by bare name and
    first-wins, so `<Theme>`'s props table silently resolved to `{class: string}` and reported
    `theme`/`mode` as undeclared. Declarations found in a `<name>.svelte.d.ts` now win


## Oracle bookkeeping

Not recorded separately from the component notes above.

## What the audits caught

### Batch 8 — `Theme`, `useTheme`, and where the token defaults have to live

- [ ] **`tokenDefaults` is declared in `theme/tokens.ts`, not `theme/define-theme.ts`.** Upstream
      puts it with `defineTheme`, and it cannot go there: building it means importing
      `styles/tokens.stylex.ts`, this package ships `.stylex.js` **uncompiled** for the consumer's
      StyleX plugin, and `define-theme.ts` is loaded under plain Node by the theme build
      (`build-theme.mjs` → `generate-theme-rules.js` → `define-theme.js`). The first cut put it
      upstream's side and the theme build died on a runtime `stylex.defineVars`. The general rule
      this establishes: **nothing reachable from `generate-theme-rules.js` may import a `.stylex.ts`
      module**, and it will bind again on anything the CLI (Phase 4) loads outside a bundler
- [x] **`registerIcons` now invalidates mounted `<Icon>`s** — found by the idiom audit, and a
      Svelte-specific hazard with **no upstream analogue**: `globalRegistry` is a plain module
      binding and `icon.svelte` reads it through a `$derived`, so swapping to a theme with its own
      `icons` refreshed the map and left every already-mounted icon painting the old glyph until its
      node was destroyed. React re-renders the subtree from `Theme`'s render body and has no gap.
      The registry stays a plain binding (it must be readable during SSR and from plain-Node
      tooling); the _read_ path subscribes to a version counter in
      `icon/icon-registry-signal.svelte.ts` that `registerIcons`/`resetIcons` bump. Latent until a
      theme ships an icon registry — which is the Phase 3 `neutralIconRegistry` item — so it was
      fixed before it could bite rather than after
- [x] **Upstream bug fixed, not replicated: the injected-stylesheet registry is refcounted.**
      Upstream's `injectedThemes` is a presence `Set` and its early return happens _before_ the
      cleanup is constructed, so two co-mounted `<Theme>`s on one theme name share a `<style>` that
      the first unmount deletes — leaving the survivor unstyled with nothing to re-inject it. Ours
      counts, and removes the tag at zero. Invisible for `__built` themes, which is every theme this
      repo ships, and that is exactly why it was worth fixing rather than waiting for a report
- [x] **Upstream bug (documented, not replicated-away): `tokenDefaults` omits `borderDefaults`.**
      ~~See below.~~ **Retired at upstream 0.4.2** (#5026), which folded `borderDefaults` into
      `CoreTokenName` and `tokenDefaults`. This port followed in `028-upstream-0.4.2.md`, and
      `focusDefaults` — missing here but present upstream since before 0.4.1 — landed in the same
      pass. The original entry follows.
      Upstream ships the group, publishes a `BorderVarName` type for it, and then leaves it out of
      the flat map — so `tokenVars` and every `useTheme().tokens` is missing `--border-width`. Ours
      matches the omission, because the parity rule puts upstream bugs here rather than in the code:
      folding it in would give this port a token key upstream's API does not have. Note the port's
      own suite could not have caught it either way — it compares `useTheme().tokens` against our
      own `resolveThemeTokens`, so both sides would carry the extra key
- [ ] **The runtime-injection warning substitutes package names.** Upstream's string names
      `@astryxdesign/theme-<name>` and its CLI; repeating that verbatim would tell a reader to
      install packages that do not exist here, unlike the `useToast` strings kept verbatim (which
      name _components_ this port intends to ship). Structure and content are upstream's. Upstream's
      two copies also disagree — `npx @astryxdesign/cli theme build` in source, `npx astryx theme
build` in the published 0.1.7 dist — and the source wins, per the Icon px→rem precedent
- [ ] **`ThemeProps` is deliberately unexported**, like `SyntaxThemeProps`: upstream declares it
      module-privately in `Theme.tsx` and `theme/index.ts` publishes no props type for the component
- [x] **Nine unit-test files sat under `src/lib`, not `src/tests`** — `i18n/resolve.test.ts`,
      `theme/theme.test.ts` and the seven under `utils/`. **Done:** all nine moved to `src/tests/`
      and re-pointed at `$lib/…`, the convention 173 of the 175 imports in that directory already
      used. A clean rebuild now emits **0** test files into `dist/` (was 18). The entry this
      replaces was right that it was never a live leak — `package.json#files` carries
      `!dist/**/*.test.*`, and `npm pack --dry-run` confirms the tarball has never held one. What
      it _was_ is a rule with nothing enforcing it: CLAUDE.md states the rule as **location**, while
      the only thing actually holding was a denylist somewhere else. So the sweep came with a **lint
      guard** — a `*.{test,spec}.{js,ts}` under `src/lib` is now an eslint error, mutation-checked
      with a throwaway probe — and the `files` denylist stays as the second line. One thing the move
      broke and the suite caught: `theme.test.ts` reads `base.css` off disk through a
      `new URL(…, import.meta.url)` relative path, which silently became `src/styles/base.css`.
      Vitest reported that as **3 skipped**, not 3 failures — a `beforeAll` that throws skips its
      describe rather than failing it, so a relative-path break in a file read is invisible in the
      pass count. Repointed at `../lib/styles/base.css`; 38/38 again, and the server project is back
      to 679 passing with nothing skipped
- [ ] **`useTheme` sits in `theme/`, not `hooks/`.** Upstream's `hooks/` barrel does not carry it
      either — `theme/index.ts` publishes it — so the port's `hooks/`-mirrors-upstream rule points
      the same way. Its mode half stays `internal/theme-mode.svelte.ts`
- [ ] **`TokenName` is `string` here.** Upstream's is a literal union of every token name, generated
      alongside its token modules, and `tokenVar`/`resolveThemeToken` take it. Ours accept a plain
      `string`, so a typo is a runtime `''` rather than a compile error. Worth generating from
      `styles/tokens.stylex.ts` — it is the one place the names are declared
- [ ] **No `domainTokens/` group.** Upstream folds a data-viz token set into `tokenDefaults`; this
      port does not ship one, so `resolveThemeTokens` resolves 186 names rather than upstream's full
      set. Lands with the data-viz components, which are not scheduled
- [ ] **Style injection writes one stylesheet, where upstream writes two.** Upstream's
      `generateThemeCSS` returns `{prose, component}` and `<Theme>` injects the prose half into
      `@layer reset` and the component half into `@layer astryx-theme`; ours calls `generateThemeCss`,
      which emits both layer wrappers itself and returns one string. **The content gap is closed** —
      the Phase 3 _Prose defaults_ item landed, so the prose half is injected either way, and the
      theme oracle now checks that direction. What is left is the return _shape_: a consumer calling
      `generateThemeCss` directly gets one string where upstream's gives two halves to place
      separately. Emitted CSS is identical, so this is API surface, not behaviour
- [ ] **The `<html>` sync's cleanup removes both attributes unconditionally**, as upstream's does —
      so two root `<Theme>`s (an app that mounts a second detached tree with its own theme) leave
      `<html>` bare when _either_ unmounts. Upstream's identical behaviour, replicated; the
      component's contract is that there is one root


## Rules promoted

- `CLAUDE.md` § Testing — the "tests live in `packages/core/src/tests/`... this is lint-enforced"
  rule: nine unit-test files that had sat under `src/lib` were moved to `src/tests/`, and the sweep
  added the eslint guard (a `*.{test,spec}.{js,ts}` under `src/lib` is now an error) that CLAUDE.md
  now documents as the rule's enforcement, replacing a `package.json#files` denylist that was the
  only thing actually holding it.

## Debts opened

-
