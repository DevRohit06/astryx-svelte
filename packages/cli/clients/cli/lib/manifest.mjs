/**
 * @file Capability manifest — self-describing CLI surface for agents.
 *
 * `astryx-svelte --json` (and `astryx-svelte manifest --json`) emit a structured
 * manifest that lets an AI agent drive the entire CLI WITHOUT scraping `--help`
 * text. It is to the CLI what an OpenAPI spec is to an HTTP API.
 *
 * Most of the manifest is DERIVED from Commander metadata (program.commands,
 * cmd.options, cmd.registeredArguments, cmd.description()) so it cannot drift
 * out of sync with the real command definitions. The two pieces Commander does
 * not know about — whether a command supports `--json`, and which response
 * `type` discriminators it can emit — are layered on from:
 *
 *   - JSON_SUPPORTED  (the allowlist in clients/cli/index.mjs), and
 *   - RESPONSE_TYPES  (the declarative map below).
 *
 * A drift-guard test (manifest.test.mjs) asserts every registered command
 * appears in the manifest and every JSON-supported command has a response-type
 * entry, so adding a command without describing it fails CI. It guards the
 * other direction too — a RESPONSE_TYPES key with no registered command fails —
 * which is what keeps the three tables honest while the port grows one command
 * slice at a time. **Do not pre-seed the tables with commands that have not
 * landed**: that turns the drift guard off for the whole port.
 *
 * DESIGN DECISION — manifest stays CLI-special; there is intentionally NO
 * `api/manifest`. It describes the CLI's own Commander tree, so it takes the live
 * `program` as a parameter and lives in `lib/` (shared infra the CLI can import
 * without a cycle). An `api/manifest` entry would have to import the program from
 * `clients/cli/index.mjs` — an `api → cli` cycle — or force programmatic callers
 * to construct a program themselves. So `buildManifest(program)` is the intended
 * shape, and the bare `astryx-svelte --json` / `astryx-svelte manifest --json`
 * handlers are its only consumers. Do not "extract" this to `api/`.
 *
 * @input  a configured Commander `program` + the JSON_SUPPORTED allowlist
 * @output a `{ name, version, globalOptions, commands, responseTypes }` object
 * @position consumed by the bare `astryx-svelte --json` action and the `manifest` command
 */

import { API_VERSION } from '../../../foundation/response/json.mjs';

/**
 * Response `type` discriminators each fully-qualified command can emit in
 * `--json` mode. Keyed by the same name Commander reports (parent + leaf,
 * space-joined), e.g. `theme build`. Commander has no knowledge of these —
 * they come from each command's `jsonOut(...)` call sites — so we keep them
 * here, close to the JSON_SUPPORTED allowlist, and guard them with a test.
 *
 * Grows one entry per command slice. Upstream's full table at `v0.3.0` covers
 * 19 commands; only `manifest` has landed here.
 *
 * @type {Record<string, string[]>}
 */
export const RESPONSE_TYPES = {
	build: ['build.help', 'build.kit'],
	component: [
		'component.list',
		'component.detail',
		'component.detail.props',
		'component.detail.source',
		'component.detail.showcase',
		'component.detail.blocks'
	],
	discover: ['discover.list', 'discover.detail', 'discover.detail.doc', 'discover.search'],
	docs: ['docs.list', 'docs.detail', 'docs.detail.section'],
	doctor: ['doctor'],
	'layout expand': ['layout.expand'],
	'layout check': ['layout.check'],
	'layout grammar': ['layout.grammar'],
	manifest: ['manifest'],
	search: ['search'],
	swizzle: ['swizzle.list', 'swizzle.copy'],
	template: ['template.list', 'template.show', 'template.skeleton', 'template.copy'],
	'theme build': ['theme.build', 'theme.build.check'],
	'theme list': ['theme.list'],
	'theme add': ['theme.list', 'theme.add'],
	upgrade: ['upgrade.list', 'upgrade.status', 'upgrade.run'],
	util: ['util.list', 'util.detail', 'util.detail.params'],
	'validate-integration': ['integration.validate']
};

/**
 * Example invocations per fully-qualified command. Optional, agent-facing.
 * @type {Record<string, string[]>}
 */
