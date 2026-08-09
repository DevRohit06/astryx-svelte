/**
 * @file Tests for the CLI capability manifest.
 *
 * Two jobs:
 *   1. DRIFT GUARDS — the manifest is the agent-facing contract for the whole
 *      CLI surface. These tests fail if a command is added without describing
 *      it: every registered command must appear in the manifest, every
 *      JSON-supported command must declare its response types, and every
 *      response-type key must map to a real command.
 *   2. SHAPE — each command entry carries the required fields, global options
 *      are described once, and the bare `astryx-svelte --json` /
 *      `astryx-svelte manifest --json` surfaces emit valid, enriched JSON.
 *
 * ## Ported case count
 *
 * Upstream's `manifest.test.mjs` has 16 cases. Fifteen are ported. The one
 * dropped is **"derives arguments from Commander metadata"**, which asserts on
 * `component`'s `name` argument and `theme build`'s required `file` argument —
 * no command with a positional argument exists in this slice. `describeArgument`
 * is still covered indirectly (every entry's `arguments` is asserted to be an
 * array), and the case returns with the `component` slice.
 *
 * Two cases are added, both specific to this port rather than beyond-upstream
 * coverage: the manifest's `name` is `astryx-svelte`, and `manifest` itself is
 * described. Upstream asserts the equivalent inside its e2e block.
 */

import { describe, it, expect } from 'vitest';
import { program, JSON_SUPPORTED } from '../index.mjs';
import { buildManifest, RESPONSE_TYPES } from './manifest.mjs';
import { runCli } from '../../../test-utils/run-cli.mjs';

const manifest = buildManifest(program, { jsonSupported: JSON_SUPPORTED, version: '0.0.0-test' });

/** Flatten the manifest command tree into fully-qualified names. */
function flatten(cmds, out = []) {
	for (const c of cmds) {
		out.push(c);
		if (c.subcommands) flatten(c.subcommands, out);
	}
	return out;
}
const allEntries = flatten(manifest.commands);
const allNames = new Set(allEntries.map((c) => c.name));

/** Fully-qualified names of every registered, non-hidden command in the program. */
function registeredNames() {
	const names = [];
	const walk = (cmd, prefix) => {
		for (const sub of cmd.commands || []) {
			if (sub._hidden || sub.name() === 'help') continue;
			const full = prefix ? `${prefix} ${sub.name()}` : sub.name();
			names.push(full);
			walk(sub, full);
		}
	};
	walk(program, '');
	return names;
}

describe('manifest: drift guards', () => {
	it('lists every registered (non-hidden) command', () => {
		for (const name of registeredNames()) {
			expect(allNames.has(name), `manifest is missing command "${name}"`).toBe(true);
		}
	});

	it('marks every JSON_SUPPORTED command as json:true', () => {
		for (const name of JSON_SUPPORTED) {
			const entry = allEntries.find((c) => c.name === name);
			expect(entry, `JSON_SUPPORTED command "${name}" not in manifest`).toBeDefined();
			expect(entry.json, `"${name}" should be json:true`).toBe(true);
		}
	});

	it('declares response types for every JSON-supported command', () => {
		for (const name of JSON_SUPPORTED) {
			expect(
				RESPONSE_TYPES[name],
				`JSON-supported command "${name}" has no response-type entry`
			).toBeDefined();
			expect(RESPONSE_TYPES[name].length).toBeGreaterThan(0);
		}
	});

	it('has no response-type entry for a command that does not exist', () => {
		for (const name of Object.keys(RESPONSE_TYPES)) {
			expect(allNames.has(name), `RESPONSE_TYPES key "${name}" is not a real command`).toBe(true);
		}
	});

	it('every command with response types is json-supported', () => {
		for (const entry of allEntries) {
			if (entry.responseTypes) {
				expect(entry.json, `"${entry.name}" emits types but isn't json-supported`).toBe(true);
			}
		}
	});

	it('sorts subcommands by name (stable, agent-facing order)', () => {
		for (const entry of allEntries) {
			if (!entry.subcommands) continue;
			const names = entry.subcommands.map((s) => s.name);
			expect(names, `subcommands of "${entry.name}" are not sorted`).toEqual(
				[...names].sort((a, b) => a.localeCompare(b))
			);
		}
	});

	it('is deterministic across builds', () => {
		const again = buildManifest(program, {
			jsonSupported: JSON_SUPPORTED,
			version: '0.0.0-test'
		});
		expect(again).toEqual(manifest);
	});

	it('excludes hidden commands', () => {
		// `postinstall` is registered with {hidden: true}; agents never invoke it.
		expect(allNames.has('postinstall')).toBe(false);
	});
});

