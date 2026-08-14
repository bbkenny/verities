import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { env } from './environment';

/** Maps `NEXT_PUBLIC_NETWORK_ID` to the SDK's `NetworkId`. */
export const networkId = env.NEXT_PUBLIC_NETWORK_ID as NetworkId;
