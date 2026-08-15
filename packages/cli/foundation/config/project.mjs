/**
 * @file Project — the single API for reading resolved project configuration.
 *
 * `Project` is the one entry point a command uses to read everything it needs
 * about a consumer's project: the validated config surface, the configured
 * integrations, and the resolved discovery sets (components, templates,
 * codemods) — plus issue routing (issuesUrl) and the accumulated integration
 * issues. It replaces the old `loadConfig(cwd)` plain-object loader and the
 * per-command fan-out into the various discovery helpers.
 *
 * Design:
 *   - `Project.load(cwd, {cache})` is the async factory (constructors can't be
 *     async). It does what loadConfig did — find the config sibling-of
 *     package.json, import + validate it, load the configured integrations —
 *     and nothing more. Discovery is LAZY.
 *   - Discovery methods (components/templates/codemods) are MEMOIZED per
 *     instance (via the pluggable cache) and orchestrate the EXISTING discovery
 *     functions — Project never reimplements discovery.
 *   - SKIP + WARN policy: as a discovery method runs, per-integration work is
 *     guarded so one broken integration never throws out of discovery. Any
 *     AstryxIntegrationIssue encountered is collected into a private set and
 *     that integration's contributions are skipped.
 *   - `issues()` returns the deduped accumulated set, and (when called
 *     directly) fills in validation for any configured integration not yet
 *     visited by a discovery call, so it is always complete on demand.
 *
 * ## What slice 3 lands, and why the class is whole
 *
 * Upstream's `Project` imports from five modules this port had not written when
 * slice 3 landed the class — component discovery (slice 4), template discovery
 * (slice 6), the codemod registry and integration codemod discovery (slice 9),
 * and the `validate-integration` command (slice 7). It would
 * have been possible to defer `Project` entirely, but every later slice is
 * blocked on it, so the class landed **whole**: every getter, `#memo`,
 * `#pushIssue`, `#pkgLabel`, `#collectIssues`, `issuesUrl()`, `issues()`, and —
 * importantly — the skip-and-warn scaffolding *inside* all three discovery
 * methods. Only the discovery calls themselves were deferred, each marked at its
 * own call site with the slice that owns it. A later slice adds a line; it does
 * not reshape the method. **All three are now whole** — slice 4 restored both of
 * `components()`' calls, slice 6 `templates()`, and slice 9 `codemods()`. The
 * prediction held exactly: each restoration was an added line, never a reshape.
 *
 * One thing `templates()` returns that upstream's does not is *nothing from
 * core*: `packages/cli/assets/templates/` carries only the eight bundled
 * themes, so `discoverTemplates` finds no core pages or blocks. The call is
 * live rather than stubbed — external packages and integrations flow through
 * it — and core joins them when the template assets land.
 *
 * Two consequences worth stating plainly. `validateLoadedIntegration` now runs
 * **all four** of its contribution checks, so `issues()` surfaces
 * `missing_root`, `integration_error`, `invalid_component`, `invalid_template`
 * and `invalid_codemod`. And `codemods()`'s core half returns `[]` — which is
 * **not** a stub: the registry walk is live, but upstream's 18-entry version
 * registry has no counterpart here because this port has no version history at
 * all, so an empty core result is the correct answer rather than a placeholder
 * for one.
 *
 * @position foundation — orchestration over config-schema / integrations /
 *   component-discovery / template / codemod discovery; commands consume it.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { findPresentFiles, loadModuleWithParser } from '../fs/module-loader.mjs';
import { parseConfig } from '../../authoring/config/parse.mjs';
import { loadIntegrations } from '../integrations/integrations.mjs';
import {
	CORE_PACKAGE,
	discoverOwnedComponents,
	discoverIntegrationComponents
} from '../discovery/component-discovery.mjs';
import { CLI_ROOT, findCoreDir } from '../fs/paths.mjs';
import {
	discoverTemplates,
	discoverIntegrationTemplatesForOne
} from '../../api/template/template.mjs';
import { validateLoadedIntegration } from '../../api/integration/validate-integration.mjs';
import { getTransformsBetween } from '../../assets/codemods/registry.mjs';
import {
	discoverIntegrationCodemods,
	selectIntegrationCodemods
} from '../../assets/codemods/integration-discovery.mjs';
import { InMemoryConfigCache, cacheKey, configContentHash } from './config-cache.mjs';

/**
 * Extract a human-readable message from an unknown thrown value.
 * Reproduces the historical `err?.message ?? String(err)` behavior in a
 * strict-checkJs-safe way: prefer a non-nullish `.message` (covers Error
 * instances and error-like objects thrown by integration code), else `String()`.
 * @param {unknown} err
 * @returns {string}
 */
