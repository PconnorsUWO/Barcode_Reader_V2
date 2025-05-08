/** @type {import('next').NextConfig} */
const repo = 'https://github.com/PconnorsUWO/Barcode_Reader_V2'; // change this to your repo name

module.exports = {
  output: 'export',
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
};