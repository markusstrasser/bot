interface AIResponse {
  componentName: string;
  props: Array<{ name: string; type: string }>;
  events: string[];
  markup: string;
  usageExample: string;
}

function validateAIResponse(response: any): response is AIResponse {
  return (
    typeof response.componentName === 'string' &&
    Array.isArray(response.props) &&
    Array.isArray(response.events) &&
    typeof response.markup === 'string' &&
    typeof response.usageExample === 'string'
  );
}

// This is a placeholder for your actual AI utility
const yourAIUtility = async (prompt: string, schema: any): Promise<AIResponse> => {
  // Simulating AI response
  return {
    componentName: 'Button',
    props: [{ name: 'label', type: 'string' }],
    events: ['click'],
    markup: '<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" on:click>{label}</button>',
    usageExample: '<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Click me!</button>'
  };
};

const componentSchema = {
  componentName: 'string',
  props: 'array',
  events: 'array',
  markup: 'string',
  usageExample: 'string'
};

export async function generateComponent(prompt: string) {
  const result = await yourAIUtility(prompt, componentSchema);
  if (!validateAIResponse(result)) {
    throw new Error("Invalid AI response");
  }
  return {
    code: generateSvelteCode(result),
    fileName: generateFileName(result),
    usageExample: result.usageExample
  };
}
function generateSvelteCode(componentData: AIResponse) {
  const propsDeclaration = componentData.props
    .map((prop) => `export let ${prop.name}: ${prop.type};`)
    .join('\n  ');
  
  return `<script lang="ts">
  ${propsDeclaration}
</script>

${componentData.markup}`;
}

function generateFileName(componentData: AIResponse) {
  return `${componentData.componentName}.svelte`;
}