/**
 * @file Incremental migration guide.
 *
 * The one section that changes shape is "Map shadcn and Radix Primitives":
 * upstream names React libraries, and a Svelte app arriving here comes from
 * `shadcn-svelte`, `bits-ui`, `melt-ui` or Skeleton instead. The *primitive*
 * column is what the table is really keyed on, so those rows survive; the
 * section title and prose name the Svelte ecosystem the reader is in.
 *
 * Everything else is CSS-layer advice, which is identical, plus the stylesheet
 * names and the Svelte spelling of the two code samples. The Tailwind v3
 * snippet is kept: a Svelte app on Tailwind v3 has exactly the same problem.
 */

/** @type {import('@astryx-svelte/cli/authoring').ReferenceDoc} */
export const docs = {
	name: 'migration',
	title: 'Migration Guide',
	category: 'guide',
	description:
		'How to migrate an existing Tailwind, shadcn-svelte, or Bits UI application to the design system incrementally.',

	sections: [
		{
			title: 'Overview',
			content: [
				{
					type: 'prose',
					text: 'Treat migration as a product-shell and workflow migration, not a global class replacement. Start by putting the app inside Theme and AppShell, then move one route or surface at a time to design system primitives while keeping existing data, routing, and business logic intact.'
				},
				{
					type: 'prose',
					text: 'Tailwind can coexist during migration. Use it for legacy wrappers and local layout while replacing interactive controls, navigation, command surfaces, forms, alerts, dialogs, and settings UI with components.'
				}
			]
		},
		{
			title: 'Recommended Order',
			content: [
				{
					type: 'list',
					style: 'ordered',
					items: [
						'Install the design system and run init so the project has package scripts, theme CSS, and agent docs.',
						'Wrap the app root with Theme and choose the initial light, dark, or system mode behavior.',
						'Make Tailwind and design system CSS layer order explicit before replacing components.',
						'Render the foundation smoke test page and confirm primitives keep their padding before migrating any surface.',
						'Move the persistent frame first: AppShell, TopNav, SideNav, page content, and mobile navigation.',
						'Replace shared primitives: Button, IconButton, TextInput, NumberInput, Switch, CheckboxInput, RadioList, Selector, Tabs, Dialog, AlertDialog, Banner, Toast, Badge, Card, Table, and ListItem.',
						'Replace global workflows: command palette, settings popover, theme toggle, search, filters, create flows, and destructive confirmation dialogs.',
						'Remove legacy Tailwind classes from each completed surface, keeping only token-backed layout utilities or local wrappers that still need to be migrated.',
						'Verify both light and dark modes, keyboard navigation, responsive layout, and empty/error/loading states before moving to the next route.'
					]
				}
			]
		},
		{
			title: 'CLI Workflow',
			content: [
				{
					type: 'prose',
					text: 'Use the CLI as the migration checklist. Read the docs for the pattern you are about to touch, inspect a matching template skeleton, then read the exact component docs before editing.'
				},
				{
					type: 'code',
					lang: 'bash',
					label: 'Migration-oriented CLI pass',
					code: `astryx-svelte docs migration
astryx-svelte docs theme
astryx-svelte docs styling
astryx-svelte template --list --type block
astryx-svelte template AppShellTopNavWithSideNav --skeleton
astryx-svelte template PopoverSettingsPanel --skeleton
astryx-svelte component AppShell
astryx-svelte component SideNav
astryx-svelte component TopNav
astryx-svelte component CommandPalette
astryx-svelte component Button
astryx-svelte component TextInput`
				},
				{
					type: 'prose',
					text: 'Use --dense when pasting output into an AI coding tool, and use --json when building automated migration reports.'
				},
				{
					type: 'code',
					lang: 'bash',
					label: 'Dense and JSON modes',
					code: `astryx-svelte docs migration --dense
astryx-svelte component Button --json`
				}
			]
		},
		{
			title: 'Theme and CSS Setup',
			content: [
				{
					type: 'prose',
					text: 'Mount Theme at the app root so every migrated component reads the same token set. Keep the mode in application state if users can switch between light and dark themes.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Root layout with explicit mode',
					code: `<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { Theme } from '@astryx-svelte/core';
	import { neutralTheme } from '@astryx-svelte/theme-neutral';
	import { setSettings } from '$lib/settings.svelte.js';
	import '../app.css';

	let { children } = $props();
	let mode = $state<'system' | 'light' | 'dark'>('system');

	setSettings({
		get mode() {
			return mode;
		},
		setMode: (next) => (mode = next)
	});
</script>

<Theme theme={neutralTheme} {mode}>
	{@render children()}
</Theme>`
				},
				{
					type: 'prose',
					text: 'When Tailwind remains in the app, declare layer order once in the global CSS file. The design system base and theme CSS should load before Tailwind utilities so migrated components keep design system defaults while legacy utility classes still work.'
				},
				{
					type: 'code',
					lang: 'css',
					label: 'Tailwind v4 coexistence',
					code: `@layer reset, theme, base, astryx-base, astryx-theme, product, utilities;

@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/preflight.css' layer(base);
@import '@astryx-svelte/core/base.css';
@import '@astryx-svelte/theme-neutral/theme.css';
@import 'tailwindcss/utilities.css' layer(utilities);`
				},
				{
					type: 'prose',
					text: 'On Tailwind v3 there is no preflight.css to import, so wrap the @tailwind base directive in a named layer instead. Keep utilities unlayered so existing app utility classes still win everywhere.'
				},
				{
					type: 'code',
					lang: 'css',
					label: 'Tailwind v3 coexistence',
					code: `@layer reset, tw-preflight, astryx-base, astryx-theme;

@import '@astryx-svelte/core/base.css';
@import '@astryx-svelte/theme-neutral/theme.css';

@layer tw-preflight {
  @tailwind base; /* layered: astryx-theme now wins over preflight */
}
@tailwind components;
@tailwind utilities; /* unlayered: legacy utility classes keep winning */`
				}
			]
		},
		{
			title: 'Cascade Layer Safety',
			content: [
				{
					type: 'prose',
					text: 'In a stylesheet with no layers at all, a zero-specificity reset like `* { padding: 0 }` loses to any class selector, so most developers treat resets as harmless. Layers change the rules twice: unlayered styles beat every named layer, and a later layer beats an earlier one, both regardless of specificity. The same reset therefore wins against every component style either by staying unlayered or by landing in a layer declared after astryx-base. Same CSS, opposite outcome, and no error or warning when it happens.'
				},
				{
					type: 'prose',
					text: 'This is the most common way an adoption breaks, through one of two @import mechanisms. A top-level @import without the layer() keyword keeps the legacy reset unlayered, where it overrides every design system layer. And an @import nested inside a file that was itself imported into a layer inherits that surrounding layer, so a reset can silently land in a consumer layer above astryx-base. Either way the fix is the same: import the legacy reset into the lowest layer explicitly.'
				},
				{
					type: 'code',
					lang: 'css',
					label: 'Legacy reset, explicitly layered',
					code: `/* was: @import "./legacy-reset.css";  (unlayered: beats every layer) */
@import './legacy-reset.css' layer(reset);`
				},
				{
					type: 'prose',
					text: 'Audit the layers around the design system with this checklist before building screens.'
				},
				{
					type: 'list',
					style: 'unordered',
					items: [
						"Declare the canonical @layer order once, before any @import. Vite inlines a CSS entry's imports in place, so putting the order declaration at the top of the file you import first (app.css) is enough; with a webpack-based bundler it must live in its own file imported first, because webpack hoists @import content above the inline CSS that follows it.",
						'Audit every pre-existing global or reset stylesheet and assign each one to a layer deliberately. Top-level imports without layer() stay unlayered and beat every layer; imports nested inside a layered file inherit that layer.',
						'Remove or demote the app legacy reset. `@astryx-svelte/core/base.css` contains its own :where() reset in the lowest layer, so any app reset belongs in that same reset layer and never in a layer above astryx-base.',
						'Layer Tailwind preflight. On Tailwind v4, import preflight.css with layer(base). On Tailwind v3, wrap the @tailwind base directive in a named layer (see the snippet in Theme and CSS Setup). Unlayered preflight overrides theme CSS silently.',
						'Set moduleResolution to bundler so subpath imports like @astryx-svelte/core/base.css resolve.',
						'Theme with defineTheme and the accent family API instead of hand-writing individual color tokens. Derived tokens like --color-on-accent are generated from the accent scale automatically; hand-writing only --color-accent leaves --color-on-accent at its stale white default with no contrast guarantee against the new accent.',
						'Run the foundation smoke test below and view a few components in both light and dark mode before migrating any route.'
					]
				},
				{
					type: 'prose',
					text: 'One more mental model shift: a class or utility class you write on a component still reaches the DOM either way, but whether it overrides the component is a layer question, not a source order question. Keep app utilities in the utilities layer so they keep winning. And a rule in a Svelte `<style>` block is unlayered by default, so it beats every astryx layer — deliberate, but worth knowing before you debug it.'
				}
			]
		},
		{
			title: 'Foundation Smoke Test',
			content: [
				{
					type: 'prose',
					text: 'A broken layer order fails silently and identically on every page, so catch it before feature work instead of after N migrated screens. Render one throwaway page with a few primitives as the first migration step.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Foundation check page',
					code: `<!-- src/routes/foundation-check/+page.svelte -->
<script lang="ts">
	import { Button, Card, Table, TextInput, VStack } from '@astryx-svelte/core';

	let email = $state('');
</script>

<div data-foundation-check>
	<VStack gap={4}>
		<Button label="Primary action" variant="primary" />
		<TextInput label="Email" placeholder="you@example.com" bind:value={email} />
		<Card>One card with default padding</Card>
		<Table
			data={[{ name: 'Foundation', status: 'ok' }]}
			columns={[
				{ key: 'name', header: 'Name' },
				{ key: 'status', header: 'Status' }
			]}
		/>
	</VStack>
</div>`
				},
				{
					type: 'prose',
					text: 'If the button renders with visible padding, a filled primary background, and the input and card have borders and internal spacing, the foundation is sound. For an assertion that can run in any test runner or a dev-only effect, check that a primitive keeps non-zero padding:'
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'Foundation assertion',
					code: `const button = document.querySelector<HTMLButtonElement>(
	'[data-foundation-check] button'
);
if (!button) {
	throw new Error('Foundation check page did not render a button.');
}
if (getComputedStyle(button).paddingInline === '0px') {
	throw new Error(
		'Foundation broken: an unlayered reset or a later cascade layer is ' +
			'overriding component styles. Check that no app reset sits outside ' +
			'the reset layer.'
	);
}`
				},
				{
					type: 'prose',
					text: 'When this fails, the fix is almost always in the layer order: find the stylesheet that zeroes padding, and move it into the reset layer or delete it.'
				}
			]
		},
		{
			title: 'Move the App Frame First',
			content: [
				{
					type: 'prose',
					text: 'Start with AppShell so page migration happens inside the final navigation, spacing, surface, and responsive frame. This also exposes theme and color issues early because every route shares the same shell.'
				},
				{
					type: 'table',
					headers: ['Legacy surface', 'Component', 'Notes'],
					rows: [
						[
							'Header',
							'TopNav',
							'Use for product identity, global actions, account entry, and command/search trigger.'
						],
						[
							'Sidebar',
							'SideNav',
							'Use sections and nested nav items for route groups. Keep selection state driven by the router.'
						],
						[
							'Main page wrapper',
							'AppShell + Layout',
							'Let the shell own persistent structure; let route components own page content. In SvelteKit the shell belongs in +layout.svelte.'
						],
						[
							'Mobile drawer nav',
							'MobileNav or AppShell mobile behavior',
							'Verify focus, close behavior, and route changes on narrow viewports.'
						],
						[
							'Settings menu',
							'Popover + Layout + Switch',
							'Use as the home for theme mode and app preferences.'
						]
					]
				}
			]
		},
		{
			title: 'Map shadcn-svelte and Bits UI Primitives',
			content: [
				{
					type: 'prose',
					text: 'Do not wrap old shadcn-svelte, Bits UI, Melt UI, or Skeleton components in design system styles. Replace the primitive with the component that owns the behavior, accessibility, state classes, and token usage.'
				},
				{
					type: 'table',
					headers: ['Existing primitive', 'Component', 'Migration note'],
					rows: [
						[
							'button / shadcn Button',
							'Button or IconButton',
							'Use Button for labeled commands and IconButton for icon-only toolbar actions.'
						],
						[
							'input',
							'TextInput',
							'Keep validation state in status props rather than ad hoc border classes.'
						],
						['textarea', 'TextArea', 'Use when multiline editing is the primary action.'],
						[
							'switch',
							'Switch',
							'Use for persisted boolean settings, including theme mode when represented as a binary choice.'
						],
						[
							'checkbox',
							'CheckboxInput or CheckboxList',
							'Use list variants for grouped selection.'
						],
						[
							'radio group',
							'RadioList',
							'Use when one option must be selected from a visible set.'
						],
						[
							'select / combobox',
							'Selector or Typeahead',
							'Use Selector for bounded options and Typeahead for searchable async options.'
						],
						[
							'tabs used as page nav',
							'TabList',
							'Use route state or current page state as the source of truth.'
						],
						[
							'command dialog',
							'CommandPalette',
							'Keep app-specific search sources outside the shell and feed searchable items.'
						],
						[
							'dropdown action menu',
							'DropdownMenu or MoreMenu',
							'Use MoreMenu for compact overflow actions.'
						],
						[
							'alert / callout',
							'Banner or Toast',
							'Use Banner for page or section messages and Toast for transient feedback.'
						],
						[
							'dialog',
							'Dialog or AlertDialog',
							'Use AlertDialog for destructive confirmation and Dialog for task flows.'
						],
						[
							'card-like list row',
							'ListItem',
							'Prefer ListItem for selectable rows instead of styling Button as a row.'
						]
					]
				}
			]
		},
		{
			title: 'Command Palette, Settings, and Theme',
			content: [
				{
					type: 'prose',
					text: 'Move global search to CommandPalette once the shell exists. Treat the palette as a view over app commands: routes, contextual actions, create actions, filters, recent items, and entity results. Keep data normalization in app code so search sources always return arrays of searchable items.'
				},
				{
					type: 'prose',
					text: 'Put light and dark mode controls in the settings popover or account menu. The switch or selector should update the mode passed to Theme, not toggle isolated body classes.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Settings popover theme control',
					code: `<script lang="ts">
	import { Switch } from '@astryx-svelte/core';
	import { getSettings } from '$lib/settings.svelte.js';

	const settings = getSettings();
	const isDark = $derived(settings.mode === 'dark');
</script>

<Switch
	label="Dark mode"
	description="Use the dark color theme"
	value={isDark}
	onChange={(next) => settings.setMode(next ? 'dark' : 'light')}
/>`
				}
			]
		},
		{
			title: 'Verification Checklist',
			content: [
				{
					type: 'list',
					style: 'unordered',
					items: [
						'Run the app in light and dark mode and check that surfaces, borders, text, icons, hover states, focus rings, and status colors flow together.',
						'Open the command palette from the shell, type into it, select items by keyboard, and confirm focus returns to the trigger.',
						'Check the SideNav at collapsed, expanded, active, hover, nested, and mobile states.',
						'Verify settings popovers and dialogs in a real browser, not only in a DOM shim: the native dialog and Popover APIs are what these components are built on.',
						'Search for leftover hardcoded Tailwind colors, arbitrary hex values, and one-off hover colors after each route migration.',
						'Run component tests, build, and at least one browser screenshot pass for each migrated route.'
					]
				}
			]
		},
		{
			title: 'AI Migration Prompt',
			content: [
				{
					type: 'prose',
					text: 'When using an AI coding agent, give it an explicit migration loop instead of asking for a full-app rewrite.'
				},
				{
					type: 'code',
					lang: 'text',
					label: 'Paste this into your AI',
					code: `We are migrating this existing Tailwind/shadcn-svelte app to Astryx incrementally.

First run:
- astryx-svelte docs migration --dense
- astryx-svelte docs theme --dense
- astryx-svelte docs styling --dense
- astryx-svelte template AppShellTopNavWithSideNav --skeleton

Then migrate one route or shell surface at a time. Keep business logic and routing intact. Replace shadcn-svelte/Bits UI/Tailwind primitives with Astryx components, remove hardcoded colors, verify light and dark mode, and take screenshots before moving to the next surface.`
				}
			]
		}
	]
};
