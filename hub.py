"""
Agent Hub — central command center for all projects.

Each project has its own workspace, memory, and task history.
Switch between projects with `switch <name>` or create new ones with `create`.

Usage:
    python hub.py                           # REPL (picks last project or asks)
    python hub.py --project northstar       # open specific project
    python hub.py --project northstar "analyse the P&L log"
    python hub.py --project my-website "build the homepage"
    python hub.py --resume <session-id> "follow up"
"""

import json
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

import anyio
from rich.columns import Columns
from rich.console import Console
from rich.panel import Panel
from rich.rule import Rule
from rich.table import Table
from rich.text import Text

from claude_agent_sdk import (
    ClaudeAgentOptions,
    ResultMessage,
    SystemMessage,
    query,
)

from project import PROJECTS_DIR, Project
from universal_agent import ORCHESTRATOR_SYSTEM_TEMPLATE, make_subagents
import events as ev

console = Console()

# ---------------------------------------------------------------------------
# Agent color map
# ---------------------------------------------------------------------------

AGENT_COLORS: dict[str, str] = {
    "coder":      "cyan",
    "researcher": "blue",
    "analyst":    "magenta",
    "marketer":   "green",
    "designer":   "yellow",
    "sales":      "red",
    "file-ops":   "white",
}

# ---------------------------------------------------------------------------
# Task event tracker (unchanged from previous version)
# ---------------------------------------------------------------------------

@dataclass
class Event:
    elapsed_secs: float
    kind: str          # agent_start | agent_done | action | narration | result
    label: str
    agent: str = ""
    duration: float = 0.0


class TaskTracker:
    def __init__(self) -> None:
        self.t0 = time.monotonic()
        self.events: list[Event] = []
        self._pending_agent: str | None = None
        self._pending_agent_t: float | None = None

    def elapsed(self) -> float:
        return time.monotonic() - self.t0

    def elapsed_str(self, secs: float | None = None) -> str:
        s = int(secs if secs is not None else self.elapsed())
        return f"{s // 60:02d}:{s % 60:02d}"

    def ts(self) -> str:
        return f"[dim]\\[{self.elapsed_str()}][/dim]"

    def record(self, kind: str, label: str, agent: str = "", duration: float = 0.0) -> None:
        self.events.append(Event(self.elapsed(), kind, label, agent, duration))

    def agent_dispatched(self, name: str) -> None:
        self._pending_agent = name
        self._pending_agent_t = time.monotonic()
        self.record("agent_start", f"Delegating to [{name}]", agent=name)

    def agent_maybe_returned(self) -> Event | None:
        if self._pending_agent and self._pending_agent_t:
            dur = time.monotonic() - self._pending_agent_t
            name = self._pending_agent
            self._pending_agent = None
            self._pending_agent_t = None
            ev = Event(self.elapsed(), "agent_done", f"[{name}] finished", name, dur)
            self.events.append(ev)
            return ev
        return None

    def timeline_table(self, total_secs: float) -> Table:
        tbl = Table(title="Task Timeline", border_style="dim", show_lines=False)
        tbl.add_column("Time",     style="dim",    width=7,  no_wrap=True)
        tbl.add_column("Event",    min_width=35)
        tbl.add_column("Agent",    style="cyan",   width=12, no_wrap=True)
        tbl.add_column("Duration", style="yellow", width=10, no_wrap=True)

        for ev in self.events:
            color = AGENT_COLORS.get(ev.agent, "white") if ev.agent else "white"
            dur_str = f"{ev.duration:.0f}s" if ev.duration else ""
            if ev.kind == "agent_start":
                label = Text(f"→ {ev.label}", style=f"bold {color}")
            elif ev.kind == "agent_done":
                label = Text(f"✓ {ev.label}", style=color)
            elif ev.kind == "narration":
                label = Text(ev.label[:80], style="yellow")
            elif ev.kind == "result":
                label = Text("Task complete", style="bold green")
            else:
                label = Text(ev.label[:80], style="dim")
            tbl.add_row(
                self.elapsed_str(ev.elapsed_secs), label,
                Text(ev.agent, style=f"bold {color}") if ev.agent else Text(""),
                dur_str,
            )
        tbl.add_row("──────", "─" * 35, "────────────", "──────────")
        tbl.add_row(self.elapsed_str(total_secs), Text("Total", style="bold"), "",
                    Text(f"{total_secs:.0f}s", style="bold yellow"))
        return tbl

    def agent_summary(self) -> Table | None:
        times: dict[str, float] = {}
        counts: dict[str, int] = {}
        for ev in self.events:
            if ev.kind == "agent_done" and ev.agent:
                times[ev.agent] = times.get(ev.agent, 0.0) + ev.duration
                counts[ev.agent] = counts.get(ev.agent, 0) + 1
        if not times:
            return None
        tbl = Table(title="Agent Summary", border_style="dim")
        tbl.add_column("Agent",  style="cyan",   width=12)
        tbl.add_column("Calls",  style="dim",    width=6, justify="right")
        tbl.add_column("Total",  style="yellow", width=8, justify="right")
        tbl.add_column("Avg",    style="dim",    width=8, justify="right")
        for name, total in sorted(times.items(), key=lambda x: -x[1]):
            color = AGENT_COLORS.get(name, "white")
            tbl.add_row(Text(name, style=f"bold {color}"), str(counts[name]),
                        f"{total:.0f}s", f"{total / counts[name]:.0f}s")
        return tbl


