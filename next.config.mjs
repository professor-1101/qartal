/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default nextConfig;

// Add favicon and icons to headers
export const headers = async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'Link', value: '<\/AppImages/ios/32.png>; rel="icon"; type="image/png"; sizes="32x32"' },
      { key: 'Link', value: '<\/AppImages/ios/64.png>; rel="icon"; type="image/png"; sizes="64x64"' },
      { key: 'Link', value: '<\/AppImages/ios/128.png>; rel="icon"; type="image/png"; sizes="128x128"' },
      { key: 'Link', value: '<\/AppImages/ios/256.png>; rel="icon"; type="image/png"; sizes="256x256"' },
      { key: 'Link', value: '<\/AppImages/ios/512.png>; rel="icon"; type="image/png"; sizes="512x512"' },
      { key: 'Link', value: '<\/AppImages/ios/1024.png>; rel="icon"; type="image/png"; sizes="1024x1024"' },
    ],
  },
]; 