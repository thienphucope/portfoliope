// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;

const nextConfig = {
  reactStrictMode: true,
  redirects: async () => [
    {
      source: '/',
      destination: '/case',
      permanent: false, // Đặt false nếu đây là chuyển hướng tạm thời
    },
  ],
};

export default nextConfig;