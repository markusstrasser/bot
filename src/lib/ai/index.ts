import { generateObject } from "ai";
import { streamResponse } from "./streamResponse";
import actionPlanner from "./tools/actionPlanner";
import { z } from "zod";
import * as dotenv from "dotenv";
import { openai } from "@ai-sdk/openai";
dotenv.config();
export {streamResponse, actionPlanner}
import * as fileTools from "./tools/file"
import path from 'path';
import { findUpSync } from 'find-up';
import { promises as fs } from 'fs';



const fileToolDescriptions = Object.entries(fileTools).map(([key, tool]) => `${key}: ${tool.description}`).join("\n")

// Save folder content to out.txt
// console.log((await fileTools.readFolder.execute({target: fileTools.resolveProjectPath(), depth: -1})).content)
console.log((await fileTools.readProjectTree.execute({})).tree)
console.log(fileTools.getProjectRoot())


const botChain = async (messages: { role: string; content: string }[]) => {
	const { prompt, schema, prefill } = actionPlanner;
	//generateObj action plan from messages
	const promptWithToolInfo = prompt + fileToolDescriptions
	const { object }: {object: z.infer<typeof schema>} = await generateObject({
		model: openai('gpt-4'),
		system: promptWithToolInfo,
		messages: [{ role: 'user', content: 'read the homepage file' }],
		schema
	});

  console.log(object, "strategy")
  return object

};


// botChain([{role: "user", content: "read the homepage file"}])
// .then(console.log)
// .catch(console.error);
