<!-- <script>
  import { useChat } from '@ai-sdk/svelte';

  const { input, handleSubmit, messages } = useChat();
</script>

<main>
  <ul>
    {#each $messages as message}
      <li>{message.role}: {message.content}</li>
    {/each}
  </ul>
  <form on:submit={handleSubmit}>
    <input bind:value={$input} />
    <button type="submit">Send</button>
  </form>
</main> -->
<script lang="ts">
	import { agentStatusStore } from '$lib/store';
	async function sendToAgent(message: string) {
		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message })
		});
		if (!response.ok) {
			console.error('Failed to send message');
			throw new Error('Failed to send message');
		}
	}

	import { source } from 'sveltekit-sse';
	const value = source('/api/sse').select('message');
</script>

{$value}

{#if $agentStatusStore.status === 'idle'}
	<p>Agent is ready for your message.</p>
{:else if $agentStatusStore.status === 'thinking'}
	<p>Agent is processing your message...</p>
{:else if $agentStatusStore.status === 'responded'}
	<p>Agent response: {$agentStatusStore.message}</p>
{:else if $agentStatusStore.status === 'error'}
	<p>Error occurred: {$agentStatusStore.message}</p>
{/if}

<button on:click={() => sendToAgent('wahdasadawdaf dawdawd dawdawd rer  tqwqd s')}
	>Send to Agent</button
>
