# Agent Hub — Claude Memory File

This file gives Claude full context for working in this repo. Read this at the start of every session.

---

## What This Project Is

**Agent Hub** is an AI-powered project management and orchestration system. It acts as a central command center for managing multiple software/business projects, each with its own memory, using 7 specialized AI subagents coordinated by a Claude orchestrator.

Think of it as: you describe a task → orchestrator breaks it down → dispatches to specialist agents → streams results live in a web dashboard or REPL.

---

## Repository Structure

```
/home/user/agent-hub/
├── hub.py                   # Main entry point — REPL, CLI, orchestrator runner
├── universal_agent.py       # 7 subagent definitions + orchestrator system prompt
├── project.py               # Project lifecycle: create, load, memory init, task logging
├── dashboard.py             # FastAPI web server with SSE live feed
├── events.py                # SQLite event store (tasks, events, messages tables)
├── run_agent.py             # Thin shortcut: runs hub.py main()
├── start.sh                 # Setup script: venv, deps, starts dashboard on :8080
├── requirements.txt         # Python dependencies
├── HUB.md                   # User-facing documentation
├── dashboard/
│   └── index.html           # Web UI (Tailwind CSS + Alpine.js, no build step)
├── memory/                  # Root-level shared memory files (fallback)
│   ├── project.md
│   ├── knowledge.md
│   ├── marketing.md
│   └── tasks.md
└── projects/                # Per-project storage
    ├── global_knowledge.md  # Cross-project shared knowledge
    ├── northstar/           # Example: Solana DEX arbitrage bot
    │   ├── project.json
    │   └── memory/          # project.md, knowledge.md, marketing.md, sales.md, tasks.md
    └── my-website/          # Example: Marketing site for Northstar
        ├── project.json
        └── memory/
```

---

## The 7 Specialist Agents

Defined in `universal_agent.py` as `AgentDefinition` objects, injected with the project's memory directory path:

| Agent | Role | Tools |
|-------|------|-------|
| **coder** | Write, debug, refactor, test code | Read, Write, Edit, Bash, Glob, Grep |
| **researcher** | Web search, fact-checking, documentation | WebSearch, WebFetch, Read, Write |
| **analyst** | Data analysis, statistics, structured reasoning | Read, Write, Bash, Glob, Grep |
| **marketer** | Content, social strategy, SEO, copywriting | Read, Write, Edit, WebSearch, WebFetch, Glob |
| **designer** | UI/UX, front-end code, CSS/Tailwind | Read, Write, Edit, Bash, Glob, Grep |
| **sales** | Outreach, pipeline, pitches, proposals | Read, Write, Edit, WebSearch, WebFetch, Glob |
| **file-ops** | File organization, bulk transforms, cleanup | Read, Write, Edit, Glob, Grep, Bash |

Each agent is instructed to:
1. Read `{memory_dir}/project.md` and `{memory_dir}/knowledge.md` before starting
2. Complete the task
3. Append learnings to `knowledge.md` under the appropriate section
4. Update other relevant memory files

---

## Architecture

### Data Flow
```
User input (REPL or web UI)
  → hub.py submit()
  → Builds orchestrator prompt with project memory context
  → Claude Agent SDK query() streams execution
  → Orchestrator delegates to subagents via Agent tool
  → Events written to SQLite (hub_events.db)
  → Dashboard SSE stream pushes updates to browser every 400ms
```

### Key Patterns
- **Orchestrator model**: `claude-opus-4-6`
- **Memory-driven agents**: Agents read/write markdown files for shared context
- **Project isolation**: Each project has separate workspace + memory dir
- **Inbox pattern**: Dashboard writes `inbox.md` mid-task; orchestrator polls it for steering
- **Event sourcing**: Every agent delegation tracked with timing in SQLite
- **WAL mode SQLite**: Dashboard reads concurrently while hub.py writes

### Memory File Purposes
| File | Contents |
|------|----------|
| `project.md` | Description, tech stack, goals, key files |
| `knowledge.md` | Architecture insights, research findings, performance data, open questions |
| `marketing.md` | Brand voice, target audiences, channels, content pillars |
| `sales.md` | ICP, pricing, pipeline table, objection handling, win/loss log |
| `tasks.md` | Auto-logged task history (timestamp, duration, result) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Python 3.10+ |
| Orchestration | Claude Agent SDK (`claude-agent-sdk`) + `anthropic` |
| CLI/TUI | `rich`, `anyio` |
| Web framework | FastAPI |
| Web server | Uvicorn |
| Frontend | Tailwind CSS 4, Alpine.js 3 (CDN, no build step) |
| Database | SQLite with WAL mode |
| Async | `anyio`, `asyncio` |
| Optional (northstar) | `solana`, `solders` for Solana blockchain |

---

## How to Run

```bash
# Dashboard (recommended, opens http://localhost:8080)
bash start.sh

# Interactive REPL
python hub.py

# REPL with specific project
python hub.py --project northstar

# One-off CLI task
python hub.py --project northstar "analyze trading logs"

# Resume a session
python hub.py --project northstar --resume <session-id> "continue from where we left off"
```

### REPL Commands
- `projects` — list all projects
- `switch <name>` — change active project
- `create` — project creation wizard
- `memory` — view current project memory
- `resume` — resume a previous session
- `new` — start fresh session
- `quit` — exit

---

## Active Projects

### northstar
- **What**: Solana DEX arbitrage bot
- **Workspace**: `/home/user/northstar`
- **Tech**: Python, Solana, FastAPI, Rich
- **Status**: Live with circuit breakers; 0.6% min spread, $500 max trade size
- **Monitors**: SOL/USDC across Raydium, Orca, Jupiter

### my-website
- **What**: Marketing website for Northstar
- **Workspace**: `/home/user/northstar/projects/my-website/workspace`
- **Tech**: Next.js, TypeScript, Tailwind CSS

---

## Development Guidelines

### Adding a New Agent
1. Edit `universal_agent.py` — add an `AgentDefinition` to `make_subagents()`
2. Update the orchestrator prompt template `ORCHESTRATOR_SYSTEM_TEMPLATE` to mention the new agent
3. No other changes needed — the Agent tool delegation is dynamic

### Adding a New Project
```bash
python hub.py
> create
```
Fills in: name, description, workspace path, tech stack, tags.
Creates `projects/<name>/project.json` and `projects/<name>/memory/` with template files.

### Adding API Endpoints
Edit `dashboard.py`. Routes follow REST convention:
- `GET /api/projects` — list projects
- `GET /api/tasks` — task history
- `GET /api/live` — SSE stream
- `POST /api/submit` — submit task
- `POST /api/message` — mid-task message

### Frontend Changes
Edit `dashboard/index.html` directly — no build step, uses CDN assets.

---

## Key Files to Read First for Any Task

| Task type | Files to read |
|-----------|--------------|
| Agent behavior changes | `universal_agent.py` |
| Orchestration / task flow | `hub.py` |
| Web UI changes | `dashboard/index.html`, `dashboard.py` |
| Data persistence | `events.py` |
| Project memory system | `project.py` |
| New project setup | `projects/<name>/memory/project.md` |

---

## Branch

Active development branch: `claude/github-repo-selection-r9dFu`
Remote: `abundanceagent/agent-hub`
