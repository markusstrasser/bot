
// src/lib/action-planner.ts
import { z } from "zod";
import createTool from "./createTool";

const actionSchema = z.object({
  description: z.string().describe("A high-level description of the action"),
  reasoning: z.string().describe("The reasoning behind choosing this action"),
  expectedOutcome: z.string().describe("The expected outcome or result of this action")
});

const schema = z.object({
  actions: z.array(actionSchema).min(1).max(7)
    .describe("A list of high-level actions to accomplish the task"),
  overallStrategy: z.string().describe("A brief explanation of the overall strategy")
});

const prompt = `
<Instructions>
You are the Strategic Action Planner, a crucial component in an AI system designed to assist with SvelteKit project development. Your role is to work within the project, create features, fix bugs and elicit the wishes and preferences of the developer that's reviewing your output.

**In the first user message, the user will provide context about the project and task at hand.**

Create a high-level plan of action given the user ask, project context and roadmap (if given). This plan will later be translated into specific tool functions by another component.
You can do any actions a software developer would be allowed to do, except mutating something outside the codebase.

</Instructions>

Your purpose:
1. Understand the broader context of the SvelteKit project and the specific task at hand.
2. Formulate a logical sequence of high-level actions that will lead to the successful completion of the task.
3. Provide clear reasoning for each action to ensure the overall strategy is coherent and explainable.
4. Consider potential challenges or dependencies between actions.

<remember>
- You are planning at a high level. Don't worry about specific tool functions or implementation details.
- Your plan will be the foundation for the entire problem-solving process, so be thorough and thoughtful.
- Consider the typical workflow of SvelteKit development, including file structure, component creation, routing, and testing.
- If the task seems to require information you don't have, include an action to gather that information.
</remember>

Ensure your response is directly related to the given task and context
`;

export default createTool({prompt, schema});