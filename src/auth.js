// Client for the Outfitted API (outfitted-backend, see its docs/API.md).
//
// Access token: returned by login/refresh, kept in localStorage, sent as `Authorization: Bearer`.
// Refresh token:
//   - Web: HttpOnly cookie set by the backend; JavaScript never sees it. Every /auth/* call
//     sends `credentials: "include"` so the cookie is stored and sent.
//   - Native (iOS/Android): the page and API are different sites, so cookies don't work. The
//     backend returns the token in the body instead, and it's kept in the Keychain / Keystore.

import { SecureStorage } from "@aparajita/capacitor-secure-storage";

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const isNative = () => Boolean(window.Capacitor?.isNativePlatform());

export function apiBase() {
  if (window.__API_BASE__) return window.__API_BASE__;
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
  if (window.Capacitor?.isNativePlatform()) {
    // The Android emulator reaches the host machine at 10.0.2.2; the iOS simulator shares its network.
    return window.Capacitor.getPlatform() === "android"
      ? "http://10.0.2.2:8000/api/v1"
      : "http://localhost:8000/api/v1";
  }
  // Browser dev: Vite proxies /api to the backend (vite.config.js), so the API is same-origin.
  return "/api/v1";
}

export class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === "string" ? detail : "Something went wrong. Please try again.");
    this.status = status;
    // For 422s: { field: message } from the backend's validation errors.
    this.fields = {};
    if (Array.isArray(detail)) {
      for (const err of detail) {
        const field = err.loc?.[err.loc.length - 1];
        // Custom validators come back as "Value error, <message>".
        if (field && !this.fields[field]) this.fields[field] = err.msg.replace(/^Value error, /, "");
      }
      this.message = "Please fix the highlighted fields.";
    }
  }
}

// Temporary, while the API is on Render's free plan: it sleeps after 15 minutes without
// requests, and for up to a minute while it wakes, requests fail with 502/503/504 or don't
// connect at all. Retry those for a while, with a "waking up" banner, instead of failing at once.
// Remove once the API runs on a plan that doesn't sleep.
const WAKING_STATUSES = new Set([502, 503, 504]);
const WAKE_TIMEOUT_MS = 90_000;
const RETRY_DELAYS_MS = [2000, 3000, 5000];

// Requests through the Cloudflare Pages proxy (functions/api/[[path]].js) get a 502 from a
// sleeping Render service without waking it; a request straight to Render does wake it. So the
// hosted web app also pings Render directly while it waits. Dev and the native apps already talk
// to the API directly, so they don't need it.
const DEFAULT_WAKE_URL = "https://outfitted-api.onrender.com/api/v1/health";
const WAKE_PING_INTERVAL_MS = 20_000;
let lastWakePing = 0;

function wakeUrl() {
  if (window.__API_WAKE_URL__) return window.__API_WAKE_URL__;
  if (import.meta.env.VITE_API_WAKE_URL) return import.meta.env.VITE_API_WAKE_URL;
  return import.meta.env.PROD && !/^https?:/.test(apiBase()) ? DEFAULT_WAKE_URL : null;
}

// At most one ping every 20 seconds, however many requests are waiting. "no-cors" because only
// the request matters: the response (another site's) is never read, so it needs no CORS headers.
function wakeApi() {
  const url = wakeUrl();
  if (!url || Date.now() - lastWakePing < WAKE_PING_INTERVAL_MS) return;
  lastWakePing = Date.now();
  fetch(url, { mode: "no-cors", cache: "no-store" }).catch(() => {});
}

let waitingRequests = 0;

function showWakingBanner() {
  waitingRequests++;
  if (document.querySelector(".of-waking")) return;
  const banner = document.createElement("div");
  banner.className = "of-waking";
  banner.setAttribute("role", "status");
  banner.innerHTML = `<span class="of-waking-spinner" aria-hidden="true"></span><span>Waking up the server… this can take up to a minute.</span>`;
  document.body.appendChild(banner);
}

function hideWakingBanner() {
  waitingRequests = Math.max(0, waitingRequests - 1);
  if (!waitingRequests) document.querySelector(".of-waking")?.remove();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function send(path, init = {}) {
  const started = Date.now();
  let waking = false;
  try {
    for (let attempt = 0; ; attempt++) {
      let res = null;
      try {
        res = await fetch(`${apiBase()}${path}`, init);
        if (!WAKING_STATUSES.has(res.status)) return res;
      } catch {
        // Couldn't connect; while the server wakes that's expected, so retry below.
      }
      if (Date.now() - started > WAKE_TIMEOUT_MS) {
        if (res) return res;
        throw new ApiError(0, "Can't reach the server. Please try again in a minute.");
      }
      if (!waking) {
        waking = true;
        showWakingBanner();
      }
      wakeApi();
      await sleep(RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]);
    }
  } finally {
    if (waking) hideWakingBanner();
  }
}