# ---------------------------------------------------------------------------
# Message renderer
# ---------------------------------------------------------------------------

def _render_message(msg: object, tracker: TaskTracker, task_id: int = 0, project: str = "") -> None:
    if not hasattr(msg, "content") or not isinstance(msg.content, list):
        return

    def _push(kind: str, label: str, agent: str = "", duration: float = 0.0) -> None:
        """Record to tracker and write to the shared event store."""
        tracker.record(kind, label, agent=agent, duration=duration)
        if task_id:
            ev.add_event(task_id, project, kind, label, agent, tracker.elapsed(), duration)

    done_ev = tracker.agent_maybe_returned()
    if done_ev:
        color = AGENT_COLORS.get(done_ev.agent, "cyan")
        console.print(
            f"  {tracker.ts()} [bold {color}]✓ [{done_ev.agent}][/bold {color}] "
            f"[dim]finished in {done_ev.duration:.0f}s[/dim]"
        )
        _push("agent_done", f"[{done_ev.agent}] finished",
              agent=done_ev.agent, duration=done_ev.duration)

    for block in msg.content:
        btype = getattr(block, "type", None)
        ts = tracker.ts()
        if btype == "text":
            text = getattr(block, "text", "").strip()
            if not text:
                continue
            _push("narration", text[:120])
            console.print(f"\n{ts} [bold yellow]◆[/bold yellow] {text}")
        elif btype == "tool_use":
            name = getattr(block, "name", "?")
            inp  = getattr(block, "input", {}) or {}
            if name == "Agent":
                agent_name = inp.get("agent", "?")
                task_preview = str(inp.get("task", ""))[:80]
                color = AGENT_COLORS.get(agent_name, "cyan")
                tracker.agent_dispatched(agent_name)
                _push("agent_start", f"Delegating to [{agent_name}]", agent=agent_name)
                console.print(
                    f"\n{ts} [bold {color}]→ [{agent_name}][/bold {color}] {task_preview}",
                    highlight=False,
                )
            elif name in ("Read", "Glob", "Grep"):
                target = inp.get("file_path") or inp.get("pattern") or ""
                _push("action", f"{name}: {target}")
                console.print(f"  {ts} [dim]📂 {name}:[/dim] {target}")
            elif name in ("Write", "Edit"):
                target = inp.get("file_path", "?")
                _push("action", f"{name}: {target}")
                console.print(f"  {ts} [green dim]✏️  {name}:[/green dim] {target}")
            elif name == "Bash":
                cmd = str(inp.get("command", ""))[:60]
                _push("action", f"Bash: {cmd}")
                console.print(f"  {ts} [magenta dim]⚡ Bash:[/magenta dim] {cmd}")
            elif name == "WebSearch":
                q = inp.get("query", "")[:60]
                _push("action", f"Search: {q}")
                console.print(f"  {ts} [blue dim]🔍 Search:[/blue dim] {q}")
            elif name == "WebFetch":
                url = inp.get("url", "")[:60]
                _push("action", f"Fetch: {url}")
                console.print(f"  {ts} [blue dim]🌐 Fetch:[/blue dim] {url}")
            else:
                _push("action", name)
                console.print(f"  {ts} [dim]⚙  {name}[/dim]")


