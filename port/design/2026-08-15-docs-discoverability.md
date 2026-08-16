# Docs site discoverability

**Status:** research and phase plan, not yet implemented
**Date:** 2026-08-15
**Scope:** `docs/`, the SvelteKit app deployed at https://astryx-svelte.rohitk06.in/. Not the
component library's own README or npm listing.

## The problem, stated precisely

The docs site already has real SEO infrastructure — a shared `Seo` component, a generated
sitemap, a permissive `robots.txt` — built by someone who clearly knew what canonical URLs and Open
Graph cards are for. What it has zero surface area for is the three newer discovery paths: an
`llms.txt` a coding agent can fetch, a `.md` variant of a page an LLM can read without stripping
HTML, and a stated policy on the AI crawlers that decide whether this project gets recommended when
someone asks an assistant "what Svelte component library should I use."

The build already assembles the answer to most of this. `docs/scripts/generate-content.mjs` holds,
in memory, at build time: every component's name, description, props and usage prose; every
reference topic; every template; both blog posts; every theme package. That is the raw material for
a sitemap, a feed, an `llms.txt`, and a `.md` mirror of every page — and today only one of those four
is built from it.

This document audits what exists, researches what the current (2026) practice actually is for each
of SEO, AEO and GEO — three names the industry increasingly collapses into one, incorrectly — and
proposes a phased plan ranked by how much of it the content generator already gets for free.

## Part 1 — Current state

### What exists

