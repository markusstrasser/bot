import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

type AIToolConfig<TParams extends z.ZodType, TSchema extends z.ZodType> = {
  schema: TSchema;
  prompt?: string;
  params: TParams;
  execute: (params: z.infer<TParams>) => Promise<z.infer<TSchema>>;
  description: string;
};

const createTool = <TParams extends z.ZodType, TSchema extends z.ZodType>({
  schema,
  description,
  prompt = '',
  params,
  execute,
}: AIToolConfig<TParams, TSchema>) => {
  const jsonSchema = zodToJsonSchema(schema);

  return {
    prompt,
    description,
    schema,
    params,
   
    get jsonSchema() {
      return 'properties' in jsonSchema ? jsonSchema.properties : jsonSchema;
    },
    get promptWithSchema() {
      return `${prompt}\nYour output must be valid JSON and follow this schema:\n<schema>${JSON.stringify(this.jsonSchema)}</schema>`;
    },
    get prefill() {
      //@ts-ignore
      return jsonSchema.type === "object" ? `{"${Object.keys(jsonSchema.properties ?? {})[0]}":` : "";
    },
    async execute(input: z.infer<TParams>): Promise<{success: true, data: z.infer<TSchema>} | {success: false, data:{content:string}, error: string}> {
      try {
        const validatedInput = await params.parseAsync(input);
        const result = await execute(validatedInput);
        const validatedOutput = await schema.parseAsync(result);
        return { success: true, data: validatedOutput };
      } catch (error) {
        const message = error instanceof z.ZodError
          ? `Schema validation failed: ${error.message}`
          : `Execution failed: ${error instanceof Error ? error.message : String(error)}`;
        return { success: false, data:{content:""}, error: message };
      }
    },
  };
};

export default createTool;
