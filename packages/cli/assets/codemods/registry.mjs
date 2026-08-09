/**
 * @file Codemod version registry — maps a released version to the transform
 * manifest that migrates *into* it. `upgrade` walks it to decide which codemods
 * apply between two versions.
 *
 * ## It is empty, and that is the answer rather than a placeholder
 *
 * Upstream registers 18 versions (`0.0.2` … `0.3.0`), each a lazy import of a
 * transform module under `assets/codemods/transforms/v<version>/`. **This port
 * has released no versions**, so there is no transform between any two of them
 * and no `assets/codemods/transforms/` tree to point at. An empty `Map` is the
 * correct content, in the same sense `Project.codemods()`'s core half returning
 * `[]` is correct and `listTemplates()` returning `[]` was correct in slice 6a:
 * the mechanism is real, the data set is genuinely empty, and nothing here is
 * stubbed out waiting to be filled in with fake entries.
 *
 * The 146 upstream codemod assets are **deferred, not adopted**. Every one is a
 * jscodeshift transform over `.tsx`; they migrate React source between React
 * Astryx versions and would be wrong to ship against Svelte source even if they
 * could be parsed. When this port cuts its second release, the first real entry
 * goes here and points at a transform written against the
 * `magic-string` + `svelte/compiler` api (see `run-codemod.mjs`).
 *
 * Two consequences follow from the emptiness and are handled at the call sites
 * rather than papered over here:
 *
 *   - `latestVersion` is `undefined`. It is typed that way, so a caller that
 *     forgets to guard fails to typecheck instead of passing `undefined` into a
 *     comparator. `_adapter.collectAllCodemods` is the one caller and guards.
 *   - `getTransformsBetween` returns `[]` for every range, which routes
 *     `upgrade` to its `no_codemods` status short-circuit — the same path
 *     upstream takes for a range with no registered codemods.
 */

import { semverCompare } from '../../foundation/env/semver.mjs';

/**
 * Metadata a registry transform entry carries. `codemodType: 'config'` is the
 * convention that routes an entry at the consumer's astryx-svelte.config.*
 * instead of at discovered source files (see `runner.mjs`).
 *
 * @typedef {object} CoreTransformMeta
 * @property {string} title
 * @property {string} [description]
 * @property {string} [pr]
 * @property {string[]} [fileExtensions]
 * @property {string} [codemodType]
 */

/**
 * @typedef {object} CoreTransformEntry
 * @property {string} name
 * @property {import('../../authoring/codemod/type').CodemodTransform} transform
 * @property {CoreTransformMeta} meta
 * @property {boolean} [optional]
 */

/** @typedef {{version: string, transforms: CoreTransformEntry[]}} CoreVersionManifest */

/**
 * The receipt `runCodemods` returns for a completed core run.
 *
 * @typedef {object} CoreCodemodRunSummary
 * @property {number} totalFilesChanged
 * @property {number} totalTransformsApplied
 * @property {number} totalValidationBlocked
 * @property {string[]} writtenFiles
 * @property {Array<{file: string, codemod: string, error: string}>} errors
 * @property {Array<{name: string, meta: CoreTransformMeta, version: string}>} skippedOptional
 */

/** @type {Map<string, () => Promise<{default: CoreTransformEntry[]}>>} */
const registry = new Map();

/** All registered versions, sorted ascending. */
export const versions = [...registry.keys()].sort(semverCompare);

/**
 * The latest version in the registry — `undefined` while the registry is empty.
 * @type {string | undefined}
 */
export const latestVersion = versions[versions.length - 1];

/**
 * Get all transform manifests between two versions (exclusive of `from`,
 * inclusive of `to`). Returns an array of `{version, transforms}` sorted
 * ascending.
 *
 * @param {string} from Current version (exclusive).
 * @param {string} to Target version (inclusive).
 * @returns {Promise<CoreVersionManifest[]>}
 */
export async function getTransformsBetween(from, to) {
	const applicable = versions.filter(
		(v) => semverCompare(v, from) > 0 && semverCompare(v, to) <= 0
	);
	/** @type {CoreVersionManifest[]} */
	const results = [];

	for (const version of applicable) {
		const loader = registry.get(version);
		if (!loader) continue;
		const manifest = await loader();
		results.push({
			version,
			transforms: manifest.default
		});
	}

	return results;
}
