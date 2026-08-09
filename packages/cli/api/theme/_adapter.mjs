/**
 * @file Shared data layer for the `theme` command's `add`/`list` leaves — reads
 * the bundled-theme manifest (`assets/templates/themes/manifest.json`, generated
 * by `scripts/generate-cli-themes.mjs`) and resolves a theme by slug. Both leaves
 * sit on this; neither reads the manifest itself.
 *
 * Worth stating plainly, because TODO.md's slice sizing assumed otherwise:
 * **nothing here loads a theme module.** `theme list` and `theme add` are a JSON
 * read and a file copy. The "plain Node cannot load this port's theme packages"
 * problem belongs to `clients/cli/lib/resolve-theme.mjs` (which answers "what
 * theme is this project configured with") and to `theme build` (which needs
 * core's generator) — not to these two.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { CLI_ROOT } from '../../foundation/fs/paths.mjs';
import { AstryxError } from '../error.mjs';
import { ERROR_CODES } from '../../foundation/response/error-codes.mjs';

/** Directory holding the generated theme bundle. */
export const THEMES_DIR = path.join(CLI_ROOT, 'assets', 'templates', 'themes');
/** The bundle manifest that lists every theme (+ its files). */
export const MANIFEST_PATH = path.join(THEMES_DIR, 'manifest.json');

/**
 * A single bundled theme entry from `templates/themes/manifest.json`.
 * @typedef {object} BundledTheme
 * @property {string} slug
 * @property {string} displayName
 * @property {string} description
 * @property {boolean} maintained
 * @property {string} entry
 * @property {string} exportName
 * @property {string[]} files
 */

/**
 * Parsed `themes` array from the bundle manifest (empty if not generated).
 * @returns {BundledTheme[]}
 */
export function listThemes() {
	if (!fs.existsSync(MANIFEST_PATH)) return [];
	/** @type {{themes?: BundledTheme[]}} */
	let manifest;
	try {
		manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
	} catch (err) {
		throw new AstryxError(
			`Theme bundle manifest is unreadable (${MANIFEST_PATH}): ${/** @type {any} */ (err).message}`,
			undefined,
			ERROR_CODES.ERR_NO_SOURCE
		);
	}
	return Array.isArray(manifest.themes) ? manifest.themes : [];
}

/**
 * Resolve a bundled theme by slug (case-insensitive). `undefined` when the slug
 * is empty or unknown.
 * @param {string} [slug]
 * @returns {BundledTheme | undefined}
 */
export function findTheme(slug) {
	if (!slug) return undefined;
	const lc = String(slug).toLowerCase();
	return listThemes().find((t) => t.slug.toLowerCase() === lc);
}
