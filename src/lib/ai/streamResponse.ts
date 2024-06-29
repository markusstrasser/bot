import { Anthropic } from "@anthropic-ai/sdk";
import StreamingJSONParser from "./StreamingJSONParser";

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});


const getProjectContext = (context: {}[]) => {
	return context.map(c => Object.entries(c).map(([k, v]) => `${k}: ${v}`)).join("\n")
}

const getTaskContext = (context: {}[]) => {
	return context.map(c => Object.entries(c).map(([k, v]) => `${k}: ${v}`)).join("\n")
}

export const streamResponse = async (
	{ prefill, promptWithSchema }: { prefill: string; promptWithSchema: string },
	context: {}[] = [],
	onKeyValuePair: (pair: Record<string, any>) => void,
) => {
	const parser = new StreamingJSONParser(prefill);
	parser.on("keyValuePair", onKeyValuePair);
	console.log(promptWithSchema, "promptwith schema");
	const messages: Anthropic.MessageParam[] = [
		{ role: "user", content: context.map(c => Object.entries(c).map(([k, v]) => `${k}: ${v}`)).join("\n") },
		{ role: "assistant", content: prefill }
	];
	const stream = anthropic.messages.stream({
		model: "claude-3-5-sonnet-20240620",
		max_tokens: 1024,
		system: promptWithSchema,
		messages
	});

	for await (const chunk of stream) {
		if (chunk.type === "content_block_delta") {
			parser.processChunk(chunk.delta.text);
		}
	}
	const response = parser.getFinalObject();
	const messageThread = [...messages, { role: "assistant", content: response }];
	//? the final object
	return response
};