describe('manifest: shape', () => {
	it('has top-level metadata', () => {
		expect(manifest.name).toBe('astryx-svelte');
		expect(manifest.apiVersion).toBe(1);
		expect(typeof manifest.description).toBe('string');
		expect(Array.isArray(manifest.commands)).toBe(true);
		expect(Array.isArray(manifest.globalOptions)).toBe(true);
	});

	it('describes global options once at top level (--json, --lang, --detail, --version)', () => {
		const flags = manifest.globalOptions.map((o) => o.flag).join(' ');
		expect(flags).toContain('--json');
		expect(flags).toContain('--lang');
		expect(flags).toContain('--detail');
		expect(flags).toContain('--version');
		// No duplicate --version
		const versionCount = manifest.globalOptions.filter((o) => /--version\b/.test(o.flag)).length;
		expect(versionCount).toBe(1);
	});

	it('surfaces enum choices and defaults on options', () => {
		const detail = manifest.globalOptions.find((o) => o.flag.includes('--detail'));
		expect(detail.type).toBe('enum');
		expect(detail.choices).toEqual(['full', 'compact', 'brief']);
		expect(detail.default).toBe('full');
	});

	it('each command entry carries the required fields', () => {
		for (const c of allEntries) {
			expect(typeof c.name).toBe('string');
			expect(typeof c.description).toBe('string');
			expect(Array.isArray(c.arguments)).toBe(true);
			expect(Array.isArray(c.options)).toBe(true);
			expect(typeof c.json).toBe('boolean');
		}
	});

	it('describes the manifest command itself, with its response type', () => {
		const entry = allEntries.find((c) => c.name === 'manifest');
		expect(entry).toBeDefined();
		expect(entry.json).toBe(true);
		expect(entry.responseTypes).toEqual(['manifest']);
		expect(entry.examples).toContain('astryx-svelte manifest --json');
	});
});

describe('manifest: e2e', () => {
	it('astryx-svelte manifest --json emits a valid manifest envelope', async () => {
		const { status, stdout } = await runCli(['manifest', '--json']);
		expect(status).toBe(0);
		const parsed = JSON.parse(stdout);
		expect(parsed.apiVersion).toBe(1);
		expect(parsed.type).toBe('manifest');
		expect(parsed.data.name).toBe('astryx-svelte');
		const names = parsed.data.commands.map((c) => c.name);
		expect(names).toContain('manifest');
	});

	it('bare astryx-svelte --json stays backwards-compatible AND embeds the manifest', async () => {
		const { status, stdout } = await runCli(['--json']);
		expect(status).toBe(0);
		const parsed = JSON.parse(stdout);
		// Back-compat: still type:'help' with name/version/commands(names)/jsonSupported
		expect(parsed.type).toBe('help');
		expect(parsed.data.name).toBe('astryx-svelte');
		expect(Array.isArray(parsed.data.commands)).toBe(true);
		expect(parsed.data.commands.every((c) => typeof c === 'string')).toBe(true);
		expect(parsed.data.commands).toContain('manifest');
		expect(Array.isArray(parsed.data.jsonSupported)).toBe(true);
		// Enriched: the full structured manifest is embedded.
		expect(parsed.data.manifest).toBeDefined();
		expect(
			parsed.data.manifest.commands.find((c) => c.name === 'manifest').responseTypes
		).toContain('manifest');
	});

	it('astryx-svelte manifest (human mode) prints greppable records', async () => {
		const { status, stdout } = await runCli(['manifest']);
		expect(status).toBe(0);
		expect(stdout).toContain('astryx-svelte v');
		// `record()` pads every key to the widest label + 2 ("description" here).
		expect(stdout).toMatch(/^command: +manifest$/m);
	});
});
