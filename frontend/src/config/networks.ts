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
    trustAttestationAddress: '4305d6f23951355cb76b75e1d25aea0dc9f892cd6649644dfc32b2d28870c3c7',
    oracleRegistryAddress: '70b937d2e547b5bf31ab11bf1074c1a91851922efb3159e65d5d3639b8739c72',
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
