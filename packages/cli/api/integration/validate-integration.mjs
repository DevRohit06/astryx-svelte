/**
 * @file Programmatic API for `astryx-svelte validate-integration`.
 *
 * Validates exactly ONE integration package at a time and reports findings
 * using the `AstryxIntegrationIssue` model (`{code, severity, message}`; see
 * `foundation/integrations/issue.ts`). Two entry points:
 *
 *   - `validateLocalIntegration(cwd)` — the package rooted at `cwd` (nearest
 *     package.json + sibling astryx-svelte.integration.{ts,mjs,js}).
 *   - `validateInstalledIntegration(spec, cwd)` — an installed package resolved
 *     from `cwd`/node_modules.
 *
 * Both return a `{found, name, version, manifestFile, issues}` result. `found`
 * is false only for the no-manifest local case, which is guidance (not an
 * error) so `validate-integration` can stay exit-0 in a non-integration dir.
 *
 * Validators are intentionally small and independent so more checks can be
 * appended without reshaping the result. Issue `code`s are stable public
 * strings.
 *
 * **All four checks are implemented as of slice 9**, having landed one per
 * slice as their dependencies arrived: `checkRoots` needs nothing but
 * `fs.existsSync` (slice 3); `checkComponents` needs `foundation/discovery/`
 * (slice 4); `checkTemplates` needs `api/template/` (slice 6); `checkCodemods`
 * needs the integration codemod discovery that rides with the `magic-string`
 * runner (slice 9). Together with the manifest half — presence, uniqueness,
 * schema, roots-inside-package and roots-exist — this is now every way an
 * integration can be wrong, both about itself and about its contents.
 *
 * **A layering note, replicated deliberately.** `foundation/` importing from
 * `api/` is backwards, and slice 1 was careful to avoid exactly this shape for
 * `manifest` (an `api → cli` cycle). Upstream did not avoid it here:
 * `foundation/config/project.mjs` and
 * `foundation/integrations/integration-warnings.mjs` both reach up into this
 * module. Ported as-is for parity and recorded in port/todo.md's known debts,
 * because changing the layering would move a published module's path.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { assertWithin } from '../../foundation/fs/path-safety.mjs';
import {
	findManifestPaths,
	loadManifestObject,
	resolvePackageDir
} from '../../foundation/integrations/integrations.mjs';
import * as componentDiscovery from '../../foundation/discovery/component-discovery.mjs';
import { discoverIntegrationTemplatesForOne } from '../template/template.mjs';
import { discoverIntegrationCodemods } from '../../assets/codemods/integration-discovery.mjs';

/**
 * @typedef {import('../../foundation/integrations/issue').AstryxIntegrationIssue} Issue
 */

/**
 * @typedef {Object} ValidateResult
 * @property {boolean} found Whether an integration manifest was located.
 * @property {string} [name] Integration package name (from package.json).
 * @property {string} [version] Integration package version.
 * @property {string} [manifestFile] Absolute path to the loaded manifest.
 * @property {Issue[]} issues
 */

/**
 * Find the nearest package.json starting from `cwd` and walking up.
 * @param {string} cwd
 * @returns {string | null} absolute path to the package.json, or null.
 */
