import json
import os
from typing import Optional

from auth_service import hash_password, verify_password
from database import get_db

ALLOWED_EXTENSIONS = {".py", ".js", ".java", ".txt", ".ts", ".jsx", ".tsx", ".cpp", ".c", ".cs", ".go", ".rb", ".php", ".rs", ".swift"}
MAX_FILE_BYTES = 1 * 1024 * 1024  # 1 MB


def get_profile(user_id: int) -> dict:
    db = get_db()
    try:
        user = db.execute(
            "SELECT id, username, email, profile_picture, created_at, last_login FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        if not user:
            raise LookupError("User not found")

        stats = db.execute(
            "SELECT COUNT(DISTINCT s.id) as session_count, COUNT(m.id) as message_count "
            "FROM sessions s LEFT JOIN messages m ON s.id = m.session_id WHERE s.user_id = ?",
            (user_id,),
        ).fetchone()

        top = db.execute(
            "SELECT action_type, COUNT(*) as cnt FROM messages m "
            "JOIN sessions s ON m.session_id = s.id WHERE s.user_id = ? "
            "GROUP BY action_type ORDER BY cnt DESC LIMIT 1",
            (user_id,),
        ).fetchone()

        return {
            "user": dict(user),
            "stats": {
                "session_count": stats["session_count"] if stats else 0,
                "message_count": stats["message_count"] if stats else 0,
                "most_used_action": top["action_type"] if top else None,
            },
        }
    finally:
        db.close()


def update_profile(user_id: int, username: Optional[str], profile_picture: Optional[str]) -> dict:
    db = get_db()
    try:
        updates, params = [], []
        if username is not None:
            existing = db.execute(
                "SELECT id FROM users WHERE username = ? AND id != ?", (username, user_id)
            ).fetchone()
            if existing:
                raise ValueError("Username already taken")
            updates.append("username = ?")
            params.append(username)
        if profile_picture is not None:
            updates.append("profile_picture = ?")
            params.append(profile_picture[:500])
        if not updates:
            raise ValueError("No valid fields to update")
        params.append(user_id)
        db.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        db.commit()
        return {"message": "Profile updated successfully"}
    finally:
        db.close()


def change_password(user_id: int, current_password: str, new_password: str) -> dict:
    db = get_db()
    try:
        user = db.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user or not verify_password(current_password, user["password_hash"]):
            raise ValueError("Current password is incorrect")
        db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(new_password), user_id))
        db.commit()
        return {"message": "Password changed successfully"}
    finally:
        db.close()


def get_settings(user_id: int) -> dict:
    db = get_db()
    try:
        s = db.execute("SELECT * FROM settings WHERE user_id = ?", (user_id,)).fetchone()
        if not s:
            db.execute("INSERT INTO settings (user_id) VALUES (?)", (user_id,))
            db.commit()
            s = db.execute("SELECT * FROM settings WHERE user_id = ?", (user_id,)).fetchone()
        return {
            "settings": {
                "notifications": json.loads(s["notifications"]),
                "workspace_preferences": json.loads(s["workspace_preferences"]),
                "security_preferences": json.loads(s["security_preferences"]),
            }
        }
    finally:
        db.close()


def update_settings(user_id: int, notifications, workspace_preferences, security_preferences) -> dict:
    db = get_db()
    try:
        updates, params = [], []
        if notifications is not None:
            updates.append("notifications = ?")
            params.append(json.dumps(notifications))
        if workspace_preferences is not None:
            updates.append("workspace_preferences = ?")
            params.append(json.dumps(workspace_preferences))
        if security_preferences is not None:
            updates.append("security_preferences = ?")
            params.append(json.dumps(security_preferences))
        if not updates:
            raise ValueError("No settings provided")
        params.append(user_id)
        db.execute(f"UPDATE settings SET {', '.join(updates)} WHERE user_id = ?", params)
        db.commit()
        return {"message": "Settings updated successfully"}
    finally:
        db.close()


def handle_file_upload(filename: str, content: str) -> dict:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}")
    if len(content.encode("utf-8")) > MAX_FILE_BYTES:
        raise ValueError("File exceeds the 1 MB size limit")
    if not content.strip():
        raise ValueError("File is empty")
    return {"content": content, "filename": filename}


def get_analytics(user_id: int) -> dict:
    db = get_db()
    try:
        action_counts = db.execute(
            "SELECT action_type, COUNT(*) as count FROM messages m "
            "JOIN sessions s ON m.session_id = s.id WHERE s.user_id = ? "
            "GROUP BY action_type ORDER BY count DESC",
            (user_id,),
        ).fetchall()
        recent = db.execute(
            "SELECT s.title, s.updated_at, m.action_type FROM sessions s "
            "LEFT JOIN messages m ON s.id = m.session_id "
            "WHERE s.user_id = ? ORDER BY s.updated_at DESC LIMIT 5",
            (user_id,),
        ).fetchall()
        return {
            "action_counts": [dict(r) for r in action_counts],
            "recent_sessions": [dict(r) for r in recent],
        }
    finally:
        db.close()
