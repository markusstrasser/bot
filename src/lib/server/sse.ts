import type { RequestHandler } from '@sveltejs/kit';
import type { ReadableStreamDefaultController } from 'node:stream/web';

class SSEManager {
	private clients = new Set<ReadableStreamDefaultController>();

	getHandler: RequestHandler = ({ request }) => {
		const stream = new ReadableStream({
			start: (controller) => {
				this.clients.add(controller);
			},
			cancel: (controller) => {
				this.clients.delete(controller);
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});
	};

	sendUpdate = (data: unknown): void => {
		const event = `data: ${JSON.stringify(data)}\n\n`;
		this.clients.forEach((client) => client.enqueue(event));
	};
}

export const sseManager = new SSEManager();
