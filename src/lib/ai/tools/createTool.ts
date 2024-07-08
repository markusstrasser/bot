import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

type AIToolConfig<TParams extends z.ZodType, TSchema extends z.ZodType> = {
	schema: TSchema;
	prompt?: string;
	params?: TParams;
	execute?: (params: z.infer<TParams>) => Promise<z.infer<TSchema>>;
	description: string;
	name: string;
};

type ExecuteResult<T> =
	| ({ success: true } & T)
	| { success: false; error: string; details?: unknown };

const getPrefillFromZodSchema = (schema: z.ZodType) => {
	const jsonSchema = zodToJsonSchema(schema);
	return jsonSchema.type === 'object' ? `{"${Object.keys(jsonSchema.properties ?? {})[0]}":` : '';
};
const createTool = <TParams extends z.ZodType, TSchema extends z.ZodType>({
	schema,
	description,
	prompt = '',
	params,
	execute,
	name
}: AIToolConfig<TParams, TSchema>) => {
	const jsonSchema = zodToJsonSchema(schema);

	return {
		name,
		prompt,
		description,
		schema,
		params,

		get jsonSchema() {
			return 'properties' in jsonSchema ? jsonSchema.properties : jsonSchema;
		},
		get promptWithSchema() {
			return `${prompt}\nYour output must be valid JSON and follow this schema:\n<schema>${JSON.stringify(
				this.jsonSchema
			)}</schema>`;
		},
		get prefill() {
			return jsonSchema.type === 'object'
				? `{"${Object.keys(jsonSchema.properties ?? {})[0]}":`
				: '';
		},
		async execute(input: z.infer<TParams>): Promise<ExecuteResult<z.infer<TSchema>>> {
			try {
				const validatedInput = await params.parseAsync(input);
				const result = await execute(validatedInput);
				const validatedOutput = await schema.parseAsync(result);
				return { success: true, ...validatedOutput };
			} catch (error) {
				if (error instanceof z.ZodError) {
					return {
						success: false,
						error: `Schema validation failed`,
						details: error.errors
					};
				}
				return {
					success: false,
					error: `Execution failed: ${error instanceof Error ? error.message : String(error)}`,
					details: error
				};
			}
		}
	};
};

export default createTool;
