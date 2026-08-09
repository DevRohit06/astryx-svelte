import { error } from '@sveltejs/kit';
import docsRegistry from '$lib/generated/docs-registry.js';
import packageRegistry from '$lib/generated/package-registry.js';
import { componentHref } from '$lib/shell/links.js';
import type { EntryGenerator, PageLoad } from './$types.js';

/**
 * Upstream's `docs/[topic]/page.tsx` serves two kinds of slug from one route,
 * and so does this one:
 *
 *  - a **reference topic** from `docsRegistry`, rendered block by block;
 *  - a **package** from `packageRegistry`, rendered as its README.
 *
 * Theme packages are not served here — `/themes` owns those, so the registry
 * excludes them and a theme slug still 404s.
 *
 * The README markdown is `import()`ed inside the load rather than imported at
 * the top: it is ~40 KB that only two of the 22 slugs need, and a static import
 * would put it in the chunk every reference topic loads. The pages prerender,
 * so the text is inlined into the built payload either way.
 */
export const prerender = true;

export const entries: EntryGenerator = () => [
	...docsRegistry.map((topic) => ({ topic: topic.name })),
	...packageRegistry.map((pkg) => ({ topic: pkg.slug }))
];

/** Upstream's `CORE_STRIP_SECTIONS` — sections the site renders itself. */
const CORE_STRIP_SECTIONS = ['Quick Start', 'Resources', 'Astryx CLI'];

const REPO_CLONE = 'git clone https://github.com/devrohit06/astryx-svelte\ncd astryx-svelte';

/**
 * Upstream's `getInstallSteps`, with the branch this port needs: **no package
 * here is published yet**, so an `npm install` shown on its own would be a
 * command that cannot resolve. The unreleased form leads with the clone and
 * keeps the eventual npm line, labelled as the future it is.
 *
 * @param slug     the package's URL fragment
 * @param name     the full package name
 * @param released whether npm can actually resolve it
 */
function installStepsFor(slug: string, name: string, released: boolean) {
	if (slug === 'cli') {
		return released
			? [
					{ label: 'Install the CLI', code: `npm install -D ${name}` },
					{ label: 'Run a command', code: 'pnpm exec astryx-svelte component --list' }
				]
			: [
					{ label: 'Not on npm yet — run it from a clone', code: REPO_CLONE },
					{
						label: 'Run a command',
						code: 'node packages/cli/bin/astryx-svelte.mjs component --list'
					},
					{ label: 'Once it is published', code: `npm install -D ${name}` }
				];
	}

	const importStep = {
		label: 'Import a component',
		code: `import { Button } from '${name}';`,
		language: 'typescript'
	};

	return released
		? [{ label: 'Install the package', code: `npm install ${name}` }, importStep]
		: [
				{ label: 'Not on npm yet — run it from a clone', code: REPO_CLONE },
				{
					label: 'Once it is published',
					code: `npm install ${name} @astryx-svelte/theme-neutral @stylexjs/stylex`
				},
				importStep
			];
}

export const load: PageLoad = async ({ params }) => {
	const topic = docsRegistry.find((entry) => entry.name === params.topic);
	if (topic) return { kind: 'topic' as const, topic };

	const pkg = packageRegistry.find((entry) => entry.slug === params.topic);
	if (!pkg) error(404, `No documentation topic or package named "${params.topic}"`);

	const readmes = pkg.hasReadme
		? (await import('$lib/generated/package-readmes.js')).default
		: undefined;

	// `0.0.0` is the never-released marker, and `private` blocks publishing
	// outright. Either way npm cannot resolve the package today.
	const isReleased = !pkg.isPrivate && pkg.version !== '0.0.0';
	const isCore = pkg.slug === 'core';

	return {
		kind: 'package' as const,
		pkg,
		isReleased,
		readme: readmes?.[pkg.slug] ?? null,
		installSteps: installStepsFor(pkg.slug, pkg.name, isReleased),
		// Upstream's CTA on the component package, pointing at the gallery's
		// canonical entry.
		cta: isCore ? { label: 'View Components', href: componentHref('Button') } : undefined,
		stripSections: isCore ? CORE_STRIP_SECTIONS : undefined,
		stripIntro: isCore
	};
};
