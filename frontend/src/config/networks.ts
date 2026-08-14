export type NetworkId = 'preview' | 'preprod' | 'mainnet';

export interface NetworkConfig {
  readonly id: NetworkId;
  readonly label: string;
  readonly trustAttestationAddress: string;
  readonly oracleRegistryAddress: string;
}

/**
 * Contract addresses per network. `mainnet` is empty until Level 6 deploys there.
 */
export const NETWORKS: readonly NetworkConfig[] = [
  {
    id: 'preview',
    label: 'Preview',
    trustAttestationAddress: '5ed3ab3e808e43711ddab79a86e0d9e4ac1d8b36d5e01f62b13db98cf51f4953',
    oracleRegistryAddress: '72710e10c94a47a3752ed6e4b73e9b9ea20f864b32a6c493766cdab9fdccdfd6',
  },
  {
    id: 'preprod',
    label: 'Preprod',
    trustAttestationAddress: '6f61012d8a550cd813f96e5ddec88c858b906e90f8deeee909ebd05e1a8b9a75',
    oracleRegistryAddress: '166dc24bf58a14b8183e231ddfd6a5579528bd6e8860832d2fcb4a730020cbe4',
  },
  {
    id: 'mainnet',
    label: 'Mainnet',
    trustAttestationAddress: '',
    oracleRegistryAddress: '',
  },
];

export const DEFAULT_NETWORK = NETWORKS[1]; // preprod

export const networkById = (id: string): NetworkConfig =>
  NETWORKS.find((n) => n.id === id) ?? DEFAULT_NETWORK;
