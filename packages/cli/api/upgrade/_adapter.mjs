/**
 * @file upgrade adapter — shared version-detection + codemod machinery.
 *
 * The engine the upgrade leaves (list/status/run) sit on. It owns the I/O and
 * resolution for the command: detecting the installed core version, refreshing
 * the managed agent-docs block, selecting codemods from the registry, loading
 * the consumer's project/integrations, and executing the core/integration
 * codemod runners. Leaves call these helpers and PROJECT the results into their
 * one response type; the dispatcher (`upgrade.mjs`) routes.
 *
 * Progress is emitted through the shared `logger` (silent by default), so the
 * CLI keeps its exact output while a programmatic caller stays quiet.
 *
 * ## Three of the port's four `formatCliCommand` call sites are here
 *
 * Upstream calls it at exactly five non-test sites and hard-codes the bare bin
 * everywhere else; that selectivity is the specification, so it is mirrored
 * site by site rather than swept. Three are the `init --features agents` nudges
 * in {@link refreshAgentDocs}; the fourth is the suggested command in the
 * `config_fixable` status. `build` and `search` hold upstream's other two.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
	ensureSvelteCompiler,
	tryLoadSvelteCompiler
} from '../../assets/codemods/svelte-parser.mjs';
import { getTransformsBetween, latestVersion } from '../../assets/codemods/registry.mjs';
import { runCodemods } from '../../assets/codemods/runner.mjs';
import {
	discoverIntegrationCodemods,
	selectIntegrationCodemods
} from '../../assets/codemods/integration-discovery.mjs';
import { runIntegrationCodemods } from '../../assets/codemods/integration-runner.mjs';
import { installAgentDocs, inspectAgentDocs } from '../../foundation/agent-docs/agent-docs.mjs';
import { formatCliCommand } from '../../foundation/env/package-manager.mjs';
import { Project } from '../../foundation/config/project.mjs';
import { loadIntegrations } from '../../foundation/integrations/integrations.mjs';
import { warnOnIntegrationIssues } from '../../foundation/integrations/integration-warnings.mjs';
import { logger } from '../logger.mjs';

const execFileAsync = promisify(execFile);

/**
 * @typedef {import('../../assets/codemods/registry.mjs').CoreTransformEntry} CoreTransformEntry
 * @typedef {import('../../assets/codemods/registry.mjs').CoreVersionManifest} CoreVersionManifest
 * @typedef {import('./upgrade.type.mjs').UpgradeOptions} UpgradeOptions
 * @typedef {import('../../foundation/integrations/integrations.mjs').LoadedIntegration} LoadedIntegration
 * @typedef {import('../../authoring/codemod/type').CodemodEntry} CodemodEntry
 */

/**
 * The core package whose installed version `upgrade` migrates *to*.
 *
 * Upstream also probes a legacy `@xds/core`, a name it renamed away from. This
 * port has published under exactly one name and never had a rename, so there is
 * no second entry to look for — inventing a legacy alias would be a lookup that
 * can never succeed. The loop shape is kept for the day there is one.
 */
const TARGET_PACKAGES = ['@astryx-svelte/core'];

/**
 * Detect the installed target version from node_modules.
 * @param {string} cwd
 * @returns {{version: string, packageName: string}|null}
 */
export function detectInstalledTargetVersion(cwd) {
	for (const packageName of TARGET_PACKAGES) {
		const pkgPath = path.resolve(cwd, 'node_modules', ...packageName.split('/'), 'package.json');
		try {
			const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
			if (pkg.version) return { version: pkg.version, packageName };
		} catch {
			// Missing/unreadable — try the next supported package name.
		}
	}
	return null;
}

/**
 * @param {(string | null | undefined | false)[] | undefined} files
 * @returns {string[]}
 */
export function uniqueFiles(files) {
	return [...new Set((files ?? []).filter(/** @returns {f is string} */ (f) => Boolean(f)))];
}

/**
 * Run the app config's post-codemod hooks (config.hooks.postCodemod).
 * Dry-run PREVIEWS (buildCommand still called, so a throw fails); apply executes.
 * @param {import('../../authoring/config/type').PostCodemodHook[]} hooks
 * @param {{packageDir: string, files: string[], apply: boolean}} context
 */
