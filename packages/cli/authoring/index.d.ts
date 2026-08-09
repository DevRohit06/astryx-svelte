/**
 * Public type surface for `@astryx-svelte/cli/authoring`.
 *
 * Authoring is a pure data contract: the TYPES you write plain objects against,
 * and the PARSERS the CLI runs at the load boundary (`unknown` → typed, or a
 * readable throw). Zod is sealed inside each parser and never appears here.
 * There are no `create*` factories — author a plain object and stamp its `type`.
 *
 * This file reads as a menu: the handful of things you author sit up top, the
 * field/sub-types they compose from are grouped below the divider, and internal
 * runner types are not exported here at all.
 *
 * NOTE: this barrel is a `.d.ts` on purpose. It is a pure re-export (including
 * the parser value bindings from `./*.mjs`), and downstream package builds
 * resolve `@astryx-svelte/cli/authoring` here via the `types` condition. Their
 * tsconfigs run with `skipLibCheck` (which skips `.d.ts`) but no `allowJs`, so a
 * real `.ts` barrel would make tsc follow the `.mjs` re-exports and fail TS7016.
 * The runtime entry is the sibling `index.mjs`.
 */

// ═══════════════════════════════════════════════════════════════════════
// AUTHOR THESE — each is the default export of one authored file.
// ═══════════════════════════════════════════════════════════════════════
export type { ComponentDoc } from './doctypes/types'; //   Button.doc.{ts,mjs}
export type { HookDoc } from './doctypes/types'; //         useToast.doc.{ts,mjs}
export type { ReferenceDoc } from './doctypes/types'; //    theming.doc.{ts,mjs}
export type { TemplateDoc } from './doctypes/types'; //     Foo.template.{ts,mjs}
export type { AstryxConfig } from './config/type'; //       astryx-svelte.config.{ts,mjs}
export type { AstryxIntegration } from './integration/type'; // astryx-svelte.integration.{ts,mjs}
export type { AstryxCodemod, AstryxConfigCodemod } from './codemod/type'; // codemods/*

// ═══════════════════════════════════════════════════════════════════════
// PARSERS — the CLI's load boundary (types come from each parser's JSDoc).
// ═══════════════════════════════════════════════════════════════════════
export { parseDoc } from './doctypes/parse.mjs';
export { parseComponent } from './doctypes/component/parse.mjs';
export { parseHook } from './doctypes/hook/parse.mjs';
export { parseReference } from './doctypes/reference/parse.mjs';
export { parseTemplate } from './doctypes/template/parse.mjs';
export { parseLegacyDoc } from './doctypes/legacy.mjs';
export { parseConfig } from './config/parse.mjs';
export { parseIntegration } from './integration/parse.mjs';
export { parseCodemod } from './codemod/parse.mjs';

// ═══════════════════════════════════════════════════════════════════════
// FIELD & SUB-TYPES — the building blocks of the docs above. Import these
// only to annotate a part directly (or to read/render docs); you rarely
// need them to author. Names carry the doc kind they belong to.
// ═══════════════════════════════════════════════════════════════════════
export type {
	// component
	SingleComponentDoc,
	MultiComponentDoc,
	ComponentEntry,
	ComponentGroupDoc,
	ComponentTranslationDoc,
	ComponentPropDoc,
	ComponentExampleDoc,
	ComponentAnatomyElement,
	ComponentBestPractice,
	ComponentSlotElement,
	ComponentPlaygroundConfig,
	ComponentThemingTarget,
	ComponentThemingVar,
	ComponentThemingDerivedVar,
	UsageDoc,
	// hook
	HookParamDoc,
	HookReturnDoc,
	HookTranslationDoc,
	// reference
	ReferenceSection,
	ReferenceContentBlock,
	ReferenceTokenPreviewType,
	ReferenceTranslationDoc,
	// template
	TemplateCategory
} from './doctypes/types';
// `PostCodemodCommand` and `XleComponent` are additions to upstream's list, not
// drift. Both are reachable from types this barrel already exports —
// `PostCodemodHook.buildCommand` returns the first, `AstryxConfig`'s
// `experimental.xle.components` is keyed to the second — so omitting them left
// the published surface unusable: an author could not annotate a hook's return
// value or a single XLE entry without importing from a deep path. Upstream omits
// several more reachable names (`SubComponentDoc`, `ComponentRef`,
// `ComponentBaseDoc`, and the three `*TemplateDoc` bases); those live in the
// doctypes tree and are logged for a surface sweep rather than fixed here.
export type { PostCodemodHook, PostCodemodCommand, XleComponent } from './config/type';
export type {
	AstryxCodemodDef,
	AstryxConfigCodemodDef,
	AstryxCodemodFile,
	AstryxCodemodApi,
	AstryxCodemodTransform
} from './codemod/type';
