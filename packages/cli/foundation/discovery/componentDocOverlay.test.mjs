/**
 * @file Guards translated/compressed component docs against dropping props.
 * @input every `{Name}.doc.mjs` under packages/core/src/lib — its default
 *   export, `docsZh`, `docsDense`.
 * @output Vitest failures naming every prop that exists in the base doc but
 *   vanishes from a translated view.
 * @position Regression gate for component-loader.mjs.
 *
 * A `docsZh` that carries its own `props` array used to REPLACE the base doc
 * wholesale, so any prop the translation had not caught up with simply ceased
 * to exist: `astryx-svelte component Button --zh` silently omitted
 * `isInterruptible` and `isIconOnly`. A reader of the translated docs cannot
 * discover a prop that is not there, and CLAUDE.md tells every AI agent to read
 * these docs.
 *
 * Translations are now an overlay: a prop the translation does not cover falls
 * back to its English entry rather than disappearing. An overlay covering a
 * subset must not destroy what it does not cover.
 *
 * ## Ported case count
 *
 * 4 `it(` literals, matching upstream one for one. Two things differ, both
 * downstream of the same fact: **this port's core ships 209 docs and zero
 * translations.**
 *
 *   - The doc enumeration walks `src/lib` for `*.doc.mjs` (named for the
 *     export) instead of probing `src/<Name>/<Name>.doc.mjs`. The generated
 *     table it produces is 209 rows where upstream's is ~130; every row
 *     short-circuits on the missing `docsZh`/`docsDense`, which is what makes
 *     this suite a *gate* — it arms itself the moment a translation lands.
 *   - "keeps the translated descriptions it does have" **cannot** be run
 *     against core, because there is no translation in core to keep. It is run
 *     against an authored fixture instead, so the overlay's merge is genuinely
 *     exercised rather than skipped. Its sibling ("still lists …") stays on the
 *     real Button doc; it passes trivially today and re-arms with the first
 *     translation, which is exactly what upstream's does for an untranslated
 *     component.
 */

import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDocs } from './component-loader.mjs';

const CLI_ROOT = path.resolve(import.meta.dirname, '..', '..');
const CORE_SRC = path.resolve(CLI_ROOT, '..', 'core', 'src', 'lib');

/** Directories the doc walk never descends into. */
const SKIP = new Set(['node_modules', '__tests__']);

/** Every documented export core ships, named for the export. */
function componentDocs() {
	/** @type {Array<{name: string, docPath: string}>} */
	const out = [];
	/** @param {string} dir */
	const walk = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (SKIP.has(entry.name)) continue;
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) walk(full);
			else if (entry.name.endsWith('.doc.mjs')) {
				out.push({ name: entry.name.slice(0, -'.doc.mjs'.length), docPath: full });
			}
		}
	};
	walk(CORE_SRC);
	return out;
}

/** Prop names on a doc, across single- and multi-component shapes. */
function propNames(doc) {
	const names = new Set();
	for (const p of doc?.props ?? []) names.add(p.name);
	for (const c of doc?.components ?? []) {
		for (const p of c.props ?? []) names.add(`${c.name ?? '?'}.${p.name}`);
	}
	return names;
}

describe('translated component docs never drop a prop', () => {
	const comps = componentDocs();

	it('finds component docs to check', () => {
		expect(comps.length).toBeGreaterThan(0);
	});

	for (const { name, docPath } of comps) {
		for (const locale of ['zh', 'dense']) {
			it(`${name} --${locale}: documents every prop the base doc documents`, async () => {
				const mod = await import(pathToFileURL(docPath).href);
				const key = locale === 'zh' ? 'docsZh' : 'docsDense';
				if (!mod[key]) return; // no overlay, nothing to drift

				const english = propNames(mod.default ?? mod.docs);
				const translated = propNames(await loadDocs(docPath, { [locale]: true }));

				const dropped = [...english].filter((p) => !translated.has(p));
				expect(
					dropped,
					`${name}.doc.mjs ${key} drops ${dropped.length} prop(s) from the ` +
						`--${locale} view: ${dropped.join(', ')}. A reader of the ` +
						`translated docs cannot discover a prop that is not there. An ` +
						`untranslated prop must fall back to its English entry, not vanish.`
				).toEqual([]);
			});
		}
	}
});

describe('the reported symptom', () => {
	let tmpDir;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(CLI_ROOT, '.astryx-doc-overlay-'));
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it('astryx-svelte component Button --zh still lists isInterruptible and isIconOnly', async () => {
		const docPath = path.join(CORE_SRC, 'components', 'button', 'Button.doc.mjs');
		const zh = await loadDocs(docPath, { zh: true });
		const names = propNames(zh);
		expect(names.has('isInterruptible')).toBe(true);
		expect(names.has('isIconOnly')).toBe(true);
	});

	it('keeps the translated descriptions it does have', async () => {
		// Core ships no `docsZh`, so the translation this asserts on has to be
		// authored. The doc is Button-shaped and the overlay covers exactly one of
		// its three props, which is the subset case the overlay exists for.
		const docPath = path.join(tmpDir, 'Button.doc.mjs');
		fs.writeFileSync(
			docPath,
			[
				'export default {',
				"\ttype: 'component',",
				"\tname: 'Button',",
				'\tprops: [',
				"\t\t{name: 'variant', type: 'string', description: 'Visual style variant.'},",
				"\t\t{name: 'isInterruptible', type: 'boolean', description: 'Stays clickable.'},",
				"\t\t{name: 'isIconOnly', type: 'boolean', description: 'Square icon button.'}",
				'\t]',
				'};',
				'',
				'export const docsZh = {',
				"\tname: 'Button',",
				"\tprops: [{name: 'variant', type: 'string', description: '视觉样式变体。'}]",
				'};',
				''
			].join('\n')
		);

		const mod = await import(pathToFileURL(docPath).href);
		const zh = await loadDocs(docPath, { zh: true });

		const translated = mod.docsZh.props.find((p) => p.name === 'variant');
		const merged = zh.props.find((p) => p.name === 'variant');
		expect(merged.description).toBe(translated.description);
		// …and the two props the translation does not cover are still there.
		expect(propNames(zh).has('isInterruptible')).toBe(true);
		expect(propNames(zh).has('isIconOnly')).toBe(true);
	});
});