function errorMessage(err) {
	const message =
		err && typeof err === 'object' && 'message' in err
			? /** @type {{message: unknown}} */ (err).message
			: undefined;
	return message == null ? String(err) : String(message);
}

/**
 * An integration issue tagged with the owner package. The base
 * {@link import('../integrations/issue').AstryxIntegrationIssue} fields plus the
 * `package` that produced it, which Project tracks for routing/dedup.
 * @typedef {import('../integrations/issue').AstryxIntegrationIssue & {package: string}} ProjectIntegrationIssue
 */

/** Conventional config basenames, in load-precedence order. */
export const CONFIG_BASENAMES = [
	'astryx-svelte.config.ts',
	'astryx-svelte.config.mjs',
	'astryx-svelte.config.js'
];

/**
 * Read this package's own `bugs` field — the npm-declared home for reporting a
 * problem with the CLI.
 *
 * Upstream hard-codes `https://github.com/facebook/astryx/issues/new`, which
 * this port must not inherit: it would route a *port* bug to Meta's tracker.
 * Nor is it invented here — this repository currently declares no `repository`,
 * `bugs` or `homepage` and has no git remote, so there is no correct URL to
 * write down yet. Reading the field means the answer appears the moment the
 * package declares one, and until then `issuesUrl()` returns `undefined` rather
 * than a plausible-looking address that goes nowhere. Recorded in port/todo.md as a
 * release-checklist item.
 *
 * @returns {string|undefined}
 */
function readOwnBugsUrl() {
	try {
		const pkg = JSON.parse(fs.readFileSync(path.join(CLI_ROOT, 'package.json'), 'utf-8'));
		const bugs = typeof pkg.bugs === 'string' ? pkg.bugs : pkg.bugs?.url;
		return typeof bugs === 'string' && bugs.length > 0 ? bugs : undefined;
	} catch {
		return undefined;
	}
}

/** Default issue tracker used when neither config nor integration routes one. */
export const DEFAULT_ISSUES_URL = readOwnBugsUrl();

/**
 * Find the directory of the nearest package.json walking up from startDir.
 * @param {string} startDir
 * @returns {string|null}
 */
