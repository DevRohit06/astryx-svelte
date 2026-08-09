/**
 * @file Regression coverage for integration-template discovery error surfacing.
 *
 * discoverIntegrationTemplates() used to wrap Project.load() in a bare
 * `catch {}` that silently dropped a broken astryx-svelte.config — hiding both
 * the user's config error AND any unexpected bug. It now records the failure in
 * the TemplateDiscoveryError channel that discoverAllWithErrors() exposes. The
 * no-error variant (discoverAll, used by `astryx-svelte template`) still ignores
 * it, so the command's behavior is unchanged; these tests lock the surfacing.
 *
 * ## Ported case count
 *
 * 2, matching upstream one for one. The only edits are the renamed config
 * basename and the `package` label that carries it.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { discoverAllWithErrors } from './template.mjs';

let tmpDir;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-tmpl-errors-'));
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('discoverAllWithErrors — config-load failures are surfaced, not swallowed', () => {
	it('records an astryx-svelte.config error when the config cannot load', async () => {
		// Two configs → findConfigPath throws "Multiple Astryx config files",
		// which Project.load propagates. Previously swallowed by a bare catch {};
		// now it must appear in the errors channel.
		fs.writeFileSync(
			path.join(tmpDir, 'astryx-svelte.config.mjs'),
			'export default {integrations: []};\n'
		);
		fs.writeFileSync(
			path.join(tmpDir, 'astryx-svelte.config.js'),
			'module.exports = {integrations: []};\n'
		);

		const { errors } = await discoverAllWithErrors(tmpDir);
		const configErr = errors.find((e) => e.package === 'astryx-svelte.config');
		expect(configErr).toBeDefined();
		expect(configErr.message).toMatch(/Multiple Astryx config files/i);
	});

	it('records no config error for a clean project with no config', async () => {
		// Baseline: no config → Project.load returns an empty project, so nothing
		// is recorded against astryx-svelte.config (the common case must stay quiet).
		const { errors } = await discoverAllWithErrors(tmpDir);
		expect(errors.find((e) => e.package === 'astryx-svelte.config')).toBeUndefined();
	});
});
