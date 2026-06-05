import os
import secrets
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

import logging
from passlib.context import CryptContext
from jose import JWTError, jwt

from database import get_db

logger = logging.getLogger(__name__)

# Prefer Argon2 if available, otherwise fall back to bcrypt so the server stays functional
try:
    import argon2  # type: ignore
    pwd_context = CryptContext(
        schemes=["argon2", "bcrypt"],
        default="argon2",
        deprecated="auto",
        bcrypt__rounds=12,
    )
    logger.info("Password hashing: using Argon2 (with bcrypt as fallback)")
except Exception:
    pwd_context = CryptContext(
        schemes=["bcrypt"],
        default="bcrypt",
        deprecated="auto",
        bcrypt__rounds=12,
    )
    logger.warning("Argon2 backend not available; falling back to bcrypt. Install argon2-cffi to use Argon2.")

JWT_SECRET: str = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24


# ── Password helpers ──────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT ───────────────────────────────────────────────────────────────────────

def create_token(user_id: int, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None


# ── Signup ────────────────────────────────────────────────────────────────────

def signup_user(username: str, email: str, password: str) -> dict:
    db = get_db()
    try:
        existing = db.execute(
            "SELECT id FROM users WHERE email = ? OR username = ?",
            (email.lower(), username.strip()),
        ).fetchone()
        if existing:
            raise ValueError("Email or username already in use")

        pw_hash = hash_password(password)
        cursor = db.execute(
            "INSERT INTO users (username, email, password_hash, last_login) VALUES (?, ?, ?, ?)",
            (username.strip(), email.lower(), pw_hash, datetime.now(timezone.utc)),
        )
        user_id = cursor.lastrowid
        db.execute("INSERT INTO settings (user_id) VALUES (?)", (user_id,))
        _log(user_id, "signup", None, db)
        db.commit()
        token = create_token(user_id, email.lower())
        return {
            "message": "Account created successfully",
            "token": token,
            "user": {"id": user_id, "username": username.strip(), "email": email.lower()},
        }
    finally:
        db.close()


# ── Login ─────────────────────────────────────────────────────────────────────

def login_user(email: str, password: str) -> dict:
    db = get_db()
    try:
        user = db.execute("SELECT * FROM users WHERE email = ?", (email.lower(),)).fetchone()
        if not user or not user["password_hash"]:
            _log(None, "failed_login", f'{{"email":"{email}"}}', db)
            db.commit()
            raise ValueError("Incorrect email or password")

        if not verify_password(password, user["password_hash"]):
            _log(None, "failed_login", f'{{"email":"{email}"}}', db)
            db.commit()
            raise ValueError("Incorrect email or password")

        # If the stored hash uses an older scheme (e.g., bcrypt), re-hash with Argon2
        try:
            if pwd_context.needs_update(user["password_hash"]):
                new_hash = hash_password(password)
                db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user["id"]))
        except Exception:
            # Don't block login on rehash failures; log and continue
            _log(user["id"], "rehash_failed", None, db)

        db.execute(
            "UPDATE users SET last_login = ? WHERE id = ?",
            (datetime.now(timezone.utc), user["id"]),
        )
        _log(user["id"], "login", None, db)
        db.commit()
        token = create_token(user["id"], user["email"])
        return {
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "profile_picture": user["profile_picture"],
            },
        }
    finally:
        db.close()


# ── Password reset ────────────────────────────────────────────────────────────

def request_password_reset(email: str) -> dict:
    db = get_db()
    try:
        user = db.execute("SELECT id FROM users WHERE email = ?", (email.lower(),)).fetchone()
        # Always return success — prevent email enumeration
        if not user:
            return {"message": "If that email exists, a reset link has been sent"}

        token = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.execute(
            "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
            (user["id"], token, expires),
        )
        db.commit()
        # In production: send email. Dev: return token directly.
        return {
            "message": "If that email exists, a reset link has been sent",
            "dev_token": token,
        }
    finally:
        db.close()


def reset_password(token: str, new_password: str) -> dict:
    db = get_db()
    try:
        record = db.execute(
            "SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0", (token,)
        ).fetchone()
        if not record:
            raise ValueError("Invalid or expired reset token")

        expires_at = datetime.fromisoformat(str(record["expires_at"]))
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            raise ValueError("Reset token has expired")

        pw_hash = hash_password(new_password)
        db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (pw_hash, record["user_id"]))
        db.execute("UPDATE password_reset_tokens SET used = 1 WHERE id = ?", (record["id"],))
        db.commit()
        return {"message": "Password reset successfully"}
    finally:
        db.close()


# ── Internal ──────────────────────────────────────────────────────────────────

def _log(user_id, event_type, metadata, db):
    db.execute(
        "INSERT INTO analytics (user_id, event_type, metadata) VALUES (?, ?, ?)",
        (user_id, event_type, metadata),
    )