export async function runPostCodemodHooks(hooks, context) {
	if (!hooks || hooks.length === 0) return;
	const { packageDir, files, apply } = context;

	for (let i = 0; i < hooks.length; i++) {
		const hook = hooks[i];
		const label = hook.name ?? `postCodemod[${i}]`;
		if (typeof hook.buildCommand !== 'function') {
			throw new Error(`Post-codemod hook ${label} is missing a buildCommand function.`);
		}

		const cmd = await hook.buildCommand({ packageDir, files });
		if (!cmd) {
			logger.log(`Post-codemod hook ${label} produced no command; skipping.`);
			continue;
		}

		if (!apply) {
			const preview = [cmd.command, ...(cmd.args ?? [])].join(' ');
			logger.log(`Post-codemod hook ${label} (dry run): ${preview}`);
			continue;
		}

		await execFileAsync(
			cmd.command,
			cmd.args ?? [],
			/** @type {import('node:child_process').ExecFileOptions & {encoding: 'utf-8'}} */ ({
				cwd: cmd.options?.cwd ?? packageDir,
				timeout: cmd.options?.timeout ?? 300_000,
				stdio: 'pipe',
				encoding: 'utf-8',
				...cmd.options,
				env: { ...process.env, ...(cmd.options?.env ?? {}) }
			})
		);
		logger.log(`✓ Post-codemod hook ${label} completed.`);
	}
}

/**
 * Refresh (or, in dry-run, report) the managed agent-docs block after a version
 * bump. The block documents the INSTALLED library, so it must be re-synced on
 * EVERY upgrade path, including the no-codemods short-circuits.
 *
 * @param {{cwd: string, installedVersion: string, apply: boolean}} ctx
 * @returns {import('./upgrade.type.mjs').AgentDocsSummary}
 */
export function refreshAgentDocs({ cwd, installedVersion, apply }) {
	const inspection = inspectAgentDocs(cwd, installedVersion);
	/** @type {import('./upgrade.type.mjs').AgentDocsSummary} */
	const summary = {
		status: inspection.status,
		installedVersion,
		fromVersions: inspection.blockVersions,
		files: [],
		refreshed: false,
		action: 'none'
	};

	// Never initialized — don't silently create docs during an upgrade; nudge.
	if (inspection.status === 'missing') {
		summary.action = 'nudge-init';
		logger.warn(
			`No Astryx agent-docs block found — AI agents have no component index. Run \`${formatCliCommand('astryx-svelte init --features agents')}\` to install it.`
		);
		return summary;
	}

	if (inspection.status === 'current') return summary;

	// Stale.
	summary.files = inspection.staleFiles;
	const fromLabel = summary.fromVersions.length
		? `v${summary.fromVersions.join(', v')}`
		: 'an unknown version';

	if (!apply) {
		summary.action = 'would-refresh';
		logger.warn(
			`Agent docs are stale: block is at ${fromLabel}, installed is v${installedVersion}. Re-run with --apply to refresh (${summary.files.join(', ')}).`
		);
		return summary;
	}

	// Apply: rewrite only files that already carry a marker (onlyReplace).
	try {
		const written = installAgentDocs(cwd, { onlyReplace: true });
		summary.refreshed = written.length > 0;
		summary.files = written;
		if (summary.refreshed) {
			summary.action = 'refreshed';
			logger.log(
				`✓ Agent docs refreshed → v${installedVersion} (from ${fromLabel}): ${written.join(', ')}`
			);
		} else {
			summary.action = 'error';
			logger.warn(
				`Agent docs look stale but couldn't be refreshed — the <!-- ASTRYX:START -->/<!-- ASTRYX:END --> markers may be malformed. Run \`${formatCliCommand('astryx-svelte init --features agents')}\` to reinstall the block.`
			);
		}
	} catch {
		summary.action = 'error';
		logger.warn(
			`Could not refresh agent docs. Run \`${formatCliCommand('astryx-svelte init --features agents')}\` to update them manually.`
		);
	}
	return summary;
}

/**
 * Every registered codemod (oldest→newest) for `upgrade --list`. Registry walk
 * + flatten; nothing is run.
 *
 * `latestVersion` is `undefined` while the registry is empty (see
 * `assets/codemods/registry.mjs`), and the guard below is what keeps that from
 * reaching `semverCompare`. It retires itself the moment a version is
 * registered.
 *
 * @returns {Promise<Array<{name: string, title: string, version: string, pr?: string, optional: boolean}>>}
 */
export async function collectAllCodemods() {
	if (!latestVersion) return [];
	const codemods = [];
	const manifests = await getTransformsBetween('0.0.0', latestVersion);
	for (const { version, transforms } of manifests) {
		for (const { name, meta, optional } of transforms) {
			codemods.push({ name, title: meta.title, version, pr: meta.pr, optional: !!optional });
		}
	}
	return codemods;
}

/**
 * Core version manifests for the (from, to] range.
 * @param {string} from
 * @param {string} to
 * @returns {Promise<CoreVersionManifest[]>}
 */
export async function getCoreVersionManifests(from, to) {
	return [...(await getTransformsBetween(from, to))];
}

/**
 * Ensure the codemod parser is available before running codemods.
 *
 * Upstream's gate is `ensureJscodeshift`. Ours is `svelte`, for the same reason
 * and in the same place: it is the parser the runner needs, it is needed by
 * `upgrade` and nothing else, and it is an optional peer rather than a hard
 * dependency. `magic-string` — the other half of the runner — is a *declared*
 * dependency and so is never in question.
 *
 * @param {{installDeps?: boolean}} [options]
 * @returns {Promise<boolean>}
 */
