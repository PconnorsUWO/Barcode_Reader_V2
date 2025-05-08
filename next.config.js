/** @type {import('next').NextConfig} */
const repo = 'Barcode_Reader_V2';
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  output: 'export',
  basePath: isProduction ? `/${repo}` : '',
  assetPrefix: isProduction ? `/${repo}/` : '',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};