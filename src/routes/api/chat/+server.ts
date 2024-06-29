import { StreamingTextResponse, generateObject, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { z } from 'zod';
import { actionPlanner } from '$lib/ai/index.js';
import { env } from '$env/dynamic/private';

const openai = createOpenAI({
	apiKey: env.OPENAI_API_KEY ?? ''
});

const botChain = async (messages: []) => {
	const { prompt, zodSchema: schema, prefill } = actionPlanner;
	//generateObj action plan from messages
	const { object }: {object: z.infer<typeof schema>} = await generateObject({
		model: openai('gpt-4'),
		system: prompt,
		messages: [{ role: 'user', content: 'TODO: if new convo: context of project' }],
		schema
	});

  console.log(object.overallStrategy, "strategy")
  



  

};

export const POST = async ({ request }) => {
	const { messages } = await request.json();

	//Actions -> ToolCalls

	//ToolCall results and errors get put into "user" message. The user is the system. Queue Inception!
	//* ask user tool
	//for x in max_tries: a, else: call friend or reset
	//?use StreamText for 10 words summary ... easiest way to still use UseChat hook convenience
	const result = await streamText({
		prompt: 'You are a helpful assistant.',
		model: openai('gpt-4-turbo-preview'),
		messages,
		onFinish({ text, toolCalls, toolResults, finishReason, usage }) {
			// your own logic, e.g. for saving the chat history or recording usage
		}
	});

	return result.toAIStreamResponse();
};

import { generateText } from 'ai';
