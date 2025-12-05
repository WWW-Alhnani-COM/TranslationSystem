// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // إعادة كتابة API calls
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://samali1-001-site1.stempurl.com/api/:path*',
      },
    ];
  },
  
  // إضافة headers
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
        ]
      }
    ];
  },
  
  // إصلاح warning
  experimental: {
    // إعدادات تجريبية إذا لزم
  }
};

module.exports = nextConfig;
