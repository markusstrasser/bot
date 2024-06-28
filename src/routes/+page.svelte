<script lang="ts">
	import { generateComponent } from '$lib/ai';
	import { goto } from '$app/navigation';

	let prompt = '';
	let isLoading = false;
	let error: string | null = null;

	async function handleSubmit() {
		isLoading = true;
		error = null;
		try {
			const generatedComponent = await generateComponent(prompt);
			const params = new URLSearchParams({
				code: encodeURIComponent(generatedComponent.code),
				usageExample: encodeURIComponent(generatedComponent.usageExample)
			});
			goto(`/preview?${params.toString()}`);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="max-w-2xl mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6 text-center">AI Component Generator</h1>

	<form on:submit|preventDefault={handleSubmit} class="mb-6">
		<input
			bind:value={prompt}
			placeholder="Describe your component..."
			class="w-full p-2 border border-gray-300 rounded mb-4"
		/>
		<button
			type="submit"
			disabled={isLoading}
			class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
		>
			Generate
		</button>
	</form>

	{#if isLoading}
		<p class="text-center text-gray-600">Generating component...</p>
	{:else if error}
		<p class="text-center text-red-500">{error}</p>
	{/if}
</div>
