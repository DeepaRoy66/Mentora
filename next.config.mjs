/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Allow Google Profile Images
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // Optional: Allow GitHub Images
      },
    ],
  },
};

export default nextConfig;