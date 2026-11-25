/**
 * Whether the device can reach the network, and when that changes. The package does not read the
 * browser itself, so each app supplies this: the web app from the `online` and `offline` events,
 * the mobile app from its network state.
 */
export interface Connectivity {
  /** The state now. */
  isOnline(): boolean;
  /** Calls `listener` on every change. Returns the function that stops listening. */
  subscribe(listener: (online: boolean) => void): () => void;
}
