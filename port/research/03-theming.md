# Astryx Theming Architecture — Complete Map

Research target: a 1:1 Svelte port of Meta's Astryx design system theming layer.

**Sources read (all read-only):**

- `packages/core/src/theme/tokens.stylex.ts` — the token definitions (source of truth)
- `packages/core/src/theme/tokens.ts` — server-safe token *resolver* (not the token list)
- `packages/core/src/theme/defineTheme.ts` — theme authoring API + `tokenDefaults`
- `packages/core/src/theme/generateThemeRules.ts` — CSS generator (shared by runtime + CLI)
- `packages/core/src/theme/expand{Color,Type,Radius,Motion}Scale.ts` — generative token expanders
- `packages/core/src/theme/onMediaTokens.ts`, `MediaTheme.tsx`
- `packages/core/src/theme/syntax/{tokens,defineSyntaxTheme,SyntaxTheme,presets}.ts`
- `packages/core/src/theme/domainTokens/dataTokens.ts`
- `packages/core/src/theme/{Theme.tsx,useTheme.ts,types.ts,index.ts}`
- `packages/core/src/{naming.ts,reset.css}`, `packages/core/src/utils/{themeProps,parseStyleKey}.ts`
- `packages/core/src/theme/derivedVarRegistry.ts`
- `packages/cli/src/commands/build-theme.mjs` — the `astryx theme build` pipeline
- `packages/themes/neutral/src/neutralTheme.ts` + all 6 sibling themes
- Installed artifacts: `D:\astryx-svelte\node_modules\@astryxdesign\theme-neutral\dist\{theme.css,neutral.js,neutral.variants.d.ts}` and `@astryxdesign\core\dist\astryx.css`

---

## 0. Executive summary

| Question | Answer |
| --- | --- |
| Token groups | **13 core groups** (186 tokens) + **2 domain groups** (70 tokens) = **256 tokens** |
| Theme authoring | A single `defineTheme({...})` call — 12 possible fields |
| Component variant overrides | Plain CSS class selectors (`.astryx-button.destructive`) emitted into `@layer astryx-theme` inside `@scope`. **No JS involvement at runtime.** |
| `themeProps()` | Pure string builder — emits `class` + `data-*`. Trivially portable to Svelte. |
| `useTheme()` | React-context hook returning `{name, mode, token(), tokens}`. Only 6 real consumers. |
| Can we reuse published theme packages? | **YES — consume `@astryxdesign/theme-<name>/theme.css` verbatim.** It is framework-agnostic CSS with zero React. Already proven working in `src/routes/+layout.svelte`. |

---

## 1. Complete token taxonomy

### 1.1 Group inventory

Defined in `packages/core/src/theme/tokens.stylex.ts` via `stylex.defineVars()`. Every group exports both a `*Defaults` plain object (the values) and a `*Vars` StyleX var handle.

| # | Group export | Var export | Count | Prefix |
| --- | --- | --- | ---: | --- |
| 1 | `colorDefaults` | `colorVars` | 79 | `--color-*` |
| 2 | `spacingDefaults` | `spacingVars` | 15 | `--spacing-*` |
| 3 | `sizeDefaults` | `sizeVars` | 3 | `--size-*` |
| 4 | `borderDefaults` | `borderVars` | 1 | `--border-*` |
| 5 | `radiusDefaults` | `radiusVars` | 7 | `--radius-*` |
| 6 | `shadowDefaults` | `shadowVars` | 8 | `--shadow-*` |
| 7 | `durationDefaults` | `durationVars` | 9 | `--duration-*` |
| 8 | `easeDefaults` | `easeVars` | 1 | `--ease-*` |
| 9 | `transitionDefaults` *(deprecated)* | `transitionVars` | 2 | `--transition-*` |
| 10 | `typographyDefaults` | `typographyVars` | 3 | `--font-family-*` |
| 11 | `textSizeDefaults` | `textSizeVars` | 12 | `--font-size-*` |
| 12 | `fontWeightDefaults` | `fontWeightVars` | 4 | `--font-weight-*` |
| 13 | `typeScaleDefaults` | `typeScaleVars` | 42 | `--text-*` |
| | **Core subtotal** | | **186** | |
| 14 | `syntaxTokenDefaults` (domain) | — | 14 | `--color-syntax-*` |
| 15 | `dataTokenDefaults` (domain) | — | 56 | `--color-data-*` |
| | **Total** | | **256** | |

Domain tokens live in `packages/core/src/theme/domainTokens/` and are deliberately kept out of the core StyleX `defineVars` graph so they tree-shake away from core components. They are merged into `tokenDefaults` in `defineTheme.ts` for validation and autocomplete only.

`tokenDefaults` (exported from `defineTheme.ts`) is the flat merge of all 15 groups — 256 entries — and is what `resolveThemeTokens()` seeds from.

---

### 1.2 Color tokens (79)

All values are `light-dark(<light>, <dark>)`.

**Core semantic (10)**

| Token | Default |
| --- | --- |
| `--color-accent` | `light-dark(#0064E0, #2694FE)` |
| `--color-accent-muted` | `light-dark(#0082FB33, #0082FB3F)` |
| `--color-on-accent` | `light-dark(#FFFFFF, #FFFFFF)` |
| `--color-neutral` | `light-dark(rgba(5,54,89,0.1), rgba(223,226,229,0.2))` |
| `--color-background-surface` | `light-dark(#FFFFFF, #1F1F22)` |
| `--color-background-body` | `light-dark(#F1F4F7, #111112)` |
| `--color-overlay` | `light-dark(#01122866, #11111299)` |
| `--color-overlay-hover` | `light-dark(#0536590C, #FFFFFF0C)` |
| `--color-overlay-pressed` | `light-dark(#05365919, #FFFFFF19)` |
| `--color-background-muted` | `light-dark(#0536590C, #1111127F)` |

**Text (6)**

| Token | Default |
| --- | --- |
| `--color-text-primary` | `light-dark(#0A1317, #DFE2E5)` |
| `--color-text-secondary` | `light-dark(#4E606F, #AAAFB5)` |
| `--color-text-disabled` | `light-dark(#A4B0BC, #6F747C)` |
| `--color-text-accent` | `light-dark(#0064E0, #3E9EFB)` |
| `--color-on-dark` | `light-dark(#FFFFFF, #FFFFFF)` |
| `--color-on-light` | `light-dark(#000000, #000000)` |

**Icon (4)**

`--color-icon-accent`, `--color-icon-primary`, `--color-icon-secondary`, `--color-icon-disabled`
(defaults mirror accent / text-primary / text-secondary / text-disabled)

**Surface variants (4)**

`--color-background-card`, `--color-background-popover`, `--color-background-inverted`, `--color-background-error-inverted`

**Status / sentiment (9)**

