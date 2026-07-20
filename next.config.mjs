/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,



  // API proxy to Base44 backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://cryptic-zen-groom-flow.base44.app/api/:path*',
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
