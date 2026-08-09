/**
 * Ambient declarations for the virtual modules the StyleX bundler plugin serves
 * in dev. With `runtimeInjection: false` the compiled CSS is not injected
 * automatically, so the root layout imports the runtime to receive hot CSS
 * updates. Neither module exists in a production build, which is why the import
 * sits behind `import.meta.env.DEV`.
 *
 * This file deliberately has no top-level import/export: that would make it a
 * module, and `declare module` would then mean "augment an existing module"
 * rather than "declare an ambient one".
 */

declare module 'virtual:stylex:runtime' {
	const runtime: unknown;
	export default runtime;
}

declare module 'virtual:stylex:css-only' {
	const cssOnly: unknown;
	export default cssOnly;
}
