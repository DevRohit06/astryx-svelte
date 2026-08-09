/**
 * @file Path resolution utilities for the CLI.
 *
 * Finds packages/core, project root, and CLI package root.
 *
 * Three of the four helpers are upstream's verbatim; `listComponents` is the
 * one that had to move, because upstream's component directories sit at
 * `<core>/src/<PascalName>/` and this port's sit at
 * `<core>/src/lib/components/<kebab-name>/`. See its own note.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Root of the @astryx-svelte/cli package */
export const CLI_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Find packages/core directory by walking up from startDir.
 * Also checks node_modules/@astryx-svelte/core for installed usage.
 *
 * @param {string} [startDir]
 */
export function findCoreDir(startDir = process.cwd()) {
	let dir = startDir;

	for (let i = 0; i < 5; i++) {
		const candidate = path.join(dir, 'packages', 'core');
		if (fs.existsSync(candidate)) {
			return candidate;
		}

		const nodeModules = path.join(dir, 'node_modules', '@astryx-svelte', 'core');
		if (fs.existsSync(nodeModules)) {
			return nodeModules;
		}

		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}

	return null;
}

/**
 * Find the monorepo root by looking for the root package.json
 * that has workspaces defined.
 *
 * @param {string} [startDir]
 */
export function findProjectRoot(startDir = process.cwd()) {
	let dir = startDir;

	for (let i = 0; i < 5; i++) {
		const pkgPath = path.join(dir, 'package.json');
		if (fs.existsSync(pkgPath)) {
			try {
				const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
				if (pkg.workspaces) {
					return dir;
				}
			} catch {
				// skip invalid JSON
			}
		}

		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}

	return null;
}

/**
 * Discover external Astryx-compatible packages from node_modules.
 * Scans for packages with an "astryx" field in their package.json:
 *
 *   { "astryx": { "docs": "./src", "category": "Common", "blocks": "./blocks/components" } }
 *
 * Returns array of { name, category, docsDir, blocksDir }.
 *
 * The field key stays `astryx`, not `astryx-svelte`: it is a published
 * convention third-party packages author against, and renaming it would fork
 * the ecosystem contract for no gain. The theoretical cost is that a React
 * Astryx add-on installed alongside this port would be picked up and its React
 * source read as Svelte. That is theoretical today — neither `@astryxdesign/core`
 * nor `@astryxdesign/cli` declares the field, and both are installed in this
 * repo — so the skip below still names only our own core, exactly as upstream's
 * names only theirs.
 *
 * @param {string} [startDir]
 */
export function discoverExternalPackages(startDir = process.cwd()) {
	/** @type {Array<{name: string, category: string, docsDir: string, blocksDir: string | null}>} */
	const externals = [];
	let dir = startDir;

	// Walk up to find node_modules
	let nodeModulesDir = null;
	for (let i = 0; i < 5; i++) {
		const candidate = path.join(dir, 'node_modules');
		if (fs.existsSync(candidate)) {
			nodeModulesDir = candidate;
			break;
		}
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}

	if (!nodeModulesDir) return externals;

	/** @param {string} searchDir */
	const scanDir = (searchDir) => {
		if (!fs.existsSync(searchDir)) return;
		const entries = fs.readdirSync(searchDir, { withFileTypes: true });

		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			if (entry.name.startsWith('.') || entry.name === '.bin') continue;

			const fullPath = path.join(searchDir, entry.name);

			// Recurse into scoped packages (@org/*)
			if (entry.name.startsWith('@')) {
				scanDir(fullPath);
				continue;
			}

			const pkgJsonPath = path.join(fullPath, 'package.json');
			if (!fs.existsSync(pkgJsonPath)) continue;

			try {
				const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
				if (pkg.name === '@astryx-svelte/core') continue;
				if (pkg.astryx && pkg.astryx.docs) {
					externals.push({
						name: pkg.name,
						category: pkg.astryx.category || pkg.name,
						docsDir: path.resolve(fullPath, pkg.astryx.docs),
						blocksDir: pkg.astryx.blocks ? path.resolve(fullPath, pkg.astryx.blocks) : null
					});
				}
			} catch {
				// skip invalid JSON
			}
		}
	};

	scanDir(nodeModulesDir);
	return externals;
}

/**
 * List available component directories in packages/core.
 *
 * Upstream reads `<core>/src` and filters out the three non-component siblings
 * that live there (`hooks`, `theme`, `utils`). This port's components are
 * already isolated one level deeper, at `<core>/src/lib/components`, with
 * `hooks`/`theme`/`utils`/`internal`/`i18n`/`styles`/`locales` as siblings of
 * `components` rather than of the components themselves — so the deny-list has
 * nothing left to deny and reading the narrower directory replaces it. The
 * ported test keeps upstream's case and asserts the same property: those three
 * names never appear in the result.
 *
 * Returns **directory names**, which is upstream's literal contract but not its
 * effective one: upstream's directories are named for the component
 * (`src/Button`), where ours are kebab-case (`src/lib/components/button`).
 *
 * **That is the right answer here and the wrong one for a component list**, and
 * the difference was settled by measurement (see TODO.md, slice 2). Name →
 * directory is not a function in this port: 98 of 191 exported components have
 * no directory of their own — `AvatarStatusDot` lives in `avatar/`,
 * `ChatComposer` in `chat/` — and even a filename rule breaks on aliased
 * re-exports (`BreadcrumbMenuItem` *is* `dropdown-menu-item.svelte`), on casing
 * (`hstack.svelte` pascalises to `Hstack`) and on location (`Theme` is under
 * `src/lib/theme/`). The public component list therefore comes from the
 * **barrel**, in `foundation/discovery/`, not from this function.
 *
 * What this function is for is `swizzle` (slice 7), which copies a *directory*
 * and wants directory names. It stays as it is.
 *
 * @param {string} coreDir
 */
export function listComponents(coreDir) {
	const componentsDir = path.join(coreDir, 'src', 'lib', 'components');
	if (!fs.existsSync(componentsDir)) return [];

	const entries = fs.readdirSync(componentsDir, { withFileTypes: true });
	return entries
		.filter((e) => e.isDirectory())
		.map((e) => e.name)
		.sort();
}
