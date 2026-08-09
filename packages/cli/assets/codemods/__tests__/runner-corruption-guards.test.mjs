/**
 * @file **Coverage beyond upstream, deliberately.** Upstream has no counterpart
 * to this file and could not: every case below is a property of the
 * `magic-string` + `svelte/compiler` runner that replaced jscodeshift (see
 * `assets/codemods/runner.mjs` and `svelte-parser.mjs`), and the shape that
 * causes each hazard either does not exist in a React codebase or does not
 * exist in a runner that re-prints an AST instead of splicing a buffer. Every
 * *ported* runner assertion lives in `runner.test.mjs` and `validation.test.mjs`,
 * matching upstream's counts; nothing here duplicates one.
 *
 * The bar CLAUDE.md sets for coverage beyond upstream is "a hazard with no
 * upstream analogue, which the ported suites structurally cannot catch". A
 * codemod runner that corrupts source is the worst failure this CLI can have,
 * so each case names its hazard **and the mutation that makes it fail** — every
 * one of which was applied and reverted, not reasoned about:
 *
 *  1. **Idempotence.** A byte-offset codemod run twice must be a no-op the
 *     second time. jscodeshift's re-print normalises formatting, so upstream's
 *     runner could never assert byte-equality across two passes at all.
 *     *Mutation:* drop `result !== source` from the runner's write condition and
 *     the second pass reports a change and rewrites the file. This mutation is
 *     also what caught the first version of the fixture, which returned `null`
 *     on a no-op and so never reached the guard — see `renameWashAttribute`.
 *  2. **A parse failure leaves the file untouched.** The `.svelte` re-parse is
 *     the whole of the corruption guard for this port's primary file type, and
 *     it is the check jscodeshift structurally could not perform.
 *     *Mutation:* return `{checked: false}` unconditionally from `checkSyntax`
 *     and the broken markup is written to disk.
 *  3. **A `.ts` parse failure is caught too**, through the synthetic-`<script>`
 *     wrapper. Without it this port would silently lose validation on every
 *     non-Svelte file, which jscodeshift did cover.
 *     *Mutation:* remove `.ts` from `PARSEABLE_EXTENSIONS` and `const x = ;`
 *     reaches disk.
 *  4. **The wrapper's blind spot fails safe.** A source containing a literal
 *     `</script` would close the synthetic tag early; that must SKIP the check,
 *     never report a corruption that is not there.
 *     *Mutation:* delete the `</script` guard in `wrapAsScript` and a valid
 *     file is refused with "transform produced unparseable output".
 *  5. **Overlapping edits abort one file, not the run.** `magic-string` throws
 *     on overlapping ranges — a failure mode with no jscodeshift analogue,
 *     because an AST edit cannot overlap.
 *     *Mutation:* remove the per-file try/catch in `runCodeCodemod` and the
 *     throw escapes, taking the whole upgrade with it and skipping the healthy
 *     file that follows.
 *  6. **CRLF survives.** Splicing the original buffer preserves line endings a
 *     re-printer would normalise — but only if the string that was parsed is
 *     the string that is edited.
 *     *Mutation:* normalise `\r\n` before parsing in the transform and every
 *     offset after the first line shifts, corrupting the output (and, here,
 *     tripping guard 2 — which is the guard doing its job).
 *  7. **An already-migrated file is not rewritten**, even in a run that rewrites
 *     its neighbour.
 *     *Mutation:* same as 1 — the no-op file joins `writtenFiles`.
 *  8. **Byte fidelity is the point.** The offset rewrite touches the attribute
 *     and nothing else: a `wash` in a comment, in text, and in a string literal
 *     all survive. This is the capability claim the whole substitution rests on.
 *     *Mutation:* replace the splice with `source.replace(/wash/g, 'muted')` and
 *     all three unrelated occurrences are rewritten.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { runCodemods } from '../runner.mjs';
import { tryLoadSvelteCompiler } from '../svelte-parser.mjs';

let tmpDir;
let srcDir;
let originalCwd;
/** @type {import('../svelte-parser.mjs').SvelteParse} */
let parse;
/** @type {import('../../../authoring/codemod/type').SvelteWalk} */
let walk;

