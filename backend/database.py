import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent / "ai_code_helper.db"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            username         TEXT    NOT NULL UNIQUE,
            email            TEXT    NOT NULL UNIQUE,
            password_hash    TEXT,
            profile_picture  TEXT,
            google_id        TEXT,
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login       TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            title      TEXT    NOT NULL DEFAULT 'New Session',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS messages (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id     INTEGER NOT NULL,
            prompt         TEXT,
            submitted_code TEXT,
            response       TEXT    NOT NULL,
            action_type    TEXT    NOT NULL,
            timestamp      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
            id                      INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id                 INTEGER NOT NULL UNIQUE,
            notifications           TEXT DEFAULT '{"email":true,"browser":true}',
            workspace_preferences   TEXT DEFAULT '{"theme":"dark","fontSize":14,"tabSize":4}',
            security_preferences    TEXT DEFAULT '{"twoFactor":false,"sessionTimeout":30}',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            token      TEXT    NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            used       INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS analytics (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER,
            event_type TEXT NOT NULL,
            metadata   TEXT,
            timestamp  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
    """)
    conn.commit()
    conn.close()
    print("✅  Database initialised")


if __name__ == "__main__":
    init_db()
