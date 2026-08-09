/**
 * @file `listTemplates` — the minimal core-page set `init` scaffolds from.
 *
 * ## Ported case count
 *
 * 3, matching upstream one for one, verbatim apart from the temp-dir prefix.
 * Two of the three replicate `listTemplates`' logic against a temp directory
 * rather than calling it (it reads `CLI_ROOT`, which is fixed at import time);
 * that is upstream's own shape, comment and all, and it is worth knowing it is
 * a *logic* test, not a behaviour one. The third calls the real export.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// We need to test listTemplates which depends on CLI_ROOT.
// Since CLI_ROOT is computed from import.meta.url in paths.mjs,
// we test listTemplates indirectly by mocking the module.

let tmpDir;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-template-test-'));
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
	vi.restoreAllMocks();
});

describe('listTemplates', () => {
	it('returns sorted template directory names', async () => {
		// Create mock templates directory structure
		const templatesDir = path.join(tmpDir, 'templates');
		fs.mkdirSync(path.join(templatesDir, 'table'), { recursive: true });
		fs.mkdirSync(path.join(templatesDir, 'blank'), { recursive: true });
		fs.mkdirSync(path.join(templatesDir, 'login'), { recursive: true });
		// Add a file (should be filtered out)
		fs.writeFileSync(path.join(templatesDir, 'README.md'), '');

		// listTemplates uses CLI_ROOT which is hardcoded from import.meta.url.
		// Instead, we replicate its logic directly against our tmpDir.
		const entries = fs
			.readdirSync(templatesDir, { withFileTypes: true })
			.filter((e) => e.isDirectory())
			.map((e) => e.name)
			.sort();

		expect(entries).toEqual(['blank', 'login', 'table']);
	});

	it('returns empty array when templates dir is missing', async () => {
		// No templates directory exists under tmpDir
		const templatesDir = path.join(tmpDir, 'templates');
		expect(fs.existsSync(templatesDir)).toBe(false);
		// Replicate listTemplates logic
		const result = fs.existsSync(templatesDir) ? [] : [];
		expect(result).toEqual([]);
	});
});

describe('listTemplates integration', () => {
	it('can import listTemplates from the module', async () => {
		const { listTemplates } = await import('./template.mjs');
		// listTemplates returns based on CLI_ROOT/assets/templates/pages.
		// It should return an array (empty here — this port ships no page
		// template assets yet; see TODO.md).
		const result = listTemplates();
		expect(Array.isArray(result)).toBe(true);
	});
});
