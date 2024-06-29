import { streamResponse } from "./streamResponse";
import actionPlanner from "./tools/actionPlanner";

export {streamResponse, actionPlanner}

// streamResponse(
// 	actionPlanner,
// 	[{userAsk: "It says it can't find the import in the homepage"}],
// 	(pair) => console.log("New key-value pair:", pair),
// )
// 	.then(console.log)
// 	.catch(console.error);
