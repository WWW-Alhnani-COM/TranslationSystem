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
  
  // ✅ الحل الجديد: استخدم rewrites مع headers إضافية
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://samali1-001-site1.stempurl.com/api/:path*',
        // إضافة headers للتحايل على Mixed Content
        basePath: false,
      },
    ];
  },
  
  // ✅ إضافة headers لتعطيل Mixed Content protection مؤقتاً
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          // هذا قد يساعد في بعض المتصفحات
          { key: 'Content-Security-Policy', value: "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http: https: wss:;" },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,PATCH,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Accept, X-Requested-With' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          // سياسة أمن محتوى متساهلة مؤقتاً
          { key: 'Content-Security-Policy', value: "upgrade-insecure-requests" },
        ],
      },
    ];
  },
  
  // إعدادات إضافية
  poweredByHeader: false,
  reactStrictMode: true,
  
  // إعدادات TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
