// Resolves each documented prop's *real* type from @astryx-svelte/core's
// generated declarations.
//
// Upstream's `.doc.mjs` supplies the prose — description, default, required —
// and that content is reused verbatim. It cannot supply the type: those strings
// are React (`ReactNode`, `ReactElement<IconProps>`), and rewriting them with a
// pattern table guesses wrong. `Button.icon` is `ReactNode` upstream but
// `Snippet` here, with no string branch; documenting `string | Snippet` would
// describe an API this library does not have and send callers down a path that
// throws.
//
// So the type column is read from `packages/core/dist/**/*.d.ts` — the same
// declarations consumers typecheck against. The doc file decides *which* props
// are documented and what they mean; the compiler decides what they accept.

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/**
 * A function's parameter list, resolved for the props tables.
 *
 * - `byName` — each parameter's own type, by parameter name.
 * - `membersByParam` — the members of each parameter's type, after unwrapping
 *   the options thunk this port passes them behind.
 * - `sole` — the members of the single options object, when every overload
 *   takes exactly one parameter. Null otherwise.
 *
 * @typedef {{
 *   byName: Map<string, string>,
 *   membersByParam: Map<string, Map<string, string>>,
 *   sole: Map<string, string> | null
 * }} ParameterTypes
 */

/**
 * Build a TypeScript program over core's public entry points and index every
 * exported `*Props` interface by prop name → rendered type.
 *
 * @param {string} coreDistDir absolute path to packages/core/dist
 * @returns {{
 *   typesFor: (propsTypeName: string) => Map<string, string> | null,
 *   typesForAny: (propsTypeNames: string[]) => Map<string, string> | null,
 *   firstMatchingName: (propsTypeNames: string[]) => string | null,
 *   returnTypesForFunction: (fn: string) => Map<string, string> | null,
 *   parameterTypesForFunction: (fn: string) => ParameterTypes | null,
 *   propsTypeNames: Set<string>
 * }}
 */
