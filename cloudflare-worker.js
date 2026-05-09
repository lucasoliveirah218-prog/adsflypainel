/**
 * Cloudflare Worker — Wildcard Subdomain Proxy for incorpweb.com
 *
 * This worker routes all *.incorpweb.com requests to the Replit
 * deployment, preserving the subdomain in the browser URL so the React SPA
 * can detect it via window.location.hostname.
 *
 * ─── DEPLOY INSTRUCTIONS ───────────────────────────────────────────────────
 *
 *  OPTION A — Wrangler CLI (recommended)
 *  1. npm install -g wrangler
 *  2. wrangler login
 *  3. wrangler deploy   (uses wrangler.toml in the same directory)
 *
 *  OPTION B — Cloudflare Dashboard
 *  1. Go to Workers & Pages → Create Application → Create Worker
 *  2. Paste the content of this file, click Deploy
 *  3. Go to the worker's Settings → Triggers → Add Route:
 *       Pattern : *.incorpweb.com/*
 *       Zone    : incorpweb.com
 *
 * ─── DNS SETUP (one-time, in Cloudflare DNS) ───────────────────────────────
 *
 *  Add a wildcard DNS record so Cloudflare knows to handle these requests:
 *
 *    Type  : AAAA
 *    Name  : *
 *    Value : 100::          ← dummy IPv6 (Workers intercept before routing)
 *    Proxy : ON  (orange cloud ☁)
 *
 *  The root domain (incorpweb.com) should already point to Replit.
 *  Leave that record as-is.
 *
 * ─────────────────────────────────────────────────────────────────────────── */

const REPLIT_APP_URL = "https://adsflypainel.replit.app";
const REPLIT_HOST = new URL(REPLIT_APP_URL).hostname;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const originalHostname = url.hostname;

    // Build the proxied URL — same path + query, but pointing at Replit
    const proxiedUrl = new URL(url.pathname + url.search, REPLIT_APP_URL);

    // Build request headers: override Host so Replit accepts the connection,
    // and pass the original subdomain hostname for any server-side logging.
    const headers = new Headers(request.headers);
    headers.set("Host", REPLIT_HOST);
    headers.set("X-Forwarded-Host", originalHostname);
    headers.set("X-Forwarded-Proto", "https");
    headers.set("X-Real-IP", request.headers.get("CF-Connecting-IP") || "");

    const proxiedRequest = new Request(proxiedUrl.toString(), {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
      redirect: "follow",
    });

    let response;
    try {
      response = await fetch(proxiedRequest);
    } catch (err) {
      return new Response("Bad Gateway: could not reach the application server.", {
        status: 502,
      });
    }

    // Clone the response and ensure CORS allows the subdomain origin.
    const newHeaders = new Headers(response.headers);
    const origin = request.headers.get("Origin");
    if (origin) {
      newHeaders.set("Access-Control-Allow-Origin", origin);
      newHeaders.set("Access-Control-Allow-Credentials", "true");
      newHeaders.set("Vary", "Origin");
    }

    // Handle preflight (OPTIONS) requests
    if (request.method === "OPTIONS") {
      newHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      newHeaders.set("Access-Control-Max-Age", "86400");
      return new Response(null, { status: 204, headers: newHeaders });
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
