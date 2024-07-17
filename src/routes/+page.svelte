<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { useChat } from '@ai-sdk/svelte';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '../convex/_generated/api.js';
	import { onMount } from 'svelte';

	const events = useQuery(api.events.list, {});
	const client = useConvexClient();

	const chatConfig = {
		api: '/api/chat'
		// onFinish: (message) => {
		//   try {
		//     client.mutation(api.events.add, {
		//       type: 'CHAT_COMPLETION',
		//       payload: JSON.parse(message.content)
		//     });
		//   } catch (error) {
		//     console.error('Failed to parse message content:', error);
		//   }
		// }
	};

	const { messages, input, handleSubmit, isLoading } = useChat(chatConfig);

	onMount(() => {
		if (!$messages || $messages.length === 0) {
			console.warn('No messages available');
		}
	});
</script>

<div class="container mx-auto p-4">
	<div class="bg-white p-4 rounded shadow">
		<h2 class="text-lg font-bold mb-2">Chatbot</h2>
		{@html `<b>Hello</b>`}

		{#if $messages && $messages.length > 0}
			<ul>
				{#each $messages as message}
					<li>{message.role}</li>
					{@html `<${message.content}`}
				{/each}
			</ul>
		{:else}
			<p>No messages yet.</p>
		{/if}
		<form on:submit|preventDefault={handleSubmit}>
			<input bind:value={$input} disabled={$isLoading} />
			<button type="submit" disabled={$isLoading}>Send</button>
		</form>
	</div>
</div>
