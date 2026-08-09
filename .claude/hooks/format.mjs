// PostToolUse hook: format the file Claude just wrote with the prettier that
// owns it. Prettier is a devDependency of `packages/core` and `docs`, not the
// root, and each carries its own `prettier.config.js` — so we resolve both the
// binary and the config from the edited file's location rather than assuming a
// single workspace-wide install. Files with no reachable prettier (or no parser
// for their extension) are left alone.
//
// Node rather than a shell one-liner because `jq` isn't on PATH here and the
// quoting would have to survive whichever shell Claude Code invokes on Windows.

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const exit = () => process.exit(0);

const stdin = await new Promise((resolve) => {
	let buf = '';
	process.stdin.setEncoding('utf8');
	process.stdin.on('data', (d) => (buf += d));
	process.stdin.on('end', () => resolve(buf));
	process.stdin.on('error', () => resolve(''));
});

let file;
try {
	const payload = JSON.parse(stdin);
	file = payload?.tool_response?.filePath ?? payload?.tool_input?.file_path;
} catch {
	exit();
}
if (!file) exit();

const abs = path.resolve(file);
try {
	await fs.access(abs);
} catch {
	exit();
}

let prettier;
try {
	// prettier's entry point is CJS, so the import namespace wraps it in `default`.
	const mod = await import(pathToFileURL(createRequire(abs).resolve('prettier')).href);
	prettier = mod.default ?? mod;
} catch {
	exit(); // no prettier owns this file
}

try {
	const { inferredParser, ignored } = await prettier.getFileInfo(abs, { resolveConfig: true });
	if (ignored || !inferredParser) exit();

	const config = (await prettier.resolveConfig(abs)) ?? {};

	// Plugin names in a config file are resolved relative to the *current working
	// directory*, not the config that declared them — so `prettier-plugin-svelte`
	// is unfindable whenever the hook runs from the repo root. Resolve the names
	// to absolute paths ourselves, from the config file that named them.
	const configFile = await prettier.resolveConfigFile(abs);
	if (configFile && Array.isArray(config.plugins)) {
		const requireFromConfig = createRequire(configFile);
		config.plugins = config.plugins.map((plugin) => {
			if (typeof plugin !== 'string') return plugin;
			try {
				return requireFromConfig.resolve(plugin);
			} catch {
				return plugin;
			}
		});
	}

	const src = await fs.readFile(abs, 'utf8');
	const out = await prettier.format(src, { ...config, filepath: abs });
	if (out !== src) await fs.writeFile(abs, out, 'utf8');
} catch {
	// A syntax error mid-edit is normal; never fail the hook over it.
	exit();
}
