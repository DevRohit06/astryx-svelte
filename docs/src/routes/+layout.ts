/**
 * The whole site is static: every page renders from the generated registries,
 * which are build-time data. Prerendering at the root means the gallery and the
 * home page are files too, not just the two parameterised route trees.
 */
export const prerender = true;
