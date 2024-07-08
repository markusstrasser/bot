import { generateObject } from 'ai';
import { streamResponse } from './streamResponse';
import actionPlanner from './tools/actionPlanner';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import { openai } from '@ai-sdk/openai';
import * as fileTools from '../../../.legacy/file';
import * as getProjectRoot from './tools/utils';
import { promises as fs } from 'fs';

dotenv.config();
export { streamResponse, actionPlanner };

const fileToolDescriptions = Object.entries(fileTools)
	.map(([key, tool]) => `${key}: ${tool.description}`)
	.join('\n');

console.log(fileToolDescriptions);
// Save folder content to out.txt
const saveFolderContentToFile = async () => {
	const folderContent = await fileTools.readFolder.execute({
		target: getProjectRoot.resolveProjectPath(),
		depth: -1
	});
	await fs.writeFile('out.txt', folderContent.content);
	console.log('Folder content saved to out.txt');
};

// saveFolderContentToFile().catch(console.error);
// console.log((await fileTools.readProjectTree.execute({})).tree)
// console.log(getProjectRoot.getProjectRoot())

const botChain = async (messages: { role: string; content: string }[]) => {
	const { prompt, schema, prefill } = actionPlanner;
	//generateObj action plan from messages
	const promptWithToolInfo = prompt + fileToolDescriptions;
	const { object }: { object: z.infer<typeof schema> } = await generateObject({
		model: openai('gpt-4'),
		system: promptWithToolInfo,
		messages: [{ role: 'user', content: 'read the homepage file' }],
		schema
	});

	console.log(object, 'strategy');
	return object;
};

botChain([{ role: 'user', content: 'read the homepage file' }])
	.then(console.log)
	.catch(console.error);
