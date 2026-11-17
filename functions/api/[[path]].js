// Cloudflare Pages Function: forwards /api/* (REST and the messages WebSocket) to the backend on
// Render, so in the browser the API is same-origin, like the Vite dev proxy (vite.config.js).
// That keeps the refresh cookie first-party (Safari and others block third-party cookies) and
// needs no CORS. API_ORIGIN (a Pages environment variable) overrides the backend's address.

const DEFAULT_API_ORIGIN = "https://outfitted-api.onrender.com";

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, env.API_ORIGIN || DEFAULT_API_ORIGIN);

  // Same method, headers and body (WebSocket upgrades included), sent to the backend.
  const proxied = new Request(target, request);
  // The backend sees the visitor's address and the site they used, not Cloudflare's.
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) proxied.headers.set("X-Forwarded-For", ip);
  proxied.headers.set("X-Forwarded-Host", url.host);
  proxied.headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

  // Redirects go back to the browser rather than being followed here.
  return fetch(proxied, { redirect: "manual" });
}
