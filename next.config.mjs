// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // إعدادات الصور
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'samali1-001-site1.stempurl.com',
        pathname: '/**',
      },
    ],
    unoptimized: true,
  },
  
  // إعدادات إضافية
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // إعدادات للـ API Routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,PATCH,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
