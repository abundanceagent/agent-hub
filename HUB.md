# Agent Hub

A general-purpose AI project management system.
One command centre, any number of projects, seven specialist agents.

## Quick Start (Dashboard — opens in your browser)

```bash
bash start.sh
```

That's it. The script installs dependencies, starts the dashboard server, and opens `http://localhost:8080` in your browser automatically.

**To run a task from the terminal:**

```bash
pip install claude-agent-sdk anthropic rich anyio fastapi "uvicorn[standard]"
python hub.py          # opens the interactive hub
```

## How It Works

The hub manages **projects**. Each project has:
- A **workspace** — the directory where files live
- A **memory/** directory — shared knowledge all agents read and write
- A **task log** — every completed task recorded with duration

When you run a task, the **Orchestrator** reads the project memory,
breaks the work into steps, delegates to the right specialist agents,
and reports back to you with live timestamps.

## Agents

| Agent | What it does |
|-------|-------------|
| `coder` | Write, debug, refactor, test code |
| `researcher` | Web search, fact-checking, competitor analysis |
| `analyst` | Data analysis, reporting, structured reasoning |
| `marketer` | Content, social strategy, SEO, community |
| `designer` | UI/UX, front-end code, Tailwind, layouts |
| `sales` | Outreach, pipeline, pitches, proposals |
| `file-ops` | File organisation, bulk transforms |

## Usage

```bash
# Interactive REPL
python hub.py

# Target a specific project
python hub.py --project my-saas

# Run a one-off task
python hub.py --project my-saas "write the landing page copy"

# Resume a previous session
python hub.py --project my-saas --resume <session-id> "follow up on that"
```

## REPL Commands

| Command | What it does |
|---------|-------------|
| `<any task>` | Run a task in the active project |
| `projects` | List all projects |
| `switch <name>` | Switch active project |
| `create` | Create a new project (wizard) |
| `memory` | Show active project memory |
| `resume` | Continue last session |
| `new` | Start fresh session |
| `quit` | Exit |

## Project Memory Files

Every project gets these files in `projects/<name>/memory/`:

| File | Purpose |
|------|---------|
| `project.md` | What the project is, goals, tech stack |
| `knowledge.md` | Accumulated agent learnings |
| `marketing.md` | Brand voice, audiences, channels |
| `sales.md` | ICP, pipeline, objection handling |
| `tasks.md` | Auto-logged task history |
| `marketing/` | Marketing content output |
| `sales/` | Sales documents output |

## Directory Structure

```
hub.py                  Entry point
project.py              Project management
universal_agent.py      Agent definitions
projects/
  global_knowledge.md   Cross-project shared context
  <project-name>/
    project.json        Config (workspace path, tech stack, tags)
    memory/             All agent knowledge for this project
      project.md
      knowledge.md
      marketing.md
      sales.md
      tasks.md
      marketing/        Content saved by marketer agent
      sales/            Docs saved by sales agent
  <project-name>/
    workspace/          Project files (code, assets, etc.)
```

## Creating a New Project

```
> create

Project name: my-saas
Description: B2B SaaS for managing invoices
Workspace path: [default]
Tech stack: Next.js, TypeScript, Supabase, Stripe
Tags: saas, b2b, finance

✓ Project 'my-saas' created!
Switch to 'my-saas' now? [Y/n]: Y

[my-saas] > scaffold the project and build the landing page
```

The orchestrator will:
1. Read `memory/project.md` for context
2. Ask the `coder` to scaffold the Next.js project
3. Ask the `designer` to build the landing page
4. Ask the `marketer` to write the copy
5. Save everything to the workspace and update memory
