import { createOpenAI } from '@ai-sdk/openai';
import { generateText, StreamingTextResponse, streamText } from 'ai';
import type { RequestHandler } from './$types';
import { agent } from '$lib/ai/chat';
import { env } from '$env/dynamic/private';
import { anthropic } from '$lib/ai/providers';
import { json } from '@sveltejs/kit';

const openai = createOpenAI({
	apiKey: env.OPENAI_API_KEY ?? ''
});

export const POST = (async ({ request }) => {
	const { messages } = await request.json();

	const answer = await agent(messages);

	const html = await generateText({
		model: anthropic('claude-3-5-sonnet-20240620'),
		system:
			'Convert the following JSON into a clean, simple HTML that gets displayed to the user. Focus on information design principles',
		prompt: answer
		// messages: [{ role: 'user', content:  }]
	});

	const result = await streamText({
		system:
			'Convert the following JSON into a clean, simple HTML that gets displayed to the user. Focus on information design principles. Response MUST be VALID HTML ONLY. It will get mapped into a svelte component using the {@html ...} directive',
		model: anthropic('claude-3-5-sonnet-20240620'),
		messages: [
			{ role: 'user', content: answer },
			{ role: 'assistant', content: '<' }
		]
	});

	return result.toAIStreamResponse();

	// return json({ html });
}) satisfies RequestHandler;
