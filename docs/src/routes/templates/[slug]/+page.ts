import { error } from '@sveltejs/kit';
import templateRegistry from '$lib/generated/template-registry.js';
import type { EntryGenerator, PageLoad } from './$types.js';

/**
 * `/templates/<slug>` → `/templates?preview=<slug>`, which is upstream's route
 * verbatim: its `[slug]/page.tsx` is a `generateStaticParams` over the same
 * registry and a `redirect()`, and nothing else. The real detail UI is the
 * preview dialog on the gallery, so the query string is a template's address and
 * this route exists to keep a direct link to the older, path-shaped one working.
 *
 * `entries` is `generateStaticParams`: nothing on the site links here, so
 * without it the prerenderer would never discover the route and the bounce
 * would exist only for the dev server.
 *
 * The 404 is this port's addition and is one line. Upstream redirects any slug,
 * including one it has never heard of, which lands the reader on a gallery whose
 * dialog silently does not open. Since the registry is right here, an unknown
 * slug can say so instead. That includes the `scaffold` template the registry
 * skips: `/templates/blank` 404s rather than bouncing to a preview that cannot
 * open — upstream's `generateStaticParams` reads the same registry, so it does
 * not statically generate that slug either.
 *
 * ## Why this is a bounce page rather than a `redirect(308, …)`
 *
 * It was a 308, and that **cannot be prerendered**. On a redirect the
 * prerenderer writes the redirect file *and* enqueues the destination as a page
 * of its own (`kit/src/core/postbuild/prerender.js:421` —
 * `if (is_root_relative(resolved)) void enqueue(...)`). The destination here
 * carries a query, so it is saved as `templates?preview=<slug>.html`: junk on
 * Linux, and a hard `ENOENT` build failure on Windows, where `?` is not legal in
 * a filename. The whole site is `prerender = true` (see `+layout.ts`), so there
 * is no request-time branch to fall back to.
 *
 * So `load` no longer redirects; `+page.svelte` carries the `meta refresh` and
 * the `location.href` assignment instead. That pair is not an invention — it is
 * character-for-character the body SvelteKit itself writes for a prerendered
 * redirect (`prerender.js:431-437`). The reader experiences the same instant
 * bounce; what is lost is the *HTTP* status, so `adapter-vercel` no longer emits
 * a redirect rule for these paths and a crawler sees 200-then-refresh rather
 * than 308. For a legacy-link shim that nothing on the site links to, that is
 * the cheaper side of the trade — the alternative is dropping the route.
 */
export const prerender = true;

export const entries: EntryGenerator = () =>
	templateRegistry.map((entry) => ({ slug: entry.slug }));

export const load: PageLoad = ({ params }) => {
	if (!templateRegistry.some((entry) => entry.slug === params.slug)) {
		error(404, `No page template named "${params.slug}"`);
	}

	return { slug: params.slug };
};
