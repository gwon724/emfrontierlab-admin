/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
    instrumentationHook: true, // 서버 시작 시 instrumentation.ts 자동 실행
  },
}

module.exports = nextConfig
