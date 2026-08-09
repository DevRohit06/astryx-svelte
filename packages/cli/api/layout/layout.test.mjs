/**
 * @file Integration tests for the layout API against the real
 * `@astryx-svelte/core` registry. Every expansion is additionally checked for
 * syntactic validity with the **Svelte compiler**, so the "expansion emits a
 * compilable component" contract is enforced, not assumed.
 *
 * Ported case-for-case from upstream `api/layout/layout.test.mjs` at `v0.3.0`:
 * 24 cases, 24 here (2 of them `it.todo`). What the port had to change:
 *
 * - **The oracle.** Upstream parses the emitted TSX with `ts.createSourceFile`.
 *   The artifact here is a `.svelte` file, so the oracle is `svelte/compiler`'s
 *   `compile()` — a strictly stronger check than upstream's, because it is a
 *   full compile rather than a parse, and it runs on `generate: 'client'` so
 *   the `<script lang="ts">` block is transformed too. `typescript` stays out
 *   of it entirely, which also keeps the CLI's no-TypeScript-at-runtime rule
 *   from being weakened by a test-only import.
 * - **Scaffolded state is `$state`, not `useState`**, and tags are unprefixed
 *   (`<Center>`, not `<XDSCenter>` — see `registry-core.mjs`, which records why
 *   upstream's `XDS` tag prefix is corrected rather than inherited).
 * - **Slots are snippets.** `composer={…}` becomes `{#snippet composer()}`.
 * - **Svelte has no fragment**, so the two cases that assert `<>` around a
 *   multi-root expansion assert sibling roots instead; multiple roots are legal
 *   Svelte markup, which is why the wrapper upstream needs has no counterpart.
 *   Their titles say so rather than keeping a name the body contradicts.
 * - **Template blocks resolve, and `{card-callout}` still does not.** Slice 6
 *   landed `api/template/` and `_adapter.mjs` now loads every discovered
 *   `type: 'block'` into the catalog, so an external package or an integration
 *   can back a `{hint}` today. Core cannot: its 1,329 block assets are still
 *   deferred, and `card-callout` is one of them. So the three cases that merely
 *   *mention* `{card-callout}` while testing something else keep their
 *   expression verbatim and keep `loose: true` — the documented option whose
 *   whole purpose is "downgrade an unresolved `{hint}` to a TODO placeholder".
 *   Each says so inline. **The two splice cases stay `it.todo` for a second,
 *   permanent reason**: splicing co-defines a block as a second component
 *   inside the generated module, and a `.svelte` file holds exactly one
 *   component. That is a language fact, not a slice — see
 *   `foundation/xle/splice.mjs`.
 *
 * The transient fixture dir for the app-component bridge is `.astryx-*`, the
 * prefix `.gitignore` / `.prettierignore` / `eslint.config.js` all key on.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from 'svelte/compiler';
import { layoutExpand, layoutCheck, layoutGrammar } from './layout.mjs';
import { buildRegistry } from '../../foundation/xle/registry.mjs';

// The registry imports ~200 .doc.mjs modules on first use; under full-suite
// parallel load that can exceed the default 5s test timeout. Warm it once.
beforeAll(async () => {
	await buildRegistry();
}, 120_000);

const SLOW = 30_000;

/** Assert the generated component compiles; returns the compile result. */
function expectValidSvelte(code) {
	/** @type {unknown} */
	let compiled;
	expect(() => {
		compiled = compile(code, { filename: 'Generated.svelte', generate: 'client' });
	}).not.toThrow();
	return compiled;
}

const LOGIN_COMPACT =
	'Ctr[h="100dvh"] > C[w=400 p8] > V[g6] > ' +
	'(V[g1] > Tx"Welcome back" + Tx[t=supporting]"Sign in to your account") + ' +
	'(F > TI"Email"[t=email req] + TI"Password"[t=password req]) + ' +
	'(H[j=between a=center] > CB"Remember me" + Lk[href="/forgot"]"Forgot password?") + ' +
	'B.primary"Sign in"';

