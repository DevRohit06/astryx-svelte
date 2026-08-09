<!--
	Ported from upstream's `templates/blocks/components/CodeBlock/CodeBlockHighlightedLines.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CodeBlock } from '@astryx-svelte/core';

	const code = `interface User {
  id: string;
  name: string;
}

export function useUser(id: string) {
  const [user, setUser] = useState<User>();
  useEffect(() => {
    fetchUser(id).then(setUser);
  }, [id]);
  return user;
}`;
</script>

<CodeBlock
	{code}
	language="typescript"
	title="useUser.ts"
	hasLineNumbers
	highlightLines={[8, 9, 10]}
/>