const EXAMPLES = {
	build: ['astryx-svelte build', 'astryx-svelte build "analytics dashboard" --json'],
	component: [
		'astryx-svelte component Button',
		'astryx-svelte component --list --json',
		'astryx-svelte component Button --props --json'
	],
	discover: ['astryx-svelte discover --json'],
	docs: ['astryx-svelte docs', 'astryx-svelte docs spacing --json'],
	doctor: ['astryx-svelte doctor', 'astryx-svelte doctor --json'],
	init: ['astryx-svelte init'],
	// Upstream's expand example references `{card-callout}`, one of core's block
	// templates. Template discovery landed with slice 6, but core's 1,329 block
	// assets are still deferred, so that expression would fail here; the example
	// shows a form that works today.
	'layout expand': [`astryx-svelte layout expand 'V[g6] > C > Tx"Hello"' ./src/lib/Page.svelte`],
	'layout check': [`astryx-svelte layout check 'A[cp6] > L > LC > S[p6]' --json`],
	'layout grammar': ['astryx-svelte layout grammar'],
	manifest: ['astryx-svelte manifest --json', 'astryx-svelte --json'],
	search: [
		'astryx-svelte search modal --json',
		'astryx-svelte search button --type component --json'
	],
	// Upstream's example is `astryx swizzle XDSButton`, advertising the pre-rename
	// prefix the API no longer strips. Both forms this port accepts are shown
	// instead: a directory name from `--list`, and an export name that resolves
	// through the barrel to the directory that holds it.
	swizzle: ['astryx-svelte swizzle button', 'astryx-svelte swizzle AvatarStatusDot --json'],
	// Upstream's second example scaffolds into `./src/app`, the Next.js App
	// Router directory. A SvelteKit route lives under `src/routes/<segment>/`,
	// and `template` writes the `+page.svelte` inside it.
	template: [
		'astryx-svelte template --json',
		'astryx-svelte template dashboard ./src/routes/dashboard'
	],
	// Upstream's `--out`/`--check` examples name a `.ts` theme file; ours does
	// too — `theme add` scaffolds `<slug>-theme.ts`, so `.ts` is the shape a
	// reader will actually have.
	'theme build': [
		'astryx-svelte theme build ./src/themes/ocean.ts --out ./dist/ocean.css',
		'astryx-svelte theme build ./src/themes/ocean.ts --check'
	],
	'theme list': ['astryx-svelte theme list --json'],
	'theme add': [
		'astryx-svelte theme add matcha',
		'astryx-svelte theme add matcha ./src/themes/matcha'
	],
	// Upstream's single example is the bare `astryx upgrade --json`. The second
	// one here shows the flag that writes, because dry-run is the default and the
	// most common mistake is expecting the first form to have changed something.
	upgrade: ['astryx-svelte upgrade --json', 'astryx-svelte upgrade --from 0.3.0 --apply'],
	util: [
		'astryx-svelte util useMediaQuery',
		'astryx-svelte util --list --json',
		'astryx-svelte util useMediaQuery --params --json'
	],
	'validate-integration': [
		'astryx-svelte validate-integration',
		'astryx-svelte validate-integration @acme/widgets --json'
	]
};

/**
 * Map a Commander Option to a flag descriptor. Derives type from whether the
 * option takes a value (boolean vs string), surfaces `choices` and `default`.
 *
 * @param {import('commander').Option} opt
 * @returns {import('./manifest').ManifestOption}
 */
function describeOption(opt) {
	const o = /** @type {any} */ (opt);
	const takesValue = o.required || o.optional;
	/** @type {any} */
	const d = {
		flag: o.flags,
		description: o.description || '',
		type: takesValue ? 'string' : 'boolean'
	};
	if (Array.isArray(o.argChoices) && o.argChoices.length > 0) {
		d.choices = [...o.argChoices];
		d.type = 'enum';
	}
	if (o.defaultValue !== undefined) d.default = o.defaultValue;
	// `--no-foo` style negation flags. Commander 14 sets `negate: false`
	// explicitly on every other option, so the truthiness test (not a
	// `!== undefined` test) is what keeps the key off non-negated flags.
	if (o.negate) d.negate = true;
	return d;
}

/**
 * Map a Commander positional argument to an arg descriptor.
 * @param {import('commander').Argument} arg
 * @returns {import('./manifest').ManifestArgument}
 */
function describeArgument(arg) {
	const a = /** @type {any} */ (arg);
	return {
		name: a.name(),
		required: a.required === true,
		variadic: a.variadic === true,
		description: a.description || ''
	};
}

/**
 * Compute the fully-qualified command name relative to the root program,
 * e.g. `theme build`. The root program itself maps to ''.
 * @param {import('commander').Command} cmd
 * @param {import('commander').Command} root
 * @returns {string}
 */
function fullName(cmd, root) {
	const parts = [];
	/** @type {import('commander').Command | null} */
	let c = cmd;
	while (c && c !== root) {
		parts.unshift(c.name());
		c = c.parent;
	}
	return parts.join(' ');
}

/**
 * Recursively describe a Commander command and its subcommands.
 *
 * @param {import('commander').Command} cmd
 * @param {import('commander').Command} root
 * @param {Set<string>} jsonSupported  fully-qualified names that support --json
 * @returns {import('./manifest').ManifestCommand | null}  null for hidden/internal commands
 */
