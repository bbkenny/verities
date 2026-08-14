import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * The Midnight SDK ships WebAssembly modules (the ZK proving / compact runtime) that rely on
 * top-level await, plus `isomorphic-ws` (which needs a browser shim). These only run
 * client-side, but Next.js needs the right config to bundle them.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      'isomorphic-ws': './src/lib/isomorphic-ws-browser-shim.ts',
    },
  },
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    if (isServer) {
      // The wallet-connector flow only ever runs client-side.
      config.externals = [...(config.externals ?? []), '@midnight-ntwrk/dapp-connector-api'];
    } else {
      config.resolve.alias = {
        ...config.resolve.alias,
        'isomorphic-ws': path.resolve(__dirname, 'src/lib/isomorphic-ws-browser-shim.ts'),
      };
    }

    return config;
  },
};

export default nextConfig;
