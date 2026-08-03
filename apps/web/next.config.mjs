/**
 * Set to the API's public origin (e.g. https://nimbus-api.onrender.com) to
 * serve the API from this app's own origin instead of calling it cross-site.
 *
 * This exists because of the refresh cookie. With the web app on Vercel and
 * the API on Render, the cookie the API sets is a third-party cookie, and
 * browsers now routinely refuse to store it at all - verified in a real
 * Chromium session against the deployment, where zero cookies were stored.
 * The access token itself lives only in memory, so the session survived
 * client-side navigation but died on any hard reload: /auth/refresh had no
 * cookie to send and 401'd. Returning from the payment gateway is a hard
 * reload, which is why it looked like "paying logs you out". Locally,
 * :3000 and :4000 are the same site, so the cookie is first-party and none
 * of this shows up.
 *
 * Proxying through here makes the API same-origin in the browser's eyes, so
 * the cookie is first-party and the deployed session behaves like the local
 * one. Leave it unset to keep calling the API directly.
 */
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [{ source: "/api/:path*", destination: `${apiProxyTarget}/api/:path*` }];
  },
  images: {
    // Admins can paste a product/banner image URL from anywhere (there's no
    // hard Cloudinary requirement to run this project), so the host
    // allowlist can't be a fixed list - wildcarding still goes through
    // next/image's optimizer rather than falling back to plain <img>.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
