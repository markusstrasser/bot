<script lang="ts">
	import { generateComponent } from '$lib/ai/ai';
	import { goto } from '$app/navigation';
	import { logError } from '$lib/logger';

	let prompt = '';
	let isLoading = false;
	let error: string | null = null;

	function sanitizePrompt(input: string): string {
		return input.trim().replace(/[<>]/g, '');
	}

	async function handleSubmit() {
		isLoading = true;
		error = null;
		const sanitizedPrompt = sanitizePrompt(prompt);
		if (sanitizedPrompt.length < 5) {
			error = 'Prompt must be at least 5 characters long';
			isLoading = false;
			return;
		}
		try {
			const generatedComponent = await generateComponent(sanitizedPrompt);
			const params = new URLSearchParams({
				code: encodeURIComponent(generatedComponent.code),
				usageExample: encodeURIComponent(generatedComponent.usageExample)
			});
			goto(`/preview?${params.toString()}`);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			logError(e as Error, { page: 'home', action: 'generate component' });
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
			aria-label="Component description"
			aria-required="true"
		/>
		<button
			type="submit"
			disabled={isLoading}
			class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
			aria-busy={isLoading}
		>
			{isLoading ? 'Generating...' : 'Generate'}
		</button>
	</form>

	{#if isLoading}
		<p class="text-center text-gray-600">Generating component...</p>
	{:else if error}
		<p class="text-center text-red-500">{error}</p>
	{/if}
</div>