export function createPropsTypeIndex(coreDistDir) {
	// Every declaration file, not only the barrels. A few props interfaces are
	// deliberately *not* re-exported — upstream keeps `SelectorOptionProps` and
	// `SyntaxThemeProps` module-private and the port matches that — but the
	// per-component `.d.ts` still declares them, and they describe real props
	// that belong in the table.
	/** @param {string} dir @returns {string[]} */
	const collectDeclarations = (dir) => {
		if (!fs.existsSync(dir)) return [];
		/** @type {string[]} */
		const found = [];
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) found.push(...collectDeclarations(full));
			else if (entry.isFile() && entry.name.endsWith('.d.ts')) found.push(full);
		}
		return found;
	};

	const entryPoints = collectDeclarations(coreDistDir);

	const program = ts.createProgram(entryPoints, {
		target: ts.ScriptTarget.ESNext,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		skipLibCheck: true,
		noEmit: true,
		// `.svelte` files are resolved by svelte2tsx upstream; here only the
		// emitted `.d.ts` matter, and those are plain TypeScript.
		allowJs: false
	});

	const checker = program.getTypeChecker();

	/** @type {Map<string, import('typescript').Type>} */
	const typeByName = new Map();
	/**
	 * Props types declared inside a `<name>.svelte.d.ts`. These win over
	 * anything else carrying the same name, because a `<Name>Props` declared in
	 * a component's own module *is* that component's props type, and a match
	 * elsewhere is a coincidence.
	 *
	 * `Theme` is the case, and upstream has the same collision: `theme-props.ts`
	 * publishes a `ThemeProps` (the return of `themeProps()`, `{class, …}`)
	 * while `theme.svelte` declares a module-private `ThemeProps` of its own.
	 * Without this split, whichever file the scan reached first decided the
	 * `<Theme>` props table — and it silently reported `theme` and `mode` as
	 * undeclared.
	 *
	 * @type {Map<string, import('typescript').Type>}
	 */
	const componentTypeByName = new Map();

	/**
	 * Every exported function, by name — the source for a hook's return members.
	 * @type {Map<string, import('typescript').Symbol>}
	 */
	const functionByName = new Map();

	/** @param {string} name */
	// `*Return` joins them because a hook's documented surface is its *return*
	// shape: upstream's `useImperativeDialog.doc.mjs` lists `show`/`hide`/`isOpen`
	// in a `props` table, and the declaration that types them here is
	// `ImperativeDialogReturn`. See `propsTypeNamesFor`.
	//
	// `*Config` is the fourth, and it was missing for as long as this file has
	// existed: `propsTypeNamesFor` asks for three `Config` spellings and the
	// index answered none of them, so that lookup could never hit. The cost was
	// the whole Table plugin API — 15 hook pages, 85 rows, every one carrying
	// "Not declared by core, so this type is mapped from upstream's rather than
	// read from the compiler" while core declared `UseTableSortableConfig`,
	// `UseTablePaginationConfig` and 16 more all along.
	const isPropsLike = (name) =>
		name.endsWith('Props') ||
		name.endsWith('Options') ||
		name.endsWith('Return') ||
		name.endsWith('Config');

	for (const entry of entryPoints) {
		const source = program.getSourceFile(entry);
		if (!source) continue;

		const isComponentModule = entry.endsWith('.svelte.d.ts');

		// Module-*private* declarations. `SyntaxThemeProps` is declared without
		// `export` — upstream keeps it private and the port matches — so it
		// never appears in the module's exports, but it is still the interface
		// the component's props are checked against.
		for (const statement of source.statements) {
			if (!ts.isInterfaceDeclaration(statement) && !ts.isTypeAliasDeclaration(statement)) continue;
			const name = statement.name.text;
			if (!isPropsLike(name)) continue;

			const target = isComponentModule ? componentTypeByName : typeByName;
			if (target.has(name)) continue;

			const symbol = checker.getSymbolAtLocation(statement.name);
			const declared = symbol && checker.getDeclaredTypeOfSymbol(symbol);
			if (declared) target.set(name, declared);
		}

		const moduleSymbol = checker.getSymbolAtLocation(source);
		if (!moduleSymbol) continue;

		for (const exported of checker.getExportsOfModule(moduleSymbol)) {
			const name = exported.getName();
			const resolved =
				(exported.flags & ts.SymbolFlags.Alias) !== 0
					? checker.getAliasedSymbol(exported)
					: exported;

			// Every exported *function*, indexed by name. This is what lets a
			// hook's returns be read off its call signature instead of guessed at
			// by type name — and the guessing was failing silently: `useMediaQuery`
			// returns `MediaQueryState` and `useScrollOverflow` returns
			// `ScrollOverflow`, neither of which any `<Name>Return` spelling finds.
			// The signature is the declaration; a naming convention is a hope.
			if (!functionByName.has(name)) {
				const declaration = resolved.valueDeclaration ?? resolved.declarations?.[0];
				if (declaration) {
					const fnType = checker.getTypeOfSymbolAtLocation(resolved, declaration);
					if (fnType.getCallSignatures().length > 0) functionByName.set(name, resolved);
				}
			}

			// `*Options` is indexed alongside `*Props` because some doc entries
			// document a companion options object — see `propsTypeNamesFor`.
			if (!isPropsLike(name)) continue;

			const declared = checker.getDeclaredTypeOfSymbol(resolved);
			// A barrel re-export and the declaring file both yield the same
			// symbol, so first-wins keeps one entry per name.
			if (declared && !typeByName.has(name)) typeByName.set(name, declared);
		}
	}

	/**
	 * Drop a pair of parentheses that wraps the *whole* type, and only then.
	 *
	 * The regex this replaced — `/^\(\s*(.*)\s*\)$/` — is greedy and knows
	 * nothing about balance, so it matched any type that merely started with `(`
	 * and ended with `)` and tore the middle out. `Table.idKey` is declared
	 * `(keyof T & string) | ((item: T) => string | number)` and rendered as
	 * `keyof T & string) | ((item: T) => string | number` — not a type at all.
	 * Scanning for the partner of the leading paren is the whole fix.
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	function stripOuterParens(text) {
		if (!text.startsWith('(') || !text.endsWith(')')) return text;
		let depth = 0;
		for (let i = 0; i < text.length; i++) {
			if (text[i] === '(') depth++;
			else if (text[i] === ')') {
				depth--;
				// The opening paren closed before the end, so it wrapped a member
				// rather than the whole type. Leave it exactly as authored.
				if (depth === 0) return i === text.length - 1 ? text.slice(1, -1).trim() : text;
			}
		}
		return text;
	}

	/**
	 * Render a property's type the way a props table should show it.
	 *
	 * Optionality is already carried by the doc's `required` flag, so the
	 * `| undefined` half of every optional prop is dropped — it is noise in
	 * every row rather than information in any.
	 *
	 * A named alias is expanded when it resolves to a union of literals:
	 * `variant: ButtonVariant` tells a reader nothing, while
	 * `'primary' | 'secondary' | 'ghost' | 'destructive'` is the whole answer,
	 * and it is what upstream's doc shows too. Anything else keeps its authored
	 * annotation, which preserves readable names like `Snippet` and `StyleArg`.
	 *
	 * **Numeric literals count, and used not to.** Upstream's docs print
	 * `0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10` for a spacing step and
	 * `1 | 2 | 3 | 4 | 5 | 6` for a heading level; this port printed `SpacingStep`
	 * and `HeadingLevel`, which is the same "tells a reader nothing" the string
	 * case already answered, and it hid the members from the Properties tab's
	 * control derivation as well — a select can only list what the type names.
	 *
	 * @param {import('typescript').Symbol} symbol
	 */
	function renderType(symbol) {
		const declaration = symbol.declarations?.[0];

		// Every authored annotation this symbol has, deduped. A property that
		// exists on more than one arm of a discriminated union yields a
		// *synthesised* symbol carrying one declaration per arm, and taking the
		// first would render one arm as though it were the whole type:
		// `SelectorProps`' first arm declares `hasClear?: false`, so
		// `Selector.hasClear` and `NumberInput.hasClear` both showed a bare
		// `false` — a reader concludes the prop cannot be enabled. Where the arms
		// disagree there is no single authored text to prefer, so the checker
		// renders the real union instead (`false | true` collapses to `boolean`).
		//
		// A parameter declaration counts too, because `parameterTypesForFunction`
		// renders parameters through this same function and the authored text is
		// the better answer there as well: `options?: () => UseStreamingTextOptions`
		// should read as written, not as the checker's structural expansion of the
		// options interface.
		const declaredTexts = [
			...new Set(
				(symbol.declarations ?? []).flatMap((d) =>
					(ts.isPropertySignature(d) || ts.isParameter(d)) && d.type
						? [d.type.getText().replace(/\s+/g, ' ').trim()]
						: []
				)
			)
		];
		const declaredText = declaredTexts.length === 1 ? declaredTexts[0] : null;

		// `getTypeOfSymbolAtLocation` needs a real node; a symbol with no
		// declaration falls back to its declared type.
		let type = declaration
			? checker.getTypeOfSymbolAtLocation(symbol, declaration)
			: checker.getDeclaredTypeOfSymbol(symbol);
		type = checker.getNonNullableType(type);

		// A union of nothing but literals renders better than its alias. A
		// boolean is `true | false` to the checker but neither arm is a string or
		// a number literal, so `boolean` is not caught by this and still renders
		// as itself.
		if (type.isUnion()) {
			const parts = type.types.filter((member) => !(member.flags & ts.TypeFlags.Undefined));
			const isLiteral = (/** @type {import('typescript').Type} */ member) =>
				member.isStringLiteral() || member.isNumberLiteral();
			if (parts.length > 1 && parts.every(isLiteral)) {
				return parts
					.map((member) =>
						member.isStringLiteral()
							? `'${member.value}'`
							: String(/** @type {import('typescript').NumberLiteralType} */ (member).value)
					)
					.join(' | ');
			}
		}

		if (declaredText) {
			// Strip an authored `| undefined`, which the `required` flag covers.
			return stripOuterParens(declaredText.replace(/\s*\|\s*undefined\b/g, '').trim());
		}

		return checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
	}

	/**
	 * @param {string} propsTypeName
	 * @returns {Map<string, string> | null}
	 */
	function typesFor(propsTypeName) {
		const type = componentTypeByName.get(propsTypeName) ?? typeByName.get(propsTypeName);
		if (!type) return null;

		/** @type {Map<string, string>} */
		const byProp = new Map();

		/** @param {import('typescript').Type} candidate */
		const collect = (candidate) => {
			// `getPropertiesOfType` walks `extends` / `Omit<>` too, so a prop the
			// component inherits from BaseProps still resolves.
			for (const property of checker.getPropertiesOfType(candidate)) {
				if (!byProp.has(property.getName())) {
					byProp.set(property.getName(), renderType(property));
				}
			}
		};

		collect(type);

		// A discriminated union only reports the properties *every* arm shares,
		// so a prop that exists on one arm alone would look undeclared.
		// `Slider` is the case: `minStepsBetweenThumbs` belongs to the range
		// variant, not to the single-value one.
		if (type.isUnion()) for (const member of type.types) collect(member);

		return byProp;
	}

	/**
	 * Merge the members of several candidate types, first one winning. Used to
	 * check `<Name>Props` and then `<Name>Options` — see `propsTypeNamesFor`.
	 *
	 * @param {string[]} names
	 * @returns {Map<string, string> | null}
	 */
	function typesForAny(names) {
		/** @type {Map<string, string> | null} */
		let merged = null;

		for (const name of names) {
			const found = typesFor(name);
			if (!found) continue;
			if (!merged) {
				merged = new Map(found);
				continue;
			}
			for (const [prop, type] of found) if (!merged.has(prop)) merged.set(prop, type);
		}

		return merged;
	}

	/**
	 * The first candidate name that resolved to a real declaration.
	 *
	 * The page prints "Types are read from core's own `<X>` declaration", and
	 * `<X>` used to be synthesised as `<Name>Props` regardless of which candidate
	 * actually matched — so `useImperativeDialog` and `useImperativeAlertDialog`
	 * both cited a `useImperativeDialogProps` that has never existed (their rows
	 * come from `ImperativeDialogReturn`), and `Toast` cited `ToastProps` for
	 * three rows that come from `ToastOptions`. Naming a declaration a reader
	 * cannot find is worse than naming none.
	 *
	 * @param {string[]} names
	 * @returns {string | null}
	 */
	function firstMatchingName(names) {
		for (const name of names) if (typesFor(name)) return name;
		return null;
	}

	/**
	 * Unwrap one getter level.
	 *
	 * This port passes reactive values as **thunks** in both directions: a
	 * context hook returns `() => Value` rather than `Value` (a context has to
	 * store a getter for its contents to stay reactive across the boundary —
	 * `useAppShellMobile` is `(): () => AppShellMobileContextValue`), and every
	 * hook that takes options takes them as `options: () => UseFooOptions` for
	 * the same reason. The members a reader wants are on the value, not on the
	 * thunk, and a thunk has no properties at all, so without this the whole
	 * surface reports missing.
	 *
	 * Guarded on "no properties and takes no arguments" so it can only ever fire
	 * on a getter, never on a value that is legitimately callable.
	 *
	 * @param {import('typescript').Type} type
	 * @returns {import('typescript').Type}
	 */
	function unwrapGetter(type) {
		if (checker.getPropertiesOfType(type).length > 0) return type;
		const inner = type.getCallSignatures();
		if (inner.length === 1 && inner[0].getParameters().length === 0) {
			return checker.getNonNullableType(inner[0].getReturnType());
		}
		return type;
	}

	/**
	 * Every member of `type`, including the members of each arm when it is a
	 * union — a discriminated union only reports what every arm shares.
	 *
	 * @param {import('typescript').Type} type
	 * @returns {Map<string, string>}
	 */
	function membersOf(type) {
		/** @type {Map<string, string>} */
		const byMember = new Map();
		/** @param {import('typescript').Type} candidate */
		const collect = (candidate) => {
			for (const property of checker.getPropertiesOfType(candidate)) {
				if (!byMember.has(property.getName())) {
					byMember.set(property.getName(), renderType(property));
				}
			}
		};
		collect(type);
		if (type.isUnion()) for (const member of type.types) collect(member);
		return byMember;
	}

	/**
	 * Every call signature of the exported function `fn`, or null when there is
	 * no such export. An overloaded declaration yields one entry per overload —
	 * `useLayer` and `useResizable` each ship two, and a documented row may
	 * belong to either.
	 *
	 * @param {string} fn
	 * @returns {readonly import('typescript').Signature[] | null}
	 */
	function signaturesOf(fn) {
		const symbol = functionByName.get(fn);
		if (!symbol) return null;

		const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
		if (!declaration) return null;

		const signatures = checker.getTypeOfSymbolAtLocation(symbol, declaration).getCallSignatures();
		return signatures.length > 0 ? signatures : null;
	}

	/**
	 * The members of `fn`'s return type, read off its call signature.
	 *
	 * Preferred over any `<Name>Return` spelling because it cannot miss: the
	 * signature is what the hook actually returns, whatever its return type is
	 * called. Returns null for a hook that returns a primitive (there are no
	 * members to document) or for a name that is not an exported function.
	 *
	 * @param {string} fn
	 * @returns {Map<string, string> | null}
	 */
	function returnTypesForFunction(fn) {
		const signatures = signaturesOf(fn);
		if (!signatures) return null;

		const returned = unwrapGetter(checker.getNonNullableType(signatures[0].getReturnType()));
		const byMember = membersOf(returned);
		return byMember.size > 0 ? byMember : null;
	}

	/**
	 * `fn`'s **parameter list**, which is what a hook's documented `params` have
	 * to be checked against.
	 *
	 * A hook's params are positional arguments, not members of one named type, so
	 * `returnTypesForFunction`'s "look the type up and read its members" shape does
	 * not transfer. Three authored row shapes have to resolve, and upstream's hook
	 * docs use all three:
	 *
	 * - **`preset`, `query`, `targetText`** — a positional parameter, by name.
	 *   `byName` answers these, and it is where the port's getter convention
	 *   surfaces: `useMediaQuery`'s `query` is `() => string`, not `string`.
	 * - **`options.speed`** — a field of a named parameter. `membersByParam` holds
	 *   each parameter's members, after unwrapping the options thunk.
	 * - **`placement`, `alignment`, `delay`…** — the fields of the sole options
	 *   object, listed flat with no `options` row at all. `sole` holds those,
	 *   merged across overloads so `useLayer`'s context and fixed variants both
	 *   resolve.
	 *
	 * @param {string} fn
	 * @returns {ParameterTypes | null}
	 */
	function parameterTypesForFunction(fn) {
		const signatures = signaturesOf(fn);
		if (!signatures) return null;

		/** @type {Map<string, string>} */
		const byName = new Map();
		/** @type {Map<string, Map<string, string[]>>} */
		const memberTexts = new Map();
		/** @type {Map<string, string[]>} */
		const soleTexts = new Map();
		let everySignatureTakesOne = true;

		/**
		 * Overloads describe *one* documented row between them, so a member both
		 * arms declare has to render as the union of what each says. `useLayer`
		 * is the case: `mode` is `'context'` on one overload and `'fixed'` on the
		 * other, and taking the first would document a hook that cannot be put in
		 * fixed mode — upstream's own doc says `'context' | 'fixed'`.
		 *
		 * @param {Map<string, string[]>} into
		 * @param {string} key
		 * @param {string} text
		 */
		const record = (into, key, text) => {
			const texts = into.get(key) ?? [];
			if (!texts.includes(text)) texts.push(text);
			into.set(key, texts);
		};

		for (const signature of signatures) {
			const parameters = signature.getParameters();
			if (parameters.length !== 1) everySignatureTakesOne = false;

			for (const parameter of parameters) {
				const declaration = parameter.valueDeclaration ?? parameter.declarations?.[0];
				if (!declaration) continue;

				const name = parameter.getName();
				// The parameter's *own* type is not unioned across overloads: the
				// two texts are whole type expressions, and `() => A | () => B`
				// does not parse as either of them. First wins, as elsewhere.
				if (!byName.has(name)) byName.set(name, renderType(parameter));

				const value = unwrapGetter(
					checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(parameter, declaration))
				);

				for (const [member, text] of membersOf(value)) {
					if (!memberTexts.has(name)) memberTexts.set(name, new Map());
					record(/** @type {Map<string, string[]>} */ (memberTexts.get(name)), member, text);
					if (parameters.length === 1) record(soleTexts, member, text);
				}
			}
		}

		/** @param {Map<string, string[]>} texts */
		const join = (texts) => new Map([...texts].map(([key, list]) => [key, list.join(' | ')]));

		return {
			byName,
			membersByParam: new Map([...memberTexts].map(([name, texts]) => [name, join(texts)])),
			sole: everySignatureTakesOne && soleTexts.size > 0 ? join(soleTexts) : null
		};
	}

	return {
		typesFor,
		typesForAny,
		firstMatchingName,
		returnTypesForFunction,
		parameterTypesForFunction,
		propsTypeNames: new Set([...typeByName.keys(), ...componentTypeByName.keys()])
	};
}

