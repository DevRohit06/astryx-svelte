/**
 * @file Astryx CLI — Commander program setup
 *
 * Registers all commands via lazy loading. If one command fails to load
 * (bad import, syntax error), the other commands still work.
 *
 * The program is built by {@link createProgram} — a factory so tests can drive
 * a FRESH program in-process (via parseAsync) instead of spawning `node
 * bin/astryx-svelte.mjs` per assertion. `bin/astryx-svelte.mjs` and legacy
 * importers use the eager {@link program} singleton, which is just
 * `await createProgram()`.
 *
 * ## What is here, and what is not
 *
 * This is the foundation slice: the program, the JSON contract's enforcement
 * points, and `manifest`. The `commands` registry below is empty because no
 * command verb has landed — each later slice adds its entry, its
 * `JSON_SUPPORTED` name, and its `RESPONSE_TYPES` row together, because the
 * manifest drift guard fails if any one of the three is missing.
 *
 * Two of upstream's hooks are also deferred with their dependencies: the update
 * hint (`lib/update-check.mjs`) and the setup nudge (which asks
 * `foundation/agent-docs` whether `init` has run). Both belong to the slices
 * that introduce those modules; neither affects the JSON contract, since both
 * are suppressed in `--json` mode anyway.
 */

import { Command, Option } from 'commander';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { API_VERSION, setJsonMode } from '../../foundation/response/json.mjs';
import { buildManifest } from './lib/manifest.mjs';
import { cliError } from './lib/cli-error.mjs';
import { emit, section, text, records } from './formatters/index.mjs';
import { ERROR_CODES } from '../../foundation/response/error-codes.mjs';
// Upstream imports this from `foundation/text/string-utils.mjs`, which is a
// re-export of the same pure function; string-utils' other exports need
// component discovery, so it lands with the `component` slice.
import { levenshteinDistance } from '../../foundation/text/levenshtein.mjs';
import { installJsonShim } from './lib/json-shim.mjs';
import { getCliInvocation } from '../../foundation/env/package-manager.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read version from package.json so it stays in sync
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8'));

// Intercept `astryx-svelte --version --json` (or `-V --json`) before Commander
// processes the version flag and exits. Commander's built-in version handler
// prints the raw version string and calls process.exit, bypassing our hooks — so
// the only correct place to JSON-ify it is here. (Bin-time only: guarded on
// argv, so importing this module in tests is a no-op.)
const _argv = process.argv.slice(2);
if ((_argv.includes('--version') || _argv.includes('-V')) && _argv.includes('--json')) {
	process.__xdsJsonHandled = true;
	console.log(
		JSON.stringify(
			{ apiVersion: API_VERSION, type: 'version', data: { version: pkg.version } },
			null,
			2
		)
	);
	process.exit(0);
}

/**
 * Allowlist of fully-qualified command names that natively support --json.
 * Subcommands are listed by their full path (parent + leaf), e.g. "theme build".
 *
 * Commands NOT in this set will be rejected by the preAction hook below
 * BEFORE any side effects can run. This protects users from partial state
 * (e.g. files written, then --json error printed) on commands that don't
 * yet support structured output.
 *
 * Upstream's list at `v0.3.0` has 19 entries. This one grows a name per command
 * slice; see the note in lib/manifest.mjs on why it is not pre-seeded.
 */
export const JSON_SUPPORTED = new Set([
	'build',
	'component',
	'discover',
	'docs',
	'doctor',
	'layout expand',
	'layout check',
	'layout grammar',
	'manifest',
	'search',
	'swizzle',
	'template',
	'theme build',
	'theme list',
	'theme add',
	'theme template',
	'upgrade',
	'util',
	'validate-integration'
]);

/**
 * Compute the fully qualified command name, e.g. "theme build" or "swizzle".
 * @param {import('commander').Command} actionCommand
 * @param {import('commander').Command} root the root program
 * @returns {string}
 */
