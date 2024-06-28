<script lang="ts">
	import { highlight } from '$lib/syntax-highlighter';
	import { logError } from '$lib/logger';

	export let data: { code: string; usageExample: string };

	let showCode = false;
	let error: string | null = null;

	$: toggleCode = () => (showCode = !showCode);

	try {
		// Validate data
		if (!data.code || !data.usageExample) {
			throw new Error('Invalid component data');
		}
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logError(e as Error, { page: 'preview', action: 'load component' });
	}
</script>

<div class="max-w-2xl mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6 text-center">Component Preview</h1>

	<div class="border border-gray-300 p-6 mb-6 rounded-lg">
		{#if error}
			<p class="text-red-500">Error: {error}</p>
		{:else}
			<div data-testid="generated-component">
				{@html data.usageExample}
			</div>
		{/if}
	</div>

	<button
		on:click={toggleCode}
		class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
	>
		{showCode ? 'Hide Code' : 'Show Code'}
	</button>

	{#if showCode}
		<pre><code use:highlight={{ code: data.code, language: 'javascript' }}></code></pre>
	{/if}
</div>
