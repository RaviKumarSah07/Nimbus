/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Admins can paste a product/banner image URL from anywhere (there's no
    // hard Cloudinary requirement to run this project), so the host
    // allowlist can't be a fixed list - wildcarding still goes through
    // next/image's optimizer rather than falling back to plain <img>.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
