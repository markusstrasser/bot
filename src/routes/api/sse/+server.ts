import type { RequestHandler } from '@sveltejs/kit';

class SSEManager {
  private clients: Set<ReadableStreamDefaultController> = new Set();

  getHandler(): RequestHandler {
    return () => {
      const stream = new ReadableStream({
        start: (controller) => {
          this.clients.add(controller);
        },
        cancel: (controller) => {
          this.clients.delete(controller);
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    };
  }

  sendUpdate(data: any) {
    const event = `data: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach((client) => client.enqueue(event));
  }
}

// const sseManager = new SSEManager();

// export const GET = sseManager.getHandler();

import { produce } from 'sveltekit-sse'

/**
 * @param {number} milliseconds
 * @returns
 */
function delay(milliseconds: number) {
  return new Promise(function run(resolve) {
    setTimeout(resolve, milliseconds)
  })
}

export function POST() {
  return produce(async function start({ emit }) {
      while (true) {
        const {error} = emit('message', `the time is ${Date.now()}`)
        if(error) {
          return
        }
        await delay(1000)
      }
  })
}