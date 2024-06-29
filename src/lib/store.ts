import { source } from 'sveltekit-sse';
import { derived, type Readable } from 'svelte/store';

interface AgentStatus {
  status: 'idle' | 'thinking' | 'responded' | 'error';
  message: string | null;
}

const connection = source('/api/chat', {
  close({ connect }) {
    console.log('SSE connection closed, attempting to reconnect...');
    connect();
  },
});

const agentStatusJson = connection.select('message').json(
  ({ error, raw, previous }) => {
    console.error(`Failed to parse agent status: "${raw}"`, error);
    return previous;
  }
);

export const agentStatusStore: Readable<AgentStatus> = derived(
  agentStatusJson,
  ($json): AgentStatus => {
    if ($json && typeof $json === 'object' && 'status' in $json && 'message' in $json) {
      return $json as AgentStatus;
    }
    return { status: 'idle', message: null };
  },
  { status: 'idle', message: null }
);