function describeCommand(cmd, root, jsonSupported) {
	const name = fullName(cmd, root);
	// Skip the auto-generated help command and any hidden/internal commands
	// (e.g. the postinstall shim) — agents never invoke these directly.
	// `_hidden` is a Commander internal not present on its public types.
	//
	// The `name === 'help'` arm no longer fires for Commander's own help
	// command: 14 materializes it lazily rather than pushing it into
	// `program.commands` (12 did). Kept anyway — it is the guard that stops a
	// user-registered `help` from being described, and dropping it would make
	// the manifest depend on a Commander implementation detail.
	if (!name || /** @type {any} */ (cmd)._hidden || name === 'help') return null;

	const subcommands = /** @type {object[]} */ (
		(cmd.commands || []).map((sub) => describeCommand(sub, root, jsonSupported)).filter(Boolean)
	);

	// `registeredArguments` is Commander 12's public-ish accessor; `_args` is the
	// older internal. Cast through any to read whichever exists.
	const args = /** @type {any[]} */ (
		/** @type {any} */ (cmd).registeredArguments || /** @type {any} */ (cmd)._args || []
	);

	/** @type {any} */
	const entry = {
		name,
		description: cmd.description() || '',
		arguments: args.map(describeArgument),
		options: (cmd.options || []).map(describeOption),
		json: jsonSupported.has(name)
	};

	const aliases = cmd.aliases ? cmd.aliases() : [];
	if (aliases && aliases.length > 0) entry.aliases = [...aliases];

	// Response types this command can emit in --json mode (only meaningful for
	// JSON-supported leaves). Subcommand groups (e.g. bare `theme`) have none.
	if (RESPONSE_TYPES[name]) entry.responseTypes = [...RESPONSE_TYPES[name]];

	if (EXAMPLES[name]) entry.examples = [...EXAMPLES[name]];

	// Sort subcommands by name for a stable, agent-facing contract — the same
	// guarantee the top-level command list makes. Otherwise Commander
	// registration order leaks into the manifest and a pure reorder of
	// `.command()` calls silently changes the output.
	if (subcommands.length > 0) {
		entry.subcommands = subcommands.sort((a, b) =>
			/** @type {any} */ (a).name.localeCompare(/** @type {any} */ (b).name)
		);
	}

	return entry;
}

/**
 * Describe the global options declared on the root program (--json, --lang,
 * --detail, --zh, --dense, --version). Documented once at top level so each
 * command entry doesn't repeat them.
 *
 * @param {import('commander').Command} program
 * @returns {import('./manifest').ManifestOption[]}
 */
function describeGlobalOptions(program) {
	const opts = (program.options || []).map(describeOption);
	// Commander registers a built-in --version flag; if for some reason it
	// isn't present in program.options, surface it so the manifest is complete.
	if (!opts.some((o) => /(^|[\s,])--version\b/.test(o.flag))) {
		opts.push({
			flag: '-V, --version',
			description: 'Output the version number',
			type: 'boolean'
		});
	}
	return opts;
}

/**
 * Build the full capability manifest from a configured Commander program.
 *
 * @param {import('commander').Command} program  the root program
 * @param {object} [opts]
 * @param {Set<string>} [opts.jsonSupported]  the JSON_SUPPORTED allowlist
 * @param {string} [opts.version]  CLI version (defaults to program.version())
 * @returns {import('./manifest').CLIManifest}  the manifest `data` payload (sans envelope)
 */
export function buildManifest(program, opts = {}) {
	const jsonSupported = opts.jsonSupported || new Set();
	const version = opts.version || /** @type {any} */ (program)._version || '';

	const commands = /** @type {any[]} */ (
		(program.commands || [])
			.map((cmd) => describeCommand(cmd, program, jsonSupported))
			.filter(Boolean)
	).sort((a, b) => a.name.localeCompare(b.name));

	return {
		// The CLI's own identity, not the design system's — this is the binary an
		// agent invokes. Upstream emits 'astryx'; ours is 'astryx-svelte', matching
		// this port's own package name. Everything else about the payload is byte-compatible.
		name: 'astryx-svelte',
		version,
		apiVersion: API_VERSION,
		description: program.description() || '',
		globalOptions: describeGlobalOptions(program),
		commands,
		jsonSupported: [...jsonSupported].sort(),
		// Flat index of every response `type` discriminator the CLI can emit,
		// keyed by command — lets an agent know what to expect back per call.
		responseTypes: Object.fromEntries(Object.entries(RESPONSE_TYPES).map(([k, v]) => [k, [...v]]))
	};
}
