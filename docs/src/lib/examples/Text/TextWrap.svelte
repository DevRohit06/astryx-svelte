<!--
	Ported from upstream's `templates/blocks/components/Text/TextWrap.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Text } from '@astryx-svelte/core';
</script>

<div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px">
	<div>
		<Text type="label" display="block">Wrap (default)</Text>
		<div style="border: 1px solid #ccc; padding: 8px; width: 200px">
			<Text type="body" textWrap="wrap">
				This text wraps normally at word boundaries when it reaches the edge.
			</Text>
		</div>
	</div>
	<div>
		<Text type="label" display="block">Nowrap</Text>
		<div style="border: 1px solid #ccc; padding: 8px; width: 200px; overflow: hidden">
			<Text type="body" textWrap="nowrap">
				This text does not wrap and will overflow its container.
			</Text>
		</div>
	</div>
	<div>
		<Text type="label" display="block">Balance</Text>
		<div style="border: 1px solid #ccc; padding: 8px; width: 200px">
			<Text type="body" textWrap="balance">
				This text is balanced for better visual appearance across lines.
			</Text>
		</div>
	</div>
	<div>
		<Text type="label" display="block">Pretty</Text>
		<div style="border: 1px solid #ccc; padding: 8px; width: 200px">
			<Text type="body" textWrap="pretty">
				This text uses pretty wrap to avoid orphans at the end of paragraphs.
			</Text>
		</div>
	</div>
</div>
