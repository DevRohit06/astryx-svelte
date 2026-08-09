// StyleX's dev-only virtual module.
//
// In dev the plugin serves the compiled sheet from a virtual id rather than a
// real asset, so there is no file for TypeScript to resolve. The import in
// `+layout.svelte` is guarded by `import.meta.env.DEV` and stripped from
// production builds.
//
// This lives in its own file rather than in `app.d.ts` because that file has a
// top-level `export`, which makes it a module — and inside a module,
// `declare module 'x'` is an *augmentation* of an existing module rather than a
// declaration of a new one, so it would not resolve.

declare module 'virtual:stylex:runtime';
