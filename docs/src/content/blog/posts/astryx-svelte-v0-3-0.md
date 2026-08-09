---
title: 'astryx-svelte v0.3.0: porting a design system you can check'
description: 'A Svelte 5 port of Astryx at 1:1 with upstream 0.3.0 — and the two oracles that prove it, including what they cannot see.'
date: '2026-08-10'
type: 'engineering'
authors:
  - 'devrohit06'
tags:
  - 'Svelte'
  - 'Parity'
  - 'Testing'
releasePackage: '@astryx-svelte/core'
relatedDocs:
  - title: 'Getting started'
    href: '/docs/getting-started'
  - title: 'Components'
    href: '/components'
  - title: 'Themes'
    href: '/themes'
---

Porting a design system is mostly a question you cannot answer by looking: **is this the same
thing?** Not "does it work" — does a `Button` here render what a `Button` there renders, down to the
declaration.

You can review a port. Reviewing scales badly, and it scales worst exactly where the port is most
faithful, because faithful code is boring to read and a single wrong `--spacing-2` looks like every
other correct line on the page.

So this port is built around a different answer: **compile both and diff the output.**

## The property that makes it work

Astryx styles components with [StyleX](https://stylexjs.com), which compiles `stylex.create` calls
into atomic CSS classes at build time. The class names are a hash of the declaration — not of the
file, the component, or the framework.

That has a consequence worth sitting with. If our `.stylex.ts` module declares the same properties
against the same token references upstream's `.tsx` module does, **the compiler emits byte-identical
classes**. Not similar. Identical. Which means the question "is this the same thing?" has a
mechanical answer, and the answer is a string comparison.

`packages/core/scripts/compare-upstream-classes.mjs` runs our modules through the StyleX Babel plugin
and diffs the emitted classes against the already-compiled ones in the published
`@astryxdesign/core` tarball. Today:

```
1528 style keys checked (19 of them as marker-normalised CSS),
615 inline call sites checked, 0 skipped, 0 mismatches
```

The theme packages get the same treatment from
`packages/themes/neutral/scripts/compare-upstream.mjs`, which diffs generated theme CSS declaration
by declaration: **2,418 declarations across seven packages, 0 mismatches.**

That oracle is bidirectional, which matters more than the headline. A missing declaration fails. A
wrong value fails. An _invented_ one fails too — that is the direction most parity checks forget, and
it is the one that catches a port quietly becoming a fork.

## Deferrals that expire

Real ports need to defer things. The trouble with a deferral is that it outlives its reason and
nobody notices.

Every skip in these oracles is an explicit entry with a written reason, and the list is checked in
both directions: a skip that stops matching **fails the run**, and so does a skip whose key _starts_
matching. You cannot leave a stale exception lying around, because the stale exception is itself a
failure.

The skip list is currently empty. Every deferral the port ever wrote retired itself, and each one
retired by failing a build and demanding to be deleted.

## What the oracle cannot see

Here is the part a release post usually skips.

A `stylex.create` value can be a plain object or an arrow function. Arrow-function values carry no
`$$css` marker for the extractor to find, so **the oracle checks every static style and no function
style at all** — 54 of them across 32 modules.

We know the exact size of that blind spot because we measured it rather than assumed it. Inverting a
`!isDisabled` guard in `text-input`'s status-hover branch left the oracle at **0 mismatches, exit
0** — while the bug was live in 13 call sites.

A verification tool that has never been shown to fail is a tool nobody has tested. That number is in
`TODO.md` under known debts, with the reproduction, because the useful thing about a blind spot is
knowing where it is.

## The failure mode the oracles do not cover at all

Class parity is a claim about CSS. It says nothing about whether a React idiom survived translation
into Svelte 5 — a context storing a value where it should store a getter, a `$derived` cached across
a server render, an un-`untrack`ed attachment. Those are the bugs that compile, pass the oracle, and
break at runtime.

And there is a third category the tooling reaches even less far into, which this port ran headfirst
into while writing this post.

The docs site had been rendering every live component example in the site's own brand theme instead
of the neutral theme a reader installs. Upstream re-themes each preview through a small
`ComponentPreviewTheme` boundary at six separate surfaces. This port had dropped all six — and had
written down a _reason_: "a second identical boundary would be a no-op."

Three files said it. A fourth asserted the premise the others leaned on. The premise was false: the
ambient theme is the brand theme, so the boundary switches the theme rather than repeating it.

Four files agreed with each other and none of them agreed with upstream. No oracle covers prose, and
the comments were confident, specific, and wrong. **A comment asserting parity is not evidence of
it.** Finding it took re-reading the reference tree, which is now a check the docs build runs on
every commit.

## What is in it

- **101 / 101** upstream component directories at 0.3.0, with a bidirectional diff confirming
  nothing here is invented
- **184 / 184** design tokens, and a 250-key `en` catalog byte-identical to upstream's
- **8 theme packages** — upstream's seven, plus one `liquid-glass` that ports nothing and is
  labelled as the port's own addition rather than smuggled in as parity
- **626 example blocks** on the docs site, transcribed from upstream's own blocks rather than
  re-authored, each naming its source
- Upstream's **42 page templates**, ported as real SvelteKit routes

## What is not

The CLI is a placeholder and is marked private — it is not in this release. `lab`, `charts`, `vega`
and `richtext` have not been started. And the full browser test suite does not yet complete in one
run: 4,760 tests pass with zero failures, but the shared Chromium instance dies late in the run and
takes the remaining files with it. That is infrastructure rather than product, and it is the next
thing to fix.

Upstream bugs are reproduced, not corrected, and each is written down. A port that fixes things
quietly is a fork with extra steps.

## Try it

The source is on [GitHub](https://github.com/devrohit06/astryx-svelte). Every component page on this
site renders live Svelte, and every example is a real file in the repository — including the one that
was rendering in the wrong theme until it was not.
