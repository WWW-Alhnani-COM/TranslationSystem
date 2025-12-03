const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://samali1-001-site1.stempurl.com/api/:path*',
      },
    ];
  },
};