| Mechanism | State | Where |
| --- | --- | --- |
| `robots.txt` | Permissive (`Disallow:` empty), points at the sitemap | `docs/static/robots.txt` |
| `sitemap.xml` | Generated at build/prerender from the same registries the pages render from | `docs/src/routes/sitemap.xml/+server.ts` |
| Per-page `<title>` | Yes, via a shared component; site name appended unless the page already names it | `docs/src/lib/seo/seo.svelte:52-56` |
| Per-page meta description | Yes, with a sane fallback chain on component pages | `docs/src/lib/seo/seo.svelte:80`, `docs/src/routes/components/[name]/+page.svelte:126-130` |
| Canonical URL | Yes, derived from `page.url.pathname` against a fixed `SITE_URL`, never `page.url.origin` (which is SvelteKit's prerender placeholder) | `docs/src/lib/seo/seo.svelte:57`, `docs/src/lib/seo/site.ts:26,69-71` |
| Open Graph + Twitter cards | Yes, on every page, unconditionally | `docs/src/lib/seo/seo.svelte:86-101` |
| JSON-LD | Yes, but on **2 of ~288 routes**: home (`SoftwareSourceCode`) and each blog post (`BlogPosting`) | `docs/src/routes/+page.svelte:107-118`, `docs/src/routes/blog/[slug]/+page.svelte:20-33` |
| `noindex` support | Built into the `Seo` component and used correctly on the one route that needs it (the `/templates/[slug]` legacy-link shim) | `docs/src/lib/seo/seo.svelte:31,82-84`, `docs/src/routes/templates/[slug]/+page.svelte:49-51` |
| Full prerendering | Every route, `export const prerender = true` at the layout root | `docs/src/routes/+layout.ts:6` |
| A build-time content graph | Components (216 documented entries), 20 reference topics, 2 library packages, 42 page templates, 2 blog posts, 8 themes — all typed, all reconciled against what the library actually exports | `docs/scripts/generate-content.mjs` (1877 lines), emitted to `docs/src/lib/generated/*.js` (gitignored, rebuilt by `pnpm -F docs generate`) |
| Blog content | 2 long-form technical posts, each 5000+ words with real measurements, code blocks, and a proper heading hierarchy — exactly the shape GEO research rewards (Part 2) | `docs/src/content/blog/posts/*.md` |
| A precedent for machine-consumable docs | The CLI already ships a dense/compact/brief formatter for reference docs, and an `init --features agents` command that writes `AGENTS.md` / `CLAUDE.md` / `.cursorrules` for people building **with** the library | `packages/cli/clients/cli/commands/docs.mjs`, `packages/cli/assets/docs/working-with-ai.doc.mjs` |

### What does not exist

Confirmed two ways: `docs/static/` has no matching file, and the deployed site returns the status
shown below (fetched live, 2026-08-15).

| Path | Live status | Note |
| --- | --- | --- |
| `/llms.txt` | 404 | Not present anywhere in the repo |
| `/llms-full.txt` | 404 | Not present |
| `/.well-known/security.txt` | 404 | `docs/static/` has no `.well-known/` directory at all |
| `/feed.xml` (or any RSS/Atom/JSON feed) | 404 | No feed route exists |
| `/components/Button.md` (per-page markdown) | 404 | No `.md` mirror of any page |
| A `BreadcrumbList`, `TechArticle`, or any structured data beyond the 2 routes above | — | Not generated |

### The per-route SEO surface, measured

Every `+page.svelte` under `docs/src/routes/` imports `Seo` (grep confirms all 10 route trees do),
so title/description/canonical/OG/Twitter are universal. `schema` (JSON-LD) is opt-in per call site
and only 2 of the ~10 distinct route templates pass one:

| Route template | Title/description | JSON-LD | Notes |
| --- | --- | --- | --- |
| `/` | Yes, hand-authored | `SoftwareSourceCode` | `docs/src/routes/+page.svelte:103-119` |
| `/components` | Yes | None | `docs/src/routes/components/+page.svelte:90` |
| `/components/[name]` (×216) | Yes, first line of usage prose or a generated fallback | None | `docs/src/routes/components/[name]/+page.svelte:126-130` |
| `/docs` | Yes | None | — |
| `/docs/[topic]` (×22: 20 topics + 2 packages) | Yes | None | `docs/src/routes/docs/[topic]/+page.svelte:18-22` |
| `/templates` | Yes | None | `docs/src/routes/templates/+page.svelte:216` |
| `/templates/[slug]` (×42) | `noindex`, correctly — this is a redirect shim, not content | None | `docs/src/routes/templates/[slug]/+page.svelte:49-51` |
| `/themes` | Yes | None | `docs/src/routes/themes/+page.svelte:100` |
| `/blog` | Yes | None | `docs/src/routes/blog/+page.svelte:18` |
| `/blog/[slug]` (×2) | Yes | `BlogPosting` | `docs/src/routes/blog/[slug]/+page.svelte:15-34` |
| `/community` | Yes | None | `docs/src/routes/community/+page.svelte:419` |

Verified live against `/` and `/components/Button` by fetching raw HTML: both carry the full
canonical/OG/Twitter set; only `/` carries JSON-LD. Every page shares one `og.png` — there is no
per-section social card.

### Live anomalies found during the audit

- **The live sitemap has 391 `<url>` entries; the registries checked out locally compute 288**
  (6 fixed routes + 216 components + 22 docs/package pages + 42 template shims + 2 blog posts, counted
  by importing the generated registries directly). `docs/src/lib/generated/*.js` is gitignored and
  only rebuilt by running `pnpm -F docs generate`; the deployed site's `Last-Modified` header reads
  today, 2026-08-15, so the live number is not stale — it is the local checkout's regenerated
  registries that disagree with what was last deployed. This needs reconciling before any sitemap or
  `llms.txt` work ships (Open questions).
- **The site is case-insensitive at the routing layer on Vercel.** `/components/Button`,
  `/components/button`, `/Components/Button`, `/COMPONENTS/BUTTON` and `/components/bUtToN` all
  return `200` with identical content, and all correctly self-report
  `<link rel="canonical" href="…/components/Button">`. Not a defect — canonical tags exist for
  exactly this — but it means every one of 216 component pages has an unbounded number of
  crawlable case-variant URLs, which is worth confirming Search Console never flags as duplicate
  content once the site has search history.
- **`/does-not-exist-page` returns a correct `404`.**

## Part 2 — SEO, AEO and GEO are not the same problem

Treating these as one continuum with three names is the single most common mistake in the current
literature, and it would waste the leverage `generate-content.mjs` provides. They optimize for three
different consumers, and two of the three trade against each other.

### SEO — optimizing for a crawler that ranks whole pages

The audience is Googlebot (and Bingbot) building an index, and the win condition is ranking for a
query. What matters: crawlability (`robots.txt`, sitemap), canonicalization, per-page titles and
descriptions, structured data that Google's Rich Results system recognizes, internal linking, and
Core Web Vitals — LCP under 2.5s, INP under 200ms, CLS under 0.1, measured at the 75th percentile of
real user loads [web.dev/vitals]. This is the site's strongest area already (Part 1).

One measured risk this audit did not resolve: the homepage's HTML `<head>` alone lists over 50
`modulepreload` chunks before any content tag. The site is fully prerendered — SEO-fine on the HTML
Google reads — but the client hydration payload is large enough that INP is worth measuring with a
real Lighthouse run rather than assuming a prerendered site is automatically fast (Open questions).

### AEO — optimizing for one direct answer

Answer Engine Optimization targets the single-answer surfaces: Google's featured snippets, People
Also Ask panels, and voice/assistant direct answers. Practitioner consensus (largely blog-sourced,
not primary research — see the honesty note below) converges on a consistent shape: a question-form
H2/H3, a 40-60 word self-contained definitional answer immediately under it, then supporting detail,
then a table or list. Paragraph snippets account for roughly 70% of featured snippets and reward
exactly that "what is X" framing.

**The one finding here that contradicts a common assumption: Google discontinued the FAQ rich result
as of May 7, 2026** — the expandable Q&A dropdown under a search listing is gone for every site, the
Rich Results Test stopped supporting it in June, and Search Console API support for it ends in
August 2026 [Search Engine Journal]. `FAQPage` remains a valid schema.org type and Google says it
will keep parsing it for page understanding, but **the SERP payoff that used to justify authoring it
no longer exists.** This site has no FAQ-shaped content today, and manufacturing one purely for a
rich result that Google just removed would be optimizing for a surface that stopped existing three
months before this audit.

### GEO — optimizing for a paragraph inside someone else's answer

Generative Engine Optimization targets citation inside an LLM-composed answer — ChatGPT, Claude,
Perplexity, Google AI Overviews. This is the one branch with actual peer-reviewed measurement behind
it, not just marketing-blog consensus, and the finding is specific: content bearing
machine-extractable **quotations, statistics, and citations** measurably increases the odds of being
the source an LLM quotes — the original GEO study found strategies boosting visibility up to 40% in
generative responses, with efficacy varying by domain [Aggarwal et al., arXiv:2311.09735], and a 2026
survey of 45 follow-up studies confirms that quotations/statistics/citations each independently carry
roughly 25-40% of that lift [arXiv:2607.14035]. Separately, across ~366,000 tracked citations,
different generative engines cite different sources for the same query — cross-engine agreement is
low, so optimizing for one engine's citation behavior does not transfer cleanly to another
[arXiv:2607.14035].

This is where the two existing blog posts are already doing the right thing without anyone having
aimed for it: both are full of exact numbers (`1528 style keys checked … 0 mismatches`, `2418
declarations across seven packages`), named sources, and a first-person account of a real bug found.
That is precisely the "machine-extractable provenance" the research says gets quoted. The component
and docs pages, by contrast, are prop tables and prose with no numbers to extract.

### Where they conflict

| Tension | SEO wants | AEO/GEO wants | Resolution here |
| --- | --- | --- | --- |
| Page weight | Minimal JS, fast INP | — (irrelevant to a static crawler or an LLM ingesting text) | SEO's constraint is stricter; optimize for it, GEO gets it for free |
| `FAQPage` markup | No SERP benefit as of May 2026 | Still a legitimate machine-readable Q&A signal for LLM ingestion, if real FAQ content existed | Do not author FAQ content to chase a removed rich result; keep the type available if genuine FAQ content is ever written |
| `llms-full.txt` (full page text at one URL) | Duplicate-content surface a crawler might index alongside the real pages | Exactly the single-fetch, high-signal document GEO/agent consumers want | Serve it with a non-indexable content type or `noindex`-equivalent signal so it helps agents without competing with the real pages in Google's index |
| One shared `og.png` for all 391 pages | Fine — Google does not weight social images | Neutral | Low priority either way (Part 3) |
| Case-insensitive routing | Handled correctly by canonical tags | Neutral — an LLM fetching a `.md` URL would need the same canonicalization | Extend the same canonical discipline to any new `.md` routes |

**Honesty note on sourcing.** Much of the current AEO/GEO "guidance" in circulation is
marketing-content-mill writing — dozens of nearly identical "2026 guide" posts citing each other
rather than primary data. This plan cites the two arXiv papers above because they are actual
measurement; everything else attributed to "practitioner consensus" is flagged as such rather than
presented as settled research.

## Part 3 — Recommendations, ranked by leverage

Ranked by (value delivered) / (authoring cost), given that `generate-content.mjs` already holds the
full content graph in memory at build time. "Generated" means a build script emits it from existing
registries with no new prose; "hand-authored" means someone has to write real content.

### Tier 1 — generated, near-zero cost, ship first

1. **Reconcile the sitemap discrepancy before touching anything else.** Run `pnpm -F docs generate`,
   redeploy, and confirm the live sitemap's URL count matches what the checked-in generator computes.
   Every recommendation below assumes the registries are trustworthy; right now the live site and the
   local checkout disagree by 103 URLs and nobody has explained why (Open questions).
2. **`/llms.txt`, generated.** A short hand-written preamble (what the project is, one paragraph) plus
   H2-grouped links pulled straight from the existing registries — components, docs topics,
   templates, blog posts — is a `generate-content.mjs` output, not new prose. Adoption evidence is
   genuinely thin: one 300k-domain study puts site adoption at ~10%, and traffic analysis across
   500M+ AI bot requests found only ~408 actually targeting `llms.txt` files [digitalapplied.com,
   ariashaw.com] — **no major AI lab has publicly committed to reading it in production** as of early
   2026. Where the evidence is real is developer tooling: IDE agents (Claude Code, Cursor, Copilot)
   and MCP servers do fetch it [same sources]. That audience is not hypothetical here — this repo
   already builds `AGENTS.md`/`CLAUDE.md` generation for consumers of the *library*
   (`packages/cli/assets/docs/working-with-ai.doc.mjs`); an `llms.txt` for the *docs site* is the
   same idea one layer up, at near-zero cost, for an audience this project already believes in.
3. **Per-page `.md` mirrors, generated.** `/components/Button.md` serving the same prose the `.svelte`
   page renders, as a static prerendered route. This has real precedent (Mintlify, Cloudflare Pages,
   PostHog all ship this) and is more directly useful than `llms.txt` alone, because it is the actual
   per-page content an agent fetches rather than an index pointing elsewhere. Same registries, a new
   `+server.ts` per dynamic route tree.
4. **`llms-full.txt`, generated, as a concatenation of the same `.md` mirrors.** Cheap once (3) exists.
   Serve it `noindex`-equivalent (or at minimum exclude it from `sitemap.xml`) so it is an agent
   fetch target, not a duplicate-content page competing with the real ones (Part 2's conflict table).
5. **`BreadcrumbList` JSON-LD, generated.** Every `/components/[name]`, `/docs/[topic]`, and
   `/blog/[slug]` route has an unambiguous, mechanically derivable trail (Home → Components → Button).
   This is one of the schema.org types Google still renders as a SERP feature (unlike `FAQPage`), and
   the trail is exactly the same tree the sidebar already renders — this is emitting existing
   navigation state as JSON-LD, not authoring anything.
6. **RSS/Atom/JSON feed for the blog, generated.** Two posts today, both already structured data in
   `blog-registry.js` (title, description, date, tags, body). A feed route is a few dozen lines
   against data that already exists; the cost is entirely in the route, not the content.
7. **`security.txt`, RFC 9116, one static file.** The one genuinely standardized `.well-known/` entry
   worth having — a contact channel and, optionally, an expiry date. Everything else commonly proposed
   under `.well-known/` (AI-specific policy files, `humans.txt`-style conventions) is either
   speculative or already superseded by `robots.txt`'s `Content-Signal` extension (Part 4); this repo
   should not pad `.well-known/` with entries that do not correspond to a real, consumed standard.

### Tier 2 — moderate cost, real judgment required

- **`TechArticle` JSON-LD on `/docs/[topic]` and `/components/[name]`.** `TechArticle` (and its child
  type `APIReference`) exist on schema.org specifically for this shape of content
  [schema.org/TechArticle, schema.org/APIReference], but neither triggers a Google rich result —
  their value, if any, is purely as an unambiguous machine-readable content-type signal for LLM
  ingestion, and there is no published study (unlike the GEO citation research in Part 2) measuring
  whether that signal actually changes citation behavior. Worth doing because it is generated from
  the same registry data at near-zero marginal cost once (5) is built, but the payoff should be
  labeled speculative, not assumed.
- **`WebSite` + `SearchAction` — investigated and rejected.** This requires a server-resolvable
  search URL (`?q={query}`); the site's search is a client-side Cmd+K palette
  (`docs/src/lib/shell/search-index.ts`) with no such URL. Do not add this schema without first
  building a real `/search?q=` route — emitting `SearchAction` against a URL that does not work would
  be exactly the kind of invented-not-verified claim this port's own parity rule exists to prevent.
- **Per-section OG images.** Currently one `og.png` for all 391 pages. A distinct image per
  top-level section (components, blog, themes) is a design cost with a real but modest payoff — social
  shares look identical today regardless of what was shared.
- **Heading hierarchy and internal-linking audit.** Not performed in this pass; flagged as a real gap,
  not assessed (Open questions).

### Tier 3 — do not do, or defer indefinitely

- **`FAQPage` rich-result chasing.** The SERP feature it targeted was discontinued in May 2026
  (Part 2). Do not author FAQ content to earn a result that no longer exists.
- **Manufacturing quotable statistics on pages that do not have any**, purely to chase the GEO
  citation-rate research. The blog posts already do this because the underlying engineering work
  produces real numbers; component prop-table pages should not be padded with invented metrics to
  mimic that shape.

## Part 4 — Decision: AI crawler policy

`docs/static/robots.txt` today is maximally permissive — `User-agent: *` / `Disallow:` — which
already allows every named AI crawler by default. The question is not "block or allow" in the
aggregate; it is whether to **name** specific crawlers, which lets the operator distinguish training
crawlers from answer/retrieval crawlers rather than treating "AI" as one category.

| Bot | Operator | What it feeds | Respects `robots.txt`? |
| --- | --- | --- | --- |
| `GPTBot` | OpenAI | Model training | Yes, documented [developers.openai.com/api/docs/bots] |
| `OAI-SearchBot` | OpenAI | ChatGPT Search citations | Yes |
| `ChatGPT-User` | OpenAI | Live fetch during a user's ChatGPT session | Partial — OpenAI's own docs say "robots.txt rules may not apply" to this one, since it is a user-triggered fetch, not a crawl |
| `ClaudeBot` | Anthropic | Model training | Yes [support.claude.com/en/articles/8896518] |
| `Claude-User` | Anthropic | Live fetch during a user's Claude session | Yes |
| `Claude-SearchBot` | Anthropic | Search/answer indexing — Anthropic states blocking it "may reduce your site's visibility and accuracy in user search results" | Yes |
| `PerplexityBot` | Perplexity | Answer-engine retrieval and citation | Documented as compliant |
| `Google-Extended` | Google | Gemini training and grounding **only** — Google states this does not affect Search inclusion or ranking either way | Yes (it is a control token, not a live user agent) |
| `Applebot-Extended` | Apple | Apple foundation-model training data use, layered on top of ordinary `Applebot` crawling | Yes |
| `CCBot` | Common Crawl | A public, general-purpose web corpus that many downstream AI labs train on indirectly | Documented as compliant |
| `Bytespider` | ByteDance | Training data for ByteDance's own models (Doubao) | **Reported non-compliant** — multiple independent operators report it ignoring `robots.txt` and crawling at a scale far exceeding OpenAI's or Anthropic's bots [haproxy.com] |

**The trade-off, stated plainly:** every training crawler that is blocked is content this project's
maintainers keep out of some future model's weights; every one of them that is allowed is a path by
which an assistant someone is already talking to can learn this library exists and recommend it. For
most commercial content these pull in opposite directions and the decision is genuinely hard. For
this project specifically, they do not: the code is MIT-licensed and already public on GitHub, the
`.doc.mjs` prose being trained on is upstream Meta's own documentation (reused under CLAUDE.md's
parity rule, not this project's original writing), and the stated goal of the site is adoption. There
is close to nothing here that blocking a training crawler protects.

**Recommendation: keep `robots.txt` permissive by default and do not add bot-specific `Disallow`
rules**, with one narrow exception. Do not carve out exceptions for `Google-Extended` either way —
Google states explicitly that it has no bearing on Search ranking or inclusion, so blocking it would
only remove this site from Gemini grounding with zero SEO benefit in exchange, which is a pure loss
given the adoption goal.

The one exception: **add an explicit `Disallow` for `Bytespider`.** Not because it will honor the
directive — the evidence above says it likely will not — but because it costs one line, documents
intent for the crawlers that do check, and does not trade away anything: Bytespider feeds a model
this project has no stated interest in reaching, unlike GPTBot/ClaudeBot/PerplexityBot which are
directly the assistants a prospective adopter is likely to be talking to.

**Cloudflare's Content Signals Policy** — the `Content-Signal: search=yes, ai-train=no` line format
Cloudflare introduced in September 2025 [blog.cloudflare.com] — is not directly usable here: this
site deploys on Vercel (`docs/vercel.json`, `@sveltejs/adapter-vercel`), not behind Cloudflare, so
the policy has no enforcement point unless Cloudflare is added in front of it purely for this
feature. Not recommended solely for this purpose; note it as available if the hosting ever changes.

## Open questions

- **The 391-vs-288 sitemap discrepancy (Part 1).** Needs a fresh `pnpm -F docs generate` compared
  against the currently deployed build before any of Tier 1 ships, or the new `llms.txt`/`.md`
  routes will be built against the wrong page count from day one.
- **Core Web Vitals are unmeasured.** This audit read source and fetched raw HTML; it did not run
  Lighthouse or PageSpeed Insights against the live site. Given the ~50 `modulepreload` chunks
  observed in the homepage `<head>`, INP specifically should be measured before assuming the
  prerendered HTML's SEO strength carries through to the hydrated experience.
- **Heading hierarchy and internal linking were not audited.** Flagged in Tier 2 as a real gap, not
  assessed here.
- **Whether an agent-facing `llms.txt`/`.md` should differ in content from a human-facing one.** The
  adoption evidence (Part 3, item 2) says the real audience is coding agents and MCP tooling, not
  browsing AI Overviews — which argues for terser, code-example-forward content over marketing prose,
  but this was not decided.
- **IndexNow** (the Bing/Yandex fast-indexing protocol) was not researched for this plan; unclear
  whether it is worth the implementation cost for a site with no existing Bing presence data.
- **Whether Search Console will treat the case-insensitive URL variants (Part 1) as duplicate
  content** in practice cannot be verified until the site has real Search Console history.
- **Whether self-hosting the fourteen Google Fonts families** (already flagged as an open question
  in `docs/src/app.html`'s own comment, unrelated to this plan) would materially move LCP — adjacent
  to this plan's Core Web Vitals question but out of scope here.

## Sources

- llms.txt specification — https://llmstxt.org/ (fetched 2026-08-15; the site's own claim that
  "Chrome's Lighthouse audits sites for one" was not independently verified and should be treated as
  unverified)
- llms.txt adoption data — https://www.digitalapplied.com/blog/llms-txt-in-practice-adoption-evidence-2026
  and https://ariashaw.com/does-llms-txt-actually-work (secondary reporting on adoption-rate studies;
  primary study reports not directly fetched — flagged as unverified at the primary-source level)
- GEO: Generative Engine Optimization, Aggarwal et al. — https://arxiv.org/abs/2311.09735 (KDD 2024;
  fetched directly, abstract quoted)
