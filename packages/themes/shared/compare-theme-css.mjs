// Shared theme oracle for every `packages/themes/*` package.
//
// Compares a package's generated `dist/theme.css` against the Astryx package it
// ports, in BOTH directions.
//
// The forward half — every declaration we emit matches theirs, same selector,
// same property, same value — is what makes the port tractable. The reverse
// half is what stops a green run from meaning less than it looks: this script
// was one-directional until 2026-08-03, and behind a clean 196/196 sat 135
// declarations upstream emits and we did not, including the whole semantic type
// scale and the `@layer reset` prose block. A one-directional oracle is not
// coverage.
//
// A declaration upstream has that we do not emit fails the run unless it is
// named in the caller's `emittedElsewhere` map. Those entries are self-retiring
// in both directions — one that stops matching upstream, or that we start
// emitting from theme.css after all, fails just as loudly, so the list cannot
// rot into an excuse for a real gap.
//
// This directory is deliberately **not** a workspace package: see the note in
// `build-theme-package.mjs`.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * The three `color-scheme` rules every upstream theme package ships in its
 * `theme.css` and this port emits from `core/styles/base.css` instead. Shared
 * because the reason is the same for every theme, and spread into each
 * package's own map so it still self-retires per package.
 */
export const COLOR_SCHEME_IN_BASE_CSS = {
	':root|color-scheme':
		'core/styles/base.css. The components require `color-scheme` for every ' +
		'`light-dark()` token to resolve at all, so it cannot be contingent on a ' +
		'theme package being installed.',
	'html[data-theme="light"]|color-scheme':
		'core/styles/base.css, under the broader `[data-theme="light"]` — the ' +
		'`<Theme>` component sets the attribute on a subtree wrapper, not only on ' +
		'`<html>`, so a nested theme must pin its own mode.',
	'html[data-theme="dark"]|color-scheme': 'core/styles/base.css — see the `light` entry above.'
};

/** Flattens a stylesheet into `selector { prop: value }` triples. */
function declarations(css) {
	const out = new Map();
	// Strip comments, then walk rule bodies. Selectors that survive are the last
	// non-brace token before `{`.
	const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, '');
	const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
	let m;
	while ((m = ruleRe.exec(cleaned)) !== null) {
		const selector = m[1].trim().split('\n').pop().trim();
		if (!selector || selector.startsWith('@')) continue;
		for (const decl of m[2].split(';')) {
			const idx = decl.indexOf(':');
			if (idx === -1) continue;
			const prop = decl.slice(0, idx).trim();
			const value = decl.slice(idx + 1).trim();
			if (!prop) continue;
			out.set(`${selector}|${prop}`, value);
		}
	}
	return out;
}

/**
 * Diffs our theme.css against upstream's and exits 1 on any difference.
 *
 * @param {object} options
 * @param {string} options.packageDir Absolute path to the theme package root.
 * @param {string} options.upstreamPackage e.g. `@astryxdesign/theme-matcha`.
 * @param {Record<string, string>} [options.emittedElsewhere] Upstream
 *   declarations this port emits from somewhere else, keyed by
 *   `selector|property`, valued with the reason it is not a gap.
 */
export async function compareThemeCss({ packageDir, upstreamPackage, emittedElsewhere = {} }) {
	const oursPath = join(packageDir, 'dist', 'theme.css');
	const ours = await readFile(oursPath, 'utf8').catch(() => {
		console.error(`${oursPath} does not exist — run \`pnpm build\` in this package first.`);
		process.exit(1);
	});

	// Resolved through the package's own `node_modules` symlink rather than by
	// scanning pnpm's store. The store keeps orphaned versions around after a
	// version change, so a prefix scan can match the wrong one — and the whole
	// point of pinning these **exact** is that the ground truth is the version
	// whose source `reference/astryx-upstream` holds.
	const upstreamPath = join(packageDir, 'node_modules', upstreamPackage, 'dist', 'theme.css');
	const upstream = await readFile(upstreamPath, 'utf8').catch(() => {
		// It is a devDependency, so an install that pruned it would leave this
		// script with nothing to compare against.
		console.error(
			`upstream ${upstreamPackage} not found at ${upstreamPath} — it is a ` +
				'devDependency, so install without --prod / NODE_ENV=production'
		);
		process.exit(1);
	});

	const a = declarations(ours);
	const b = declarations(upstream);

	const norm = (v) => v.replace(/\s+/g, ' ').toLowerCase();

	let matched = 0;
	const mismatched = [];
	const notUpstream = [];

	for (const [key, value] of a) {
		if (!b.has(key)) {
			notUpstream.push(key);
		} else if (norm(b.get(key)) !== norm(value)) {
			mismatched.push({ key, ours: value, upstream: b.get(key) });
		} else {
			matched++;
		}
	}

	// The reverse direction: what upstream emits and we do not.
	const claimed = new Set();
	const notHere = [];

	for (const key of b.keys()) {
		if (a.has(key)) continue;
		if (key in emittedElsewhere) {
			claimed.add(key);
			continue;
		}
		notHere.push(key);
	}

	// An entry excusing a declaration upstream no longer has, or one we now emit
	// ourselves, has stopped doing any work — and would go on hiding the next real
	// gap at that key.
	const staleEntries = [];
	for (const key of Object.keys(emittedElsewhere)) {
		if (claimed.has(key)) continue;
		staleEntries.push(
			a.has(key)
				? `${key} — we now emit this from theme.css; drop the entry`
				: `${key} — upstream no longer declares this; drop the entry`
		);
	}

	console.log(`ours:     ${a.size} declarations`);
	console.log(`upstream: ${b.size} declarations`);
	console.log(`matched:  ${matched}`);
	console.log(`mismatch: ${mismatched.length}`);
	console.log(`not found upstream: ${notUpstream.length}`);
	console.log(`missing here: ${notHere.length} (+ ${claimed.size} emitted elsewhere)`);

	if (mismatched.length) {
		console.log('\n--- mismatches ---');
		for (const m of mismatched.slice(0, 20)) {
			console.log(`${m.key}\n  ours:     ${m.ours}\n  upstream: ${m.upstream}`);
		}
		if (mismatched.length > 20) console.log(`  … ${mismatched.length - 20} more`);
	}
	if (notUpstream.length) {
		console.log('\n--- present in ours, absent upstream ---');
		for (const k of notUpstream.slice(0, 20)) console.log(`  ${k}  ${a.get(k)}`);
		if (notUpstream.length > 20) console.log(`  … ${notUpstream.length - 20} more`);
	}
	if (notHere.length) {
		console.log('\n--- declared upstream, absent here ---');
		for (const k of notHere.slice(0, 40)) console.log(`  ${k}: ${b.get(k)}`);
		if (notHere.length > 40) console.log(`  … ${notHere.length - 40} more`);
	}
	if (staleEntries.length) {
		console.log('\n--- stale `emittedElsewhere` entries — these no longer excuse anything ---');
		for (const e of staleEntries) console.log(`  ${e}`);
	}

	process.exit(
		mismatched.length === 0 &&
			notUpstream.length === 0 &&
			notHere.length === 0 &&
			staleEntries.length === 0
			? 0
			: 1
	);
}
