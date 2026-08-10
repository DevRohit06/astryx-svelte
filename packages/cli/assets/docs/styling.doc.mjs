/**
 * @file How to style components.
 *
 * The prose survives; almost every code block is re-authored, and three
 * sections change what they *claim*, not just how they spell it:
 *
 *   - `className` is `class` here, and Svelte's `class` prop is a plain
 *     attribute — so the section is renamed and its examples are markup.
 *   - "Rest Props" loses `ref` (Svelte 5 has attachments, not refs) and gains
 *     the real reason `children` is absent from the base props type: children
 *     are snippets, declared per component.
 *   - The Tailwind sections describe THIS port's stylesheet set. There is no
 *     `@astryxdesign/core/tailwind-theme.css` counterpart — core publishes
 *     `./base.css` and nothing else — so the bridge is described as something
 *     you write against the token custom properties, which is what upstream's
 *     bridge does internally, rather than a file that does not exist.
 *   - The StyleX build-setup section is inverted: upstream's sharp edge is
 *     Next.js + Babel vs SWC; ours is that StyleX cannot be imported from a
 *     `.svelte` file at all, which is a compile-time hazard with the same
 *     "renders unstyled, no error" symptom.
 */

/** @type {import('@astryx-svelte/cli/authoring').ReferenceDoc} */
export const docs = {
	name: 'styling',
	title: 'Styling Components',
	category: 'guide',
	description:
		'How to customize component appearance: xstyle prop, Tailwind, StyleX, class, rest props, compound component patterns, theming utils, and styling-library interop.',

	sections: [
		{
			title: 'Overview',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'There are several ways to style things. Here is when to use each:'
				},
				{
					type: 'table',
					headers: ['Approach', 'Use for', 'Example'],
					rows: [
						[
							'StyleX',
							'Component-specific overrides, reusable styles, pseudo-classes, and typed tokens',
							'const styles = stylex.create(...); <Button xstyle={styles.save} />'
						],
						[
							'Tailwind utilities',
							'Layout, wrappers, and utility styling',
							'class="flex gap-3 p-4"'
						],
						[
							'class',
							'Integrating with external CSS, a scoped <style> block, or Tailwind on components',
							'class="my-card shadow-lg"'
						],
						[
							'Styling-library token aliases',
							'Keeping Panda, Chakra, Emotion, UnoCSS, CSS Modules, or Sass in sync with the system',
							"colors.surface = 'var(--color-background-surface)'"
						]
					]
				},
				{
					type: 'prose',
					text: 'All approaches resolve to the same design tokens, so theming and dark mode work regardless of which you choose. For external styling libraries, run `astryx-svelte docs styling-libraries`; it covers Tailwind, StyleX, Panda, Chakra, CSS-in-JS, CSS Modules, Sass, and `useTheme()` for non-CSS processing.'
				}
			]
		},
		{
			title: 'xstyle Prop',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Every component accepts an xstyle prop for style customization. It accepts StyleX styles created via stylex.create(), not inline objects or class name strings. StyleX styles are compiled at build time for optimal deduplication and dead-code elimination.'
				},
				{
					type: 'prose',
					text: 'StyleX may only be imported from a `.ts` module, never from a `.svelte` file: the bundler plugin Babel-parses any module that imports `@stylexjs/stylex`, and it would read Svelte markup as JSX. Author the styles in a sibling `.stylex.ts` and import the object into the component.'
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'card.stylex.ts',
					code: `import * as stylex from '@stylexjs/stylex';

export const overrides = stylex.create({
	card: { maxWidth: 400, marginBlock: 16 },
	saveButton: { alignSelf: 'flex-end' }
});`
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Simple overrides',
					code: `<script lang="ts">
	import { Button, Card } from '@astryx-svelte/core';
	import { overrides } from './card.stylex.js';
</script>

<Card xstyle={overrides.card} />
<Button label="Save" xstyle={overrides.saveButton} />`
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'Pseudo-classes and conditional styles',
					code: `import * as stylex from '@stylexjs/stylex';

export const overrides = stylex.create({
	card: {
		boxShadow: {
			default: 'none',
			':hover': { '@media (hover: hover)': '0 4px 12px rgba(0,0,0,0.1)' }
		}
	}
});`
				},
				{
					type: 'list',
					style: 'unordered',
					items: [
						'All xstyle values must come from stylex.create()',
						'Pseudo-classes (:hover, :focus-visible) are supported inside stylex.create',
						'All :hover styles MUST use @media (hover: hover) guard',
						'For non-StyleX styling (Tailwind, external CSS, a scoped <style> block), use class instead'
					]
				}
			]
		},
		{
			title: 'Tailwind Integration',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: "Tailwind v4 reads its theme from CSS custom properties, and so does every Astryx component — so the two meet at the token layer with no plugin. Map Tailwind's theme variables to the system tokens once with `@theme inline`, and utility classes become token-backed: colors, spacing, radius, shadows, and typography all resolve to the active theme."
				},
				{
					type: 'code',
					lang: 'css',
					label: 'app.css: declare the layer order, then bridge the tokens',
					code: `@layer reset, theme, base, astryx-base, astryx-theme, product, utilities;

@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/preflight.css' layer(base);
@import '@astryx-svelte/core/base.css';
@import '@astryx-svelte/theme-neutral/theme.css';
@import 'tailwindcss/utilities.css' layer(utilities);

@theme inline {
	--color-surface: var(--color-background-surface);
	--color-primary: var(--color-text-primary);
	--color-border: var(--color-border);
	--radius-lg: var(--radius-container);
	--spacing: var(--spacing-1);
}`
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Tailwind utilities alongside components',
					code: `<div class="text-primary bg-surface rounded-lg p-4 flex gap-3">
	<Button label="Save" variant="primary" />
	<Button label="Cancel" variant="secondary" />
</div>`
				},
				{
					type: 'prose',
					text: 'The bridge is pure CSS with zero JS. Theme changes (dark mode, custom themes) apply automatically because the utilities reference the same CSS custom properties that components use. For other styling libraries that follow the same aliasing pattern, run `astryx-svelte docs styling-libraries`.'
				}
			]
		},
		{
			title: 'class and style Props',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: "Every component also accepts standard class and style props. class is appended after the component's own classes. style is merged after StyleX inline styles, so consumer values win on conflict."
				},
				{
					type: 'prose',
					text: 'A caveat specific to Svelte: styles in a `<style>` block are scoped to the component that declares them, and a class you pass down does not carry that scope. Use `:global(.my-card)` in the parent, or pass the styling through `xstyle` instead.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'class with Tailwind utilities',
					code: `<Card class="shadow-lg hover:shadow-xl transition-shadow">...</Card>
<Button label="Save" class="my-app-save-btn" />`
				},
				{
					type: 'prose',
					text: "For layout and wrapper styling, Tailwind utilities on class work well. For component-specific overrides (padding, colors, borders), prefer xstyle; it integrates with StyleX deduplication and the component's internal style pipeline."
				}
			]
		},
		{
			title: 'Rest Props (Prop Drilling)',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Components extend HTML attributes and spread rest props onto their root DOM element. This means data-* attributes, aria-* attributes, event handlers, and other HTML props pass through automatically.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Data attributes, event handlers, and ARIA',
					code: `<Card
	data-testid="user-card"
	data-user-id={user.id}
	onmouseenter={handleHover}
	aria-label="User profile card"
>
	...
</Card>`
				},
				{
					type: 'prose',
					text: 'Element access is an attachment, not a ref. Components that expose their root element take an `attach…` prop typed `Attachment<HTMLElement>`; spread it onto the component and it runs when the element mounts. There is no `ref` prop and no `bind:this` on an Astryx component.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Reaching the root element',
					code: `<script lang="ts">
	import { Card } from '@astryx-svelte/core';
	import type { Attachment } from 'svelte/attachments';

	const measure: Attachment<HTMLElement> = (node) => {
		console.log(node.getBoundingClientRect());
	};
</script>

<Card {@attach measure}>...</Card>`
				},
				{
					type: 'prose',
					text: "A few HTML attributes are intentionally omitted from the base type (contenteditable, title). `children` is not in the base type either; components that accept children declare it explicitly as a `Snippet`, so slot-based components don't silently drop content."
				}
			]
		},
		{
			title: 'Compound Components',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Complex components are composed from smaller components. Each sub-component accepts its own xstyle, class, and rest props. You style the parts individually; there\'s no single "drill into sub-part" prop.'
				},
				{
					type: 'prose',
					text: 'Where upstream passes a sub-tree as a prop (`header={<LayoutHeader/>}`), the same slot is a snippet here: declare it inside the component with `{#snippet header()}`.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Dialog with individually styled parts',
					code: `<script lang="ts">
	import {
		Button,
		Dialog,
		Heading,
		Layout,
		LayoutContent,
		LayoutFooter,
		LayoutHeader,
		TextInput
	} from '@astryx-svelte/core';
	import { overrides } from './dialog.stylex.js';

	let name = $state('');
</script>

<Dialog {isOpen} onClose={close} xstyle={overrides.dialog}>
	<Layout>
		{#snippet header()}
			<LayoutHeader hasDivider>
				<Heading level={2}>Edit Profile</Heading>
			</LayoutHeader>
		{/snippet}

		{#snippet content()}
			<LayoutContent xstyle={overrides.content}>
				<TextInput label="Name" bind:value={name} />
			</LayoutContent>
		{/snippet}

		{#snippet footer()}
			<LayoutFooter hasDivider>
				<Button label="Cancel" variant="secondary" onclick={close} />
				<Button label="Save" variant="primary" onclick={save} />
			</LayoutFooter>
		{/snippet}
	</Layout>
</Dialog>`
				},
				{
					type: 'prose',
					text: 'The pattern: the parent component (Dialog) controls structure and behavior, child components (Layout, Header, Button) control their own appearance. Style each piece where it lives.'
				}
			]
		},
		{
			title: 'Preferred Selector Surface: Data Attributes',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'When external CSS needs to target an Astryx component by prop or state, combine the stable component class with reflected data attributes. The component class identifies the component (`.astryx-button`, `.astryx-card`); data attributes identify the axis and value (`data-variant`, `data-size`, `data-level`, etc.). This is the preferred selector surface for new CSS because it is explicit and collision-resistant.'
				},
				{
					type: 'code',
					lang: 'css',
					code: `.my-app .astryx-button[data-variant="primary"] {
  /* primary buttons in this app context */
}

.my-app .astryx-button[data-variant="primary"][data-size="sm"] {
  /* small primary buttons */
}

.my-app .astryx-heading[data-level="2"] {
  /* level 2 headings; numeric values stay literal in data attrs */
}`
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'What components reflect',
					code: `<!-- <Button variant="primary" size="sm" />
     preferred selector attrs: data-variant="primary" data-size="sm" -->

<!-- <Card variant="elevated" />
     preferred selector attrs: data-variant="elevated" -->

<!-- <Heading level={2} />
     preferred selector attrs: data-level="2" -->`
				},
				{
					type: 'prose',
					text: "A selector written in a component's own `<style>` block is scoped and will not match these classes unless you wrap it in `:global(...)`. Put app-wide component CSS in a global stylesheet."
				},
				{
					type: 'prose',
					text: 'For systematic theming, use defineTheme component overrides instead of raw CSS selectors. defineTheme keeps the higher-level `prop:value` API (`variant:primary`, `size:sm`) and handles selector generation for you. Run `astryx-svelte docs theme` for the full theming guide.'
				}
			]
		},
		{
			title: 'Deprecated: Bare Prop and State Classes',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Astryx still emits legacy bare prop/state classes such as `.primary`, `.sm`, `.level-2`, and `.checked` for compatibility with existing apps and built themes. Do not write new CSS against these bare classes. The stable base component classes (`.astryx-button`, `.astryx-card`, etc.) are not deprecated; only the unprefixed prop/state classes are the legacy surface.'
				},
				{
					type: 'code',
					lang: 'css',
					code: `/* Deprecated compatibility selector — avoid in new CSS */
.my-app .astryx-button.primary {
  /* use .astryx-button[data-variant="primary"] instead */
}

/* Deprecated compatibility selector — avoid in new CSS */
.my-app .astryx-heading.level-2 {
  /* use .astryx-heading[data-level="2"] instead */
}`
				}
			]
		},
		{
			title: 'Design Tokens',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'When writing custom styles, use design tokens instead of hardcoded values. Tokens are CSS custom properties that adapt to the active theme and color mode. The system provides tokens for spacing, color, radius, shadow, typography, and size.'
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'Using tokens in stylex.create',
					code: `import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
	surface: {
		padding: 'var(--spacing-4)',
		borderRadius: 'var(--radius-container)',
		backgroundColor: 'var(--color-background-surface)'
	}
});`
				},
				{
					type: 'prose',
					text: 'The token *names* are the public surface; the `defineVars` objects that mint them are internal to `@astryx-svelte/core` and are not published from any subpath, so a `var(--token)` string is how you reference one. Outside StyleX, `tokenVar()` and `tokenVars` from `@astryx-svelte/core/theme` return the same references as values for a styling-library config.'
				},
				{
					type: 'prose',
					text: 'See `astryx-svelte docs tokens` for the full token reference (all spacing, color, radius, shadow, and typography tokens with values). See `astryx-svelte docs theme` for how to override tokens via defineTheme.'
				}
			]
		},
		{
			title: 'StyleX Build Setup (required for swizzled components)',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Astryx components ship pre-compiled, so consuming the published package needs no StyleX setup. But `astryx-svelte swizzle <Component>` copies the raw StyleX *source* into your app, and StyleX source requires a build-time StyleX compiler to produce atomic CSS. Without one the component compiles but renders completely unstyled: no error, no warning. If a swizzled component looks unstyled, a missing StyleX compiler is almost always why. The same applies if you author your own StyleX with `stylex.create()`.'
				},
				{
					type: 'table',
					headers: ['Bundler', 'StyleX plugin'],
					rows: [
						['Vite / SvelteKit', '@stylexjs/unplugin (the paved path here)'],
						['Rollup', '@stylexjs/rollup-plugin'],
						['Webpack', '@stylexjs/webpack-plugin'],
						['Babel (any bundler)', '@stylexjs/babel-plugin + @stylexjs/postcss-plugin']
					]
				},
				{
					type: 'prose',
					text: 'The sharp edge here is not the bundler, it is the file extension. **StyleX may not be imported from a `.svelte` file.** The plugin Babel-parses every module that imports `@stylexjs/stylex`, and a Svelte component body is not JSX — so the build either fails with a parse error inside your markup or, worse, the module is routed around the plugin and the page renders unstyled with no error at all. Keep every `stylex.create` call in a `.ts` (conventionally `<name>.stylex.ts`) and import the resulting object.'
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'vite.config.ts',
					code: `import { astryx } from '@astryx-svelte/core/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// The preset is the StyleX plugin plus the two settings Vite would otherwise
// use to route the package around it: the published .stylex.js is UNCOMPILED,
// so the dev pre-bundler and the SSR externaliser both have to be told to
// leave it on the transform path. Hand-rolling the three is still supported;
// \`astryx-svelte doctor\` reports whichever piece a config is missing.
export default defineConfig({
	plugins: [astryx(), sveltekit()]
});`
				},
				{
					type: 'list',
					style: 'unordered',
					items: [
						'Symptom of a missing compiler: a swizzled component renders with no styles, but no build or runtime error.',
						'Symptom of a missing optimizeDeps/ssr entry: the same silence, but only for styles that come from the package rather than from your own source. Missing only ssr.noExternal is the nastiest shape — dev looks right and the production build ships unstyled.',
						'Run `astryx-svelte doctor` when styles go missing: it reads vite.config.* and names the piece that is absent.',
						'Never import @stylexjs/stylex from a .svelte file. Author styles in a .stylex.ts sibling.',
						'Pure theming (defineTheme + astryx-svelte theme build) needs NO StyleX compiler; only swizzled/authored StyleX source does.'
					]
				}
			]
		},
		{
			title: 'What NOT to Do',
			category: 'guide',
			content: [
				{
					type: 'list',
					style: 'dont',
					items: [
						'style="…" on raw <div> wrappers. Use xstyle on the component directly.',
						'Hardcoded colors (#fff, rgb(...)). Use var(--color-*) tokens or Tailwind semantic classes (text-primary, bg-surface).',
						'Hardcoded spacing (16px, 1rem). Use var(--spacing-*) tokens or Tailwind spacing utilities (p-4, gap-3).',
						'Wrapping a component in a <div> just to add margin. Use xstyle with stylex.create on the component.',
						"Using !important. If styles aren't applying, check specificity and cascade layers; xstyle is merged last.",
						'Expecting a scoped <style> rule to reach inside a component. Svelte scopes it to the file that declares it; use :global(...) or xstyle.'
					]
				}
			]
		}
	]
};
