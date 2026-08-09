<!--
	Ported from upstream's `templates/blocks/components/CodeBlock/CodeBlockShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CodeBlock } from '@astryx-svelte/core';

	const code = `import {useState, useEffect} from 'react';

export function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch(\`/api/users/\${id}\`)
      .then(res => res.json())
      .then(setUser);
  }, [id]);

  return user;
}`;
</script>

<CodeBlock {code} language="typescript" title="useUser.ts" hasLineNumbers hasCopyButton />