| Token | Default |
| --- | --- |
| `--color-success` | `light-dark(#0D8626, #0D8626)` |
| `--color-success-muted` | `light-dark(#0B991F33, #0B991F3F)` |
| `--color-on-success` | `light-dark(#FFFFFF, #FFFFFF)` |
| `--color-error` | `light-dark(#E3193B, #F5394F)` |
| `--color-error-muted` | `light-dark(#E3193B33, #F5394F3F)` |
| `--color-on-error` | `light-dark(#FFFFFF, #FFFFFF)` |
| `--color-warning` | `light-dark(#E9AF08, #F2C00B)` |
| `--color-warning-muted` | `light-dark(#E2A40033, #E2A4003F)` |
| `--color-on-warning` | `light-dark(#0A1317, #0A1317)` |

**Border (2)** — `--color-border`, `--color-border-emphasized`

**Effects (4)**

| Token | Purpose |
| --- | --- |
| `--color-skeleton` | Skeleton shimmer base |
| `--color-track` | "Channel on body" — ProgressBar tracks, Slider rails, Switch off-state |
| `--color-shadow` | Shadow tint |
| `--color-tint-hover` | `light-dark(black, white)` — mixed via `color-mix()` for hover states |

**Categorical hue ramps (10 hues × 4 slots = 40)**

Hues: `blue`, `cyan`, `gray`, `green`, `orange`, `pink`, `purple`, `red`, `teal`, `yellow`.
Slots per hue: `--color-background-<hue>`, `--color-border-<hue>`, `--color-icon-<hue>`, `--color-text-<hue>`.

Example (blue): `--color-background-blue: light-dark(#0171E333, #0171E333)`, `--color-border-blue: light-dark(#0064E0, #2694FE)`, `--color-icon-blue: light-dark(#0064E0, #2694FE)`, `--color-text-blue: light-dark(#042F97, #AFD7FF)`.

---

### 1.3 Spacing (15)

| Token | Value |
| --- | --- |
| `--spacing-0` | `0px` |
| `--spacing-0-5` | `2px` |
| `--spacing-1` | `4px` |
| `--spacing-1-5` | `6px` |
| `--spacing-2` | `8px` |
| `--spacing-3` | `12px` |
| `--spacing-4` | `16px` |
| `--spacing-5` | `20px` |
| `--spacing-6` | `24px` |
| `--spacing-7` | `28px` |
| `--spacing-8` | `32px` |
| `--spacing-9` | `36px` |
| `--spacing-10` | `40px` |
| `--spacing-11` | `44px` |
| `--spacing-12` | `48px` |

### 1.4 Size (3)

`--size-element-sm: 28px`, `--size-element-md: 32px`, `--size-element-lg: 36px`

### 1.5 Border (1)

`--border-width: 1px`

### 1.6 Radius (7)

