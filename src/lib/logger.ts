export function logError(error: Error, context?: any) {
  console.error("Error occurred:", error.message, "Context:", context);
  // In a real application, you might want to send this to a logging service
}