function findPackageRoot(startDir) {
	let dir = startDir;
	for (let i = 0; i < 50; i++) {
		if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

/**
 * Find astryx-svelte.config.{ts,mjs,js} as a sibling of the nearest
 * package.json. Returns the absolute path, or null if none is present. Throws
 * if multiple config files exist at that root.
 * @param {string} [startDir]
 * @returns {string|null}
 */
export function findConfigPath(startDir = process.cwd()) {
	const root = findPackageRoot(startDir) ?? startDir;
	const present = findPresentFiles(root, CONFIG_BASENAMES);
	if (present.length > 1) {
		throw new Error(
			`Multiple Astryx config files found in ${root} (${present
				.map((p) => path.basename(p))
				.join(', ')}). Keep exactly one.`
		);
	}
	return present.length === 1 ? present[0] : null;
}

/**
 * The single API for reading resolved project configuration. Construct via the
 * async {@link Project.load} factory.
 */
export class Project {
	/** @type {string} */
	#cwd;
	/** @type {string|null} */
	#configPath;
	/** @type {import('../../authoring/config/type').AstryxConfig} */
	#config;
	/** @type {string[]} */
	#integrations;
	/** @type {import('../integrations/integrations.mjs').LoadedIntegration[]} */
	#loadedIntegrations;
	/** @type {import('./config-cache.mjs').ConfigCache} */
	#cache;
	/** @type {string} */
	#hash;
	/** @type {ProjectIntegrationIssue[]} */
	#issues = [];
	/**
	 * Package names of integrations whose issues have already been collected
	 * (via a discovery method or a direct issues() validation), so issues() can
	 * fill in only the ones not yet visited and never double-collect.
	 * @type {Set<string>}
	 */
	#visitedIssues = new Set();

	/**
	 * @param {object} init
	 * @param {string} init.cwd
	 * @param {string|null} init.configPath
	 * @param {import('../../authoring/config/type').AstryxConfig} init.config validated AstryxConfig surface
	 * @param {string[]} init.integrations
	 * @param {import('../integrations/integrations.mjs').LoadedIntegration[]} init.loadedIntegrations
	 * @param {import('./config-cache.mjs').ConfigCache} init.cache
	 * @param {string} init.hash config content hash
	 */
	constructor({ cwd, configPath, config, integrations, loadedIntegrations, cache, hash }) {
		this.#cwd = cwd;
		this.#configPath = configPath;
		this.#config = config;
		this.#integrations = integrations;
		this.#loadedIntegrations = loadedIntegrations;
		this.#cache = cache;
		this.#hash = hash;
	}

	/**
	 * Async factory. Finds + validates the config (the same work loadConfig did)
	 * and loads the configured integrations. Discovery is NOT run here — it is
	 * lazy and memoized on the returned instance.
	 *
	 * @param {string} [cwd]
	 * @param {{cache?: import('./config-cache.mjs').ConfigCache}} [options]
	 * @returns {Promise<Project>}
	 */
	static async load(cwd = process.cwd(), { cache } = {}) {
		const resolvedCache = cache ?? new InMemoryConfigCache();
		const configPath = findConfigPath(cwd);
		const hash = configContentHash(configPath);

		/** @type {import('../../authoring/config/type').AstryxConfig} */
		let config = { integrations: [] };
		/** @type {string[]} */
		let integrations = [];
		/** @type {import('../integrations/integrations.mjs').LoadedIntegration[]} */
		let loadedIntegrations = [];

		if (configPath) {
			config = await loadModuleWithParser(configPath, parseConfig, {
				label: 'astryx-svelte.config'
			});
			const configDir = path.dirname(configPath);
			integrations = config.integrations ?? [];
			loadedIntegrations = await loadIntegrations(integrations, {
				cwd: configDir
			});
		}

		return new Project({
			cwd,
			configPath,
			config,
			integrations,
			loadedIntegrations,
			cache: resolvedCache,
			hash
		});
	}

	/**
	 * The validated config surface (same data loadConfig returned, minus the
	 * resolved `loadedIntegrations` which is exposed separately).
	 * @returns {import('../../authoring/config/type').AstryxConfig}
	 */
	get config() {
		return this.#config;
	}

	/** Configured integration package names. @returns {string[]} */
	get integrations() {
		return this.#integrations;
	}

	/** Resolved loaded integrations. @returns {import('../integrations/integrations.mjs').LoadedIntegration[]} */
	get loadedIntegrations() {
		return this.#loadedIntegrations;
	}

	/** @returns {string} */
	get cwd() {
		return this.#cwd;
	}

	/**
	 * Absolute path to the resolved config file, or null when the project has
	 * no config (defaults-only).
	 * @returns {string|null}
	 */
	get configPath() {
		return this.#configPath;
	}

	/**
	 * Memoize an async producer behind the pluggable cache, keyed by the config
	 * content hash + cwd + discovery kind. A sentinel wrapper distinguishes a
	 * cached `undefined`/falsy value from a cache miss.
	 * @template T
	 * @param {string} kind
	 * @param {() => Promise<T>} produce
	 * @returns {Promise<T>}
	 */
	async #memo(kind, produce) {
		const key = cacheKey(this.#hash, this.#cwd, kind);
		const hit = /** @type {{value: T} | undefined} */ (this.#cache.get(key));
		if (hit !== undefined) return hit.value;
		const value = await produce();
		this.#cache.set(key, { value });
		return value;
	}

	/**
	 * Record a single integration issue, deduped by (package, code, message).
	 * @param {string} pkg
	 * @param {import('../integrations/issue').AstryxIntegrationIssue} issue
	 */
	#pushIssue(pkg, issue) {
		const code = issue?.code ?? 'unknown';
		const message = issue?.message ?? '';
		const exists = this.#issues.some(
			(e) => e.package === pkg && e.code === code && e.message === message
		);
		if (exists) return;
		this.#issues.push({
			package: pkg,
			code,
			severity: issue?.severity ?? 'error',
			message
		});
	}

	/** Package label for a loaded integration.
	 * @param {import('../integrations/integrations.mjs').LoadedIntegration} integration
	 * @returns {string}
	 */
	#pkgLabel(integration) {
		return integration?.name ?? integration?.__spec ?? '(integration)';
	}

	/**
	 * Validate one loaded integration and collect any issues. Marks the
	 * integration visited so issues() won't redo the work. Best-effort: a
	 * validator throwing is itself recorded as an issue, never propagated.
	 * @param {import('../integrations/integrations.mjs').LoadedIntegration} integration
	 */
	async #collectIssues(integration) {
		const pkg = this.#pkgLabel(integration);
		if (this.#visitedIssues.has(pkg)) return;
		this.#visitedIssues.add(pkg);
		// A manifest that failed to load (throwing import / invalid shape) is
		// recorded as a marker by loadIntegrations — surface it as an issue and
		// skip validation (there's no manifest to validate).
		if (integration?.__loadError) {
			this.#pushIssue(pkg, {
				code: 'integration_error',
				severity: 'error',
				message: integration.__loadError
			});
			return;
		}
		try {
			const found = await validateLoadedIntegration(integration);
			for (const issue of found ?? []) this.#pushIssue(pkg, issue);
		} catch (err) {
			this.#pushIssue(pkg, {
				code: 'integration_error',
				severity: 'error',
				message: errorMessage(err)
			});
		}
	}

	/**
	 * Whether this integration has already recorded a blocking issue, in which
	 * case its contributions are skipped. Factored out of the three discovery
	 * methods, which each inlined the same `.some(…)` upstream.
	 * @param {string} pkg
	 * @returns {boolean}
	 */
	#hasBlockingIssue(pkg) {
		return this.#issues.some((i) => i.package === pkg && i.severity === 'error');
	}

	/**
	 * Core + integration component ownership records. Applies the skip+warn
	 * policy per integration: a broken integration's components are skipped and
	 * its issues collected, never thrown. Memoized per instance.
	 *
	 * @returns {Promise<Array<{name: string, package: string, group: string|null, docPath: string|null, sourcePath: string|null, issuesUrl: string|undefined}>>}
	 */
	async components() {
		return this.#memo('components', async () => {
			const coreDir = findCoreDir(this.#cwd);
			/** @type {Array<{name: string, package: string, group: string|null, docPath: string|null, sourcePath: string|null, issuesUrl: string|undefined}>} */
			const records = [];

			// Core records (no integrations) — never integration-broken.
			if (coreDir) {
				try {
					records.push(...discoverOwnedComponents(coreDir, []));
				} catch {
					// Core discovery failure is not an integration issue; surface
					// nothing here (core problems show up via doctor/other paths).
				}
			}

			// Each integration in isolation so one broken integration is skipped.
			for (const integration of this.#loadedIntegrations) {
				await this.#collectIssues(integration);
				const pkg = this.#pkgLabel(integration);
				if (this.#hasBlockingIssue(pkg)) continue;
				try {
					// discoverOwnedComponents owns the core+integration record shape;
					// here we add only this integration's records (core is handled
					// above) so a single broken integration can be skipped in isolation.
					for (const rec of discoverIntegrationComponents(integration)) {
						records.push(rec);
					}
				} catch (err) {
					this.#pushIssue(pkg, {
						code: 'invalid_component',
						severity: 'error',
						message: errorMessage(err)
					});
				}
			}

			return records;
		});
	}

	/**
	 * Core + integration templates, type-tagged. A broken integration's
	 * templates are skipped and its issues collected. Memoized per instance.
	 *
	 * @returns {Promise<Array<object>>}
	 */
	async templates() {
		return this.#memo('templates', async () => {
			/** @type {any[]} */
			const templates = [];

			// Core + external-package templates. Integration-owned templates are
			// deliberately NOT taken from this call — they are re-collected per
			// integration below so the skip+warn policy and issue collection apply.
			try {
				const core = await discoverTemplates(this.#cwd);
				for (const t of /** @type {any[]} */ (core)) {
					// Skip integration-owned templates here; they are re-added (and
					// issue-collected) per integration below to honor skip+warn.
					if (t.package && t.package !== CORE_PACKAGE) continue;
					templates.push(t);
				}
			} catch {
				// Core/template discovery failure contributes no templates.
			}

			for (const integration of this.#loadedIntegrations) {
				await this.#collectIssues(integration);
				const pkg = this.#pkgLabel(integration);
				if (this.#hasBlockingIssue(pkg)) continue;
				try {
					const { templates: ts, errors } = await discoverIntegrationTemplatesForOne(integration);
					for (const e of errors) {
						this.#pushIssue(pkg, {
							code: 'invalid_template',
							severity: 'error',
							message: e.message
						});
					}
					// Only contribute templates when the integration had no per-template
					// errors (skip the whole integration's templates on any error).
					if (errors.length === 0) templates.push(...ts);
				} catch (err) {
					this.#pushIssue(pkg, {
						code: 'invalid_template',
						severity: 'error',
						message: errorMessage(err)
					});
				}
			}

			return templates.sort((a, b) => a.name.localeCompare(b.name));
		});
	}

	/**
	 * Core registry transforms + integration codemods for an upgrade range. A
	 * broken integration's codemods are skipped (issue collected) rather than
	 * failing the whole resolution. Memoized per (from, to) key.
	 *
	 * @param {string} fromVersion exclusive lower bound
	 * @param {string} toVersion inclusive upper bound
	 * @returns {Promise<{core: Array<{version: string, transforms: Array<object>}>, integration: Array<{version: string, codemods: Array<object>}>}>}
	 */
	async codemods(fromVersion, toVersion) {
		return this.#memo(`codemods:${fromVersion}..${toVersion}`, async () => {
			// The registry walk is live as of slice 9 and returns `[]` for every
			// range — **which is the answer, not a stub.** Upstream reads an 18-entry
			// registry of version → transform-module; this port has released no
			// versions, so there is no transform between any two of them. See
			// `assets/codemods/registry.mjs`.
			const core = await getTransformsBetween(fromVersion, toVersion);

			// Per integration so a single broken one is skipped (issue collected)
			// without losing the others.
			/** @type {import('../integrations/integrations.mjs').LoadedIntegration[]} */
			const good = [];
			for (const integration of this.#loadedIntegrations) {
				await this.#collectIssues(integration);
				const pkg = this.#pkgLabel(integration);
				if (this.#hasBlockingIssue(pkg)) continue;
				if (!integration?.codemods) continue;
				try {
					// Discovery in isolation is the validation — it throws on a bad
					// export or a duplicate id, and a clean pass is what makes the
					// integration safe to include.
					await discoverIntegrationCodemods([integration]);
					good.push(integration);
				} catch (err) {
					this.#pushIssue(pkg, {
						code: 'invalid_codemod',
						severity: 'error',
						message: errorMessage(err)
					});
				}
			}

			const byVersion = await discoverIntegrationCodemods(good);
			const integration = selectIntegrationCodemods(byVersion, fromVersion, toVersion);

			return { core, integration };
		});
	}

	/**
	 * Route an issues URL for a component/source reference.
	 *
	 * - `package === CORE_PACKAGE` or omitted => this.config.issuesUrl or the
	 *   default core issues URL.
	 * - an integration package => that loaded integration's manifest issuesUrl
	 *   (which may be undefined when the integration ships none).
	 *
	 * @param {{package?: string}} [ref]
	 * @returns {string|undefined}
	 */
	issuesUrl(ref = {}) {
		const pkg = ref?.package;
		if (!pkg || pkg === CORE_PACKAGE) {
			return this.#config.issuesUrl ?? DEFAULT_ISSUES_URL;
		}
		const integration = this.#loadedIntegrations.find((i) => i.name === pkg);
		return integration?.issuesUrl;
	}

	/**
	 * The accumulated integration issues (deduped by package, code, message).
	 * When called directly, also validates any configured integration not yet
	 * visited by a discovery call, so the returned set is complete on demand.
	 *
	 * @returns {Promise<import('../integrations/issue').AstryxIntegrationIssue[]>}
	 */
	async issues() {
		for (const integration of this.#loadedIntegrations) {
			await this.#collectIssues(integration);
		}
		// Return a stable copy so callers can't mutate internal state.
		return this.#issues.map((i) => ({ ...i }));
	}
}
