/**
 * Browser environment configuration.
 *
 * NEXT_PUBLIC_* variables are inlined by Next.js at build time.
 */
export const env = {
  NEXT_PUBLIC_NETWORK_ID: process.env.NEXT_PUBLIC_NETWORK_ID ?? 'preprod',
  NEXT_PUBLIC_TRUST_ATTESTATION_ADDRESS: process.env.NEXT_PUBLIC_TRUST_ATTESTATION_ADDRESS ?? '',
  NEXT_PUBLIC_LOGGING_LEVEL: process.env.NEXT_PUBLIC_LOGGING_LEVEL ?? 'info',
} as const;
