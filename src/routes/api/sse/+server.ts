import { produce } from 'sveltekit-sse';

/**
 * @param {number} milliseconds
 * @returns
 */
function delay(milliseconds: number) {
	return new Promise(function run(resolve) {
		setTimeout(resolve, milliseconds);
	});
}

export function POST() {
	return produce(async function start({ emit }) {
		while (true) {
			const { error } = emit('message', `the time is ${Date.now()}`);
			if (error) {
				return;
			}
			await delay(1000);
		}
	});
}

//! not working ... message port Unchecked runtime.lastError: The message port closed before a response was received.

// import type { RequestHandler } from './$types';
// import { sseManager } from '$lib/server/sse';

// export const GET: RequestHandler = (event) => sseManager.getHandler(event);

// export const POST: RequestHandler = async ({ request }) => {
// 	const data = await request.json();
// 	sseManager.sendUpdate(data);
// 	return new Response(null, { status: 204 });
// };
