/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.discogs.com',
      },
      {
        protocol: 'https',
        hostname: 'st.discogs.com',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['onnxruntime-node'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
        'sharp': false,
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }
    // Handle .node native binary files
    config.module.rules.push({
      test: /\.node$/,
      type: 'asset/resource',
      generator: {
        emit: false,
      },
    });
    return config;
  },
};

export default nextConfig;