const CHAT_OUTLINE = `
AppShell
  topNav: TN
  Layout > LC !scroll
    ChL
      composer:
        ChC
      ChML
        ChS "Today"
        repeat 2:
          ChM
            ChB "Reply $"
    Tbar "Actions"
      B "Delete" opens=#confirm

overlays:
  AD#confirm "Delete item?"
`;

const DASHBOARD_COMPACT =
	'A[@topNav=TN @sideNav=SN] > L > V[g6] > ' +
	'(G[c4 g4] > C{card-callout}*4) + ' +
	'(C[p0] > T[striped] > (TR > THC"Name" + THC"Amount") + (TR > TC"Order $" + TC"\\$12.00")*3)';

describe('layoutExpand', () => {
	it(
		'expands the login card with typed state scaffolds',
		async () => {
			const result = await layoutExpand(LOGIN_COMPACT);
			expect(result.type).toBe('layout.expand');
			const { code } = result.data;
			expectValidSvelte(code);

			expect(code).toContain(`let email = $state('');`);
			expect(code).toContain(`let rememberMe = $state(false);`);
			expect(code).toContain('<Center height="100dvh">');
			expect(code).toContain('variant="primary"');
			// axis-neutral j/a resolved onto the HStack's real props
			expect(code).toContain('hAlign="between"');
			expect(code).toContain('vAlign="center"');
			// payload routed to label props, not duplicated as children
			expect(code).not.toMatch(/label="Forgot password\?"[\s\S]{0,80}Forgot password\?/);
		},
		SLOW
	);

	it(
		'expands the outline chat page: slots, repeat blocks, overlays, triggers',
		async () => {
			const result = await layoutExpand(CHAT_OUTLINE);
			const { code, form } = result.data;
			expect(form).toBe('outline');
			expectValidSvelte(code);

			expect(code).toContain('{#snippet composer()}');
			// slot satisfied required prop — no double assignment, no TODO for it
			expect(code.match(/\{#snippet composer\(\)\}/g)).toHaveLength(1);
			expect(code).toContain('TODO(xle): open #confirm');
			expect(code).toContain('overlays — wire open state');
			expect(code.match(/<ChatMessage\b/g) || []).toHaveLength(2);
		},
		SLOW
	);

	it(
		'expands the dashboard: table partition, repeats with $ counter and \\$ escape',
		async () => {
			// `loose` is the block-asset deferral, not a weakening of the case: the
			// expression keeps upstream's `C{card-callout}*4` verbatim, and with no
			// template catalog yet that hint has to resolve to a placeholder rather
			// than to a spliced block. Everything the case is *named* for — the
			// TableHeader/TableBody partition, the `$` repeat counter, the `\$`
			// escape — is asserted exactly as upstream asserts it.
			const result = await layoutExpand(DASHBOARD_COMPACT, { loose: true });
			const { code } = result.data;
			expectValidSvelte(code);

			expect(code).toContain('<TableHeader>');
			expect(code).toContain('<TableBody>');
			expect(code).toContain('Order 1');
			expect(code).toContain('Order 3');
			expect(code).toContain('$12.00');
			expect(code).not.toContain('112.00');
			// Upstream splices — co-defines `function CardCallout()` once and
			// references it four times, with no TODO marker. Core's `card-callout`
			// block asset does not exist here (and Svelte has no in-file second
			// component either), so all four references are pointer markers and
			// nothing is co-defined; this is the same output upstream produces when
			// a block's source is unavailable.
			expect(code.match(/TODO\(xle\): content '\{card-callout\}'/g) || []).toHaveLength(4);
			expect(result.data.blocksReferenced).toEqual([]);
		},
		SLOW
	);

	it(
		'compact and outline surfaces expand to identical Svelte',
		async () => {
			const check = await layoutCheck(LOGIN_COMPACT);
			const fromCompact = await layoutExpand(LOGIN_COMPACT);
			const fromOutline = await layoutExpand(check.data.outline, { form: 'outline' });
			expect(fromOutline.data.code).toEqual(fromCompact.data.code);
		},
		SLOW
	);

	it(
		'expansion is deterministic',
		async () => {
			const a = await layoutExpand(DASHBOARD_COMPACT, { loose: true });
			const b = await layoutExpand(DASHBOARD_COMPACT, { loose: true });
			expect(a.data.code).toEqual(b.data.code);
		},
		SLOW
	);

	it('throws structured errors with suggestions on invalid expressions', async () => {
		await expect(layoutExpand('A[p6] > Grdi')).rejects.toMatchObject({
			code: 'ERR_LAYOUT_INVALID',
			message: expect.stringMatching(/AppShell has no prop 'padding'/)
		});
	});

	it('rejects non-PascalCase --name', async () => {
		await expect(layoutExpand('V > C', { name: 'not pascal' })).rejects.toMatchObject({
			code: 'ERR_INVALID_ARGUMENT'
		});
	});

	it('surfaces parse errors with positions', async () => {
		await expect(layoutExpand('V > > C')).rejects.toMatchObject({
			code: 'ERR_LAYOUT_PARSE',
			message: expect.stringMatching(/line 1/)
		});
	});

	it('maps pathologically deep nesting to a coded parse error, not ERR_UNKNOWN', async () => {
		await expect(layoutCheck('V > '.repeat(2000) + 'C')).rejects.toMatchObject({
			code: 'ERR_LAYOUT_PARSE'
		});
	});

	// Upstream: "wraps top-level repeats and groups in a fragment (valid JSX)".
	// Svelte markup may have any number of roots, so there is no wrapper to
	// assert — the contract that survives is that every top-level item is
	// emitted as its own root and the whole file still compiles.
	it(
		'emits top-level repeats and groups as sibling roots (valid Svelte)',
		async () => {
			for (const [expr, roots] of [
				['B"Sign in"*3', 3],
				['(B"a" + B"b")', 2],
				['(B"a" + B"b")*2', 4]
			]) {
				const { data } = await layoutExpand(expr);
				expectValidSvelte(data.code);
				expect(data.code.match(/^<Button\b/gm) || []).toHaveLength(roots);
			}
		},
		SLOW
	);

	it(
		'emits a top-level outline repeat block as sibling roots',
		async () => {
			const { data } = await layoutExpand('repeat 3:\n  B "x"', { form: 'outline' });
			expectValidSvelte(data.code);
			expect(data.code.match(/^<Button\b/gm) || []).toHaveLength(3);
		},
		SLOW
	);

	it(
		'emits markup-safe Svelte for text payloads containing < and >',
		async () => {
			const result = await layoutExpand('Text"5 < 3 and 3 > 1"');
			expectValidSvelte(result.data.code);
		},
		SLOW
	);

	it(
		'emits markup-safe Svelte for text payloads containing { and }',
		async () => {
			const result = await layoutExpand('Text"cost is {price}"');
			expectValidSvelte(result.data.code);
		},
		SLOW
	);

	it(
		'emits markup-safe Svelte when a text payload looks like a closing tag',
		async () => {
			const result = await layoutExpand('Text"end</Text><img/>"');
			expectValidSvelte(result.data.code);
		},
		SLOW
	);

	it(
		'emits markup-safe Svelte for special chars in outline form',
		async () => {
			const result = await layoutExpand('VStack\n  Text "a < b"', { form: 'outline' });
			expectValidSvelte(result.data.code);
		},
		SLOW
	);
});

describe('layoutCheck', () => {
	it('returns both canonical surfaces for valid input', async () => {
		// `loose` per the block-asset note above — the expression and every
		// assertion are upstream's.
		const result = await layoutCheck('V[g6] > C{card-callout}*2', { loose: true });
		expect(result.data.valid).toBe(true);
		expect(result.data.compact).toContain('{card-callout}');
		expect(result.data.outline).toContain('C {card-callout} x2');
	});

	it('collects all errors instead of stopping at the first', async () => {
		const result = await layoutCheck('A[p6] > V[g7] > Bd.sucess"x" + C{not-a-block}');
		expect(result.data.valid).toBe(false);
		expect(result.data.errors.length).toBeGreaterThanOrEqual(4);
		const all = result.data.errors.map((e) => e.message).join('\n');
		expect(all).toMatch(/no prop 'padding'/);
		expect(all).toMatch(/must be one of/);
		expect(all).toMatch(/Unknown block/);
	});
});

describe('template referencing', () => {
	// Both splice cases are blocked twice over, and the second blocker has no
	// slice behind it. (1) They name core's `card-callout`, and the 1,329 block
	// assets are deferred — template discovery itself landed with slice 6 and
	// resolves external/integration blocks fine. (2) Splice mode co-defines the
	// block as a *second component inside the generated module*; a `.svelte`
	// file holds exactly one component, and the near-analogues (a snippet, a
	// sibling file) are a different mechanism, not the same one. See
	// foundation/xle/splice.mjs, which records that as settled rather than
	// pending.
	it.todo('splices a template block: co-defined once, referenced, imports merged');

	it.todo('merges a stateful block $state into a single generated component');

	it(
		'imports app-registered local components (the local-component bridge)',
		async () => {
			// Inside the workspace so @astryx-svelte/core resolves; cleaned up after.
			// A package.json beside the config makes Project.load resolve it as the
			// sibling-of-nearest-package.json (the standard config resolution).
			const cwd = mkdtempSync(join(process.cwd(), '.astryx-xle-imp-test-'));
			try {
				writeFileSync(join(cwd, 'package.json'), '{"name": "xle-imp-fixture"}\n');
				writeFileSync(
					join(cwd, 'astryx-svelte.config.mjs'),
					`export default {experimental: {xle: {components: {KpiCard: {from: '$lib/components/KpiCard.svelte', default: true}, TimeRangePicker: {from: '$lib/components/TimeRangePicker.svelte', default: true}}}}};\n`
				);
				const result = await layoutExpand(
					'S[p6] > (G[c4 g4] > {kpi-card}*4) + {time-range-picker}',
					{
						name: 'Demo',
						cwd
					}
				);
				const { code } = result.data;
				expectValidSvelte(code);
				// A Svelte component is a default export, so `default: true` in the
				// registration produces the default-import form where upstream's
				// React blocks produce a named one.
				expect(code).toContain("import KpiCard from '$lib/components/KpiCard.svelte';");
				expect(code).toContain(
					"import TimeRangePicker from '$lib/components/TimeRangePicker.svelte';"
				);
				expect(code.match(/<KpiCard \/>/g) || []).toHaveLength(4);
				expect(code).toContain('<TimeRangePicker />');
				expect(result.data.blocksReferenced).toContainEqual({ name: 'KpiCard', mode: 'import' });
			} finally {
				rmSync(cwd, { recursive: true, force: true });
			}
		},
		SLOW
	);

	it('parses a standalone {block} in both surfaces', async () => {
		// `loose` per the block-asset note above.
		const check = await layoutCheck('G[c4 g4] > {card-callout}*2', { loose: true });
		expect(check.data.valid).toBe(true);
		expect(check.data.compact).toContain('{card-callout}*2');
		expect(check.data.outline).toMatch(/\{card-callout\} x2/);
	});
});

describe('layoutGrammar', () => {
	it('emits the cheatsheet with branch-generated aliases', async () => {
		const result = await layoutGrammar();
		expect(result.data.text).toContain('TWO SURFACES');
		expect(result.data.aliases.V).toBe('VStack');
		expect(result.data.aliases.TB).toBe('TableBody');
		// every alias target must exist — the table is registry-filtered
		expect(Object.values(result.data.aliases)).not.toContain(undefined);
	});
});

describe('layout — input validation (API matches CLI)', () => {
	it('rejects an invalid --form value instead of silently parsing as compact', async () => {
		await expect(layoutCheck('V > C', { form: /** @type {any} */ ('xml') })).rejects.toMatchObject({
			code: 'ERR_INVALID_OPTION'
		});
		await expect(
			layoutExpand('V > C', { form: /** @type {any} */ ('nonsense') })
		).rejects.toMatchObject({
			code: 'ERR_INVALID_OPTION'
		});
	});

	it('rejects an empty expression at the API layer', async () => {
		await expect(layoutCheck('')).rejects.toMatchObject({ code: 'ERR_INVALID_ARGUMENT' });
		await expect(layoutExpand('   ')).rejects.toMatchObject({ code: 'ERR_INVALID_ARGUMENT' });
	});
});
