<script lang="ts">
	import { onMount } from 'svelte';
	import { highlight } from '$lib/syntax-highlighter';
	import { parseComponent } from '$lib/component-parser';

	export let data: { code: string; usageExample: string };

	let showCode = false;
	let DynamicComponent: any;
	let error: string | null = null;
	let componentInfo: string = '';

	$: toggleCode = () => (showCode = !showCode);

	onMount(() => {
		const { component, error: parseError } = parseComponent(data.code);
		if (parseError) {
			error = parseError;
		} else {
			DynamicComponent = component;
			componentInfo = `Type: ${typeof component}, Keys: ${Object.keys(component).join(', ')}`;
		}
	});
</script>

<div class="max-w-2xl mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6 text-center">Component Preview</h1>

	<div class="border border-gray-300 p-6 mb-6 rounded-lg">
		{#if error}
			<p class="text-red-500">Error: {error}</p>
			<p class="mt-2">
				Please ensure your component code includes a default export or named export.
			</p>
		{:else if DynamicComponent}
			<svelte:component this={DynamicComponent} label="Click me!" />
			<p class="mt-4 text-sm text-gray-600">Component Info: {componentInfo}</p>
		{:else}
			<p>Loading component...</p>
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
