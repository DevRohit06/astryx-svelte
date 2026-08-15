/**
 * @file Authoring an integration package.
 *
 * Prose verbatim; every file *name* changes, and that is the point of the file.
 * The consumer config is `astryx-svelte.config.{ts,mjs,js}` and the manifest is
 * `astryx-svelte.integration.{ts,mjs,js}` — deliberately NOT upstream's
 * basenames. A manifest's payload points at component sources this CLI will
 * read as Svelte, so sharing upstream's basename would let a React Astryx
 * integration installed alongside this port be loaded and its `.tsx` read as
 * `.svelte`. (The `astryx` package.json field the scanner reads keeps upstream's
 * spelling, because its payload — a docs directory, a category string — is
 * framework-neutral. Same principle, opposite conclusion. See port/todo.md, slice 3.)
 *
 * The source extension follows: a contributed component is `Acme.svelte` beside
 * `Acme.doc.ts`, and a template is `AcmeLandingPage.svelte` beside
 * `AcmeLandingPage.template.ts`.
 */

/** @type {import('@astryx-svelte/cli/authoring').ReferenceDoc} */
export const docs = {
	name: 'cli-integrations',
	title: 'CLI Integrations',
	category: 'guide',
	description:
		'Author an npm package that contributes components, templates, and upgrade codemods to Astryx.',

	sections: [
		{
			title: 'Overview',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: "An integration is an npm package that contributes components, templates, and/or upgrade codemods to a consumer's design-system workflow. Consumers install the package and add it to their `astryx-svelte.config`; from then on the integration's contributions show up alongside core's in the same CLI commands."
				},
				{
					type: 'prose',
					text: "The system runs on two files. The consumer writes `astryx-svelte.config.{ts,mjs,js}` at their project root to list which packages to load. The author writes `astryx-svelte.integration.{ts,mjs,js}` at the package root to declare what the package contributes. This page is the author's guide. For the consumer side, run `npx astryx-svelte docs getting-started`."
				},
				{
					type: 'prose',
					text: 'On the consumer side, adding your package is one line:'
				},
				{
					type: 'code',
					lang: 'typescript',
					code: "// astryx-svelte.config.ts\nexport default {\n  integrations: ['@acme/astryx-widgets'],\n};"
				},
				{
					type: 'prose',
					text: "Your components and templates then appear next to core's:"
				},
				{
					type: 'code',
					lang: 'bash',
					code: 'astryx-svelte component --list --package @acme/astryx-widgets\nastryx-svelte component AcmeCarousel --props'
				}
			]
		},
		{
			title: 'The Integration File',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'To register your package as an integration, add an `astryx-svelte.integration.{ts,mjs,js}` file as a sibling of your `package.json`. It tells the CLI where to find your components, templates, and codemods. Identity (name, version) comes from your `package.json`, not this file.'
				},
				{
					type: 'code',
					lang: 'typescript',
					code: "// astryx-svelte.integration.ts\nexport default {\n  components: './components',\n  templates: './templates',\n  codemods: './codemods',\n  issuesUrl: 'https://github.com/acme/widgets/issues',\n};"
				},
				{
					type: 'prose',
					text: 'Every field is optional. Declare only the contribution roots your package ships. There is no factory to call. Write a plain object, and for editor autocomplete and type-checking annotate it with the `AstryxIntegration` type exported from `@astryx-svelte/cli/authoring`.'
				}
			]
		},
		{
			title: 'Components',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Export your components from your library however you like, and consumers still import them from your package. For each component the CLI should document, ship a `.doc.{ts,mjs,js}` file with the same stem, for example `AcmeCarousel.svelte` alongside `AcmeCarousel.doc.ts`.'
				},
				{
					type: 'code',
					lang: 'typescript',
					code: "// AcmeCarousel.doc.ts\nexport default {\n  type: 'component',\n  name: 'AcmeCarousel',\n  description: 'A carousel that cycles through slides.',\n  // props, usage, examples, ...\n};"
				}
			]
		},
		{
			title: 'Templates',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: "Templates are usually not exported from the package directly. Instead, consumers browse them through the CLI and materialize them into their app. Define a template as a plain object stamped with `type: 'page'` (full pages) or `type: 'block'` (smaller chunks) in a `.template.{ts,mjs,js}` file next to the source, for example `AcmeLandingPage.svelte` and `AcmeLandingPage.template.ts`."
				},
				{
					type: 'code',
					lang: 'typescript',
					code: "// AcmeLandingPage.template.ts\nexport default {\n  type: 'page',\n  // name, description, preview, ...\n};"
				},
				{
					type: 'prose',
					text: 'The CLI needs the template source at consume time, so make sure it is included in your published package. This is typically done via the `exports` key in `package.json`. It also lets the docsite render template previews in the future.'
				},
				{
					type: 'code',
					lang: 'jsonc',
					code: '{\n  "exports": {\n    // ...\n    "./templates/*.svelte": "./templates/*.svelte"\n  }\n}'
				},
				{
					type: 'prose',
					text: 'To verify it resolves, try importing the template component with its `.svelte` extension. An extensionless specifier will not resolve under `moduleResolution: bundler`, and the extensionful export above is what lets this type-check.'
				},
				{
					type: 'code',
					lang: 'typescript',
					code: "import('@acme/astryx-widgets/templates/AcmeLandingPage.svelte');"
				}
			]
		},
		{
			title: 'Codemods',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: "Ship codemods so `astryx-svelte upgrade` can migrate consumers across breaking changes in your package. Point the integration file's `codemods` field at your codemods root, and author each one as a plain object stamped with `type: 'code'` (transforms source files) or `type: 'config'` (rewrites the consumer's `astryx-svelte.config`)."
				},
				{
					type: 'code',
					lang: 'typescript',
					code: "// codemods/v2-rename-prop.ts\nexport default {\n  type: 'code',\n  // title, description, transform, ...\n};"
				},
				{
					type: 'prose',
					text: 'All authoring types are exported from `@astryx-svelte/cli/authoring`: `ComponentDoc`, `HookDoc`, and `ReferenceDoc` for docs, `TemplateDoc` for templates, and `AstryxConfig`, `AstryxIntegration`, and `AstryxCodemod` for the project files. Consumers can also run their own post-codemod hooks, such as a reinstall or rebuild, via `hooks.postCodemod` in their `astryx-svelte.config`.'
				}
			]
		},
		{
			title: 'How It Works',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: "Every CLI command loads the consumer's `astryx-svelte.config`, resolves each listed integration's manifest from `node_modules`, and discovers its contributions. Everything is validated against one strict schema at the load boundary: the CLI parses each file through `@astryx-svelte/cli/authoring` when it loads it, not when you author it. There are no factories; you write a plain object and stamp its `type`."
				},
				{
					type: 'prose',
					text: 'Discovery is resilient. A broken or misconfigured integration is skipped with a single non-blocking warning on stderr instead of crashing the CLI, and it never corrupts a `--json` stdout envelope. Everyday commands keep working with the remaining valid contributions.'
				},
				{
					type: 'prose',
					text: 'To inspect problems, run `astryx-svelte validate-integration <package>` for a detailed report on one package, or `astryx-svelte doctor` for an overall health check of the setup.'
				}
			]
		}
	]
};
