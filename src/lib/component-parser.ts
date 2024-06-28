export function parseComponent(code: string): { component: any; error: string | null } {
  try {
    // Extract the script content
    const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (!scriptMatch) {
      throw new Error('No script tag found in the component');
    }

    const scriptContent = scriptMatch[1];

    // Wrap the script content in a function that returns an object
    const wrappedCode = `
      (function() {
        let exports = {};
        let module = { exports };
        ${scriptContent}
        return module.exports.__esModule ? module.exports.default : module.exports;
      })()
    `;
    
    const component = eval(wrappedCode);

    if (typeof component !== 'function' && typeof component !== 'object') {
      throw new Error('Component must be a function or object');
    }

    return { component, error: null };
  } catch (e) {
    return { component: null, error: e instanceof Error ? e.message : 'Unknown error occurred' };
  }
}