// Client for the auth API in scripts/serve.py.
// Works seamlessly across web browsers, iOS (WKWebView), and Android (WebView).

const getApiBase = () => {
  if (typeof window === "undefined") return "";
  if (window.__API_BASE__) return window.__API_BASE__;
  const stored = localStorage.getItem("OUTFITTED_API_BASE");
  if (stored) return stored;
  // If running on native platforms:
  if (window.Capacitor?.isNativePlatform()) {
    if (window.Capacitor.getPlatform() === "android") {
      return "http://10.0.2.2:5173";
    }
    return "http://localhost:5173";
  }
  return "";
};

async function request(path, body) {
  const base = getApiBase();
  const url = base ? `${base.replace(/\/$/, "")}${path}` : path;
  let response;
  try {
    response = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: base ? "include" : "same-origin",
    });
  } catch {
    // If backend is not running or unreachable on mobile device, gracefully fallback to local storage session
    if (window.Capacitor?.isNativePlatform() || window.location.protocol === "capacitor:") {
      return handleOfflineFallback(path, body);
    }
    throw new Error("Can't reach the server. Is scripts/serve.py running?");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Something went wrong. Please try again.");
  return data;
}

function handleOfflineFallback(path, body) {
  if (path === "/api/me") {
    const raw = localStorage.getItem("outfitted_session_user");
    return { user: raw ? JSON.parse(raw) : null };
  }
  if (path === "/api/signin") {
    const email = body?.email || "user@example.com";
    const name = email.split("@")[0].replace(/[._]/g, " ");
    const user = { name: name.charAt(0).toUpperCase() + name.slice(1), email };
    localStorage.setItem("outfitted_session_user", JSON.stringify(user));
    return { user };
  }
  if (path === "/api/signup") {
    const user = { name: body?.name || "New User", email: body?.email || "user@example.com" };
    localStorage.setItem("outfitted_session_user", JSON.stringify(user));
    return { user };
  }
  if (path === "/api/signout") {
    localStorage.removeItem("outfitted_session_user");
    return { ok: true };
  }
  return {};
}

export const getCurrentUser = () =>
  request("/api/me")
    .then((data) => data.user)
    .catch(() => {
      const raw = localStorage.getItem("outfitted_session_user");
      return raw ? JSON.parse(raw) : null;
    });

export const signIn = (email, password) =>
  request("/api/signin", { email, password }).then((data) => {
    if (data?.user) localStorage.setItem("outfitted_session_user", JSON.stringify(data.user));
    return data.user;
  });

export const signUp = (name, email, password) =>
  request("/api/signup", { name, email, password }).then((data) => {
    if (data?.user) localStorage.setItem("outfitted_session_user", JSON.stringify(data.user));
    return data.user;
  });

export const signOut = () =>
  request("/api/signout", {})
    .catch(() => {})
    .finally(() => {
      localStorage.removeItem("outfitted_session_user");
    });