# ---------------------------------------------------------------------------
# Live ticker
# ---------------------------------------------------------------------------

async def _ticker(tracker: TaskTracker, stop: anyio.Event) -> None:
    while not stop.is_set():
        m, s = divmod(int(tracker.elapsed()), 60)
        sys.stderr.write(f"\r  ⏱  {m:02d}:{s:02d} elapsed   ")
        sys.stderr.flush()
        await anyio.sleep(1)
    sys.stderr.write("\r" + " " * 30 + "\r")
    sys.stderr.flush()


# ---------------------------------------------------------------------------
# Core submit
# ---------------------------------------------------------------------------

async def submit(
    project: Project,
    task: str,
    *,
    resume_id: str | None = None,
    max_turns: int = 60,
) -> tuple[str, str]:
    """Run a task against a project. Returns (result, session_id)."""
    project.init_memory()
    subagents = make_subagents(str(project.memory_dir))
    memory_ctx = project.load_memory_context()
    system_prompt = ORCHESTRATOR_SYSTEM_TEMPLATE.format(
        project_name=project.name,
        workspace=str(project.workspace),
        memory_dir=str(project.memory_dir),
        memory_context=memory_ctx,
    )

    # Header
    console.print(Rule(style="blue"))
    started_at = datetime.now().strftime("%H:%M:%S")
    console.print(Panel(
        Text(task, style="bold white"),
        title=f"[bold blue]{project.name}[/bold blue]  [dim]{started_at}[/dim]",
        border_style="blue",
    ))
    if resume_id:
        console.print(f"[dim]Resuming session {resume_id}[/dim]")
    console.print()

    base_opts = dict(
        model="claude-opus-4-6",
        cwd=str(project.workspace),
        system_prompt=system_prompt,
        allowed_tools=[
            "Agent", "Read", "Write", "Edit", "Bash",
            "Glob", "Grep", "WebSearch", "WebFetch", "AskUserQuestion",
        ],
        agents=subagents,
        max_turns=max_turns,
        permission_mode="acceptEdits",
        thinking={"type": "adaptive"},
    )
    opts = (
        ClaudeAgentOptions(resume=resume_id, **base_opts)
        if resume_id
        else ClaudeAgentOptions(**base_opts)
    )

    tracker = TaskTracker()
    result_text = ""
    session_id = resume_id or ""
    stop_ticker = anyio.Event()

    # Register task in the shared event store (read by dashboard)
    task_id = ev.task_start(project.name, task, session_id)

    try:
        async with anyio.create_task_group() as tg:
            tg.start_soon(_ticker, tracker, stop_ticker)
            async for msg in query(prompt=task, options=opts):
                if isinstance(msg, SystemMessage) and msg.subtype == "init":
                    session_id = msg.data.get("session_id", session_id)
                    console.print(f"[dim]Session: {session_id}[/dim]\n")
                elif isinstance(msg, ResultMessage):
                    result_text = msg.result
                    tracker.record("result", "Task complete")
                    ev.add_event(task_id, project.name, "result", "Task complete",
                                 elapsed=tracker.elapsed())
                else:
                    _render_message(msg, tracker, task_id=task_id, project=project.name)
            stop_ticker.set()
    except Exception:
        ev.task_error(task_id, "Unexpected error")
        raise

    total = tracker.elapsed()
    project.log_task(task, result_text, total, session_id)
    ev.task_finish(task_id, result_text, total, session_id)

    done_ev = tracker.agent_maybe_returned()
    if done_ev:
        color = AGENT_COLORS.get(done_ev.agent, "cyan")
        console.print(
            f"  {tracker.ts()} [bold {color}]✓ [{done_ev.agent}][/bold {color}] "
            f"[dim]finished in {done_ev.duration:.0f}s[/dim]"
        )
        ev.add_event(task_id, project.name, "agent_done",
                     f"[{done_ev.agent}] finished",
                     agent=done_ev.agent, elapsed=tracker.elapsed(),
                     duration=done_ev.duration)

    console.print()
    console.print(Panel(
        result_text or "(no result)",
        title="[bold green]Result[/bold green]",
        border_style="green",
    ))
    console.print()
    console.print(tracker.timeline_table(total))
    summary = tracker.agent_summary()
    if summary:
        console.print()
        console.print(summary)
    console.print(Rule(style="dim"))

    return result_text, session_id


