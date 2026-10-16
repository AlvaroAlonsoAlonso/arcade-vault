import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // `/` no tiene página propia: se redirige antes del render (un redirect() en
  // app/page.tsx rompe la validación `instant` de partialPrefetching en dev).
  redirects() {
    return [{ source: "/", destination: "/inicio", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
