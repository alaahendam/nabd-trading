/**
 * The state of the live connection as the UI sees it:
 * `connecting` before the first connection, `connected` while ticks can flow,
 * `reconnecting` after a drop (the client keeps retrying), `offline` when the browser is offline
 * or the connection was closed on purpose.
 */
export const CONNECTION_STATUSES = ['connecting', 'connected', 'reconnecting', 'offline'] as const;

export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