function fullCommandName(actionCommand, root) {
	const parts = [];
	/** @type {import('commander').Command | null} */
	let cmd = actionCommand;
	while (cmd && cmd !== root) {
		parts.unshift(cmd.name());
		cmd = cmd.parent;
	}
	return parts.join(' ');
}

/**
 * Command registry — each command is lazy-loaded so a broken command
 * doesn't take down the entire CLI.
 *
 * Empty until the first command slice lands. Upstream's 15 entries are `init`,
 * `component`, `docs`, `blog`, `swizzle`, `template`, `layout`, `upgrade`,
 * `theme`, `hook`, `discover`, `search`, `build`, `doctor` and
 * `validate-integration`; `manifest` and the hidden `postinstall` are registered
 * inline below.
 *
 * @type {{name: string, path: string, register: string}[]}
 */
const commands = [
	{ name: 'build', path: './commands/build.mjs', register: 'registerBuild' },
	{ name: 'component', path: './commands/component/index.mjs', register: 'registerComponent' },
	{ name: 'discover', path: './commands/discover.mjs', register: 'registerDiscover' },
	{ name: 'docs', path: './commands/docs.mjs', register: 'registerDocs' },
	{ name: 'doctor', path: './commands/doctor.mjs', register: 'registerDoctor' },
	{ name: 'init', path: './commands/init.mjs', register: 'registerInit' },
	{ name: 'layout', path: './commands/layout.mjs', register: 'registerLayout' },
	{ name: 'search', path: './commands/search.mjs', register: 'registerSearch' },
	{ name: 'swizzle', path: './commands/swizzle.mjs', register: 'registerSwizzle' },
	// Registered with `.alias('add')`, upstream's own alias.
	{ name: 'template', path: './commands/template.mjs', register: 'registerTemplate' },
	// Upstream's file is `build-theme.mjs`, not `theme.mjs` — kept, so the ported
	// suites keep their upstream filenames too.
	{ name: 'theme', path: './commands/build-theme.mjs', register: 'registerTheme' },
	{ name: 'upgrade', path: './commands/upgrade.mjs', register: 'registerUpgrade' },
	{ name: 'util', path: './commands/util/index.mjs', register: 'registerUtil' },
	{
		name: 'validate-integration',
		path: './commands/validate-integration.mjs',
		register: 'registerValidateIntegration'
	}
];

/**
 * Build a fresh, fully-wired Astryx CLI program (root options, hooks, all
 * commands, manifest/postinstall, json-shim). Async because commands are
 * lazy-imported. Each call returns an independent Command so tests can
 * parseAsync repeatedly without commander state leaking between runs.
 *
 * @returns {Promise<import('commander').Command>}
 */
