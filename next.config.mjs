/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['msedge-tts', 'ws'],
  // /gallery prerenders by scraping each playlist + a watch-page fetch per video;
  // 6 playlists blows the default 60s budget. Bump it. ponytail: raise again if
  // playlist count grows, or move the per-video embeddable check off the build path.
  staticPageGenerationTimeout: 300,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'opewatson.org' }],
        destination: 'https://opewatson.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.opewatson.com' }],
        destination: 'https://opewatson.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.opewatson.org' }],
        destination: 'https://opewatson.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig