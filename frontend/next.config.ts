import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Built to static files in out/, which the FastAPI backend serves.
  output: "export",
  // Emits signin/index.html rather than signin.html, so /signin resolves as a directory.
  // Off in dev, where it would redirect /api/x to /api/x/ before the proxy below runs.
  trailingSlash: !isDev,
  // In production FastAPI serves both the pages and /api. Under `next dev`, proxy /api to the
  // backend so requests (and the session cookie) stay same-origin there too.
  ...(isDev && {
    async rewrites() {
      return [{ source: "/api/:path*", destination: "http://localhost:8000/api/:path*" }];
    },
  }),
};

export default nextConfig;
