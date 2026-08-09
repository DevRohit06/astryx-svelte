import blog from '$lib/generated/blog-registry.js';

/**
 * The blog index's data — the generated registry, straight through.
 *
 * Prerendered like every other route on this site. Drafts are already resolved
 * at generate time (`NODE_ENV !== 'production'` includes them), so there is no
 * filtering to do here and no reason for this to run in the browser.
 */
export const prerender = true;

export function load() {
	return { posts: blog.posts, availableTypes: blog.types };
}
