---
seq: 037
title: Batch 37 — the second half of the assertion-strength front, getByText
upstream: 0.5.0
date: 2026-08-25
units: [src/tests (client project)]
upstream-prs: []
---

## Scope

The row batch 036 added to `port/status.md` rather than leaving as a remark: every
`getByText` in the client suites that passes a string without `exact`.

It is the same asymmetry as the `name` axis and a larger surface. Testing Library's `getByText`
matches the whole normalised string; Playwright's matches a case-insensitive **substring**. So a
case transcribed faithfully from upstream is, here, weaker than the one it ports — `getByText('Body')`
finds an element reading `'Body text and more'`, and upstream's would not.

`alert-dialog.svelte.test.ts` is the precedent: it already passes `{exact: true}` and says why.
`power-search-value-editor.svelte.test.ts` and `layout-slots.svelte.test.ts` do too.

## Why this one is likelier to find something than the `name` sweep

An accessible name is computed and usually short; element text is authored and often long, so a
substring match is far likelier to be *accidentally* satisfied by a longer string. Where the `name`
sweep found nothing, this one is reaching assertions that were only ever checking a prefix.

## Units

## Findings

### There is a third right answer, and `exact: true` is not always it

The `name` sweep had two outcomes per site: a string takes `exact: true`, a regex is left alone.
`getByText` has a third, because the two libraries ask **structurally different questions** about
nested markup.

Testing Library's default text matcher runs on `getNodeText`, which reads only an element's **own**
text-node children. Playwright's locator compares the whole **subtree**. Where a component
interleaves a bare text node with a child element, those disagree — and neither
`getByText('Analytics')` nor `getByText('Analytics', {exact: true})` asks upstream's question.

`TopNavMegaMenu`'s drawer item is exactly that shape, on both sides:

```
{LT}div class="drawerItemContent"{GT}Analytics{LT}span{GT}Track behavior{LT}/span{GT}{LT}/div{GT}
```

Upstream's `getByText('Analytics')` matches that `div`, because the div's own text *is* `Analytics`.
Here the subtree text is `'Analytics Track behavior'`, so `exact: true` finds nothing and the bare
string finds it only by accident of substring matching. The faithful counterpart is a helper
reproducing `getNodeText` — which this port already had, twice, written for the same reason:
`tree-list.svelte.test.ts`'s `labelOf` and `side-nav.svelte.test.ts`'s `withText`, the latter
throwing when the match is not unique so that Testing Library's single-match contract survives too.

What makes the diagnosis solid rather than plausible is the sibling case. `TopNavMegaMenuItem`'s
**desktop** branch wraps its title in its own element, so own-text and subtree-text coincide — and
that case passes with `exact: true`. Same component, same suite, same sweep: one site needs the
helper and its neighbour does not, for a reason visible in upstream's markup.

### Six agents, one scratchpad, and a near miss that was mine

The fan-out gave every agent the same scratch directory and said nothing about namespacing. Some
chose a distinct subdirectory anyway; others wrote bare `sweep.mjs`, `sweep.json` and `backup/`
into the shared root, and at least two overwrote each other's script mid-run. One agent noticed and
said so.

Nothing broke, because the collisions were on *scripts* that had already executed rather than on the
`backup/` directories the mutation checks restore from. But that is luck, not design: every agent in
this batch deliberately mutated a source file and restored it from a backup, and a restore that
picked up another agent's file of the same name would have written one suite's content over
another's — silently, and after the point where anyone was still reading diffs.

The dispatcher owns this, not the agents. A fan-out that has agents write scratch files has to hand
each one a distinct directory, and the ones that invented their own namespace were compensating for
a brief that should have specified it.

### A third way the counter miscounted correct code

Six suites hoist `const exact = { exact: true }` and pass it by reference. The counter was reading
only an inline object literal, so thirty-seven already-correct sites were reported as weak — which
also means the surface this batch opened against was never 605.

That is now three distinct patterns in one session where a metric over source read the code more
literally than the code meant it: a backtick-quoted `it`, prose inside comments, and an options
object behind an identifier. The counter recognises all three now; the shape they share is worth
more than any of them individually.

## Oracle bookkeeping

Untouched. A test-only batch; both fidelity oracles were green before and after, and neither can see
this axis at all.

## What the audits caught

### A metric that read 38 when the truth was 1, because of an invisible character

Widening the counter to recognise the hoisted `const exact` idiom was a one-line regex edit. The
alternation was meant to end `|exact)`. What reached the file was `|exact` followed by a literal
**backspace**, `U+0008` — a word-boundary escape turned into the control character it names. The
regex stayed syntactically valid, compiled without complaint, and simply never matched. So three
suites that pass a shared options object reported every one of their sites as weak, and the batch's
headline figure read **38 outstanding when one was**.

It was caught only because the number disagreed with a hand count, and located only by piping the
line through `cat -A` and seeing `^H`. Nothing else in the toolchain has an opinion about a control
character inside a regex literal: not `node`, not `prettier`, not `eslint`, not `tsc`.

Two things make this worth more than the fix. First, it failed **safe** — it overstated the work
remaining — and a wrong number that errs safe is exactly the kind that survives, because nobody
audits a figure that is asking for more work rather than less. Second, it is the same
backslash-through-a-shell-heredoc hazard that produced four visible failures earlier in this session,
except that those halved a `
` into a real newline and broke something loudly. This one produced
something that looked right in every rendering except a byte dump.

`scripts/status.mjs` now passes a control-character audit, and that audit is the promotion below.

### Six agents, one scratchpad

Recorded under _Findings_ above: the fan-out gave every agent the same scratch directory and did not
say to namespace. Some did; others collided on `sweep.mjs` and `backup/`. Nothing broke, but every
agent in this batch mutated a source file and restored it from a backup, so a same-named collision
in `backup/` would have written one suite over another silently. Dispatcher error.

### A rule that keeps prose honest also lets it rot

Agents were told never to edit inside a comment — right, because the previous batch caught a rewrite
corrupting a JSDoc quotation of upstream's code. The cost is that `table-grouped-rows`'s header ended
up asserting the exact opposite of what its file now does, and the agent could only report it. The
rule is still correct; it just makes keeping headers true the dispatcher's job, not the sweeper's.

## Rules promoted

- `CLAUDE.md` § Commands — audit a generated or edited script for control characters before trusting
  a figure it produces. A ``, `
` or `	` that survives a heredoc as the character it names is
  invisible to every tool in this repo, and a metric is precisely where that goes unnoticed.

## Debts opened

One: Svelte keeps the whitespace between adjacent expressions where JSX drops it — inert in a flex
container, which is where this port has met it, and real anywhere else. Surfaced by this sweep,
which reads `textContent` and is the first thing here able to see it.

None retired. The `getByText` row is at **1**, and that one is `Badge`'s icon case, left deliberately
with the reasoning already in the file.
