/**
 * @file `stripTemplateAssetRefs` + the prefix-agnostic `--skeleton` extractor.
 *
 * ## Ported case count
 *
 * 7, matching upstream `api/template/template.test.mjs` one for one. The six
 * `stripTemplateAssetRefs` cases are verbatim.
 *
 * The seventh used to be **refixtured**: upstream runs it against the packaged
 * `contact-form` page template, and this port shipped no template assets, so
 * the template was stood up as an integration contribution instead. It ships
 * them now — `assets/templates/pages/contact-form/` is transcribed — so the
 * case resolves the packaged template exactly as upstream's does, and the
 * fixture is gone along with the `fs`/`path` plumbing it needed.
 *
 * Removing it was not optional. Discovery found the fixture's `contact-form`
 * *and* core's, and the case failed with `ERR_AMBIGUOUS_TEMPLATE`.
 *
 * One assertion changes value, not meaning: upstream reads
 * `columns={{minWidth: 200}}` out of the skeleton, and the transcribed template
 * carries this repo's prettier spacing inside the object literal. What the case
 * tests — that a spatial prop survives extraction verbatim, braces and all — is
 * unchanged.
 */

import { describe, expect, it } from 'vitest';
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

describe('template --skeleton component extraction (prefix-agnostic)', () => {
	// Regression guard: templates author bare component names post un-prefix
	// migration (P2380608025). The extractors previously matched only the
	// `XDS`-prefixed form, so `--skeleton` returned an empty components list and
	// an empty skeleton body for bare templates.
	it('extracts components and a skeleton from a bare-named template', async () => {
		const result = await template('contact-form', { skeleton: true });

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

		// Upstream asserts `columns={{minWidth: 200}}`; the transcribed template
		// carries the repo's prettier spacing inside the object literal. The
		// assertion is the same one — a spatial prop survives into the skeleton
		// verbatim, braces and all — read off this port's own formatting.
		expect(result.data.skeleton).toContain('columns={{ minWidth: 200 }}');
	});
});
