<script>
	import { useChat } from '@ai-sdk/svelte';

	const { input, handleSubmit, messages } = useChat();
</script>

<main>
	<ul>
		{#each $messages as message}
			<li>{message.role}:</li>
			{@html `<h1>Hello</h1>`}
		{/each}
	</ul>
	{@html `<h1>Hello</h1>`}

	<form on:submit={handleSubmit}>
		<input bind:value={$input} />
		<button type="submit">Send</button>
	</form>
</main>
