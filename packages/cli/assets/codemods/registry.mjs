/**
 * @file Codemod version registry — maps a released version to the transform
 * manifest that migrates *into* it. `upgrade` walks it to decide which codemods
 * apply between two versions.
 *
 * ## It held exactly one version as of 0.4.0, and getting there was the point
 *
 * Upstream registers 18 versions (`0.0.2` … `0.3.0` at the time this port's
 * registry was written, `0.4.0` now), each a lazy import of a transform module
 * under `assets/codemods/transforms/v<version>/`. This file was **empty** until
 * 0.4.0, and honestly so: a codemod migrates *between* two releases, and this
 * port had released one. That is no longer true. 0.4.0 tracks upstream 0.4.1 and
 * carries a breaking change — `useTableRowExpansion` became a detail-panel
 * plugin (upstream PR #4609) and `useTableRowExpansionState` was removed — so
 * `v0.4.0/migrate-table-rowexpansion-to-tree.mjs` is the first real entry, the
 * one the old note here said would land at the second release.
 *
 * The remaining upstream codemod assets are still **deferred, not adopted**.
 * Every one is a jscodeshift transform over `.tsx`; they migrate React source
 * between React Astryx versions and would be wrong to ship against Svelte source
 * even if they could be parsed. A transform lands here only when it has been
 * rewritten against the `magic-string` + `svelte/compiler` api (see
 * `run-codemod.mjs`) and tested against Svelte fixtures.
 *
 * The two consequences of the old emptiness are still handled at the call sites,
 * and both now take their populated branch:
 *
 *   - `latestVersion` is typed `string | undefined`, so a caller that forgets to
 *     guard fails to typecheck instead of passing `undefined` into a comparator.
 *     `_adapter.collectAllCodemods` is the one caller and guards.
 *   - `getTransformsBetween` returns `[]` for a range below 0.4.0, which routes
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
const registry = new Map([['0.4.0', () => import('./transforms/v0.4.0/index.mjs')]]);

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
