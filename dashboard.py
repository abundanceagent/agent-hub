"""
Agent Hub Dashboard — web UI server.

Run alongside hub.py:
    python dashboard.py          # serves on http://localhost:8080

Both processes share hub_events.db via SQLite WAL mode.
"""

import asyncio
import json
import time
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

import events as ev
from project import Project

app = FastAPI(title="Agent Hub")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
async def startup():
    ev.init_db()

DASHBOARD_HTML = Path(__file__).parent / "dashboard" / "index.html"


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def index():
    return DASHBOARD_HTML.read_text()


# ---------------------------------------------------------------------------
# Projects API
# ---------------------------------------------------------------------------

@app.get("/api/projects")
async def list_projects():
    names = Project.list_all()
    running = ev.get_running_task()
    result = []
    for name in names:
        try:
            p = Project.load(name)
            result.append({
                "name": name,
                "description": p.description,
                "tech_stack": p.tech_stack,
                "tags": p.tags,
                "active": running is not None and running["project"] == name,
            })
        except Exception:
            result.append({"name": name, "description": "⚠ corrupt config",
                           "tech_stack": [], "tags": [], "active": False})
    return result


# ---------------------------------------------------------------------------
# Tasks API
# ---------------------------------------------------------------------------

@app.get("/api/tasks")
async def list_tasks(limit: int = 30):
    return ev.get_tasks(limit)


@app.get("/api/tasks/{task_id}/events")
async def task_events(task_id: int):
    return ev.get_task_events(task_id)


# ---------------------------------------------------------------------------
# Live SSE stream
# ---------------------------------------------------------------------------

@app.get("/api/live")
async def live(since: int = 0):
    """
    Server-Sent Events stream.
    Sends new events + status heartbeat every 400ms.
    Browser reconnects automatically on disconnect.
    """
    async def generate():
        last_id = since
        while True:
            # New events
            new_events = ev.get_events_since(last_id)
            for e in new_events:
                last_id = e["id"]
                yield f"data: {json.dumps(e)}\n\n"

            # Status heartbeat (running task + project list)
            running = ev.get_running_task()
            payload = {
                "running": running,
                "ts": time.time(),
            }
            yield f"event: status\ndata: {json.dumps(payload)}\n\n"
            await asyncio.sleep(0.4)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Submit a task from the dashboard
# ---------------------------------------------------------------------------

@app.post("/api/submit")
async def submit_task(body: dict):
    project_name = body.get("project", "")
    task = body.get("task", "").strip()

    if not project_name or not task:
        return JSONResponse({"error": "project and task are required"}, status_code=400)
    if not Project.exists(project_name):
        return JSONResponse({"error": f"Project '{project_name}' not found"}, status_code=404)
    if ev.get_running_task():
        return JSONResponse({"error": "A task is already running"}, status_code=409)

    asyncio.create_task(_run_task(project_name, task))
    return {"status": "started", "project": project_name, "task": task}


async def _run_task(project_name: str, task: str) -> None:
    from hub import submit
    project = Project.load(project_name)
    try:
        await submit(project, task)
    except Exception as e:
        running = ev.get_running_task()
        if running:
            ev.task_error(running["id"], str(e))


# ---------------------------------------------------------------------------
# Chat — send a mid-task message to the orchestrator
# ---------------------------------------------------------------------------

@app.post("/api/message")
async def send_message(body: dict):
    project = body.get("project", "")
    text = body.get("text", "").strip()
    if not project or not text:
        return JSONResponse({"error": "project and text required"}, status_code=400)

    # 1. Store in DB (for chat history display)
    msg_id = ev.post_message(project, text)

    # 2. Write to inbox file so the orchestrator reads it on its next check
    _write_inbox(project, text)

    return {"status": "delivered", "id": msg_id}


@app.get("/api/messages")
async def get_messages(project: str):
    return ev.get_messages(project)


def _write_inbox(project_name: str, text: str) -> None:
    """Append a message to the project's inbox.md so the orchestrator sees it."""
    try:
        from project import PROJECTS_DIR
        inbox = PROJECTS_DIR / project_name / "memory" / "inbox.md"
        inbox.parent.mkdir(parents=True, exist_ok=True)
        ts = time.strftime("%H:%M:%S")
        with inbox.open("a") as f:
            f.write(f"\n[ ] [{ts}] {text}\n")
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("Agent Hub Dashboard → http://localhost:8080")
    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="warning")
