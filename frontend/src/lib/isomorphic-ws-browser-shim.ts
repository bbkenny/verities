/**
 * Replaces `isomorphic-ws` in the browser bundle.
 *
 * `@midnight-ntwrk/midnight-js-indexer-public-data-provider` does `import * as ws from
 * 'isomorphic-ws'` and reads `ws.WebSocket`, which the upstream browser build doesn't
 * expose. This shim exposes the browser's native WebSocket under both access patterns.
 */
export const WebSocket = globalThis.WebSocket;
export default WebSocket;