beforeAll(async () => {
	const compiler = /** @type {any} */ (await tryLoadSvelteCompiler());
	expect(compiler).not.toBeNull();
	({ parse, walk } = compiler);
	expect(parse).toBeTypeOf('function');
	expect(walk).toBeTypeOf('function');
});

beforeEach(() => {
	originalCwd = process.cwd();
	tmpDir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-guards-'));
	srcDir = path.join(tmpDir, 'src');
	fs.mkdirSync(srcDir, { recursive: true });
	process.chdir(tmpDir);
});

afterEach(() => {
	process.chdir(originalCwd);
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

/** Wrap one transform as a single-entry core version manifest. */
function manifest(transform, meta = {}) {
	return [
		{
			version: '9.9.9',
			transforms: [{ name: 'guard-codemod', meta: { title: 'Guard codemod', ...meta }, transform }]
		}
	];
}

/** @param {any[]} manifests */
function run(manifests, { apply = true } = {}) {
	return runCodemods(manifests, { apply, path: './src', parse, walk, silent: true });
}

/**
 * The same rename, written against `api.walk` instead of a hand-rolled descent.
 *
 * This is not a stylistic variant of {@link renameWashAttribute}: the two do
 * **not** find the same nodes. A hand-rolled walk follows the child list its
 * author thought of — here `node.fragment.nodes` — and a Svelte AST has several
 * others. An `IfBlock` keeps its children on `consequent` / `alternate`, so a
 * `<Widget>` inside `{#if}` is invisible to it and the codemod silently skips a
 * file it was supposed to migrate. `walk` is `zimmerframe`'s, the walker
 * Svelte's own migration codemod uses, and it visits every child list there is.
 */
function renameWashViaWalk(file, api) {
	const ast = /** @type {any} */ (api.parseSvelte(file.source, { modern: true }));
	const s = new api.magicString(file.source);
	api.walk(ast, null, {
		Component(node, { next }) {
			if (node.name === 'Widget') {
				for (const attr of node.attributes ?? []) {
					if (attr.type === 'Attribute' && attr.name === 'wash') {
						s.overwrite(attr.start, attr.start + 'wash'.length, 'muted');
					}
				}
			}
			next();
		}
	});
	return s.toString();
}

/**
 * The real thing: locate `wash` on a `<Widget>` through the Svelte AST and
 * splice it by byte offset. This is the transform shape the authoring contract
 * advertises, exercised through the runner rather than in isolation.
 *
 * It **always returns a string**, even when nothing matched. That is the common
 * transform shape (a `String.replace` does the same) and it is deliberate here:
 * it is what makes the runner's own `result === source` no-op guard
 * load-bearing. A transform that returns `null` when it changes nothing is
 * caught one branch earlier, so the guard would go untested — which is exactly
 * what the first version of this file did, and the M1 mutation is what showed it.
 */
function renameWashAttribute(file, api) {
	const ast = /** @type {any} */ (api.parseSvelte(file.source, { modern: true }));
	const s = new api.magicString(file.source);
	/** @param {any[]} nodes */
	const walk = (nodes) => {
		for (const node of nodes ?? []) {
			if (node.type === 'Component' && node.name === 'Widget') {
				for (const attr of node.attributes ?? []) {
					if (attr.type === 'Attribute' && attr.name === 'wash') {
						s.overwrite(attr.start, attr.start + 'wash'.length, 'muted');
					}
				}
			}
			walk(node.fragment?.nodes);
		}
	};
	walk(ast.fragment?.nodes);
	return s.toString();
}

describe('codemod runner — api.walk', () => {
	it('reaches a component the hand-rolled fragment descent cannot see', async () => {
		const file = path.join(srcDir, 'Page.svelte');
		// `<Widget>` sits inside `{#if}`, whose children hang off `consequent`
		// rather than `fragment` — the exact shape a hand-rolled walk misses.
		const source = '{#if ok}\n\t<Widget wash label="a" />\n{/if}\n';

		fs.writeFileSync(file, source);
		const handRolled = await run(manifest(renameWashAttribute));
		expect(handRolled.totalFilesChanged).toBe(0);
		expect(fs.readFileSync(file, 'utf-8')).toBe(source);

		fs.writeFileSync(file, source);
		const walked = await run(manifest(renameWashViaWalk));
		expect(walked.totalFilesChanged).toBe(1);
		expect(fs.readFileSync(file, 'utf-8')).toBe('{#if ok}\n\t<Widget muted label="a" />\n{/if}\n');
	});

	it('agrees with the hand-rolled descent at the top level, byte for byte', async () => {
		const source = '<Widget wash label="wash" />\n<!-- wash -->\n';
		const expected = '<Widget muted label="wash" />\n<!-- wash -->\n';
		const file = path.join(srcDir, 'Page.svelte');

		for (const transform of [renameWashAttribute, renameWashViaWalk]) {
			fs.writeFileSync(file, source);
			const result = await run(manifest(transform));
			expect(result.totalFilesChanged).toBe(1);
			expect(fs.readFileSync(file, 'utf-8')).toBe(expected);
		}
	});

	it('prunes: a visitor that never calls next() does not descend', async () => {
		const file = path.join(srcDir, 'Page.svelte');
		fs.writeFileSync(file, '<Widget wash>\n\t<Widget wash />\n</Widget>\n');

		// Rewrites the outer `<Widget>` and then stops, so the nested one survives.
		const outerOnly = (f, api) => {
			const ast = /** @type {any} */ (api.parseSvelte(f.source, { modern: true }));
			const s = new api.magicString(f.source);
			api.walk(ast, null, {
				Component(node) {
					for (const attr of node.attributes ?? []) {
						if (attr.type === 'Attribute' && attr.name === 'wash') {
							s.overwrite(attr.start, attr.start + 'wash'.length, 'muted');
						}
					}
					// deliberately no next()
				}
			});
			return s.toString();
		};

		const result = await run(manifest(outerOnly));
		expect(result.totalFilesChanged).toBe(1);
		expect(fs.readFileSync(file, 'utf-8')).toBe('<Widget muted>\n\t<Widget wash />\n</Widget>\n');
	});
});

describe('codemod runner — corruption guards', () => {
	it('is idempotent: a second pass changes nothing and writes nothing', async () => {
		const file = path.join(srcDir, 'Page.svelte');
		fs.writeFileSync(file, '<Widget wash label="a" />\n');

		const first = await run(manifest(renameWashAttribute));
		expect(first.totalFilesChanged).toBe(1);
		const afterFirst = fs.readFileSync(file, 'utf-8');
		expect(afterFirst).toBe('<Widget muted label="a" />\n');

		const second = await run(manifest(renameWashAttribute));
		expect(second.totalFilesChanged).toBe(0);
		expect(second.writtenFiles).toEqual([]);
		expect(fs.readFileSync(file, 'utf-8')).toBe(afterFirst);
	});

	it('leaves a .svelte file byte-identical when the transform breaks the parse', async () => {
		const file = path.join(srcDir, 'Page.svelte');
		const before = '<Widget wash label="a" />\n';
		fs.writeFileSync(file, before);

		// Chops the closing `/>` — the output no longer parses.
		const result = await run(manifest((f) => f.source.replace(' />', ' ')));

		expect(result.totalValidationBlocked).toBe(1);
		expect(result.writtenFiles).toEqual([]);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].error).toMatch(/unparseable/);
		expect(fs.readFileSync(file, 'utf-8')).toBe(before);
	});

	it('catches a broken .ts output through the synthetic-script wrapper', async () => {
		const file = path.join(srcDir, 'util.ts');
		const before = 'export const x: number = 1;\n';
		fs.writeFileSync(file, before);

		const result = await run(manifest((f) => f.source.replace('1', '')));

		expect(result.totalValidationBlocked).toBe(1);
		expect(result.errors[0].error).toMatch(/unparseable/);
		expect(fs.readFileSync(file, 'utf-8')).toBe(before);
	});

	it('does not falsely block a source that contains a literal closing script tag', async () => {
		const file = path.join(srcDir, 'strings.ts');
		// The wrapper cannot check this file — but "cannot check" must never mean
		// "report as corrupt". The edit goes through.
		fs.writeFileSync(file, 'export const tpl = "<script>a</scr" + "ipt>";\n');
		fs.writeFileSync(
			path.join(srcDir, 'other.ts'),
			'export const closer = "</script>"; export const v = 1;\n'
		);

		const result = await run(manifest((f) => f.source.replace('v = 1', 'v = 2')));

		expect(result.errors).toEqual([]);
		expect(fs.readFileSync(path.join(srcDir, 'other.ts'), 'utf-8')).toContain('v = 2');
	});

	it('isolates an overlapping-edit throw to its own file', async () => {
		const bad = path.join(srcDir, 'a-bad.svelte');
		const good = path.join(srcDir, 'b-good.svelte');
		const badBefore = '<Widget wash label="a" />\n';
		fs.writeFileSync(bad, badBefore);
		fs.writeFileSync(good, '<Widget wash label="b" />\n');

		// Overlapping overwrite ranges: magic-string throws rather than producing
		// silently wrong output. Only the offending file may be lost.
		const result = await run(
			manifest((f, api) => {
				if (path.basename(f.path) === 'a-bad.svelte') {
					const s = new api.magicString(f.source);
					s.overwrite(0, 10, 'X');
					s.overwrite(5, 15, 'Y');
					return s.toString();
				}
				return renameWashAttribute(f, api);
			})
		);

		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].file).toMatch(/a-bad\.svelte$/);
		// The failing file is untouched…
		expect(fs.readFileSync(bad, 'utf-8')).toBe(badBefore);
		// …and the healthy one still ran.
		expect(fs.readFileSync(good, 'utf-8')).toBe('<Widget muted label="b" />\n');
	});

	it('preserves CRLF line endings through a byte-offset edit', async () => {
		const file = path.join(srcDir, 'Page.svelte');
		const before = '<script>\r\n\tlet a = 1;\r\n</script>\r\n\r\n<Widget wash label="a" />\r\n';
		fs.writeFileSync(file, before);

		const result = await run(manifest(renameWashAttribute));

		expect(result.errors).toEqual([]);
		const after = fs.readFileSync(file, 'utf-8');
		expect(after).toBe(before.replace('wash', 'muted'));
		// Every original CRLF survived; no bare LF was introduced.
		expect((after.match(/\r\n/g) ?? []).length).toBe((before.match(/\r\n/g) ?? []).length);
		expect(after).not.toMatch(/[^\r]\n/);
	});

	it('does not rewrite an already-migrated file alongside a stale one', async () => {
		const stale = path.join(srcDir, 'Stale.svelte');
		const migrated = path.join(srcDir, 'Migrated.svelte');
		fs.writeFileSync(stale, '<Widget wash />\n');
		const migratedBefore = '<Widget muted />\n';
		fs.writeFileSync(migrated, migratedBefore);

		const result = await run(manifest(renameWashAttribute));

		expect(result.totalFilesChanged).toBe(1);
		expect(result.writtenFiles).toEqual([stale]);
		expect(fs.readFileSync(migrated, 'utf-8')).toBe(migratedBefore);
	});

	it('touches only the located bytes — comments, text and strings survive', async () => {
		const file = path.join(srcDir, 'Page.svelte');
		const before = [
			'<script>',
			'\t// wash is the old name for muted',
			"\tconst label = 'wash';",
			'</script>',
			'',
			'<!-- wash -->',
			'<Widget wash={true} label="wash" />',
			'<p>wash</p>',
			''
		].join('\n');
		fs.writeFileSync(file, before);

		const result = await run(manifest(renameWashAttribute));

		expect(result.errors).toEqual([]);
		const after = fs.readFileSync(file, 'utf-8');
		// Exactly one occurrence changed: the attribute NAME.
		expect(after).toContain('<Widget muted={true} label="wash" />');
		expect(after).toContain('// wash is the old name for muted');
		expect(after).toContain("const label = 'wash';");
		expect(after).toContain('<!-- wash -->');
		expect(after).toContain('<p>wash</p>');
		expect((after.match(/wash/g) ?? []).length).toBe((before.match(/wash/g) ?? []).length - 1);
	});
});
