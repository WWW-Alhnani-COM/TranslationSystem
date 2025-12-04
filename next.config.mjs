// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // إعدادات الصور - تغيير إلى HTTPS
  images: {
    remotePatterns: [
      {
        protocol: 'https', // ⬅️ تغيير من http إلى https
        hostname: 'samali1-001-site1.stempurl.com',
        pathname: '/**',
      },
    ],
    unoptimized: true,
  },
  
  // ✅ إصلاح rewrites لاستخدام HTTPS
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://samali1-001-site1.stempurl.com/api/:path*', // ⬅️ تغيير إلى https
      },
    ];
  },
  
  // ✅ تحديث headers لـ HTTPS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,PATCH,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Accept, X-Requested-With' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          // إزالة upgrade-insecure-requests لأننا نستخدم HTTPS الآن
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
  
  // إعدادات إضافية
  poweredByHeader: false,
  reactStrictMode: true,
  
  // إعادة تفعيل TypeScript
  typescript: {
    ignoreBuildErrors: false, // ⬅️ غير إلى false
  },
  eslint: {
    ignoreDuringBuilds: false, // ⬅️ غير إلى false
  },
};

export default nextConfig;
