<!--
	Ported from upstream's `templates/blocks/components/ChatToolCalls/ChatToolCallsInteractiveToolCalls.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`resultDetail` is `string | Snippet` here where upstream types it `ReactNode`,
	and a snippet only exists in template scope — so the two calls that carry a
	`CodeBlock` get theirs where the array is written, in the prop expression.
-->
<script lang="ts">
	import type { ChatToolCallItem } from '@astryx-svelte/core';
	import { ChatToolCalls, CodeBlock } from '@astryx-svelte/core';

	const editDiff = `--- a/src/utils/formatDate.ts
+++ b/src/utils/formatDate.ts
@@ -8,7 +8,11 @@
-export function formatDate(date: Date): string {
-  return date.toLocaleDateString();
-}
+export function formatDate(
+  date: Date,
+  locale = 'en-US',
+  options?: Intl.DateTimeFormatOptions,
+): string {
+  return new Intl.DateTimeFormat(locale, options).format(date);
+}`;

	const testOutput = `$ yarn test
 PASS  src/utils/formatDate.test.ts
 PASS  src/components/DatePicker.test.tsx

Test Suites: 2 passed, 2 total
Tests:       14 passed, 14 total
Time:        1.8s`;

	const editCall: ChatToolCallItem = {
		name: 'edit',
		target: 'src/utils/formatDate.ts',
		status: 'complete',
		duration: '85ms',
		node: 'cli:remote-server',
		additions: 6,
		deletions: 3
	};

	const bashCall: ChatToolCallItem = {
		name: 'bash',
		target: 'yarn test',
		status: 'complete',
		duration: '1.8s',
		node: 'cli:remote-server'
	};

	const searchCall: ChatToolCallItem = {
		name: 'web_search',
		target: 'Intl.DateTimeFormat locale options',
		status: 'complete',
		duration: '1.2s'
	};
</script>

{#snippet editDetail()}
	<CodeBlock code={editDiff} language="typescript" maxHeight="50vh" />
{/snippet}

{#snippet testDetail()}
	<CodeBlock code={testOutput} language="bash" maxHeight="50vh" />
{/snippet}

<ChatToolCalls
	defaultIsExpanded
	calls={[
		{ ...editCall, resultDetail: editDetail },
		{ ...bashCall, resultDetail: testDetail },
		searchCall
	]}
/>
