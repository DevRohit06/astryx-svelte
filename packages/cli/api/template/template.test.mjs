/**
 * @file `stripTemplateAssetRefs` + the prefix-agnostic `--skeleton` extractor.
 *
 * ## Ported case count
 *
 * 7, matching upstream `api/template/template.test.mjs` one for one. The six
 * `stripTemplateAssetRefs` cases are verbatim.
 *
 * The seventh is **refixtured, not weakened**. Upstream runs it against the
 * packaged `contact-form` page template; this port ships no template assets
 * (see TODO.md — the 1,329 of them are deferred), so the same template is
 * stood up as an integration contribution instead. Every assertion is
 * upstream's, including the `columns={{minWidth: 200}}` one that is the whole
 * point of the case: a spatial prop must survive into the skeleton verbatim,
 * braces and all. Left pointed at a template that does not exist, the case
 * would have thrown `ERR_UNKNOWN_TEMPLATE` rather than tested anything.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { stripTemplateAssetRefs, template } from './template.mjs';

describe('stripTemplateAssetRefs', () => {
	it('replaces a lookaside astryx image URL with an inline data URI', () => {
		const src =
			"const hero = 'https://lookaside.facebook.com/assets/astryx/colorful-home-horizontal-1.png';";
		const out = stripTemplateAssetRefs(src);
		expect(out).not.toContain('lookaside.facebook.com');
		expect(out).toContain('data:image/svg+xml,');
	});

	it('replaces a lookaside block-avatar image URL', () => {
		const src = 'src="https://lookaside.facebook.com/assets/astryx/avatar-profile-05.jpg"';
		const out = stripTemplateAssetRefs(src);
		expect(out).not.toContain('lookaside.facebook.com');
		expect(out).toContain('data:image/svg+xml,');
	});

	it('replaces every lookaside reference, not just the first', () => {
		const src = [
			"'https://lookaside.facebook.com/assets/astryx/colorful-home-horizontal-1.png'",
			"'https://lookaside.facebook.com/assets/astryx/illustrative-horizontal-3.png'",
			"'https://lookaside.facebook.com/assets/astryx/moody-scene-horizontal-1.png'"
		].join('\n');
		const out = stripTemplateAssetRefs(src);
		expect(out).not.toContain('lookaside.facebook.com');
		expect(out.match(/data:image\/svg\+xml,/g)).toHaveLength(3);
	});

	it('preserves surrounding source structure', () => {
		const src =
			"const data = [{src: 'https://lookaside.facebook.com/assets/astryx/x.png', alt: 'X'}];";
		const out = stripTemplateAssetRefs(src);
		expect(out).toContain("alt: 'X'");
		expect(out).toContain('const data = [{src:');
	});

	it('leaves non-Meta third-party image URLs untouched', () => {
		const src = [
			'src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png"',
			'src="https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat/visa.svg"'
		].join('\n');
		const out = stripTemplateAssetRefs(src);
		expect(out).toBe(src);
	});

	it('leaves unrelated local paths untouched', () => {
		const src = "import x from './local.png'; const y = '/public/logo.svg';";
		const out = stripTemplateAssetRefs(src);
		expect(out).toBe(src);
	});
});

/**
 * The `contact-form` page upstream ships, re-authored as the Svelte markup a
 * template in this port really is: a Card wrapping a responsive Grid of
 * TextInputs. `columns={{minWidth: 200}}` is upstream's own expression.
 */
const CONTACT_FORM_SOURCE = `<script>
	import {Button, Card, Grid, Text, TextInput} from '@astryx-svelte/core';
</script>

<Card padding={6}>
	<Text type="large">Contact us</Text>
	<Grid columns={{minWidth: 200}} gap={4}>
		<TextInput label="Name" />
		<TextInput label="Email" />
	</Grid>
	<Button>Send</Button>
</Card>
`;

describe('template --skeleton component extraction (prefix-agnostic)', () => {
	// Regression guard: templates author bare component names post un-prefix
	// migration (P2380608025). The extractors previously matched only the
	// `XDS`-prefixed form, so `--skeleton` returned an empty components list and
	// an empty skeleton body for bare templates.
	let tmpDir;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-template-skeleton-'));
		fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'consumer' }));
		fs.writeFileSync(
			path.join(tmpDir, 'astryx-svelte.config.mjs'),
			`export default { integrations: ['@acme/widgets'] };\n`
		);
		const pkgDir = path.join(tmpDir, 'node_modules', '@acme', 'widgets');
		fs.mkdirSync(path.join(pkgDir, 'templates'), { recursive: true });
		fs.writeFileSync(
			path.join(pkgDir, 'package.json'),
			JSON.stringify({ name: '@acme/widgets', version: '1.0.0' })
		);
		fs.writeFileSync(
			path.join(pkgDir, 'astryx-svelte.integration.mjs'),
			`export default { templates: './templates' };\n`
		);
		fs.writeFileSync(
			path.join(pkgDir, 'templates', 'contact-form.template.mjs'),
			`export default {type: 'page', name: 'Contact form', description: 'Contact form page'};\n`
		);
		fs.writeFileSync(path.join(pkgDir, 'templates', 'contact-form.svelte'), CONTACT_FORM_SOURCE);
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it('extracts components and a skeleton from a bare-named template', async () => {
		const result = await template('contact-form', { skeleton: true, cwd: tmpDir });

		expect(result.type).toBe('template.skeleton');
		expect(Array.isArray(result.data.components)).toBe(true);
		expect(result.data.components.length).toBeGreaterThan(0);
		// The contact-form template composes a Card + form inputs.
		expect(result.data.components).toContain('Card');
		expect(result.data.components).toContain('TextInput');

		// Skeleton body is non-empty and uses bare component tags (no XDS prefix).
		expect(result.data.skeleton.trim().length).toBeGreaterThan(0);
		expect(result.data.skeleton).toMatch(/<[A-Z]\w+/);
		expect(result.data.skeleton).not.toContain('<XDS');

		expect(result.data.skeleton).toContain('columns={{minWidth: 200}}');
	});
});
