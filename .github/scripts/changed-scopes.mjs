/**
 * @file Classify the paths changed in this event into CI scopes.
 *
 * Writes `core`/`cli`/`themes`/`docs`/`global` booleans to `$GITHUB_OUTPUT`,
 * which `ci.yml` uses to decide which jobs run. A full run is ~13 minutes and
 * most of it is irrelevant to most changes: a docs-only edit does not need the
 * class oracle, the CSS oracle, the CLI suite or 4,510 browser cases.
 *
 * ## Deny by default
 *
 * The map below lists the paths this repo knows how to scope. **Anything that
 * matches nothing sets `global`, which runs every job.** That direction is the
 * whole safety property: adding a top-level directory, a new config file or a
 * new tool makes CI do too much until someone classifies it, never too little.
 * A skip-list would fail the other way, and the failure would be silent — CI
 * green because it never ran.
 *
 * The same applies to a base commit that cannot be resolved (a new branch, a
 * force-push, a shallow fetch): an unknown diff means `global`, not "nothing
 * changed".
 *
 * ## Dependencies this encodes
 *
 * Scopes say *what changed*; `ci.yml` owns *what runs*, because the interesting
 * part is one-directional:
 *
 * - **docs depends on core.** `docs/vite.config.ts` runs the same StyleX plugin
 *   options over core's sources, and `docs/scripts/generate-content.mjs` reads
 *   prop types out of `packages/core/dist/`. So a core change must run the docs
 *   job. A docs change never needs core's suites.
 * - **docs does not depend on our CLI.** It reads `.doc.mjs` from the *upstream*
 *   `@astryxdesign/*` packages in `node_modules`, not from `packages/cli`.
 * - **themes build against core's `dist/`**, and `packages/cli` bundles them
 *   (`generate-cli-themes`, whose `--check` is a test), so a theme change has to
 *   run the CLI suite too.
 */

import { appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

/**
 * Longest prefix wins, so `packages/themes/` beats `packages/core/`'s sibling
 * entries regardless of the order written here.
 *
 * `null` means "no CI gate covers this". Only paths that genuinely have none
 * belong there, and each is named rather than globbed: root prose is not linted
 * by anything, because `pnpm -r lint` runs `prettier --check .` *inside* each
 * workspace project and the root is not one of them. If a root-level lint is
 * ever added, these move out of `null`.
 */
const SCOPES = [
	['docs/', 'docs'],
	['packages/themes/', 'themes'],
	['packages/core/', 'core'],
	['packages/cli/', 'cli'],
	['port/research/', null],
	['README.md', null],
	['port/todo.md', null],
	['PORTED.md', null],
	['CLAUDE.md', null],
	['UPSTREAM-CLAUDE.md', null],
	['LICENSE', null],
	['.gitignore', null]
];

const ORDERED = [...SCOPES].sort((a, b) => b[0].length - a[0].length);

/**
 * @param {string} file
 * @returns {string | null | undefined} the scope, `null` when ungated, or
 *   `undefined` when unrecognised — which forces a full run.
 */
function scopeOf(file) {
	for (const [prefix, scope] of ORDERED) {
		if (file === prefix || file.startsWith(prefix)) return scope;
	}
	return undefined;
}

const base = process.env.BASE_SHA ?? '';
const head = process.env.HEAD_SHA || 'HEAD';

/** @type {Set<string>} */
const found = new Set();
let isGlobal = false;

/** @type {string[]} */
let files = [];
if (!base || /^0+$/.test(base)) {
	console.log('no resolvable base commit — forcing a full run');
	isGlobal = true;
} else {
	try {
		files = execFileSync('git', ['diff', '--name-only', base, head], { encoding: 'utf8' })
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);
	} catch (error) {
		console.log(`could not diff ${base}..${head} — forcing a full run`);
		console.log(String(error));
		isGlobal = true;
	}
}

for (const file of files) {
	const scope = scopeOf(file);
	if (scope === undefined) {
		isGlobal = true;
		console.log(`unscoped, forcing a full run: ${file}`);
	} else if (scope !== null) {
		found.add(scope);
	}
}

const out = {
	core: String(found.has('core')),
	cli: String(found.has('cli')),
	themes: String(found.has('themes')),
	docs: String(found.has('docs')),
	global: String(isGlobal)
};

console.log(`${files.length} changed file(s)`);
console.log(out);

if (process.env.GITHUB_OUTPUT) {
	appendFileSync(
		process.env.GITHUB_OUTPUT,
		`${Object.entries(out)
			.map(([key, value]) => `${key}=${value}`)
			.join('\n')}\n`
	);
}
