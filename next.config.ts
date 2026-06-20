import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion', 'cubing'],
  // razorpay is a server-side package, exclude from webpack bundling
  serverExternalPackages: ['razorpay'],
  webpack: (config, {dev, isServer}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }

    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };

    config.output = {
      ...config.output,
      environment: {
        ...config.output.environment,
        asyncFunction: true,
      },
    };

    return config;
  },
};

export default nextConfig;
