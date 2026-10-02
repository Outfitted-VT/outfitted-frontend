"""Local dev server: static site (no caching) plus a small auth API backed by data/users.json.

Usage: python scripts/serve.py [port]

API (JSON in, JSON out; session kept in an HttpOnly cookie):
  GET  /api/me       -> {"user": {...} | null}
  POST /api/signup   {name, email, password} -> {"user": {...}}
  POST /api/signin   {email, password}       -> {"user": {...}}
  POST /api/signout                          -> {"ok": true}
"""
import json
import os
import posixpath
import sys
import time
from collections import defaultdict, deque
from functools import partial
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from auth_store import SESSION_TTL, AuthError, AuthStore

ROOT = Path(__file__).resolve().parent.parent
STORE = AuthStore(os.environ.get("OUTFITTED_DB") or ROOT / "data" / "users.json")
COOKIE = "outfitted_session"
MAX_BODY = 10_000
# Only the site itself is served; data/, scripts/, .git etc. are never exposed.
PUBLIC_PREFIXES = ("/src/", "/assets/")
PUBLIC_FILES = ("/", "/index.html", "/favicon.ico")

# Sign-in throttle: at most 10 failed attempts per email+IP in 10 minutes.
FAILED = defaultdict(deque)
FAIL_LIMIT, FAIL_WINDOW = 10, 600


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    # --- static ---
    def is_public(self):
        # Decode and resolve ".." first, so "/src/../data/users.json" can't slip past the prefix check.
        path = posixpath.normpath(unquote(urlsplit(self.path).path).replace("\\", "/"))
        return path in PUBLIC_FILES or path.startswith(PUBLIC_PREFIXES)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/api/me":
            return self.send_json(200, {"user": STORE.user_for_token(self.session_token())})
        if path.startswith("/api/"):
            return self.send_json(404, {"error": "Not found."})
        if not self.is_public():
            return self.send_error(404)
        return super().do_GET()

    def do_HEAD(self):
        if not self.is_public():
            return self.send_error(404)
        return super().do_HEAD()

    # --- API ---
    def do_POST(self):
        path = urlsplit(self.path).path
        routes = {"/api/signup": self.sign_up, "/api/signin": self.sign_in, "/api/signout": self.sign_out}
        if path not in routes:
            return self.send_json(404, {"error": "Not found."})
        # Requiring a JSON content type blocks cross-site HTML form posts (CSRF).
        if self.headers.get("Content-Type", "").split(";")[0].strip() != "application/json":
            return self.send_json(415, {"error": "Expected application/json."})
        length = int(self.headers.get("Content-Length") or 0)
        if length > MAX_BODY:
            return self.send_json(413, {"error": "Request too large."})
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
            if not isinstance(body, dict):
                raise ValueError
        except ValueError:
            return self.send_json(400, {"error": "Invalid JSON."})
        try:
            routes[path](body)
        except AuthError as error:
            self.send_json(error.status, {"error": str(error)})

    def sign_up(self, body):
        user, token = STORE.sign_up(body.get("name"), body.get("email"), body.get("password"))
        self.send_json(201, {"user": user}, cookie=token)

    def sign_in(self, body):
        key = f"{str(body.get('email', '')).strip().lower()}|{self.client_address[0]}"
        attempts, now = FAILED[key], time.time()
        while attempts and attempts[0] < now - FAIL_WINDOW:
            attempts.popleft()
        if len(attempts) >= FAIL_LIMIT:
            raise AuthError("Too many attempts. Try again in a few minutes.", 429)
        try:
            user, token = STORE.sign_in(body.get("email"), body.get("password"))
        except AuthError:
            attempts.append(now)
            raise
        FAILED.pop(key, None)
        self.send_json(200, {"user": user}, cookie=token)

    def sign_out(self, _body):
        STORE.sign_out(self.session_token())
        self.send_json(200, {"ok": True}, cookie="")

    # --- helpers ---
    def session_token(self):
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        return cookie[COOKIE].value if COOKIE in cookie else None

    def send_json(self, status, payload, cookie=None):
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        if cookie is not None:
            max_age = SESSION_TTL if cookie else 0
            self.send_header("Set-Cookie", f"{COOKIE}={cookie}; HttpOnly; SameSite=Lax; Path=/; Max-Age={max_age}")
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    print(f"Serving {ROOT} at http://localhost:{port}")
    ThreadingHTTPServer(("", port), partial(Handler, directory=str(ROOT))).serve_forever()
