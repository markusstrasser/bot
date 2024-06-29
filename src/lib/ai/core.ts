// src/lib/ai/core.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const actionSchema = z.object({
  description: z.string(),
  reasoning: z.string(),
  expectedOutcome: z.string()
});

const planSchema = z.object({
  actions: z.array(actionSchema).min(1).max(7),
  overallStrategy: z.string()
});

export async function generateActionPlan(messages: { role: string; content: string }[]) {
  const result = await streamText({
    model: openai('gpt-4'),
    system: 'You are a strategic action planner for SvelteKit project development.',
    messages,
    schema: planSchema
  });

  return result.toAIStreamResponse();
}

interface AIGeneratedComponent {
  componentName: string;
  props: Array<{ name: string; type: string }>;
  events: string[];
  markup: string;
  usageExample: string;
}

export async function generateComponent(prompt: string): Promise<AIGeneratedComponent> {
  // Implement AI logic here
  // For now, let's return a mock response
  return {
    componentName: 'Button',
    props: [{ name: 'label', type: 'string' }],
    events: ['click'],
    markup: '<button on:click>{label}</button>',
    usageExample: '<Button label="Click me" />'
  };
}