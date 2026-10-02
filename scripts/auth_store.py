"""User accounts and sessions stored in a single JSON file.

Fine for a prototype with a handful of users. Swap for a real database before production:
the whole file is rewritten on every change and there is one lock per process.
"""
import hashlib
import hmac
import json
import os
import re
import secrets
import threading
import time
import uuid
from pathlib import Path

SESSION_TTL = 30 * 24 * 3600  # 30 days
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
SCRYPT = {"n": 2**14, "r": 8, "p": 1, "dklen": 32}


class AuthError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def _hash_password(password, salt):
    return hashlib.scrypt(password.encode(), salt=salt, maxmem=64 * 1024 * 1024, **SCRYPT)


def _hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


def public_user(user):
    return {"id": user["id"], "name": user["name"], "email": user["email"]}


class AuthStore:
    def __init__(self, path):
        self.path = Path(path)
        self.lock = threading.Lock()

    # --- file I/O ---
    def _load(self):
        if not self.path.exists():
            return {"users": [], "sessions": []}
        return json.loads(self.path.read_text(encoding="utf-8"))

    def _save(self, db):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(db, indent=2), encoding="utf-8")
        os.replace(tmp, self.path)  # atomic: never leaves a half-written database

    # --- accounts ---
    def sign_up(self, name, email, password):
        name, email = (name or "").strip(), (email or "").strip().lower()
        if not name:
            raise AuthError("Please enter your name.")
        if len(name) > 80:
            raise AuthError("Name is too long.")
        if not EMAIL_RE.match(email) or len(email) > 254:
            raise AuthError("Please enter a valid email address.")
        if not isinstance(password, str) or len(password) < 8:
            raise AuthError("Password must be at least 8 characters.")
        if len(password) > 256:
            raise AuthError("Password is too long.")

        salt = secrets.token_bytes(16)
        user = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "password": {"salt": salt.hex(), "hash": _hash_password(password, salt).hex()},
            "createdAt": int(time.time()),
        }
        with self.lock:
            db = self._load()
            if any(u["email"] == email for u in db["users"]):
                raise AuthError("An account with this email already exists.", 409)
            db["users"].append(user)
            token = self._new_session(db, user["id"])
            self._save(db)
        return public_user(user), token

    def sign_in(self, email, password):
        email = (email or "").strip().lower()
        with self.lock:
            db = self._load()
            user = next((u for u in db["users"] if u["email"] == email), None)
        # Hash even when the user is missing so response time doesn't reveal which emails exist.
        salt = bytes.fromhex(user["password"]["salt"]) if user else b"\0" * 16
        candidate = _hash_password(password if isinstance(password, str) else "", salt).hex()
        if not user or not hmac.compare_digest(candidate, user["password"]["hash"]):
            raise AuthError("Email or password is incorrect.", 401)
        with self.lock:
            db = self._load()
            token = self._new_session(db, user["id"])
            self._save(db)
        return public_user(user), token

    # --- sessions ---
    def _new_session(self, db, user_id):
        now = int(time.time())
        db["sessions"] = [s for s in db["sessions"] if s["expiresAt"] > now]
        token = secrets.token_urlsafe(32)
        db["sessions"].append({"tokenHash": _hash_token(token), "userId": user_id, "expiresAt": now + SESSION_TTL})
        return token

    def user_for_token(self, token):
        if not token:
            return None
        token_hash, now = _hash_token(token), int(time.time())
        with self.lock:
            db = self._load()
        session = next((s for s in db["sessions"] if hmac.compare_digest(s["tokenHash"], token_hash)), None)
        if not session or session["expiresAt"] <= now:
            return None
        user = next((u for u in db["users"] if u["id"] == session["userId"]), None)
        return public_user(user) if user else None

    def sign_out(self, token):
        if not token:
            return
        token_hash = _hash_token(token)
        with self.lock:
            db = self._load()
            db["sessions"] = [s for s in db["sessions"] if s["tokenHash"] != token_hash]
            self._save(db)
