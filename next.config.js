/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on native modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Exclude ChromaDB and native modules from client-side bundle
    config.externals = [
      ...(config.externals || []),
      'chromadb',
      '@chroma-core/default-embed',
      'onnxruntime-node',
      '@huggingface/transformers',
    ];

    // Ignore native binary files
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.node$/,
          use: 'ignore-loader',
        },
      ],
    };

    return config;
  },
}

module.exports = nextConfig