export async function createProgram() {
	const program = new Command();

	// Deterministic, single-line help. Commander wraps each option/command
	// description to a column width (80 when captured non-TTY), which splits long
	// descriptions like --json across several indented lines. Override the wrap
	// hook to a no-op so every item stays on one line — matching the rest of the
	// CLI's plain, unwrapped, width-independent output. Set before subcommands are
	// registered so they inherit it via copyInheritedSettings.
	//
	// Upstream passes `{wrap}`, which is the Commander 12 name. Commander 13
	// renamed the Help member to `boxWrap`, and `configureHelp` merges unknown
	// keys silently — so upstream's spelling would type-check, run, and simply
	// not disable wrapping. Verified against commander 14.0.3's `lib/help.js`,
	// where `formatItem` calls `helper.boxWrap(...)`.
	program.configureHelp({ boxWrap: (str) => str });

	// Restore Commander 12's default so the root `.action()` below still receives
	// an unmatched positional in `cmd.args`.
	//
	// Commander 13 flipped `_allowExcessArguments` from true to false. Under 14,
	// `astryx-svelte bogus-cmd` is rejected by the excess-arguments check during
	// parse — BEFORE the action runs — so it surfaces as
	// `commander.excessArguments` → ERR_INVALID_ARGUMENT with no suggestions,
	// instead of the ERR_UNKNOWN_COMMAND envelope carrying "did you mean this?"
	// (or the full command list). Verified against the installed
	// `@astryxdesign/cli@0.3.0`, which emits ERR_UNKNOWN_COMMAND plus every
	// command name as a suggestion — the recovery path an agent depends on when
	// it guesses a verb wrong.
	//
	// Set before any subcommand is registered so they inherit it through
	// copyInheritedSettings, which is what Commander 12 did globally.
	program.allowExcessArguments();

	// Document the text-output contract in --help so agents know how to parse/grep
	// it (and when to reach for --json instead). Kept in sync with the formatter
	// kit in clients/cli/formatters.
	program.addHelpText(
		'after',
		'\n' +
			[
				section(
					'Output format',
					'Text mirrors --json (the machine-readable surface); it is built from these blocks:'
				),
				records(
					[
						{
							block: 'Record',
							shape: 'aligned "key: value" lines = one item; records separated by a blank line'
						},
						{
							block: 'Section',
							shape: 'a header line (no "key:"), optional one-line subtitle, then its records/list'
						},
						{ block: 'List', shape: '"- value" lines for a simple sequence of values' },
						{ block: 'Text', shape: 'free-form prose / notes' },
						{
							block: 'Code',
							shape: 'a verbatim block (source, skeleton, or doc), emitted exactly'
						}
					],
					{ fields: ['block', 'shape'] }
				),
				text(
					'Grep a field across records, e.g.  astryx-svelte search button | grep "^command:". ' +
						'Errors/warnings go to stderr; use --json for structured parsing.'
				)
			]
				.map((block) => block.toString())
				.join('\n\n')
	);

	program
		.name('astryx-svelte')
		.description('Design system CLI — components, themes, and tooling')
		.version(pkg.version)
		.option('--zh', 'Output docs in Chinese Simplified')
		.option('--dense', 'Output docs in compressed dense format (token-efficient)')
		.addOption(
			new Option(
				'--lang <locale>',
				'Output docs in specified language/format (en, zh, dense)'
			).choices(['en', 'zh', 'dense'])
		)
		.addOption(
			new Option('--detail <level>', 'Output detail level (full, compact, brief)')
				.choices(['full', 'compact', 'brief'])
				.default('full')
		)
		.option(
			'--json',
			'Output as typed JSON. Success envelope: { type, data }. Error envelope: { error, suggestions? }.'
		)
		// Upstream calls `.addHelpCommand('help', 'Show all commands')`, which
		// Commander deprecated in 12 in favour of `.helpCommand(...)`. Both
		// register the same `help` command with the same description; the
		// non-deprecated spelling is used so the call survives Commander 15.
		.helpCommand('help', 'Show all commands')
		.action((options, cmd) => {
			// If Commander handed us a positional that didn't match any subcommand,
			// treat it as "unknown command" — exit 1 with a helpful suggestion.
			// This is the bare-invocation handler; if cmd.args has content here,
			// none of the registered subcommands matched.
			const extras = (cmd && cmd.args) || [];
			if (extras.length > 0) {
				const unknown = String(extras[0]);
				const known = (program.commands || [])
					.filter((c) => !(/** @type {any} */ (c)._hidden) && c.name() !== 'help')
					.map((c) => c.name());
				const close = known
					.map((name) => ({
						name,
						distance: levenshteinDistance(unknown.toLowerCase(), name.toLowerCase())
					}))
					.filter((s) => s.distance <= 3)
					.sort((a, b) => a.distance - b.distance)
					.slice(0, 3)
					.map((s) => ({ name: s.name, reason: 'did you mean this?' }));
				// If we have close matches, surface those. Otherwise list all known commands
				// so callers (including AI agents) can see what's available.
				const suggestions =
					close.length > 0 ? close : known.map((name) => ({ name, reason: 'available command' }));
				cliError(`unknown command '${unknown}'`, {
					suggestions,
					code: ERROR_CODES.ERR_UNKNOWN_COMMAND
				});
				return;
			}

			// `astryx-svelte` (no subcommand) — print help, or emit a JSON envelope
			// when --json.
			if (program.opts().json) {
				// Emit the full capability manifest so an agent can drive the entire
				// CLI from one call — no need to scrape `--help` text. We derive this
				// from Commander metadata (commands, args, flags) and layer on the
				// JSON_SUPPORTED allowlist + per-command response types. See
				// lib/manifest.mjs.
				//
				// Backwards-compat: the envelope keeps `type: 'help'` and the original
				// shallow fields (`name`, `version`, `commands` as a string[] of names,
				// `jsonSupported`) that earlier consumers read. The richer, structured
				// surface is embedded under `data.manifest` (and is also available
				// standalone via `astryx-svelte manifest --json` as `type: 'manifest'`).
				process.__xdsJsonHandled = true;
				const manifest = buildManifest(program, {
					jsonSupported: JSON_SUPPORTED,
					version: pkg.version
				});
				console.log(
					JSON.stringify(
						{
							apiVersion: API_VERSION,
							type: 'help',
							data: {
								name: manifest.name,
								version: manifest.version,
								// Original flat list of command names (string[]) — kept for compat.
								commands: manifest.commands.map((c) => c.name),
								jsonSupported: manifest.jsonSupported,
								// Enriched, self-describing surface (the full manifest payload).
								manifest
							}
						},
						null,
						2
					)
				);
				return;
			}
			program.help();
		});

	/**
	 * Pre-action hook: gate --json BEFORE any command body runs.
	 *
	 * If --json is set on a command that is not on the JSON_SUPPORTED allowlist,
	 * emit a structured error envelope and exit 1 — without running the command's
	 * action (so no filesystem mutations, no interactive prompts, no spawned processes).
	 *
	 * This is the single source of truth for "command does not support --json".
	 * Individual commands should NOT re-check this; they may assume that if their
	 * action runs with --json, they are responsible for emitting an envelope on
	 * every code path.
	 */
	program.hook('preAction', (thisCommand, actionCommand) => {
		if (!program.opts().json) return;
		// Engage global JSON mode so humanLog()/humanWarn() across commands become
		// no-ops — stdout now carries only the JSON envelope.
		setJsonMode(true);
		// The root program's own action (no subcommand) is handled directly in
		// its action handler — let it through. fullCommandName is '' there.
		if (actionCommand === program) return;
		const fullName = fullCommandName(actionCommand, program);
		if (JSON_SUPPORTED.has(fullName)) return;
		process.__xdsJsonHandled = true;
		console.log(
			JSON.stringify(
				{
					apiVersion: API_VERSION,
					error: `JSON output is not supported for the '${fullName}' command`,
					code: ERROR_CODES.ERR_INVALID_OPTION
				},
				null,
				2
			)
		);
		process.exit(1);
	});

	/**
	 * Belt-and-suspenders postAction: if a "supported" command somehow forgot
	 * to emit a JSON envelope on a code path, surface that as a structured error
	 * rather than silent stdout corruption. This should never fire in practice;
	 * if it does, it's a bug in the command implementation.
	 */
	program.hook('postAction', (thisCommand, actionCommand) => {
		if (!program.opts().json) return;
		if (process.__xdsJsonHandled) return;
		const fullName = fullCommandName(actionCommand, program);
		console.log(
			JSON.stringify(
				{
					apiVersion: API_VERSION,
					error: `Internal: '${fullName}' completed without emitting a JSON envelope`,
					// `code` always appears on an error envelope so consumers can branch on
					// it unconditionally. This belt-and-suspenders path is an internal
					// condition, so it uses the generic ERR_UNKNOWN.
					code: ERROR_CODES.ERR_UNKNOWN
				},
				null,
				2
			)
		);
		process.exit(1);
	});

	for (const cmd of commands) {
		try {
			const mod = await import(cmd.path);
			mod[cmd.register](program);
		} catch (e) {
			// Command fails to load but CLI still works
			program
				.command(cmd.name)
				.description(`(failed to load: ${/** @type {any} */ (e).message})`)
				.action(() => {
					console.error(`Command "${cmd.name}" failed to load:`);
					console.error(/** @type {any} */ (e).message);
					process.exit(1);
				});
		}
	}

	// Capability manifest — a single, self-describing view of the whole CLI so
	// agents can discover every command, argument, flag, and response type without
	// scraping `--help`. `astryx-svelte manifest --json` is the dedicated surface;
	// the bare `astryx-svelte --json` embeds the same payload under data.manifest
	// for convenience. Intentionally CLI-special — no `api/manifest`. It
	// introspects the live Commander `program`, so extracting it to `api/` would
	// create an `api → cli` cycle. `buildManifest(program)` lives in lib/; see its
	// header.
	program
		.command('manifest')
		.description('Print the full CLI capability manifest (use with --json)')
		.action(() => {
			const manifest = buildManifest(program, {
				jsonSupported: JSON_SUPPORTED,
				version: pkg.version
			});
			if (program.opts().json) {
				process.__xdsJsonHandled = true;
				console.log(
					JSON.stringify({ apiVersion: API_VERSION, type: 'manifest', data: manifest }, null, 2)
				);
				return;
			}
			// Human-readable summary as greppable records (agents should use --json).
			// One record per command: name, whether it supports --json, and the
			// description.
			emit(
				section(`${manifest.name} v${manifest.version} (${manifest.commands.length} commands)`),
				records(
					manifest.commands.map((c) => ({
						command: c.name,
						json: c.json ? 'yes' : '',
						description: c.description || ''
					})),
					{ fields: ['command', 'json', 'description'] }
				),
				text(`Run \`${getCliInvocation()} manifest --json\` for the full structured manifest.`)
			);
		});

	// Hidden command used by package.json postinstall scripts
	program.command('postinstall', { hidden: true }).action(() => {
		const r = getCliInvocation();
		const pad = (/** @type {string} */ s, /** @type {number} */ len) =>
			s + ' '.repeat(Math.max(0, len - s.length));
		const W = 49; // inner width of the box
		const line = (/** @type {string} */ s) => `  │ ${pad(s, W)}│`;
		console.log(`
  ╭${'─'.repeat(W + 2)}╮
${line('')}
${line('  Design system installed!')}
${line('')}
${line('  Get started:')}
${line(`    ${r} init          Setup + AI agent docs`)}
${line(`    ${r} --help        See all commands`)}
${line('')}
${line('  Or run directly:')}
${line(`    ${r} init           Setup + AI agent docs`)}
${line(`    ${r} component     Browse component docs`)}
${line(`    ${r} util          Browse util docs`)}
${line(`    ${r} docs          Design system reference`)}
${line(`    ${r} swizzle       Customize a component`)}
${line(`    ${r} template      Add a page template`)}
${line('')}
  ╰${'─'.repeat(W + 2)}╯
`);
	});

	// Install the JSON shim AFTER all commands are registered so we can
	// patch outputHelp on every command (root + subcommands). The shim
	// extends the --json contract to cover Commander's parse-time short
	// circuits (parse errors, unknown options, --help, unknown commands).
	// See lib/json-shim.mjs for the rationale.
	installJsonShim(program);

	return program;
}

/**
 * Eager singleton program for `bin/astryx-svelte.mjs` and legacy importers.
 * Tests should call {@link createProgram} to get an isolated instance.
 */
export const program = await createProgram();
