// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 🔧 إعادة كتابة جميع API calls إلى HTTPS
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://samali1-001-site1.stempurl.com/api/:path*',
      },
    ];
  },
  
  // 🔧 إضافة Headers لإجبار HTTPS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: "upgrade-insecure-requests"
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  },
  
  // 🔧 تعطيل minification مؤقتاً للتصحيح
  swcMinify: false,
  
  // 🔧 إضافة ID بناء فريد لإجبار إعادة البناء
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  }
};

module.exports = nextConfig;