- Optimizing Visibility in Generative Engines: A Critical Survey of GEO (2023-2026) —
  https://arxiv.org/abs/2607.14035 (45-study survey; 25-40% citation-rate lift figures, ~366,000
  citation cross-engine analysis)
- Anthropic's crawler documentation — https://support.claude.com/en/articles/8896518 (fetched
  directly, quotes verified)
- OpenAI's crawler documentation — https://developers.openai.com/api/docs/bots (fetched directly,
  user-agent strings and the `ChatGPT-User`/robots.txt caveat quoted verbatim)
- Google-Extended behavior — reported via https://www.searchenginejournal.com and aggregator sources;
  Google's own crawler-overview page (developers.google.com/search/docs/crawling-indexing/overview-google-crawlers,
  fetched directly) did not itself mention Google-Extended, so this claim rests on secondary
  reporting rather than a primary Google page — flagged as such
- Bytespider non-compliance — https://www.haproxy.com/blog/nearly-90-of-our-ai-crawler-traffic-is-from-tiktok-parent-bytedance-lessons-learned
  (operator-reported traffic data, not an official ByteDance statement)
- Cloudflare Content Signals Policy — https://blog.cloudflare.com/control-content-use-for-ai-training/
  (fetched via search; primary Cloudflare blog post, September 2025)
- RFC 9116 (security.txt) — https://www.rfc-editor.org/info/rfc9116/
- Core Web Vitals thresholds and the INP/FID transition — https://web.dev/articles/vitals (fetched
  directly, thresholds quoted verbatim: LCP 2.5s, INP 200ms, CLS 0.1, measured at p75)
- FAQ rich result deprecation (May 2026) — https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/
  (trade-press reporting; Google's own deprecation announcement not directly fetched for this pass —
  flagged as secondary)
- schema.org type definitions — https://schema.org/TechArticle, https://schema.org/APIReference,
  https://schema.org/BreadcrumbList, https://schema.org/SoftwareSourceCode (fetched via search;
  property lists such as `APIReference`'s `assemblyVersion`/`programmingModel` are noted as a legacy,
  compiled-SDK-flavored fit rather than a natural match for a component prop table)
- Repo sources: every file path and line number in Parts 1, 3 and 4 was read directly from this
  checkout on 2026-08-15, plus live HTTP checks against https://astryx-svelte.rohitk06.in/ on the
  same date (`curl`/`WebFetch`, raw responses recorded in this audit)
