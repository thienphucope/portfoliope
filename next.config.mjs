/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['msedge-tts', 'ws'],
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'opewatson.org',
          },
        ],
        destination: 'https://opewatson.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig