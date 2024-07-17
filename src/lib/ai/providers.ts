import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { env } from '$env/dynamic/private';
import * as dotenv from 'dotenv';

dotenv.config();

export const anthropic = createAnthropic({
	apiKey: env.ANTHROPIC_API_KEY
});
export const openai = createOpenAI({
	apiKey: process.env.OPENAI_API_KEY
});
