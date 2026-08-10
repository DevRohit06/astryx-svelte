import blog from '$lib/generated/blog-registry.js';
import components from '$lib/generated/component-registry.js';
import docs from '$lib/generated/docs-registry.js';
import templates from '$lib/generated/template-registry.js';
import { absolute } from '$lib/seo/site.js';

/**
 * The sitemap, built from the same registries the pages render from.
 *
 * Enumerating routes by hand would drift the moment a component landed; reading
 * the registries means a page that exists is a page that is listed, by
 * construction. Before this, the site had a `robots.txt` allowing everything and
 * no sitemap at all, so ~180 generated pages were reachable only by crawling
 * links.
 *
 * Prerendered, like every other route here, so it ships as a static file.
 */
export const prerender = true;

interface Entry {
	path: string;
	/** Relative to the rest of the site, not an absolute quality score. */
	priority: number;
	changefreq: 'daily' | 'weekly' | 'monthly';
	lastmod?: string;
}

function entries(): Entry[] {
	const out: Entry[] = [
		{ path: '/', priority: 1.0, changefreq: 'weekly' },
		{ path: '/components', priority: 0.9, changefreq: 'weekly' },
		{ path: '/themes', priority: 0.8, changefreq: 'monthly' },
		{ path: '/templates', priority: 0.8, changefreq: 'monthly' },
		{ path: '/blog', priority: 0.7, changefreq: 'weekly' },
		{ path: '/community', priority: 0.5, changefreq: 'monthly' }
	];

	// Component pages are the bulk of the site and the reason most people arrive.
	for (const component of components) {
		out.push({ path: `/components/${component.name}`, priority: 0.8, changefreq: 'monthly' });
	}
	for (const topic of docs) {
		out.push({ path: `/docs/${topic.name}`, priority: 0.7, changefreq: 'monthly' });
	}
	for (const template of templates) {
		out.push({ path: `/templates/${template.slug}`, priority: 0.6, changefreq: 'monthly' });
	}
	for (const post of blog.posts) {
		out.push({
			path: `/blog/${post.slug}`,
			priority: 0.6,
			changefreq: 'monthly',
			lastmod: post.date
		});
	}
	return out;
}

const escape = (value: string) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function GET() {
	const urls = entries()
		.map(
			(entry) =>
				'\t<url>\n' +
				`\t\t<loc>${escape(absolute(entry.path))}</loc>\n` +
				(entry.lastmod ? `\t\t<lastmod>${escape(entry.lastmod)}</lastmod>\n` : '') +
				`\t\t<changefreq>${entry.changefreq}</changefreq>\n` +
				`\t\t<priority>${entry.priority.toFixed(1)}</priority>\n` +
				'\t</url>'
		)
		.join('\n');

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
			`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
		{ headers: { 'Content-Type': 'application/xml' } }
	);
}
