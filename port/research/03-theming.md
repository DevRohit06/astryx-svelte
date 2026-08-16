# Astryx Theming Architecture

> Written in July 2026, before the port existed, mapping upstream's token taxonomy,
> `defineTheme()` pipeline and dark-mode mechanism in detail. All of it is now built — read
> `packages/core/src/lib/theme/` (tokens, `defineTheme`, CSS generation, dark mode) and
> `packages/themes/*` (8 theme packages) directly; they are the current, checked answer, and the
> `compare-upstream.mjs` oracle in `packages/themes/neutral/scripts/` proves they match upstream
> byte-for-byte. The token tables, pipeline stages and `useTheme()` replacement design this file
> used to carry are gone as a result.

One upstream inaccuracy survived, because it is not the kind of thing rereading our own source
would catch — it is a bug in **upstream's own doc comment**, not in a token table:

## Upstream's `Button` doc comment misdescribes its own theming hook

Astryx's `Button.tsx` doc comment says themes can override it via
`theme.components.button.variants`. That path does not exist. The real shape — confirmed against
`defineTheme.ts`'s `ComponentStyleMap` type — is `theme.components.button['variant:<value>']`;
there is no `variants` key anywhere in the type system. Treat any upstream comment that mentions
`.variants` as stale, here and in any component ported later that carries the same doc pattern.