function findNearestPackageJson(cwd) {
	let dir = path.resolve(cwd);
	for (;;) {
		const candidate = path.join(dir, 'package.json');
		if (fs.existsSync(candidate)) return candidate;
		const parent = path.dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}

/** @param {string} code @param {string} message @returns {Issue} */
function error(code, message) {
	return { code, severity: 'error', message };
}

/**
 * Verify each declared contribution root exists on disk. A declared-but-missing
 * root is a `missing_root` error.
 * @param {{components?: string, templates?: string, codemods?: string}} resolved
 *   absolute resolved roots (undefined when not declared)
 * @param {Issue[]} issues
 */
function checkRoots(resolved, issues) {
	const kinds = /** @type {const} */ (['components', 'templates', 'codemods']);
	for (const kind of kinds) {
		const root = resolved[kind];
		if (root == null) continue;
		if (!fs.existsSync(root)) {
			issues.push(error('missing_root', `Declared ${kind} root does not exist on disk: ${root}`));
		}
	}
}

/**
 * Validate the integration's codemods by running discovery over this
 * integration alone. Discovery IS the validation: it throws on a missing or
 * malformed default export, on a schema failure, and on a duplicate codemod id
 * within a package. A throw becomes one `invalid_codemod` error.
 *
 * Nothing is executed — the transforms are loaded and parsed, never run.
 *
 * @param {Record<string, any>} integration loaded-integration-shaped object
 * @param {Issue[]} issues
 */
async function checkCodemods(integration, issues) {
	if (!integration.codemods || !fs.existsSync(integration.codemods)) return;
	try {
		await discoverIntegrationCodemods([
			/** @type {{name?: string, codemods?: string, __spec?: string}} */ (integration)
		]);
	} catch (err) {
		issues.push(error('invalid_codemod', err instanceof Error ? err.message : String(err)));
	}
}

/**
 * Validate the integration's templates via template discovery, which records a
 * per-template problem (missing same-stem source, load failure, missing
 * `page`/`block` type) rather than throwing. Each becomes an `invalid_template`
 * error.
 *
 * @param {Record<string, any>} integration loaded-integration-shaped object
 * @param {Issue[]} issues
 */
async function checkTemplates(integration, issues) {
	if (!integration.templates || !fs.existsSync(integration.templates)) return;
	try {
		const { errors } = await discoverIntegrationTemplatesForOne(
			/** @type {{name?: string, __spec?: string, templates?: string}} */ (integration)
		);
		for (const e of errors) {
			issues.push(error('invalid_template', e.message));
		}
	} catch (err) {
		issues.push(error('invalid_template', err instanceof Error ? err.message : String(err)));
	}
}

/**
 * Validate the integration's components via the landed ownership discovery.
 *
 * `discoverIntegrationComponents` returns ownership records and does not throw
 * on a missing same-stem source — it records `sourcePath: null`. Each such
 * record becomes an `invalid_component` error. The one adaptation is the
 * extension named in the message: an integration here contributes a `.svelte`
 * file where upstream's contributes a `.tsx`.
 *
 * Upstream also feature-detects the export (a sibling PR of its own had not
 * merged yet); that guard is dropped, because the function is imported from a
 * module this package owns and is either there or a broken build.
 *
 * @param {Record<string, any>} integration loaded-integration-shaped object
 * @param {Issue[]} issues
 */
async function checkComponents(integration, issues) {
	if (!integration.components || !fs.existsSync(integration.components)) return;
	try {
		const records =
			componentDiscovery.discoverIntegrationComponents(
				/** @type {{name: string, components?: string, issuesUrl?: string}} */ (integration)
			) ?? [];
		for (const record of records) {
			if (record?.sourcePath == null) {
				issues.push(
					error(
						'invalid_component',
						`Component "${record?.name}" is missing its same-stem source file ${record?.name}.svelte.`
					)
				);
			}
		}
	} catch (err) {
		issues.push(error('invalid_component', err instanceof Error ? err.message : String(err)));
	}
}

/**
 * Run every contribution validator against a loaded-integration-shaped object.
 * All three landed across slices 4, 6 and 9; the function stayed in place
 * through each, so every restoration was one added line rather than a reshape
 * of `validateLoadedIntegration`.
 *
 * @param {Record<string, any>} integration
 * @param {Issue[]} issues
 */
async function runContributionChecks(integration, issues) {
	await checkCodemods(integration, issues);
	await checkTemplates(integration, issues);
	await checkComponents(integration, issues);
}

/**
 * Validate an already-LOADED integration (as produced by `loadIntegrations` in
 * `foundation/integrations/integrations.mjs` — absolute contribution roots plus
 * identity) and return its issues. This is the reuse seam for everyday commands
 * that have already loaded the configured integrations and want the SAME
 * validators that `validate-integration` runs, without re-resolving the
 * manifest from disk.
 *
 * The manifest schema is intentionally NOT re-validated here: `loadIntegrations`
 * already validated it (and throws otherwise), so by the time a command holds a
 * loaded integration the manifest is known-good. We re-run the on-disk
 * contribution checks (roots + codemods/templates/components) because those can
 * regress independently of the manifest (a deleted directory, a broken template).
 *
 * @param {Record<string, any>} loaded loaded-integration-shaped object
 * @returns {Promise<Issue[]>}
 */
export async function validateLoadedIntegration(loaded) {
	/** @type {Issue[]} */
	const issues = [];
	if (!loaded || typeof loaded !== 'object') return issues;
	checkRoots(
		{
			components: loaded.components,
			templates: loaded.templates,
			codemods: loaded.codemods
		},
		issues
	);
	await runContributionChecks(loaded, issues);
	return issues;
}

/**
 * Validate a single integration given its package directory and identity.
 * Shared core for the local and installed entry points.
 * @param {string} packageDir
 * @param {{name: string, version?: string}} identity
 * @returns {Promise<ValidateResult>}
 */
async function validateAtPackageDir(packageDir, identity) {
	/** @type {Issue[]} */
	const issues = [];
	/** @type {ValidateResult} */
	const result = {
		found: true,
		name: identity.name,
		version: identity.version,
		manifestFile: undefined,
		issues
	};

	const manifests = findManifestPaths(packageDir);
	if (manifests.length === 0) {
		issues.push(
			error(
				'missing_manifest',
				`No astryx-svelte.integration.{ts,mjs,js} found next to package.json in ${packageDir}.`
			)
		);
		return result;
	}
	if (manifests.length > 1) {
		issues.push(
			error(
				'multiple_manifests',
				`Multiple root manifests present (${manifests
					.map((m) => path.basename(m))
					.join(', ')}). Keep exactly one.`
			)
		);
		return result;
	}

	const manifestFile = manifests[0];
	result.manifestFile = manifestFile;

	// loadManifestObject loads the default export and validates it against the
	// integration schema (the shared load boundary). A missing default export or
	// a schema failure throws; we convert either into a single invalid_manifest
	// error issue so validate-integration stays exit-1-but-not-crash.
	let manifest;
	try {
		manifest = await loadManifestObject(
			manifestFile,
			`Integration manifest (${path.basename(manifestFile)})`
		);
	} catch (err) {
		issues.push(error('invalid_manifest', err instanceof Error ? err.message : String(err)));
		return result;
	}

	/**
	 * @param {string | null | undefined} value
	 * @param {string} [kind]
	 */
	const resolveRoot = (value, kind = 'contribution root') => {
		if (value == null) return undefined;
		try {
			return assertWithin(value, packageDir, { label: kind });
		} catch {
			// If the root escapes the package, report an issue instead of crashing.
			result.issues.push({
				code: 'root_outside_package',
				severity: 'error',
				message: `The ${kind} "${value}" resolves outside the integration package directory. Contribution roots must stay within the package.`
			});
			return undefined;
		}
	};

	const loaded = {
		name: identity.name,
		version: identity.version,
		components: resolveRoot(manifest.components),
		templates: resolveRoot(manifest.templates),
		codemods: resolveRoot(manifest.codemods),
		issuesUrl: manifest.issuesUrl,
		__spec: identity.name,
		__packageDir: packageDir,
		__manifestFile: manifestFile
	};

	// Roots + contribution checks are shared with validateLoadedIntegration so
	// the everyday-command nudge runs the exact same validators.
	issues.push(...(await validateLoadedIntegration(loaded)));

	return result;
}

/**
 * Validate the LOCAL integration package rooted at `cwd`: nearest package.json
 * + a single sibling astryx-svelte.integration.{ts,mjs,js}. A missing manifest
 * yields `found: false` (guidance, not an error) so callers stay exit-0.
 * @param {string} [cwd]
 * @returns {Promise<ValidateResult>}
 */
export async function validateLocalIntegration(cwd = process.cwd()) {
	const pkgJsonPath = findNearestPackageJson(cwd);
	if (!pkgJsonPath) {
		return { found: false, issues: [] };
	}
	const packageDir = path.dirname(pkgJsonPath);

	const manifests = findManifestPaths(packageDir);
	if (manifests.length === 0) {
		// No manifest next to package.json — guidance, not an error.
		return { found: false, issues: [] };
	}

	/** @type {{name?: string, version?: string}} */
	let pkg = {};
	try {
		pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
	} catch {
		// Identity falls back to undefined; the manifest checks still run.
	}

	return validateAtPackageDir(packageDir, {
		name: pkg.name ?? '(local package)',
		version: pkg.version
	});
}

/**
 * Validate an INSTALLED integration package resolved from `cwd`/node_modules.
 * @param {string} spec package name
 * @param {string} [cwd]
 * @returns {Promise<ValidateResult>}
 */
export async function validateInstalledIntegration(spec, cwd = process.cwd()) {
	// resolvePackageDir throws (path-safety guard) on a spec with path segments,
	// `..`, or an absolute path. Every other malformed input to this command
	// degrades into a diagnostic — so catch it here and return an issue instead
	// of letting the throw escape to a raw stack (human) / generic ERR_UNKNOWN
	// (--json).
	let packageDir;
	try {
		packageDir = resolvePackageDir(spec, cwd);
	} catch (err) {
		return {
			found: true,
			name: spec,
			version: undefined,
			issues: [error('invalid_package_spec', err instanceof Error ? err.message : String(err))]
		};
	}
	const pkgJsonPath = path.join(packageDir, 'package.json');

	/** @type {{name?: string, version?: string}} */
	let pkg;
	try {
		pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
	} catch {
		return {
			found: true,
			name: spec,
			version: undefined,
			issues: [
				error(
					'package_not_found',
					`Could not find installed integration package "${spec}" at ${pkgJsonPath}. Install it first.`
				)
			]
		};
	}

	return validateAtPackageDir(packageDir, {
		name: pkg.name ?? spec,
		version: pkg.version
	});
}

/**
 * Unified entry: validate the LOCAL integration (no `pkg`) or an INSTALLED one
 * (`pkg` given) and return the `integration.validate` envelope. The no-manifest
 * local case is guidance, not an error — it comes back with `name: null` and no
 * issues so the CLI can print a hint and stay exit-0.
 *
 * This is the seam that keeps the CLI a thin wrapper: the command handler calls
 * this and only chooses how to render (human vs --json) + the exit code.
 *
 * @param {string} [pkg] installed package name; omit to validate the cwd package
 * @param {{cwd?: string}} [options]
 * @returns {Promise<import('./validate-integration.type.mjs').ValidateIntegrationResponse>}
 */
export async function validateIntegration(pkg, options = {}) {
	const { cwd = process.cwd() } = options;
	const result = pkg
		? await validateInstalledIntegration(pkg, cwd)
		: await validateLocalIntegration(cwd);
	return {
		type: 'integration.validate',
		data: {
			name: result.found ? (result.name ?? null) : null,
			version: result.found ? (result.version ?? null) : null,
			issues: result.issues
		}
	};
}

/**
 * Summarize issues by severity.
 * @param {Issue[]} issues
 * @returns {{errors: number, warnings: number}}
 */
export function summarizeIssues(issues) {
	let errors = 0;
	let warnings = 0;
	for (const issue of issues) {
		if (issue.severity === 'error') errors += 1;
		else if (issue.severity === 'warning') warnings += 1;
	}
	return { errors, warnings };
}
