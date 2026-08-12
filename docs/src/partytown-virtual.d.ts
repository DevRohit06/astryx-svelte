// Partytown's inlined loader, served as a virtual module.
//
// `scripts/vite-plugin-partytown.mjs` calls `partytownSnippet()` in Node and
// returns the string it produces, so the `@qwik.dev/partytown` package stays a
// devDependency and never reaches the client graph. There is no file on disk
// for TypeScript to resolve, hence this declaration.
//
// Its own file rather than `app.d.ts` for the reason `stylex-virtual.d.ts`
// gives: `app.d.ts` has a top-level `export`, which makes `declare module` an
// augmentation of an existing module instead of a declaration of a new one.

declare module 'virtual:partytown-snippet' {
	const snippet: string;
	export default snippet;
}
