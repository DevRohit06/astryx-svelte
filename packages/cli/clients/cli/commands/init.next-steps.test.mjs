/**
 * @file Regression test for `astryx-svelte init` "Next steps" theme guidance.
 * Ported case-for-case from upstream's
 * `clients/cli/commands/init.next-steps.test.mjs` — 4 cases, 4 here.
 *
 * The property under test is unchanged: **init's theme guidance must match the
 * runtime recommendation core's `<Theme>` prints**, so a user is never steered
 * at a slower or non-existent path. What the recommendation *is* differs.
 *
 * Upstream's `<Theme>` points at a pre-built `/built` subpath; this port's theme
 * packages publish `.`, `./tokens` and `./theme.css` and nothing else, and
 * `theme.svelte`'s own `warnOnce` names the bare import plus `theme.css`. So
 * case 2 asserts that pair, and case 4 — upstream's "don't steer at the runtime
 * injection import" — inverts into "don't name a `/built` subpath that would not
 * resolve". Case 1 asserts one stylesheet where upstream asserts two, because
 * core publishes one (`base.css` contains the reset).
 */

import { describe, it, expect } from 'vitest';
import { getNextSteps } from '../../../api/init/init.mjs';

describe('init Next steps theme guidance', () => {
	const text = getNextSteps('npx astryx-svelte').join('\n');

	it('mentions the base CSS import so the app is not left unstyled', () => {
		expect(text).toContain("'@astryx-svelte/core/base.css'");
	});

	it('uses the theme path matching the runtime recommendation', () => {
		expect(text).toContain("'@astryx-svelte/theme-neutral'");
		expect(text).toContain("'@astryx-svelte/theme-neutral/theme.css'");
	});

	it('mentions building custom themes via `astryx-svelte theme build`', () => {
		expect(text).toContain('astryx-svelte theme build <file>');
	});

	it('does not steer users to a /built subpath the theme packages do not publish', () => {
		expect(text).not.toContain("'@astryx-svelte/theme-neutral/built'");
	});
});
