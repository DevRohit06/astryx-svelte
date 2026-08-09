/**
 * @file Colocated tests for package-manager detection and the install-aware
 * CLI invocation stem.
 *
 * Ported case for case from upstream's suite. Only the identity strings move:
 * the bin is `astryx-svelte` and the scoped package is `@astryx-svelte/cli`.
 * That rename is not cosmetic here — `formatCliCommand`'s leading-token strip
 * had to diverge from upstream's, which anchors on a word boundary after
 * `astryx`; a word boundary matches at the hyphen, so upstream's pattern would
 * strip `astryx` out of `astryx-svelte docs` and leave a stray `-svelte`
 * behind. The three `formatCliCommand` cases below assert the whole formatted
 * string, so they fail on that regression rather than merely not covering it.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
	detectPackageManager,
	getDlxPrefix,
	isCliOneOff,
	getCliInvocation,
	formatCliCommand
} from './package-manager.mjs';

let tmpDir;
const ORIGINAL_ARGV1 = process.argv[1];

afterEach(() => {
	if (tmpDir) {
		fs.rmSync(tmpDir, { recursive: true, force: true });
		tmpDir = null;
	}
	vi.restoreAllMocks();
	delete process.env.npm_config_user_agent;
	process.argv[1] = ORIGINAL_ARGV1;
});

function makeTmpDir() {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-pm-test-'));
	return tmpDir;
}

describe('detectPackageManager', () => {
	it('detects yarn from yarn.lock', () => {
		const dir = makeTmpDir();
		fs.writeFileSync(path.join(dir, 'yarn.lock'), '');
		expect(detectPackageManager(dir)).toBe('yarn');
	});

	it('detects pnpm from pnpm-lock.yaml', () => {
		const dir = makeTmpDir();
		fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '');
		expect(detectPackageManager(dir)).toBe('pnpm');
	});

	it('detects npm from package-lock.json', () => {
		const dir = makeTmpDir();
		fs.writeFileSync(path.join(dir, 'package-lock.json'), '{}');
		expect(detectPackageManager(dir)).toBe('npm');
	});

	it('detects bun from bun.lockb', () => {
		const dir = makeTmpDir();
		fs.writeFileSync(path.join(dir, 'bun.lockb'), '');
		expect(detectPackageManager(dir)).toBe('bun');
	});

	it('detects from packageManager field in package.json (no lockfile)', () => {
		const dir = makeTmpDir();
		fs.writeFileSync(
			path.join(dir, 'package.json'),
			JSON.stringify({ packageManager: 'yarn@4.1.0' })
		);
		expect(detectPackageManager(dir)).toBe('yarn');
	});

	it('detects pnpm from packageManager field', () => {
		const dir = makeTmpDir();
		fs.writeFileSync(
			path.join(dir, 'package.json'),
			JSON.stringify({ packageManager: 'pnpm@8.0.0' })
		);
		expect(detectPackageManager(dir)).toBe('pnpm');
	});

	it('ignores unknown packageManager values', () => {
		const dir = makeTmpDir();
		fs.writeFileSync(
			path.join(dir, 'package.json'),
			JSON.stringify({ packageManager: 'unknown@1.0.0' })
		);
		expect(detectPackageManager(dir)).toBe('npx');
	});

	it('lockfile takes priority over packageManager field', () => {
		const dir = makeTmpDir();
		fs.writeFileSync(path.join(dir, 'yarn.lock'), '');
		fs.writeFileSync(
			path.join(dir, 'package.json'),
			JSON.stringify({ packageManager: 'pnpm@8.0.0' })
		);
		expect(detectPackageManager(dir)).toBe('yarn');
	});

	it('detects from npm_config_user_agent env var', () => {
		const dir = makeTmpDir();
		process.env.npm_config_user_agent = 'yarn/1.22.22 node/v20.0.0';
		expect(detectPackageManager(dir)).toBe('yarn');
	});

	it('detects pnpm from npm_config_user_agent env var', () => {
		const dir = makeTmpDir();
		process.env.npm_config_user_agent = 'pnpm/8.15.0 node/v20.0.0';
		expect(detectPackageManager(dir)).toBe('pnpm');
	});

	it('falls back to npx when no signals present', () => {
		const dir = makeTmpDir();
		expect(detectPackageManager(dir)).toBe('npx');
	});

	it('packageManager field takes priority over npm_config_user_agent', () => {
		const dir = makeTmpDir();
		fs.writeFileSync(
			path.join(dir, 'package.json'),
			JSON.stringify({ packageManager: 'bun@1.0.0' })
		);
		process.env.npm_config_user_agent = 'npm/10.0.0 node/v20.0.0';
		expect(detectPackageManager(dir)).toBe('bun');
	});
});

describe('getDlxPrefix', () => {
	it('returns "pnpm dlx" for pnpm projects', () => {
		const dir = makeTmpDir();
		fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '');
		expect(getDlxPrefix(dir)).toBe('pnpm dlx');
	});

	it('returns "yarn dlx" for yarn projects', () => {
		const dir = makeTmpDir();
		fs.writeFileSync(path.join(dir, 'yarn.lock'), '');
		expect(getDlxPrefix(dir)).toBe('yarn dlx');
	});

	it('returns "bunx" for bun projects', () => {
		const dir = makeTmpDir();
		fs.writeFileSync(path.join(dir, 'bun.lockb'), '');
		expect(getDlxPrefix(dir)).toBe('bunx');
	});

	it('falls back to "npx" with no signals', () => {
		const dir = makeTmpDir();
		delete process.env.npm_config_user_agent;
		expect(getDlxPrefix(dir)).toBe('npx');
	});
});

describe('isCliOneOff', () => {
	it('detects an npm npx cache entry', () => {
		process.argv[1] = '/home/u/.npm/_npx/a1b2/node_modules/.bin/astryx-svelte';
		expect(isCliOneOff()).toBe(true);
	});

	it('detects a pnpm dlx cache entry', () => {
		process.argv[1] =
			'/home/u/.cache/pnpm/dlx/9f/node_modules/@astryx-svelte/cli/bin/astryx-svelte.mjs';
		expect(isCliOneOff()).toBe(true);
	});

	it('detects a bunx cache entry', () => {
		process.argv[1] = '/home/u/.bun/install/cache/@astryx-svelte/cli/bin/astryx-svelte.mjs';
		expect(isCliOneOff()).toBe(true);
	});

	it('is false for an installed node_modules entry', () => {
		process.argv[1] = '/proj/node_modules/@astryx-svelte/cli/bin/astryx-svelte.mjs';
		expect(isCliOneOff()).toBe(false);
	});

	it('is false for a source checkout (dev) entry', () => {
		process.argv[1] = '/repo/packages/cli/bin/astryx-svelte.mjs';
		expect(isCliOneOff()).toBe(false);
	});
});

describe('getCliInvocation', () => {
	it('uses the run-prefix + bare bin when installed (not one-off)', () => {
		process.argv[1] = '/proj/node_modules/@astryx-svelte/cli/bin/astryx-svelte.mjs';
		const dir = makeTmpDir();
		fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '');
		expect(getCliInvocation(dir)).toBe('pnpm exec astryx-svelte');
	});

	it('uses the dlx runner + scoped package when run one-off', () => {
		process.argv[1] = '/home/u/.npm/_npx/a1b2/node_modules/.bin/astryx-svelte';
		const dir = makeTmpDir();
		delete process.env.npm_config_user_agent;
		expect(getCliInvocation(dir)).toBe('npx @astryx-svelte/cli');
	});

	it('pairs the dlx runner with the scoped package for pnpm one-off', () => {
		process.argv[1] =
			'/home/u/.cache/pnpm/dlx/9f/node_modules/@astryx-svelte/cli/bin/astryx-svelte.mjs';
		const dir = makeTmpDir();
		fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '');
		expect(getCliInvocation(dir)).toBe('pnpm dlx @astryx-svelte/cli');
	});
});

describe('formatCliCommand', () => {
	it('strips a leading "astryx-svelte" token and prepends the invocation stem', () => {
		process.argv[1] = '/proj/node_modules/@astryx-svelte/cli/bin/astryx-svelte.mjs';
		const dir = makeTmpDir();
		fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '');
		expect(formatCliCommand('astryx-svelte component Button', dir)).toBe(
			'pnpm exec astryx-svelte component Button'
		);
	});

	it('accepts a bare subcommand (no leading astryx-svelte)', () => {
		process.argv[1] = '/proj/node_modules/@astryx-svelte/cli/bin/astryx-svelte.mjs';
		const dir = makeTmpDir();
		fs.writeFileSync(path.join(dir, 'package-lock.json'), '{}');
		expect(formatCliCommand('docs tokens', dir)).toBe('npx astryx-svelte docs tokens');
	});

	it('rewrites to the scoped package for one-off invocations', () => {
		process.argv[1] = '/home/u/.npm/_npx/a1b2/node_modules/.bin/astryx-svelte';
		const dir = makeTmpDir();
		fs.writeFileSync(path.join(dir, 'package-lock.json'), '{}');
		expect(formatCliCommand('astryx-svelte component Button', dir)).toBe(
			'npx @astryx-svelte/cli component Button'
		);
	});
});