export async function ensureCodemodDeps({ installDeps } = {}) {
	return ensureSvelteCompiler({ installDeps, silent: logger.silent });
}

/**
 * The resolved compiler surface, for the runners: `parse` to read a file and
 * `walk` to find offsets in what it returns. Only called after
 * {@link ensureCodemodDeps} has returned true, so the throw is a broken-invariant
 * guard rather than a user-facing path.
 *
 * Spread into the runner options rather than passed as one object, so the two
 * arrive under the names the transform api gives them and a future third piece
 * needs no new parameter.
 *
 * @returns {Promise<{parse: import('../../assets/codemods/svelte-parser.mjs').SvelteParse, walk: import('../../authoring/codemod/type').SvelteWalk}>}
 */
async function requireCompiler() {
	const compiler = await tryLoadSvelteCompiler();
	if (!compiler) throw new Error('The codemod parser (svelte/compiler) is unavailable.');
	return compiler;
}

/**
 * Run the CORE registry codemods. Runs BEFORE the config is loaded so a core
 * CONFIG codemod can repair a config the strict loader would otherwise reject.
 * @param {CoreVersionManifest[]} versionManifests
 * @param {{apply: boolean, path: string, codemod?: string, skipCodemods: Set<string>}} options
 */
export async function runCoreCodemods(
	versionManifests,
	{ apply, path: srcPath, codemod, skipCodemods }
) {
	return runCodemods(versionManifests, {
		apply,
		path: srcPath,
		codemod,
		skipCodemods,
		...(await requireCompiler()),
		silent: logger.silent
	});
}

/**
 * Load the consumer project's config + integrations. Throws on invalid config;
 * the run leaf decides between the config_fixable preview and a hard abort.
 * @param {string} cwd
 * @param {string[]} [extraIntegrationSpecs] explicit `--integration` specs
 * @returns {Promise<{postCodemodHooks: import('../../authoring/config/type').PostCodemodHook[], integrations: LoadedIntegration[]}>}
 */
export async function loadProjectContext(cwd, extraIntegrationSpecs = []) {
	const project = await Project.load(cwd);
	const postCodemodHooks = project.config.hooks?.postCodemod ?? [];
	const integrationSpecs = uniqueFiles([
		...(project.integrations ?? []),
		...(extraIntegrationSpecs ?? [])
	]);
	const integrations = await loadIntegrations(integrationSpecs);
	return { postCodemodHooks, integrations };
}

/**
 * Non-blocking nudge for integration validation issues. Never throws (a broken
 * nudge must not fail the upgrade) and is suppressed for --json/programmatic
 * callers (the silent logger).
 * @param {Array<LoadedIntegration>} integrations
 * @returns {Promise<void>}
 */
export async function warnIntegrationIssues(integrations) {
	try {
		await warnOnIntegrationIssues(integrations, { json: logger.silent });
	} catch {
		// Never let the nudge break the upgrade.
	}
}

/**
 * Discover + select the integration codemods that apply in the (from, to]
 * range. An integration whose codemods fail to load is SKIPPED (a definition
 * error is surfaced by the nudge, not a hard failure of the upgrade).
 * @param {Array<LoadedIntegration>} integrations
 * @param {string} from
 * @param {string} to
 * @returns {Promise<Array<{version: string, codemods: CodemodEntry[]}>>}
 */
export async function selectIntegrationCodemodsFor(integrations, from, to) {
	/** @type {Map<string, Array<CodemodEntry>>} */
	const integrationCodemodsByVersion = new Map();
	for (const integration of integrations) {
		if (!integration?.codemods) continue;
		try {
			const byVersion = await discoverIntegrationCodemods([integration]);
			for (const [version, list] of byVersion) {
				const existing = integrationCodemodsByVersion.get(version);
				if (existing) existing.push(...list);
				else integrationCodemodsByVersion.set(version, [...list]);
			}
		} catch {
			// Skip this integration's codemods (definition error); nudge above surfaces it.
		}
	}
	return selectIntegrationCodemods(integrationCodemodsByVersion, from, to);
}

/**
 * Run the file-based INTEGRATION codemods (config codemods first, then code).
 * @param {Array<{version: string, codemods: CodemodEntry[]}>} versionGroups
 * @param {{apply: boolean, path: string, codemod?: string, skipCodemods: Set<string>}} options
 */
export async function runIntegrationCodemodsStep(
	versionGroups,
	{ apply, path: srcPath, codemod, skipCodemods }
) {
	return runIntegrationCodemods(versionGroups, {
		apply,
		path: srcPath,
		codemod,
		skipCodemods,
		...(await requireCompiler()),
		silent: logger.silent
	});
}
