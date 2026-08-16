# Launch posts — 0.3.1

Three posts, one per platform. Copy, attach the screenshot, send.

Every one says "unofficial, not affiliated with Meta" — keep that line.

---

## X

> Meta open-sourced a design system this year. It shipped React-only.
>
> So I ported it. All 101 components, to Svelte 5.
>
> Then I wrote a compiler-level diff against Meta's published CSS to prove it matched. 0 mismatches.
>
> astryx-svelte — MIT, unofficial, out now:
> https://astryx-svelte.rohitk06.in/

---

## LinkedIn

> Meta open-sourced Astryx, their design system, and shipped it React-only. I spent the last few
> months porting all 101 components to Svelte 5.
>
> The part I want to talk about isn't the components — it's that the port is checked rather than
> claimed.
>
> A design system is unusual: "is this the same as the original?" has a mechanical answer, not an
> aesthetic one. Two buttons either compile to the same CSS or they don't. So instead of asking
> anyone to trust the port, the build checks it — three scripts diff our compiled output against the
> already-compiled classes inside Meta's published packages. 1,528 style keys, 1,463 atomic CSS
> classes, 2,418 theme declarations. Zero mismatches, re-run on every build.
>
> It earned its keep immediately. The day the CSS check landed, it found that an avatar's status dot
> rendered on the wrong side in right-to-left languages. I had reviewed that file myself and left a
> comment defending the wrong version.
>
> Code review is a person deciding something looks right. That's a different thing from checking.
>
> Shipping today, MIT: 101 components, 8 themes, 184 design tokens, a CLI for humans and agents, and
> docs where every example is live Svelte rather than a screenshot.
>
> https://astryx-svelte.rohitk06.in/
>
> Astryx is © Meta Platforms. This is an unofficial port — not affiliated with or endorsed by Meta.
>
> #svelte #opensource #designsystems #frontend

---

## Svelte Discord (`#showcase`)

> **astryx-svelte** — a Svelte 5 port of [Astryx](https://astryx.atmeta.com/), Meta's open source
> design system. 101 components, 8 themes, 184 tokens. MIT, unofficial, not affiliated with Meta.
>
> Docs: <https://astryx-svelte.rohitk06.in/>
> Repo: <https://github.com/DevRohit06/astryx-svelte>
>
> The port is checked rather than claimed: components are authored against the same design-token
> references upstream uses, so StyleX emits byte-identical atomic CSS, and three scripts diff that
> against the already-compiled classes in the published `@astryxdesign/*` packages. 0 mismatches,
> re-run in CI. It caught a real RTL bug in Avatar the day it landed.
>
> Svelte-side specifics:
>
> - Runes throughout, Svelte 5 only, no v4 compat mode.
> - Contexts store getters rather than values, so consumers stay reactive across the boundary.
> - Snippets where upstream takes `ReactNode` — `Button.icon` is a `Snippet` here.
> - Every component exports its props interface, because upstream publishes its props types.
> - The stylesheet ships pre-built, so you don't have to configure StyleX at all. If you'd rather
>   compile and tree-shake, `@astryx-svelte/core/vite` is a one-line preset.
>
> ```
> npm i @astryx-svelte/core @astryx-svelte/theme-neutral @stylexjs/stylex
> ```
>
> Known gaps so nobody finds them the hard way: upstream's `lab` package (17 components) isn't
> started, and 434 upstream test cases still have no counterpart here. Both tracked in `../todo.md`.
>
> Very interested in what breaks on real projects.

---

**Screenshot alt text:** The astryx-svelte documentation site, showing the component library's home
page with a sidebar of component categories and live rendered examples. _(Adjust to match the actual
shot.)_
