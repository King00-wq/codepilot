from datetime import datetime, timezone
from typing import Optional

from database import get_db


def create_session(user_id: int) -> dict:
    db = get_db()
    try:
        cursor = db.execute(
            "INSERT INTO sessions (user_id, title) VALUES (?, ?)", (user_id, "New Session")
        )
        session_id = cursor.lastrowid
        db.commit()
        now = datetime.now(timezone.utc).isoformat()
        return {"session": {"id": session_id, "title": "New Session", "created_at": now, "updated_at": now}}
    finally:
        db.close()


def get_session(session_id: int, user_id: int) -> dict:
    db = get_db()
    try:
        session = db.execute(
            "SELECT * FROM sessions WHERE id = ? AND user_id = ?", (session_id, user_id)
        ).fetchone()
        if not session:
            raise LookupError("Session not found")

        messages = db.execute(
            "SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC", (session_id,)
        ).fetchall()
        return {"session": dict(session), "messages": [dict(m) for m in messages]}
    finally:
        db.close()


def get_user_history(
    user_id: int,
    search: Optional[str] = None,
    filter_type: Optional[str] = None,
    sort: str = "newest",
) -> dict:
    db = get_db()
    try:
        query = (
            "SELECT s.*, COUNT(m.id) as message_count "
            "FROM sessions s LEFT JOIN messages m ON s.id = m.session_id "
            "WHERE s.user_id = ?"
        )
        params: list = [user_id]

        if search:
            query += " AND s.title LIKE ?"
            params.append(f"%{search}%")

        if filter_type and filter_type != "all":
            query += " AND s.id IN (SELECT DISTINCT session_id FROM messages WHERE action_type = ?)"
            params.append(filter_type)

        query += " GROUP BY s.id"
        query += " ORDER BY s.updated_at " + ("DESC" if sort == "newest" else "ASC")

        sessions = db.execute(query, params).fetchall()
        result = []
        for s in sessions:
            s_dict = dict(s)
            last = db.execute(
                "SELECT action_type, timestamp FROM messages WHERE session_id = ? ORDER BY timestamp DESC LIMIT 1",
                (s["id"],),
            ).fetchone()
            if last:
                s_dict["last_action"] = last["action_type"]
                s_dict["last_activity"] = last["timestamp"]
            result.append(s_dict)
        return {"sessions": result}
    finally:
        db.close()


def update_session(session_id: int, user_id: int, title: str) -> dict:
    db = get_db()
    try:
        result = db.execute(
            "UPDATE sessions SET title = ?, updated_at = ? WHERE id = ? AND user_id = ?",
            (title[:100], datetime.now(timezone.utc), session_id, user_id),
        )
        db.commit()
        if result.rowcount == 0:
            raise LookupError("Session not found")
        return {"message": "Session updated"}
    finally:
        db.close()


def delete_session(session_id: int, user_id: int) -> dict:
    db = get_db()
    try:
        session = db.execute(
            "SELECT id FROM sessions WHERE id = ? AND user_id = ?", (session_id, user_id)
        ).fetchone()
        if not session:
            raise LookupError("Session not found")
        db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        db.commit()
        return {"message": "Session deleted successfully"}
    finally:
        db.close()
