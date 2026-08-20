#!/usr/bin/env node
/**
 * @file build-pseudo-locale.mjs
 * @description Generates `src/lib/locales/pseudo.json` from `en.json`. Each
 *   message is wrapped in ⟦…⟧ and its letters replaced with accented forms, so
 *   an untranslated string is obviously untranslated in the UI and a
 *   narrow-column layout bug surfaces. Ported from upstream's
 *   `packages/core/scripts/build-pseudo-locale.mjs`, algorithm unchanged.
 *
 *   Placeholders — `{name}`, `{count, plural, …}` — are left INTACT so the ICU
 *   parser still works. Only literal letters outside braces are transformed.
 *
 * @input  src/lib/locales/en.json
 * @output src/lib/locales/pseudo.json, or exit 1 under `--check`
 * @position `pnpm -F @astryx-svelte/core build:pseudo`; `--check` runs in the gate
 *
 * ## Why this exists here at all
 *
 * Upstream **gitignores** its `pseudo.json` and regenerates it on every build,
 * so the file is absent from the upstream clone and there was nothing for this
 * port to vendor or diff against. The copy here was generated once and then
 * silently rotted: at the 0.4.5 pin it was **34 keys behind** `en.json`,
 * missing every announcement key wired in batch 029 — so the locale that exists
 * to make missing translations visible was itself missing them.
 *
 * `--check` is the whole point. A generator without one is how the file rotted
 * the first time.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LOCALES = resolve(HERE, '..', 'src', 'lib', 'locales');
const EN_PATH = resolve(LOCALES, 'en.json');
const PSEUDO_PATH = resolve(LOCALES, 'pseudo.json');

// prettier-ignore
const ACCENTED = {
	a: 'à', b: 'ƀ', c: 'ç', d: 'ð', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ',
	i: 'í', j: 'ĵ', k: 'ķ', l: 'ł', m: 'ɱ', n: 'ñ', o: 'ó', p: 'þ',
	q: 'ɋ', r: 'ř', s: 'š', t: 'ţ', u: 'ú', v: 'ṽ', w: 'ŵ', x: 'ẋ',
	y: 'ý', z: 'ž',
	A: 'À', B: 'Ɓ', C: 'Ç', D: 'Ð', E: 'É', F: 'Ƒ', G: 'Ĝ', H: 'Ĥ',
	I: 'Í', J: 'Ĵ', K: 'Ķ', L: 'Ł', M: 'Ṁ', N: 'Ñ', O: 'Ó', P: 'Þ',
	Q: 'Ǫ', R: 'Ř', S: 'Š', T: 'Ţ', U: 'Ú', V: 'Ṽ', W: 'Ŵ', X: 'Ẋ',
	Y: 'Ý', Z: 'Ž'
};

/** Upstream's transform: accent letters outside braces, leave ICU syntax alone. */
function pseudoTranslate(msg) {
	let out = '';
	let depth = 0;
	for (const ch of msg) {
		if (ch === '{') {
			depth++;
			out += ch;
			continue;
		}
		if (ch === '}') {
			depth--;
			out += ch;
			continue;
		}
		if (depth > 0) {
			out += ch;
			continue;
		}
		out += ACCENTED[ch] ?? ch;
	}
	return `⟦${out}⟧`;
}

const en = JSON.parse(readFileSync(EN_PATH, 'utf8'));
const pseudo = {};
for (const [key, entry] of Object.entries(en)) {
	pseudo[key] = { defaultMessage: pseudoTranslate(entry.defaultMessage) };
}

const rendered = JSON.stringify(pseudo, null, 2) + '\n';
const check = process.argv.includes('--check');

if (check) {
	let current = '';
	try {
		current = readFileSync(PSEUDO_PATH, 'utf8');
	} catch {
		console.error('pseudo.json is missing — run `pnpm -F @astryx-svelte/core build:pseudo`');
		process.exit(1);
	}
	if (current !== rendered) {
		const currentKeys = new Set(Object.keys(JSON.parse(current)));
		const missing = Object.keys(pseudo).filter((k) => !currentKeys.has(k));
		const extra = [...currentKeys].filter((k) => !(k in pseudo));
		console.error('pseudo.json is out of date with en.json.');
		if (missing.length > 0) console.error(`  missing ${missing.length}: ${missing.join(', ')}`);
		if (extra.length > 0) console.error(`  stale ${extra.length}: ${extra.join(', ')}`);
		if (missing.length === 0 && extra.length === 0) {
			console.error('  same keys, different content — a message changed in en.json');
		}
		console.error('Run `pnpm -F @astryx-svelte/core build:pseudo`.');
		process.exit(1);
	}
	console.log(`pseudo.json is current — ${Object.keys(pseudo).length} keys`);
} else {
	writeFileSync(PSEUDO_PATH, rendered, 'utf8');
	console.log(`Built pseudo.json — ${Object.keys(pseudo).length} keys`);
}
