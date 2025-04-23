/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['kleankuts.shop', 'kleankuts.netlify.app'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'kleankuts.netlify.app',
          },
        ],
        destination: 'https://kleankuts.shop',
        permanent: true,
      },
    ]
  },
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  productionBrowserSourceMaps: false,
  swcMinify: true
};

module.exports = nextConfig; 