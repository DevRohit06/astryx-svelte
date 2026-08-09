/**
 * @file Bundles each theme's source (`src/<slug>-theme.ts` + `icons.svelte`) and
 * a `manifest.json` into `packages/cli/assets/templates/themes/` so
 * `astryx-svelte theme add` can scaffold a theme without the package installed —
 * like page templates. Run from anywhere; commit the output so the published CLI
 * carries it.
 *
 * Three adaptations from upstream's `scripts/generate-cli-themes.mjs`, all of
 * them naming:
 *
 * - the theme source is `src/<slug>-theme.ts`, not `src/<slug>Theme.ts`, because
 *   this repo's files are kebab-case;
 * - the icon registry is `icons.svelte`, not `icons.tsx`;
 * - `toDisplayName` title-cases every hyphen segment rather than only the first
 *   character. Upstream never needed it (its seven slugs are single words with
 *   `y2k` special-cased) and this port ships an eighth, `liquid-glass`, which
 *   upstream has no counterpart for. The rule agrees with upstream's on all
 *   seven shared slugs, `Y2K` included.
 *
 * The script lives under `packages/cli/scripts/` rather than a repo-root
 * `scripts/` because this repo has no root script directory; `test:themes-bundle`
 * runs it in `--check` mode so a stale bundle fails CI rather than shipping.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(CLI_ROOT, '..', '..');
const THEMES_SRC_ROOT = path.join(REPO_ROOT, 'packages', 'themes');
const CLI_THEMES_OUT = path.join(CLI_ROOT, 'assets', 'templates', 'themes');

/** Flagged in the manifest so `theme list` can mark it "(maintained)". */
const MAINTAINED_SLUG = 'neutral';

/** The icon registry every theme in this port ships, bundled beside the source. */
const ICONS_FILE = 'icons.svelte';

/**
 * `liquid-glass` → `liquidGlass`. Used for the `<id>Theme` export name.
 * @param {string} slug
 * @returns {string}
 */
function toIdentifier(slug) {
	return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Title-case a slug for display — `liquid-glass` → `Liquid Glass`, with `y2k`
 * special-cased to `Y2K` as upstream special-cases it.
 * @param {string} slug
 * @returns {string}
 */
function toDisplayName(slug) {
	if (slug === 'y2k') return 'Y2K';
	return slug
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

/** @param {string} file */
function readJSON(file) {
	return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

/**
 * Theme slugs that qualify for the bundle: a directory under `packages/themes`
 * with a `package.json` and a `src/<slug>-theme.ts`. `shared/` is excluded by
 * that rule rather than by name — it is repo tooling with neither.
 * @returns {string[]}
 */
function listThemeSlugs() {
	if (!fs.existsSync(THEMES_SRC_ROOT)) return [];
	return fs
		.readdirSync(THEMES_SRC_ROOT, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => e.name)
		.filter((slug) => {
			const pkg = path.join(THEMES_SRC_ROOT, slug, 'package.json');
			const themeFile = path.join(THEMES_SRC_ROOT, slug, 'src', `${slug}-theme.ts`);
			return fs.existsSync(pkg) && fs.existsSync(themeFile);
		})
		.sort();
}

/**
 * Compute the bundle as an in-memory map of relative path → contents, so
 * `--check` can compare without writing and the write path has one source.
 * @returns {{files: Map<string, string>, count: number}}
 */
function computeBundle() {
	const slugs = listThemeSlugs();
	/** @type {Map<string, string>} */
	const files = new Map();
	/** @type {object[]} */
	const entries = [];

	for (const slug of slugs) {
		const id = toIdentifier(slug);
		const srcDir = path.join(THEMES_SRC_ROOT, slug, 'src');
		const themeFileName = `${slug}-theme.ts`;

		const names = [themeFileName];
		files.set(
			`${slug}/${themeFileName}`,
			fs.readFileSync(path.join(srcDir, themeFileName), 'utf-8')
		);

		const iconsFile = path.join(srcDir, ICONS_FILE);
		if (fs.existsSync(iconsFile)) {
			names.push(ICONS_FILE);
			files.set(`${slug}/${ICONS_FILE}`, fs.readFileSync(iconsFile, 'utf-8'));
		}

		let description = '';
		try {
			description = readJSON(path.join(THEMES_SRC_ROOT, slug, 'package.json')).description || '';
		} catch {
			/* best-effort */
		}

		entries.push({
			slug,
			displayName: toDisplayName(slug),
			description,
			maintained: slug === MAINTAINED_SLUG,
			entry: themeFileName,
			exportName: `${id}Theme`,
			files: names
		});
	}

	files.set(
		'manifest.json',
		JSON.stringify(
			{ version: 1, generatedBy: 'scripts/generate-cli-themes.mjs', themes: entries },
			null,
			2
		) + '\n'
	);

	return { files, count: entries.length };
}

function main() {
	const check = process.argv.includes('--check');
	const { files, count } = computeBundle();

	if (count === 0) {
		console.warn('generate-cli-themes: no theme packages found — skipping.');
		return;
	}

	if (check) {
		/** @type {string[]} */
		const problems = [];
		for (const [rel, contents] of files) {
			const dest = path.join(CLI_THEMES_OUT, rel);
			if (!fs.existsSync(dest)) {
				problems.push(`missing: ${rel}`);
				continue;
			}
			if (fs.readFileSync(dest, 'utf-8') !== contents) problems.push(`stale:   ${rel}`);
		}
		// The other direction: a theme removed from `packages/themes` must not
		// linger in the bundle, which the write path handles by resetting the
		// directory and `--check` would otherwise never notice.
		for (const rel of listBundleFiles()) {
			if (!files.has(rel)) problems.push(`orphan:  ${rel}`);
		}
		if (problems.length > 0) {
			console.error(`generate-cli-themes --check: ${problems.length} problem(s):`);
			for (const p of problems) console.error(`  ${p}`);
			console.error('  Rebuild with: pnpm -F @astryx-svelte/cli generate-themes');
			process.exitCode = 1;
			return;
		}
		console.log(`generate-cli-themes --check: ${count} themes, bundle is up to date.`);
		return;
	}

	// Reset the output dir so removed themes don't linger.
	fs.rmSync(CLI_THEMES_OUT, { recursive: true, force: true });
	for (const [rel, contents] of files) {
		const dest = path.join(CLI_THEMES_OUT, rel);
		fs.mkdirSync(path.dirname(dest), { recursive: true });
		fs.writeFileSync(dest, contents);
	}

	console.log(
		`generate-cli-themes: wrote ${count} themes + manifest to ` +
			`${path.relative(REPO_ROOT, CLI_THEMES_OUT)}`
	);
}

/**
 * Every file currently in the bundle, as `<slug>/<name>` / `manifest.json`
 * keys matching {@link computeBundle}'s.
 * @returns {string[]}
 */
function listBundleFiles() {
	if (!fs.existsSync(CLI_THEMES_OUT)) return [];
	/** @type {string[]} */
	const out = [];
	for (const entry of fs.readdirSync(CLI_THEMES_OUT, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			for (const name of fs.readdirSync(path.join(CLI_THEMES_OUT, entry.name))) {
				out.push(`${entry.name}/${name}`);
			}
		} else {
			out.push(entry.name);
		}
	}
	return out;
}

main();