# ---------------------------------------------------------------------------
# Project creation wizard
# ---------------------------------------------------------------------------

def _ask(prompt: str, default: str = "") -> str:
    shown = f"{prompt} [{default}]" if default else prompt
    val = console.input(f"[cyan]{shown}:[/cyan] ").strip()
    return val or default


def create_project_wizard() -> Project | None:
    """Interactive wizard to create a new project. Returns the created Project."""
    console.print(Panel(
        "Let's set up your new project.\n"
        "The hub will create a workspace directory and memory files for it.",
        title="[bold cyan]Create Project[/bold cyan]",
        border_style="cyan",
    ))

    name = _ask("Project name (slug, e.g. my-website)").lower().replace(" ", "-")
    if not name:
        console.print("[red]Cancelled.[/red]")
        return None
    if Project.exists(name):
        console.print(f"[red]Project '{name}' already exists.[/red]")
        return None

    description = _ask("One-line description", "A new project")
    default_workspace = str(PROJECTS_DIR / name / "workspace")
    workspace_str = _ask("Workspace path (where files live)", default_workspace)
    tech_raw = _ask("Tech stack (comma-separated, e.g. Next.js, TypeScript, Tailwind)", "")
    tech_stack = [t.strip() for t in tech_raw.split(",") if t.strip()]
    tags_raw = _ask("Tags (comma-separated, e.g. web, frontend)", "")
    tags = [t.strip() for t in tags_raw.split(",") if t.strip()]

    project = Project(
        name=name,
        description=description,
        workspace=Path(workspace_str),
        tech_stack=tech_stack,
        tags=tags,
    )
    project.save()
    project.init_memory()

    console.print(f"\n[bold green]✓ Project '{name}' created![/bold green]")
    console.print(f"  Workspace: {project.workspace}")
    console.print(f"  Memory:    {project.memory_dir}")
    console.print(f"\n[dim]Tip: ask the orchestrator to scaffold the project now.[/dim]")
    return project


# ---------------------------------------------------------------------------
# REPL
# ---------------------------------------------------------------------------

def _projects_table() -> Table:
    names = Project.list_all()
    tbl = Table(title="Projects", border_style="dim", show_lines=False)
    tbl.add_column("Name",        style="bold cyan", width=20)
    tbl.add_column("Description", style="",          min_width=30)
    tbl.add_column("Tech Stack",  style="dim",        min_width=20)
    tbl.add_column("Workspace",   style="dim",        min_width=20)
    for n in names:
        try:
            p = Project.load(n)
            tbl.add_row(
                n,
                p.description[:50],
                ", ".join(p.tech_stack[:3]),
                str(p.workspace),
            )
        except Exception:
            tbl.add_row(n, "[red]corrupt config[/red]", "", "")
    return tbl


