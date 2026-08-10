/**
 * @file check-publish.mjs
 *
 * Runs `publint` over every publishable workspace package and asserts the two
 * things a first release gets wrong silently: a manifest that resolves to files
 * the tarball does not carry, and a package with no README (npm renders a blank
 * page for it, and nothing else in this repo would ever notice).
 *
 * Why a script rather than a per-package `publint` devDependency: the binary is
 * only linked into the package that declares it, so `pnpm -r exec publint`
 * fails everywhere but `packages/core`. The API takes a directory, so one root
 * script covers all ten.
 *
 * Reads the built `dist/` where a package has one, so `pnpm -r build` must have
 * run first — publint checks that `exports` resolve to files that exist, and an
 * unbuilt package fails on every entry point at once.
 *
 * Given `--version <x.y.z>` it also asserts every publishable package sits at
 * exactly that version. The release workflow passes the git tag, which is what
 * stops a tag and a manifest disagreeing about what is being published — the
 * packages here move in lockstep with the upstream Astryx version they port, so
 * "all equal, and equal to the tag" is the whole versioning rule.
 *
 * @input  packages/{core,cli}, packages/themes/*
 * @output exit 0, or exit 1 with the offending package and message
 * @position `pnpm check:publish`; a gate in .github/workflows/release.yml
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publint } from 'publint';
import { formatMessage } from 'publint/utils';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const versionFlag = process.argv.indexOf('--version');
/** The version every package must carry, when the caller pins one. */
const expectedVersion = versionFlag === -1 ? null : process.argv[versionFlag + 1];

if (versionFlag !== -1 && !expectedVersion) {
	console.error('--version needs a value, e.g. `--version 0.3.0`');
	process.exit(1);
}

/** Every workspace package that is not marked `private`. `docs` is not one. */
function publishablePackages() {
	const dirs = [
		path.join(ROOT, 'packages', 'core'),
		path.join(ROOT, 'packages', 'cli'),
		...fs
			.readdirSync(path.join(ROOT, 'packages', 'themes'))
			.map((name) => path.join(ROOT, 'packages', 'themes', name))
	];

	return dirs.filter((dir) => {
		const manifest = path.join(dir, 'package.json');
		if (!fs.existsSync(manifest)) return false;
		return JSON.parse(fs.readFileSync(manifest, 'utf8')).private !== true;
	});
}

let failed = 0;

for (const pkgDir of publishablePackages()) {
	const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
	const rel = path.relative(ROOT, pkgDir).replace(/\\/g, '/');
	const problems = [];

	if (expectedVersion && pkg.version !== expectedVersion) {
		problems.push(`error: version is ${pkg.version}, but the release is ${expectedVersion}`);
	}

	// publint's own checks: exports that do not resolve, a `files` field that
	// excludes an entry point, wrong `types` order, CJS/ESM confusion.
	const { messages } = await publint({ pkgDir, level: 'suggestion', strict: true });
	for (const message of messages) {
		problems.push(`${message.type}: ${formatMessage(message, pkg) ?? message.code}`);
	}

	// npm always packs a README if one exists and never warns when none does, so
	// the failure mode is a published package whose npm page is empty.
	const hasReadme = fs
		.readdirSync(pkgDir)
		.some((name) => /^readme(\.md|\.markdown)?$/i.test(name));
	if (!hasReadme) problems.push('error: no README.md — npm would render an empty package page');

	if (problems.length === 0) {
		console.log(`  ok    ${rel} (${pkg.name}@${pkg.version})`);
		continue;
	}

	failed += 1;
	console.log(`  FAIL  ${rel} (${pkg.name}@${pkg.version})`);
	for (const problem of problems) console.log(`          ${problem}`);
}

if (failed > 0) {
	console.error(`\n${failed} package(s) are not fit to publish.`);
	process.exit(1);
}

console.log('\nEvery publishable package is fit to publish.');