| Token | Value | Notes |
| --- | --- | --- |
| `--radius-none` | `0px` | fixed anchor (never scaled) |
| `--radius-inner` | `4px` | base × 1 |
| `--radius-element` | `8px` | base × 2 — buttons, inputs |
| `--radius-container` | `12px` | base × 3 — cards, panels |
| `--radius-page` | `28px` | base × 7 |
| `--radius-chat` | `28px` | base × 7 — tracks `page` but themeable independently (issue #2072) |
| `--radius-full` | `9999px` | fixed anchor |

### 1.7 Shadow (8)

| Token | Kind |
| --- | --- |
| `--shadow-low` | outer elevation (ascending: low < med < high) |
| `--shadow-med` | outer elevation |
| `--shadow-high` | outer elevation |
| `--shadow-inset-hover` | input state ring |
| `--shadow-inset-selected` | input state ring |
| `--shadow-inset-success` | validation ring |
| `--shadow-inset-warning` | validation ring |
| `--shadow-inset-error` | validation ring |

Note: shadow values themselves embed `light-dark()` per shadow layer.

### 1.8 Duration (9)

| Token | Value |
| --- | --- |
| `--duration-fast-min` | `130ms` |
| `--duration-fast` | `175ms` |
| `--duration-fast-max` | `230ms` |
| `--duration-medium-min` | `310ms` |
| `--duration-medium` | `410ms` |
| `--duration-medium-max` | `550ms` |
| `--duration-slow-min` | `730ms` |
| `--duration-slow` | `975ms` |
| `--duration-slow-max` | `1300ms` |

### 1.9 Ease (1)

`--ease-standard: cubic-bezier(0.24, 1, 0.4, 1)`

### 1.10 Transition (2) — DEPRECATED

`--transition-fast: 0.15s ease`, `--transition-normal: 0.2s ease`. Marked `@deprecated Use durationVars + easeVars instead`. **Do not port to new Svelte components** — carry only for byte-parity of the token block.

### 1.11 Font family (3)

`--font-family-body`, `--font-family-code`, `--font-family-heading`

### 1.12 Font size (12)

Geometric scale `round(14 × 1.2^step) / 16`, base = 14px, ratio = 1.2.

| Token | Value | Step | px |
| --- | --- | ---: | ---: |
| `--font-size-4xs` | `0.375rem` | -5 | 6 |
| `--font-size-3xs` | `0.4375rem` | -4 | 7 |
| `--font-size-2xs` | `0.5rem` | -3 | 8 |
| `--font-size-xs` | `0.625rem` | -2 | 10 |
| `--font-size-sm` | `0.75rem` | -1 | 12 |
| `--font-size-base` | `0.875rem` | 0 | 14 |
| `--font-size-lg` | `1.0625rem` | +1 | 17 |
| `--font-size-xl` | `1.25rem` | +2 | 20 |
| `--font-size-2xl` | `1.5rem` | +3 | 24 |
| `--font-size-3xl` | `1.8125rem` | +4 | 29 |
| `--font-size-4xl` | `2.1875rem` | +5 | 35 |
| `--font-size-5xl` | `2.625rem` | +6 | 42 |

### 1.13 Font weight (4)

`--font-weight-normal: 400`, `--font-weight-medium: 500`, `--font-weight-semibold: 600`, `--font-weight-bold: 700`

### 1.14 Type scale — semantic (42)

Each semantic role gets a `-size` / `-weight` / `-leading` triple. Sizes are `var()` references into the raw `--font-size-*` layer; leadings are hard-coded 4px-grid-snapped ratios; weights are `var()` references into `--font-weight-*`.

**Headings (6 × 3 = 18)** — step map h6=-2, h5=-1, h4=0 (base anchor), h3=+1, h2=+2, h1=+3

| Role | `-size` | `-weight` | `-leading` |
| --- | --- | --- | --- |
| `--text-heading-1-*` | `var(--font-size-2xl)` | `var(--font-weight-semibold)` | `1.3333` |
| `--text-heading-2-*` | `var(--font-size-xl)` | `var(--font-weight-semibold)` | `1.4` |
| `--text-heading-3-*` | `var(--font-size-lg)` | `var(--font-weight-semibold)` | `1.4118` |
| `--text-heading-4-*` | `var(--font-size-base)` | `var(--font-weight-semibold)` | `1.4286` |
| `--text-heading-5-*` | `var(--font-size-sm)` | `var(--font-weight-semibold)` | `1.6667` |
| `--text-heading-6-*` | `var(--font-size-xs)` | `var(--font-weight-semibold)` | `1.6` |

**Text roles (5 × 3 = 15)**

| Role | `-size` | `-weight` | `-leading` |
| --- | --- | --- | --- |
| `--text-body-*` | `var(--font-size-base)` | `var(--font-weight-normal)` | `1.4286` |
| `--text-large-*` | `var(--font-size-lg)` | `var(--font-weight-semibold)` | `1.4118` |
| `--text-label-*` | `var(--font-size-base)` | `var(--font-weight-medium)` | `1.4286` |
| `--text-code-*` | `var(--font-size-base)` | `var(--font-weight-normal)` | `1.4286` |
| `--text-supporting-*` | `var(--font-size-sm)` | `var(--font-weight-normal)` | `1.6667` |

**Display roles (3 × 3 = 9)**

| Role | `-size` | `-weight` | `-leading` |
| --- | --- | --- | --- |
| `--text-display-1-*` | `var(--font-size-5xl)` | `var(--font-weight-normal)` | `1.2381` |
| `--text-display-2-*` | `var(--font-size-4xl)` | `var(--font-weight-normal)` | `1.2571` |
| `--text-display-3-*` | `var(--font-size-3xl)` | `var(--font-weight-normal)` | `1.2414` |

### 1.15 Syntax domain tokens (14)

`packages/core/src/theme/syntax/tokens.ts`. Defaults are `var()` references into the theme's own palette so syntax colors auto-adapt to any theme.

| Token | Default | Meaning |
| --- | --- | --- |
| `--color-syntax-keyword` | `var(--color-text-accent)` | `if`, `return`, `const` |
| `--color-syntax-string` | `var(--color-text-green)` | string literals |
| `--color-syntax-comment` | `var(--color-text-secondary)` | comments |
| `--color-syntax-number` | `var(--color-text-orange)` | numeric literals |
| `--color-syntax-function` | `var(--color-text-blue)` | function/method names |
| `--color-syntax-type` | `var(--color-text-purple)` | types, interfaces, classes |
| `--color-syntax-variable` | `var(--color-text-primary)` | identifiers |
| `--color-syntax-operator` | `var(--color-text-cyan)` | `=`, `+`, `=>`, `&&` |
| `--color-syntax-constant` | `var(--color-text-orange)` | `true`, `false`, `null` |
| `--color-syntax-tag` | `var(--color-text-red)` | HTML/JSX tags |
| `--color-syntax-attribute` | `var(--color-text-teal)` | HTML/JSX attributes |
| `--color-syntax-property` | `var(--color-text-cyan)` | object properties |
| `--color-syntax-punctuation` | `var(--color-text-disabled)` | brackets, semicolons |
| `--color-syntax-background` | `var(--color-background-muted)` | code surface |

### 1.16 Data-viz domain tokens (56)

`packages/core/src/theme/domainTokens/dataTokens.ts`.

- **Categorical (10):** `--color-data-categorical-{blue,orange,purple,green,pink,cyan,red,teal,brown,indigo}`
- **Neutral (1):** `--color-data-neutral`
- **Sequential ramps (9 hues × 5 stops = 45):** `--color-data-{blue,shamrock,orange,pink,purple,red,teal,yellow,gray}-{1..5}` where 5 = darkest, 1 = lightest.

Note: every data token except `--color-data-gray-*` and `--color-data-neutral` uses the *same* value on both sides of `light-dark()` — the categorical palette is mode-invariant by design.

---

## 2. How a theme is authored

### 2.1 The `DefineThemeInput` surface — every field a theme author can set

From `packages/core/src/theme/defineTheme.ts`:

```ts
interface DefineThemeInput {
  name: string;                      // REQUIRED — drives data-astryx-theme="<name>"
  extends?: DefinedTheme;            // base theme; lowest precedence
  typography?: TypographyConfig;     // scale + body/heading/code font roles
  motion?: MotionScaleConfig;        // { fast, medium, slow?, ratio, easing? }
  radius?: RadiusScaleConfig;        // { base, multiplier }
  color?: ColorScaleConfig;          // { accent, neutralStyle?, contrast? } — HCT generative
  tokens?: Partial<Record<TokenName, TokenValue>>;   // flat CSS-var overrides
  components?: ComponentStyleMap;    // per-component / per-variant CSS overrides
  icons?: Partial<IconRegistry>;     // semantic icon name -> React node
  syntax?: SyntaxThemeDefinition;    // default code-highlighting palette
  onDark?: OnMediaOverrides;         // overrides for content on a dark surface
  onLight?: OnMediaOverrides;        // overrides for content on a light surface
}
```

`TokenValue = string | [light: string, dark: string]`. A tuple is compiled to `light-dark(light, dark)` at `defineTheme()` time. A bare string is used verbatim for both modes.

### 2.2 Precedence order inside `defineTheme()`

Exact order the implementation applies (later wins):

0. `extends` base theme's `tokens`
1. `color` → `expandColorScale()` (HCT-derived color tokens)
1a. `typography.scale` → `expandTypeScale()` (raw `--font-size-*` + semantic `--text-*`)
1b. `radius` → `expandRadiusScale()`
1c. `motion` → `expandMotionScale()`
1d. `typography.{body,heading,code}` → `--font-family-*` (heading inherits body if omitted)
1e. `syntax` → `--color-syntax-*` (prefixed from the 14 short keys)
2. **`tokens` — explicit overrides, highest precedence**
3. `components`: generated-from-typeScale (lowest) → `input.components` → base theme's components deep-merged underneath
4. `onDark` / `onLight` resolved into `__onDark` / `__onLight`
5. `icons` merged (`{...base.icons, ...input.icons}`)

### 2.3 Output shape (`DefinedTheme`)

```ts
interface DefinedTheme {
  name: string;
  tokens: Record<string, string>;   // fully resolved to CSS strings
  components?: ComponentStyleMap;
  icons?: Partial<IconRegistry>;
  __built?: true;                   // set only by `astryx theme build` output
  __inputTokens?: Partial<Record<string, TokenValue>>;  // preserves [light,dark] tuples
  __onDark?: ResolvedOnMedia;
  __onLight?: ResolvedOnMedia;
}
```

### 2.4 The neutral theme, field by field

`packages/themes/neutral/src/neutralTheme.ts` (634 lines) uses: `name`, `typography`, `motion`, `syntax`, `tokens`, `components`, `icons`. It does **not** use `extends`, `color`, `radius`, `onDark`, or `onLight`.

```ts
const neutralSyntax = defineSyntaxTheme({
  name: 'xds-neutral',
  tokens: { keyword: ['#700084','#efa8ff'], string: [...], /* all 14 */ },
});

export const neutralTheme = defineTheme({
  name: 'neutral',
  typography: {
    scale: {base: 14, ratio: 1.2},
    body:    {family: 'Figtree', fallbacks: '-apple-system, ...'},
    heading: {family: 'Figtree', fallbacks: '...', weights: {3: 'bold', 4: 'bold'}},
    code:    {family: 'ui-monospace', fallbacks: '"SF Mono", Monaco, ...'},
  },
  motion: {fast: 125, medium: 300, slow: 700, ratio: 0.75},
  syntax: neutralSyntax,
  tokens: { /* ~90 explicit overrides, mostly [light, dark] tuples */ },
  components: { button, badge, statusdot, banner, switch, progressbar, card, section },
  icons: neutralIconRegistry,
});
```

Key observations for the port:

- Every categorical hue is overridden as a `[light, dark]` tuple.
- One token references another token: `'--color-background-gray': ['#e5e5e5', 'var(--color-neutral)']`.
- Shadow tokens embed `light-dark()` *inside* a multi-layer shadow string (nested, not a tuple).
- The `card` / `section` overrides use `padding: 'var(--spacing-3)'` which the generator rewrites into `--astryx-card-padding` / `--astryx-section-padding` (see §4.4).

### 2.5 The other six themes

| Theme | `typography` | `motion` | `radius` | `syntax` | `components` | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| butter | ✔ | `{125,300,700,.75}` | — | ✔ | ✔ | has a `scripts/generate-palettes.mjs` |
| chocolate | ✔ | `{125,300,700,.75}` | — | ✔ | ✔ | |
| gothic | ✔ | `{150,350,800,.75}` | — | ✔ | ✔ | |
| matcha | ✔ | `{125,300,700,.75}` | — | ✔ | ✔ | |
| neutral | ✔ | `{125,300,700,.75}` | — | ✔ | ✔ | |
| stone | ✔ | `{125,300,700,.75}` | — | ✔ | ✔ | |
| y2k | ✔ | `{100,250,600,.8}` | `{base:4, multiplier:0}` | ✔ | ✔ | only theme using `radius` (sharp/brutalist) |

**No shipped theme uses `extends`, `color`, `onDark`, or `onLight`.** Those are consumer-facing extension points.

Every theme package has an identical file layout and identical build script:

```json
"build": "astryx theme build src/<name>Theme.ts -o dist/theme.css && tsup && tsc --project tsconfig.build.json"
```

---

## 3. The `astryx theme build` pipeline

Implementation: `packages/cli/src/commands/build-theme.mjs` (1258 lines), registered as `astryx theme build <file>` with `--out <path>` and `--watch`.

### 3.1 Stages

1. **Resolve + validate path.** `path.resolve(cwd, file)`; error `ERR_FILE_NOT_FOUND` if missing.
2. **Load the theme module.** `extractThemeDefinition()` → `importThemeModule()` uses **jiti** (`createJiti(..., {moduleCache: false, jsx: true})`) so a raw `.ts` theme file with JSX icon imports can be evaluated in Node. It imports the module and finds the first export matching `isThemeObject()` (`typeof name === 'string' && typeof tokens === 'object'`). Falls back to a regex+eval legacy extractor if jiti throws.
3. **Sanitize the theme name.** `sanitizeName()` rejects path separators / traversal — the name derives the output filenames.
4. **Validate component overrides.** `validateComponentOverrides()` warns on unknown component names (checked against a hard-coded `KNOWN_COMPONENTS` table of ~60 components and their visual props) and unknown prop names, with Levenshtein-ish "did you mean" suggestions. Warnings only — non-fatal.
5. **Validate private vars.** `validatePrivateVars()` **errors** if any component override sets a `--_*` property directly (those are pipeline-internal).
6. **Generate CSS via core's generator.** The CLI hard-imports `@astryxdesign/core/theme` and uses `generateThemeRulesSplit()` + `generateOnMediaCSS()`. There is deliberately **no in-CLI fallback generator** — if core can't be imported the build fails with `ERR_CORE_NOT_FOUND`. This guarantees the CLI and the `<Theme>` runtime emit byte-identical CSS.
7. **Assemble the CSS layers** (see §3.2).
8. **Generate the built JS module** (`generateBuiltModule`), the `.d.ts` (`generateBuiltTypes`), and — if the theme introduces custom variant values — a `.variants.d.ts` of TypeScript module augmentations (`generateVariantDeclarationsAsync`).
9. **Atomic-ish write.** All four files are staged as `<dest>.<pid>.tmp` then `renameSync`'d into place; partials are rolled back on failure. Never a half-built output set.

### 3.2 CSS assembly (exact structure)

```
/* @generated header with source path, command, timestamp */

@layer reset {
@scope ([data-astryx-theme="<name>"]) to ([data-astryx-theme]) {
  ...prose rules (:where(h1..h6), :where(p), :where(small), :where(code,pre), :where(hr))...
}
}

@layer astryx-theme {
  :root { color-scheme: light dark; }
  html[data-theme="light"] { color-scheme: light; }
  html[data-theme="dark"] { color-scheme: dark; }

@scope ([data-astryx-theme="<name>"]) to ([data-astryx-theme]) {
  :scope { --token: value; ... }       /* full token block */
  .astryx-<component><suffix> { ... }  /* component overrides */
  .astryx-text.<colorName> { ... }     /* prop-level color overrides */
}
}

@layer astryx-theme {
@scope ([data-astryx-theme="<name>"]) to ([data-astryx-theme]) {
  [data-astryx-media="dark"]  { color-scheme: dark;  --color-text-primary: var(--color-on-dark); ... }
  [data-astryx-media="light"] { color-scheme: light; --color-text-primary: var(--color-on-light); ... }
}
}
```

Notes:

- The `:root { color-scheme: light dark }` + `html[data-theme=...]` block is emitted **only when the generated CSS contains `light-dark(`** (issue #3658). This is what makes `<Theme mode>` able to override `color-scheme` at higher specificity than `reset.css`'s `:where()` rules.
- The two-layer split is load-bearing: prose defaults go into `@layer reset` (zero-specificity `:where()`, so any class-based style wins); token + component overrides go into `@layer astryx-theme` which sits **above** the StyleX layers so theme overrides beat compiled StyleX atomics.
- `@scope (...) to ([data-astryx-theme])` means the theme stops at a nested theme boundary — nested `<Theme>` works.
- The on-media block is a **separate `@scope`** so it can reach `[data-astryx-media]` elements.

### 3.3 Emitted artifacts (for `neutral`)

| File | Content |
| --- | --- |
| `dist/theme.css` | 18.3 KB of pure CSS (verified in `node_modules`) |
| `dist/neutral.js` | `export const neutralTheme = { name: 'neutral', __built: true, tokens: {...}, icons: neutralIconRegistry }` — **no `components` field**, all component styling lives in the CSS |
| `dist/neutral.d.ts` | `export declare const neutralTheme: DefinedTheme` + `/// <reference path="./neutral.variants.d.ts" />` |
| `dist/neutral.variants.d.ts` | `declare module '@astryxdesign/core/Badge' { interface BadgeVariantMap { 'gray': true } }` |

The `__built: true` flag makes `<Theme>` skip runtime `<style>` injection entirely.

### 3.4 Custom-variant type augmentation

`generateVariantDeclarationsAsync()`:

1. Walks `theme.components` keys, splits on `+`, then on the first `:` → `{component, prop, value}`.
2. Loads the component's *known* built-in values by importing `packages/core/src/<Component>/<Component>.doc.mjs` and parsing the union type string from `doc.props[].type` for props listed in `doc.theming.targets[].visualProps`.
3. Any value NOT in the known list is a **custom variant**.
4. Emits `declare module '@astryxdesign/core/<Pascal>' { interface <Pascal><Prop>Map { '<value>': true } }` — but only if that `*Map` interface actually exists in core's shipped `dist/<Pascal>/index.d.ts`. Closed literal unions (Button `size`, Heading `level`) have no augmentation point and are skipped.

For neutral, the only custom value was `badge` `variant:gray` → `BadgeVariantMap`.

### 3.5 Watch mode

`--watch` re-invokes the CLI's own bin as a child process (`resolveCliBin()` → `bin/astryx.mjs`) on every change to the theme file. Not supported with `--json`.

---

## 4. Component-level variant overrides

This is the mechanism the Button doc comment refers to ("Themes can provide component-level variant overrides via `theme.components.button.variants`"). **The doc comment's path is inaccurate** — the actual shape is `theme.components.button['variant:<value>']`, not `.variants`. There is no `variants` key anywhere in the type system. Treat the comment as stale.

### 4.1 The authoring shape

```ts
type ComponentStyleMap = Record<string, Record<string, StyleOverrides>>;
type StyleOverrides   = Record<string, string | Record<string, string>>;
```

- **Outer key** = lowercase component name (`button`, `badge`, `statusdot`, `progressbar`, …).
- **Middle key** = a *style key*:
  - `base` → applies to all instances
  - `prop:value` → e.g. `variant:secondary`
  - `prop:value+prop:value` → intersection, e.g. `variant:destructive+size:sm`
  - a bare state name → e.g. `checked`, `disabled`, `selected`
- **Inner** = camelCase CSS properties → string values, **or** a pseudo-class key (`:hover`, `:focus-visible`, `:active`, …) → a nested property object.

Values may be raw CSS, `var(--token)` references, `light-dark(a, b)`, `color-mix(...)`, **or CSS custom property assignments** (a theme can set `--color-accent: '#0074e2'` scoped to `.astryx-progressbar.accent` — this is how neutral re-tints ProgressBar).

### 4.2 Style key → selector (`parseStyleKey`)

`packages/core/src/utils/parseStyleKey.ts`:

| Key | Suffix |
| --- | --- |
| `base` | `''` |
| `checked` | `.checked` |
| `checked+disabled` | `.checked.disabled` |
| `variant:secondary` | `.secondary` |
| `level:1` | `.level-1` (digit-leading values get prop-prefixed) |
| `variant:destructive+size:sm` | `.destructive.sm` |

Full selector = `.astryx-<component><suffix>` (`componentClassSelector` in `generateThemeRules.ts`, prefix from `naming.ts`).

### 4.3 `themeProps()` — the DOM side of the contract

`packages/core/src/utils/themeProps.ts`. It is a **pure string builder with no React dependency**:

```ts
themeProps('button', {variant: 'primary', size: 'sm'})
// → { className: 'astryx-button primary sm',
//     'data-variant': 'primary',
//     'data-size': 'sm' }
```

Three exported/internal pieces:

- `buildClassName(component, props)` → `[stableClassName(component), ...values]`. Values whose first char is a digit get prefixed with the prop name (`level: 1` → `level-1`) because CSS class names can't start with a digit.
- `themeDataAttributes(props)` → kebab-cases the prop name (`listStyle` → `data-list-style`) and keeps the **literal** value (`level: 1` → `data-level="1"`).
- `themeProps(component, props)` = `{className, ...dataAttributes}`.

Nullish prop values are skipped in both.

Button uses it exactly once, at line 699 of `Button.tsx`:

```tsx
const sharedMergedProps = mergeProps(
  themeProps('button', {variant, size}),
  sharedStylexProps, className, style,
);
```

The `data-*` reflection is a forward-migration surface — generated theme CSS currently still targets the bare class selectors (`.astryx-button.destructive`), not `[data-variant="destructive"]`. Both are emitted in the DOM.

**Svelte port:** copy `themeProps.ts` verbatim (it's plain TS), and spread it. In Svelte 5:

```svelte
<button {...themeProps('button', {variant, size})} class:...>
```
Note Svelte uses `class` not `className` — the port needs a one-line adapter that renames the key, or a `themeProps` variant that returns `{class, ...}`.

### 4.4 Derived vars and container padding

`generateComponentRules()` does two rewrites before emitting declarations:

**(a) Derived var expansion** — `derivedVarRegistry.ts` maps `(component, cssProperty)` → internal `--_*` vars. When a theme sets a registered property, the generator emits the internal var **in addition**:

| Component | Property | Emits |
| --- | --- | --- |
| `banner` | `borderRadius` | `--_banner-radius` |
| `button` | `borderRadius` | `--_button-radius` |
| `card` | `borderRadius` | `--_card-radius`; `padding` → container expansion |
| `chat` | `borderRadius`, `padding` | `--_chat-composer-radius`, `--_chat-composer-padding` |
| `dialog` | `borderRadius` | `--_dialog-radius`; `padding` → container expansion |
| `dropdown-menu` | `borderRadius`, `padding` | `--_dropdown-menu-radius`, `--_dropdown-menu-padding` |
| `field` | `borderRadius` | `--_field-radius` |
| `hovercard` | `borderRadius` | `--_hovercard-radius` |
| `popover` | `borderRadius` | `--_popover-radius` |
| `section` | `padding` | container expansion |
| `segmented-control` | `borderRadius`, `padding` | `--_segmented-control-radius`, `--_segmented-control-padding` |

Themes are **forbidden** from setting `--_*` directly (`validatePrivateVars` errors).

**(b) Container padding expansion** — for components with `expand: 'container'`, a `padding` declaration is *replaced* by public namespaced tokens. `card: {base: {padding: 'var(--spacing-3)'}}` becomes:

```css
.astryx-card { --astryx-card-padding: var(--spacing-3); }
```

Verified in the shipped `theme.css` (lines 494–500). Asymmetric padding expands to `-inline-start`, `-inline-end`, `-block-start`, `-block-end` variants. The component's StyleX default reads `var(--astryx-card-padding, <default>)` — so the theme sets the variable and the component picks it up via cascade, sidestepping any layer competition with StyleX output.

### 4.5 Prop-level color overrides

If a theme's `components` map touches `text`, `heading`, or `link`, the generator additionally emits five color rules per touched component, so a theme's token change can't be beaten by a StyleX color-prop class:

```css
.astryx-text.primary   { color: var(--color-text-primary); }
.astryx-text.secondary { color: var(--color-text-secondary); }
.astryx-text.disabled  { color: var(--color-text-disabled); }
.astryx-text.placeholder { color: var(--color-text-secondary); }
.astryx-text.accent    { color: var(--color-text-accent); }
```

(neutral's `typography.scale` auto-generates `text` + `heading` component maps, so these fire — visible at theme.css lines 502–521.)

### 4.6 Auto-generated component rules from `typography.scale`

`generateTypeScaleComponents()` produces, unconditionally when `typography.scale` is set:

- `heading` → `level:1` … `level:6`, each with `fontFamily/fontSize/fontWeight/lineHeight` pointing at `--text-heading-N-*`
- `text` → `type:{body,large,label,code,supporting,display-1,display-2,display-3}`, each with `fontFamily/fontSize/lineHeight`

These are deep-merged *underneath* the theme author's explicit `components`.

### 4.7 What this means for the Svelte port

**Component variant overrides need ZERO runtime support.** They are already compiled into `theme.css` as class selectors. A Svelte component only has to:

1. Render `class="astryx-<component> <variantValue> <sizeValue>"` (i.e. reimplement `buildClassName`).
2. Render the matching `data-*` attributes (for external consumers).
3. Read container padding through the same `var(--astryx-<component>-padding, <default>)` fallback chain the React component uses.

The only thing that would require JS is *runtime-defined* themes (unbuilt `defineTheme` + `<Theme>` style injection). If astryx-svelte only ever consumes pre-built theme CSS, `generateThemeRules.ts` does not need to be ported at all.

---

## 5. `useTheme()`

### 5.1 What it returns

```ts
interface UseThemeReturn {
  name: string;                    // theme name, or 'default'
  mode: 'light' | 'dark';          // effective mode — never 'system'
  token: (name: string) => string; // one resolved raw CSS value
  tokens: Record<string, string>;  // all 256 tokens resolved for the mode
}
```

Values are **concrete raw values** (hex, px), not `var()` references — that's the whole point. Non-CSS consumers (canvas, SVG, Vega/D3) need real values.

### 5.2 How it resolves

1. `use(ThemeContext)` — the nearest `<Theme>` provides `{theme, mode}`.
2. If there is **no** context, it falls back to reading `<html data-theme>` via a **single shared, refcounted `MutationObserver`** wired through `useSyncExternalStore`. Provider-path consumers subscribe to a no-op store instead (the "args-switch" technique) so mounting under a `<Theme>` never creates an observer.
3. `mode === 'system'` resolves via `useMediaQuery('(prefers-color-scheme: dark)')`.
4. `resolveThemeTokens(theme, {mode})` from `tokens.ts` does the actual work:
   - seed from `tokenDefaults` (all 256), picking the light or dark side of each `light-dark()`
   - overlay `theme.tokens`
   - re-overlay `theme.__inputTokens` so explicit `[light, dark]` tuples keep their original sides without string parsing
   - **resolve references**: follow `var(--x[, fallback])` chains through the map iteratively with cycle guarding, then **evaluate `color-mix(in srgb, …)`** in JS (full CSS Color 5 premultiplied-sRGB algorithm, including the `<100%` alpha multiplier). This is ~230 lines of `tokens.ts`.

### 5.3 Who actually uses it

| File | Usage |
| --- | --- |
| `packages/core/src/Spinner/Spinner.tsx` | `const {tokens} = useTheme()` — canvas ring colors |
| `packages/core/src/Toast/Toast.tsx` | `const {mode} = useTheme()` — picks `MediaTheme mode` (inverse of page mode) |
| `packages/core/src/Markdown/Markdown.tsx` | `const {token} = useTheme()` — reads `--duration-fast-max` / `--duration-fast-min` to compute streaming span count |
| `packages/core/src/hooks/useStreamingText.ts` | motion-token-derived animation timing |
| `packages/charts/src/useChartColors.ts` | data-viz palette |
| `packages/lab/src/Chart/useChartColors.ts` | data-viz palette |
| `packages/cli/templates/blocks/.../useThemeHookUsage.tsx` | template/example only |

That's it — **6 real consumers**, all of which want either raw color values for a canvas/chart or a duration in ms.

### 5.4 Recommended Svelte replacement

**Primary: `getComputedStyle` on a real element.** This is already proven in `D:\astryx-svelte\src\lib\astryx\Spinner\Spinner.svelte`:

```ts
const computed = getComputedStyle(canvas);
const token = (name: string) => computed.getPropertyValue(name).trim();
const inheritedColor = computed.color;
```

Why this is *better* than porting `useTheme`:

- The browser does all the work `tokens.ts` painstakingly reimplements — `light-dark()` selection, `var()` chain following, `color-mix()` evaluation — correctly and for free.
- It automatically respects nested `@scope`, `[data-astryx-media]` overrides, and component-scoped token overrides (e.g. neutral's `.astryx-progressbar.accent { --color-accent: #0074e2 }`), which the JS resolver **cannot** see because it only knows the theme object, not the DOM position.
- Zero code to maintain, zero theme-object import, no React context equivalent.

**Caveats and the shape of the API to build:**

1. **SSR.** `getComputedStyle` is client-only. Wrap in `$effect` / `onMount`. Nothing in the current component set needs token values during SSR (Spinner draws on a canvas post-mount).
2. **Reactivity.** Computed values don't push updates. If a component must re-read after a mode flip, subscribe to the same signals `<Theme>` uses: a `MutationObserver` on `document.documentElement` for `data-theme`, plus `window.matchMedia('(prefers-color-scheme: dark)')`. Build one shared, refcounted store (mirroring `subscribeRootThemeAttr` in `useTheme.ts`) and expose it as a Svelte store / rune.
3. **Effective mode.** Port this as a tiny rune rather than a whole token resolver:
   ```ts
   // resolvedMode: 'light' | 'dark'
   //   ctx?.mode ?? <html data-theme> ?? (prefers-color-scheme: dark ? 'dark' : 'light')
   ```
   Toast is the only consumer that needs `mode` alone.
4. **A JS-side token map is only needed if** you later port charts (`useChartColors`) and want values *without* a mounted element. Even then, prefer mounting a hidden probe element and reading `--color-data-*` off it.

**Recommendation: do not port `resolveThemeTokens` / the `color-mix` evaluator.** Provide:

```ts
// src/lib/astryx/theme.ts
export function readTokens(el: Element): (name: string) => string;   // getComputedStyle wrapper
export function resolvedMode(): 'light' | 'dark';                    // rune, reactive
```

`src/lib/astryx/context.ts` already exists — that's the natural home.

---

## 6. Dark mode

### 6.1 The mechanism

Every color token is `light-dark(<light>, <dark>)`. CSS resolves `light-dark()` against the **used value of `color-scheme`** on the element. So dark mode is *entirely* a `color-scheme` switch — there is no separate dark token set, no `.dark` class, no media-query duplication of the token block.

### 6.2 Where `color-scheme` gets set — four places, in cascade order

**(1) `packages/core/src/reset.css` — baseline, zero specificity**

```css
:where(html) { ...; color-scheme: light dark; }

:where(html[data-theme="light"]) { color-scheme: light; }
:where(html[data-theme="dark"])  { color-scheme: dark; }
:where(html:not([data-theme]))   { color-scheme: light dark; }

:where([data-astryx-media="dark"])  { color-scheme: dark; }
:where([data-astryx-media="light"]) { color-scheme: light; }
```

`light dark` (both keywords) = "follow the OS preference", which is how `mode: 'system'` works.

**(2) Built `theme.css` — higher specificity (emitted only when the CSS contains `light-dark(`)**

```css
@layer astryx-theme {
  :root { color-scheme: light dark; }
  html[data-theme="light"] { color-scheme: light; }
  html[data-theme="dark"]  { color-scheme: dark; }
  ...
}
```

These are non-`:where()` so they outrank reset.css. Issue #3658 — this is what lets `<Theme mode>` win.

**(3) The `<Theme>` wrapper div** — StyleX classes `colorScheme: 'light' | 'dark' | 'light dark'` applied to the `display: contents` wrapper. Present in the compiled `astryx.css` as `.xntwwlm{color-scheme:dark}`, `.x19aimcq{color-scheme:light}`, `.x108lcm5{color-scheme:light dark}`.

**(4) `<Theme>` root sync to `<html>`** — `useRootThemeSync()` in `Theme.tsx`. The *first* (non-nested) `<Theme>` writes to `document.documentElement`:

- `data-theme="light" | "dark"`, or **removes** it for `'system'`
- `data-astryx-theme="<name>"` — so `@scope`'d theme CSS reaches portals / toast fallback viewports rendered outside the wrapper

Setting `data-theme` on `<html>` is also what makes **browser chrome** (scrollbars, native form controls, date pickers) follow the mode.

### 6.3 SSR / flash prevention

Upstream's guidance (in `Theme.tsx` and `reset.css`): set the attribute server-side in the root layout —

```html
<html lang="en" data-theme="dark">
```

For SvelteKit: set it in `src/app.html` or via a `hooks.server.ts` `transformPageChunk` replacement, plus an inline pre-hydration script reading `localStorage`. Removing `data-theme` (not setting it to `"system"`) is the correct way to express system-follow.

### 6.4 On-media surfaces (`MediaTheme`)

For content on an inverted surface (dark toast on a light page, light popover on a dark page):

`<MediaTheme mode="dark">` renders `<div data-astryx-media="dark" style="display:contents; color:var(--color-text-primary)">`.

The theme CSS then supplies (from `onMediaTokens.ts` defaults, merged with any `onDark`/`onLight` the theme author set):

```css
[data-astryx-media="dark"] {
  color-scheme: dark;
  --color-text-primary: var(--color-on-dark);
  --color-icon-primary: var(--color-on-dark);
  --color-accent:       var(--color-on-dark);
}
[data-astryx-media="light"] {
  color-scheme: light;
  --color-text-primary: var(--color-on-light);
  --color-icon-primary: var(--color-on-light);
  --color-accent:       var(--color-on-light);
}
```

`color-scheme` flips **all** `light-dark()` tokens for the subtree; only these three need explicit overrides because they'd otherwise land on the mode's grey rather than a pure on-color. Parent theme *component* overrides deliberately pass through unchanged — only tokens change.

Verified present at the end of the shipped `theme.css`.

### 6.5 What the Svelte port must do

The current `+layout.svelte` sets `style="color-scheme: {scheme}"` inline on the theme div. That works but bypasses the `<html data-theme>` sync, which means:

- browser chrome (scrollbars, form controls) won't follow the mode
- portals rendered outside the div won't get the theme scope

**Recommended:** replicate `useRootThemeSync` — a small `$effect` in the root layout that writes/removes `data-theme` and writes `data-astryx-theme` on `document.documentElement`, plus set `data-astryx-theme` on the wrapper. Keep the inline `color-scheme` only as a nested/scoped override.

---

## 7. Syntax highlighting theme (`src/theme/syntax/`)

### 7.1 Files

| File | Role |
| --- | --- |
| `tokens.ts` | The 14 `--color-syntax-*` token defaults (§1.15) |
| `defineSyntaxTheme.ts` | `defineSyntaxTheme()`, `syntaxThemeStyle()`, `syntaxThemeToCSS()`, `resolveSyntaxTokenForMode()`, `ALL_SYNTAX_KEYS` |
| `SyntaxTheme.tsx` | `<SyntaxTheme>` provider + `useSyntaxTheme()` hook |
| `presets.ts` | 12 community presets |
| `index.ts` | Barrel |
| `THIRD_PARTY_LICENSES.md` | Attribution for the community presets |

### 7.2 The 14-token architecture

Validated against 11 community code themes — "all themes map cleanly to these 14 slots" (issue #1148). Keys are the short human names (`keyword`, `string`, …); the CSS property is `'--color-syntax-' + key`.

`defineSyntaxTheme({name, tokens})` accepts `string | [light, dark]` per key, resolves tuples to `light-dark()`, **warns (does not throw)** if any of the 14 are missing, and preserves `__inputTokens` so `useSyntaxTheme()` can pick a side without parsing.

### 7.3 Presets (12)

Dark: `oneDarkPro`, `dracula`, `monokai`, `nord`, `tokyoNight`, `catppuccinMocha`, `githubDark`
Light: `githubLight`, `solarizedLight`, `oneLight`, `catppuccinLatte`, `tokyoNightLight`

Grouped exports: `darkSyntaxPresets`, `lightSyntaxPresets`, `allSyntaxPresets`.

### 7.4 Two application paths

**Theme-level (compiled into `theme.css`).** `defineTheme({syntax: neutralSyntax})` → stage 1e of `defineTheme` writes all 14 into `theme.tokens` under the `--color-syntax-` prefix → they land in the `:scope { }` token block. Confirmed: the shipped `neutral/dist/theme.css` contains 14 `color-syntax` declarations, e.g. `--color-syntax-keyword: light-dark(#700084, #efa8ff);`.

**Region-level (runtime).** `<SyntaxTheme theme={dracula}>` renders `<div style={syntaxThemeStyle(theme)} data-astryx-syntax-theme={name}>` — inline custom properties, plus a React context. `useSyntaxTheme()` returns `{name, mode, token(key), tokens} | null` (null outside a provider). Note it resolves mode **only** from `prefers-color-scheme`, not from `<Theme mode>` — a known inconsistency with `useTheme()`.

### 7.5 Consumers

The `CodeBlock` component and anything rendering highlighted source. Not needed for the initial Svelte component set.

### 7.6 Svelte port note

Path 1 (theme-level) is free — it's already in `theme.css`. Path 2 is a 20-line Svelte component: set the 14 custom properties as inline style on a wrapper `div`. `defineSyntaxTheme` is pure TS and copies verbatim.

---

## 8. Recommendation: consume upstream theme packages verbatim

### 8.1 Verdict

**Consume `@astryxdesign/theme-<name>/theme.css` directly from npm. Do not republish, do not re-run `astryx theme build`, do not port the theme sources.**

### 8.2 Evidence

**(a) `theme.css` is framework-agnostic CSS.** The published `dist/theme.css` (18,343 bytes for neutral) contains only `@layer`, `@scope`, `:where()`, class selectors, and custom-property declarations. There is no JS, no React, no build-tool-specific syntax.

**(b) It is exported as a first-class subpath.** From `@astryxdesign/theme-neutral/package.json`:

```json
"exports": {
  ".":           { "types": "./dist/source.d.ts", "import": "./dist/source.mjs", "require": "./dist/source.js" },
  "./built":     { "types": "./dist/neutral.d.ts", "import": "./dist/neutral.js" },
  "./theme.css": { "types": "./theme.css.d.ts",   "default": "./dist/theme.css" }
}
```

The `./theme.css` entry has **no JS conditions at all** — it is a pure asset export designed for exactly this.

**(c) It already works in this repo, today.** `D:\astryx-svelte\src\routes\+layout.svelte` lines 6-8:

```ts
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
```

And `node_modules` confirms **React is not installed** in this project (`ls node_modules | grep react` → empty). The CSS import resolves and the tokens apply.

**(d) The activation contract is a DOM attribute, not a component.** `@scope ([data-astryx-theme="neutral"]) to ([data-astryx-theme])`. Any framework that can put `data-astryx-theme="neutral"` on a div activates the theme. Svelte can.

**(e) Component variant overrides need no runtime.** As established in §4, all of neutral's `components` overrides are compiled to plain class selectors (`.astryx-button.destructive`, `.astryx-badge.gray`, …). As long as the Svelte components emit the same `astryx-<component> <variant>` class strings, the overrides apply. `theme.css` never learns which framework rendered the DOM.

**(f) The version contract is stable.** `theme-neutral@0.1.7` peer-depends on `@astryxdesign/core@0.1.7` — an exact pin. Both are already installed at 0.1.7 in this repo. Token names and the `@scope` selector are the entire coupling surface, and both are namespaced through `packages/core/src/naming.ts` (`NAMESPACE = 'astryx'`).

### 8.3 What must NOT be imported

| Entry | Verdict | Why |
| --- | --- | --- |
| `@astryxdesign/theme-neutral/theme.css` | ✅ **use** | pure CSS, zero deps |
| `@astryxdesign/core/astryx.css` | ✅ **use** | `:root` token defaults + all pre-compiled StyleX atomics |
| `@astryxdesign/core/reset.css` | ✅ **use** | includes the `data-theme` → `color-scheme` mapping |
| `@astryxdesign/theme-neutral` (`.` / `source.mjs`) | ❌ **avoid** | re-exports `neutralIconRegistry` from `icons.tsx` → `import React`, `lucide-react`. Pulls React into the graph. |
| `@astryxdesign/theme-neutral/built` (`neutral.js`) | ⚠️ **avoid** | also imports `./icons` (React). The `tokens` object inside is useful data but not worth the dependency. |
| `@astryxdesign/core/theme` (`defineTheme` etc.) | ❌ **not needed** | only required if you author/compile themes at runtime |

### 8.4 The one real gap: icons

`theme.css` carries tokens and component styling but **not icons**. Each theme package ships a `IconRegistry` mapping semantic names → React nodes (neutral uses `lucide-react`). This is the only genuinely React-bound part of a theme package.

Options for astryx-svelte, in order of preference:

1. **Use `lucide-svelte`** and hand-author a registry with the same semantic key names. The registry keys are the contract (`IconRegistry` from `@astryxdesign/core/Icon`); the values are just renderable nodes. Neutral's `icons.tsx` is a flat name→component map that transcribes mechanically.
2. Inline the needed SVG paths directly in the Svelte components. Fewer deps, more code.
3. Skip theme-supplied icons entirely for now — none of the three ported components (Button, Spinner, VisuallyHidden) consume the registry.

### 8.5 What we DO need to build ourselves

| Piece | Effort | Notes |
| --- | --- | --- |
| `<Theme>` equivalent (attribute writer + root `<html>` sync) | Small | ~40 lines; port `useRootThemeSync` logic |
| `themeProps()` | Trivial | Copy the file; rename `className` → `class` for Svelte |
| `<MediaTheme>` equivalent | Trivial | A div with `data-astryx-media={mode}` + `display: contents` |
| `resolvedMode` rune + shared `data-theme` observer | Small | Replaces `useTheme().mode` for Toast-like cases |
| `readTokens(el)` via `getComputedStyle` | Trivial | Already proven in `Spinner.svelte` |
| Icon registry | Medium | See §8.4 |
| `<SyntaxTheme>` equivalent | Trivial | Only if CodeBlock is ported |
| `defineTheme` / `generateThemeRules` / `resolveThemeTokens` | **Skip** | Only needed for runtime-authored themes or a JS token map |

### 8.6 If we ever need a *custom* theme

Run upstream's own toolchain against a TS theme source — it's framework-agnostic:

```
npx astryx theme build ./src/themes/mytheme.ts -o ./src/lib/themes/mytheme.css
```

The CLI needs a resolvable, built `@astryxdesign/core` (it hard-fails with `ERR_CORE_NOT_FOUND` otherwise) — which we have installed. It emits `.css` + `.js` + `.d.ts`; we'd import only the `.css`. **No republishing of upstream's themes is required in any scenario.**

---

## Appendix A — Cascade order (must be preserved)

```
1. @layer reset            ← @astryxdesign/core/reset.css  +  theme.css prose block
2. @layer astryx-base      ← @astryxdesign/core/astryx.css (StyleX atomics + :root token defaults)
3. @layer astryx-theme     ← theme.css token block, component overrides, on-media block
```

The current `+layout.svelte` import order (reset → astryx → theme) is correct. Because these are real `@layer`s, source order of the *imports* matters less than layer declaration order, but keeping imports in this order avoids any ambiguity about first-declaration wins.

## Appendix B — DOM attribute contract

| Attribute | Set by | Purpose |
| --- | --- | --- |
| `data-astryx-theme="<name>"` | `<Theme>` wrapper **and** `<html>` (root sync) | activates the `@scope`; the `<html>` copy lets scoped CSS reach portals |
| `data-theme="light" \| "dark"` | `<html>` (root sync); omitted for `system` | drives `color-scheme` → `light-dark()` + browser chrome |
| `data-astryx-media="dark" \| "light"` | `<MediaTheme>` | inverted-surface token context |
| `data-astryx-syntax-theme="<name>"` | `<SyntaxTheme>` | marker only; the styling is inline custom properties |
| `class="astryx-<component> <variant> <size>"` | `themeProps()` | what theme component overrides target |
| `data-<prop>="<value>"` | `themeProps()` | forward-migration selector surface (not yet targeted by generated CSS) |
