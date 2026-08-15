#!/usr/bin/env node
// One-shot rewriter for the doc paths that moved under `port/`. Deleted once
// Task 5 has run it for the last time — it exists to make a 330-file diff
// reviewable as one mechanical substitution rather than 330 judgement calls.
//
// Usage: node scripts/codemod-doc-paths.mjs [--check]
//   --check exits 1 if any occurrence remains, and writes nothing.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// `planning/` is a prefix rule on purpose: `planning/06-react-to-svelte-patterns.md`
// becomes `port/research/06-react-to-svelte-patterns.md` with the filename intact.
const RULES = [
	[/\bUPSTREAM-DIFF\.md\b/g, 'port/upstream-diff.md'],
	[/\bTODO\.md\b/g, 'port/todo.md'],
	[/\bplanning\//g, 'port/research/']
];

// `CHANGELOG.md` is a published record of what the repo looked like at each
// release. Rewriting it would falsify shipped history.
const EXCLUDE = new Set(['CHANGELOG.md']);

const checkOnly = process.argv.includes('--check');

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
	.split('\n')
	.filter(Boolean)
	.filter((f) => !EXCLUDE.has(f))
	// `port/` files carry repo-root-relative paths already; the codemod's
	// `port/research/...` replacement would double up (`port/port/research/...`)
	// if applied inside `port/` itself. Those files get hand-edited separately.
	.filter((f) => !f.startsWith('port/'))
	.filter((f) => /\.(md|mjs|js|ts|svelte|yml|yaml|json)$/.test(f));

let changed = 0;
let occurrences = 0;

for (const file of files) {
	const before = readFileSync(file, 'utf8');
	let after = before;
	for (const [pattern, replacement] of RULES) {
		after = after.replace(pattern, () => {
			occurrences += 1;
			return replacement;
		});
	}
	if (after === before) continue;
	changed += 1;
	if (!checkOnly) writeFileSync(file, after);
}

if (checkOnly) {
	if (occurrences > 0) {
		console.error(`${occurrences} stale doc path(s) across ${changed} file(s)`);
		process.exit(1);
	}
	console.log('no stale doc paths');
	process.exit(0);
}

console.log(`rewrote ${occurrences} occurrence(s) across ${changed} file(s)`);