/**
 * The type names an entry's documented props may be declared on.
 *
 * `<Name>Props` is the convention every component in this port follows. Some
 * upstream doc entries additionally document the *options* object a companion
 * API takes rather than component props — `Toast`'s `uniqueID`,
 * `collisionBehavior` and `onHide` are fields of `ToastOptions`, passed to
 * `showToast`, and are absent from `ToastProps` by design. Checking both keeps
 * those rows typed instead of flagging a gap that is not one.
 *
 * @param {string} componentName
 * @returns {string[]}
 */
export const propsTypeNamesFor = (componentName) => {
	// `useResizable` documents its config fields as props, and that config is
	// `UseResizableSingleConfig` — capitalised, and named for the hook rather
	// than for a component. Checking the capitalised forms too costs nothing
	// and types those rows from the real declaration.
	const capitalised = componentName.charAt(0).toUpperCase() + componentName.slice(1);

	// A hook whose documented "props" are really its *return* members. Upstream's
	// `useImperativeDialog.doc.mjs` lists `show`/`hide`/`isOpen`/`element` in a
	// `props` table; the declaration that types them here is
	// `ImperativeDialogReturn` — the hook name with `use` dropped. Last in the
	// list, so it can only type rows nothing above it already typed.
	const withoutUse = /^use[A-Z]/.test(componentName) ? componentName.slice(3) : null;

	return [
		`${componentName}Props`,
		`${componentName}Options`,
		`${componentName}Config`,
		`${capitalised}Props`,
		`${capitalised}Options`,
		`${capitalised}Config`,
		`${capitalised}SingleConfig`,
		`${capitalised}Return`,
		...(withoutUse ? [`${withoutUse}Return`] : [])
	];
};

