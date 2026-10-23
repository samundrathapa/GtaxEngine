/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js App Router reverse-proxy to gtax backend Express server
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
