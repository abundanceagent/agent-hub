"""
Shared SQLite event store.

Written to by hub.py as tasks run.
Read by dashboard.py to stream live updates to the browser.
Both processes share the same hub_events.db file.
"""

import sqlite3
import time
from pathlib import Path

DB_PATH = Path(__file__).parent / "hub_events.db"


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB_PATH, check_same_thread=False)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA journal_mode=WAL")   # allow concurrent reads + writes
    return c


def init_db() -> None:
    with _conn() as c:
        c.executescript("""
            CREATE TABLE IF NOT EXISTS tasks (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                project     TEXT    NOT NULL,
                task        TEXT    NOT NULL,
                session_id  TEXT    DEFAULT '',
                status      TEXT    DEFAULT 'running',
                started_at  REAL    NOT NULL,
                finished_at REAL,
                duration    REAL,
                result      TEXT    DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS events (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id     INTEGER NOT NULL,
                project     TEXT    NOT NULL,
                kind        TEXT    NOT NULL,
                agent       TEXT    DEFAULT '',
                label       TEXT    NOT NULL,
                elapsed     REAL    DEFAULT 0,
                duration    REAL    DEFAULT 0,
                created_at  REAL    DEFAULT (unixepoch('now', 'subsec'))
            );

            CREATE TABLE IF NOT EXISTS messages (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                project     TEXT    NOT NULL,
                text        TEXT    NOT NULL,
                read        INTEGER DEFAULT 0,
                created_at  REAL    DEFAULT (unixepoch('now', 'subsec'))
            );
        """)


# ---------------------------------------------------------------------------
# Task lifecycle
# ---------------------------------------------------------------------------

def task_start(project: str, task: str, session_id: str = "") -> int:
    with _conn() as c:
        cur = c.execute(
            "INSERT INTO tasks (project, task, session_id, started_at) VALUES (?,?,?,?)",
            (project, task, session_id, time.time()),
        )
        return cur.lastrowid


def task_finish(task_id: int, result: str, duration: float, session_id: str = "") -> None:
    with _conn() as c:
        c.execute(
            "UPDATE tasks SET status='done', finished_at=?, duration=?, result=?, session_id=? WHERE id=?",
            (time.time(), duration, result[:500], session_id, task_id),
        )


def task_error(task_id: int, error: str) -> None:
    with _conn() as c:
        c.execute(
            "UPDATE tasks SET status='error', finished_at=?, result=? WHERE id=?",
            (time.time(), error[:500], task_id),
        )


# ---------------------------------------------------------------------------
# Event recording
# ---------------------------------------------------------------------------

def add_event(
    task_id: int,
    project: str,
    kind: str,
    label: str,
    agent: str = "",
    elapsed: float = 0.0,
    duration: float = 0.0,
) -> None:
    with _conn() as c:
        c.execute(
            "INSERT INTO events (task_id,project,kind,agent,label,elapsed,duration) "
            "VALUES (?,?,?,?,?,?,?)",
            (task_id, project, kind, agent, label[:200], elapsed, duration),
        )


# ---------------------------------------------------------------------------
# Reads (for dashboard)
# ---------------------------------------------------------------------------

def get_tasks(limit: int = 30) -> list[dict]:
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM tasks ORDER BY started_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


def get_running_task() -> dict | None:
    with _conn() as c:
        row = c.execute(
            "SELECT * FROM tasks WHERE status='running' ORDER BY started_at DESC LIMIT 1"
        ).fetchone()
        return dict(row) if row else None


def get_events_since(since_id: int, limit: int = 200) -> list[dict]:
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM events WHERE id > ? ORDER BY id LIMIT ?",
            (since_id, limit),
        ).fetchall()
        return [dict(r) for r in rows]


def get_task_events(task_id: int) -> list[dict]:
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM events WHERE task_id=? ORDER BY id", (task_id,)
        ).fetchall()
        return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Chat messages (user → inbox → orchestrator)
# ---------------------------------------------------------------------------

def post_message(project: str, text: str) -> int:
    with _conn() as c:
        cur = c.execute(
            "INSERT INTO messages (project, text) VALUES (?,?)",
            (project, text),
        )
        return cur.lastrowid


def get_messages(project: str, unread_only: bool = False) -> list[dict]:
    with _conn() as c:
        q = "SELECT * FROM messages WHERE project=?"
        if unread_only:
            q += " AND read=0"
        q += " ORDER BY created_at DESC LIMIT 50"
        rows = c.execute(q, (project,)).fetchall()
        return [dict(r) for r in rows]


def mark_messages_read(project: str) -> None:
    with _conn() as c:
        c.execute("UPDATE messages SET read=1 WHERE project=?", (project,))


init_db()