/**
 * The primary props-type name, used to label the page.
 *
 * @param {string} componentName
 */
export const propsTypeNameFor = (componentName) => `${componentName}Props`;

/**
 * The type names a hook's documented `returns` may be declared on.
 *
 * Reading a hook's return members from the compiler is not cosmetic. Every
 * `*Ref` member upstream returns is an attachment here, under a different name:
 * `useOverflow`'s `containerRef`/`measureRef` are `attachContainer`/
 * `attachMeasure`, and `useFocusTrap`/`useGridFocus`/`useListFocus`/
 * `useTreeFocus` all return `attach…: Attachment<HTMLElement>`. Left to the
 * pattern rewriter those rows advertised a member this port does not have,
 * typed `React.RefCallback<HTMLElement>` — or, where the `RefObject` rule
 * stripped the generic but not the namespace, `React.HTMLElement | null`, which
 * is not a type at all.
 *
 * @param {string} hookName
 * @returns {string[]}
 */
export const returnTypeNamesFor = (hookName) => {
	const capitalised = hookName.charAt(0).toUpperCase() + hookName.slice(1);
	const withoutUse = /^use[A-Z]/.test(hookName) ? hookName.slice(3) : null;
	return [
		`${capitalised}Return`,
		`${hookName}Return`,
		...(withoutUse ? [`${withoutUse}Return`] : [])
	];
};
