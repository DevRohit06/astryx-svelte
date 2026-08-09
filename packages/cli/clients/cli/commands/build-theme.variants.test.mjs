/**
 * @file Regression test for the custom-variant type augmentations emitted by
 * `astryx-svelte theme build` (upstream #3391 companion: #3371).
 *
 * When a theme declares a custom component prop value (e.g.
 * `button['variant:accentOutline']`), the build emits a `<name>.variants.d.ts`
 * with a module augmentation so the custom value type-checks. This suite pins
 * the two bugs that made that augmentation dead code upstream:
 *
 *   1. The augmentation targeted a non-existent, `XDS`-prefixed interface
 *      (`XDSButtonVariantMap`) instead of core's real `ButtonVariantMap`, so it
 *      created a new unused interface and never widened the prop union.
 *   2. Props with no augmentation point (closed literal-union types such as
 *      Button `size` or Heading `type`/`level`) still got a `declare module`
 *      block against a `*Map` interface that doesn't exist.
 *   3. The generated `.variants.d.ts` was never referenced by the main
 *      `<name>.d.ts`, so even a correct augmentation never loaded.
 *   4. The augmentation targeted the public component subpath while the prop
 *      type read a map from the implementation module, so TypeScript merged the
 *      public interface but the component still saw the original closed union.
 *
 * **Case 4 is where this port had to answer the question differently.**
 * Upstream augments 15 per-component subpaths (`@astryxdesign/core/Button`);
 * this port publishes one entry, so every augmentation targets
 * `@astryx-svelte/core`. That is not a weaker claim — the probe below is the
 * same probe, and it is the thing that proved TypeScript merges an
 * augmentation of a *re-exported* interface into its original declaration
 * (upstream's own comment suggests it would not). Its React JSX is rewritten as
 * typed prop objects, because a Svelte component is not callable from a `.ts`
 * probe; the assignment is what type-checks either way.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { ensureCoreBuilt } from '../../../test-utils/ensure-core-built.mjs';
import { runCli } from '../../../test-utils/run-cli.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = path.resolve(HERE, '../../..');

function writeTheme(dir, contents) {
	fs.mkdirSync(dir, { recursive: true });
	const file = path.join(dir, 'variants-theme.mjs');
	fs.writeFileSync(file, contents);
	return file;
}

// Build core through the shared lock helper — running an unguarded
// `if (!exists) pnpm -F core build` per suite lets Vitest schedule concurrent
// builds that collide on packages/core/dist (core's build starts by clearing
// it), nondeterministically breaking whichever suite is mid-read.
beforeAll(() => {
	ensureCoreBuilt();
}, 200_000);

let tmpDir;
beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-build-theme-variants-'));
});
afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('theme build custom-variant augmentations', () => {
	it('targets the real (un-prefixed) core interface for a custom variant', async () => {
		const themeFile = writeTheme(
			tmpDir,
			`export default {
        name: 'variants-theme',
        tokens: { '--color-bg': '#fff' },
        components: {
          button: { 'variant:accentOutline': { backgroundColor: 'transparent' } },
        },
      };\n`
		);

		const result = await runCli(['theme', 'build', path.relative(tmpDir, themeFile)], tmpDir);
		expect(result.code).toBe(0);

		const variantsPath = path.join(tmpDir, 'variants-theme.variants.d.ts');
		expect(fs.existsSync(variantsPath)).toBe(true);
		const dts = fs.readFileSync(variantsPath, 'utf-8');

		// Targets core's actual augmentation point…
		expect(dts).toContain("declare module '@astryx-svelte/core'");
		expect(dts).toMatch(/interface ButtonVariantMap\b/);
		expect(dts).toContain("'accentOutline': true;");
		// …and NOT the old, non-existent XDS-prefixed interface.
		expect(dts).not.toMatch(/XDSButtonVariantMap/);
	});

	it('skips props with no augmentation point (Button size, Heading type)', async () => {
		const themeFile = writeTheme(
			tmpDir,
			`export default {
        name: 'variants-theme',
        tokens: { '--color-bg': '#fff' },
        components: {
          button: {
            'variant:accentOutline': { backgroundColor: 'transparent' },
            'size:jumbo': { paddingBlock: '40px' },
          },
          heading: { 'type:hero': { fontSize: '80px' } },
        },
      };\n`
		);

		const result = await runCli(['theme', 'build', path.relative(tmpDir, themeFile)], tmpDir);
		expect(result.code).toBe(0);

		const variantsPath = path.join(tmpDir, 'variants-theme.variants.d.ts');
		expect(fs.existsSync(variantsPath)).toBe(true);
		const dts = fs.readFileSync(variantsPath, 'utf-8');

		// The augmentable variant is emitted…
		expect(dts).toMatch(/interface ButtonVariantMap\b/);
		// …but closed literal-union props get no dead augmentation.
		expect(dts).not.toMatch(/ButtonSizeMap/);
		expect(dts).not.toMatch(/HeadingTypeMap/);
		// Upstream also asserts no `declare module '@astryxdesign/core/Heading'`
		// block. There is one module to augment here, so the equivalent claim is
		// that only one block was emitted at all.
		expect(dts.match(/declare module /g)).toHaveLength(1);
	});

	it('does not emit a .variants.d.ts when every custom value is non-augmentable', async () => {
		const themeFile = writeTheme(
			tmpDir,
			`export default {
        name: 'variants-theme',
        tokens: { '--color-bg': '#fff' },
        components: {
          button: { 'size:jumbo': { paddingBlock: '40px' } },
        },
      };\n`
		);

		const result = await runCli(['theme', 'build', path.relative(tmpDir, themeFile)], tmpDir);
		expect(result.code).toBe(0);
		expect(fs.existsSync(path.join(tmpDir, 'variants-theme.variants.d.ts'))).toBe(false);
	});

	it('makes generated custom component prop values type-check through the public entry', async () => {
		const themeFile = writeTheme(
			tmpDir,
			`export default {
        name: 'variants-theme',
        tokens: { '--color-bg': '#fff' },
        components: {
          'app-shell': { 'variant:customAppShell': { backgroundColor: 'transparent' } },
          'avatar-status-dot': { 'variant:customAvatarDot': { backgroundColor: 'transparent' } },
          badge: { 'variant:customBadge': { backgroundColor: 'transparent' } },
          banner: {
            'status:customBannerStatus': { backgroundColor: 'transparent' },
            'container:customBannerContainer': { padding: '1px' },
          },
          breadcrumbs: { 'variant:customBreadcrumbs': { color: 'currentColor' } },
          button: { 'variant:customButton': { backgroundColor: 'transparent' } },
          dialog: { 'variant:customDialog': { backgroundColor: 'transparent' } },
          divider: { 'variant:customDivider': { borderColor: 'currentColor' } },
          'field-status': { 'variant:customFieldStatus': { color: 'currentColor' } },
          pagination: { 'variant:customPagination': { color: 'currentColor' } },
          progressbar: { 'variant:customProgressBar': { backgroundColor: 'transparent' } },
          section: { 'variant:customSection': { backgroundColor: 'transparent' } },
          statusdot: { 'variant:customStatusDot': { backgroundColor: 'transparent' } },
          text: { 'color:customTextColor': { color: 'currentColor' } },
          token: { 'color:customTokenColor': { backgroundColor: 'transparent' } },
        },
      };
`
		);

		const result = await runCli(['theme', 'build', path.relative(tmpDir, themeFile)], tmpDir);
		expect(result.code).toBe(0);

		// Transient fixture dirs are named `.astryx-*` so .gitignore and the
		// eslint ignore glob both cover them.
		const projectDir = path.join(CLI_ROOT, `.astryx-variant-consumer-${process.pid}`);
		fs.rmSync(projectDir, { recursive: true, force: true });
		fs.mkdirSync(projectDir);
		fs.copyFileSync(
			path.join(tmpDir, 'variants-theme.d.ts'),
			path.join(projectDir, 'variants-theme.d.ts')
		);
		fs.copyFileSync(
			path.join(tmpDir, 'variants-theme.variants.d.ts'),
			path.join(projectDir, 'variants-theme.variants.d.ts')
		);
		fs.writeFileSync(
			path.join(projectDir, 'probe.ts'),
			`import './variants-theme';\n` +
				`import type {\n` +
				`  AppShellProps, AvatarStatusDotProps, BadgeProps, BannerProps, BreadcrumbsProps,\n` +
				`  ButtonProps, DialogProps, DividerProps, FieldStatusProps, PaginationProps,\n` +
				`  ProgressBarProps, SectionProps, StatusDotProps, TextProps, TokenProps,\n` +
				`} from '@astryx-svelte/core';\n\n` +
				`export const probe = {\n` +
				`  appShell: { variant: 'customAppShell' } satisfies Pick<AppShellProps, 'variant'>,\n` +
				`  avatarStatusDot: { variant: 'customAvatarDot' } satisfies Pick<AvatarStatusDotProps, 'variant'>,\n` +
				`  badge: { variant: 'customBadge' } satisfies Pick<BadgeProps, 'variant'>,\n` +
				`  bannerStatus: { status: 'customBannerStatus' } satisfies Pick<BannerProps, 'status'>,\n` +
				`  bannerContainer: { container: 'customBannerContainer' } satisfies Pick<BannerProps, 'container'>,\n` +
				`  breadcrumbs: { variant: 'customBreadcrumbs' } satisfies Pick<BreadcrumbsProps, 'variant'>,\n` +
				`  button: { variant: 'customButton' } satisfies Pick<ButtonProps, 'variant'>,\n` +
				`  dialog: { variant: 'customDialog' } satisfies Pick<DialogProps, 'variant'>,\n` +
				`  divider: { variant: 'customDivider' } satisfies Pick<DividerProps, 'variant'>,\n` +
				`  fieldStatus: { variant: 'customFieldStatus' } satisfies Pick<FieldStatusProps, 'variant'>,\n` +
				`  pagination: { variant: 'customPagination' } satisfies Pick<PaginationProps, 'variant'>,\n` +
				`  progressBar: { variant: 'customProgressBar' } satisfies Pick<ProgressBarProps, 'variant'>,\n` +
				`  section: { variant: 'customSection' } satisfies Pick<SectionProps, 'variant'>,\n` +
				`  statusDot: { variant: 'customStatusDot' } satisfies Pick<StatusDotProps, 'variant'>,\n` +
				`  text: { color: 'customTextColor' } satisfies Pick<TextProps, 'color'>,\n` +
				`  token: { color: 'customTokenColor' } satisfies Pick<TokenProps, 'color'>,\n` +
				`};\n`
		);
		fs.writeFileSync(
			path.join(projectDir, 'tsconfig.json'),
			JSON.stringify(
				{
					compilerOptions: {
						module: 'esnext',
						target: 'es2022',
						moduleResolution: 'bundler',
						strict: true,
						skipLibCheck: true,
						noEmit: true
					},
					include: ['*.ts', '*.d.ts']
				},
				null,
				2
			)
		);

		// Invoke tsc's entry through `node` rather than `pnpm exec tsc`: on Windows
		// `pnpm` is a `.cmd` shim Node refuses to spawn without a shell.
		const tsc = createRequire(path.join(CLI_ROOT, 'package.json')).resolve('typescript/lib/tsc.js');
		try {
			execFileSync(process.execPath, [tsc, '--project', 'tsconfig.json'], {
				cwd: projectDir,
				stdio: 'pipe'
			});
		} finally {
			fs.rmSync(projectDir, { recursive: true, force: true });
		}
	}, 120_000);

	it('references the variants file from the main .d.ts so the augmentation loads', async () => {
		const themeFile = writeTheme(
			tmpDir,
			`export default {
        name: 'variants-theme',
        tokens: { '--color-bg': '#fff' },
        components: {
          button: { 'variant:accentOutline': { backgroundColor: 'transparent' } },
        },
      };\n`
		);

		const result = await runCli(['theme', 'build', path.relative(tmpDir, themeFile)], tmpDir);
		expect(result.code).toBe(0);

		const dts = fs.readFileSync(path.join(tmpDir, 'variants-theme.d.ts'), 'utf-8');
		// A triple-slash reference to the variants file, so importing the theme's
		// types also loads the module augmentation.
		expect(dts).toMatch(/\/\/\/\s*<reference path="\.\/variants-theme\.variants\.d\.ts"\s*\/>/);
	});
});
