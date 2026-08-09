<!--
	Ported from upstream's `templates/blocks/components/CodeBlock/CodeBlockJSONConfig.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CodeBlock } from '@astryx-svelte/core';

	const code = `{
  "name": "@astryxdesign/core",
  "version": "0.0.5",
  "dependencies": {
    "@astryxdesign/theme-neutral": "^0.1.0",
    "react": "^19.0.0"
  },
  "scripts": {
    "build": "tsup",
    "test": "vitest"
  }
}`;
</script>

<CodeBlock {code} language="json" title="package.json" hasLineNumbers />
