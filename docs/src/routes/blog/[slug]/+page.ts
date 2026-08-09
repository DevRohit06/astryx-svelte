import { error } from '@sveltejs/kit';
import blog from '$lib/generated/blog-registry.js';

/**
 * One post — upstream's `app/blog/[slug]/page.tsx`, whose `generateStaticParams`
 * enumerates the same registry.
 *
 * `entries` is what makes the slugs prerenderable: SvelteKit cannot discover a
 * dynamic route it is never linked from, and while `/blog` does link every post
 * today, relying on that would make a post's page silently depend on the index
 * still listing it.
 */
export const prerender = true;

export function entries() {
	return blog.posts.map((post) => ({ slug: post.slug }));
}

export function load({ params }: { params: { slug: string } }) {
	const post = blog.posts.find((entry) => entry.slug === params.slug);
	if (!post) error(404, `No blog post named "${params.slug}"`);
	return { post };
}
