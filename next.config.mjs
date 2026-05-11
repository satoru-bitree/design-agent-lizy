/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      // fal.ai CDN — used by gpt-image-2, seedance, and fal.storage uploads.
      // Hostnames vary by region (v3.fal.media, v3b.fal.media, …).
      { protocol: "https", hostname: "**.fal.media" },
      { protocol: "https", hostname: "fal.media" },
      // fal also occasionally serves through these.
      { protocol: "https", hostname: "**.fal.run" },
      { protocol: "https", hostname: "fal.run" },
      { protocol: "https", hostname: "**.fal.ai" },
    ],
  },
};

export default nextConfig;