export async function parse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.detail);
  return data;
}

const authPost = (path, body) =>
  send(`/auth/${path}`, {
    method: "POST",
    credentials: isNative() ? "omit" : "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

const getToken = () => localStorage.getItem(TOKEN_KEY);

// Native only: the refresh token in secure storage.
const getRefreshToken = () => SecureStorage.getItem(REFRESH_KEY).catch(() => null);
const saveRefreshToken = (token) => SecureStorage.setItem(REFRESH_KEY, token);
const clearRefreshToken = () => SecureStorage.removeItem(REFRESH_KEY).catch(() => {});

// POST /auth/refresh. Web sends the cookie; native sends the stored token in the body.
async function requestRefresh() {
  if (!isNative()) return authPost("refresh");
  const refreshToken = await getRefreshToken();
  return refreshToken ? authPost("refresh", { refresh_token: refreshToken }) : null;
}

// Only one refresh at a time, across tabs: the refresh cookie rotates, so a second concurrent
// refresh would send a cookie that was just revoked. Falls back to a per-tab lock where Web Locks
// isn't available (older WebViews).
let localLock = Promise.resolve();
function withRefreshLock(fn) {
  if (navigator.locks) return navigator.locks.request("auth-refresh", fn);
  const run = localLock.then(fn, fn);
  localLock = run.catch(() => {});
  return run;
}

function refreshAccessToken(staleToken) {
  return withRefreshLock(async () => {
    // Another tab may have refreshed while we waited for the lock.
    const current = getToken();
    if (current && current !== staleToken) return true;

    const res = await requestRefresh().catch(() => null);
    if (!res?.ok) {
      localStorage.removeItem(TOKEN_KEY);
      // Only forget the refresh token when the backend rejected it, not when it was unreachable.
      if (res?.status === 401) await clearRefreshToken();
      return false;
    }
    const { access_token, refresh_token } = await res.json();
    // Refresh tokens rotate: save the new one first, the old one no longer works.
    if (refresh_token) await saveRefreshToken(refresh_token);
    localStorage.setItem(TOKEN_KEY, access_token);
    return true;
  });
}

// Called when a session can't be refreshed. main.js sets it to show the sign-in screen.
let onSessionExpired = () => {};
export const setSessionExpiredHandler = (fn) => (onSessionExpired = fn);

// fetch() for protected endpoints: adds the access token, and on 401 refreshes once and retries.
export async function apiFetch(path, init = {}) {
  const request = (token) =>
    send(path, {
      ...init,
      headers: { ...init.headers, ...(token && { Authorization: `Bearer ${token}` }) },
    });

  const token = getToken();
  const res = await request(token);
  if (res.status !== 401) return res;

  if (!(await refreshAccessToken(token))) {
    onSessionExpired();
    return res;
  }
  return request(getToken());
}

// On app start: keep the user signed in from the refresh cookie if there's no access token.
export async function restoreSession() {
  if (getToken()) return true;
  return refreshAccessToken(null);
}

export async function signUp({ email, username, password, fullName }) {
  return parse(
    await authPost("signup", { email, username, password, ...(fullName && { full_name: fullName }) })
  );
}

export async function logIn(email, password) {
  const native = isNative();
  const { access_token, refresh_token } = await parse(
    await authPost("login", { email, password, ...(native && { client: "native" }) })
  );
  if (native) await saveRefreshToken(refresh_token);
  localStorage.setItem(TOKEN_KEY, access_token);
}

export async function logOut() {
  if (isNative()) {
    const refreshToken = await getRefreshToken();
    if (refreshToken) await authPost("logout", { refresh_token: refreshToken }).catch(() => {});
    await clearRefreshToken();
  } else {
    await authPost("logout").catch(() => {});
  }
  localStorage.removeItem(TOKEN_KEY);
}

// The signed-in user (GET /users/me), or null if there's no valid session.
export async function getMe() {
  const res = await apiFetch("/users/me");
  if (res.status === 401) return null;
  return parse(res);
}

export const signIn = logIn;
export const signOut = logOut;
export const getCurrentUser = getMe;
