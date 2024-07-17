import { generateText, tool, type CoreMessage } from 'ai';

import * as mathjs from 'mathjs';
import { z } from 'zod';
import { anthropic } from './providers';

// const problem = `I want to know what's on the homepage and the about page`;
// console.log(`PROBLEM: ${problem}`);

export const agent = async (messages: CoreMessage[]) => {
	const { text: answer } = await generateText({
		model: anthropic('claude-3-5-sonnet-20240620'),
		system: `You are a code bot with many tools to answer the users question about the project they are working on. Respond ONLY in JSON
		`,
		messages,
		tools: {
			calculate: tool({
				description:
					'A tool for evaluating mathematical expressions. ' +
					'Example expressions: ' +
					"'1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.",
				parameters: z.object({ expression: z.string() }),
				execute: async ({ expression }) => {
					console.log(`EXPRESSION: ${expression}`);
					return mathjs.evaluate(expression);
				}
			}),
			getFileTree: tool({
				description: 'Get the projects file tree, ie. the location of files and folders in ASCII.',
				parameters: z
					.object({ path: z.string() })
					.describe('Root folder to generate file tree from'),
				execute: async ({ path }) => {
					console.log(`tree PATH: ${path}`);
					return `
.
├── index.html
├── css
│   └── styles.css
└── pages
    ├── about.html
    ├── contact.html

2 directories, 5 files
        `.trim();
				}
			}),
			readFile: tool({
				description: 'Read the file contents given a correct path in the project.',
				parameters: z.object({ path: z.string() }),
				execute: async ({ path }) => {
					console.log(path, 'readfile');
					if (path === 'index.html') {
						return `Hello LLM! You found me
        `;
					}
					if (path.includes('about.html')) {
						return 'ABOOOOOUTUT MEEE';
					}
					return `Wrong page ${path}`;
				}
			})
		},
		maxToolRoundtrips: 6,
		maxRetries: 2
	});

	return answer;
};

// console.log(`ANSWER: ${answer}`);
