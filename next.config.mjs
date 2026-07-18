// SALES_COUNTER — GitHub Pages 用の静的 export 設定。
//
// prod ビルドでのみ basePath / assetPrefix を付与するので、
// ローカル `npm run dev` は http://localhost:3000/ のままで動く。
const isProd = process.env.NODE_ENV === 'production';
const repoName = 'SALES_COUNTER';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