BANNER = """
[bold blue]╔══════════════════════════════════════════════════════════╗
║               Agent Hub  —  master of all tasks          ║
╚══════════════════════════════════════════════════════════╝[/bold blue]

[dim]Commands:[/dim]
  [cyan]<any task>[/cyan]        run a task in the active project
  [cyan]projects[/cyan]          list all projects
  [cyan]switch <name>[/cyan]     switch active project
  [cyan]create[/cyan]            create a new project (wizard)
  [cyan]memory[/cyan]            show active project memory
  [cyan]resume[/cyan]            continue last session
  [cyan]new[/cyan]               start fresh session
  [cyan]quit[/cyan]              exit
"""


async def repl(project: Project, start_resume_id: str | None = None) -> None:
    console.print(BANNER)
    console.print(f"[dim]Active project:[/dim] [bold cyan]{project.name}[/bold cyan]  "
                  f"[dim]({project.description})[/dim]\n")

    resume_id = start_resume_id

    while True:
        try:
            raw = console.input(
                f"\n[bold green][{project.name}][/bold green] [bold green]>[/bold green] "
            ).strip()
        except (EOFError, KeyboardInterrupt):
            console.print("\n[dim]Goodbye.[/dim]")
            break

        if not raw:
            continue

        cmd_lower = raw.lower()

        if cmd_lower in ("quit", "exit", "q"):
            console.print("[dim]Goodbye.[/dim]")
            break

        elif cmd_lower == "projects":
            console.print(_projects_table())

        elif cmd_lower.startswith("switch "):
            target = raw[7:].strip()
            if not Project.exists(target):
                console.print(f"[red]Project '{target}' not found. Run 'projects' to list.[/red]")
            else:
                project = Project.load(target)
                resume_id = None
                console.print(f"[bold cyan]Switched to '{project.name}'[/bold cyan] — {project.description}")

        elif cmd_lower == "create":
            new_proj = create_project_wizard()
            if new_proj:
                switch = console.input(
                    f"[cyan]Switch to '{new_proj.name}' now? [Y/n]:[/cyan] "
                ).strip().lower()
                if switch != "n":
                    project = new_proj
                    resume_id = None

        elif cmd_lower == "memory":
            ctx = project.load_memory_context()
            console.print(Panel(
                ctx, title=f"[blue]{project.name} — Memory[/blue]", border_style="blue"
            ))

        elif cmd_lower == "resume":
            console.print(
                f"[dim]Will resume session {resume_id}[/dim]" if resume_id
                else "[yellow]No previous session.[/yellow]"
            )

        elif cmd_lower == "new":
            resume_id = None
            console.print("[dim]Started fresh session.[/dim]")

        else:
            _, session_id = await submit(project, raw, resume_id=resume_id)
            resume_id = session_id


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

async def main() -> None:
    args = sys.argv[1:]
    resume_id: str | None = None
    project_name: str | None = None

    # Parse flags
    for flag in ("--resume", "--project"):
        if flag in args:
            idx = args.index(flag)
            if idx + 1 < len(args):
                val = args[idx + 1]
                if flag == "--resume":
                    resume_id = val
                else:
                    project_name = val
                args = args[:idx] + args[idx + 2:]

    # Resolve project
    if project_name:
        if not Project.exists(project_name):
            console.print(f"[red]Project '{project_name}' not found.[/red]")
            console.print(f"Run without --project to create one interactively.")
            sys.exit(1)
        project = Project.load(project_name)
    else:
        all_projects = Project.list_all()
        if not all_projects:
            console.print("[yellow]No projects yet. Let's create one.[/yellow]\n")
            project = create_project_wizard()
            if not project:
                sys.exit(0)
        elif len(all_projects) == 1:
            project = Project.load(all_projects[0])
        else:
            console.print(_projects_table())
            chosen = _ask(f"Which project?", all_projects[0])
            if not Project.exists(chosen):
                console.print(f"[red]Unknown project '{chosen}'[/red]")
                sys.exit(1)
            project = Project.load(chosen)

    task_args = args
    if task_args:
        await submit(project, " ".join(task_args), resume_id=resume_id)
    else:
        await repl(project, start_resume_id=resume_id)


if __name__ == "__main__":
    anyio.run(main)
