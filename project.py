"""
Project management for the Northstar Hub.

Each project has:
  - A name (used as directory slug)
  - A workspace path (where agent file operations happen)
  - A memory/ directory (project-specific knowledge base)
  - A project.json config (description, tech stack, tags)
"""

import json
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

PROJECTS_DIR = Path(__file__).parent / "projects"

DEFAULT_MEMORY_FILES = {
    "project.md": """\
# {name} — Project Context

## What It Is
{description}

## Tech Stack
{tech_stack}

## Goals
[To be filled in]

## Key Files
[To be filled in]
""",
    "knowledge.md": """\
# Agent Knowledge Base — {name}

Agents append learnings here after every task. Read this before starting work.

## Architecture Insights

## Research Findings

## Performance Data

## Open Questions
""",
    "marketing.md": """\
# Marketing Context — {name}

## Brand Voice

## Target Audiences

## Channels

## Content Pillars

## Campaigns & History
""",
    "tasks.md": "# Task Log — {name}\n\n---\n",
    "sales.md": """\
# Sales Playbook — {name}

## Ideal Customer Profile (ICP)
[Who is the perfect customer? Be specific: role, company size, pain points, budget.]

## What We're Selling
{description}

## Pricing & Offer
[Tiers, pricing, guarantees — to be defined]

## Pipeline
| Prospect | Company | Stage | Last Touch | Next Action |
|----------|---------|-------|------------|-------------|

## Outreach Templates
[Saved by the sales agent after each task]

## Objection Handling
| Objection | Response |
|-----------|----------|

## Win / Loss Log
[What worked, what didn't — updated after every deal]

## Key Metrics to Track
- Outreach sent
- Reply rate
- Meetings booked
- Conversion rate
- Average deal size
""",
}


@dataclass
class Project:
    name: str
    description: str
    workspace: Path
    tech_stack: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    created: str = field(default_factory=lambda: str(date.today()))

    # ------------------------------------------------------------------ paths

    @property
    def dir(self) -> Path:
        return PROJECTS_DIR / self.name

    @property
    def memory_dir(self) -> Path:
        return self.dir / "memory"

    # ------------------------------------------------------------------ I/O

    @classmethod
    def load(cls, name: str) -> "Project":
        cfg = json.loads((PROJECTS_DIR / name / "project.json").read_text())
        return cls(
            name=name,
            description=cfg.get("description", ""),
            workspace=Path(cfg.get("workspace", str(PROJECTS_DIR / name / "workspace"))),
            tech_stack=cfg.get("tech_stack", []),
            tags=cfg.get("tags", []),
            created=cfg.get("created", ""),
        )

    def save(self) -> None:
        self.dir.mkdir(parents=True, exist_ok=True)
        cfg = {
            "description": self.description,
            "workspace": str(self.workspace),
            "tech_stack": self.tech_stack,
            "tags": self.tags,
            "created": self.created,
        }
        (self.dir / "project.json").write_text(json.dumps(cfg, indent=2))

    # ------------------------------------------------------------------ memory

    def init_memory(self) -> None:
        """Create memory/ directory and default markdown files."""
        self.memory_dir.mkdir(parents=True, exist_ok=True)
        self.workspace.mkdir(parents=True, exist_ok=True)
        tech = "\n".join(f"- {t}" for t in self.tech_stack) if self.tech_stack else "- (not specified)"
        for fname, template in DEFAULT_MEMORY_FILES.items():
            p = self.memory_dir / fname
            if not p.exists():
                p.write_text(template.format(
                    name=self.name,
                    description=self.description,
                    tech_stack=tech,
                ))

    def load_memory_context(self) -> str:
        """Return all core memory files as one context block."""
        files = ["project.md", "knowledge.md", "marketing.md", "sales.md"]
        sections = []
        for fname in files:
            p = self.memory_dir / fname
            if p.exists():
                text = p.read_text().strip()
                if text:
                    sections.append(f"### {fname}\n{text}")
        return "\n\n".join(sections) if sections else "(no memory yet)"

    def log_task(self, task: str, result: str, duration: float, session_id: str = "") -> None:
        from datetime import datetime
        p = self.memory_dir / "tasks.md"
        m, s = divmod(int(duration), 60)
        preview = result[:300].replace("\n", " ") + ("…" if len(result) > 300 else "")
        ts = datetime.now().strftime("%Y-%m-%d %H:%M")
        entry = (
            f"\n**{ts}** | {m}m {s}s | `{session_id}`\n"
            f"**Task:** {task}\n"
            f"**Result:** {preview}\n\n---\n"
        )
        with p.open("a") as f:
            f.write(entry)

    # ------------------------------------------------------------------ listing

    @staticmethod
    def list_all() -> list[str]:
        if not PROJECTS_DIR.exists():
            return []
        return sorted(
            d.name for d in PROJECTS_DIR.iterdir()
            if d.is_dir() and (d / "project.json").exists()
        )

    @staticmethod
    def exists(name: str) -> bool:
        return (PROJECTS_DIR / name / "project.json").exists()
